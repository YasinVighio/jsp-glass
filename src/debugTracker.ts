import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { JspMapper } from './jspMapper';
import { ConfigurationManager } from './configurationManager';

interface JspSourceMapping {
  servletPath: string;
  jspPath: string;
  lineMappings: Map<number, number>; // servlet line -> jsp line
}

export class JspDebugTracker implements vscode.DebugAdapterTracker {
  private jspMapper: JspMapper;
  private configManager: ConfigurationManager;
  private sourceMappings = new Map<string, JspSourceMapping>();
  private session: vscode.DebugSession;

  constructor(session: vscode.DebugSession) {
    this.session = session;
    this.jspMapper = new JspMapper();
    this.configManager = ConfigurationManager.getInstance();
  }

  /**
   * Called when debug adapter sends a message to VS Code
   */
  onDidSendMessage(message: any): void {
    // Intercept stopped events and remap source locations
    if (message.type === 'event' && message.event === 'stopped') {
      this.handleStoppedEvent(message);
    }
    
    // Intercept stack trace responses and remap sources
    if (message.type === 'response' && message.command === 'stackTrace') {
      this.handleStackTraceResponse(message);
    }
  }

  /**
   * Handle stopped event - check if we stopped in a servlet
   */
  private handleStoppedEvent(message: any): void {
    // Request stack trace to see where we stopped
    setTimeout(() => {
      vscode.debug.activeDebugSession?.customRequest('stackTrace', {
        threadId: message.body.threadId,
        startFrame: 0,
        levels: 1
      });
    }, 100);
  }

  /**
   * Handle stack trace response - remap servlet sources to JSP
   */
  private handleStackTraceResponse(message: any): void {
    if (!message.body || !message.body.stackFrames) {
      return;
    }

    let hasServletFrames = false;
    
    for (const frame of message.body.stackFrames) {
      if (frame.source && frame.source.path) {
        const sourcePath = frame.source.path;
        
        // Check if this is a servlet file
        if (sourcePath.includes('_jsp.java')) {
          hasServletFrames = true;
          
          console.log(`JSP Debug: ========== DEBUGGER STOPPED IN SERVLET ==========`);
          console.log(`JSP Debug: Servlet file: ${sourcePath}`);
          console.log(`JSP Debug: Servlet line: ${frame.line}`);
          
          // Find corresponding JSP file
          const jspFilePath = this.findJspFileForServlet(sourcePath);
          if (jspFilePath) {
            console.log(`JSP Debug: Found JSP file: ${jspFilePath}`);
            
            // Use improved reverse mapping
            const jspLine = this.jspMapper.mapServletLineToJspLine(jspFilePath, frame.line);
            if (jspLine) {
              console.log(`JSP Debug: ✅ REMAPPING - Servlet ${sourcePath}:${frame.line} -> JSP ${jspFilePath}:${jspLine}`);
              
              // Remap the source to JSP file
              frame.source.name = path.basename(jspFilePath);
              frame.source.path = jspFilePath;
              frame.line = jspLine;
              
              console.log(`JSP Debug: Updated frame to show JSP file at line ${jspLine}`);
            } else {
              console.error(`JSP Debug: ❌ Could not map servlet line ${frame.line} to JSP line`);
            }
          } else {
            console.error(`JSP Debug: ❌ Could not find JSP file for servlet ${sourcePath}`);
          }
        }
      }
    }

    if (hasServletFrames) {
      console.log(`JSP Debug: Servlet frames detected and processed`);
      // Force VS Code to refresh the debug view
      vscode.commands.executeCommand('workbench.debug.action.focusCallStackView');
    }
  }

