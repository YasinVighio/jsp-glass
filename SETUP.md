# JSP Debug Extension - Quick Setup Guide

## Prerequisites

1. **Install Java Extension Pack** in VS Code
2. **Apache Tomcat** installed and configured
3. **Java project** with JSP files

## Step-by-Step Setup

### 1. Install the Extension

```bash
code --install-extension vscode-jsp-debug-1.0.0.vsix
```

### 2. Configure Workspace

Create `config.json` in your workspace root:

```json
{
  "catalinaHome": "/path/to/your/tomcat",
  "webappContext": "your-webapp-name"
}
```

**Windows Example:**
```json
{
  "catalinaHome": "C:\\apache-tomcat-9.0.65",
  "webappContext": "myapp"
}
```

**Linux/Mac Example:**
```json
{
  "catalinaHome": "/opt/tomcat",
  "webappContext": "ROOT"
}
```

### 3. Start Tomcat with Debugging

**Windows:**
```cmd
%CATALINA_HOME%\bin\catalina.bat jpda start
```

**Linux/Mac:**
```bash
$CATALINA_HOME/bin/catalina.sh jpda start
```

Or with custom port:
```bash
export JPDA_ADDRESS=8001
$CATALINA_HOME/bin/catalina.sh jpda start
```

### 4. Configure VS Code Debug

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "jsp",
      "request": "attach",
      "name": "Debug JSP",
      "hostName": "localhost",
      "port": 8000
    }
  ]
}
```

### 5. Deploy and Access JSP

1. Deploy your webapp to Tomcat
2. Access JSP files in browser to trigger compilation
3. Compiled servlets will be in `$CATALINA_BASE/work/Catalina/localhost/[context]/org/apache/jsp/`

### 6. Start Debugging

1. Open JSP file in VS Code
2. Set breakpoints by clicking line numbers
3. Press `F5` or use Debug panel
4. Access JSP in browser
5. Debugger should stop at breakpoints!

## Common Project Structures

### Maven Web App
```
src/
└── main/
    └── webapp/
        ├── index.jsp
        ├── WEB-INF/
        │   └── web.xml
        └── pages/
            └── admin.jsp
```

### Eclipse Dynamic Web Project
```
WebContent/
├── index.jsp
├── META-INF/
├── WEB-INF/
│   └── web.xml
└── pages/
    └── login.jsp
```

## Troubleshooting

### Extension Commands

- **Show Compiled Servlet Path**: `Ctrl+Shift+P` → "JSP: Show Compiled Servlet Path"
- **Validate Setup**: `Ctrl+Shift+P` → "JSP: Validate Setup"

### Common Issues

1. **"Servlet class not found"**
   - Access JSP in browser first to trigger compilation
   - Check `config.json` paths
   - Verify webapp is deployed

2. **"Cannot connect to debugger"**
   - Ensure Tomcat started with JPDA (`jpda start`)
   - Check port 8000 is not blocked
   - Verify Java debug extension is installed

3. **Breakpoints not hit**
   - Confirm servlet class exists in work directory
   - Set breakpoints on executable lines (not comments)
   - Check webapp context in config matches deployment

### Debug Tomcat Startup

Check JPDA is enabled:
```bash
# Should show port 8000 listening
netstat -an | grep 8000

# Check Tomcat logs
tail -f $CATALINA_BASE/logs/catalina.out
```

## Advanced Configuration

### Custom JPDA Port
```json
{
  "type": "jsp",
  "request": "attach",
  "name": "Debug JSP (Custom Port)",
  "hostName": "localhost",
  "port": 8001
}
```

### Multiple Contexts
```json
{
  "catalinaHome": "/opt/tomcat",
  "catalinaBase": "/var/tomcat",
  "webappContext": "admin"
}
```

### Remote Debugging
```json
{
  "type": "jsp",
  "request": "attach",
  "name": "Debug Remote JSP",
  "hostName": "192.168.1.100",
  "port": 8000
}
```