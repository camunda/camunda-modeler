// Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
// under one or more contributor license agreements. See the NOTICE file
// distributed with this work for additional information regarding copyright
// ownership.
//
// Camunda licenses this file to you under the MIT; you may not use this file
// except in compliance with the MIT License.

//! Parity tests for the file-context watcher, mirroring the observable contract
//! of `app/lib/file-context/watcher.js` (consumed by the indexer).
//!
//! The deterministic tests (extension/url helpers, the recursive initial scan,
//! root bookkeeping, the change debounce) assert exact behavior. The live
//! filesystem tests drive real temp-dir mutations through `notify` and poll for
//! the eventual event, tolerant of platform coalescing/latency.

use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use modeler_backend::watcher::{
    get_file_extension, to_file_path, to_file_url, Sink, DEFAULT_EXTENSIONS,
};
use modeler_backend::{Watcher, WatcherEvent};

fn temp_dir(tag: &str) -> PathBuf {
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();

    let dir = std::env::temp_dir().join(format!("cm-watcher-{tag}-{nanos}"));

    fs::create_dir_all(&dir).unwrap();

    // canonicalize so expectations match the symlink-resolved paths the OS
    // reports (e.g. macOS /var -> /private/var)
    fs::canonicalize(&dir).unwrap()
}

fn write(path: &Path, contents: &str) {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).unwrap();
    }
    fs::write(path, contents).unwrap();
}

fn extensions() -> Vec<String> {
    DEFAULT_EXTENSIONS.iter().map(|e| e.to_string()).collect()
}

/// A collecting sink plus the shared log it appends to.
fn recording_sink() -> (Sink, Arc<Mutex<Vec<WatcherEvent>>>) {
    let log = Arc::new(Mutex::new(Vec::new()));
    let captured = log.clone();

    let sink: Sink = Arc::new(move |event| captured.lock().unwrap().push(event));

    (sink, log)
}

fn url_of(path: &Path) -> String {
    to_file_url(&path.to_string_lossy())
}

fn events_of(kind: fn(&WatcherEvent) -> Option<String>, log: &Arc<Mutex<Vec<WatcherEvent>>>) -> Vec<String> {
    log.lock().unwrap().iter().filter_map(kind).collect()
}

fn as_add(event: &WatcherEvent) -> Option<String> {
    match event {
        WatcherEvent::Add(url) => Some(url.clone()),
        _ => None,
    }
}

fn count(target: &WatcherEvent, log: &Arc<Mutex<Vec<WatcherEvent>>>) -> usize {
    log.lock().unwrap().iter().filter(|event| *event == target).count()
}

/// Poll `condition` until it is true or `timeout` elapses.
fn wait_until(timeout: Duration, condition: impl Fn() -> bool) -> bool {
    let deadline = Instant::now() + timeout;

    while Instant::now() < deadline {
        if condition() {
            return true;
        }
        std::thread::sleep(Duration::from_millis(25));
    }

    condition()
}

const LIVE_TIMEOUT: Duration = Duration::from_secs(5);

// --- helper parity ----------------------------------------------------------

#[test]
fn get_file_extension_matches_node_basename_semantics() {
    // dotfiles: the whole basename is the "extension"
    assert_eq!(get_file_extension("/a/b/.process-application"), ".process-application");
    assert_eq!(get_file_extension(".gitignore"), ".gitignore");

    // normal files: the trailing extension incl. the dot
    assert_eq!(get_file_extension("/a/b/foo.bpmn"), ".bpmn");
    assert_eq!(get_file_extension("foo.tar.gz"), ".gz");

    // no extension
    assert_eq!(get_file_extension("/a/b/README"), "");
}

#[test]
fn file_url_path_round_trip() {
    let path = "/tmp/some dir/diagram.bpmn";
    let url = to_file_url(path);

    assert!(url.starts_with("file://"));

    // an existing file URL passes through unchanged
    assert_eq!(to_file_url(&url), url);

    // and converts back to the original path
    assert_eq!(to_file_path(&url), PathBuf::from(path));

    // a plain path passes through to_file_path unchanged
    assert_eq!(to_file_path(path), PathBuf::from(path));
}

