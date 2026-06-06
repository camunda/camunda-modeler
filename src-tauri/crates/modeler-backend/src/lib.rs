// Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
// under one or more contributor license agreements. See the NOTICE file
// distributed with this work for additional information regarding copyright
// ownership.
//
// Camunda licenses this file to you under the MIT; you may not use this file
// except in compliance with the MIT License.

//! Pure backend logic for the Camunda Modeler Tauri migration.
//!
//! Tauri-free on purpose: this crate holds the parity-critical behavior so it
//! can be tested quickly with `cargo test` (no WebKit toolchain) and is the
//! same logic the thin Tauri command layer calls.

pub mod config;
pub mod dispatch;
pub mod error;
pub mod file_context;
pub mod file_system;
pub mod flags;
pub mod indexer;
pub mod processors;
pub mod watcher;
pub mod workspace;
pub mod zeebe;
pub mod zeebe_utils;

pub use config::Config;
pub use dispatch::{dispatch, ALLOWED_EVENTS};
pub use error::IpcError;
pub use file_context::{ChangedSink, FileContext};
pub use indexer::{IndexItem, Indexer, IndexerEvent};
pub use watcher::{Watcher, WatcherEvent};
