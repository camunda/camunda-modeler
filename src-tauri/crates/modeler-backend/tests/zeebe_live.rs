// Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
// under one or more contributor license agreements. See the NOTICE file
// distributed with this work for additional information regarding copyright
// ownership.
//
// Camunda licenses this file to you under the MIT; you may not use this file
// except in compliance with the MIT License.

//! Live integration tests for the Zeebe REST port against a running Camunda 8
//! Orchestration Cluster.
//!
//! These hit the network, so they are **gated** behind `RUN_ZEEBE_LIVE=1` and
//! are skipped by default (CI/hermetic runs). Point them at a cluster with:
//!
//! ```sh
//! RUN_ZEEBE_LIVE=1 ZEEBE_REST_URL=http://localhost:8080/v2 \
//!   cargo test -p modeler-backend --test zeebe_live -- --nocapture
//! ```

use std::path::PathBuf;

use serde_json::{json, Value};

use modeler_backend::zeebe;

fn live_enabled() -> bool {
    std::env::var("RUN_ZEEBE_LIVE").map(|v| v == "1").unwrap_or(false)
}

fn base_url() -> String {
    std::env::var("ZEEBE_REST_URL").unwrap_or_else(|_| "http://localhost:8080/v2".to_string())
}

fn endpoint() -> Value {
    json!({
        "type": "selfHosted",
        "authType": "none",
        "url": base_url()
    })
}

fn fixture(relative: &str) -> String {
    // crate root is src-tauri/crates/modeler-backend; the fixtures live under the
    // Electron app sources four levels up.
    let mut path = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    path.pop(); // crates
    path.pop(); // src-tauri
    path.pop(); // repo root
    path.push(relative);
    path.to_string_lossy().into_owned()
}

#[tokio::test]
async fn check_connection_reports_rest_gateway_version() {
    if !live_enabled() {
        return;
    }

    let result = zeebe::handle("zeebe:checkConnection", &[json!({ "endpoint": endpoint() })]).await;

    assert_eq!(result["success"], json!(true), "result: {result}");
    assert_eq!(result["response"]["protocol"], json!("rest"));
    assert!(
        result["response"]["gatewayVersion"].is_string(),
        "gatewayVersion missing: {result}"
    );
}

#[tokio::test]
async fn search_process_instances_succeeds() {
    if !live_enabled() {
        return;
    }

    let result = zeebe::handle(
        "zeebe:searchProcessInstances",
        &[json!({ "endpoint": endpoint(), "processInstanceKey": "1" })],
    )
    .await;

    assert_eq!(result["success"], json!(true), "result: {result}");
    assert!(result["response"].is_object(), "response: {result}");
}

#[tokio::test]
async fn deploy_then_start_instance_round_trips() {
    if !live_enabled() {
        return;
    }

    let resource =
        fixture("app/lib/file-context/processors/__tests__/fixtures/camunda8.bpmn");

    let deploy_result = zeebe::handle(
        "zeebe:deploy",
        &[json!({
            "endpoint": endpoint(),
            "resourceConfigs": [ { "path": resource, "type": "bpmn" } ]
        })],
    )
    .await;

    assert_eq!(deploy_result["success"], json!(true), "deploy: {deploy_result}");

    let response = &deploy_result["response"];

    // gRPC-compatible aliases the renderer relies on.
    assert!(response["key"].is_string(), "missing key: {response}");

    let process = &response["deployments"][0]["process"];
    assert!(
        process["bpmnProcessId"].is_string(),
        "missing bpmnProcessId: {response}"
    );

    let process_definition_key = response["deployments"][0]["processDefinition"]
        ["processDefinitionKey"]
        .clone();
    assert!(process_definition_key.is_string(), "missing key: {response}");

    let start_result = zeebe::handle(
        "zeebe:startInstance",
        &[json!({
            "endpoint": endpoint(),
            "processDefinitionKey": process_definition_key
        })],
    )
    .await;

    assert_eq!(start_result["success"], json!(true), "start: {start_result}");
    assert!(
        start_result["response"]["processInstanceKey"].is_string()
            || start_result["response"]["processInstanceKey"].is_number(),
        "missing processInstanceKey: {start_result}"
    );
}
