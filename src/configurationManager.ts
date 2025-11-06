import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface JspDebugConfig {
  catalinaHome: string;
  catalinaBase?: string;
  webappContext?: string;
  jspSourceRoot?: string;
  enableDebugLogging?: boolean;
}

export class ConfigurationManager {
  private static instance: ConfigurationManager;
  private config: JspDebugConfig | null = null;

  public static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  /**
   * Load configuration from workspace config.json
   */
  public loadConfiguration(): JspDebugConfig | null {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder found. Please open a workspace to use JSP debugging.');
      return null;
    }

    const configPath = path.join(workspaceFolder.uri.fsPath, 'config.json');
    
    try {
      if (!fs.existsSync(configPath)) {
        this.createDefaultConfig(configPath);
        vscode.window.showWarningMessage(`Created default config.json at ${configPath}. Please update catalinaHome path.`);
        return null;
      }

      const configContent = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configContent) as JspDebugConfig;

      if (!config.catalinaHome) {
        vscode.window.showErrorMessage('catalinaHome is required in config.json');
        return null;
      }

      if (!fs.existsSync(config.catalinaHome)) {
        vscode.window.showErrorMessage(`Tomcat directory not found: ${config.catalinaHome}`);
        return null;
      }

      // Set default catalinaBase if not specified
      if (!config.catalinaBase) {
        config.catalinaBase = config.catalinaHome;
      }

      this.config = config;
      return config;
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to load config.json: ${error}`);
      return null;
    }
  }

  /**
   * Get current configuration
   */
  public getConfiguration(): JspDebugConfig | null {
    return this.config || this.loadConfiguration();
  }

  /**
   * Create default configuration file
   */
  private createDefaultConfig(configPath: string): void {
    const defaultConfig: JspDebugConfig = {
      catalinaHome: "/path/to/tomcat",
      webappContext: "ROOT",
      jspSourceRoot: "src/main/webapp",
      enableDebugLogging: true
    };

    try {
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to create config.json: ${error}`);
    }
  }

  /**
   * Get Tomcat work directory for compiled servlets
   */
  public getCompiledServletDirectory(webappContext?: string): string | null {
    const config = this.getConfiguration();
    if (!config) {
      return null;
    }

    const context = webappContext || config.webappContext || 'ROOT';
    return path.join(
      config.catalinaBase || config.catalinaHome,
      'work',
      'Catalina',
      'localhost',
      context,
      'org',
      'apache',
      'jsp'
    );
  }

  /**
   * Convert JSP file path to servlet class name
   */
  public jspPathToServletClassName(jspPath: string): string {
    // Convert path separators to underscores and remove .jsp extension
    const relativePath = jspPath.replace(/\\/g, '/').replace(/^\//, '');
    const className = relativePath
      .replace(/\//g, '_')
      .replace(/\./g, '_')
      .replace(/_jsp$/, '_jsp');
    
    return `org.apache.jsp.${className}`;
  }

  /**
   * Find compiled servlet class file for JSP
   */
  public findCompiledServletClass(jspPath: string, webappContext?: string): string | null {
    const config = this.getConfiguration();
    if (!config) {
      console.error('JSP Debug: No configuration available');
      return null;
    }

    console.log(`JSP Debug: Finding servlet class for JSP: ${jspPath}`);
    
    const servletDir = this.getCompiledServletDirectory(webappContext);
    if (!servletDir) {
      console.error('JSP Debug: Could not determine servlet directory');
      return null;
    }

    console.log(`JSP Debug: Servlet directory: ${servletDir}`);

    // Get workspace folder
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      console.error('JSP Debug: No workspace folder found');
      return null;
    }

    // Calculate relative path from jspSourceRoot
    let relativePath: string = '';
    
    if (config.jspSourceRoot) {
      // Use configured jspSourceRoot
      const jspSourcePath = path.join(workspaceFolder.uri.fsPath, config.jspSourceRoot);
      console.log(`JSP Debug: JSP source root: ${jspSourcePath}`);
      
      if (!jspPath.toLowerCase().startsWith(jspSourcePath.toLowerCase())) {
        console.error(`JSP Debug: JSP file ${jspPath} is not under jspSourceRoot ${jspSourcePath}`);
        return null;
      }
      
      relativePath = path.relative(jspSourcePath, jspPath);
      console.log(`JSP Debug: Relative path from jspSourceRoot: ${relativePath}`);
    } else {
      // Fallback: try to detect webapp directory
      const relativeFromWorkspace = path.relative(workspaceFolder.uri.fsPath, jspPath);
      console.log(`JSP Debug: Relative path from workspace: ${relativeFromWorkspace}`);
      
      const webappDirs = ['src/main/webapp', 'WebContent', 'web', 'webapp'];
      let found = false;
      
      for (const webappDir of webappDirs) {
        if (relativeFromWorkspace.startsWith(webappDir)) {
          relativePath = relativeFromWorkspace.substring(webappDir.length + 1);
          console.log(`JSP Debug: Detected webapp dir '${webappDir}', relative path: ${relativePath}`);
          found = true;
          break;
        }
      }
      
      if (!found) {
        console.warn(`JSP Debug: Could not detect webapp directory. Configure jspSourceRoot in config.json`);
        relativePath = relativeFromWorkspace;
      }
    }

    // Normalize path separators and preserve directory structure
    const normalizedPath = relativePath.replace(/\\/g, '/');
    console.log(`JSP Debug: Normalized path: ${normalizedPath}`);
    
    // Build class file path preserving directory structure
    // Example: ui/test/hello.jsp -> org/apache/jsp/ui/test/hello_jsp.class
    const pathParts = normalizedPath.split('/');
    const fileName = pathParts.pop()!.replace(/\.jsp$/, '_jsp.class');
    const dirPath = pathParts.join('/');
    
    const classFilePath = dirPath 
      ? path.join(servletDir, dirPath, fileName)
      : path.join(servletDir, fileName);
    
    console.log(`JSP Debug: Looking for class file: ${classFilePath}`);
    
    if (fs.existsSync(classFilePath)) {
      console.log(`JSP Debug: Found class file: ${classFilePath}`);
      return classFilePath;
    }

    // Try .java file
    const javaFilePath = classFilePath.replace('.class', '.java');
    console.log(`JSP Debug: Looking for java file: ${javaFilePath}`);
    
    if (fs.existsSync(javaFilePath)) {
      console.log(`JSP Debug: Found .java file but no .class file`);
      return classFilePath; // Return expected .class path
    }

    // Debug: list servlet directory contents
    this.debugListServletDirectory(servletDir, normalizedPath);

    console.error(`JSP Debug: Servlet class not found for ${jspPath}`);
    return null;
  }

  /**
   * Helper to debug servlet directory contents
   */
  private debugListServletDirectory(servletDir: string, expectedPath: string): void {
    if (!fs.existsSync(servletDir)) {
      console.error(`JSP Debug: Servlet directory does not exist: ${servletDir}`);
      return;
    }

    try {
      console.log(`JSP Debug: Expected path structure: ${expectedPath}`);
      console.log(`JSP Debug: Listing servlet directory: ${servletDir}`);
      
      // Recursive directory listing
      const listDir = (dir: string, indent: string = ''): void => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          console.log(`${indent}${entry.name}${entry.isDirectory() ? '/' : ''}`);
          if (entry.isDirectory() && indent.length < 20) { // Limit depth
            listDir(path.join(dir, entry.name), indent + '  ');
          }
        }
      };
      
      listDir(servletDir);
    } catch (err) {
      console.error(`JSP Debug: Error listing servlet directory:`, err);
    }
  }
}