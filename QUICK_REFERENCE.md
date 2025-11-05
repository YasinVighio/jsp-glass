# JSP Glass - Quick Reference

## 🚀 Quick Start (5 Minutes)

### 1. Prerequisites Check
```bash
# Verify JDK installed
javap -version

# Verify VS Code extensions
code --list-extensions | grep -E "redhat.java|vscjava.vscode-java-debug"
```

### 2. Configure Tomcat
Edit `<TOMCAT_HOME>/bin/setenv.bat` (Windows) or `setenv.sh` (Linux/Mac):
```bash
# Windows (setenv.bat)
set CATALINA_OPTS=-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:8000

# Linux/Mac (setenv.sh)
export CATALINA_OPTS="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:8000"
```

### 3. Start Tomcat in Debug Mode
```bash
# Windows
catalina.bat jpda start

# Linux/Mac
./catalina.sh jpda start
```

### 4. Configure VS Code

**.vscode/settings.json:**
```json
{
  "jsp.tomcatWorkDirectory": "F:/apache-tomcat-9.0.34/work"
}
```

**.vscode/launch.json:**
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
      "sourcePaths": ["${workspaceFolder}/src/main/webapp"]
    }
  ]
}
```

### 5. Debug!
1. Access JSP in browser to trigger compilation
2. Set breakpoint in `.jsp` file
3. Press **F5** to attach debugger
4. Refresh JSP page → breakpoint hits! ✅

---

## 🎯 Common Tasks

### Find Tomcat Work Directory
```bash
# Windows
dir "%CATALINA_HOME%\work\Catalina\localhost\your-app\org\apache\jsp\"

# Linux/Mac
ls -la $CATALINA_HOME/work/Catalina/localhost/your-app/org/apache/jsp/
```

### Verify JSP Compiled
After accessing JSP in browser:
```bash
# Look for .class file
ls work/Catalina/localhost/myapp/org/apache/jsp/index_jsp.class
```

### Test SMAP Extraction
```bash
javap -v path/to/index_jsp.class | grep -A20 "SMAP"
```

Expected output:
```
SourceDebugExtension:
  SMAP
  index_jsp.java
  JSP
  *S JSP
  *F
  + 0 index.jsp
    index.jsp
  *L
  7,52:128
  *E
