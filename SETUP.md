# JSP Glass - Setup & Configuration Guide# JSP Debug Extension - Quick Setup Guide



This guide will walk you through setting up JSP Glass for debugging JSP files in Apache Tomcat.## Prerequisites



## 📋 Table of Contents1. **Install Java Extension Pack** in VS Code

2. **Apache Tomcat** installed and configured

1. [Prerequisites](#prerequisites)3. **Java project** with JSP files

2. [Installation](#installation)

3. [Tomcat Configuration](#tomcat-configuration)## Step-by-Step Setup

4. [VS Code Configuration](#vs-code-configuration)

5. [Project Structure](#project-structure)### 1. Install the Extension

6. [Testing the Setup](#testing-the-setup)

7. [Advanced Configuration](#advanced-configuration)```bash

8. [Common Issues](#common-issues)code --install-extension vscode-jsp-debug-1.0.0.vsix

```

## Prerequisites

### 2. Configure Workspace

### Required Software

Create `config.json` in your workspace root:

#### 1. Java Development Kit (JDK)

```json

**Minimum Version:** JDK 8 or higher{

  "catalinaHome": "/path/to/your/tomcat",

**Verification:**  "webappContext": "your-webapp-name"

```bash}

javap -version```

```

**Windows Example:**

**Expected output:**```json

```{

javap 11.0.x (or higher)  "catalinaHome": "C:\\apache-tomcat-9.0.65",

```  "webappContext": "myapp"

}

**Installation:**```

- Windows: Download from [Oracle JDK](https://www.oracle.com/java/technologies/downloads/) or [OpenJDK](https://adoptium.net/)

- Linux: `sudo apt install openjdk-11-jdk`**Linux/Mac Example:**

- Mac: `brew install openjdk@11````json

{

**Important:** Ensure `javap` is in your system PATH.  "catalinaHome": "/opt/tomcat",

  "webappContext": "ROOT"

#### 2. Apache Tomcat}

```

**Minimum Version:** Tomcat 8.5 or higher (Tomcat 9.x recommended)

### 3. Start Tomcat with Debugging

**Download:** [Apache Tomcat Downloads](https://tomcat.apache.org/download-90.cgi)

**Windows:**

**Installation:**```cmd

1. Extract Tomcat to a directory (e.g., `C:\apache-tomcat-9.0.34` or `/opt/tomcat`)%CATALINA_HOME%\bin\catalina.bat jpda start

2. Set `CATALINA_HOME` environment variable (optional but recommended)```



#### 3. Visual Studio Code**Linux/Mac:**

```bash

**Minimum Version:** 1.74.0 or higher$CATALINA_HOME/bin/catalina.sh jpda start

```

**Download:** [VS Code](https://code.visualstudio.com/)

Or with custom port:

#### 4. VS Code Extensions```bash

export JPDA_ADDRESS=8001

Install these extensions from the VS Code marketplace:$CATALINA_HOME/bin/catalina.sh jpda start

```

1. **Language Support for Java(TM) by Red Hat** (required)

   - Extension ID: `redhat.java`### 4. Configure VS Code Debug

   - Provides Java language support

Create `.vscode/launch.json`:

2. **Debugger for Java** (required)

   - Extension ID: `vscjava.vscode-java-debug````json

   - Provides Java debugging capabilities{

  "version": "0.2.0",

**Install via command line:**  "configurations": [

```bash    {

code --install-extension redhat.java      "type": "jsp",

code --install-extension vscjava.vscode-java-debug      "request": "attach",

```      "name": "Debug JSP",

      "hostName": "localhost",

## Installation      "port": 8000

    }

### Method 1: From VSIX File  ]

}

```bash```

code --install-extension jsp-glass-1.0.0.vsix

```### 5. Deploy and Access JSP



### Method 2: From VS Code Marketplace1. Deploy your webapp to Tomcat

2. Access JSP files in browser to trigger compilation

1. Open VS Code3. Compiled servlets will be in `$CATALINA_BASE/work/Catalina/localhost/[context]/org/apache/jsp/`

2. Go to Extensions (Ctrl+Shift+X)

3. Search for "JSP Glass"### 6. Start Debugging

4. Click Install

1. Open JSP file in VS Code

## Tomcat Configuration2. Set breakpoints by clicking line numbers

3. Press `F5` or use Debug panel

### 1. Enable JSP Source Retention (Recommended)4. Access JSP in browser

5. Debugger should stop at breakpoints!

This keeps the generated `.java` files for fallback mapping.

## Common Project Structures

**Edit:** `<TOMCAT_HOME>/conf/web.xml`

### Maven Web App

Find the `jsp` servlet configuration and add:```

src/

```xml└── main/

<servlet>    └── webapp/

    <servlet-name>jsp</servlet-name>        ├── index.jsp

    <servlet-class>org.apache.jasper.servlet.JspServlet</servlet-class>        ├── WEB-INF/

    <init-param>        │   └── web.xml

        <param-name>keepgenerated</param-name>        └── pages/

        <param-value>true</param-value>            └── admin.jsp

    </init-param>```

    <init-param>

        <param-name>development</param-name>### Eclipse Dynamic Web Project

        <param-value>true</param-value>```

    </init-param>WebContent/

    <init-param>├── index.jsp

        <param-name>mappedfile</param-name>├── META-INF/

        <param-value>true</param-value>├── WEB-INF/

    </init-param>│   └── web.xml

    <load-on-startup>3</load-on-startup>└── pages/

</servlet>    └── login.jsp

``````



**Parameters explained:**## Troubleshooting

- `keepgenerated`: Keeps the generated `.java` servlet source files

- `development`: Enables automatic JSP recompilation on changes### Extension Commands

- `mappedfile`: Generates SMAP with accurate line mappings

- **Show Compiled Servlet Path**: `Ctrl+Shift+P` → "JSP: Show Compiled Servlet Path"

### 2. Enable JPDA Debugging- **Validate Setup**: `Ctrl+Shift+P` → "JSP: Validate Setup"



Tomcat must be started in debug mode to allow VS Code to attach.### Common Issues



**Windows:** Create or modify `<TOMCAT_HOME>/bin/setenv.bat`:1. **"Servlet class not found"**

   - Access JSP in browser first to trigger compilation

```batch   - Check `config.json` paths

set CATALINA_OPTS=-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:8000   - Verify webapp is deployed

```

2. **"Cannot connect to debugger"**

**Linux/Mac:** Create or modify `<TOMCAT_HOME>/bin/setenv.sh`:   - Ensure Tomcat started with JPDA (`jpda start`)

   - Check port 8000 is not blocked

```bash   - Verify Java debug extension is installed

#!/bin/bash

export CATALINA_OPTS="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:8000"3. **Breakpoints not hit**

```   - Confirm servlet class exists in work directory

   - Set breakpoints on executable lines (not comments)

Make it executable:   - Check webapp context in config matches deployment

```bash

chmod +x setenv.sh### Debug Tomcat Startup

```

Check JPDA is enabled:

**Start Tomcat in debug mode:**```bash

# Should show port 8000 listening

Windows:netstat -an | grep 8000

```cmd

cd <TOMCAT_HOME>\bin# Check Tomcat logs

catalina.bat jpda starttail -f $CATALINA_BASE/logs/catalina.out

``````



Linux/Mac:## Advanced Configuration

```bash

cd <TOMCAT_HOME>/bin### Custom JPDA Port

./catalina.sh jpda start```json

```{

  "type": "jsp",

**Verify debug port:**  "request": "attach",

You should see:  "name": "Debug JSP (Custom Port)",

```  "hostName": "localhost",

Listening for transport dt_socket at address: 8000  "port": 8001

```}

```

### 3. Locate Tomcat Work Directory

### Multiple Contexts

The work directory contains compiled JSP servlets:```json

{

**Default locations:**  "catalinaHome": "/opt/tomcat",

- Windows: `<TOMCAT_HOME>\work\Catalina\localhost\<your-app-name>\org\apache\jsp\`  "catalinaBase": "/var/tomcat",

- Linux/Mac: `<TOMCAT_HOME>/work/Catalina/localhost/<your-app-name>/org/apache/jsp/`  "webappContext": "admin"

}

**Example:**```

```

F:/apache-tomcat-9.0.34/work/Catalina/localhost/demo/org/apache/jsp/### Remote Debugging

``````json

{

After accessing a JSP (e.g., `index.jsp`), you should see:  "type": "jsp",

- `index_jsp.class` (required for SMAP extraction)  "request": "attach",

- `index_jsp.java` (optional, for fallback)  "name": "Debug Remote JSP",

  "hostName": "192.168.1.100",

## VS Code Configuration  "port": 8000

}

### 1. Workspace Settings```

Create or edit `.vscode/settings.json` in your project root:

```json
{
  "jsp.tomcatWorkDirectory": "F:/apache-tomcat-9.0.34/work",
  "jsp.enableDebugLogging": true,
  "java.debug.settings.console": "integratedTerminal"
}
```

**Settings explained:**
- `jsp.tomcatWorkDirectory`: Path to Tomcat's work directory (use forward slashes)
- `jsp.enableDebugLogging`: Enable verbose debug output in Developer Console
- `java.debug.settings.console`: Use integrated terminal for better output

**Finding your work directory:**
1. Start Tomcat
2. Access any JSP page in browser
3. Look for compiled servlets in `<TOMCAT_HOME>/work/`

### 2. Launch Configuration

Create or edit `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "java",
      "name": "Debug Tomcat JSP",
      "request": "attach",
      "hostName": "localhost",
      "port": 8000,
      "sourcePaths": [
        "${workspaceFolder}/src/main/webapp",
        "${workspaceFolder}/WebContent"
      ],
      "projectName": "your-project-name"
    }
  ]
}
```

**Configuration explained:**
- `type`: Must be "java" for JSP Glass to activate
- `request`: "attach" to connect to running Tomcat
- `hostName`: Tomcat server address (usually localhost)
- `port`: Debug port (8000 for JPDA)
- `sourcePaths`: Directories containing JSP files

**Multiple JSP directories:**
```json
"sourcePaths": [
  "${workspaceFolder}/src/main/webapp",
  "${workspaceFolder}/src/main/webapp/pages",
  "${workspaceFolder}/WebContent/WEB-INF/jsp"
]
```

## Project Structure

### Typical Maven Project

```
your-project/
├── .vscode/
│   ├── settings.json          # Tomcat work directory config
│   └── launch.json            # Debug configuration
├── src/
│   └── main/
│       ├── java/              # Java source files
│       └── webapp/            # JSP files here
│           ├── index.jsp
│           ├── login.jsp
│           └── WEB-INF/
│               └── web.xml
└── pom.xml
```

### Traditional Web Project

```
your-project/
├── .vscode/
│   ├── settings.json
│   └── launch.json
├── WebContent/                # JSP files here
│   ├── index.jsp
│   ├── pages/
│   │   └── home.jsp
│   └── WEB-INF/
│       └── web.xml
└── src/
    └── com/
        └── example/           # Java source files
```

## Testing the Setup

### Step-by-Step Test

#### 1. Start Tomcat in Debug Mode

```bash
# Windows
catalina.bat jpda start

# Linux/Mac
./catalina.sh jpda start
```

Verify output:
```
Listening for transport dt_socket at address: 8000
```

#### 2. Deploy Your Application

Deploy your WAR file or project to Tomcat's `webapps` directory.

#### 3. Access JSP in Browser

Navigate to your JSP page to trigger compilation:
```
http://localhost:8080/your-app/index.jsp
```

#### 4. Verify Compiled Servlet

Check that the servlet was compiled:
```
<TOMCAT_HOME>/work/Catalina/localhost/your-app/org/apache/jsp/index_jsp.class
```

#### 5. Set Breakpoint in JSP

1. Open `index.jsp` in VS Code
2. Click in the left gutter on a line with code (not HTML)
3. A red dot should appear

#### 6. Start Debugging

1. Press F5 or click "Run and Debug"
2. Select "Debug Tomcat JSP" configuration
3. You should see "Debugger attached" in Debug Console

#### 7. Trigger Breakpoint

Refresh your JSP page in the browser. The debugger should stop at your breakpoint!

**Expected behavior:**
- Debugger stops in `.jsp` file (not `_jsp.java`)
- Line number matches where you set the breakpoint
- Variables are visible in Debug panel

### Verify SMAP Extraction

Open VS Code Developer Tools (Help → Toggle Developer Tools) and check the Console:

```
JSP Debug: === JAVAP-BASED SMAP EXTRACTION ===
JSP Debug: Running javap -v to extract SMAP from: F:/apache-tomcat-9.0.34/work/.../index_jsp.class
JSP Debug: javap -v output received (25643 bytes)
JSP Debug: Found SourceDebugExtension in javap output
JSP Debug: Extracted 45 SMAP mappings from javap
JSP Debug: ✅ EXACT SMAP MAPPING - JSP line 7 -> Servlet line 128
```

## Advanced Configuration

### Custom Tomcat Locations

If your Tomcat uses non-standard directories:

```json
{
  "jsp.tomcatWorkDirectory": "D:/custom-location/work",
  "jsp.tomcatWebappsDirectory": "D:/custom-location/webapps"
}
```

### Remote Debugging

Debug JSP on a remote Tomcat server:

```json
{
  "type": "java",
  "name": "Debug Remote Tomcat",
  "request": "attach",
  "hostName": "192.168.1.100",  // Remote server IP
  "port": 8000,
  "sourcePaths": [
    "${workspaceFolder}/src/main/webapp"
  ]
}
```

**Remote Tomcat setup:**
```bash
export CATALINA_OPTS="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=0.0.0.0:8000"
```

### Docker Tomcat

Debug JSP in Docker container:

**docker-compose.yml:**
```yaml
services:
  tomcat:
    image: tomcat:9.0
    ports:
      - "8080:8080"
      - "8000:8000"  # Debug port
    environment:
      - CATALINA_OPTS=-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:8000
    volumes:
      - ./target:/usr/local/tomcat/webapps
      - tomcat-work:/usr/local/tomcat/work

volumes:
  tomcat-work:
```

**VS Code settings.json:**
```json
{
  "jsp.tomcatWorkDirectory": "\\\\wsl$\\docker-desktop\\mnt\\wsl\\docker-desktop-bind-mounts\\Ubuntu\\..."
}
```

## Common Issues

### Issue 1: "javap not found"

**Error:**
```
JSP Debug: Error running javap -v: javap: command not found
```

**Solution:**
1. Install JDK (not just JRE)
2. Add JDK bin directory to PATH:
   - Windows: `C:\Program Files\Java\jdk-11\bin`
   - Linux/Mac: `/usr/lib/jvm/java-11-openjdk/bin`
3. Restart VS Code

**Test:**
```bash
javap -version
```

### Issue 2: "Compiled servlet not found"

**Error:**
```
JSP Debug: Servlet class file not found
```

**Solutions:**
1. Access the JSP in browser first to trigger compilation
2. Verify Tomcat work directory path in settings
3. Check Tomcat logs for compilation errors

### Issue 3: Wrong line numbers

**Symptom:** Debugger stops at wrong line in JSP

**Solutions:**
1. Restart Tomcat to recompile JSPs
2. Clear Tomcat work directory and recompile
3. Enable `keepgenerated` and `mappedfile` in Tomcat config
4. Check for JSP syntax errors that break SMAP generation

### Issue 4: Breakpoints not hit

**Checklist:**
- [ ] Tomcat started with JPDA debug mode
- [ ] VS Code debugger attached (check Debug Console)
- [ ] JSP compiled (check work directory for .class file)
- [ ] Breakpoint on executable line (not HTML/comment)
- [ ] JSP actually accessed in browser after setting breakpoint

### Issue 5: Permission denied on work directory

**Windows:** Run VS Code as Administrator or adjust folder permissions

**Linux/Mac:**
```bash
sudo chmod -R 755 <TOMCAT_HOME>/work
sudo chown -R $USER:$USER <TOMCAT_HOME>/work
```

## Getting Help

If you encounter issues:

1. **Enable Debug Logging:**
   ```json
   {
     "jsp.enableDebugLogging": true
   }
   ```

2. **Check Developer Console:** Help → Toggle Developer Tools → Console

3. **Check Tomcat Logs:** `<TOMCAT_HOME>/logs/catalina.out`

4. **Test javap manually:**
   ```bash
   javap -v <TOMCAT_WORK>/org/apache/jsp/index_jsp.class | grep -A20 "SMAP"
   ```

5. **Report Issues:** Include console output and configuration files

---

**Setup complete!** You should now be able to debug JSP files with accurate breakpoint mapping. 🎉