// --- initial scan -----------------------------------------------------------

#[test]
fn initial_scan_discovers_matching_files_recursively_and_then_ready() {
    let root = temp_dir("scan");

    // matching files at various depths
    write(&root.join("foo.bpmn"), "<a/>");
    write(&root.join(".process-application"), "{}");
    write(&root.join("bar/bar.dmn"), "<a/>");
    write(&root.join("bar/baz/baz.form"), "{}");
    write(&root.join("bar/baz/baz.rpa"), "{}");

    // non-matching files are ignored
    write(&root.join("notes.txt"), "ignore me");
    write(&root.join("bar/README"), "ignore me");

    // files under node_modules / .git are skipped entirely
    write(&root.join("node_modules/dep/dep.bpmn"), "<a/>");
    write(&root.join(".git/hooks/hook.bpmn"), "<a/>");

    let (sink, log) = recording_sink();
    let mut watcher = Watcher::new(extensions(), Duration::from_millis(50), sink);

    watcher.add_root(&root.to_string_lossy());

    let mut expected: Vec<String> = [
        root.join("foo.bpmn"),
        root.join(".process-application"),
        root.join("bar/bar.dmn"),
        root.join("bar/baz/baz.form"),
        root.join("bar/baz/baz.rpa"),
    ]
    .iter()
    .map(|p| url_of(p))
    .collect();
    expected.sort();

    let mut added = events_of(as_add, &log);
    added.sort();
    added.dedup();

    assert_eq!(added, expected);

    // exactly the scan's Adds precede the (one) Ready; any later duplicate Adds
    // are platform replay of the watch and are excluded by the Ready boundary
    assert_eq!(count(&WatcherEvent::Ready, &log), 1);
    let events = log.lock().unwrap();
    let ready_index = events.iter().position(|e| *e == WatcherEvent::Ready).unwrap();
    let mut adds_before_ready: Vec<String> =
        events[..=ready_index].iter().filter_map(as_add).collect();
    adds_before_ready.sort();
    adds_before_ready.dedup();
    assert_eq!(adds_before_ready, expected);
    drop(events);

    // getFiles tracks the same set (as paths)
    assert_eq!(watcher.files().len(), 5);
}

#[cfg(unix)]
#[test]
fn initial_scan_does_not_follow_symlinked_directories() {
    let root = temp_dir("symlink");
    let outside = temp_dir("symlink-target");

    write(&outside.join("hidden.bpmn"), "<a/>");
    write(&root.join("real.bpmn"), "<a/>");

    std::os::unix::fs::symlink(&outside, root.join("link")).unwrap();

    let (sink, log) = recording_sink();
    let mut watcher = Watcher::new(extensions(), Duration::from_millis(50), sink);

    watcher.add_root(&root.to_string_lossy());

    let added = events_of(as_add, &log);

    // only the real file is discovered; the symlinked dir is not traversed
    assert_eq!(added, vec![url_of(&root.join("real.bpmn"))]);
}

// --- root bookkeeping -------------------------------------------------------

#[test]
fn add_root_is_idempotent() {
    let root = temp_dir("idempotent");
    write(&root.join("foo.bpmn"), "<a/>");

    let (sink, log) = recording_sink();
    let mut watcher = Watcher::new(extensions(), Duration::from_millis(50), sink);

    watcher.add_root(&root.to_string_lossy());
    watcher.add_root(&root.to_string_lossy());

    // the second add_root is a no-op: no second scan, no second Ready
    assert_eq!(count(&WatcherEvent::Ready, &log), 1);
    assert_eq!(events_of(as_add, &log).len(), 1);
}

#[test]
fn remove_root_is_idempotent_and_keeps_tracked_files() {
    let root = temp_dir("remove-root");
    write(&root.join("foo.bpmn"), "<a/>");

    let (sink, _log) = recording_sink();
    let mut watcher = Watcher::new(extensions(), Duration::from_millis(50), sink);

    watcher.add_root(&root.to_string_lossy());
    assert_eq!(watcher.files().len(), 1);

    watcher.remove_root(&root.to_string_lossy());
    // removing a non-root again is a no-op
    watcher.remove_root(&root.to_string_lossy());

    // the files set is intentionally left intact (mirrors the JS)
    assert_eq!(watcher.files().len(), 1);
}

