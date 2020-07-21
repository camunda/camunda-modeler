# Telemetry

In this document we'll refer to our internal telemetry server as `ET` :alien:.

## General Structure of the Events
Independent from the type of the event we're dealing with, the payload we send to the ET has the following structure:
```json
{
  "installation": "[THE_EDITOR_ID]",
  "product": {
    "name": "Camunda Modeler",
    "version": "[MODELER_VERISON]",
    "edition": "community",
    "internals": {
      "event": "[NAME_OF_THE_EVENT]",
      "[SOME_ADDITIONAL_EVENT_DATA]": "[SOME_CUSTOM_VALUE]"
    }
  }
}
```

Every event directly modifies the `internals` field of the payload.

## Definition of Events

### Ping Event
The `Ping Event` is sent in following situations:

 - The modeler is opened (given that `Usage Statistics` option is enabled)
 - `Usage Statistics` option is enabled for the first time.
 - Once every 24 hours (given that `Usage Statistics` option is enabled)

The Ping Event has the following structure:
```json
{
  "event": "ping"
}
```

### Diagram Opened Event
The `Diagram Opened Event` is sent in following situations:

 - User created a new BPMN diagram
 - User created a new DMN diagram
 - User created a new CMMN diagram
 - User opened an existing BPMN diagram
 - User opened an existing DMN diagram
 - User opened an existing CMMN diagram

The Diagram Opened Event has the following core structure:
```json
{
  "event": "diagramOpened",
  "diagram-type": "[bpmn, dmn or cmmn]"
}
```

In case the diagram type is bpmn, we also add the element template usage to
Diagram Opened Event payload:

```json
{
  "elementTemplateCount": 1,
  "elementTemplates": [
    {
      "appliesTo": [ "bpmn:ServiceTask" ],
      "properties": {
        "camunda:asyncBefore": 1,
        "camunda:class": 1,
        "camunda:inputParameter": 3,
        "camunda:outputParameter": 1
      }
    }
  ]
}
```
