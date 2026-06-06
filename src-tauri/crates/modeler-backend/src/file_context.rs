// Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
// under one or more contributor license agreements. See the NOTICE file
// distributed with this work for additional information regarding copyright
// ownership.
//
// Camunda licenses this file to you under the MIT; you may not use this file
// except in compliance with the MIT License.

//! File-context orchestrator, a faithful port of
//! `app/lib/file-context/file-context.js` plus the renderer IPC glue in
//! `app/lib/index.js` (the `file-context:*` handlers and the
//! `file-context:changed` push).
//!
//! Wires the Phase-3 [`Watcher`](crate::watcher) to the Phase-4
//! [`Indexer`](crate::indexer): watcher add/change/remove events drive the
//! indexer, and every indexer mutation re-pushes the FULL current item list
//! (`[{ file, metadata }, ...]`) to the renderer via the [`ChangedSink`] — the
//! same behavior as `onIndexerUpdated` in `index.js`, which always sends
//! `indexer.getItems()` on `indexer:updated`/`indexer:removed`.
//!
//! ## Concurrency
//!
//! The indexer is shared (`Arc<Mutex<Indexer>>`) between the public API (called
//! from the Tauri IPC thread) and the watcher sink closure (called inline on the
//! `add_root` scan thread AND on the notify worker thread). Each operation does
//! mutate -> snapshot -> emit ALL while holding the indexer lock, so every
//! `changed` push reflects a consistent snapshot and pushes are totally ordered
//! by mutex-acquisition order — no thread can deliver a stale full-state payload
//! after a newer one. The `changed` sink never re-enters the indexer (it only
//! emits a Tauri event), so holding the lock across it is deadlock-free. A
//! `closed` flag makes the sink ignore late watcher events after [`close`].
//!
//! [`close`]: FileContext::close

use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use serde_json::{json, Value};

use crate::indexer::Indexer;
use crate::watcher::{
    get_file_extension, to_file_url, Watcher, WatcherEvent, DEFAULT_EXTENSIONS,
};

/// Debounce window for the watcher's aggregate `changed` signal, mirroring the
/// 300 ms used by `app/lib/file-context/watcher.js`.
const WATCHER_DEBOUNCE: Duration = Duration::from_millis(300);

/// Sink for the renderer-facing `file-context:changed` push. Receives the full
/// item list as `[{ file, metadata }, ...]`. In production the Tauri layer
/// emits a `file-context:changed` event; tests collect into a vector.
pub type ChangedSink = Arc<dyn Fn(Vec<Value>) + Send + Sync>;

/// Drives the shared [`Indexer`] and pushes the full item list on every
/// mutation. Shared (via `Clone`) between the public [`FileContext`] API and the
/// watcher sink closure so both observe the same mutate -> snapshot -> emit
/// discipline.
#[derive(Clone)]
struct Notifier {
    indexer: Arc<Mutex<Indexer>>,
    changed: ChangedSink,
    closed: Arc<AtomicBool>,
}

impl Notifier {
    /// Emit the full current item list (`[{ file, metadata }, ...]`), mirroring
    /// `onIndexerUpdated`. Must be called while holding the indexer lock so the
    /// snapshot is consistent and pushes stay ordered.
    fn emit(&self, indexer: &Indexer) {
        let items = indexer
            .get_items()
            .iter()
            .map(|item| json!({ "file": item.file, "metadata": item.metadata }))
            .collect();

        (self.changed)(items);
    }

    /// `watcher:add` / `fileOpened` / `fileUpdated`: (re-)index and push. The
    /// indexer always emits `indexer:updated`, so we always push.
    fn add(&self, uri: &str, processor: Option<String>) {
        if self.closed.load(Ordering::SeqCst) {
            return;
        }

        let mut indexer = self.indexer.lock().unwrap();

        indexer.add(uri, processor);

        self.emit(&indexer);
    }

    /// `watcher:remove`: remove and push, but only when an item was actually
    /// removed (JS `Indexer.remove` returns early and emits nothing for an
    /// unknown uri).
    fn remove(&self, uri: &str) {
        if self.closed.load(Ordering::SeqCst) {
            return;
        }

        let mut indexer = self.indexer.lock().unwrap();

        if indexer.get(uri).is_none() {
            return;
        }

        indexer.remove(uri);

        self.emit(&indexer);
    }

    /// `file-context:file-closed`: remove the file unless it belongs to a
    /// tracked process application (some indexed `.process-application` file
    /// whose directory is a string-prefix ancestor of the closed file's
    /// directory), mirroring the `index.js` `file-context:file-closed` handler.
    fn file_closed(&self, file_path: &str) {
        if self.closed.load(Ordering::SeqCst) {
            return;
        }

        let mut indexer = self.indexer.lock().unwrap();

        let target_dir = dirname(file_path);

        let part_of_process_application = indexer.get_items().iter().any(|item| {
            let item_path = item.file.get("path").and_then(Value::as_str).unwrap_or("");

            is_process_application_file(item_path)
                && target_dir.starts_with(&dirname(item_path))
        });

        if part_of_process_application {
            return;
        }

        let uri = to_file_url(file_path);

        if indexer.get(&uri).is_none() {
            return;
        }

        indexer.remove(&uri);

        self.emit(&indexer);
    }
}

