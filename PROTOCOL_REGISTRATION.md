# Custom Protocol Registration for Camunda Modeler

## Overview

The Camunda Modeler now supports a custom protocol `camunda-modeler://` that allows the application to be opened via URLs from browsers or other applications.

## Implementation Details

### Protocol Registration

The protocol is registered during application startup in `app/lib/index.js`:

```javascript
// Development mode (running from source)
if (process.defaultApp) {
  app.setAsDefaultProtocolClient('camunda-modeler', process.execPath, [ path.resolve(process.argv[1]) ]);
}
// Production mode (packaged app)
else {
  app.setAsDefaultProtocolClient('camunda-modeler');
}
```

### Platform-Specific Handling

#### macOS
- Protocol URLs are handled via the `open-url` event in `app/lib/platform/mac-os/index.js`
- The event is triggered when a URL with the `camunda-modeler://` scheme is opened

#### Windows & Linux
- Protocol URLs are passed as command line arguments
- Handled in two scenarios:
  1. **First instance**: Detected in `process.argv` during startup
  2. **Second instance**: Detected via the `second-instance` event when app is already running

### Configuration

The protocol scheme is configured in `electron-builder.json`:

```json
"protocols": [
  {
    "name": "Camunda Modeler Protocol",
    "schemes": [
      "camunda-modeler"
    ]
  }
]
```

## Current Functionality

### Auth Protocol Handler

The modeler includes a built-in handler for bearer token connection configuration via the `auth` path:

**Format**: `camunda-modeler://auth?token=XXX&url=YYY`

**Parameters**:
- `token` (required): Bearer token for authentication
- `url` (required): The endpoint URL for the Camunda cluster

**Behavior**:
When an auth protocol URL is opened, the modeler automatically:
1. Parses the token and URL from the query parameters
2. Creates a new connection configuration with bearer token authentication
3. Saves it to the connection manager settings
4. Logs the operation

**Example**:
```bash
camunda-modeler://auth?token=my-bearer-token-12345&url=https://my-cluster.camunda.io
```

This will create a connection entry in the connection manager with:
- **Target Type**: Self-Managed
- **Cluster URL**: `https://my-cluster.camunda.io`
- **Auth Type**: `bearer` (internal, not shown in UI)
- **Token**: `my-bearer-token-12345`

**Note**: The `bearer` auth type is used internally and will not appear in the UI connection manager dropdown. It configures the connection to use bearer token authentication with the Camunda SDK by setting `CAMUNDA_AUTH_STRATEGY: 'BEARER'` and `CAMUNDA_TOKEN_VALUE` with the provided token.

### General Protocol Logging

For other protocol paths, the URL is logged using the structured logging system:
- The log message includes the full URL
- Console output: `log.info('received protocol URL:', url)`

## Testing

### Development Mode

1. **Build and run the app in development:**
   ```bash
   npm run dev
   ```

2. **Test the protocol (platform-specific):**

   **macOS:**
   ```bash
   open "camunda-modeler://test"
   ```

   **Linux:**
   ```bash
   xdg-open "camunda-modeler://test"
   ```

   **Windows (PowerShell):**
   ```powershell
   Start-Process "camunda-modeler://test"
   ```

3. **Check the logs:**
   - Look for the log message in the console/terminal where you ran `npm run dev`
   - Message format: `app:main received protocol URL: camunda-modeler://test`

### Production Mode

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Install the built application** from the `dist` folder

3. **Test the protocol** using the same commands as development mode

4. **Check the logs:**
   - On macOS: `~/Library/Logs/Camunda Modeler/log.log`
   - On Windows: `%USERPROFILE%\AppData\Roaming\Camunda Modeler\logs\`
   - On Linux: `~/.config/Camunda Modeler/logs/`

### HTML Test Page

Create a simple HTML file to test from a browser:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Camunda Modeler Protocol Test</title>
</head>
<body>
    <h1>Test Camunda Modeler Protocol</h1>
    <a href="camunda-modeler://test">Open Camunda Modeler</a>
    <br><br>
    <a href="camunda-modeler://open?file=example.bpmn">Open with file parameter</a>
</body>
</html>
```

## Future Extensions

The current implementation logs protocol URLs. Here are potential extensions:

### 1. Open Specific Files
```javascript
// Parse URL and open file
const url = new URL(protocolUrl);
if (url.pathname === '/open') {
  const file = url.searchParams.get('file');
  if (file) {
    app.openFiles([ file ]);
  }
}
```

### 2. Create New Diagrams
```javascript
// Example: camunda-modeler://new?type=bpmn
const url = new URL(protocolUrl);
if (url.pathname === '/new') {
  const type = url.searchParams.get('type');
  // Trigger new file creation
}
```

### 3. Deep Linking to Documentation
```javascript
// Example: camunda-modeler://help?topic=getting-started
const url = new URL(protocolUrl);
if (url.pathname === '/help') {
  const topic = url.searchParams.get('topic');
  // Open help documentation
}
```

## Security Considerations

- Always validate and sanitize protocol URLs before processing
- Be cautious with file paths passed via URLs
- Consider implementing URL allowlists for sensitive operations
- Log all protocol URL access for debugging and security auditing

## Troubleshooting

### Protocol not registered (macOS)
Run the following command to check if the protocol is registered:
```bash
/System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/LaunchServices.framework/Versions/A/Support/lsregister -dump | grep -i camunda
```

### Protocol not working (Windows)
Check the Windows Registry for the protocol handler:
```
HKEY_CLASSES_ROOT\camunda-modeler
```

### Protocol not working (Linux)
Check the desktop entry file:
```bash
cat ~/.local/share/applications/camunda-modeler.desktop
```

## References

- [Electron Protocol Documentation](https://www.electronjs.org/docs/latest/api/protocol)
- [Electron Deep Linking Guide](https://www.electronjs.org/docs/latest/tutorial/launch-app-from-url-in-another-app)
- [electron-builder Protocol Configuration](https://www.electron.build/configuration/configuration#Configuration-protocols)
