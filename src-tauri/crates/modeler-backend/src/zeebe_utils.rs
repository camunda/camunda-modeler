// Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
// under one or more contributor license agreements. See the NOTICE file
// distributed with this work for additional information regarding copyright
// ownership.
//
// Camunda licenses this file to you under the MIT; you may not use this file
// except in compliance with the MIT License.

//! Pure helpers for the Zeebe / Camunda 8 client, a faithful port of
//! `app/lib/zeebe-api/utils.js`.
//!
//! These are the parts of the zeebe-api that have no network dependency: SaaS
//! URL detection, config/option sanitization for logging, and Camunda 8 REST
//! base-URL normalization. They are locked by parity tests mirroring
//! `app/test/spec/zeebe-api/utils-spec.js`. The networked client (gRPC deploy /
//! start / topology, the REST `search*` endpoints, OAuth and mTLS) is a separate
//! slice that requires the Zeebe gateway proto and a live cluster to validate.

use std::sync::OnceLock;

use regex::Regex;
use serde_json::{Map, Value};

/// `isGrpcSaasUrl`: matches a Camunda 8 SaaS gRPC URL such as
/// `https://foo.jfk-1.zeebe.camunda.io:443/`.
pub fn is_grpc_saas_url(url: &str) -> bool {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| {
        Regex::new(r"^((https|grpcs)://|)[a-z\d-]+\.[a-z]+-\d+\.zeebe\.camunda\.io(:443|)/?")
            .expect("valid grpc saas regex")
    })
    .is_match(url)
}

/// `isRestSaasUrl`: matches a Camunda 8 SaaS REST URL such as
/// `https://jfk-1.zeebe.camunda.io:443/foo`.
pub fn is_rest_saas_url(url: &str) -> bool {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| {
        Regex::new(r"^https://[a-z]+-\d+\.zeebe\.camunda\.io(:443|)/[a-z\d-]+/?")
            .expect("valid rest saas regex")
    })
    .is_match(url)
}

/// `isSaasUrl`: a gRPC or REST SaaS URL.
pub fn is_saas_url(url: &str) -> bool {
    is_grpc_saas_url(url) || is_rest_saas_url(url)
}

/// `sanitizeCamundaClientOptions`: replace secret client options with
/// placeholders so they can be safely logged.
pub fn sanitize_camunda_client_options(options: &Value) -> Value {
    sanitize_object(
        options,
        &[
            ("ZEEBE_CLIENT_SECRET", Sanitization::Secret),
            ("CAMUNDA_CONSOLE_CLIENT_SECRET", Sanitization::Secret),
            ("CAMUNDA_BASIC_AUTH_PASSWORD", Sanitization::Secret),
            ("CAMUNDA_CUSTOM_ROOT_CERT_STRING", Sanitization::Blob),
        ],
    )
}

/// `sanitizeConfigWithEndpoint`: replace `clientSecret`/`basicAuthPassword`
/// anywhere in the config with placeholders so it can be safely logged.
pub fn sanitize_config_with_endpoint(config: &Value) -> Value {
    sanitize_object(
        config,
        &[
            ("clientSecret", Sanitization::Secret),
            ("basicAuthPassword", Sanitization::Secret),
        ],
    )
}

#[derive(Clone, Copy)]
enum Sanitization {
    Secret,
    Blob,
}

/// Deep-clone `value`, replacing any property whose key matches one of
/// `sanitizations` with the corresponding placeholder, mirroring the
/// `JSON.stringify` replacer the JS uses (so the replacement applies at every
/// nesting level, as the parity tests for nested `endpoint` require).
fn sanitize_object(value: &Value, sanitizations: &[(&str, Sanitization)]) -> Value {
    match value {
        Value::Object(map) => {
            let mut out = Map::with_capacity(map.len());

            for (key, child) in map {
                let replaced = match sanitizations.iter().find(|(k, _)| k == key) {
                    Some((_, Sanitization::Secret)) => Value::String("******".into()),
                    Some((_, Sanitization::Blob)) => Value::String("...".into()),
                    None => sanitize_object(child, sanitizations),
                };

                out.insert(key.clone(), replaced);
            }

            Value::Object(out)
        },
        Value::Array(items) => {
            Value::Array(items.iter().map(|item| sanitize_object(item, sanitizations)).collect())
        },
        other => other.clone(),
    }
}

/// `removeV2OrSlashes`: strip trailing slashes and a single trailing `/v2` from
/// a Camunda 8 REST base URL (the codebase is inconsistent about the `/v2`
/// suffix). Empty/non-URL inputs are returned unchanged, mirroring the JS guard.
pub fn remove_v2_or_slashes(url: &str) -> String {
    if url.is_empty() {
        return url.to_string();
    }

    let Ok(mut parsed) = url::Url::parse(url) else {
        return url.to_string();
    };

    let mut pathname = parsed.path().to_string();

    while pathname.ends_with('/') {
        pathname.pop();
    }

    if pathname.ends_with("/v2") {
        pathname.truncate(pathname.len() - 3);
    }

    parsed.set_path(if pathname.is_empty() { "/" } else { &pathname });

    // Mirror `href.replace(/\/(\?|#|$)/, '$1')`: drop the first `/` that is
    // immediately followed by the query, the fragment, or the end of the URL.
    let href = parsed.as_str();

    if let Some(index) = href.find("/?") {
        return format!("{}{}", &href[..index], &href[index + 1..]);
    }

    if let Some(index) = href.find("/#") {
        return format!("{}{}", &href[..index], &href[index + 1..]);
    }

    href.strip_suffix('/').unwrap_or(href).to_string()
}
