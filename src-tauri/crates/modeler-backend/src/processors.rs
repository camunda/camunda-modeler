// Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
// under one or more contributor license agreements. See the NOTICE file
// distributed with this work for additional information regarding copyright
// ownership.
//
// Camunda licenses this file to you under the MIT; you may not use this file
// except in compliance with the MIT License.

//! Faithful Rust port of `app/lib/file-context/processor.js` (the router) and
//! `app/lib/file-context/processors/*.js` (the five processors).
//!
//! Each processor extracts the SAME `metadata` shape the renderer consumes
//! (asserted exactly by `file-context-spec.js`). The behavior is locked by the
//! cargo parity tests in `tests/file_context_parity.rs`, which run against the
//! very fixtures the JS spec uses.
//!
//! Parsing strategy (bpmn-moddle/dmn-moddle are too heavy to port):
//!   - BPMN/DMN: `roxmltree` (read-only, namespace-aware DOM). moddle's
//!     `is(element, type)` is approximated by `(namespace, local-name)` matching
//!     — safe here because the DI sections carry only attribute references, not
//!     `Process`/`Decision` *elements*.
//!   - The Camunda-8 gate mirrors saxen's "inspect the first open tag only"
//!     behavior with a streaming `quick-xml` scan, so a Camunda-8 file with a
//!     malformed *body* still passes the gate and then fails with
//!     `Failed to parse …` (matching the JS order: gate, then full parse).
//!   - Form/RPA/process-application: `serde_json`.

use quick_xml::events::Event;
use quick_xml::Reader;
use roxmltree::{Document, Node};
use serde_json::{json, Value};

use crate::watcher::get_file_extension;

const BPMN_NS: &str = "http://www.omg.org/spec/BPMN/20100524/MODEL";
const ZEEBE_NS: &str = "http://camunda.org/schema/zeebe/1.0";
const XML_NS_MODELER: &str = "http://camunda.org/schema/modeler/1.0";
const XML_NS_ZEEBE: &str = "http://camunda.org/schema/zeebe/1.0";
const EXECUTION_PLATFORM_CAMUNDA_CLOUD: &str = "Camunda Cloud";

/// The DMN model namespace `dmn-moddle` binds (DMN 1.3, what Camunda 8 emits).
/// Matching this exactly mirrors `dmn-moddle`, which rejects other DMN
/// namespaces rather than extracting decisions from them.
const DMN_NS: &str = "https://www.omg.org/spec/DMN/20191111/MODEL/";

/// A processor, mirroring the `{ id, extensions, process }` shape of the JS
/// processor modules.
struct Processor {
    id: &'static str,
    extensions: &'static [&'static str],
    process: fn(&Value) -> Result<Value, String>,
}

const PROCESSORS: &[Processor] = &[
    Processor { id: "bpmn", extensions: &[".bpmn"], process: process_bpmn },
    Processor { id: "dmn", extensions: &[".dmn"], process: process_dmn },
    Processor { id: "form", extensions: &[".form"], process: process_form },
    Processor {
        id: "processApplication",
        extensions: &[".process-application"],
        process: process_process_application,
    },
    Processor { id: "rpa", extensions: &[".rpa"], process: process_rpa },
];

/// Route an item to a processor and run it, mirroring `processor.js`.
///
/// If an explicit `processor` id is given it is preferred; an unknown id falls
/// back to extension-based routing (the JS only logs a warning). If no
/// processor matches the file's extension, the call fails with
/// `No processor found for <path>` (caught by the indexer as a `process-error`).
///
/// `Ok` carries the `metadata`; `Err` carries the thrown message string.
pub fn process(file: &Value, explicit: Option<&str>) -> Result<Value, String> {
    if let Some(id) = explicit {
        if let Some(processor) = PROCESSORS.iter().find(|p| p.id == id) {
            return (processor.process)(file);
        }
        // Unknown explicit id: JS logs a warning and falls through.
    }

    let path = file.get("path").and_then(Value::as_str).unwrap_or("");
    let extension = get_file_extension(path);

    match PROCESSORS
        .iter()
        .find(|p| p.extensions.contains(&extension.as_str()))
    {
        Some(processor) => (processor.process)(file),
        None => Err(format!("No processor found for {path}")),
    }
}

/// Non-empty contents (`!item.file.contents` in JS treats `null` and `""` as
/// empty), or `None` to signal the empty-file branch.
fn contents(file: &Value) -> Option<&str> {
    match file.get("contents") {
        Some(Value::String(s)) if !s.is_empty() => Some(s),
        _ => None,
    }
}