  /**
   * Find JSP file for a servlet file (improved method)
   */
  private findJspFileForServlet(servletPath: string): string | null {
    try {
      // Extract servlet name from path like: .../work/Catalina/localhost/myapp/org/apache/jsp/index_jsp.java
      const servletFileName = path.basename(servletPath, '.java');
      
      // Convert servlet name back to JSP name: index_jsp -> index.jsp
      const jspFileName = servletFileName.replace(/_jsp$/, '.jsp');
      
      console.log(`JSP Debug: Converting servlet ${servletFileName} to JSP ${jspFileName}`);
      
      // Find the JSP file in workspace
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        console.error(`JSP Debug: No workspace folder found`);
        return null;
      }
      
      // Search common JSP locations
      const possiblePaths = [
        path.join(workspaceFolder.uri.fsPath, jspFileName),
        path.join(workspaceFolder.uri.fsPath, 'src', 'main', 'webapp', jspFileName),
        path.join(workspaceFolder.uri.fsPath, 'WebContent', jspFileName),
        path.join(workspaceFolder.uri.fsPath, 'web', jspFileName),
        path.join(workspaceFolder.uri.fsPath, 'webapp', jspFileName),
        path.join(workspaceFolder.uri.fsPath, 'src', 'main', 'webapp', 'pages', jspFileName),
        path.join(workspaceFolder.uri.fsPath, 'src', 'main', 'webapp', 'WEB-INF', 'jsp', jspFileName)
      ];
      
      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
          console.log(`JSP Debug: Found JSP file: ${possiblePath}`);
          return possiblePath;
        }
      }
      
      console.error(`JSP Debug: Could not find JSP file ${jspFileName} in workspace`);
      return null;
      
    } catch (error) {
      console.error(`JSP Debug: Error finding JSP file for servlet:`, error);
      return null;
    }
  }

  /**
   * Find JSP mapping for a servlet file
   */
  private findJspMappingForServlet(servletPath: string): JspSourceMapping | null {
    // Check if we already have a mapping for this servlet
    const existing = this.sourceMappings.get(servletPath);
    if (existing) {
      return existing;
    }

    // Extract servlet class name from path
    const servletFileName = path.basename(servletPath, '.java');
    
    // Find corresponding JSP file
    const jspFile = this.jspMapper.getJspFileFromServletClass(`org.apache.jsp.${servletFileName}`);
    if (!jspFile) {
      return null;
    }

    // Create line mappings by reading servlet source
    const lineMappings = this.createLineMappings(servletPath, jspFile);
    
    const mapping: JspSourceMapping = {
      servletPath,
      jspPath: jspFile,
      lineMappings
    };

    // Cache the mapping
    this.sourceMappings.set(servletPath, mapping);
    
    return mapping;
  }

  /**
   * Create line mappings between servlet and JSP
   */
  private createLineMappings(servletPath: string, jspPath: string): Map<number, number> {
    const lineMappings = new Map<number, number>();

    try {
      if (!fs.existsSync(servletPath)) {
        return lineMappings;
      }

      const servletContent = fs.readFileSync(servletPath, 'utf8');
      
      // Use the improved parsing from jspMapper
      const jspToServletMappings = this.jspMapper['parseLineMapping'](servletContent, jspPath);
      
      // Reverse the mapping - we need servlet line -> JSP line for stack trace remapping
      for (const [jspLine, servletLine] of jspToServletMappings.entries()) {
        lineMappings.set(servletLine, jspLine);
      }

      console.log(`Created ${lineMappings.size} line mappings for ${path.basename(jspPath)}`);
      console.log(`Sample mappings:`, Array.from(lineMappings.entries()).slice(0, 5));

    } catch (error) {
      console.error('Error creating line mappings:', error);
    }

    return lineMappings;
  }
}

export class JspDebugAdapterTrackerFactory implements vscode.DebugAdapterTrackerFactory {
  
  createDebugAdapterTracker(session: vscode.DebugSession): vscode.ProviderResult<vscode.DebugAdapterTracker> {
    // Only track Java debug sessions that might involve JSP
    if (session.type === 'java' || session.type === 'jsp') {
      return new JspDebugTracker(session);
    }
    
    return null;
  }
}