<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="java.util.Date" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>JSP Debug Example</title>
</head>
<body>
    <h1>JSP Debug Extension Example</h1>
    
    <%
        // Set a breakpoint on this line to test JSP debugging
        String message = "Hello from JSP!";
        Date currentDate = new Date();
        
        // This loop can be debugged step by step
        for (int i = 0; i < 3; i++) {
            out.println("<p>Loop iteration: " + i + "</p>");
        }
    %>
    
    <p>Message: <%= message %></p>
    <p>Current time: <%= currentDate %></p>
    
    <%
        // Another breakpoint location
        String debugInfo = "JSP debugging works!";
    %>
    
    <p>Debug info: <%= debugInfo %></p>
    
    <h2>Instructions</h2>
    <ol>
        <li>Start Tomcat with JPDA debugging: <code>catalina.sh jpda start</code></li>
        <li>Deploy this JSP to your webapp</li>
        <li>Set breakpoints in the JSP code above</li>
        <li>Start the JSP debug session in VS Code</li>
        <li>Access this page in your browser</li>
        <li>The debugger should stop at your breakpoints!</li>
    </ol>
</body>
</html>