```

### Enable Debug Logging
**.vscode/settings.json:**
```json
{
  "jsp.enableDebugLogging": true
}
```

Then open: **Help → Toggle Developer Tools → Console**

### Clear Compiled JSPs
```bash
# Stop Tomcat first
rm -rf <TOMCAT_HOME>/work/Catalina/localhost/your-app/*
# Or on Windows:
rmdir /s /q "%CATALINA_HOME%\work\Catalina\localhost\your-app"
```

---

## 🔧 Tomcat Configuration Quick Reference

### Enable JSP Debugging Features

Edit `<TOMCAT_HOME>/conf/web.xml`:

```xml
<servlet>
    <servlet-name>jsp</servlet-name>
    <servlet-class>org.apache.jasper.servlet.JspServlet</servlet-class>
    <init-param>
        <param-name>development</param-name>
        <param-value>true</param-value>
    </init-param>
    <init-param>
        <param-name>mappedfile</param-name>
        <param-value>true</param-value>
    </init-param>
    <init-param>
        <param-name>keepgenerated</param-name>
        <param-value>true</param-value>
    </init-param>
    <load-on-startup>3</load-on-startup>
</servlet>
```

**Parameters:**
- `development`: Auto-recompile JSPs on changes
- `mappedfile`: Generate accurate SMAP
- `keepgenerated`: Keep `.java` source files

---

## 📁 File Locations

### Tomcat Work Directory Structure
```
<TOMCAT_HOME>/work/
└── Catalina/
    └── localhost/
        └── your-app-name/
            └── org/
                └── apache/
                    └── jsp/
                        ├── index_jsp.class    # Required for SMAP
                        └── index_jsp.java     # Optional (if keepgenerated=true)
```

### Project Structure (Maven)
```
your-project/
├── .vscode/
│   ├── settings.json
│   └── launch.json
├── src/main/webapp/
│   ├── index.jsp           # Your JSP files here
│   └── WEB-INF/
│       └── web.xml
└── pom.xml
```

### Project Structure (Traditional)
```
your-project/
├── .vscode/
│   ├── settings.json
│   └── launch.json
├── WebContent/
│   ├── index.jsp           # Your JSP files here
│   └── WEB-INF/
│       └── web.xml
└── src/
    └── com/example/        # Java classes
```

---

## 🐛 Troubleshooting Quick Fixes

### "javap: command not found"
```bash
# Add JDK bin to PATH
export PATH="/usr/lib/jvm/java-11-openjdk/bin:$PATH"
# Or on Windows:
set PATH=C:\Program Files\Java\jdk-11\bin;%PATH%
```

### Breakpoint not hit
1. ✅ Tomcat started with `jpda start`?
2. ✅ VS Code debugger attached (check Debug Console)?
3. ✅ JSP accessed in browser to trigger compilation?
4. ✅ Breakpoint on executable line (not HTML/comment)?

### Wrong line numbers
1. Restart Tomcat to recompile JSPs
2. Clear work directory: `rm -rf <TOMCAT_HOME>/work/*`
3. Verify `mappedfile=true` in Tomcat config

### "Compiled servlet not found"
1. Access JSP in browser first
2. Verify work directory path in settings
3. Check for compilation errors in `catalina.out`

### Remote debugging not working
1. Check firewall allows port 8000
2. Verify Tomcat started with `address=0.0.0.0:8000` (not just `8000`)
3. Test connection: `telnet server-ip 8000`

---

## 📊 Debug Console Messages

### ✅ Working Correctly
```
JSP Debug: === JAVAP-BASED SMAP EXTRACTION ===
JSP Debug: Running javap -v to extract SMAP from: .../index_jsp.class
JSP Debug: javap -v output received (25643 bytes)
JSP Debug: Found SourceDebugExtension in javap output
JSP Debug: Extracted 45 SMAP mappings from javap
JSP Debug: ✅ EXACT SMAP MAPPING - JSP line 7 -> Servlet line 128
JSP Debug: ✅ REVERSE SMAP MAPPING - Servlet line 128 -> JSP line 7
```

### ❌ Problems to Fix
```
JSP Debug: Error running javap -v: javap: command not found
→ Install JDK and add to PATH

JSP Debug: Servlet class file not found: .../index_jsp.class
→ Access JSP in browser first

JSP Debug: ❌ NO SMAP MAPPING for JSP line 7
→ Check Tomcat config (mappedfile=true)
```

---

## 🔍 Verification Checklist

Before debugging:
- [ ] JDK installed with javap in PATH
- [ ] Tomcat configured for JPDA debugging
- [ ] Tomcat started with `jpda start`
- [ ] VS Code extensions installed (Java support)
- [ ] JSP Glass installed
- [ ] `.vscode/settings.json` configured with Tomcat work directory
- [ ] `.vscode/launch.json` configured with debug port
- [ ] JSP accessed in browser (to trigger compilation)
- [ ] `.class` file exists in work directory

During debugging:
- [ ] Debugger attached (no errors in Debug Console)
- [ ] Breakpoint shows as verified (solid red dot)
- [ ] Debug logging shows SMAP extraction succeeded
- [ ] Line mappings present in console

If working:
- [ ] Breakpoint in `.jsp` file stops debugger ✅
- [ ] Debugger shows `.jsp` file (not `_jsp.java`) ✅
- [ ] Line number matches where breakpoint was set ✅
- [ ] Variables visible in Debug panel ✅

---

## 📞 Getting Help

1. **Enable debug logging:**
   ```json
   { "jsp.enableDebugLogging": true }
   ```

2. **Check console:** Help → Toggle Developer Tools → Console

3. **Check Tomcat logs:**
   ```bash
   tail -f <TOMCAT_HOME>/logs/catalina.out
   ```

4. **Test manually:**
   ```bash
   javap -v <work-dir>/org/apache/jsp/index_jsp.class | grep -A20 "SMAP"
   ```

5. **Report issue with:**
   - VS Code version
   - Java version (`java -version`)
   - Tomcat version
   - `.vscode/settings.json`
   - `.vscode/launch.json`
   - Debug console output
   - Error messages

---

## 🎓 Learn More

- **Full Setup Guide:** `SETUP.md`
- **Technical Details:** `IMPLEMENTATION.md`
- **User Documentation:** `README.md`
- **Project Overview:** `PROJECT_SUMMARY.md`

---

**Happy JSP Debugging!** 🎉
