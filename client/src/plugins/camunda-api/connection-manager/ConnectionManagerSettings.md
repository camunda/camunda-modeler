# Connection Manager Settings Documentation

## Overview

The Connection Manager Plugin uses the Camunda Modeler settings system to define configurable connection properties. This document explains how to structure and write settings for this plugin.

## Settings Structure

Settings are defined using the `SettingsGroup` and `SettingsProperty` types from the Camunda Modeler settings system.

### SettingsGroup Structure

```javascript
const pluginSettings = {
  id: 'connectionManagerPlugin',           // Unique identifier
  title: 'Connections',                    // Display title in settings UI
  properties: {                            // Property definitions
    'connectionManagerPlugin.c8connections': {
      // Property configuration...
    }
  }
};
```

### Property Types Supported

The settings system supports several property types:

#### 1. Array Type
Used for collections of connection objects:

```javascript
{
  type: 'array',
  label: 'Camunda8',
  description: 'Connections to Camunda 8',
  documentationUrl: 'https://docs.camunda.io/docs/apis-tools/camunda-8-api/overview/',
  formConfig: {
    placeholder: 'No connections',
    addLabel: 'Add Connection',
    elementGenerator: () => ({ id: generateId() })
  },
  childProperties: {
    // Define structure of array elements
  }
}
```

#### 2. Text Input
For string values:

```javascript
{
  type: 'text',
  label: 'Cluster endpoint',
  constraints: {
    notEmpty: 'Cluster endpoint must not be empty.',
    pattern: {
      value: /^(http|grpc)s?:\/\//,
      message: 'Cluster endpoint must be a valid URL.'
    }
  }
}
```

#### 3. Password Input
For sensitive string values:

```javascript
{
  type: 'password',
  label: 'Client Secret',
  constraints: {
    notEmpty: 'Client Secret must not be empty.'
  }
}
```

#### 4. Radio Button Groups
For selecting from predefined options:

```javascript
{
  type: 'radio',
  label: 'Target',
  options: [
    { value: 'camundaCloud', label: 'Camunda 8 SaaS' },
    { value: 'selfHosted', label: 'Camunda 8 Self-Managed' }
  ],
  default: 'camundaCloud'
}
```

## Conditional Display

Properties can be conditionally shown based on other property values:

### Single Condition
```javascript
{
  condition: { property: 'targetType', equals: 'camundaCloud' }
}
```

### Multiple Conditions (All Must Match)
```javascript
{
  condition: {
    allMatch: [
      { property: 'targetType', equals: 'selfHosted' },
      { property: 'authType', equals: 'oauth' }
    ]
  }
}
```

## Validation Constraints

### Built-in Constraints

#### notEmpty
```javascript
constraints: {
  notEmpty: 'Field must not be empty.'
}
```

#### pattern
```javascript
constraints: {
  pattern: {
    value: /^((https|grpcs):\/\/|)[a-z\d-]+\.[a-z]+-\d+\.zeebe\.camunda\.io(:443|)\/?/,
    message: 'Must be a valid Camunda 8 SaaS URL.'
  }
}
```

#### custom
```javascript
constraints: {
  custom: (zeebeAPI) => (values, context) => {
    // Custom validation logic
    console.log({ zeebeAPI, values, context });
    return null; // Return null if valid, error message if invalid
  }
}
```

## Nested Properties (childProperties)

For array types, define the structure of child elements:

```javascript
childProperties: {
  name: {
    type: 'text',
    label: 'Name'
  },
  targetType: {
    type: 'radio',
    label: 'Target',
    options: [/* ... */],
    default: 'camundaCloud'
  },
  // Properties can be nested within other properties
  contactPoint: {
    type: 'text',
    label: 'Cluster endpoint',
    condition: { property: 'targetType', equals: 'selfHosted' },
    
    // Nested properties for authentication
    authType: {
      type: 'radio',
      label: 'Authentication',
      options: [
        { value: 'none', label: 'None' },
        { value: 'basic', label: 'Basic' },
        { value: 'oauth', label: 'OAuth 2.0' }
      ],
      default: 'none',
      condition: { property: 'targetType', equals: 'selfHosted' }
    },
    
    // Further nested properties
    basicAuthUsername: {
      type: 'text',
      label: 'Username',
      condition: {
        allMatch: [
          { property: 'targetType', equals: 'selfHosted' },
          { property: 'authType', equals: 'basic' }
        ]
      }
    }
  }
}
```

## Registration and Usage

### 1. Register Settings
```javascript
try {
  settings.register(pluginSettings);
} catch (error) {
  log('Error registering plugin settings:', error);
}
```

### 2. Subscribe to Changes
```javascript
settings.subscribe('connectionManagerPlugin.c8connections', (connections) => {
  console.log({ connections });
  setConnections(connections.value);
});
```

### 3. Get Current Values
```javascript
const connections = settings.get('connectionManagerPlugin.c8connections');
```

### 4. Set Values Programmatically
```javascript
settings.set({ 
  'connectionManagerPlugin.c8connections': newConnectionsArray 
});
```

## Best Practices

1. **Naming Convention**: Use dot notation with plugin ID prefix
   - ✅ `connectionManagerPlugin.c8connections`
   - ❌ `c8connections`

2. **Validation Messages**: Define clear, user-friendly error messages
   ```javascript
   const VALIDATION_ERROR_MESSAGES = {
     CLIENT_ID_MUST_NOT_BE_EMPTY: 'Client ID must not be empty.',
     CLUSTER_URL_MUST_BE_VALID_CLOUD_URL: 'Must be a valid Camunda 8 SaaS URL.'
   };
   ```

3. **Conditional Logic**: Use conditions to show/hide fields based on context

4. **Default Values**: Provide sensible defaults for radio buttons and other inputs

5. **Documentation Links**: Include `documentationUrl` for complex configurations

6. **Error Handling**: Wrap `settings.register()` in try-catch blocks

## Example: Complete Connection Setting

```javascript
const pluginSettings = {
  id: 'connectionManagerPlugin',
  title: 'Connections',
  properties: {
    'connectionManagerPlugin.c8connections': {
      type: 'array',
      label: 'Camunda8',
      description: 'Connections to Camunda 8',
      documentationUrl: 'https://docs.camunda.io/docs/apis-tools/camunda-8-api/overview/',
      formConfig: {
        placeholder: 'No connections',
        addLabel: 'Add Connection',
        elementGenerator: () => ({ id: generateId() })
      },
      childProperties: {
        name: {
          type: 'text',
          label: 'Name'
        },
        targetType: {
          type: 'radio',
          label: 'Target',
          options: [
            { value: 'camundaCloud', label: 'Camunda 8 SaaS' },
            { value: 'selfHosted', label: 'Camunda 8 Self-Managed' }
          ],
          default: 'camundaCloud'
        },
        camundaCloudClusterUrl: {
          type: 'text',
          label: 'ClusterUrl',
          condition: { property: 'targetType', equals: 'camundaCloud' },
          constraints: {
            notEmpty: VALIDATION_ERROR_MESSAGES.CLUSTER_URL_MUST_NOT_BE_EMPTY,
            pattern: {
              value: /^((https|grpcs):\/\/|)[a-z\d-]+\.[a-z]+-\d+\.zeebe\.camunda\.io(:443|)\/?/,
              message: VALIDATION_ERROR_MESSAGES.CLUSTER_URL_MUST_BE_VALID_CLOUD_URL
            }
          }
        }
      }
    }
  }
};
```

This structure provides a flexible, validated, and user-friendly way to configure connections in the Camunda Modeler.
