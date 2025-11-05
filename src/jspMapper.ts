import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ConfigurationManager } from './configurationManager';

export interface JspBreakpoint {
  jspFile: string;
  jspLine: number;
  servletClass: string;
}

export class JspMapper {
  private configManager: ConfigurationManager;

  constructor() {
    this.configManager = ConfigurationManager.getInstance();
  }

  /**
   * Map JSP file and line to servlet class information
   */
  public mapJspToServlet(jspFile: string, jspLine: number): JspBreakpoint | null {
    const servletClassFile = this.configManager.findCompiledServletClass(jspFile);
    if (!servletClassFile) {
      vscode.window.showWarningMessage(`Compiled servlet not found for ${path.basename(jspFile)}. Make sure Tomcat has compiled the JSP.`);
      return null;
    }

    const servletClassName = this.configManager.jspPathToServletClassName(jspFile);

    return {
      jspFile,
      jspLine,
      servletClass: servletClassName
    };
  }

  /**
   * Check if a file is a JSP file
   */
  public isJspFile(filePath: string): boolean {
    return filePath.toLowerCase().endsWith('.jsp') || filePath.toLowerCase().endsWith('.jspx');
  }

  /**
   * Get all JSP files in the workspace
   */
  public async findJspFiles(): Promise<string[]> {
    const jspFiles: string[] = [];
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    
    if (!workspaceFolder) {
      return jspFiles;
    }

    const pattern = new vscode.RelativePattern(workspaceFolder, '**/*.{jsp,jspx}');
    const files = await vscode.workspace.findFiles(pattern);

    return files.map(file => file.fsPath);
  }

  /**
   * Get servlet class name from JSP file path
   */
  public getServletClassName(jspFilePath: string): string {
    return this.configManager.jspPathToServletClassName(jspFilePath);
  }

  /**
   * Extract JSP file path from servlet class name
   */
  public getJspFileFromServletClass(servletClassName: string): string | null {
    // Remove org.apache.jsp. prefix
    if (!servletClassName.startsWith('org.apache.jsp.')) {
      return null;
    }

    let jspPath = servletClassName.substring('org.apache.jsp.'.length);
    
    // Remove _jsp suffix
    if (jspPath.endsWith('_jsp')) {
      jspPath = jspPath.substring(0, jspPath.length - 4);
    }

    // Convert underscores back to path separators
    // This is a simplified conversion - in reality, the mapping can be more complex
    jspPath = jspPath.replace(/_/g, '/') + '.jsp';

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return null;
    }

    // Try common webapp directory structures
    const webappDirs = ['src/main/webapp', 'WebContent', 'web', 'webapp', ''];
    
    for (const webappDir of webappDirs) {
      const fullPath = webappDir 
        ? path.join(workspaceFolder.uri.fsPath, webappDir, jspPath)
        : path.join(workspaceFolder.uri.fsPath, jspPath);
      
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }

