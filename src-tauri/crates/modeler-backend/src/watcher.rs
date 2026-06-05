// Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
// under one or more contributor license agreements. See the NOTICE file
// distributed with this work for additional information regarding copyright
// ownership.
//
// Camunda licenses this file to you under the MIT; you may not use this file
// except in compliance with the MIT License.

//! File-context watcher, a faithful port of `app/lib/file-context/watcher.js`.
//!
//! Mirrors the chokidar-based `Watcher`, swapping chokidar for the `notify`
//! crate. It watches root directories recursively and reports the same event
//! contract the indexer consumes:
//!   - [`WatcherEvent::Add`] / [`WatcherEvent::Change`] / [`WatcherEvent::Remove`]
//!     carry a `file://` URL, filtered to the processors' extensions
//!     (`.bpmn`, `.dmn`, `.form`, `.process-application`, `.rpa`),
//!   - [`WatcherEvent::Ready`] is emitted once a root's initial scan completes,
//!   - [`WatcherEvent::Changed`] is a single, debounced (300 ms) aggregate
//!     signal coalescing a burst of changes (chokidar's `_changed` timer).
//!
//! Faithfulness notes / deliberate divergences from chokidar:
//!   - `notify` does NOT replay pre-existing files, so [`Watcher::add_root`]
//!     performs its own recursive initial scan (emitting `Add` for each match)
//!     AFTER starting the watch, so no change is missed in the gap; a duplicate
//!     `Add` is harmless because the indexer is idempotent by URI.
//!   - `node_modules`/`.git` are skipped case-insensitively by path component
//!     (the chokidar `ignored` regex), and symlinked directories are not
//!     traversed during the scan (`followSymlinks: false`).
//!   - chokidar's atomic-save coalescing (`atomic: 300`) is NOT mirrored
//!     per-file; an editor's write-replace may surface as `Remove` + `Add`
//!     rather than a single `Change`. The indexer reconciles by URI, so this is
//!     eventually consistent (a documented Phase-3 scope cut).

use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::sync::mpsc::{self, Receiver, Sender};
use std::sync::{Arc, Mutex};
use std::thread::{self, JoinHandle};
use std::time::Duration;

use notify::event::{EventKind, ModifyKind, RemoveKind, RenameMode};
use notify::{RecommendedWatcher, RecursiveMode, Watcher as _};

/// The processors' file extensions, mirroring `processors/*.js`.
pub const DEFAULT_EXTENSIONS: [&str; 5] =
    [".bpmn", ".dmn", ".form", ".process-application", ".rpa"];

/// chokidar's `_changed` debounce window.
pub const DEFAULT_DEBOUNCE: Duration = Duration::from_millis(300);

/// An event delivered to the sink, mirroring the `watcher:*` events.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WatcherEvent {
    /// A matching file appeared (initial scan or live create). Carries a URL.
    Add(String),
    /// A matching file's contents changed. Carries a URL.
    Change(String),
    /// A tracked file was removed. Carries a URL.
    Remove(String),
    /// A root's initial scan finished.
    Ready,
    /// Debounced aggregate "something changed" signal.
    Changed,
}

/// A thread-safe sink for [`WatcherEvent`]s (the indexer/event bus in
/// production; a collecting closure in tests).
pub type Sink = Arc<dyn Fn(WatcherEvent) + Send + Sync>;

/// Mutable state shared between the public API, the notify worker and the
/// initial scan. Only ever locked to read/mutate `roots`/`files` — never while
/// emitting to the sink or walking the filesystem.
struct State {
    roots: Vec<PathBuf>,
    files: HashSet<PathBuf>,
}

/// Watches root directories and reports file add/change/remove plus a debounced
/// `changed`, a port of `app/lib/file-context/watcher.js`.
pub struct Watcher {
    state: Arc<Mutex<State>>,
    extensions: Arc<Vec<String>>,
    sink: Sink,
    debounce_tx: Option<Sender<()>>,
    notify: Option<RecommendedWatcher>,
    worker: Option<JoinHandle<()>>,
    debouncer: Option<JoinHandle<()>>,
}

