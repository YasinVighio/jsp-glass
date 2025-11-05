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
          const jspMapping = this.findJspMappingForServlet(sourcePath);
          
          if (jspMapping) {
            // Remap the source to JSP file
            frame.source.name = path.basename(jspMapping.jspPath);
            frame.source.path = jspMapping.jspPath;
            
            // Remap line number from servlet to JSP
            const jspLine = jspMapping.lineMappings.get(frame.line);
            if (jspLine) {
              frame.line = jspLine;
            }
            
            console.log(`Remapped servlet frame: ${sourcePath}:${frame.line} -> ${jspMapping.jspPath}:${jspLine || frame.line}`);
          }
        }
      }
    }

    if (hasServletFrames) {
      // Force VS Code to refresh the debug view
      vscode.commands.executeCommand('workbench.debug.action.focusCallStackView');
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
      const lines = servletContent.split('\n');

      // Parse line number mappings from servlet comments
      lines.forEach((line, servletLineIndex) => {
        // Look for comments like: // Line 15, JSP file: /index.jsp
        const match = line.match(/\/\/\s*Line\s+(\d+),\s*JSP\s*file:/i);
        if (match) {
          const jspLineNumber = parseInt(match[1]);
          const servletLineNumber = servletLineIndex + 1;
          lineMappings.set(servletLineNumber, jspLineNumber);
        }
      });

      console.log(`Created ${lineMappings.size} line mappings for ${path.basename(jspPath)}`);

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