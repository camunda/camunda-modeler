// Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
// under one or more contributor license agreements. See the NOTICE file
// distributed with this work for additional information regarding copyright
// ownership.
//
// Camunda licenses this file to you under the MIT; you may not use this file
// except in compliance with the MIT License.

//! Parity tests for the Zeebe pure helpers, mirroring
//! `app/test/spec/zeebe-api/utils-spec.js` case-for-case.

use modeler_backend::zeebe_utils::{
    is_grpc_saas_url, is_rest_saas_url, is_saas_url, remove_v2_or_slashes,
    sanitize_camunda_client_options, sanitize_config_with_endpoint,
};
use serde_json::json;

#[test]
fn is_saas_url_true_for_saas_urls() {
    assert!(is_saas_url("https://foo.jfk-1.zeebe.camunda.io:443/"));
    assert!(is_saas_url("https://foo.jfk-1.zeebe.camunda.io"));
    assert!(is_saas_url("grpcs://foo.jfk-1.zeebe.camunda.io"));
    assert!(is_saas_url("https://jfk-1.zeebe.camunda.io:443/foo"));
    assert!(is_saas_url("https://jfk-1.zeebe.camunda.io/foo"));
}

#[test]
fn is_saas_url_false_for_non_saas_urls() {
    assert!(!is_saas_url("https://foo.zeebe.camunda.com:443"));
    assert!(!is_saas_url("https://foo.zeebe.camunda.io:443/bpmn"));
    assert!(!is_saas_url("https://jfk-1.zeebe.camunda.io:443/"));
    assert!(!is_saas_url("https://bar.zeebe.camunda.io:443/foo"));
}

#[test]
fn is_grpc_saas_url_cases() {
    assert!(is_grpc_saas_url("https://foo.jfk-1.zeebe.camunda.io:443/"));
    assert!(is_grpc_saas_url("https://foo.jfk-1.zeebe.camunda.io"));
    assert!(is_grpc_saas_url("grpcs://foo.jfk-1.zeebe.camunda.io"));

    assert!(!is_grpc_saas_url("https://foo.zeebe.camunda.com:443"));
    assert!(!is_grpc_saas_url("https://foo.zeebe.camunda.io:443/bpmn"));
}

#[test]
fn is_rest_saas_url_cases() {
    assert!(is_rest_saas_url("https://jfk-1.zeebe.camunda.io:443/foo"));
    assert!(is_rest_saas_url("https://jfk-1.zeebe.camunda.io/foo"));

    assert!(!is_rest_saas_url("https://jfk-1.zeebe.camunda.io:443/"));
    assert!(!is_rest_saas_url("https://bar.zeebe.camunda.io:443/foo"));
}

#[test]
fn sanitize_camunda_client_options_replaces_secrets() {
    let options = json!({
        "ZEEBE_CLIENT_SECRET": "secret",
        "CAMUNDA_CONSOLE_CLIENT_SECRET": "secret",
        "CAMUNDA_BASIC_AUTH_PASSWORD": "secret",
        "CAMUNDA_CUSTOM_ROOT_CERT_STRING": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----\n"
    });

    assert_eq!(
        sanitize_camunda_client_options(&options),
        json!({
            "ZEEBE_CLIENT_SECRET": "******",
            "CAMUNDA_CONSOLE_CLIENT_SECRET": "******",
            "CAMUNDA_BASIC_AUTH_PASSWORD": "******",
            "CAMUNDA_CUSTOM_ROOT_CERT_STRING": "..."
        })
    );
}

#[test]
fn sanitize_camunda_client_options_keeps_non_secrets() {
    let options = json!({
        "CAMUNDA_AUTH_STRATEGY": "OAUTH",
        "ZEEBE_CLIENT_ID": "client-id"
    });

    assert_eq!(sanitize_camunda_client_options(&options), options);
}

#[test]
fn sanitize_config_with_endpoint_replaces_nested_secrets() {
    let config = json!({
        "endpoint": {
            "clientSecret": "secret",
            "basicAuthPassword": "secret"
        },
        "tenantId": "tenant-id"
    });

    assert_eq!(
        sanitize_config_with_endpoint(&config),
        json!({
            "endpoint": {
                "clientSecret": "******",
                "basicAuthPassword": "******"
            },
            "tenantId": "tenant-id"
        })
    );
}

#[test]
fn sanitize_config_with_endpoint_keeps_non_secrets() {
    let config = json!({
        "endpoint": { "clientId": "client-id" },
        "tenantId": "tenant-id"
    });

    assert_eq!(sanitize_config_with_endpoint(&config), config);
}

#[test]
fn remove_v2_or_slashes_cases() {
    let cases = [
        ("https://example.com", "https://example.com"),
        ("https://example.com/", "https://example.com"),
        ("https://example.com/v2", "https://example.com"),
        ("https://example.com/v2/", "https://example.com"),
        ("https://example.com/v2/v2", "https://example.com/v2"),
        ("https://example.com/v2?a=1#top", "https://example.com?a=1#top"),
        (
            "https://example.com/api/v2/resources",
            "https://example.com/api/v2/resources",
        ),
        ("https://example.com/api/", "https://example.com/api"),
        ("https://example.com:8080/v2", "https://example.com:8080"),
        ("https://localhost:8080/v2", "https://localhost:8080"),
    ];

    for (input, expected) in cases {
        assert_eq!(remove_v2_or_slashes(input), expected, "input: {input}");
    }
}