impl Watcher {
    /// Build a watcher reporting to `sink`, recognizing `extensions` (each like
    /// `".bpmn"`), and coalescing change bursts over `debounce`.
    pub fn new(extensions: Vec<String>, debounce: Duration, sink: Sink) -> Self {
        let state = Arc::new(Mutex::new(State {
            roots: Vec::new(),
            files: HashSet::new(),
        }));

        let extensions = Arc::new(extensions);

        // debounce thread: each ping resets a `debounce` timer; on timeout it
        // emits a single `Changed`, mirroring clearTimeout/setTimeout(300).
        let (debounce_tx, debounce_rx) = mpsc::channel::<()>();
        let debouncer = spawn_debouncer(debounce_rx, debounce, sink.clone());

        // notify worker: drains raw fs events and maps them to WatcherEvents.
        let (event_tx, event_rx) = mpsc::channel::<notify::Result<notify::Event>>();
        let notify = notify::recommended_watcher(move |res| {
            // a closed receiver only happens during shutdown; ignore the error
            let _ = event_tx.send(res);
        })
        .ok();

        let worker = spawn_worker(
            event_rx,
            state.clone(),
            extensions.clone(),
            sink.clone(),
            debounce_tx.clone(),
        );

        Watcher {
            state,
            extensions,
            sink,
            debounce_tx: Some(debounce_tx),
            notify,
            worker: Some(worker),
            debouncer: Some(debouncer),
        }
    }

    /// Add a watched root directory (idempotent), mirroring `addRoot`. Starts
    /// the recursive watch first, then performs the initial scan (emitting
    /// `Add` for each pre-existing match), then emits `Ready`.
    pub fn add_root(&mut self, uri: &str) {
        let path = to_file_path(uri);

        // canonicalize so the roots/files we track match the (possibly
        // symlink-resolved) paths the OS reports back through notify
        let path = std::fs::canonicalize(&path).unwrap_or(path);

        {
            let mut state = self.state.lock().unwrap();
            if state.roots.iter().any(|root| root == &path) {
                return;
            }
            state.roots.push(path.clone());
        }

        if let Some(notify) = self.notify.as_mut() {
            // watch BEFORE scanning so no live change is lost in the gap
            let _ = notify.watch(&path, RecursiveMode::Recursive);
        }

        self.initial_scan(&path);

        self.emit(WatcherEvent::Ready);
    }

    /// Remove a watched root (idempotent), mirroring `removeRoot`. The tracked
    /// files set is intentionally left intact (as in the JS).
    pub fn remove_root(&mut self, uri: &str) {
        let path = to_file_path(uri);
        let path = std::fs::canonicalize(&path).unwrap_or(path);

        {
            let mut state = self.state.lock().unwrap();
            if !state.roots.iter().any(|root| root == &path) {
                return;
            }
            state.roots.retain(|root| root != &path);
        }

        if let Some(notify) = self.notify.as_mut() {
            let _ = notify.unwatch(&path);
        }
    }

    /// The currently tracked file paths, mirroring `getFiles`.
    pub fn files(&self) -> Vec<PathBuf> {
        self.state.lock().unwrap().files.iter().cloned().collect()
    }

    /// Recursively discover pre-existing matching files under `root`, emitting
    /// `Add` for each (notify does not replay them). Skips `node_modules`/`.git`
    /// and does not follow symlinked directories.
    fn initial_scan(&self, root: &Path) {
        let mut stack = vec![root.to_path_buf()];

        while let Some(dir) = stack.pop() {
            let Ok(entries) = std::fs::read_dir(&dir) else {
                continue;
            };

            for entry in entries.flatten() {
                let path = entry.path();

                // symlink_metadata does not traverse symlinks (followSymlinks: false)
                let Ok(meta) = std::fs::symlink_metadata(&path) else {
                    continue;
                };

                if meta.is_dir() {
                    if is_ignored_dir_name(&path) {
                        continue;
                    }
                    stack.push(path);
                } else if meta.is_file() && self.matches(&path) {
                    let inserted = self.state.lock().unwrap().files.insert(path.clone());

                    if inserted {
                        self.emit(WatcherEvent::Add(to_file_url(&path.to_string_lossy())));
                        self.ping();
                    }
                }
            }
        }
    }