    return null;
  }

  /**
   * Validate that servlet class exists for JSP file
   */
  public validateServletExists(jspFilePath: string): boolean {
    const servletClassFile = this.configManager.findCompiledServletClass(jspFilePath);
    return servletClassFile !== null;
  }

  /**
   * Get servlet class file path for JSP file
   */
  public getServletClassFilePath(jspFilePath: string): string | null {
    return this.configManager.findCompiledServletClass(jspFilePath);
  }

  /**
   * Get servlet source file path (.java) for JSP file
   */
  public getServletSourceFilePath(jspFilePath: string): string | null {
    const classFile = this.getServletClassFilePath(jspFilePath);
    if (!classFile) {
      // Enhanced debugging info
      const config = this.configManager.getConfiguration();
      if (!config) {
        console.error('JSP Debug: No configuration found');
        return null;
      }
      
      const servletDir = this.configManager.getCompiledServletDirectory();
      console.error(`JSP Debug: Servlet class not found for ${jspFilePath}`);
      console.error(`JSP Debug: Looking in servlet directory: ${servletDir}`);
      console.error(`JSP Debug: Servlet directory exists: ${fs.existsSync(servletDir || '')}`);
      
      if (servletDir && fs.existsSync(servletDir)) {
        console.error(`JSP Debug: Contents of servlet directory:`, fs.readdirSync(servletDir));
      }
      
      return null;
    }
    
    const javaFile = classFile.replace('.class', '.java');
    const exists = fs.existsSync(javaFile);
    
    console.log(`JSP Debug: Servlet class file: ${classFile}`);
    console.log(`JSP Debug: Servlet java file: ${javaFile}`);
    console.log(`JSP Debug: Java file exists: ${exists}`);
    
    if (!exists) {
      // Check if .class exists but not .java (Tomcat might not generate .java)
      if (fs.existsSync(classFile)) {
        console.warn(`JSP Debug: .class file exists but .java file missing. Tomcat may not be configured to keep Java source files.`);
      }
    }
    
    return exists ? javaFile : null;
  }

  /**
   * Create a temporary servlet breakpoint file for debugging
   */
  public async createServletBreakpointMapping(jspFilePath: string, jspLines: number[]): Promise<string | null> {
    const servletJavaFile = this.getServletSourceFilePath(jspFilePath);
    if (!servletJavaFile) {
      return null;
    }

    try {
      // Read the servlet source file
      const servletContent = fs.readFileSync(servletJavaFile, 'utf8');
      
      // Parse JSP line mappings from servlet comments or SMAP
      const lineMappings = this.parseLineMapping(servletContent);
      
      // Map JSP lines to servlet lines
      const servletLines: number[] = [];
      for (const jspLine of jspLines) {
        const servletLine = lineMappings.get(jspLine);
        if (servletLine) {
          servletLines.push(servletLine);
        }
      }

      if (servletLines.length > 0) {
        // Create a mapping file for the debugger
        const mappingFile = this.createDebugMappingFile(jspFilePath, servletJavaFile, jspLines, servletLines);
        return mappingFile;
      }
    } catch (error) {
      console.error('Error creating servlet breakpoint mapping:', error);
    }

    return null;
  }

  /**
   * Parse line mapping information from servlet source
   */
  private parseLineMapping(servletContent: string): Map<number, number> {
    const lineMappings = new Map<number, number>();
    
    // Look for JSP line number comments in the servlet
    // Tomcat generates comments like: // Line 15, JSP file: /index.jsp
    const lineRegex = /\/\/\s*Line\s+(\d+),\s*JSP\s*file:/gi;
    const lines = servletContent.split('\n');
    
    lines.forEach((line, servletLineNumber) => {
      const match = lineRegex.exec(line);
      if (match) {
        const jspLineNumber = parseInt(match[1]);
        lineMappings.set(jspLineNumber, servletLineNumber + 1);
      }
      lineRegex.lastIndex = 0; // Reset regex
    });

    return lineMappings;
  }

  /**
   * Create debug mapping file
   */
  private createDebugMappingFile(jspFile: string, servletFile: string, jspLines: number[], servletLines: number[]): string {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      throw new Error('No workspace folder');
    }

    const mappingData = {
      jspFile,
      servletFile,
      mappings: jspLines.map((jspLine, index) => ({
        jspLine,
        servletLine: servletLines[index] || jspLine
      }))
    };

    const mappingDir = path.join(workspaceFolder.uri.fsPath, '.vscode', 'jsp-debug');
    if (!fs.existsSync(mappingDir)) {
      fs.mkdirSync(mappingDir, { recursive: true });
    }

    const mappingFile = path.join(mappingDir, `${path.basename(jspFile, '.jsp')}.mapping.json`);
    fs.writeFileSync(mappingFile, JSON.stringify(mappingData, null, 2));
    
    return mappingFile;
  }
}