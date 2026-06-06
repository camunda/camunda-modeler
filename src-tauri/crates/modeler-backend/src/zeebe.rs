// Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
// under one or more contributor license agreements. See the NOTICE file
// distributed with this work for additional information regarding copyright
// ownership.
//
// Camunda licenses this file to you under the MIT; you may not use this file
// except in compliance with the MIT License.

//! Zeebe/Camunda 8 IPC endpoints, ported from `app/lib/zeebe-api/zeebe-api.js`.
//!
//! This is a **REST-only** port (the renderer talks to the Orchestration
//! Cluster REST API at `{base}/v2/...`); the Electron app also supported gRPC,
//! which is intentionally dropped here.
//!
//! Parity contract (mirrors the JS methods exactly):
//!   - The JS handlers NEVER reject — they catch internally and resolve a
//!     `{ success: bool, ... }` object. So [`handle`] ALWAYS returns that
//!     object (the Tauri command returns `Ok(value)`).
//!   - `getGatewayVersion`/`checkConnection`/`search*` failures →
//!     `{ success: false, reason: <ERROR_REASON> }`.
//!   - `deploy`/`startInstance` failures →
//!     `{ success: false, response: <pick(err, [message, code, details])> }`.
//!
//! The parity-critical logic (request-body building, deploy-response mapping,
//! resource naming, error→reason mapping) lives in pure functions that are unit
//! tested without any network access; the async functions are thin reqwest glue.

use std::time::Duration;

use serde_json::{json, Map, Value};

use crate::zeebe_utils::remove_v2_or_slashes;

// ERROR_REASONS (zeebe-api.js).
const UNKNOWN: &str = "UNKNOWN";
const CONTACT_POINT_UNAVAILABLE: &str = "CONTACT_POINT_UNAVAILABLE";
const UNAUTHORIZED: &str = "UNAUTHORIZED";
const CLUSTER_UNAVAILABLE: &str = "CLUSTER_UNAVAILABLE";
const FORBIDDEN: &str = "FORBIDDEN";
const OAUTH_URL: &str = "OAUTH_URL";
const UNSUPPORTED_ENGINE: &str = "UNSUPPORTED_ENGINE";
const INVALID_CLIENT_ID: &str = "INVALID_CLIENT_ID";
const INVALID_CREDENTIALS: &str = "INVALID_CREDENTIALS";

// ENDPOINT_TYPES / AUTH_TYPES (constants.js).
const ENDPOINT_TYPE_CAMUNDA_CLOUD: &str = "camundaCloud";
const ENDPOINT_TYPE_SELF_HOSTED: &str = "selfHosted";
const AUTH_TYPE_NONE: &str = "none";
const AUTH_TYPE_BASIC: &str = "basic";
const AUTH_TYPE_OAUTH: &str = "oauth";

const DEFAULT_CLOUD_OAUTH_URL: &str = "https://login.cloud.camunda.io/oauth/token";

/// Normalized endpoint, as produced by `getEndpointForTargetType` in
/// `client/src/remote/ZeebeAPI.js` and sent over IPC.
#[derive(Debug, Clone, Default)]
pub struct Endpoint {
    pub type_: String,
    pub auth_type: String,
    pub url: String,
    pub tenant_id: Option<String>,
    pub basic_auth_username: Option<String>,
    pub basic_auth_password: Option<String>,
    pub client_id: Option<String>,
    pub client_secret: Option<String>,
    pub oauth_url: Option<String>,
    pub audience: Option<String>,
    pub scope: Option<String>,
}

impl Endpoint {
    fn from_value(value: &Value) -> Self {
        let s = |key: &str| value.get(key).and_then(Value::as_str).map(str::to_string);

        Endpoint {
            type_: s("type").unwrap_or_default(),

            // `authType = AUTH_TYPES.NONE` default in getErrorReason/_getClientConfig.
            auth_type: s("authType").unwrap_or_else(|| AUTH_TYPE_NONE.to_string()),
            url: s("url").unwrap_or_default(),
            tenant_id: s("tenantId"),
            basic_auth_username: s("basicAuthUsername"),
            basic_auth_password: s("basicAuthPassword"),
            client_id: s("clientId"),
            client_secret: s("clientSecret"),
            oauth_url: s("oauthURL"),
            audience: s("audience"),
            scope: s("scope"),
        }
    }

    fn is_cloud(&self) -> bool {
        self.type_ == ENDPOINT_TYPE_CAMUNDA_CLOUD
    }

    /// REST base, i.e. the URL with a trailing `/v2` (and slashes) removed.
    fn base_url(&self) -> String {
        remove_v2_or_slashes(&self.url)
    }
}

