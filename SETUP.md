# Setup Guide

## Prerequisites

Tomcat, VS Code, Java Extension Pack, JDK with javap

## Install

Install from VSIX using Extensions: Install from VSIX

## Config

Create config.json in project root:

```json
{
  "catalinaHome": "C:/apache-tomcat-9.0.80",
  "webappContext": "myapp",
  "jspSourceRoot": "src/main/webapp"
}
```

catalinaHome is Tomcat directory
webappContext is app context name
jspSourceRoot is JSP location (Maven: src/main/webapp, Eclipse: WebContent)

## Enable Debugging

Windows setenv.bat:

```batch
set CATALINA_OPTS=-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:8000
```

Linux/Mac setenv.sh:

```bash
export CATALINA_OPTS="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:8000"
chmod +x setenv.sh
```

## VS Code Config

Create launch.json:

```json
{
  "version": "0.2.0",
  "configurations": [{
    "type": "java",
    "request": "attach",
    "name": "Debug Tomcat",
    "hostName": "localhost",
    "port": 8000
  }]
}
```

## Debug

1. Start Tomcat
2. Access JSP in browser
3. Set breakpoints
4. Press F5
5. Refresh browser

## Troubleshooting

Breakpoints unverified - Access JSP in browser first
Cannot find servlet - Check webappContext and catalinaHome
Wrong line - Restart Tomcat
No logs - Set enableDebugLogging true
javap missing - Install JDK
