// Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
// under one or more contributor license agreements. See the NOTICE file
// distributed with this work for additional information regarding copyright
// ownership.
//
// Camunda licenses this file to you under the MIT; you may not use this file
// except in compliance with the MIT License.

// Prevent an extra console window on Windows in release.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    camunda_modeler_tauri_lib::run()
}