    fn matches(&self, path: &Path) -> bool {
        let ext = get_file_extension(&path.to_string_lossy());
        self.extensions.iter().any(|e| e == &ext)
    }

    fn emit(&self, event: WatcherEvent) {
        (self.sink)(event);
    }

    fn ping(&self) {
        if let Some(tx) = self.debounce_tx.as_ref() {
            let _ = tx.send(());
        }
    }
}

impl Drop for Watcher {
    fn drop(&mut self) {
        // dropping the notify watcher closes the event channel -> worker exits;
        // dropping the debounce sender -> debouncer exits.
        self.notify.take();
        self.debounce_tx.take();

        if let Some(worker) = self.worker.take() {
            let _ = worker.join();
        }
        if let Some(debouncer) = self.debouncer.take() {
            let _ = debouncer.join();
        }
    }
}

/// Drain raw notify events, map them to [`WatcherEvent`]s, and emit.
fn spawn_worker(
    rx: Receiver<notify::Result<notify::Event>>,
    state: Arc<Mutex<State>>,
    extensions: Arc<Vec<String>>,
    sink: Sink,
    debounce_tx: Sender<()>,
) -> JoinHandle<()> {
    let matches = move |path: &Path| {
        let ext = get_file_extension(&path.to_string_lossy());
        extensions.iter().any(|e| e == &ext)
    };

    thread::spawn(move || {
        let emit = |event: WatcherEvent| {
            (sink)(event);
            let _ = debounce_tx.send(());
        };

        for received in rx {
            let Ok(event) = received else {
                continue;
            };

            match event.kind {
                EventKind::Create(_) => {
                    for path in &event.paths {
                        handle_upsert(path, true, &state, &matches, &emit);
                    }
                },

                EventKind::Modify(ModifyKind::Name(mode)) => {
                    handle_rename(mode, &event.paths, &state, &matches, &emit);
                },

                // content (or coarse "any") modification -> change; metadata-only
                // changes are ignored (chokidar 'change' tracks contents)
                EventKind::Modify(ModifyKind::Data(_)) | EventKind::Modify(ModifyKind::Any) => {
                    for path in &event.paths {
                        handle_upsert(path, false, &state, &matches, &emit);
                    }
                },

                EventKind::Remove(kind) => {
                    for path in &event.paths {
                        handle_remove(path, kind, &state, &matches, &emit);
                    }
                },

                _ => {},
            }
        }
    })
}

/// Handle a create (`is_add`) or content change for `path`.
fn handle_upsert(
    path: &Path,
    is_add: bool,
    state: &Arc<Mutex<State>>,
    matches: &impl Fn(&Path) -> bool,
    emit: &impl Fn(WatcherEvent),
) {
    if is_ignored(path) || !matches(path) {
        return;
    }

    // chokidar stats files before emitting add/change; only report paths that
    // still exist as files. This also discards the trailing modify event some
    // platforms (e.g. macOS FSEvents) deliver AFTER a delete, which would
    // otherwise resurrect a just-removed file.
    if !std::fs::symlink_metadata(path).map(|m| m.is_file()).unwrap_or(false) {
        return;
    }

    state.lock().unwrap().files.insert(path.to_path_buf());

    let url = to_file_url(&path.to_string_lossy());
    emit(if is_add {
        WatcherEvent::Add(url)
    } else {
        WatcherEvent::Change(url)
    });
}

/// Handle a removal: emit `Remove` only for a path we actually tracked, or a
/// notify-confirmed file removal that matches (avoids spurious directory
/// removes, which notify cannot always distinguish post-hoc).
fn handle_remove(
    path: &Path,
    kind: RemoveKind,
    state: &Arc<Mutex<State>>,
    matches: &impl Fn(&Path) -> bool,
    emit: &impl Fn(WatcherEvent),
) {
    if is_ignored(path) {
        return;
    }

    let was_tracked = state.lock().unwrap().files.remove(path);
    let is_file = matches!(kind, RemoveKind::File);

    if was_tracked || (is_file && matches(path)) {
        emit(WatcherEvent::Remove(to_file_url(&path.to_string_lossy())));
    }
}

