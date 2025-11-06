# JSP Glass

Debug JSP files on Apache Tomcat with accurate breakpoint mapping.

## What It Does

Set breakpoints in JSP files and debug them in VS Code. Extension maps JSP lines to servlet lines using SMAP data.

## Quick Setup

Create config.json:

```json
{
  "catalinaHome": "C:/apache-tomcat-9.0.80",
  "webappContext": "myapp",
  "jspSourceRoot": "src/main/webapp"
}
```

Enable Tomcat debugging in setenv.bat or setenv.sh:

```bash
export CATALINA_OPTS="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:8000"
```

Add to launch.json:

```json
{
  "type": "java",
  "request": "attach",
  "name": "Debug Tomcat",
  "hostName": "localhost",
  "port": 8000
}
```

## Usage

1. Start Tomcat
2. Open JSP in browser
3. Set breakpoints
4. Press F5
5. Refresh page

## How It Works

Tomcat embeds SMAP in compiled servlets. Extension extracts SMAP with javap and translates breakpoints.

## Requirements

VS Code 1.74+, Tomcat 9.x/10.x, Java Extension Pack, JDK with javap

## Config

catalinaHome - Tomcat path (required)
webappContext - App context (optional)
jspSourceRoot - JSP directory (required)

## More

SETUP.md for setup details
IMPLEMENTATION.md for technical info
DISCLAIMER.md for limitations

## Issues

https://github.com/YasinVighio/jsp-glass/issues