/// Error model mirroring the fields `getErrorReason`/`asSerializedError`
/// read off the JS error object.
#[derive(Debug, Clone, Default)]
struct ZeebeError {
    message: String,
    http_status: Option<u16>,
    code: Option<i64>,
    details: Option<Value>,
}

impl ZeebeError {
    fn message(message: impl Into<String>) -> Self {
        ZeebeError {
            message: message.into(),
            ..Default::default()
        }
    }
}

// ---------------------------------------------------------------------------
// Pure helpers (unit-tested without network access).
// ---------------------------------------------------------------------------

/// JS truthiness for the values the renderer sends (used for the
/// `if (processDefinitionKey)` branch in `startInstance`).
fn is_truthy(value: Option<&Value>) -> bool {
    match value {
        None | Some(Value::Null) => false,
        Some(Value::Bool(b)) => *b,
        Some(Value::String(s)) => !s.is_empty(),
        Some(Value::Number(n)) => n.as_f64().map(|f| f != 0.0).unwrap_or(false),

        // objects/arrays are truthy
        Some(_) => true,
    }
}

/// Insert `key: value` only when `value` is present and not `null` (mirrors
/// `JSON.stringify` dropping `undefined` while keeping every other value).
fn insert_if_present(map: &mut Map<String, Value>, key: &str, value: Option<&Value>) {
    if let Some(v) = value {
        if !v.is_null() {
            map.insert(key.to_string(), v.clone());
        }
    }
}

/// Node `path.extname`: the extension of the final path segment, including the
/// leading dot, or `""` when there is none (a leading dot does not count).
fn node_extname(path: &str) -> String {
    let base = node_basename(path, "");

    match base.rfind('.') {
        Some(0) | None => String::new(),
        Some(idx) => base[idx..].to_string(),
    }
}

/// Node `path.basename(path[, ext])`: the final path segment, with `ext`
/// stripped only when the segment ends with it and is not equal to it.
fn node_basename(path: &str, ext: &str) -> String {
    let trimmed = path.trim_end_matches(['/', '\\']);

    let base = trimmed
        .rsplit(['/', '\\'])
        .next()
        .unwrap_or(trimmed)
        .to_string();

    if !ext.is_empty() && base != ext && base.ends_with(ext) {
        return base[..base.len() - ext.len()].to_string();
    }

    base
}

/// Deployment resource name, mirroring `_getCamundaResources`:
/// `basename(path, extname(path)) + "." + type`.
fn resource_name(path: &str, resource_type: &str) -> String {
    let ext = node_extname(path);
    let stem = node_basename(path, &ext);

    format!("{stem}.{resource_type}")
}

/// Best-effort MIME inference for a deployment resource (matches the OCA SDK's
/// `deployResourcesFromFiles`).
fn resource_mime(name: &str) -> &'static str {
    match name.rsplit('.').next().map(str::to_ascii_lowercase).as_deref() {
        Some("bpmn") | Some("dmn") | Some("xml") => "application/xml",
        Some("json") | Some("form") => "application/json",
        _ => "application/octet-stream",
    }
}

/// Build the `startInstance` request body (pure port of the JS logic).
fn start_instance_body(config: &Value) -> Value {
    let mut body = Map::new();

    insert_if_present(&mut body, "variables", config.get("variables"));
    insert_if_present(&mut body, "startInstructions", config.get("startInstructions"));
    insert_if_present(&mut body, "runtimeInstructions", config.get("runtimeInstructions"));
    insert_if_present(&mut body, "businessId", config.get("businessId"));

    if is_truthy(config.get("processDefinitionKey")) {
        insert_if_present(&mut body, "processDefinitionKey", config.get("processDefinitionKey"));
    } else {
        insert_if_present(&mut body, "processDefinitionId", config.get("processId"));
    }

    Value::Object(body)
}

/// `{ filter: { processInstanceKey } }` search body.
fn search_body(process_instance_key: Option<&Value>) -> Value {
    let mut filter = Map::new();
    insert_if_present(&mut filter, "processInstanceKey", process_instance_key);

    json!({ "filter": Value::Object(filter) })
}

/// Map a REST deployment response so it is compatible with the gRPC response
/// shape the renderer expects (port of the `deployments.map(...)` block).
fn map_deploy_response(response: Value) -> Value {
    let mut obj = match response {
        Value::Object(map) => map,
        other => return other,
    };

    if let Some(deployment_key) = obj.get("deploymentKey").cloned() {
        obj.insert("key".to_string(), deployment_key);
    }

    if let Some(Value::Array(deployments)) = obj.get("deployments").cloned() {
        let mapped: Vec<Value> = deployments.into_iter().map(map_deployment).collect();
        obj.insert("deployments".to_string(), Value::Array(mapped));
    }

    Value::Object(obj)
}

