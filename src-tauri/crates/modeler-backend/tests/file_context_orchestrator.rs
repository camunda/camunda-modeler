// Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
// under one or more contributor license agreements. See the NOTICE file
// distributed with this work for additional information regarding copyright
// ownership.
//
// Camunda licenses this file to you under the MIT; you may not use this file
// except in compliance with the MIT License.

//! Parity tests for the file-context orchestrator (`FileContext`), mirroring the
//! `watching` suite of
//! `app/lib/file-context/__tests__/file-context-spec.js` plus the
//! `file-context:file-opened`/`file-closed` handler behavior in
//! `app/lib/index.js`.
//!
//! The Rust watcher scans synchronously on `add_root`, so a push reflecting the
//! full directory is observed by the time `add_root` returns — no event waiting
//! needed (unlike the chokidar-based JS, which awaits `watcher:ready`).

use std::path::PathBuf;
use std::sync::{Arc, Mutex};

use modeler_backend::watcher::to_file_url;
use modeler_backend::{ChangedSink, FileContext};
use serde_json::Value;

/// Absolute path to a fixture under the JS spec's fixtures dir.
fn fixture(relative: &str) -> String {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../../app/lib/file-context/__tests__/fixtures")
        .join(relative);

    path.canonicalize()
        .unwrap_or(path)
        .to_string_lossy()
        .into_owned()
}

/// Collects every `file-context:changed` payload pushed by a [`FileContext`].
#[derive(Clone, Default)]
struct Pushes(Arc<Mutex<Vec<Vec<Value>>>>);

impl Pushes {
    fn sink(&self) -> ChangedSink {
        let pushes = self.0.clone();
        Arc::new(move |items| pushes.lock().unwrap().push(items))
    }

    /// The most recent full-item payload (or an empty vec if nothing pushed).
    fn last(&self) -> Vec<Value> {
        self.0.lock().unwrap().last().cloned().unwrap_or_default()
    }

    fn count(&self) -> usize {
        self.0.lock().unwrap().len()
    }
}

/// Whether the latest payload contains an item whose file path matches `uri`.
fn has_uri(items: &[Value], uri: &str) -> bool {
    items.iter().any(|item| {
        item.get("file")
            .and_then(|file| file.get("uri"))
            .and_then(Value::as_str)
            == Some(uri)
    })
}

#[test]
fn add_root_indexes_directory_and_pushes_full_items() {
    let pushes = Pushes::default();
    let mut fc = FileContext::new(pushes.sink());

    fc.add_root(&fixture("foo-process-application"));

    // Mirrors the JS "adding root" assertion: the process application directory
    // yields six indexed files (the .process-application, two BPMN, one DMN, one
    // form, one rpa). The final push reflects the full set.
    let last = pushes.last();
    assert_eq!(last.len(), 6, "expected 6 indexed items, got {}", last.len());

    for relative in [
        "foo-process-application/.process-application",
        "foo-process-application/foo.bpmn",
        "foo-process-application/bar/bar.bpmn",
        "foo-process-application/bar/baz/baz.dmn",
        "foo-process-application/bar/baz/baz.form",
        "foo-process-application/bar/baz/baz.rpa",
    ] {
        assert!(
            has_uri(&last, &to_file_url(&fixture(relative))),
            "missing {relative}"
        );
    }

    // Every push carries the renderer-facing `{ file, metadata }` shape only.
    for item in &last {
        assert!(item.get("file").is_some());
        assert!(item.get("metadata").is_some());
        assert_eq!(item.as_object().unwrap().len(), 2);
    }
}

#[test]
fn file_opened_adds_the_process_application_dir_as_a_root() {
    let pushes = Pushes::default();
    let mut fc = FileContext::new(pushes.sink());

    // Opening a file inside a process application discovers the
    // `.process-application` sibling and watches the whole directory.
    fc.file_opened(&fixture("foo-process-application/foo.bpmn"), None);

    let last = pushes.last();
    assert_eq!(last.len(), 6);
    assert!(has_uri(
        &last,
        &to_file_url(&fixture("foo-process-application/bar/bar.bpmn"))
    ));
}

#[test]
fn file_closed_skips_when_part_of_a_process_application() {
    let pushes = Pushes::default();
    let mut fc = FileContext::new(pushes.sink());

    fc.add_root(&fixture("foo-process-application"));
    let before = pushes.count();

    // foo.bpmn lives under a tracked `.process-application`, so closing it must
    // NOT remove it and must NOT push.
    fc.file_closed(&fixture("foo-process-application/foo.bpmn"));

    assert_eq!(pushes.count(), before, "file-closed should not push");
    assert_eq!(pushes.last().len(), 6);
}

#[test]
fn file_updated_then_closed_removes_a_standalone_file() {
    let pushes = Pushes::default();
    let mut fc = FileContext::new(pushes.sink());

    // file-updated indexes without discovering a process-application root.
    fc.file_updated(&fixture("broken-files/empty.bpmn"), None);
    assert_eq!(pushes.last().len(), 1);

    // With no tracked process application, closing removes the item and pushes.
    fc.file_closed(&fixture("broken-files/empty.bpmn"));
    assert_eq!(pushes.last().len(), 0);
}

#[test]
fn remove_root_keeps_indexed_items_and_does_not_push() {
    let pushes = Pushes::default();
    let mut fc = FileContext::new(pushes.sink());

    fc.add_root(&fixture("foo-process-application"));
    let after_add = pushes.count();
    assert_eq!(pushes.last().len(), 6);

    // Mirrors JS removeRoot: items remain, no push is emitted.
    fc.remove_root(&fixture("foo-process-application"));

    assert_eq!(pushes.count(), after_add);
    assert_eq!(pushes.last().len(), 6);
}

#[test]
fn close_ignores_subsequent_events() {
    let pushes = Pushes::default();
    let mut fc = FileContext::new(pushes.sink());

    fc.close();

    fc.file_updated(&fixture("broken-files/empty.bpmn"), None);

    assert_eq!(pushes.count(), 0, "no push expected after close");
}
