// Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
// under one or more contributor license agreements. See the NOTICE file
// distributed with this work for additional information regarding copyright
// ownership.
//
// Camunda licenses this file to you under the MIT; you may not use this file
// except in compliance with the MIT License.

//! Parity tests for the file-system slice. These lock the same `FileDescriptor`
//! shape and `createFile` quirks the Electron backend produces (mirrors
//! `app/lib/file-system.js` and the lifecycle/serialization oracles).

use std::env;
use std::fs;
use std::path::PathBuf;

use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine;
use serde_json::{json, Value};

use modeler_backend::dispatch;

/// Create a unique temp dir for a test and return its path.
fn temp_dir(tag: &str) -> PathBuf {
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();

    let dir = env::temp_dir().join(format!("cm-backend-{tag}-{nanos}"));

    fs::create_dir_all(&dir).unwrap();

    dir
}

fn read(path: &str, options: Value) -> Value {
    dispatch("file:read", &[json!(path), options]).unwrap()
}

fn write(path: &str, file: Value, options: Value) -> Value {
    dispatch("file:write", &[json!(path), file, options]).unwrap()
}

#[test]
fn reads_utf8_with_all_path_derived_fields() {
    let dir = temp_dir("read-utf8");
    let path = dir.join("diagram.bpmn");
    fs::write(&path, "<definitions>ORIGINAL</definitions>").unwrap();

    let path_str = path.to_str().unwrap();
    let descriptor = read(path_str, json!({ "encoding": "utf8" }));

    assert_eq!(descriptor["contents"], json!("<definitions>ORIGINAL</definitions>"));
    assert_eq!(descriptor["name"], json!("diagram.bpmn"));
    assert_eq!(descriptor["path"], json!(path_str));
    assert_eq!(descriptor["dirname"], json!(dir.to_str().unwrap()));
    assert_eq!(descriptor["extname"], json!(".bpmn"));
    assert!(descriptor["uri"].as_str().unwrap().starts_with("file://"));
    assert!(descriptor["uri"].as_str().unwrap().ends_with("diagram.bpmn"));
    assert_eq!(descriptor["messages"], json!([]));
    assert!(descriptor["lastModified"].is_number());
}

#[test]
fn reads_extensionless_file_with_empty_extname() {
    let dir = temp_dir("read-noext");
    let path = dir.join("Makefile");
    fs::write(&path, "all:").unwrap();

    let descriptor = read(path.to_str().unwrap(), json!({}));

    assert_eq!(descriptor["name"], json!("Makefile"));
    assert_eq!(descriptor["extname"], json!(""));
}

#[test]
fn reads_unicode_and_spaced_names_into_a_file_uri() {
    let dir = temp_dir("read-unicode");
    let path = dir.join("diagramme final ☕.bpmn");
    fs::write(&path, "x").unwrap();

    let descriptor = read(path.to_str().unwrap(), json!({}));

    let uri = descriptor["uri"].as_str().unwrap();

    // url crate percent-encodes spaces and unicode, like Node's pathToFileURL.
    assert!(uri.contains("%20"));
    assert!(!uri.contains(' '));
}

#[test]
fn reads_binary_as_a_tagged_uint8array() {
    let dir = temp_dir("read-binary");
    let path = dir.join("image.png");
    let bytes = [0u8, 1, 2, 250, 255];
    fs::write(&path, bytes).unwrap();

    let descriptor = read(path.to_str().unwrap(), json!({ "encoding": false }));

    let contents = &descriptor["contents"];

    assert_eq!(contents["__type"], json!("Uint8Array"));
    assert_eq!(
        contents["data"],
        json!(BASE64.encode(bytes))
    );
}

#[test]
fn defaults_to_utf8_when_encoding_absent() {
    let dir = temp_dir("read-default");
    let path = dir.join("a.txt");
    fs::write(&path, "hello").unwrap();

    let descriptor = read(path.to_str().unwrap(), Value::Null);

    assert_eq!(descriptor["contents"], json!("hello"));
}

#[test]
fn writes_utf8_and_persists_to_disk() {
    let dir = temp_dir("write-utf8");
    let path = dir.join("out.bpmn");
    let path_str = path.to_str().unwrap();

    let written = write(
        path_str,
        json!({ "contents": "<definitions>EDITED</definitions>" }),
        json!({}),
    );

    // independent, out-of-band verification
    let on_disk = fs::read_to_string(&path).unwrap();
    assert_eq!(on_disk, "<definitions>EDITED</definitions>");

    assert_eq!(written["path"], json!(path_str));
    assert_eq!(written["name"], json!("out.bpmn"));
    assert!(written["lastModified"].is_number());
}