fn map_deployment(deployment: Value) -> Value {
    let mut obj = match deployment {
        Value::Object(map) => map,
        other => return other,
    };

    if let Some(Value::Object(process_definition)) = non_null(obj.get("processDefinition")) {
        let mut process = process_definition.clone();
        copy_alias(&mut process, "bpmnProcessId", process_definition.get("processDefinitionId"));
        copy_alias(&mut process, "version", process_definition.get("processDefinitionVersion"));
        obj.insert("process".to_string(), Value::Object(process));
        return Value::Object(obj);
    }

    if let Some(Value::Object(decision_definition)) = non_null(obj.get("decisionDefinition")) {
        let mut decision = decision_definition.clone();
        let id = decision_definition.get("decisionDefinitionId");
        copy_alias(&mut decision, "decisionId", id);
        copy_alias(&mut decision, "dmnDecisionId", id);
        copy_alias(&mut decision, "dmnDecisionName", decision_definition.get("name"));
        copy_alias(
            &mut decision,
            "dmnDecisionRequirementsId",
            decision_definition.get("decisionRequirementsId"),
        );
        copy_alias(
            &mut decision,
            "decisionKey",
            decision_definition.get("decisionDefinitionKey"),
        );
        obj.insert("decision".to_string(), Value::Object(decision));
        return Value::Object(obj);
    }

    if let Some(Value::Object(decision_requirements)) = non_null(obj.get("decisionRequirements")) {
        let mut dr = decision_requirements.clone();
        copy_alias(
            &mut dr,
            "dmnDecisionRequirementsId",
            decision_requirements.get("decisionRequirementsId"),
        );
        copy_alias(
            &mut dr,
            "dmnDecisionRequirementsName",
            decision_requirements.get("decisionRequirementsName"),
        );
        obj.insert("decisionRequirements".to_string(), Value::Object(dr));
        return Value::Object(obj);
    }

    Value::Object(obj)
}

/// `Some(value)` only when the field is present and not `null` (JS truthiness
/// for the `if (deployment.processDefinition)` guards).
fn non_null(value: Option<&Value>) -> Option<&Value> {
    value.filter(|v| !v.is_null())
}

fn copy_alias(target: &mut Map<String, Value>, key: &str, value: Option<&Value>) {
    if let Some(value) = value {
        target.insert(key.to_string(), value.clone());
    }
}

/// `asSerializedError` — `pick(err, ['message', 'code', 'details'])`.
fn as_serialized_error(err: &ZeebeError) -> Value {
    let mut obj = Map::new();
    obj.insert("message".to_string(), Value::String(err.message.clone()));

    if let Some(code) = err.code {
        obj.insert("code".to_string(), json!(code));
    }
    if let Some(details) = &err.details {
        obj.insert("details".to_string(), details.clone());
    }

    Value::Object(obj)
}

/// Port of `getErrorReason(error, endpoint)`.
fn get_error_reason(err: &ZeebeError, endpoint: &Endpoint) -> &'static str {
    let code = err.code;
    let http_status = err.http_status;
    let message = &err.message;

    let is_cloud = endpoint.is_cloud();
    let is_oauth = endpoint.auth_type == AUTH_TYPE_OAUTH;

    // (1) handle errors
    if code == Some(14) || code == Some(13) || http_status == Some(503) {
        return if is_cloud {
            CLUSTER_UNAVAILABLE
        } else {
            CONTACT_POINT_UNAVAILABLE
        };
    } else if code == Some(12) {
        return UNSUPPORTED_ENGINE;
    }

    // (2) handle <unknown>
    if message.is_empty() {
        return UNKNOWN;
    }

    // (3) handle <not found>
    if message.contains("ENOTFOUND") || message.contains("Not Found") {
        if is_oauth {
            return OAUTH_URL;
        } else if is_cloud {
            return INVALID_CLIENT_ID;
        }

        return CONTACT_POINT_UNAVAILABLE;
    }

    // (4) handle other error messages
    if message.contains("Unauthorized") {
        return if is_cloud { INVALID_CREDENTIALS } else { UNAUTHORIZED };
    }

    if message.contains("Forbidden") {
        return FORBIDDEN;
    }

    if message.contains("Unsupported protocol") && is_oauth {
        return OAUTH_URL;
    }

    UNKNOWN
}

// ---------------------------------------------------------------------------
// Async REST client.
// ---------------------------------------------------------------------------

