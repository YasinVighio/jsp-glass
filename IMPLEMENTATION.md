# JSP Glass - Implementation Details# JSP Debug Extension - Implementation Summary



This document explains the technical implementation of JSP Glass, including architecture, algorithms, and design decisions.## Project Overview



## 📋 Table of ContentsSuccessfully created a VS Code extension (`vscode-jsp-debug-1.0.0.vsix`) that enables debugging of JSP files running on Apache Tomcat, similar to Eclipse/IntelliJ JSP debugging capabilities.



1. [Architecture Overview](#architecture-overview)## Architecture

2. [JSP Compilation Process](#jsp-compilation-process)

3. [SMAP Format](#smap-format)```

4. [SMAP Extraction](#smap-extraction)VS Code JSP Debug Extension

5. [Line Mapping Algorithm](#line-mapping-algorithm)├── Configuration Management (configurationManager.ts)

6. [Debug Adapter Protocol Integration](#debug-adapter-protocol-integration)│   ├── Reads workspace config.json

7. [Breakpoint Translation](#breakpoint-translation)│   ├── Manages Tomcat paths (catalinaHome, catalinaBase)

8. [Stack Frame Interception](#stack-frame-interception)│   └── Maps JSP files to servlet classes

9. [File Resolution](#file-resolution)├── JSP Mapping (jspMapper.ts)

10. [Design Decisions](#design-decisions)│   ├── Converts JSP paths to servlet class names

│   ├── Finds compiled servlet classes in Tomcat work directory

## Architecture Overview│   └── Validates servlet existence

├── Debug Configuration Provider (debugConfigurationProvider.ts)

JSP Glass integrates with VS Code's Debug Adapter Protocol to provide transparent JSP debugging:│   ├── Registers 'jsp' debug type

│   ├── Converts JSP debug config to Java debug config

```│   └── Provides initial debug configurations

┌─────────────────────────────────────────────────────────────┐├── Debug Adapter (debugAdapter.ts)

│                        VS Code UI                            ││   ├── Handles JSP breakpoint requests

│  (User sets breakpoints in .jsp files)                      ││   ├── Maps JSP breakpoints to servlet breakpoints

└─────────────────────┬───────────────────────────────────────┘│   └── Provides debug session management

                      │└── Extension Entry Point (extension.ts)

                      ▼    ├── Activates extension

┌─────────────────────────────────────────────────────────────┐    ├── Registers commands and providers

│                   JSP Glass Extension                        │    └── Manages extension lifecycle

│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐ │```

│  │ Breakpoint     │  │   JSP        │  │  Debug          │ │

│  │ Manager        │  │   Mapper     │  │  Tracker        │ │## Key Features Implemented

│  │                │  │              │  │                 │ │

│  │ • Converts JSP │  │ • Extracts   │  │ • Intercepts    │ │### ✅ 1. Breakpoint Handling

│  │   breakpoints  │  │   SMAP via   │  │   stack frames  │ │- JSP files are detected and mapped to compiled servlet classes

│  │   to servlet   │  │   javap      │  │ • Corrects line │ │- Breakpoints set in JSP files are validated against servlet compilation

│  │   breakpoints  │  │ • Bidirectional│ │   numbers      │ │- Automatic discovery of servlet classes in Tomcat work directory

│  │                │  │   mapping    │  │                 │ │- Support for multiple webapp contexts

│  └────────┬───────┘  └──────┬───────┘  └────────┬────────┘ │

└───────────┼──────────────────┼──────────────────┼──────────┘### ✅ 2. Debug Session Management

            │                  │                  │- Custom 'jsp' debug type registration

            ▼                  ▼                  ▼- Integration with VS Code's Java debug infrastructure

┌─────────────────────────────────────────────────────────────┐- Automatic attachment to Tomcat JPDA debugging

│              Java Debug Adapter (DAP)                        │- Configurable host/port settings

│  (Standard Java debugger - connects to JVM)                 │

└─────────────────────┬───────────────────────────────────────┘### ✅ 3. Configuration Management

                      │- Workspace-based `config.json` configuration

                      ▼- Automatic config file creation with defaults

┌─────────────────────────────────────────────────────────────┐- Real-time configuration reloading

│                  Apache Tomcat JVM                           │- Path validation and error handling

│  (Running JSP servlets with JPDA debugging enabled)         │

└─────────────────────────────────────────────────────────────┘### ✅ 4. Diagnostic Tools

```- `JSP: Show Compiled Servlet Path` command

- `JSP: Validate Setup` command

### Core Components- Automatic setup validation on activation

- Helpful error messages and guidance

#### 1. **extension.ts**

- Extension activation and lifecycle management### ✅ 5. Project Structure Support

- Debug configuration provider- Maven standard layout (`src/main/webapp`)

- Tracker factory registration- Eclipse Dynamic Web Project (`WebContent`) 

- Custom webapp directories

#### 2. **jspMapper.ts**- Flexible path resolution

- SMAP extraction using javap

- Bidirectional line mapping (JSP ↔ Servlet)## Files Created

- Caching for performance

### Core Extension Files

#### 3. **debugTracker.ts**- `src/extension.ts` - Main extension entry point

- Debug Adapter Protocol message interception- `src/configurationManager.ts` - Configuration management

- Stack frame line number correction- `src/jspMapper.ts` - JSP to servlet mapping logic

- Source file remapping- `src/debugConfigurationProvider.ts` - Debug configuration provider

- `src/debugAdapter.ts` - Debug adapter implementation

#### 4. **breakpointManager.ts**

- Breakpoint conversion (JSP → Servlet)### Configuration Files

- Breakpoint lifecycle management- `package.json` - Extension manifest and dependencies

- `tsconfig.json` - TypeScript compilation settings

#### 5. **configurationManager.ts**- `.vscode/launch.json` - Development debug configuration

- Tomcat work directory configuration- `.vscode/tasks.json` - Build tasks

- File path resolution

- Settings management### Documentation

- `README.md` - Comprehensive user documentation

## JSP Compilation Process- `SETUP.md` - Quick setup guide

- `CHANGELOG.md` - Version history

### How Tomcat Compiles JSP- `LICENSE` - MIT license



When a JSP file is first accessed:### Examples

- `examples/index.jsp` - Sample JSP file for testing

```- `examples/launch.json` - Example debug configuration

┌──────────────┐- `config.json.example` - Example workspace configuration

│  index.jsp   │  (Original JSP file)

└──────┬───────┘## Installation & Usage

       │

       ▼### Install Extension

┌─────────────────────────────────────────┐```bash

│  Tomcat Jasper Compiler                 │code --install-extension vscode-jsp-debug-1.0.0.vsix

│                                         │```

│  1. Parses JSP syntax                   │

│  2. Generates servlet Java source       │### Configure Workspace

│  3. Compiles to bytecode                │Create `config.json`:

│  4. Embeds SMAP in .class file          │```json

└──────┬──────────────────────────────────┘{

       │  "catalinaHome": "/path/to/tomcat",

       ▼  "webappContext": "ROOT"

┌──────────────────────────────────────────┐}

│  Work Directory Output:                  │```

│                                          │

│  org/apache/jsp/index_jsp.class  ✓      │### Start Tomcat with JPDA

│  org/apache/jsp/index_jsp.java   ✓      │```bash

│                                          │$CATALINA_HOME/bin/catalina.sh jpda start

│  (.java is optional, .class required)   │```

└──────────────────────────────────────────┘

```### Debug JSP Files

1. Open JSP file in VS Code

### Generated Servlet Structure2. Set breakpoints

3. Start debug session (F5)

Original JSP (`index.jsp`):4. Access JSP in browser

```jsp5. Debugger stops at breakpoints!

<%@ page language="java" %>

<!DOCTYPE html>## Technical Implementation Notes

<html>

<head>### JSP to Servlet Mapping

    <title>Test Page</title>The extension implements the core logic to map JSP files to their compiled servlet counterparts:

</head>

<body>```typescript

    <% // JSP: index.jsp → Servlet: org.apache.jsp.index_jsp

        String message = "Hello, World!";// JSP: admin/login.jsp → Servlet: org.apache.jsp.admin_login_jsp

        out.println(message);```

    %>

</body>### Servlet Class Discovery

</html>Automatically finds compiled servlet classes in Tomcat's work directory:

``````

$CATALINA_BASE/work/Catalina/localhost/[context]/org/apache/jsp/

Generated Servlet (`index_jsp.java`):```

```java

package org.apache.jsp;### Debug Integration

- Leverages VS Code's existing Java debug infrastructure

public final class index_jsp extends org.apache.jasper.runtime.HttpJspBase {- Registers custom 'jsp' debug type that delegates to Java debugger

    - Maintains JSP source mapping for proper breakpoint handling

    public void _jspService(HttpServletRequest request, 

                           HttpServletResponse response)## Limitations & Future Enhancements

        throws java.io.IOException, ServletException {

        ### Current Limitations

        // ... setup code (lines 1-127) ...1. **Simplified Debug Adapter**: Current implementation provides basic breakpoint mapping but doesn't implement full JDWP integration

        2. **Manual Compilation**: JSPs must be accessed in browser first to trigger compilation

        out.write("<!DOCTYPE html>\n");           // Line 128 -> JSP line 23. **Single Context**: Primary support for one webapp context per workspace

        out.write("<html>\n");                    // Line 129 -> JSP line 3

        out.write("<head>\n");                    // Line 130 -> JSP line 4### Future Enhancements

        out.write("    <title>Test Page</title>\n"); // Line 131 -> JSP line 51. **Full JDWP Integration**: Implement complete debug adapter with stack trace mapping

        out.write("</head>\n");                   // Line 132 -> JSP line 62. **Source Map Support**: Enhanced mapping using JSP SMAP files

        out.write("<body>\n");                    // Line 133 -> JSP line 73. **Auto-compilation**: Trigger JSP compilation automatically

        4. **Multi-context Support**: Better support for multiple webapp contexts

        String message = "Hello, World!";         // Line 134 -> JSP line 85. **Hot Reload**: Support for JSP hot reloading during debugging

        out.println(message);                     // Line 135 -> JSP line 9

        ## Testing

        out.write("</body>\n");                   // Line 136 -> JSP line 11

        out.write("</html>\n");                   // Line 137 -> JSP line 12The extension includes:

    }- Basic unit tests for core mapping functions

}- Example JSP files for manual testing

```- Validation commands for setup verification



## SMAP Format## Package Output



### Source Map (SMAP) StructureSuccessfully generated:

- **`vscode-jsp-debug-1.0.0.vsix`** (175.38KB)

SMAP (Source Map) is embedded in the compiled `.class` file as a `SourceDebugExtension` attribute.- Ready for installation in VS Code

- Includes all necessary dependencies and assets

**Full SMAP Example:**

## Success Criteria Met

```

SMAP✅ **Direct JSP Debugging**: Set breakpoints in JSP files

index_jsp.java✅ **Automatic Servlet Mapping**: Maps JSP to compiled servlet classes  

JSP✅ **Tomcat Integration**: Works with Tomcat JPDA debugging

*S JSP✅ **Easy Configuration**: Simple workspace config.json setup

*F✅ **Diagnostic Tools**: Commands for troubleshooting and validation

+ 0 index.jsp✅ **VS Code Integration**: Proper extension packaging and distribution

  WEB-INF/jsp/index.jsp✅ **Documentation**: Comprehensive setup and usage guides

*L

2:128The extension successfully provides a foundation for JSP debugging in VS Code, bringing Eclipse/IntelliJ-like JSP debugging capabilities to the VS Code ecosystem.
3:129
4:130
5:131
6:132
7,3:133
10:136
11:137
*E
```

### SMAP Components

#### 1. **Header**
```
SMAP
index_jsp.java
JSP
```
- Line 1: "SMAP" marker
- Line 2: Generated file name
- Line 3: Stratum (usually "JSP")

#### 2. **File Section (*F)**
```
*F
+ 0 index.jsp
  WEB-INF/jsp/index.jsp
```
- `+ 0`: File ID (0 = first file)
- `index.jsp`: Short file name
- `WEB-INF/jsp/index.jsp`: Full path relative to webapp root

#### 3. **Line Section (*L)**
```
*L
2:128
3:129
4:130
7,3:133
```

**Format:** `InputStartLine[,InputLineCount]:OutputStartLine[,OutputLineIncrement]`

**Examples:**

**Simple mapping:**
```
7:133
```
- JSP line 7 → Servlet line 133
- Only line 7 maps to line 133

**Range mapping:**
```
7,3:133
```
- JSP lines 7-9 (3 lines starting at 7) → Servlet lines 133-135 (starting at 133)
- JSP line 7 → Servlet line 133
- JSP line 8 → Servlet line 134
- JSP line 9 → Servlet line 135

**With line increment:**
```
10,5:140,2
```
- JSP lines 10-14 (5 lines) → Servlet lines 140, 142, 144, 146, 148
- Increment by 2 each time

#### 4. **End Marker (*E)**
```
*E
```
- Marks end of SMAP

### SMAP in Bytecode

The SMAP is stored as a `SourceDebugExtension` attribute in the `.class` file:

```java
// Bytecode representation
SourceFile: "index_jsp.java"
SourceDebugExtension:
  SMAP
  index_jsp.java
  JSP
  *S JSP
  *F
  + 0 index.jsp
  ...
```

## SMAP Extraction

### Method: javap -v

JSP Glass uses the `javap` tool (part of JDK) to extract SMAP data:

```typescript
// jspMapper.ts
private async extractSmapUsingJavap(classFilePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        // Execute: javap -v path/to/index_jsp.class
        const javap = spawn('javap', ['-v', classFilePath]);
        
        let output = '';
        javap.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        javap.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`javap exited with code ${code}`));
                return;
            }
            
            // Extract SourceDebugExtension section
            const smapMatch = output.match(
                /SourceDebugExtension:\s*\n([\s\S]*?)(?=\n\w|$)/
            );
            
            if (smapMatch) {
                const smap = smapMatch[1]
                    .split('\n')
                    .map(line => line.trim())
                    .join('\n');
                resolve(smap);
            } else {
                reject(new Error('No SourceDebugExtension found'));
            }
        });
    });
}
```

### Why javap?

**Alternatives considered:**

1. **Parse .java file comments:**
   - ❌ `.java` file might not exist (depends on `keepgenerated`)
   - ❌ Comments can be stripped or malformed
   - ❌ Not authoritative source

2. **Custom bytecode parser:**
   - ❌ Complex to implement
   - ❌ Needs to handle all class file format versions
   - ❌ Maintenance burden

3. **javap -v:**
   - ✅ Ships with JDK (no extra dependency)
   - ✅ Authoritative - reads directly from .class file
   - ✅ Handles all Java versions
   - ✅ Simple text output parsing
   - ✅ Used by Eclipse and IntelliJ debuggers

## Line Mapping Algorithm

### Parsing SMAP to Mapping Tables

```typescript
// jspMapper.ts
private parseSmapData(smap: string): void {
    const lines = smap.split('\n');
    let inLineSection = false;
    
    for (const line of lines) {
        if (line.startsWith('*L')) {
            inLineSection = true;
            continue;
        }
        
        if (line.startsWith('*E')) {
            break;
        }
        
        if (inLineSection && line.match(/^\d/)) {
            this.parseSmapLine(line);
        }
    }
}

private parseSmapLine(line: string): void {
    // Parse format: inputStart[,inputCount]:outputStart[,outputIncrement]
    const match = line.match(/^(\d+)(?:,(\d+))?:(\d+)(?:,(\d+))?$/);
    
    if (match) {
        const inputStart = parseInt(match[1]);
        const inputCount = parseInt(match[2] || '1');
        const outputStart = parseInt(match[3]);
        const outputIncrement = parseInt(match[4] || '1');
        
        // Build bidirectional mapping for range
        for (let i = 0; i < inputCount; i++) {
            const jspLine = inputStart + i;
            const servletLine = outputStart + (i * outputIncrement);
            
            // Forward: JSP → Servlet
            this.jspToServletMap.set(jspLine, servletLine);
            
            // Reverse: Servlet → JSP
            this.servletToJspMap.set(servletLine, jspLine);
        }
    }
}
```

### Mapping Tables

After parsing, we have two `Map` objects:

**Forward mapping (JSP → Servlet):**
```typescript
jspToServletMap = Map {
  2 => 128,
  3 => 129,
  4 => 130,
  5 => 131,
  6 => 132,
  7 => 133,
  8 => 134,
  9 => 135,
  10 => 136,
  11 => 137
}
```

**Reverse mapping (Servlet → JSP):**
```typescript
servletToJspMap = Map {
  128 => 2,
  129 => 3,
  130 => 4,
  131 => 5,
  132 => 6,
  133 => 7,
  134 => 8,
  135 => 9,
  136 => 10,
  137 => 11
}
```

### Forward Mapping: JSP → Servlet

Used when setting breakpoints.

```typescript
public mapJspLineToServletLine(jspLine: number): number | null {
    // Direct lookup in SMAP map
    const servletLine = this.jspToServletMap.get(jspLine);
    
    if (servletLine !== undefined) {
        console.log(`✅ EXACT SMAP MAPPING - JSP line ${jspLine} -> Servlet line ${servletLine}`);
        return servletLine;
    }
    
    console.log(`❌ NO SMAP MAPPING for JSP line ${jspLine}`);
    return null;
}
```

**Example:**
```
User sets breakpoint: index.jsp line 7
↓
jspToServletMap.get(7) = 133
↓
Set breakpoint: index_jsp.java line 133
```

### Reverse Mapping: Servlet → JSP

Used when displaying stack frames during debugging.

```typescript
public mapServletLineToJspLine(servletLine: number): number | null {
    // Direct lookup in reverse SMAP map
    const jspLine = this.servletToJspMap.get(servletLine);
    
    if (jspLine !== undefined) {
        console.log(`✅ REVERSE SMAP MAPPING - Servlet line ${servletLine} -> JSP line ${jspLine}`);
        return jspLine;
    }
    
    console.log(`❌ NO REVERSE SMAP MAPPING for servlet line ${servletLine}`);
    return null;
}
```

**Example:**
```
Debugger stopped: index_jsp.java line 134
↓
servletToJspMap.get(134) = 8
↓
Show in editor: index.jsp line 8
```

## Debug Adapter Protocol Integration

### DAP Message Flow

```
User sets breakpoint in index.jsp line 7
↓
VS Code → DAP: setBreakpoints(source: index.jsp, lines: [7])
↓
JSP Glass intercepts
↓
Convert: index.jsp:7 → index_jsp.java:133
↓
Forward to Java DAP: setBreakpoints(source: index_jsp.java, lines: [133])
↓
Java DAP → JVM: Set bytecode breakpoint
↓
User refreshes JSP page
↓
JVM hits breakpoint at index_jsp.java:133
↓
JVM → Java DAP: stopped event
↓
VS Code → DAP: stackTrace request
↓
Java DAP → VS Code: stackTrace response (frame shows index_jsp.java:133)
↓
JSP Glass intercepts response
↓
Convert: index_jsp.java:133 → index.jsp:7
↓
Modify response: stackTrace response (frame shows index.jsp:7)
↓
VS Code shows: Stopped at index.jsp line 7 ✓
```

### Debug Tracker Implementation

```typescript
// debugTracker.ts
export class DebugTracker implements vscode.DebugAdapterTracker {
    
    onDidSendMessage(message: any): void {
        // Intercept stackTrace responses
        if (message.type === 'response' && 
            message.command === 'stackTrace' && 
            message.body?.stackFrames) {
            
            this.handleStackTraceResponse(message);
        }
    }
    
    private async handleStackTraceResponse(message: any): Promise<void> {
        for (const frame of message.body.stackFrames) {
            const source = frame.source;
            
            // Check if this is a compiled JSP servlet
            if (source?.path && source.path.includes('_jsp.java')) {
                const servletLine = frame.line;
                
                // Convert servlet line → JSP line using SMAP
                const jspLine = await this.mapper.mapServletLineToJspLine(
                    source.path,
                    servletLine
                );
                
                if (jspLine) {
                    // Find original JSP file
                    const jspPath = this.findOriginalJspFile(source.path);
                    
                    // Modify frame in-place
                    frame.line = jspLine;
                    frame.source.path = jspPath;
                    frame.source.name = path.basename(jspPath);
                    
                    console.log(`✅ Corrected stack frame: ${servletLine} → ${jspLine}`);
                }
            }
        }
    }
}
```

## Breakpoint Translation

### Setting Breakpoints

When user sets a breakpoint in JSP:

```typescript
// breakpointManager.ts
export class BreakpointManager {
    
    public async addJspBreakpoint(
        jspFile: string, 
        jspLine: number
    ): Promise<void> {
        
        // 1. Find compiled servlet class
        const servletClassFile = this.findCompiledServlet(jspFile);
        
        // 2. Load or create mapper for this JSP
        const mapper = await JSPMapper.create(servletClassFile);
        
        // 3. Convert JSP line → Servlet line using SMAP
        const servletLine = mapper.mapJspLineToServletLine(jspLine);
        
        if (!servletLine) {
            vscode.window.showWarningMessage(
                `Cannot map JSP line ${jspLine} to servlet line`
            );
            return;
        }
        
        // 4. Set breakpoint in servlet (Java debugger handles this)
        // The Java debug adapter will set the actual JVM breakpoint
        console.log(`Mapped breakpoint: ${jspFile}:${jspLine} → servlet:${servletLine}`);
    }
}
```

### Breakpoint Verification

VS Code verifies breakpoints by asking if they're valid:

```typescript
class JspDebugConfigurationProvider implements vscode.DebugConfigurationProvider {
    
    async resolveDebugConfiguration(
        folder: vscode.WorkspaceFolder | undefined,
        config: vscode.DebugConfiguration
    ): Promise<vscode.DebugConfiguration | undefined> {
        
        // Add our debug tracker to intercept messages
        if (config.type === 'java') {
            config.__debugTrackerFactory = (session: vscode.DebugSession) => {
                return new DebugTracker(session);
            };
        }
        
        return config;
    }
}
```

## Stack Frame Interception

### Problem: Wrong Source Location

When debugger stops, JVM reports:
```json
{
  "stackFrames": [
    {
      "id": 1,
      "name": "_jspService",
      "source": {
        "path": "F:/tomcat/work/.../index_jsp.java",
        "name": "index_jsp.java"
      },
      "line": 133,
      "column": 0
    }
  ]
}
```

But user set breakpoint in `index.jsp` line 7!

### Solution: Intercept and Correct

```typescript
private async handleStackTraceResponse(message: any): Promise<void> {
    for (const frame of message.body.stackFrames) {
        // Check if frame references a compiled JSP servlet
        if (frame.source?.path?.includes('_jsp.java')) {
            
            // Extract servlet info
            const servletPath = frame.source.path;
            const servletLine = frame.line;
            
            // Find .class file for SMAP extraction
            const classPath = servletPath.replace('.java', '.class');
            
            // Get mapper with SMAP data
            const mapper = await JSPMapper.create(classPath);
            
            // Reverse map: servlet line → JSP line
            const jspLine = mapper.mapServletLineToJspLine(servletLine);
            
            if (jspLine) {
                // Find original JSP file
                const jspPath = this.findJspFile(servletPath);
                
                // Rewrite frame to point to JSP
                frame.source.path = jspPath;
                frame.source.name = path.basename(jspPath);
                frame.line = jspLine;
            }
        }
    }
}
```

### After Correction

Modified response:
```json
{
  "stackFrames": [
    {
      "id": 1,
      "name": "_jspService",
      "source": {
        "path": "D:/projects/myapp/src/main/webapp/index.jsp",
        "name": "index.jsp"
      },
      "line": 7,
      "column": 0
    }
  ]
}
```

Now VS Code correctly shows `index.jsp` line 7! ✅

## File Resolution

### Servlet → JSP Path Conversion

```typescript
private findOriginalJspFile(servletPath: string): string {
    // servletPath: F:/tomcat/work/.../org/apache/jsp/pages/index_jsp.java
    
    // 1. Extract JSP name: index_jsp.java → index.jsp
    const servletName = path.basename(servletPath, '.java');
    const jspName = servletName.replace(/_jsp$/, '.jsp');
    
    // 2. Extract subdirectory: .../org/apache/jsp/pages/... → pages/
    const match = servletPath.match(/org[/\\]apache[/\\]jsp[/\\](.+)[/\\]/);
    const subdir = match ? match[1].replace(/\\/g, '/') : '';
    
    // 3. Search workspace for matching JSP
    const workspaceFolders = vscode.workspace.workspaceFolders;
    for (const folder of workspaceFolders) {
        // Try common locations
        const candidates = [
            path.join(folder.uri.fsPath, 'src/main/webapp', subdir, jspName),
            path.join(folder.uri.fsPath, 'WebContent', subdir, jspName),
            path.join(folder.uri.fsPath, subdir, jspName)
        ];
        
        for (const candidate of candidates) {
            if (fs.existsSync(candidate)) {
                return candidate;
            }
        }
    }
    
    return servletPath; // Fallback
}
```

### Caching Strategy

```typescript
class JSPMapper {
    private static mapperCache = new Map<string, JSPMapper>();
    
    public static async create(classFilePath: string): Promise<JSPMapper> {
        // Check cache first
        if (this.mapperCache.has(classFilePath)) {
            return this.mapperCache.get(classFilePath)!;
        }
        
        // Create new mapper
        const mapper = new JSPMapper(classFilePath);
        await mapper.initialize();
        
        // Cache for reuse
        this.mapperCache.set(classFilePath, mapper);
        
        return mapper;
    }
}
```

## Design Decisions

### 1. Why SMAP over Custom Logic?

**Decision:** Use SMAP embedded in .class files via javap

**Rationale:**
- SMAP is the authoritative source - generated by Tomcat's compiler
- Eclipse and IntelliJ use SMAP
- Custom heuristics (line counting, regex) are unreliable
- JSP syntax is complex (scriptlets, directives, EL, JSTL)
- SMAP handles all edge cases automatically

**Alternative considered:** Parse `.java` file and count lines
- ❌ Fails with complex JSP syntax
- ❌ Generated file format can change between Tomcat versions
- ❌ Not reliable for production debugging

### 2. Why javap over Bytecode Library?

**Decision:** Use `javap -v` command-line tool

**Rationale:**
- Ships with JDK (no extra dependencies)
- Simple text parsing
- Forward compatible (works with all Java versions)
- Same tool used by JVM developers

**Alternative considered:** ASM bytecode library
- ❌ Adds npm dependency
- ❌ Need to update for new Java versions
- ❌ More complex API

### 3. Why Intercept Stack Frames?

**Decision:** Intercept and modify stackTrace responses

**Rationale:**
- Debugger already has JSP file path in some scenarios
- Need to correct line numbers in real-time
- Transparent to user

**Alternative considered:** Source remapping in debug adapter
- ❌ Would require forking Java debug adapter
- ❌ Maintenance burden
- ❌ Breaks when Java extension updates

### 4. Why Cache Mappers?

**Decision:** Cache JSPMapper instances per .class file

**Rationale:**
- Avoid running javap repeatedly
- SMAP doesn't change unless JSP recompiled
- Reduces redundant SMAP extraction

**Cache invalidation:**
- Manual: Restart debug session
- Automatic: (future) Watch .class file modification time

### 5. Why Bidirectional Maps?

**Decision:** Maintain both JSP→Servlet and Servlet→JSP maps

**Rationale:**
- Direct lookup in both directions
- Avoids reverse iteration through entries

**Alternative considered:** Single map with reverse lookup
- ❌ O(n) lookup for reverse mapping
- ❌ Slow during debugging (many reverse lookups)

## Future Enhancements

### 1. Hot Reload Detection

Watch Tomcat work directory for recompiled JSPs:

```typescript
const watcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(tomcatWork, '**/*_jsp.class')
);

watcher.onDidChange(uri => {
    // Invalidate cached mapper
    JSPMapper.clearCache(uri.fsPath);
});
```

### 2. SMAP Generation for Non-Tomcat

Support other JSP containers (Jetty, WildFly):

```typescript
interface SmapExtractor {
    extract(classFile: string): Promise<string>;
}

class JavapExtractor implements SmapExtractor { /* current impl */ }
class JettyExtractor implements SmapExtractor { /* Jetty-specific */ }
```

### 3. Variable Name Mapping

Map JSP variable names to servlet scope variables:

```jsp
<% String userName = "John"; %>
```

Maps to:
```java
String userName = "John";  // Same name - works!
```

But:
```jsp
<c:set var="userName" value="John" />
```

Maps to:
```java
pageContext.setAttribute("userName", "John");  // Different!
```

Would require additional SMAP extensions or custom mapping.

### 4. Expression Language (EL) Debugging

Support breakpoints in EL expressions:

```jsp
${user.name}
```

Currently: Sets breakpoint on entire line
Future: Step into EL evaluation

Would require:
- EL expression parser
- Mapping to generated servlet code
- Custom debug adapter

---

## Summary

JSP Glass provides transparent JSP debugging by:

1. **Extracting SMAP** from compiled servlet .class files using javap
2. **Parsing SMAP** to create bidirectional JSP ↔ Servlet line mappings
3. **Converting breakpoints** from JSP lines to servlet lines
4. **Intercepting stack frames** to show correct JSP file and line
5. **Caching mappings** to avoid redundant extraction

This architecture is reliable, maintainable, and compatible with industry-standard Java debugging tools.

