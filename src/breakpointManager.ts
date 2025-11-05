import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { JspMapper } from './jspMapper';
import { ConfigurationManager } from './configurationManager';

export class JspBreakpointManager {
  private static instance: JspBreakpointManager;
  private jspMapper: JspMapper;
  private configManager: ConfigurationManager;
  private jspBreakpoints = new Map<string, vscode.SourceBreakpoint[]>();
  private servletBreakpoints = new Map<string, vscode.SourceBreakpoint[]>();

  public static getInstance(): JspBreakpointManager {
    if (!JspBreakpointManager.instance) {
      JspBreakpointManager.instance = new JspBreakpointManager();
    }
    return JspBreakpointManager.instance;
  }

  constructor() {
    this.jspMapper = new JspMapper();
    this.configManager = ConfigurationManager.getInstance();
  }

  /**
   * Handle breakpoint changes for JSP files
   */
  public async handleBreakpointChange(event: vscode.BreakpointsChangeEvent): Promise<void> {
    // Handle added breakpoints
    for (const bp of event.added) {
      if (bp instanceof vscode.SourceBreakpoint && bp.location.uri.fsPath.endsWith('.jsp')) {
        await this.addJspBreakpoint(bp);
      }
    }

    // Handle removed breakpoints
    for (const bp of event.removed) {
      if (bp instanceof vscode.SourceBreakpoint && bp.location.uri.fsPath.endsWith('.jsp')) {
        await this.removeJspBreakpoint(bp);
      }
    }
  }

  /**
   * Add a JSP breakpoint and corresponding servlet breakpoint
   */
  private async addJspBreakpoint(breakpoint: vscode.SourceBreakpoint): Promise<void> {
    const jspFile = breakpoint.location.uri.fsPath;
    const jspLine = breakpoint.location.range.start.line + 1; // Convert to 1-based

    // Find the corresponding servlet file
    const servletJavaFile = this.jspMapper.getServletSourceFilePath(jspFile);
    if (!servletJavaFile) {
      vscode.window.showWarningMessage(
        `Servlet source not found for ${path.basename(jspFile)}. Make sure the JSP is compiled.`
      );
      return;
    }

    // Create line mapping
    const servletLine = await this.mapJspLineToServletLine(jspFile, servletJavaFile, jspLine);
    if (!servletLine) {
      vscode.window.showWarningMessage(
        `Could not map JSP line ${jspLine} to servlet line in ${path.basename(servletJavaFile)}`
      );
      return;
    }

    // Create servlet breakpoint
    const servletUri = vscode.Uri.file(servletJavaFile);
    const servletLocation = new vscode.Location(
      servletUri,
      new vscode.Position(servletLine - 1, 0) // Convert back to 0-based
    );
    
    const servletBreakpoint = new vscode.SourceBreakpoint(servletLocation);

    // Store the mapping
    if (!this.jspBreakpoints.has(jspFile)) {
      this.jspBreakpoints.set(jspFile, []);
    }
    this.jspBreakpoints.get(jspFile)!.push(breakpoint);

    if (!this.servletBreakpoints.has(servletJavaFile)) {
      this.servletBreakpoints.set(servletJavaFile, []);
    }
    this.servletBreakpoints.get(servletJavaFile)!.push(servletBreakpoint);

    // Add the servlet breakpoint
    const existingBreakpoints = vscode.debug.breakpoints;
    vscode.debug.removeBreakpoints([]); // Trigger refresh
    vscode.debug.addBreakpoints([...existingBreakpoints, servletBreakpoint]);

    console.log(`Added servlet breakpoint: ${path.basename(servletJavaFile)}:${servletLine} for JSP ${path.basename(jspFile)}:${jspLine}`);
  }

  /**
   * Remove JSP breakpoint and corresponding servlet breakpoint
   */
  private async removeJspBreakpoint(breakpoint: vscode.SourceBreakpoint): Promise<void> {
    const jspFile = breakpoint.location.uri.fsPath;
    
    // Find and remove corresponding servlet breakpoints
    const jspBreakpoints = this.jspBreakpoints.get(jspFile) || [];
    const index = jspBreakpoints.indexOf(breakpoint);
    
    if (index >= 0) {
      jspBreakpoints.splice(index, 1);
      
      // Find corresponding servlet breakpoint
      for (const [servletFile, servletBreakpoints] of this.servletBreakpoints) {
        if (servletBreakpoints.length > index) {
          const servletBp = servletBreakpoints[index];
          vscode.debug.removeBreakpoints([servletBp]);
          servletBreakpoints.splice(index, 1);
          break;
        }
      }
    }
  }

  /**
   * Map JSP line number to servlet line number
   */
  private async mapJspLineToServletLine(jspFile: string, servletFile: string, jspLine: number): Promise<number | null> {
    try {
      if (!fs.existsSync(servletFile)) {
        return null;
      }

      const servletContent = fs.readFileSync(servletFile, 'utf8');
      const lines = servletContent.split('\n');

      // Look for the line mapping comment that corresponds to this JSP line
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/\/\/\s*Line\s+(\d+),\s*JSP\s*file:/i);
        
        if (match) {
          const commentJspLine = parseInt(match[1]);
          if (commentJspLine === jspLine) {
            return i + 1; // Return 1-based line number
          }
        }
      }

      // Fallback: use the JSP line number directly
      return jspLine;

    } catch (error) {
      console.error('Error mapping JSP line to servlet line:', error);
      return null;
    }
  }

  /**
   * Get all JSP breakpoints for a file
   */
  public getJspBreakpoints(jspFile: string): vscode.SourceBreakpoint[] {
    return this.jspBreakpoints.get(jspFile) || [];
  }

  /**
   * Get all servlet breakpoints for a file
   */
  public getServletBreakpoints(servletFile: string): vscode.SourceBreakpoint[] {
    return this.servletBreakpoints.get(servletFile) || [];
  }
}