fn http_client() -> Result<reqwest::Client, ZeebeError> {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(15))
        .build()
        .map_err(|err| ZeebeError::message(err.to_string()))
}

/// Translate a transport-level reqwest error from a Zeebe REST request into the
/// gRPC-code-14 equivalent the JS error mapping relied on, or a plain message.
fn transport_error(err: reqwest::Error) -> ZeebeError {
    if err.is_connect() || err.is_timeout() {
        return ZeebeError {
            message: format!("14 UNAVAILABLE: {err}"),
            code: Some(14),
            ..Default::default()
        };
    }

    ZeebeError::message(err.to_string())
}

/// Translate a transport-level reqwest error from the OAuth token request. A
/// bad `oauthURL` should surface as `OAUTH_URL`/`INVALID_CLIENT_ID` rather than
/// the Zeebe endpoint being unavailable, so we steer the message toward the
/// `ENOTFOUND` branch of `getErrorReason`.
fn token_transport_error(err: reqwest::Error) -> ZeebeError {
    if err.is_connect() || err.is_timeout() {
        return ZeebeError::message(format!("ENOTFOUND {err}"));
    }

    ZeebeError::message(err.to_string())
}

/// Turn a non-2xx HTTP response into a `ZeebeError` carrying the canonical
/// status reason phrase (so `getErrorReason`'s substring checks match) plus the
/// response body title/detail when available.
async fn http_error(response: reqwest::Response) -> ZeebeError {
    let status = response.status();
    let reason = status.canonical_reason().unwrap_or("");

    let body = response.text().await.unwrap_or_default();

    let detail = serde_json::from_str::<Value>(&body)
        .ok()
        .and_then(|v| {
            v.get("detail")
                .or_else(|| v.get("title"))
                .and_then(Value::as_str)
                .map(str::to_string)
        })
        .filter(|s| !s.is_empty());

    let message = match detail {
        Some(detail) => format!("{} {}: {}", status.as_u16(), reason, detail),
        None => format!("{} {}", status.as_u16(), reason),
    };

    ZeebeError {
        message,
        http_status: Some(status.as_u16()),
        ..Default::default()
    }
}

/// Acquire an OAuth bearer token via the client-credentials grant.
async fn fetch_token(client: &reqwest::Client, endpoint: &Endpoint) -> Result<String, ZeebeError> {
    let oauth_url = if endpoint.is_cloud() {
        endpoint
            .oauth_url
            .clone()
            .unwrap_or_else(|| DEFAULT_CLOUD_OAUTH_URL.to_string())
    } else {
        endpoint
            .oauth_url
            .clone()
            .ok_or_else(|| ZeebeError::message("ENOTFOUND missing oauthURL"))?
    };

    let mut form = vec![
        ("grant_type", "client_credentials".to_string()),
        ("client_id", endpoint.client_id.clone().unwrap_or_default()),
        ("client_secret", endpoint.client_secret.clone().unwrap_or_default()),
    ];

    if let Some(audience) = &endpoint.audience {
        form.push(("audience", audience.clone()));
    }
    if let Some(scope) = endpoint.scope.as_ref().filter(|s| !s.is_empty()) {
        form.push(("scope", scope.clone()));
    }

    let response = client
        .post(&oauth_url)
        .form(&form)
        .send()
        .await
        .map_err(token_transport_error)?;

    if !response.status().is_success() {
        return Err(http_error(response).await);
    }

    let body: Value = response
        .json()
        .await
        .map_err(|err| ZeebeError::message(err.to_string()))?;

    body.get("access_token")
        .and_then(Value::as_str)
        .map(str::to_string)
        .ok_or_else(|| ZeebeError::message("Unauthorized: no access_token in token response"))
}

/// Apply the endpoint's auth scheme to a request builder.
async fn apply_auth(
    client: &reqwest::Client,
    endpoint: &Endpoint,
    request: reqwest::RequestBuilder,
) -> Result<reqwest::RequestBuilder, ZeebeError> {
    // Self-hosted with no auth (and the implicit default) → no auth header.
    if endpoint.type_ == ENDPOINT_TYPE_SELF_HOSTED && endpoint.auth_type == AUTH_TYPE_NONE {
        return Ok(request);
    }

    if endpoint.auth_type == AUTH_TYPE_BASIC {
        return Ok(request.basic_auth(
            endpoint.basic_auth_username.clone().unwrap_or_default(),
            endpoint.basic_auth_password.clone(),
        ));
    }

    // OAuth, or Camunda Cloud (which always uses OAuth).
    if endpoint.auth_type == AUTH_TYPE_OAUTH || endpoint.is_cloud() {
        let token = fetch_token(client, endpoint).await?;
        return Ok(request.bearer_auth(token));
    }

    Ok(request)
}

