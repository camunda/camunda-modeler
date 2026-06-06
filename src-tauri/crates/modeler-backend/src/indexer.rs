// Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
// under one or more contributor license agreements. See the NOTICE file
// distributed with this work for additional information regarding copyright
// ownership.
//
// Camunda licenses this file to you under the MIT; you may not use this file
// except in compliance with the MIT License.

//! Faithful Rust port of `app/lib/file-context/indexer.js` (read + process +
//! message lifecycle).
//!
//! The Electron indexer is asynchronous (a workqueue gates a `workqueue:empty`
//! ready signal); this port processes SYNCHRONOUSLY because the async gating is
//! an integration concern handled in a later phase. Each `add` reads the file
//! (10 MB cap, utf-8), runs the matching processor and stores the resulting
//! [`IndexItem`], emitting an [`IndexerEvent::Updated`]; `remove` deletes and
//! emits [`IndexerEvent::Removed`]. Item `file`/`metadata` are `serde_json`
//! values so the shapes match the Electron backend exactly (trivial to
//! serialize for the renderer in a later phase).
//!
//! Note: the JS `_processItem` short-circuit on `item.error` is dead code (no
//! code path sets `item.error`), so a read-failed file is still handed to its
//! processor; with `contents: null` the processor returns the empty-metadata
//! shape and the `read-error` message is retained.

use std::collections::HashMap;

use serde_json::{json, Value};

use crate::file_system;
use crate::processors;
use crate::watcher::{to_file_path, to_file_url};

const MAX_FILE_SIZE: u64 = 10 * 1024 * 1024; // 10 MB

/// An indexed file: `{ uri, processor?, file, metadata }`, mirroring the JS
/// `IndexItem`.
#[derive(Debug, Clone)]
pub struct IndexItem {
    pub uri: String,
    pub processor: Option<String>,
    pub file: Value,
    pub metadata: Value,
}

impl IndexItem {
    /// The renderer-facing JSON shape (`{ uri, processor, file, metadata }`).
    pub fn to_value(&self) -> Value {
        json!({
            "uri": self.uri,
            "processor": self.processor,
            "file": self.file,
            "metadata": self.metadata
        })
    }
}

/// Emitted as items are indexed/removed, mirroring the `updated`/`removed`
/// events on the indexer's event bus.
#[derive(Debug, Clone)]
pub enum IndexerEvent {
    Updated(IndexItem),
    Removed(IndexItem),
}

type Sink = Box<dyn FnMut(IndexerEvent) + Send>;

/// Indexes file-context items, a port of `indexer.js`.
#[derive(Default)]
pub struct Indexer {
    items: HashMap<String, IndexItem>,
    sink: Option<Sink>,
}

impl Indexer {
    pub fn new() -> Self {
        Self::default()
    }

    /// Install a sink for [`IndexerEvent`]s (the event bus in production; a
    /// collecting closure in tests).
    pub fn with_sink(sink: Sink) -> Self {
        Self { items: HashMap::new(), sink: Some(sink) }
    }

    /// Add (or re-index) the file at `uri`. Reads, processes and stores the
    /// item, then emits [`IndexerEvent::Updated`]; returns the indexed item.
    ///
    /// `processor` (an explicit processor id) is only honored when the item is
    /// first created, mirroring `indexer.js` `add`.
    pub fn add(&mut self, uri: &str, processor: Option<String>) -> IndexItem {
        let uri = to_file_url(uri);

        self.items.entry(uri.clone()).or_insert_with(|| IndexItem {
            uri: uri.clone(),
            processor,
            file: create_descriptor(&uri, Value::String(String::new())),
            metadata: Value::Null,
        });

        self.parse_item(&uri)
    }

    /// Notify that a file was updated (re-index), mirroring `fileUpdated`.
    pub fn file_updated(&mut self, uri: &str, processor: Option<String>) -> IndexItem {
        self.add(uri, processor)
    }

    /// Remove the item at `uri`, emitting [`IndexerEvent::Removed`].
    pub fn remove(&mut self, uri: &str) {
        let uri = to_file_url(uri);

        if let Some(item) = self.items.remove(&uri) {
            self.emit(IndexerEvent::Removed(item));
        }
    }