fn process_bpmn(file: &Value) -> Result<Value, String> {
    let Some(contents) = contents(file) else {
        return Ok(json!({ "type": "bpmn", "processes": [], "linkedIds": [] }));
    };

    if !is_camunda8_xml(contents) {
        return Err("Not a Camunda 8 BPMN file".to_string());
    }

    let doc = Document::parse(contents)
        .map_err(|err| format!("Failed to parse BPMN file: {err}"))?;

    let processes = find_processes(&doc);

    let mut linked_ids = find_linked_ids(&doc, "bpmn", "callActivity", "calledElement", "processId");
    linked_ids.extend(find_linked_ids(&doc, "dmn", "businessRuleTask", "calledDecision", "decisionId"));
    linked_ids.extend(find_linked_ids(&doc, "form", "userTask", "formDefinition", "formId"));

    Ok(json!({ "type": "bpmn", "processes": processes, "linkedIds": linked_ids }))
}

fn process_dmn(file: &Value) -> Result<Value, String> {
    let Some(contents) = contents(file) else {
        return Ok(json!({ "type": "dmn", "decisions": [], "linkedIds": [] }));
    };

    if !is_camunda8_xml(contents) {
        return Err("Not a Camunda 8 DMN file".to_string());
    }

    let doc = Document::parse(contents)
        .map_err(|err| format!("Failed to parse DMN file: {err}"))?;

    let decisions = find_decisions(&doc);

    Ok(json!({ "type": "dmn", "decisions": decisions, "linkedIds": [] }))
}

fn process_form(file: &Value) -> Result<Value, String> {
    let Some(contents) = contents(file) else {
        return Ok(json!({ "type": "form", "forms": [], "linkedIds": [] }));
    };

    if !is_camunda8_form(contents)? {
        return Err("Not a Camunda 8 Form file".to_string());
    }

    let form: Value = serde_json::from_str(contents)
        .map_err(|err| format!("Failed to parse form file: {err}"))?;

    let id = form.get("id").cloned().unwrap_or(Value::Null);
    let name = match form.get("name") {
        Some(value) if is_truthy(value) => value.clone(),
        _ => id.clone(),
    };

    // assert(form.id, 'Form must have an id')
    if !is_truthy(&id) {
        return Err("Failed to parse form file: Form must have an id".to_string());
    }

    Ok(json!({
        "type": "form",
        "forms": [ { "id": id, "name": name } ],
        "linkedIds": []
    }))
}

fn process_rpa(file: &Value) -> Result<Value, String> {
    let Some(contents) = contents(file) else {
        return Ok(json!({ "type": "rpa", "scripts": [], "linkedIds": [] }));
    };

    let script: Value = serde_json::from_str(contents)
        .map_err(|err| format!("Failed to parse RPA script file: {err}"))?;

    // JS reads `script.id` on the parsed value; on `null` that throws a
    // TypeError before the `assert` (no Camunda-8 gate guards it like the form).
    if script.is_null() {
        return Err(
            "Failed to parse RPA script file: Cannot read properties of null (reading 'id')"
                .to_string(),
        );
    }

    let id = script.get("id").cloned().unwrap_or(Value::Null);
    let name = match script.get("name") {
        Some(value) if is_truthy(value) => value.clone(),
        _ => id.clone(),
    };

    // assert(script.id, 'RPA script must have an id')
    if !is_truthy(&id) {
        return Err("Failed to parse RPA script file: RPA script must have an id".to_string());
    }

    Ok(json!({
        "type": "rpa",
        "scripts": [ { "id": id, "name": name } ],
        "linkedIds": []
    }))
}

fn process_process_application(_file: &Value) -> Result<Value, String> {
    Ok(json!({ "type": "processApplication" }))
}

/// Collect every `bpmn:Process` in document order: `{ id, name: name || id }`.
fn find_processes(doc: &Document) -> Vec<Value> {
    doc.descendants()
        .filter(|node| is(node, BPMN_NS, "process"))
        .map(|node| {
            let id = node.attribute("id").unwrap_or("");
            let name = node.attribute("name").filter(|s| !s.is_empty()).unwrap_or(id);
            json!({ "id": id, "name": name })
        })
        .collect()
}

/// Collect every `dmn:Decision` in document order: `{ id, name: name || id }`.
fn find_decisions(doc: &Document) -> Vec<Value> {
    doc.descendants()
        .filter(|node| {
            node.is_element()
                && node.tag_name().name() == "decision"
                && node.tag_name().namespace() == Some(DMN_NS)
        })
        .map(|node| {
            let id = node.attribute("id").unwrap_or("");
            let name = node.attribute("name").filter(|s| !s.is_empty()).unwrap_or(id);
            json!({ "id": id, "name": name })
        })
        .collect()
}