/// Execute a POST to `{base}/v2/{path}` with a JSON body and optional query
/// params, returning the parsed JSON response.
async fn post_json(
    endpoint: &Endpoint,
    path: &str,
    body: &Value,
    query: &[(&str, &str)],
) -> Result<Value, ZeebeError> {
    let client = http_client()?;
    let url = format!("{}/v2/{}", endpoint.base_url(), path);

    let mut request = client.post(&url).json(body);
    if !query.is_empty() {
        request = request.query(query);
    }
    request = apply_auth(&client, endpoint, request).await?;

    let response = request.send().await.map_err(transport_error)?;

    if !response.status().is_success() {
        return Err(http_error(response).await);
    }

    response
        .json()
        .await
        .map_err(|err| ZeebeError::message(err.to_string()))
}

async fn get_topology(endpoint: &Endpoint) -> Result<Value, ZeebeError> {
    let client = http_client()?;
    let url = format!("{}/v2/topology", endpoint.base_url());

    let mut request = client.get(&url);
    request = apply_auth(&client, endpoint, request).await?;

    let response = request.send().await.map_err(transport_error)?;

    if !response.status().is_success() {
        return Err(http_error(response).await);
    }

    response
        .json()
        .await
        .map_err(|err| ZeebeError::message(err.to_string()))
}

async fn deploy_resources(endpoint: &Endpoint, resource_configs: &Value) -> Result<Value, ZeebeError> {
    let configs = resource_configs.as_array().cloned().unwrap_or_default();

    let mut form = reqwest::multipart::Form::new();

    for config in &configs {
        let path = config
            .get("path")
            .and_then(Value::as_str)
            .ok_or_else(|| ZeebeError::message("Invalid resource config: missing path"))?;
        let resource_type = config.get("type").and_then(Value::as_str).unwrap_or_default();

        let name = resource_name(path, resource_type);
        let mime = resource_mime(&name);

        let contents = std::fs::read(path)
            .map_err(|err| ZeebeError::message(format!("{path}: {err}")))?;

        let part = reqwest::multipart::Part::bytes(contents)
            .file_name(name)
            .mime_str(mime)
            .map_err(|err| ZeebeError::message(err.to_string()))?;

        form = form.part("resources", part);
    }

    if let Some(tenant_id) = endpoint.tenant_id.as_ref().filter(|t| !t.is_empty()) {
        form = form.text("tenantId", tenant_id.clone());
    }

    let client = http_client()?;
    let url = format!("{}/v2/deployments", endpoint.base_url());

    let mut request = client.post(&url).multipart(form);
    request = apply_auth(&client, endpoint, request).await?;

    let response = request.send().await.map_err(transport_error)?;

    if !response.status().is_success() {
        return Err(http_error(response).await);
    }

    response
        .json()
        .await
        .map_err(|err| ZeebeError::message(err.to_string()))
}

// ---------------------------------------------------------------------------
// Operations (each returns the `{ success, ... }` parity object).
// ---------------------------------------------------------------------------

async fn get_gateway_version(endpoint: &Endpoint) -> Value {
    match get_topology(endpoint).await {
        Ok(topology) => {
            let gateway_version = topology.get("gatewayVersion").cloned().unwrap_or(Value::Null);

            json!({
                "success": true,
                "response": {
                    "protocol": "rest",
                    "gatewayVersion": gateway_version
                }
            })
        },
        Err(err) => json!({
            "success": false,
            "reason": get_error_reason(&err, endpoint)
        }),
    }
}

async fn deploy(endpoint: &Endpoint, config: &Value) -> Value {
    let resource_configs = config.get("resourceConfigs").cloned().unwrap_or(Value::Null);

    match deploy_resources(endpoint, &resource_configs).await {
        Ok(response) => json!({
            "success": true,
            "response": map_deploy_response(response)
        }),
        Err(err) => json!({
            "success": false,
            "response": as_serialized_error(&err)
        }),
    }
}

async fn start_instance(endpoint: &Endpoint, config: &Value) -> Value {
    let body = start_instance_body(config);

    match post_json(endpoint, "process-instances", &body, &[]).await {
        Ok(response) => json!({ "success": true, "response": response }),
        Err(err) => json!({
            "success": false,
            "response": as_serialized_error(&err)
        }),
    }
}