    /// Notify that a file was closed, mirroring `fileClosed` (removes the item).
    pub fn file_closed(&mut self, uri: &str) {
        self.remove(uri);
    }

    /// The item at `uri`, if indexed.
    pub fn get(&self, uri: &str) -> Option<&IndexItem> {
        self.items.get(&to_file_url(uri))
    }

    /// All known items.
    pub fn get_items(&self) -> Vec<&IndexItem> {
        self.items.values().collect()
    }

    fn parse_item(&mut self, uri: &str) -> IndexItem {
        let mut item = self.items.get(uri).cloned().expect("item present");

        read_item(&mut item);
        process_item(&mut item);

        self.items.insert(uri.to_string(), item.clone());

        self.emit(IndexerEvent::Updated(item.clone()));

        item
    }

    fn emit(&mut self, event: IndexerEvent) {
        if let Some(sink) = self.sink.as_mut() {
            sink(event);
        }
    }
}

/// Mirror `_readItem`: stat (10 MB cap), read utf-8 into `file.contents`,
/// removing any prior `read-error`. On failure, build a `{ contents: null }`
/// descriptor carrying a `read-error` message.
fn read_item(item: &mut IndexItem) {
    let path = to_file_path(&item.uri);
    let path = path.to_string_lossy().into_owned();

    item.file = match read_within_limit(&path) {
        Ok(mut file) => {
            remove_message(&mut file, "read-error");
            file
        },
        Err(message) => {
            let mut file = create_descriptor(&item.uri, Value::Null);
            add_message(&mut file, &message, "read-error", true);
            file
        },
    };
}

fn read_within_limit(path: &str) -> Result<Value, String> {
    let metadata = std::fs::metadata(path).map_err(|err| err.to_string())?;

    if metadata.len() > MAX_FILE_SIZE {
        return Err(format!("File size exceeds limit of {MAX_FILE_SIZE} bytes"));
    }

    // Node's `readFileSync(path, 'utf8')` replaces invalid byte sequences rather
    // than failing; read bytes and decode lossily to match.
    let bytes = std::fs::read(path).map_err(|err| err.to_string())?;
    let contents = String::from_utf8_lossy(&bytes).into_owned();

    Ok(create_descriptor_for_path(path, Value::String(contents)))
}

/// Mirror `_processItem`: run the processor, storing `metadata` (or `null` on
/// error) and reconciling the `process-error` message.
fn process_item(item: &mut IndexItem) {
    match processors::process(&item.file, item.processor.as_deref()) {
        Ok(metadata) => {
            item.metadata = metadata;
            remove_message(&mut item.file, "process-error");
        },
        Err(message) => {
            item.metadata = Value::Null;
            add_message(&mut item.file, &message, "process-error", true);
        },
    }
}

/// `createFile({ path: toFilePath(uri), contents })`.
fn create_descriptor(uri: &str, contents: Value) -> Value {
    let path = to_file_path(uri);
    create_descriptor_for_path(&path.to_string_lossy(), contents)
}

fn create_descriptor_for_path(path: &str, contents: Value) -> Value {
    file_system::create_file(&json!({}), &json!({ "path": path, "contents": contents }))
}

/// Mirror `addMessage`: de-dupe by `source`, then append `{ error, message,
/// source }`.
fn add_message(file: &mut Value, message: &str, source: &str, error: bool) {
    remove_message(file, source);

    if !file.get("messages").is_some_and(Value::is_array) {
        file["messages"] = json!([]);
    }

    if let Some(messages) = file.get_mut("messages").and_then(Value::as_array_mut) {
        messages.push(json!({ "error": error, "message": message, "source": source }));
    }
}

/// Mirror `removeMessage`: drop any message with the given `source`.
fn remove_message(file: &mut Value, source: &str) {
    if let Some(messages) = file.get_mut("messages").and_then(Value::as_array_mut) {
        messages.retain(|message| message.get("source").and_then(Value::as_str) != Some(source));
    }
}
