// Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
// under one or more contributor license agreements. See the NOTICE file
// distributed with this work for additional information regarding copyright
// ownership.
//
// Camunda licenses this file to you under the MIT; you may not use this file
// except in compliance with the MIT License.

//! Parity tests for workspace restore/save, mirroring `app/lib/workspace.js`.

use std::fs;
use std::path::PathBuf;

use serde_json::{json, Value};

use modeler_backend::config::Config;
use modeler_backend::workspace;

fn temp_dir(tag: &str) -> PathBuf {
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();

    let dir = std::env::temp_dir().join(format!("cm-workspace-{tag}-{nanos}"));

    fs::create_dir_all(&dir).unwrap();

    dir
}

fn default_config() -> Value {
    json!({ "activeFile": -1, "files": [], "layout": {} })
}

#[test]
fn restore_returns_the_default_when_no_workspace_saved() {
    let dir = temp_dir("restore-default");

    let config = Config::new(&dir);
    let restored = workspace::restore(&config, default_config());

    assert_eq!(restored, default_config());
}

#[test]
fn save_then_restore_round_trips_and_rereads_files() {
    let dir = temp_dir("restore-roundtrip");

    let file_path = dir.join("diagram.bpmn");
    fs::write(&file_path, "<definitions>FRESH</definitions>").unwrap();
    let file_path = file_path.to_str().unwrap();

    let config = Config::new(&dir);

    // save a workspace that references the file by path (with STALE contents)
    workspace::save(
        &config,
        json!({
            "activeFile": 0,
            "layout": { "panel": "open" },
            "files": [ { "path": file_path, "contents": "STALE" } ]
        }),
    )
    .unwrap();

    let restored = workspace::restore(&config, default_config());

    // non-file fields are preserved
    assert_eq!(restored["activeFile"], json!(0));
    assert_eq!(restored["layout"], json!({ "panel": "open" }));

    // the file was re-read from disk (fresh contents, full descriptor)
    let files = restored["files"].as_array().unwrap();
    assert_eq!(files.len(), 1);
    assert_eq!(files[0]["contents"], json!("<definitions>FRESH</definitions>"));
    assert_eq!(files[0]["name"], json!("diagram.bpmn"));
}

#[test]
fn restore_skips_unreadable_files_but_keeps_the_workspace() {
    let dir = temp_dir("restore-skip");

    let readable = dir.join("ok.bpmn");
    fs::write(&readable, "<definitions>OK</definitions>").unwrap();
    let readable = readable.to_str().unwrap();
    let missing = dir.join("gone.bpmn");
    let missing = missing.to_str().unwrap();

    let config = Config::new(&dir);
    workspace::save(
        &config,
        json!({
            "activeFile": 0,
            "files": [ { "path": missing }, { "path": readable } ]
        }),
    )
    .unwrap();

    let restored = workspace::restore(&config, default_config());
    let files = restored["files"].as_array().unwrap();

    // only the readable file survives; the workspace object is still returned
    assert_eq!(files.len(), 1);
    assert_eq!(files[0]["name"], json!("ok.bpmn"));
}

#[test]
fn restore_returns_an_empty_file_list_when_none_are_readable() {
    let dir = temp_dir("restore-none");

    let missing = dir.join("gone.bpmn");
    let missing = missing.to_str().unwrap();

    let config = Config::new(&dir);
    workspace::save(
        &config,
        json!({ "activeFile": -1, "files": [ { "path": missing } ] }),
    )
    .unwrap();

    let restored = workspace::restore(&config, default_config());

    // a saved (but empty-after-reread) workspace is NOT replaced by the default
    assert_eq!(restored["files"], json!([]));
    assert_eq!(restored["activeFile"], json!(-1));
}

#[test]
fn save_returns_null() {
    let dir = temp_dir("save-null");

    let config = Config::new(&dir);
    let result = workspace::save(&config, json!({ "files": [] })).unwrap();

    assert_eq!(result, Value::Null);
}