async fn search(endpoint: &Endpoint, path: &str, config: &Value, query: &[(&str, &str)]) -> Value {
    let body = search_body(config.get("processInstanceKey"));

    match post_json(endpoint, path, &body, query).await {
        Ok(response) => json!({ "success": true, "response": response }),
        Err(err) => json!({
            "success": false,
            "reason": get_error_reason(&err, endpoint)
        }),
    }
}

/// Dispatch a `zeebe:*` IPC event, always resolving the `{ success, ... }`
/// parity object (the JS handlers never reject).
pub async fn handle(event: &str, args: &[Value]) -> Value {
    let config = args.first().cloned().unwrap_or(Value::Null);
    let endpoint = Endpoint::from_value(config.get("endpoint").unwrap_or(&Value::Null));

    match event {
        "zeebe:checkConnection" | "zeebe:getGatewayVersion" => get_gateway_version(&endpoint).await,
        "zeebe:deploy" => deploy(&endpoint, &config).await,
        "zeebe:startInstance" => start_instance(&endpoint, &config).await,
        "zeebe:searchProcessInstances" => {
            search(&endpoint, "process-instances/search", &config, &[]).await
        },
        "zeebe:searchElementInstances" => {
            search(&endpoint, "element-instances/search", &config, &[]).await
        },
        "zeebe:searchVariables" => {
            search(&endpoint, "variables/search", &config, &[("truncateValues", "false")]).await
        },
        "zeebe:searchIncidents" => search(&endpoint, "incidents/search", &config, &[]).await,
        "zeebe:searchJobs" => search(&endpoint, "jobs/search", &config, &[]).await,
        "zeebe:searchMessageSubscriptions" => {
            search(&endpoint, "message-subscriptions/search", &config, &[]).await
        },
        "zeebe:searchUserTasks" => search(&endpoint, "user-tasks/search", &config, &[]).await,

        // Unknown zeebe event: surface a parity-shaped failure rather than panic.
        _ => json!({
            "success": false,
            "reason": UNKNOWN
        }),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn self_hosted_none() -> Endpoint {
        Endpoint {
            type_: ENDPOINT_TYPE_SELF_HOSTED.to_string(),
            auth_type: AUTH_TYPE_NONE.to_string(),
            url: "http://localhost:8080/v2".to_string(),
            ..Default::default()
        }
    }

    fn cloud() -> Endpoint {
        Endpoint {
            type_: ENDPOINT_TYPE_CAMUNDA_CLOUD.to_string(),
            auth_type: AUTH_TYPE_NONE.to_string(),
            ..Default::default()
        }
    }

    fn oauth() -> Endpoint {
        Endpoint {
            type_: ENDPOINT_TYPE_SELF_HOSTED.to_string(),
            auth_type: AUTH_TYPE_OAUTH.to_string(),
            ..Default::default()
        }
    }

    // --- endpoint parse -----------------------------------------------------

    #[test]
    fn endpoint_defaults_auth_type_to_none() {
        let endpoint = Endpoint::from_value(&json!({ "type": "selfHosted", "url": "x" }));
        assert_eq!(endpoint.auth_type, "none");
    }

    #[test]
    fn endpoint_base_url_strips_v2() {
        let endpoint = self_hosted_none();
        assert_eq!(endpoint.base_url(), "http://localhost:8080");
    }

    // --- resource naming (mirrors zeebe-api-rest-spec 'resource names') ------

    #[test]
    fn resource_name_keeps_matching_extension() {
        assert_eq!(resource_name("/a/foo.bpmn", "bpmn"), "foo.bpmn");
    }

    #[test]
    fn resource_name_replaces_other_extension() {
        assert_eq!(resource_name("/a/foo.xml", "bpmn"), "foo.bpmn");
        assert_eq!(resource_name("/a/foo.xml", "dmn"), "foo.dmn");
        assert_eq!(resource_name("/a/foo.json", "form"), "foo.form");
    }

    #[test]
    fn resource_name_when_name_ends_with_type_but_no_dot() {
        // path ends with 'bpmn' but extension is not '.bpmn'
        assert_eq!(resource_name("/a/foobpmn", "bpmn"), "foobpmn.bpmn");
        assert_eq!(resource_name("/a/foodmn", "dmn"), "foodmn.dmn");
    }

    #[test]
    fn node_extname_ignores_leading_dot() {
        assert_eq!(node_extname("/a/.bpmn"), "");
        assert_eq!(node_extname("/a/foo.bpmn"), ".bpmn");
        assert_eq!(node_extname("/a/foo"), "");
        assert_eq!(node_extname("/a/a.b.c"), ".c");
    }

    #[test]
    fn resource_mime_by_extension() {
        assert_eq!(resource_mime("foo.bpmn"), "application/xml");
        assert_eq!(resource_mime("foo.dmn"), "application/xml");
        assert_eq!(resource_mime("foo.form"), "application/json");
        assert_eq!(resource_mime("foo.rpa"), "application/octet-stream");
    }

    // --- startInstance body --------------------------------------------------

    #[test]
    fn start_instance_prefers_process_definition_key() {
        let body = start_instance_body(&json!({
            "processDefinitionKey": "123",
            "processId": "proc",
            "variables": { "a": 1 }
        }));

        assert_eq!(body["processDefinitionKey"], json!("123"));
        assert!(body.get("processDefinitionId").is_none());
        assert_eq!(body["variables"], json!({ "a": 1 }));
    }

    #[test]
    fn start_instance_falls_back_to_process_id() {
        let body = start_instance_body(&json!({ "processId": "proc" }));

        assert_eq!(body["processDefinitionId"], json!("proc"));
        assert!(body.get("processDefinitionKey").is_none());
    }

    #[test]
    fn start_instance_empty_key_is_falsy() {
        let body = start_instance_body(&json!({ "processDefinitionKey": "", "processId": "proc" }));

        assert_eq!(body["processDefinitionId"], json!("proc"));
        assert!(body.get("processDefinitionKey").is_none());
    }

    #[test]
    fn start_instance_omits_null_and_absent_fields() {
        let body = start_instance_body(&json!({
            "processId": "proc",
            "variables": null,
            "businessId": "biz"
        }));

        assert!(body.get("variables").is_none());
        assert!(body.get("startInstructions").is_none());
        assert!(body.get("runtimeInstructions").is_none());
        assert_eq!(body["businessId"], json!("biz"));
    }

    #[test]
    fn start_instance_keeps_empty_object_variables() {
        let body = start_instance_body(&json!({ "processId": "p", "variables": {} }));
        assert_eq!(body["variables"], json!({}));
    }

    // --- search body ---------------------------------------------------------

    #[test]
    fn search_body_wraps_filter() {
        let body = search_body(Some(&json!("99")));
        assert_eq!(body, json!({ "filter": { "processInstanceKey": "99" } }));
    }

    #[test]
    fn search_body_omits_absent_key() {
        let body = search_body(None);
        assert_eq!(body, json!({ "filter": {} }));
    }

    // --- deploy response mapping --------------------------------------------

    #[test]
    fn map_deploy_adds_key_alias() {
        let mapped = map_deploy_response(json!({ "deploymentKey": "999", "deployments": [] }));
        assert_eq!(mapped["key"], json!("999"));
        assert_eq!(mapped["deploymentKey"], json!("999"));
    }

    #[test]
    fn map_deploy_process_alias() {
        let mapped = map_deploy_response(json!({
            "deploymentKey": "1",
            "deployments": [ {
                "processDefinition": {
                    "processDefinitionId": "Process_1",
                    "processDefinitionVersion": 2,
                    "extra": "keep"
                },
                "decisionDefinition": null
            } ]
        }));

        let deployment = &mapped["deployments"][0];

        // original processDefinition preserved
        assert_eq!(deployment["processDefinition"]["processDefinitionId"], json!("Process_1"));

        // alias added
        assert_eq!(deployment["process"]["bpmnProcessId"], json!("Process_1"));
        assert_eq!(deployment["process"]["version"], json!(2));
        assert_eq!(deployment["process"]["extra"], json!("keep"));
    }

    #[test]
    fn map_deploy_decision_alias() {
        let mapped = map_deploy_response(json!({
            "deployments": [ {
                "processDefinition": null,
                "decisionDefinition": {
                    "decisionDefinitionId": "dec",
                    "name": "My Decision",
                    "decisionRequirementsId": "drd",
                    "decisionDefinitionKey": "dk"
                }
            } ]
        }));

        let decision = &mapped["deployments"][0]["decision"];
        assert_eq!(decision["decisionId"], json!("dec"));
        assert_eq!(decision["dmnDecisionId"], json!("dec"));
        assert_eq!(decision["dmnDecisionName"], json!("My Decision"));
        assert_eq!(decision["dmnDecisionRequirementsId"], json!("drd"));
        assert_eq!(decision["decisionKey"], json!("dk"));
    }

    #[test]
    fn map_deploy_decision_requirements_alias() {
        let mapped = map_deploy_response(json!({
            "deployments": [ {
                "decisionRequirements": {
                    "decisionRequirementsId": "drd",
                    "decisionRequirementsName": "DRD Name"
                }
            } ]
        }));

        let dr = &mapped["deployments"][0]["decisionRequirements"];
        assert_eq!(dr["dmnDecisionRequirementsId"], json!("drd"));
        assert_eq!(dr["dmnDecisionRequirementsName"], json!("DRD Name"));
    }

    #[test]
    fn map_deploy_unknown_deployment_unchanged() {
        let mapped = map_deploy_response(json!({
            "deployments": [ { "form": { "formId": "f" } } ]
        }));

        assert_eq!(mapped["deployments"][0], json!({ "form": { "formId": "f" } }));
    }

    #[test]
    fn map_deploy_priority_process_over_decision() {
        let mapped = map_deploy_response(json!({
            "deployments": [ {
                "processDefinition": { "processDefinitionId": "p", "processDefinitionVersion": 1 },
                "decisionDefinition": { "decisionDefinitionId": "d" }
            } ]
        }));

        let deployment = &mapped["deployments"][0];
        assert!(deployment.get("process").is_some());
        assert!(deployment.get("decision").is_none());
    }

    // --- error reason mapping (mirrors zeebe-api-rest-spec error reasons) -----

    fn err_with(message: &str, code: Option<i64>, http_status: Option<u16>) -> ZeebeError {
        ZeebeError {
            message: message.to_string(),
            code,
            http_status,
            details: None,
        }
    }

    #[test]
    fn reason_unavailable_grpc_codes() {
        assert_eq!(get_error_reason(&err_with("x", Some(14), None), &cloud()), CLUSTER_UNAVAILABLE);
        assert_eq!(get_error_reason(&err_with("x", Some(13), None), &cloud()), CLUSTER_UNAVAILABLE);
        assert_eq!(
            get_error_reason(&err_with("x", Some(14), None), &self_hosted_none()),
            CONTACT_POINT_UNAVAILABLE
        );
    }

    #[test]
    fn reason_unavailable_http_503() {
        assert_eq!(
            get_error_reason(&err_with("503 Service Unavailable", None, Some(503)), &cloud()),
            CLUSTER_UNAVAILABLE
        );
        assert_eq!(
            get_error_reason(&err_with("503", None, Some(503)), &self_hosted_none()),
            CONTACT_POINT_UNAVAILABLE
        );
    }

    #[test]
    fn reason_unsupported_engine() {
        assert_eq!(get_error_reason(&err_with("x", Some(12), None), &self_hosted_none()), UNSUPPORTED_ENGINE);
    }

    #[test]
    fn reason_unknown_when_no_message() {
        assert_eq!(get_error_reason(&err_with("", None, None), &self_hosted_none()), UNKNOWN);
    }

    #[test]
    fn reason_not_found_variants() {
        assert_eq!(get_error_reason(&err_with("Not Found", None, Some(404)), &oauth()), OAUTH_URL);
        assert_eq!(get_error_reason(&err_with("ENOTFOUND host", None, None), &cloud()), INVALID_CLIENT_ID);
        assert_eq!(
            get_error_reason(&err_with("Not Found", None, Some(404)), &self_hosted_none()),
            CONTACT_POINT_UNAVAILABLE
        );
    }

    #[test]
    fn reason_unauthorized() {
        assert_eq!(
            get_error_reason(&err_with("401 Unauthorized", None, Some(401)), &self_hosted_none()),
            UNAUTHORIZED
        );
        assert_eq!(
            get_error_reason(&err_with("401 Unauthorized", None, Some(401)), &cloud()),
            INVALID_CREDENTIALS
        );
    }

    #[test]
    fn reason_forbidden() {
        assert_eq!(
            get_error_reason(&err_with("403 Forbidden", None, Some(403)), &self_hosted_none()),
            FORBIDDEN
        );
    }

    #[test]
    fn reason_unsupported_protocol_oauth() {
        assert_eq!(get_error_reason(&err_with("Unsupported protocol", None, None), &oauth()), OAUTH_URL);
    }

    #[test]
    fn reason_unknown_fallback() {
        assert_eq!(
            get_error_reason(&err_with("something weird", None, None), &self_hosted_none()),
            UNKNOWN
        );
    }

    // --- asSerializedError ---------------------------------------------------

    #[test]
    fn serialized_error_picks_fields() {
        let err = ZeebeError {
            message: "boom".to_string(),
            code: Some(7),
            details: Some(json!("d")),
            http_status: Some(500),
        };

        assert_eq!(
            as_serialized_error(&err),
            json!({ "message": "boom", "code": 7, "details": "d" })
        );
    }

    #[test]
    fn serialized_error_message_only() {
        let err = ZeebeError::message("boom");
        assert_eq!(as_serialized_error(&err), json!({ "message": "boom" }));
    }
}
