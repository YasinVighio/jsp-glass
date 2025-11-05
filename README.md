# JSP Debug for VS Code

A Visual Studio Code extension that enables debugging of JSP files running on Apache Tomcat, similar to how Eclipse or IntelliJ handle JSP debugging.

## Features

- 🔍 **Direct JSP Debugging**: Set breakpoints directly in `.jsp` files
- 🎯 **Automatic Servlet Mapping**: Automatically maps JSP files to compiled servlet classes
- 🚀 **Tomcat Integration**: Seamlessly integrates with Apache Tomcat's JPDA debugging
- 🔧 **Easy Configuration**: Simple workspace configuration via `config.json`
- 📊 **Diagnostic Tools**: Commands to inspect compiled servlet paths and validate setup

## Requirements

- Visual Studio Code 1.74.0 or higher
- [Java Extension Pack](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-pack) (includes Java Debug extension)
- Apache Tomcat with JPDA debugging enabled
- Compiled JSP servlets (JSPs must be accessed at least once to generate servlet classes)

## Quick Start

### 1. Install the Extension

Install the JSP Debug extension from the VS Code marketplace or build from source.

### 2. Configure Your Workspace

Create a `config.json` file in your workspace root:

```json
{
  "catalinaHome": "/path/to/tomcat",
  "catalinaBase": "/path/to/tomcat",
  "webappContext": "ROOT"
}
```

### 3. Start Tomcat with JPDA

Start Tomcat with JPDA debugging enabled:

```bash
# Linux/Mac
$CATALINA_HOME/bin/catalina.sh jpda start

# Windows
%CATALINA_HOME%\bin\catalina.bat jpda start
```

Default JPDA port is `8000`.

### 4. Create Debug Configuration

Add a debug configuration to your `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "jsp",
      "request": "attach",
      "name": "Attach to Tomcat (JSP Debug)",
      "hostName": "localhost",
      "port": 8000
    }
  ]
}
```

### 5. Debug Your JSPs

1. Open a JSP file in VS Code
2. Set breakpoints by clicking in the gutter
3. Start debugging with `F5` or the debug panel
4. Access your JSP in a browser to trigger the breakpoint

## Configuration

### config.json Options

| Property | Required | Description |
|----------|----------|-------------|
| `catalinaHome` | Yes | Path to Tomcat installation directory |
| `catalinaBase` | No | Path to Tomcat base directory (defaults to catalinaHome) |
| `webappContext` | No | Web application context name (defaults to "ROOT") |

### Example Configurations

#### Standard Tomcat Setup
```json
{
  "catalinaHome": "/opt/tomcat",
  "webappContext": "myapp"
}
```

#### Development with Custom Base
```json
{
  "catalinaHome": "/opt/tomcat",
  "catalinaBase": "/home/user/tomcat-dev",
  "webappContext": "webapp"
}
```

## Supported Project Structures

The extension supports common Java web project structures:

```
project/
├── src/main/webapp/          # Maven standard
│   └── index.jsp
├── WebContent/               # Eclipse Dynamic Web Project
│   └── pages/page.jsp
├── web/                      # Alternative structure
│   └── admin/admin.jsp
└── config.json              # Required configuration
```

## Commands

| Command | Description |
|---------|-------------|
| `JSP: Show Compiled Servlet Path` | Display the compiled servlet class path for current JSP |
| `JSP: Validate Setup` | Check JSP debugging configuration and Tomcat setup |

## How It Works

1. **JSP Compilation**: Tomcat compiles JSP files into servlet classes with embedded line number mappings
2. **Breakpoint Mapping**: Extension maps JSP breakpoints to corresponding servlet class locations
3. **JDWP Integration**: Leverages VS Code's Java debugger and JDWP protocol for actual debugging
4. **Source Mapping**: When execution stops, maps servlet stack frames back to original JSP files

## Troubleshooting

### Common Issues

#### "Servlet class not found"
- Ensure JSP has been accessed in browser at least once
- Check that Tomcat work directory exists and has compiled servlets
- Verify `catalinaHome` and `catalinaBase` paths in config.json

#### "Cannot connect to debugger"
- Verify Tomcat is running with JPDA enabled
- Check that port 8000 (or configured port) is not blocked
- Ensure Java Debug extension is installed and enabled

#### "Breakpoint not hit"
- Confirm JSP compilation by checking servlet class file exists
- Verify breakpoint is set on executable line (not comments/whitespace)
- Check that the correct webapp context is configured

### Debug Commands

Use these commands to diagnose issues:

```bash
# Check if JPDA is listening
netstat -an | grep 8000

# Verify servlet compilation
ls -la $CATALINA_BASE/work/Catalina/localhost/*/org/apache/jsp/
```

## Development

### Building from Source

```bash
# Clone repository
git clone https://github.com/your-repo/vscode-jsp-debug.git
cd vscode-jsp-debug

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package extension
npm run package
```

### Project Structure

```
src/
├── extension.ts              # Main extension entry point
├── debugConfigurationProvider.ts  # Debug configuration handling
├── debugAdapter.ts          # Debug adapter wrapper
├── jspMapper.ts             # JSP to servlet mapping logic
└── configurationManager.ts  # Configuration management
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Changelog

### 1.0.0
- Initial release
- JSP breakpoint support
- Tomcat integration
- Automatic servlet mapping
- Diagnostic commands