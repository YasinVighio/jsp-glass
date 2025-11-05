import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface JspDebugConfig {
  catalinaHome: string;
  catalinaBase?: string;
  webappContext?: string;
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
      webappContext: "ROOT"
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
    console.log(`JSP Debug: Finding servlet class for JSP: ${jspPath}`);
    
    const servletDir = this.getCompiledServletDirectory(webappContext);
    if (!servletDir) {
      console.error('JSP Debug: Could not determine servlet directory');
      return null;
    }

    console.log(`JSP Debug: Servlet directory: ${servletDir}`);
    console.log(`JSP Debug: Servlet directory exists: ${fs.existsSync(servletDir)}`);

    // Extract relative path from webapp
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      console.error('JSP Debug: No workspace folder found');
      return null;
    }

    console.log(`JSP Debug: Workspace folder: ${workspaceFolder.uri.fsPath}`);
    
    let relativePath = path.relative(workspaceFolder.uri.fsPath, jspPath);
    console.log(`JSP Debug: Initial relative path: ${relativePath}`);
    
    // Handle webapp subdirectories (src/main/webapp, WebContent, etc.)
    const webappDirs = ['src/main/webapp', 'WebContent', 'web', 'webapp'];
    let foundWebappDir = false;
    for (const webappDir of webappDirs) {
      if (relativePath.startsWith(webappDir)) {
        relativePath = relativePath.substring(webappDir.length + 1);
        console.log(`JSP Debug: Stripped webapp dir '${webappDir}', new relative path: ${relativePath}`);
        foundWebappDir = true;
        break;
      }
    }
    
    if (!foundWebappDir) {
      console.log(`JSP Debug: No webapp directory prefix found, using full relative path`);
    }

    // Convert to servlet class file path
    const classFileName = relativePath
      .replace(/\\/g, '_')
      .replace(/\//g, '_')
      .replace(/\.jsp$/, '_jsp.class');

    console.log(`JSP Debug: Generated class file name: ${classFileName}`);

    const classFilePath = path.join(servletDir, classFileName);
    console.log(`JSP Debug: Looking for class file: ${classFilePath}`);
    console.log(`JSP Debug: Class file exists: ${fs.existsSync(classFilePath)}`);
    
    // Also check for .java file
    const javaFileName = classFileName.replace('.class', '.java');
    const javaFilePath = path.join(servletDir, javaFileName);
    console.log(`JSP Debug: Looking for java file: ${javaFilePath}`);
    console.log(`JSP Debug: Java file exists: ${fs.existsSync(javaFilePath)}`);
    
    if (fs.existsSync(classFilePath)) {
      return classFilePath;
    }
    
    if (fs.existsSync(javaFilePath)) {
      console.log(`JSP Debug: Found .java file but no .class file`);
      return javaFilePath.replace('.java', '.class'); // Return expected .class path
    }

    // Try alternative naming conventions
    const jspBaseName = path.basename(jspPath, '.jsp');
    const alternativeNames = [
      `${jspBaseName}_jsp.class`,  // Simple name
      `index_jsp.class`,  // Common index page
      `${jspBaseName}.class`,  // Without _jsp suffix
    ];

    console.log(`JSP Debug: Trying alternative class names:`, alternativeNames);

    for (const altName of alternativeNames) {
      const altClassPath = path.join(servletDir, altName);
      const altJavaPath = altClassPath.replace('.class', '.java');
      
      console.log(`JSP Debug: Checking alternative: ${altClassPath}`);
      
      if (fs.existsSync(altClassPath) || fs.existsSync(altJavaPath)) {
        console.log(`JSP Debug: Found alternative servlet at: ${altClassPath}`);
        return altClassPath;
      }
    }

    // List actual files in servlet directory for debugging
    if (fs.existsSync(servletDir)) {
      try {
        const files = fs.readdirSync(servletDir, { withFileTypes: true });
        const fileList = files.map(f => `${f.name} (${f.isDirectory() ? 'dir' : 'file'})`);
        console.log(`JSP Debug: Contents of servlet directory (${servletDir}):`, fileList);
        
        // Look for any files containing our JSP name
        const matchingFiles = files.filter(f => 
          !f.isDirectory() && (
            f.name.includes(jspBaseName) || 
            f.name.includes('index') ||
            f.name.endsWith('.java') ||
            f.name.endsWith('.class')
          )
        ).map(f => f.name);
        console.log(`JSP Debug: Relevant files in servlet directory:`, matchingFiles);
      } catch (err) {
        console.error(`JSP Debug: Error listing servlet directory:`, err);
      }
    } else {
      console.error(`JSP Debug: Servlet directory does not exist: ${servletDir}`);
      
      // Check parent directories
      const parentDir = path.dirname(servletDir);
      if (fs.existsSync(parentDir)) {
        console.log(`JSP Debug: Parent directory exists: ${parentDir}`);
        try {
          const parentFiles = fs.readdirSync(parentDir);
          console.log(`JSP Debug: Contents of parent directory:`, parentFiles);
        } catch (err) {
          console.error(`JSP Debug: Error listing parent directory:`, err);
        }
      }
    }

    return null;
  }
}