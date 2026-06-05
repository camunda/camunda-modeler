// Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
// under one or more contributor license agreements. See the NOTICE file
// distributed with this work for additional information regarding copyright
// ownership.
//
// Camunda licenses this file to you under the MIT; you may not use this file
// except in compliance with the MIT License.

//! Parity tests for the file-context indexer + processors, mirroring the
//! `processing` and `error handling` suites of
//! `app/lib/file-context/__tests__/file-context-spec.js`.
//!
//! They run against the EXACT fixtures the JS spec uses (shared via a relative
//! path), so the extracted `metadata` shapes and `process-error`/no-message
//! outcomes are asserted to be identical to the Electron backend.

use std::path::PathBuf;
use std::sync::{Arc, Mutex};

use modeler_backend::{IndexItem, Indexer, IndexerEvent};
use serde_json::{json, Value};

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

/// Index a single fixture file and return the resulting item.
fn index(relative: &str) -> IndexItem {
    let mut indexer = Indexer::new();
    indexer.add(&fixture(relative), None)
}

fn messages(item: &IndexItem) -> Vec<Value> {
    item.file
        .get("messages")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default()
}

// ---------------------------------------------------------------------------
// processing (file-context-spec.js `describe('processing')`)
// ---------------------------------------------------------------------------

#[test]
fn bpmn_file() {
    let item = index("foo-process-application/foo.bpmn");

    assert_eq!(
        item.metadata,
        json!({
            "type": "bpmn",
            "processes": [ { "id": "FooProcess", "name": "FooProcess" } ],
            "linkedIds": [ {
                "elementId": "CallActivity_1",
                "linkedId": "BarProcess",
                "type": "bpmn"
            } ]
        })
    );
}

#[test]
fn dmn_file() {
    let item = index("foo-process-application/bar/baz/baz.dmn");

    // FooDecision's nested informationRequirement/requiredDecision must NOT be
    // collected as decisions; order is document order.
    assert_eq!(
        item.metadata,
        json!({
            "type": "dmn",
            "decisions": [
                { "id": "BarDecision", "name": "BarDecision" },
                { "id": "BazDecision", "name": "BazDecision" },
                { "id": "FooDecision", "name": "FooDecision" }
            ],
            "linkedIds": []
        })
    );
}

#[test]
fn form_file() {
    let item = index("foo-process-application/bar/baz/baz.form");

    assert_eq!(
        item.metadata,
        json!({
            "type": "form",
            "forms": [ { "id": "BazForm", "name": "BazForm" } ],
            "linkedIds": []
        })
    );
}

#[test]
fn process_application_file() {
    let item = index("foo-process-application/.process-application");

    assert_eq!(item.metadata, json!({ "type": "processApplication" }));
}

#[test]
fn rpa_file() {
    let item = index("foo-process-application/bar/baz/baz.rpa");

    assert_eq!(
        item.metadata,
        json!({
            "type": "rpa",
            "scripts": [ { "id": "RPAScript", "name": "NamedScript" } ],
            "linkedIds": []
        })
    );
}

// ---------------------------------------------------------------------------
// error handling (file-context-spec.js `describe('error handling')`)
// ---------------------------------------------------------------------------

#[test]
fn unrecognized_extension_yields_no_processor() {
    let item = index("extensions/bpmn.unrecognized");

    assert_eq!(item.metadata, Value::Null);

    let messages = messages(&item);
    assert_eq!(messages.len(), 1);
    assert_eq!(messages[0]["error"], json!(true));
    assert_eq!(messages[0]["source"], json!("process-error"));
    assert!(messages[0]["message"]
        .as_str()
        .unwrap()
        .contains("No processor found"));
}

#[test]
fn no_extension_yields_no_processor() {
    let item = index("extensions/no-extension");

    assert_eq!(item.metadata, Value::Null);

    let messages = messages(&item);
    assert_eq!(messages.len(), 1);
    assert_eq!(messages[0]["source"], json!("process-error"));
    assert!(messages[0]["message"]
        .as_str()
        .unwrap()
        .contains("No processor found"));
}

#[test]
fn empty_bpmn_yields_empty_metadata() {
    let item = index("broken-files/empty.bpmn");

    assert_eq!(
        item.metadata,
        json!({ "type": "bpmn", "processes": [], "linkedIds": [] })
    );
    assert!(messages(&item).is_empty());
}

