# JSP Glass 🔍

**Debug JSP files on Apache Tomcat with accurate breakpoint mapping.**

⚠️ **Beta Software**: Version 1.0.0 may contain bugs. See [DISCLAIMER.md](DISCLAIMER.md) for details.

![JSP Glass Logo](icon.png)

## Features

- 🎯 Set breakpoints directly in `.jsp` files
- 🔄 Automatic line mapping between JSP and servlet code
- 📊 SMAP-based (same technology as Eclipse/IntelliJ)
- 🔍 Debugger shows JSP files, not generated servlet code

## Requirements

- Visual Studio Code 1.74.0+
- JDK 8+ with `javap` in PATH
- Apache Tomcat 8.5+ with JPDA debugging enabled
- [Java Extension Pack](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-pack)

## Quick Start

### 1. Configure Workspace

`.vscode/settings.json`:
```json
{
  "jsp.tomcatWorkDirectory": "F:/apache-tomcat-9.0.34/work"
}
```

### 2. Configure Debug

`.vscode/launch.json`:
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

### 3. Start Tomcat in Debug Mode

**Windows:**
```cmd
catalina.bat jpda start
```

**Linux/Mac:**
```bash
catalina.sh jpda start
```

### 4. Debug

1. Access your JSP in browser (to trigger compilation)
2. Open JSP file in VS Code
3. Set breakpoints
4. Press F5 to attach debugger
5. Refresh JSP page → breakpoint hits! ✅

## Troubleshooting

**Breakpoints don't work:**
- Ensure JSP accessed in browser first
- Check Tomcat work directory path in settings
- Verify `javap` is in PATH: `javap -version`

**Wrong line numbers:**
- Restart Tomcat to recompile JSPs
- Clear Tomcat work directory

**Enable debug logging:**
```json
{
  "jsp.enableDebugLogging": true
}
```
Then check: Help → Toggle Developer Tools → Console

## Documentation

- **[SETUP.md](SETUP.md)** - Detailed setup guide
- **[IMPLEMENTATION.md](IMPLEMENTATION.md)** - Technical details
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Command reference
- **[DISCLAIMER.md](DISCLAIMER.md)** - Beta software notice

## How It Works

1. Tomcat compiles JSP → Servlet with SMAP (source map)
2. Extension extracts SMAP using `javap -v`
3. Maps JSP line numbers ↔ Servlet line numbers
4. Intercepts debug messages to show JSP files

Technical details in [IMPLEMENTATION.md](IMPLEMENTATION.md).

## License

MIT License - see [LICENSE](LICENSE) file.

## Support

- **Issues**: [GitHub Issues](https://github.com/YasinVighio/jsp-glass/issues)
- **Repository**: [github.com/YasinVighio/jsp-glass](https://github.com/YasinVighio/jsp-glass)

---

**JSP Glass** by syntaxkraken - Making JSP debugging transparent! 🔍✨
