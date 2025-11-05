# JSP Glass 🔍

**Debug JSP files on Apache Tomcat with crystal-clear breakpoint accuracy.**

JSP Glass is a Visual Studio Code extension that enables seamless debugging of JavaServer Pages (JSP) running on Apache Tomcat. Unlike traditional approaches, JSP Glass uses industry-standard SMAP (Source Map) extraction via `javap` to provide accurate line-by-line debugging between JSP source files and their compiled servlet counterparts.

⚠️ **Note**: This is version 1.0.0 and may contain bugs. See [DISCLAIMER.md](DISCLAIMER.md) for details.

![JSP Glass Logo](icon.png)

## ✨ Features

- **🎯 Accurate Breakpoint Mapping**: Set breakpoints in JSP files and debug with precision
- **🔄 Bidirectional Line Mapping**: Automatically maps between JSP source and compiled servlet lines
- **📊 SMAP-Based**: Uses Java's built-in `javap` tool for authoritative source mapping (same as Eclipse/IntelliJ)
- **🚀 Real-Time Debugging**: Step through JSP code while debugging servlet execution
- **🔍 Transparent Source Remapping**: Debugger shows JSP files instead of generated servlet code

## Requirements

- **⚡ Smart Interpolation**: Handles gaps in SMAP data with intelligent line estimation- [Java Extension Pack](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-pack) (includes Java Debug extension)

- Apache Tomcat with JPDA debugging enabled

## 📋 Prerequisites- Compiled JSP servlets (JSPs must be accessed at least once to generate servlet classes)



Before using JSP Glass, ensure you have:## Quick Start



1. **Visual Studio Code** (version 1.74.0 or higher)### 1. Install the Extension

2. **Java JDK** (version 8 or higher) - `javap` must be in your system PATH

3. **Apache Tomcat** (version 8 or higher)Install the JSP Debug extension from the VS Code marketplace or build from source.

4. **Java Debug Extension** for VS Code (by Microsoft)

5. **Tomcat Configuration**:### 2. Configure Your Workspace

   - JSP compilation must be enabled

   - Generated servlet `.class` files must be accessible in Tomcat's work directoryCreate a `config.json` file in your workspace root:

   - Optionally: Keep servlet `.java` source files for fallback mapping

```json

## 🚀 Quick Start{

  "catalinaHome": "/path/to/tomcat",

### 1. Installation  "catalinaBase": "/path/to/tomcat",

  "webappContext": "ROOT"

Install JSP Glass from the VS Code marketplace or from VSIX:}

```

```bash

code --install-extension jsp-glass-1.0.0.vsix### 3. Start Tomcat with JPDA

```

Start Tomcat with JPDA debugging enabled:

### 2. Configure Tomcat Work Directory

```bash

Create or update `.vscode/settings.json` in your workspace:# Linux/Mac

$CATALINA_HOME/bin/catalina.sh jpda start

```json

{# Windows

  "jsp.tomcatWorkDirectory": "F:/apache-tomcat-9.0.34/work"%CATALINA_HOME%\bin\catalina.bat jpda start

}```

```

Default JPDA port is `8000`.

**How to find your Tomcat work directory:**

- Default location: `<TOMCAT_HOME>/work`### 4. Create Debug Configuration

- Contains compiled JSP servlets: `work/Catalina/localhost/<your-app>/org/apache/jsp/`

Add a debug configuration to your `.vscode/launch.json`:

### 3. Configure Java Debugging