#[test]
fn empty_dmn_yields_empty_metadata() {
    let item = index("broken-files/empty.dmn");

    assert_eq!(
        item.metadata,
        json!({ "type": "dmn", "decisions": [], "linkedIds": [] })
    );
    assert!(messages(&item).is_empty());
}

#[test]
fn empty_form_yields_empty_metadata() {
    let item = index("broken-files/empty.form");

    assert_eq!(
        item.metadata,
        json!({ "type": "form", "forms": [], "linkedIds": [] })
    );
    assert!(messages(&item).is_empty());
}

#[test]
fn null_form_yields_process_error() {
    let item = index("broken-files/form-null.form");

    assert_eq!(item.metadata, Value::Null);

    let messages = messages(&item);
    assert_eq!(messages.len(), 1);
    assert_eq!(messages[0]["error"], json!(true));
    assert_eq!(messages[0]["source"], json!("process-error"));
    assert!(messages[0]["message"]
        .as_str()
        .unwrap()
        .starts_with("Failed to parse form file: Cannot"));
}

#[test]
fn empty_rpa_yields_empty_metadata() {
    let item = index("broken-files/empty.rpa");

    assert_eq!(
        item.metadata,
        json!({ "type": "rpa", "scripts": [], "linkedIds": [] })
    );
    assert!(messages(&item).is_empty());
}

// ---------------------------------------------------------------------------
// indexer lifecycle
// ---------------------------------------------------------------------------

#[test]
fn add_stores_item_and_emits_updated() {
    let events = Arc::new(Mutex::new(Vec::new()));
    let captured = events.clone();

    let mut indexer = Indexer::with_sink(Box::new(move |event| {
        captured.lock().unwrap().push(event);
    }));

    let path = fixture("foo-process-application/foo.bpmn");
    indexer.add(&path, None);

    assert_eq!(indexer.get_items().len(), 1);
    assert!(indexer.get(&path).is_some());

    let events = events.lock().unwrap();
    assert_eq!(events.len(), 1);
    assert!(matches!(events[0], IndexerEvent::Updated(_)));
}

#[test]
fn remove_deletes_item_and_emits_removed() {
    let events = Arc::new(Mutex::new(Vec::new()));
    let captured = events.clone();

    let mut indexer = Indexer::with_sink(Box::new(move |event| {
        captured.lock().unwrap().push(event);
    }));

    let path = fixture("foo-process-application/foo.bpmn");
    indexer.add(&path, None);
    indexer.remove(&path);

    assert_eq!(indexer.get_items().len(), 0);
    assert!(indexer.get(&path).is_none());

    let events = events.lock().unwrap();
    assert_eq!(events.len(), 2);
    assert!(matches!(events[1], IndexerEvent::Removed(_)));
}

#[test]
fn explicit_processor_id_is_used() {
    let mut indexer = Indexer::new();

    // Force a JSON form file through the RPA processor (both are plain JSON
    // parsers, so this routes without an XML-parser divergence): extension would
    // pick `form`, the explicit id picks `rpa`.
    let item = indexer.add(
        &fixture("foo-process-application/bar/baz/baz.form"),
        Some("rpa".into()),
    );

    assert_eq!(
        item.metadata,
        json!({
            "type": "rpa",
            "scripts": [ { "id": "BazForm", "name": "BazForm" } ],
            "linkedIds": []
        })
    );
}

#[test]
fn unknown_explicit_processor_falls_back_to_extension() {
    let mut indexer = Indexer::new();

    let item = indexer.add(
        &fixture("foo-process-application/foo.bpmn"),
        Some("does-not-exist".into()),
    );

    assert_eq!(item.metadata["type"], json!("bpmn"));
}

#[test]
fn missing_file_yields_read_error_and_empty_metadata() {
    let mut indexer = Indexer::new();

    // A non-existent .bpmn: read fails (read-error message kept), the processor
    // sees `contents: null` and returns the empty-metadata shape (item.error is
    // dead code in the JS indexer).
    let item = indexer.add(&fixture("foo-process-application/does-not-exist.bpmn"), None);

    assert_eq!(
        item.metadata,
        json!({ "type": "bpmn", "processes": [], "linkedIds": [] })
    );

    let messages = messages(&item);
    assert_eq!(messages.len(), 1);
    assert_eq!(messages[0]["source"], json!("read-error"));
    assert_eq!(messages[0]["error"], json!(true));
}
