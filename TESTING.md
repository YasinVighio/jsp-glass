# JSP Breakpoint Mapping - Testing Guide

## Overview

The updated JSP Debug extension now properly maps breakpoints from JSP files to the corresponding servlet classes. Here's how the breakpoint mapping works and how to test it.

## How JSP Breakpoint Mapping Works

### 1. **JSP to Servlet Compilation**
When Tomcat compiles a JSP file, it:
- Creates a servlet class (e.g., `index.jsp` → `org.apache.jsp.index_jsp.class`)
- Generates source code (`index_jsp.java`) with line number mappings
- Embeds JSP line references in comments like `// Line 15, JSP file: /index.jsp`

### 2. **Extension Breakpoint Processing**
When you set a breakpoint in a JSP file, the extension:
1. **Detects JSP file** and validates it's a `.jsp` or `.jspx` file
2. **Finds compiled servlet** in Tomcat work directory
3. **Parses line mappings** from servlet source comments
4. **Creates mapping file** in `.vscode/jsp-debug/` directory
5. **Sets breakpoints** in the servlet source file
6. **Delegates to Java debugger** for actual JDWP communication

### 3. **Breakpoint Verification**
- ✅ **Verified breakpoint**: Servlet found and mapped successfully
- ⚠️ **Unverified breakpoint**: Servlet not compiled yet (access JSP in browser first)
- ❌ **Failed breakpoint**: Mapping error or servlet source not found

## Testing the Breakpoint Mapping

### Prerequisites
1. **Install the updated extension**: `code --install-extension vscode-jsp-debug-1.0.0.vsix`
2. **Java Extension Pack** must be installed
3. **Tomcat** running with JPDA debugging enabled
4. **Workspace configured** with `config.json`

### Step 1: Setup Test Environment

Create workspace structure:
```
my-webapp/
├── config.json
├── src/main/webapp/
│   ├── index.jsp
│   └── test/
│       └── debug.jsp
└── .vscode/
    └── launch.json
```

**config.json**:
```json
{
  "catalinaHome": "/path/to/tomcat",
  "catalinaBase": "/path/to/tomcat", 
  "webappContext": "my-webapp"
}
```

**launch.json**:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "jsp",
      "request": "attach",
      "name": "Debug JSP Files",
      "hostName": "localhost",
      "port": 8000
    }
  ]
}
```

### Step 2: Create Test JSP Files

**src/main/webapp/index.jsp**:
```jsp
<%@ page language="java" contentType="text/html; charset=UTF-8" %>
<!DOCTYPE html>
<html>
<head>
    <title>JSP Breakpoint Test</title>
</head>
<body>
    <h1>Testing JSP Breakpoints</h1>
    <%
        // SET BREAKPOINT HERE - Line 10
        String message = "Hello from JSP!";
        
        // SET BREAKPOINT HERE - Line 13  
        int counter = 0;
        for (int i = 0; i < 5; i++) {
            // SET BREAKPOINT HERE - Line 16
            counter += i;
            out.println("<p>Iteration " + i + ": " + counter + "</p>");
        }
        
        // SET BREAKPOINT HERE - Line 21
        out.println("<p>Final message: " + message + "</p>");
    %>
</body>
</html>
```

### Step 3: Start Tomcat with JPDA

```bash
# Linux/Mac
export JPDA_ADDRESS=8000
$CATALINA_HOME/bin/catalina.sh jpda start

# Windows
set JPDA_ADDRESS=8000
%CATALINA_HOME%\bin\catalina.bat jpda start
```

### Step 4: Deploy and Access JSP

1. **Deploy webapp** to Tomcat
2. **Access JSP** in browser: `http://localhost:8080/my-webapp/index.jsp`
3. **Verify servlet compilation**: Check `$CATALINA_BASE/work/Catalina/localhost/my-webapp/org/apache/jsp/`

Expected files:
```
index_jsp.class
index_jsp.java  ← This contains the line mappings
```

### Step 5: Test Breakpoint Mapping