/// File context that indexes and watches files, exposing the renderer-facing
/// `file-context:*` operations. A faithful port of `FileContext` + the
/// `index.js` IPC glue.
pub struct FileContext {
    notifier: Notifier,
    watcher: Option<Watcher>,
    closed: Arc<AtomicBool>,
}

impl FileContext {
    /// Build a watching file context that pushes the full item list to
    /// `changed` on every indexer mutation.
    pub fn new(changed: ChangedSink) -> Self {
        let closed = Arc::new(AtomicBool::new(false));

        let notifier = Notifier {
            indexer: Arc::new(Mutex::new(Indexer::new())),
            changed,
            closed: closed.clone(),
        };

        let sink_notifier = notifier.clone();
        let sink: crate::watcher::Sink = Arc::new(move |event| match event {
            WatcherEvent::Add(uri) => sink_notifier.add(&uri, None),
            WatcherEvent::Change(uri) => sink_notifier.add(&uri, None),
            WatcherEvent::Remove(uri) => sink_notifier.remove(&uri),
            WatcherEvent::Ready | WatcherEvent::Changed => {},
        });

        let extensions = DEFAULT_EXTENSIONS.iter().map(|s| s.to_string()).collect();
        let watcher = Watcher::new(extensions, WATCHER_DEBOUNCE, sink);

        Self { notifier, watcher: Some(watcher), closed }
    }

    /// Add a watched root (`file-context:add-root`). The watcher scans the
    /// directory and drives the indexer (and the `changed` push) for each match.
    pub fn add_root(&mut self, uri: &str) {
        if let Some(watcher) = self.watcher.as_mut() {
            watcher.add_root(uri);
        }
    }

    /// Remove a watched root (`file-context:remove-root`). Mirrors JS
    /// `removeRoot`: stops watching but leaves indexed items intact and does not
    /// push.
    pub fn remove_root(&mut self, uri: &str) {
        if let Some(watcher) = self.watcher.as_mut() {
            watcher.remove_root(uri);
        }
    }

    /// Handle a file being opened (`file-context:file-opened`): index it, then,
    /// if it lives in a process application, add that application's directory as
    /// a root, mirroring the `index.js` handler.
    pub fn file_opened(&mut self, file_path: &str, processor: Option<String>) {
        self.notifier.add(&to_file_url(file_path), processor);

        if let Some(process_application_file) = find_process_application_file(file_path) {
            self.add_root(&dirname(&process_application_file));
        }
    }

    /// Handle a file being updated (`file-context:file-updated`): re-index it.
    pub fn file_updated(&mut self, file_path: &str, processor: Option<String>) {
        self.notifier.add(&to_file_url(file_path), processor);
    }

    /// Handle a file being closed (`file-context:file-closed`): remove it unless
    /// it is part of a tracked process application.
    pub fn file_closed(&mut self, file_path: &str) {
        self.notifier.file_closed(file_path);
    }

    /// Stop watching and ignore any late watcher events, mirroring `close`.
    pub fn close(&mut self) {
        self.closed.store(true, Ordering::SeqCst);
        self.watcher.take();
    }
}

/// `findProcessApplicationFile`: ascend from the file's directory toward the
/// filesystem root, returning the path of the first `.process-application` file
/// found, or `None`. Mirrors the JS helper exactly, including aborting the
/// search (returning `None`) if a directory cannot be read.
fn find_process_application_file(file_path: &str) -> Option<String> {
    let mut dir = Path::new(file_path).parent()?.to_path_buf();

    // JS: `while (dirName !== path.dirname(dirName))` — process every ancestor
    // except the filesystem root.
    while dir.parent().is_some_and(|parent| parent != dir) {
        let entries = match std::fs::read_dir(&dir) {
            Ok(entries) => entries,
            Err(_) => return None,
        };

        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().into_owned();

            if get_file_extension(&name) == ".process-application" {
                return Some(dir.join(&name).to_string_lossy().into_owned());
            }
        }

        dir = dir.parent().unwrap().to_path_buf();
    }

    None
}

/// `isProcessApplicationFile`: a `.process-application` file.
fn is_process_application_file(file_path: &str) -> bool {
    get_file_extension(file_path) == ".process-application"
}

/// `path.dirname` as a raw string, matching the string-prefix comparison the JS
/// `file-context:file-closed` handler performs (intentionally not normalized).
fn dirname(file_path: &str) -> String {
    Path::new(file_path)
        .parent()
        .map(|parent| parent.to_string_lossy().into_owned())
        .unwrap_or_default()
}