```json

Create or update `.vscode/launch.json`:{

  "version": "0.2.0",

```json  "configurations": [

{    {

  "version": "0.2.0",      "type": "jsp",

  "configurations": [      "request": "attach",

    {      "name": "Attach to Tomcat (JSP Debug)",

      "type": "java",      "hostName": "localhost",

      "name": "Debug Tomcat JSP",      "port": 8000

      "request": "attach",    }

      "hostName": "localhost",  ]

      "port": 8000,}

      "sourcePaths": [```

        "${workspaceFolder}/src/main/webapp"

      ]### 5. Debug Your JSPs

    }

  ]1. Open a JSP file in VS Code

}2. Set breakpoints by clicking in the gutter

```3. Start debugging with `F5` or the debug panel

4. Access your JSP in a browser to trigger the breakpoint

### 4. Start Tomcat with Debug Mode

## Configuration

**Windows:**

```cmd### config.json Options

catalina.bat jpda start

```| Property | Required | Description |

|----------|----------|-------------|

**Linux/Mac:**| `catalinaHome` | Yes | Path to Tomcat installation directory |

```bash| `catalinaBase` | No | Path to Tomcat base directory (defaults to catalinaHome) |

catalina.sh jpda start| `webappContext` | No | Web application context name (defaults to "ROOT") |

```

### Example Configurations

This starts Tomcat listening on port 8000 for debugger attachment.

#### Standard Tomcat Setup

### 5. Set Breakpoints and Debug```json

{

1. Open your JSP file in VS Code  "catalinaHome": "/opt/tomcat",

2. Set breakpoints by clicking in the left gutter  "webappContext": "myapp"

3. Start debugging (F5) - select "Debug Tomcat JSP" configuration}

4. Access your JSP page in a browser```

5. Debugger will stop at your JSP breakpoints with accurate line mapping! 🎉

#### Development with Custom Base

## 📖 How It Works```json

{

### Architecture Overview  "catalinaHome": "/opt/tomcat",

  "catalinaBase": "/home/user/tomcat-dev",

JSP Glass implements a sophisticated debugging pipeline:  "webappContext": "webapp"

}

``````

JSP Source → Tomcat Compiler → Servlet .class → SMAP Extraction → Line Mapping → VS Code Debugger

```## Supported Project Structures



### Key ComponentsThe extension supports common Java web project structures:



#### 1. **SMAP Extraction** (`jspMapper.ts`)```

project/

Uses `javap -v` to extract Source Map (SMAP) data embedded in compiled servlet class files:├── src/main/webapp/          # Maven standard

│   └── index.jsp

```typescript├── WebContent/               # Eclipse Dynamic Web Project

// Extract SMAP using javap (industry standard method)│   └── pages/page.jsp

javap -v YourPage_jsp.class | grep -A20 "SMAP"├── web/                      # Alternative structure

```│   └── admin/admin.jsp

└── config.json              # Required configuration

**SMAP Format Example:**```

```

SMAP## Commands

index_jsp.java

JSP| Command | Description |

*S JSP|---------|-------------|

*F| `JSP: Show Compiled Servlet Path` | Display the compiled servlet class path for current JSP |

+ 0 index.jsp| `JSP: Validate Setup` | Check JSP debugging configuration and Tomcat setup |

*L

1,5:122        // JSP lines 1-5 map to servlet line 122## How It Works

7,52:128       // JSP lines 7-58 map to servlet line 128

*E1. **JSP Compilation**: Tomcat compiles JSP files into servlet classes with embedded line number mappings

```2. **Breakpoint Mapping**: Extension maps JSP breakpoints to corresponding servlet class locations

3. **JDWP Integration**: Leverages VS Code's Java debugger and JDWP protocol for actual debugging

#### 2. **Forward Mapping** (JSP → Servlet)4. **Source Mapping**: When execution stops, maps servlet stack frames back to original JSP files



When setting breakpoints in JSP:## Troubleshooting



1. Extract SMAP from compiled servlet class using `javap -v`### Common Issues

2. Parse SMAP line mapping entries (format: `jspStart,jspCount:servletLine`)

3. Find exact or interpolated servlet line for JSP breakpoint#### "Servlet class not found"

4. Set actual breakpoint in servlet at calculated line- Ensure JSP has been accessed in browser at least once

- Check that Tomcat work directory exists and has compiled servlets

**Example:**- Verify `catalinaHome` and `catalinaBase` paths in config.json

- JSP line 7 → SMAP entry `7,52:128` → Servlet line 128

#### "Cannot connect to debugger"

#### 3. **Reverse Mapping** (Servlet → JSP)- Verify Tomcat is running with JPDA enabled

- Check that port 8000 (or configured port) is not blocked

When debugger stops in servlet:- Ensure Java Debug extension is installed and enabled



1. Intercept debug stack trace via `DebugAdapterTracker`#### "Breakpoint not hit"

2. Build reverse mapping from SMAP (Servlet line → JSP line)- Confirm JSP compilation by checking servlet class file exists

3. Find corresponding JSP line using exact match or interpolation- Verify breakpoint is set on executable line (not comments/whitespace)

4. Remap stack frame to show JSP file and correct line- Check that the correct webapp context is configured



**Example:**### Debug Commands

- Debugger stops at servlet line 128 → SMAP lookup → Show JSP line 7

Use these commands to diagnose issues:

#### 4. **Debug Adapter Tracking** (`debugTracker.ts`)

```bash

Intercepts debug protocol messages to remap sources:# Check if JPDA is listening

netstat -an | grep 8000

```typescript

onDidSendMessage(message: any) {# Verify servlet compilation

  if (message.type === 'response' && message.command === 'stackTrace') {ls -la $CATALINA_BASE/work/Catalina/localhost/*/org/apache/jsp/

    // Intercept and fix stack frame line numbers```

    for (const frame of message.body.stackFrames) {

      if (frame.source.path.endsWith('.jsp')) {## Development

        const correctJspLine = mapServletLineToJspLine(frame.line);

        frame.line = correctJspLine; // Fix the line number!### Building from Source

      }

    }```bash

  }# Clone repository

}git clone https://github.com/your-repo/vscode-jsp-debug.git

```cd vscode-jsp-debug



### SMAP Parsing Details# Install dependencies

npm install

**Range Format:** `jspStart,jspCount:servletLine`

# Compile TypeScript

- `jspStart`: First JSP line in rangenpm run compile

- `jspCount`: Number of JSP lines in range

- `servletLine`: Starting servlet line for this range# Package extension

npm run package

**Mapping Algorithm:**```

1. **Exact Match**: If JSP line exists in SMAP, use direct mapping

2. **Interpolation**: If between two SMAP entries, calculate proportional position### Project Structure

3. **Offset**: If only one boundary exists, use 1:1 offset from nearest known line

```

### Fallback Mechanismssrc/

├── extension.ts              # Main extension entry point

If SMAP extraction fails, JSP Glass uses fallback methods:├── debugConfigurationProvider.ts  # Debug configuration handling

├── debugAdapter.ts          # Debug adapter wrapper

1. **Direct Class File Parsing**: Read SMAP from `.class` file binary├── jspMapper.ts             # JSP to servlet mapping logic

2. **Java Source Comments**: Parse `//line X "file.jsp"` comments from `.java` files└── configurationManager.ts  # Configuration management

3. **Heuristic Estimation**: Intelligent estimation based on servlet structure```



## ⚙️ Configuration## Contributing



### VS Code Settings1. Fork the repository

2. Create a feature branch

| Setting | Description | Default |3. Make your changes

|---------|-------------|---------|4. Add tests if applicable

| `jsp.tomcatWorkDirectory` | Tomcat work directory path | (required) |5. Submit a pull request

| `jsp.enableDebugLogging` | Enable verbose debug output | `false` |

## License

### Tomcat Configuration

MIT License - see [LICENSE](LICENSE) file for details.

**Enable JSP Source Retention** (optional but recommended):

## Changelog

Edit `<TOMCAT_HOME>/conf/web.xml`:

### 1.0.0

```xml- Initial release

<servlet>- JSP breakpoint support

  <servlet-name>jsp</servlet-name>- Tomcat integration

  <servlet-class>org.apache.jasper.servlet.JspServlet</servlet-class>- Automatic servlet mapping

  <init-param>- Diagnostic commands
    <param-name>keepgenerated</param-name>
    <param-value>true</param-value>
  </init-param>
  <load-on-startup>3</load-on-startup>
</servlet>
```

This keeps generated `.java` files alongside `.class` files for fallback mapping.

## 🐛 Troubleshooting

### Breakpoints Don't Work

**Check:**
1. Tomcat work directory is correctly configured
2. JSP has been compiled by Tomcat (access it in browser first)
3. Java JDK is installed and `javap` is in PATH
4. Debug configuration uses `"type": "java"`

**Test javap:**
```bash
javap -v <TOMCAT_WORK>/org/apache/jsp/YourPage_jsp.class
```

### Wrong Line Numbers

**Common causes:**
- SMAP data missing or corrupt
- JSP file modified after Tomcat compilation
- Tomcat version incompatibility

**Solutions:**
1. Restart Tomcat to recompile JSPs
2. Clear Tomcat work directory
3. Enable `keepgenerated` to allow fallback parsing

### Debug Console Output

Enable debug logging in VS Code Developer Tools (Help → Toggle Developer Tools):

```
JSP Debug: === JAVAP-BASED SMAP EXTRACTION ===
JSP Debug: Running javap -v to extract SMAP from: ...
JSP Debug: Extracted 45 SMAP mappings from javap
JSP Debug: ✅ EXACT SMAP MAPPING - JSP line 7 -> Servlet line 128
```

## 🔧 Technical Details

### Technology Stack

- **TypeScript**: Extension implementation
- **VS Code Extension API**: Debugger integration
- **Debug Adapter Protocol**: Source remapping
- **javap**: SMAP extraction (Java Development Kit tool)
- **Node.js**: Runtime environment

### SMAP Specification

JSP Glass follows the JSR-045 specification for Source Map format:

- **Specification**: [JSR-045 - Debugging Support for Other Languages](https://jcp.org/en/jsr/detail?id=45)
- **Format**: Embedded in `.class` files as `SourceDebugExtension` attribute
- **Standards Compliance**: Same format used by Eclipse, IntelliJ IDEA, and NetBeans

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request with clear description

## 🙏 Acknowledgments

- Apache Tomcat team for JSP/Servlet implementation
- VS Code team for extensibility APIs
- Java community for SMAP specification (JSR-045)

## 📞 Support

- **Issues**: Report bugs on GitHub Issues
- **Documentation**: See this README and inline code comments
---

*Debug JSP with clarity - JSP Glass*