1. **Open `index.jsp`** in VS Code
2. **Set breakpoints** on lines 10, 13, 16, and 21
3. **Check Debug Console** for mapping messages:
   ```
   ✓ JSP breakpoint mapped: index.jsp:10 -> index_jsp.java:45
   ✓ JSP breakpoint mapped: index.jsp:13 -> index_jsp.java:48
   ✓ JSP breakpoint mapped: index.jsp:16 -> index_jsp.java:52
   ✓ JSP breakpoint mapped: index.jsp:21 -> index_jsp.java:58
   ```

4. **Check mapping file**: `.vscode/jsp-debug/index.mapping.json`
   ```json
   {
     "jspFile": "/path/to/src/main/webapp/index.jsp",
     "servletFile": "/path/to/work/org/apache/jsp/index_jsp.java", 
     "mappings": [
       { "jspLine": 10, "servletLine": 45 },
       { "jspLine": 13, "servletLine": 48 },
       { "jspLine": 16, "servletLine": 52 },
       { "jspLine": 21, "servletLine": 58 }
     ]
   }
   ```

### Step 6: Start Debug Session

1. **Press F5** or use Debug panel
2. **Select "Debug JSP Files"** configuration  
3. **Check console output**:
   ```
   JSP Debug session started. Ready to debug JSP files.
   Parallel Java debug session started for JSP debugging
   ```

### Step 7: Test Breakpoint Hits

1. **Refresh browser** page: `http://localhost:8080/my-webapp/index.jsp`
2. **Debugger should stop** at your breakpoints
3. **Verify source mapping**: VS Code should show the JSP file, not the servlet
4. **Test stepping**: Step through code and watch variables

## Verification Commands

Use extension commands to verify setup:

### Show Compiled Servlet Path
1. Open JSP file
2. **Ctrl+Shift+P** → "JSP: Show Compiled Servlet Path"
3. Should display servlet class location and compilation status

### Validate Setup
1. **Ctrl+Shift+P** → "JSP: Validate Setup"
2. Checks configuration, paths, and servlet directory

## Troubleshooting Breakpoint Issues

### ⚠️ "Servlet not compiled"
**Solution**: Access JSP in browser first to trigger compilation

### ❌ "Failed to map JSP breakpoint"  
**Solutions**:
- Check `config.json` paths are correct
- Verify webapp is deployed to correct context
- Ensure Tomcat work directory exists and is writable

### 🔧 "Java debug session not available"
**Solutions**:
- Install Java Extension Pack
- Verify Tomcat is running with JPDA (`netstat -an | grep 8000`)
- Check port number in debug configuration

### 📁 "Servlet source not found"
**Solutions**:
- Tomcat may not generate `.java` files (check configuration)
- Work directory might be in different location
- Check file permissions

## Advanced Testing

### Test Multiple JSP Files
Create multiple JSP files and set breakpoints in each to test concurrent mapping.

### Test Nested Directories  
Create JSP files in subdirectories like `admin/login.jsp` to test path mapping.

### Test Different Line Types
Set breakpoints on:
- Variable declarations
- Method calls
- Loop iterations
- Conditional statements
- JSP scriptlets and expressions

### Verify Line Number Accuracy
Compare where debugger stops in servlet vs. expected JSP line numbers.

## Expected Behavior

✅ **Correct mapping**: Breakpoints in JSP files should pause execution at equivalent servlet lines
✅ **Source display**: VS Code should show JSP source, not servlet source
✅ **Variable inspection**: Should work normally with servlet variables
✅ **Step debugging**: Stepping should follow JSP source flow
✅ **Multiple files**: Can debug multiple JSP files simultaneously

## Performance Notes

- **First-time setup** may take longer as servlets compile
- **Mapping files** are cached for faster subsequent debugging
- **Large JSP files** may have slower mapping parsing
- **Memory usage** increases with more mapped files

This comprehensive testing approach ensures the breakpoint mapping works correctly and provides a good debugging experience for JSP development.