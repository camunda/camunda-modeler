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
  "diagramType": "[bpmn, dmn or cmmn]"
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

Also in the case of BPMN diagrams, we add selected diagram metrics:

```json
{
  "diagramMetrics": {
    "processVariablesCount": 3,
    "tasks": {
      "userTask": {
        "count": 5,
        "form": {
          "count": 5,
          "embedded": 1,
          "camundaForms": 1,
          "external": 2,
          "generated": 0,
          "other": 1
        }
      },
      "serviceTask": {
        "count": 5,
        "implementation": {
          "count": 5,
          "java": 1,
          "expression": 1,
          "delegate": 2,
          "external": 0,
          "connector": 1
        }
      }
    }
  }
}
```

In terms it is set in the diagram, we add the engine profile:

```json
{
  "engineProfile": {
    "executionPlatform": "Camunda Cloud"
  }
}
```

### Deployment Event
The `Deployment Event` is sent in following situations:

 - User deploys a BPMN diagram to Camunda Platform or Camunda Cloud
 - User deploys a DMN diagram to Camunda Platform

The Deployment Event has the following core structure:
```json
{
  "event": "deployment",
  "diagramType": "[bpmn or dmn]",
  "deployment": {
    "outcome": "[success or failure]",
    "context": "[deploymentTool or startInstanceTool]",
    "executionPlatform": "[Camunda Cloud or Camunda Platform]",
    "executionPlatformVersion": "[version deployed to]"
  }
}
```

In case the diagram deployment was not successful, the error code returned from the Camunda Engine will be added to the payload:

```json
{
  "deployment": {
    "outcome": "failure",
    "error": "DIAGRAM_PARSE_ERROR"
  }
}
```

If provided, for example, when deploying to a Zeebe based platform, we add the target type of the deployment as well:

```json
{
  "deployment": {
    "targetType": "camundaCloud"
  }
}
```

In case of BPMN files, we add selected diagram metrics:

```json
{
  "diagramMetrics": {
    "processVariablesCount": 3,
    "tasks": {
      "userTask": {
        "count": 5,
        "form": {
          "count": 5,
          "embedded": 1,
          "camundaForms": 1,
          "external": 2,
          "generated": 0,
          "other": 1
        }
      },
      "serviceTask": {
        "count": 5,
        "implementation": {
          "count": 5,
          "java": 1,
          "expression": 1,
          "delegate": 2,
          "external": 0,
          "connector": 1
        }
      }
    }
  }
}
```

If it is set in the diagram, we also add target engine profile information:

```json
{
  "engineProfile": {
    "executionPlatform": "Camunda Cloud"
  }
}
```