/// Normalize a rename into removes/adds. Paired renames carry `[from, to]`.
fn handle_rename(
    mode: RenameMode,
    paths: &[PathBuf],
    state: &Arc<Mutex<State>>,
    matches: &impl Fn(&Path) -> bool,
    emit: &impl Fn(WatcherEvent),
) {
    match mode {
        RenameMode::Both if paths.len() == 2 => {
            handle_remove(&paths[0], RemoveKind::File, state, matches, emit);
            handle_upsert(&paths[1], true, state, matches, emit);
        },
        RenameMode::From => {
            for path in paths {
                handle_remove(path, RemoveKind::File, state, matches, emit);
            }
        },
        RenameMode::To => {
            for path in paths {
                handle_upsert(path, true, state, matches, emit);
            }
        },
        // ambiguous: fall back to existence to decide add vs remove
        _ => {
            for path in paths {
                if path.exists() {
                    handle_upsert(path, true, state, matches, emit);
                } else {
                    handle_remove(path, RemoveKind::File, state, matches, emit);
                }
            }
        },
    }
}

/// Emit a single `Changed` `debounce` after the last ping (chokidar `_changed`).
fn spawn_debouncer(rx: Receiver<()>, debounce: Duration, sink: Sink) -> JoinHandle<()> {
    thread::spawn(move || loop {
        // block until the first change of a burst
        if rx.recv().is_err() {
            return;
        }

        // then coalesce: each further ping restarts the window
        loop {
            match rx.recv_timeout(debounce) {
                Ok(()) => continue,
                Err(mpsc::RecvTimeoutError::Timeout) => {
                    (sink)(WatcherEvent::Changed);
                    break;
                },
                Err(mpsc::RecvTimeoutError::Disconnected) => return,
            }
        }
    })
}

/// True if `path` lives under a `node_modules`/`.git` directory (the chokidar
/// `ignored` regex, case-insensitively, by path component).
fn is_ignored(path: &Path) -> bool {
    let components: Vec<_> = path.components().collect();

    // the regex requires a slash AFTER the segment, so only ancestor components
    // (not the final entry) count
    let last = components.len().saturating_sub(1);

    components.iter().take(last).any(|component| {
        let name = component.as_os_str().to_string_lossy().to_lowercase();
        name == "node_modules" || name == ".git"
    })
}

/// True if the directory's own name is `node_modules`/`.git` (so the scan does
/// not descend into it).
fn is_ignored_dir_name(path: &Path) -> bool {
    path.file_name()
        .map(|name| {
            let name = name.to_string_lossy().to_lowercase();
            name == "node_modules" || name == ".git"
        })
        .unwrap_or(false)
}

/// `getFileExtension`: a dotfile (basename starting with `.`) yields the whole
/// basename (e.g. `.process-application`); otherwise the extension incl. the dot.
pub fn get_file_extension(value: &str) -> String {
    let basename = Path::new(value)
        .file_name()
        .map(|name| name.to_string_lossy().to_string())
        .unwrap_or_default();

    if basename.starts_with('.') {
        return basename;
    }

    Path::new(&basename)
        .extension()
        .map(|ext| format!(".{}", ext.to_string_lossy()))
        .unwrap_or_default()
}

/// `toFileUrl`: pass through an existing `file:` URL, else convert a path.
pub fn to_file_url(value: &str) -> String {
    if value.starts_with("file://") {
        return value.to_string();
    }

    url::Url::from_file_path(value)
        .map(|url| url.to_string())
        .unwrap_or_default()
}

/// `toFilePath`: convert a `file:` URL to a path, else pass a path through.
pub fn to_file_path(value: &str) -> PathBuf {
    if value.starts_with("file://") {
        if let Ok(url) = url::Url::parse(value) {
            if let Ok(path) = url.to_file_path() {
                return path;
            }
        }
    }

    PathBuf::from(value)
}