/// Mirror `findLinkedIds`: for every BPMN element of `element_local`, read the
/// `zeebe:<ext_local>` extension element's `prop` attribute and, when non-empty,
/// emit `{ type, elementId, linkedId }`.
fn find_linked_ids(
    doc: &Document,
    link_type: &str,
    element_local: &str,
    ext_local: &str,
    prop: &str,
) -> Vec<Value> {
    let mut linked_ids = Vec::new();

    for node in doc.descendants().filter(|node| is(node, BPMN_NS, element_local)) {
        let Some(extension) = node
            .children()
            .find(|child| is(child, BPMN_NS, "extensionElements"))
            .and_then(|elements| elements.children().find(|child| is(child, ZEEBE_NS, ext_local)))
        else {
            continue;
        };

        if let Some(value) = extension.attribute(prop).filter(|value| !value.is_empty()) {
            linked_ids.push(json!({
                "type": link_type,
                "elementId": node.attribute("id").unwrap_or(""),
                "linkedId": value
            }));
        }
    }

    linked_ids
}

fn is(node: &Node, namespace: &str, local_name: &str) -> bool {
    node.is_element()
        && node.tag_name().namespace() == Some(namespace)
        && node.tag_name().name() == local_name
}

/// Mirror `isCamunda8XML`: inspect ONLY the root open tag's attributes (like
/// saxen, which stops after the first tag), so a malformed body does not change
/// the result. Returns `false` on a parse error before the first tag.
fn is_camunda8_xml(xml: &str) -> bool {
    let mut reader = Reader::from_str(xml);

    loop {
        match reader.read_event() {
            Ok(Event::Start(element)) | Ok(Event::Empty(element)) => {
                return is_camunda8_attributes(&element);
            },
            Ok(Event::Eof) | Err(_) => return false,
            _ => {},
        }
    }
}

fn is_camunda8_attributes(element: &quick_xml::events::BytesStart) -> bool {
    let mut attributes = std::collections::HashMap::new();

    for attribute in element.attributes().flatten() {
        let key = String::from_utf8_lossy(attribute.key.as_ref()).into_owned();
        let value = attribute.unescape_value().map(|v| v.into_owned()).unwrap_or_default();

        attributes.insert(key, value);
    }

    // getAttribute(attrs, attr, prefix): `${prefix}:${attr}` || `${attr}`.
    // JS `||` is truthiness-based, so an empty prefixed value falls through.
    let get = |attr: &str, prefix: &str| -> Option<&str> {
        let non_empty = |key: &String| attributes.get(key).filter(|value| !value.is_empty());

        non_empty(&format!("{prefix}:{attr}"))
            .or_else(|| non_empty(&attr.to_string()))
            .map(String::as_str)
    };

    (get("modeler", "xmlns") == Some(XML_NS_MODELER)
        && get("executionPlatform", "modeler") == Some(EXECUTION_PLATFORM_CAMUNDA_CLOUD))
        || (get("zeebe", "xmlns") == Some(XML_NS_ZEEBE))
}

/// Mirror `isCamunda8Form`: parse JSON and read `executionPlatform`. A JSON
/// parse error, or destructuring `null`, throws `Failed to parse form file: …`
/// (the renderer-visible contract is regex `/Failed to parse form file: Cannot/`
/// for the `null` case).
fn is_camunda8_form(json: &str) -> Result<bool, String> {
    let value: Value = serde_json::from_str(json)
        .map_err(|err| format!("Failed to parse form file: {err}"))?;

    match &value {
        Value::Object(_) => Ok(value
            .get("executionPlatform")
            .and_then(Value::as_str)
            == Some(EXECUTION_PLATFORM_CAMUNDA_CLOUD)),
        // `({ executionPlatform } = null)` throws a TypeError in JS.
        Value::Null => Err(
            "Failed to parse form file: Cannot destructure property 'executionPlatform' \
             of 'null' as it is null."
                .to_string(),
        ),
        // Destructuring a primitive/array does not throw; the property is absent.
        _ => Ok(false),
    }
}

/// JS truthiness for the values we read from JSON (`name || id`,
/// `assert(form.id)`): non-empty string, non-zero number, `true`, any
/// object/array; `null`/`false`/`0`/`""` are falsy.
fn is_truthy(value: &Value) -> bool {
    match value {
        Value::Null => false,
        Value::Bool(b) => *b,
        Value::Number(n) => n.as_f64().is_some_and(|f| f != 0.0),
        Value::String(s) => !s.is_empty(),
        Value::Array(_) | Value::Object(_) => true,
    }
}