// --- debounce ---------------------------------------------------------------

#[test]
fn change_burst_is_debounced_into_a_single_changed() {
    let root = temp_dir("debounce");

    // a burst of matching files -> many pings during the initial scan
    for i in 0..10 {
        write(&root.join(format!("file{i}.bpmn")), "<a/>");
    }

    let (sink, log) = recording_sink();
    let mut watcher = Watcher::new(extensions(), Duration::from_millis(60), sink);

    watcher.add_root(&root.to_string_lossy());

    // after the debounce window settles, exactly one Changed for the whole burst
    assert!(wait_until(Duration::from_secs(2), || {
        count(&WatcherEvent::Changed, &log) == 1
    }));

    std::thread::sleep(Duration::from_millis(150));
    assert_eq!(count(&WatcherEvent::Changed, &log), 1);
}

#[test]
fn non_matching_files_do_not_trigger_changed() {
    let root = temp_dir("no-change");
    write(&root.join("a.txt"), "x");
    write(&root.join("b.md"), "x");

    let (sink, log) = recording_sink();
    let mut watcher = Watcher::new(extensions(), Duration::from_millis(50), sink);

    watcher.add_root(&root.to_string_lossy());

    std::thread::sleep(Duration::from_millis(200));

    assert_eq!(count(&WatcherEvent::Changed, &log), 0);
    assert_eq!(events_of(as_add, &log).len(), 0);
}

// --- live filesystem events -------------------------------------------------

#[test]
fn live_add_of_a_matching_file_is_reported() {
    let root = temp_dir("live-add");

    let (sink, log) = recording_sink();
    let mut watcher = Watcher::new(extensions(), Duration::from_millis(50), sink);

    watcher.add_root(&root.to_string_lossy());
    assert!(wait_until(LIVE_TIMEOUT, || count(&WatcherEvent::Ready, &log) >= 1));

    let file = root.join("late.bpmn");
    write(&file, "<a/>");
    let url = url_of(&file);

    assert!(
        wait_until(LIVE_TIMEOUT, || events_of(as_add, &log).contains(&url)),
        "expected a live Add for {url}"
    );
    assert!(wait_until(LIVE_TIMEOUT, || watcher.files().contains(&file)));
}

#[test]
fn live_remove_of_a_tracked_file_is_reported() {
    let root = temp_dir("live-remove");
    let file = root.join("doomed.bpmn");
    write(&file, "<a/>");

    let (sink, log) = recording_sink();
    let mut watcher = Watcher::new(extensions(), Duration::from_millis(50), sink);

    watcher.add_root(&root.to_string_lossy());
    assert!(wait_until(LIVE_TIMEOUT, || watcher.files().contains(&file)));

    fs::remove_file(&file).unwrap();
    let url = url_of(&file);

    assert!(
        wait_until(LIVE_TIMEOUT, || {
            log.lock().unwrap().contains(&WatcherEvent::Remove(url.clone()))
        }),
        "expected a live Remove for {url}"
    );
    assert!(wait_until(LIVE_TIMEOUT, || !watcher.files().contains(&file)));
}

#[test]
fn live_events_under_node_modules_are_ignored() {
    let root = temp_dir("live-ignore");

    let (sink, log) = recording_sink();
    let mut watcher = Watcher::new(extensions(), Duration::from_millis(50), sink);

    watcher.add_root(&root.to_string_lossy());
    assert!(wait_until(LIVE_TIMEOUT, || count(&WatcherEvent::Ready, &log) >= 1));

    // a matching file created under node_modules must NOT be reported
    let ignored = root.join("node_modules/pkg/thing.bpmn");
    write(&ignored, "<a/>");

    // a sibling matching file IS reported -> a reliable barrier to wait on
    let visible = root.join("visible.bpmn");
    write(&visible, "<a/>");

    assert!(wait_until(LIVE_TIMEOUT, || events_of(as_add, &log).contains(&url_of(&visible))));

    assert!(!events_of(as_add, &log).contains(&url_of(&ignored)));
    assert!(!watcher.files().contains(&ignored));
}