#[test]
fn write_return_drops_dirname_extname_uri() {
    // Mirrors the double-createFile quirk: the write return only carries
    // contents/lastModified/name/path/messages.
    let dir = temp_dir("write-quirk");
    let path = dir.join("out.bpmn");

    let written = write(path.to_str().unwrap(), json!({ "contents": "x" }), json!({}));

    assert!(written.get("dirname").is_none());
    assert!(written.get("extname").is_none());
    assert!(written.get("uri").is_none());
    assert!(written.get("name").is_some());
}

#[test]
fn write_with_file_type_appends_extension() {
    let dir = temp_dir("write-filetype");
    let path = dir.join("noext");

    let written = write(
        path.to_str().unwrap(),
        json!({ "contents": "x" }),
        json!({ "fileType": "bpmn" }),
    );

    assert_eq!(written["name"], json!("noext.bpmn"));
    assert!(dir.join("noext.bpmn").exists());
}

#[test]
fn writes_tagged_binary_contents_as_raw_bytes() {
    let dir = temp_dir("write-binary");
    let path = dir.join("image.png");
    let bytes = [9u8, 8, 7, 255, 0];

    write(
        path.to_str().unwrap(),
        json!({ "contents": { "__type": "Uint8Array", "data": BASE64.encode(bytes) } }),
        json!({}),
    );

    assert_eq!(fs::read(&path).unwrap(), bytes);
}

#[test]
fn writes_base64_encoding_decoding_data_url() {
    let dir = temp_dir("write-base64");
    let path = dir.join("image.png");
    let raw = [1u8, 2, 3, 4];
    let data_url = format!("data:image/png;base64,{}", BASE64.encode(raw));

    write(
        path.to_str().unwrap(),
        json!({ "contents": data_url }),
        json!({ "encoding": "base64" }),
    );

    assert_eq!(fs::read(&path).unwrap(), raw);
}

#[test]
fn read_stats_refreshes_last_modified_without_recomputing_path_fields() {
    let dir = temp_dir("stats");
    let path = dir.join("out.bpmn");
    fs::write(&path, "x").unwrap();

    // an input descriptor as the renderer would hold it (no dirname/uri)
    let file = json!({
        "path": path.to_str().unwrap(),
        "name": "out.bpmn",
        "contents": "x"
    });

    let refreshed = dispatch("file:read-stats", &[file]).unwrap();

    assert!(refreshed["lastModified"].is_number());
    assert_eq!(refreshed["name"], json!("out.bpmn"));
    assert!(refreshed.get("uri").is_none());
}

#[test]
fn round_trips_open_edit_save_reopen() {
    // The same journey the lifecycle parity oracle drives, but exercised
    // directly against the backend dispatch.
    let dir = temp_dir("lifecycle");
    let fixture = dir.join("diagram.bpmn");
    let save_path = dir.join("diagram.saved.bpmn");
    fs::write(&fixture, "<definitions>ORIGINAL</definitions>").unwrap();

    let opened = read(fixture.to_str().unwrap(), json!({ "encoding": "utf8" }));
    assert_eq!(opened["contents"], json!("<definitions>ORIGINAL</definitions>"));

    let edited = opened["contents"]
        .as_str()
        .unwrap()
        .replace("ORIGINAL", "EDITED");

    let mut file = opened.clone();
    file["contents"] = json!(edited);

    let written = write(save_path.to_str().unwrap(), file, json!({}));
    assert_eq!(written["name"], json!("diagram.saved.bpmn"));

    let reopened = read(save_path.to_str().unwrap(), json!({ "encoding": "utf8" }));
    assert_eq!(reopened["contents"], json!("<definitions>EDITED</definitions>"));

    // independent on-disk verification
    assert_eq!(
        fs::read_to_string(&save_path).unwrap(),
        "<definitions>EDITED</definitions>"
    );
}

#[test]
fn read_missing_file_yields_enoent_parity_error() {
    let dir = temp_dir("enoent");
    let missing = dir.join("nope.bpmn");

    let err = dispatch("file:read", &[json!(missing.to_str().unwrap()), json!({})]).unwrap_err();

    assert_eq!(err.code, "ENOENT");
    assert!(err.message.contains("ENOENT"));
    assert_eq!(err.path.as_deref(), Some(missing.to_str().unwrap()));
}

#[test]
fn disallowed_event_is_rejected() {
    let err = dispatch("totally:made-up", &[]).unwrap_err();

    assert_eq!(err.code, "ERR_DISALLOWED_EVENT");
}

#[test]
fn allowed_but_unimplemented_event_is_distinct() {
    let err = dispatch("zeebe:deploy", &[]).unwrap_err();

    assert_eq!(err.code, "ERR_NOT_IMPLEMENTED");
}
