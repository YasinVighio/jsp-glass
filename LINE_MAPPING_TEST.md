# JSP Line Mapping Test Guide

## How the Improved Line Mapping Works

The extension now properly maps JSP lines to servlet lines using multiple methods:

### 1. SMAP (Source Map) Parsing
- Reads JSR-45 SMAP data from `.class` files
- Most accurate method when available
- Handles complex JSP structures

### 2. Line Comment Parsing  
- Parses Tomcat's `// line X "file.jsp"` comments
- Fallback when SMAP is not available
- Works with most Tomcat versions

### 3. Line Number Estimation
- Uses ratio-based estimation as last resort
- Better than 1:1 mapping but less accurate

## Testing the Line Mapping

### Step 1: Create Test JSP
Create a test JSP file with various constructs:

```jsp
<%@ page language="java" contentType="text/html; charset=UTF-8" %>
<!DOCTYPE html>
<html>
<head>
    <title>Test JSP</title>
</head>
<body>
    <h1>Line Mapping Test</h1>
    <%
        // JSP scriptlet - should map correctly
        String message = "Hello World";
        int count = 42;
        
        // This line should map to servlet line
        System.out.println("Debug point here"); // Line 13
    %>
    
    <p>Message: <%= message %></p>
    <p>Count: <%= count %></p>
    
    <%
        // Another scriptlet
        for(int i = 0; i < 3; i++) {
            out.println("<p>Loop iteration: " + i + "</p>"); // Line 22
        }
    %>
</body>
</html>
```

### Step 2: Verify Servlet Generation
1. Start Tomcat with debugging enabled
2. Access the JSP in browser to trigger compilation
3. Check generated servlet file in: `{tomcatBase}/work/Catalina/localhost/{context}/org/apache/jsp/`

### Step 3: Test Breakpoint Mapping
1. Set breakpoints on JSP lines 13 and 22 (the System.out.println lines)
2. Open VS Code Developer Console to see mapping debug output
3. Look for messages like:
   ```
   JSP Debug: Mapping JSP line 13 to servlet line X using SMAP data
   JSP Debug: Found line mapping: JSP line 13 -> Servlet line 45
   ```

### Step 4: Verify Debug Session
1. Attach Java debugger to Tomcat
2. Trigger JSP execution in browser
3. Breakpoints should hit at correct servlet lines
4. Source should remap back to JSP file with correct line numbers

## Expected Debug Output

When working correctly, you should see:

```
JSP Debug: Loading SMAP data from class file
JSP Debug: Found SMAP section with X line mappings
JSP Debug: Mapping JSP line 13 to servlet line 45 using SMAP data
JSP Debug: Setting breakpoint in servlet at line 45
JSP Debug: Breakpoint hit - remapping servlet:45 back to JSP:13
```

## Troubleshooting Line Mapping

### If lines don't map correctly:

1. **Check SMAP availability:**
   - Ensure Tomcat generates SMAP data
   - Verify `.class` files contain debug info

2. **Verify line comments:**
   - Check if servlet has `// line X "file.jsp"` comments
   - Ensure `keepgenerated=true` in Tomcat config

3. **Test with simple JSP:**
   - Start with basic scriptlet
   - Gradually add complexity

4. **Check debug output:**
   - Look for line mapping method used
   - Verify calculated line numbers

The improved line mapping should now correctly handle most JSP constructs and provide accurate breakpoint placement.