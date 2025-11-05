# 🎯 JSP Source Mapping - FIXED Implementation Guide

## 🔧 **What's Fixed**

The extension now properly maps JSP files to servlet sources during debugging. When you set breakpoints in JSP files and debug, **VS Code will show the JSP source instead of the servlet source**.

### ✅ **Key Improvements**

1. **Real Java Debugger Integration**: Uses VS Code's Java debugger directly instead of custom adapter
2. **Debug Adapter Tracker**: Intercepts debug messages and remaps servlet sources back to JSP
3. **Automatic Breakpoint Mapping**: Sets breakpoints in servlet files when you set them in JSP files
4. **Source File Remapping**: When debugger stops in servlet, shows the corresponding JSP file
5. **Line Number Mapping**: Maps servlet line numbers back to original JSP line numbers

## 🚀 **How to Test the Fix**

### Step 1: Install Updated Extension
```bash
code --install-extension vscode-jsp-debug-1.0.0.vsix
```

### Step 2: Setup Test Environment

Create your workspace structure:
```
my-webapp/
├── config.json
├── src/main/webapp/
│   └── index.jsp
└── .vscode/
    └── launch.json
```

**config.json**:
```json
{
  "catalinaHome": "C:\\apache-tomcat-9.0.65",
  "webappContext": "demo"
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

### Step 3: Create Test JSP

**src/main/webapp/index.jsp**:
```jsp
<%@ page language="java" contentType="text/html; charset=UTF-8" %>
<%@ page import="java.util.Date" %>
<!DOCTYPE html>
<html>
<head>
    <title>JSP Source Mapping Test</title>
</head>
<body>
    <h1>Testing JSP Source Mapping</h1>
    <%
        // SET BREAKPOINT HERE - Line 11
        String message = "Hello from JSP!";
        
        // SET BREAKPOINT HERE - Line 14
        Date currentDate = new Date();
        
        for (int i = 0; i < 3; i++) {
            // SET BREAKPOINT HERE - Line 18
            out.println("<p>Iteration " + i + "</p>");
        }
        
        // SET BREAKPOINT HERE - Line 22
        out.println("<p>Current time: " + currentDate + "</p>");
    %>
</body>
</html>
```

### Step 4: Start Tomcat with JPDA
```bash
# Set JPDA port
export JPDA_ADDRESS=8000

# Start Tomcat with debugging
$CATALINA_HOME/bin/catalina.sh jpda start
```

### Step 5: Deploy and Access JSP
1. Deploy your webapp to Tomcat
2. Access JSP in browser: `http://localhost:8080/demo/index.jsp`
3. This compiles the JSP and creates servlet files

### Step 6: Test Breakpoint Mapping

1. **Open `index.jsp`** in VS Code
2. **Set breakpoints** on lines 11, 14, 18, and 22
3. **Check Debug Console** - you should see:
   ```
   JSP breakpoint mapped: index.jsp:11 -> index_jsp.java:45
   JSP breakpoint mapped: index.jsp:14 -> index_jsp.java:48
   ```

4. **Start debugging** (F5) and select "Debug JSP Files"
5. **Refresh browser** to trigger breakpoints

### 🎯 **Expected Behavior (FIXED)**

**Before (Broken)**:
- Debugger stops in `index_jsp.java` servlet file
- You see servlet code instead of JSP code
- Confusing debugging experience

**After (Fixed)**:
- ✅ Debugger stops and **shows `index.jsp` file**
- ✅ **JSP source code** is displayed, not servlet code  
- ✅ **Correct line numbers** in JSP file
- ✅ **Variables and stepping** work normally
- ✅ **Call stack** shows JSP file names

## 🔍 **How the Source Mapping Works**

### 1. **Debug Configuration**
- JSP debug type (`jsp`) converts to Java debug type (`java`)
- Marked with `_isJspDebug: true` flag
- Uses real Java debugger for JDWP communication

### 2. **Breakpoint Manager**
- Listens for breakpoints set in JSP files
- Finds corresponding servlet source files
- Parses line mappings from servlet comments
- Sets additional breakpoints in servlet files

### 3. **Debug Tracker**
- Intercepts debug adapter messages
- Detects when debugger stops in servlet files
- Remaps servlet source paths to JSP file paths
- Converts servlet line numbers to JSP line numbers
- Forces VS Code to display JSP source

### 4. **Line Number Mapping**
```java
// Servlet file contains comments like:
// Line 11, JSP file: /index.jsp
out.write("Hello from JSP!");  // This maps to JSP line 11
```

## 🧪 **Testing Checklist**

### ✅ **Breakpoint Setting**
- [ ] Set breakpoints in JSP file
- [ ] See confirmation messages in Debug Console
- [ ] Verify servlet breakpoints are created automatically

### ✅ **Debug Session**
- [ ] Start JSP debug configuration
- [ ] Java debug session starts successfully
- [ ] Can attach to Tomcat on port 8000

### ✅ **Source Mapping** 
- [ ] Debugger stops and shows JSP file (not servlet)
- [ ] Correct JSP line numbers highlighted
- [ ] Call stack shows JSP file names
- [ ] Variables panel works correctly

### ✅ **Stepping**
- [ ] Step Over (F10) works in JSP context
- [ ] Step Into (F11) works in JSP context  
- [ ] Step Out (Shift+F11) works in JSP context
- [ ] Continue (F5) resumes execution

### ✅ **Multiple Files**
- [ ] Can debug multiple JSP files simultaneously
- [ ] Source mapping works for different JSP files
- [ ] Nested directory JSPs work correctly

## 🐛 **Troubleshooting**

### Issue: Still seeing servlet files
**Solution**: 
- Ensure extension is latest version (205.06KB)
- Check Debug Console for mapping messages
- Verify Java Extension Pack is installed
- Restart VS Code after extension install

### Issue: Breakpoints not hit
**Solution**:
- Access JSP in browser first to compile it
- Check servlet files exist in work directory
- Verify JPDA debugging is enabled on Tomcat
- Check port 8000 is not blocked

### Issue: Wrong line numbers
**Solution**:
- Servlet comments may be malformed
- Try accessing JSP again to regenerate servlet
- Check servlet source file for line mapping comments

## 🎉 **Success Indicators**

When working correctly, you should see:

1. **Debug Console Output**:
   ```
   JSP Debug session started. Breakpoints in JSP files will be mapped to servlet classes.
   JSP breakpoint mapped: index.jsp:11 -> index_jsp.java:45
   ```

2. **Debug View**: 
   - Call stack shows `index.jsp` files
   - Source editor displays JSP content
   - Line numbers match JSP file

3. **Breakpoints Panel**:
   - JSP breakpoints appear verified (✓)
   - Additional servlet breakpoints may be visible

This implementation should finally provide the proper JSP debugging experience you expect, similar to Eclipse or IntelliJ!