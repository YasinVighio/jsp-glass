import * as vscode from 'vscode';
import { ConfigurationManager } from './configurationManager';

export class JspDebugConfigurationProvider implements vscode.DebugConfigurationProvider {
  private configManager: ConfigurationManager;

  constructor() {
    this.configManager = ConfigurationManager.getInstance();
  }

  /**
   * Massage a debug configuration just before a debug session is being launched
   */
  resolveDebugConfiguration(
    folder: vscode.WorkspaceFolder | undefined,
    config: vscode.DebugConfiguration,
    token?: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.DebugConfiguration> {
    
    // If launch.json is missing or empty
    if (!config.type && !config.request && !config.name) {
      const editor = vscode.window.activeTextEditor;
      if (editor && this.isJspFile(editor.document.fileName)) {
        config.type = 'jsp';
        config.name = 'Attach to Tomcat (JSP Debug)';
        config.request = 'attach';
        config.hostName = 'localhost';
        config.port = 8000;
      }
    }

    if (config.type !== 'jsp') {
      return config;
    }

    // Validate configuration
    const jspConfig = this.configManager.getConfiguration();
    if (!jspConfig) {
      vscode.window.showErrorMessage('JSP debug configuration not found. Please check config.json.');
      return null;
    }

    // Convert JSP configuration to Java configuration
    // The debug tracker will handle the source mapping
    const javaConfig: vscode.DebugConfiguration = {
      type: 'java',
      request: config.request || 'attach',
      name: config.name || 'JSP Debug (Java)',
      hostName: config.hostName || 'localhost',
      port: config.port || 8000,
      timeout: config.timeout || 30000,
      projectName: config.projectName,
      // Mark this as a JSP debug session for the tracker
      _isJspDebug: true
    };

    return javaConfig;
  }

  /**
   * Provide initial debug configurations
   */
  provideDebugConfigurations(
    folder: vscode.WorkspaceFolder | undefined,
    token?: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.DebugConfiguration[]> {
    
    return [
      {
        type: 'jsp',
        request: 'attach',
        name: 'Attach to Tomcat (JSP Debug)',
        hostName: 'localhost',
        port: 8000
      }
    ];
  }

  /**
   * Check if file is a JSP file
   */
  private isJspFile(filePath: string): boolean {
    return filePath.toLowerCase().endsWith('.jsp') || filePath.toLowerCase().endsWith('.jspx');
  }
}

export class JspDebugAdapterDescriptorFactory implements vscode.DebugAdapterDescriptorFactory {
  
  createDebugAdapterDescriptor(
    session: vscode.DebugSession,
    executable: vscode.DebugAdapterExecutable | undefined
  ): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {
    
    // For JSP debugging, we now delegate directly to Java debugger
    // The debug tracker will handle source mapping
    if (session.configuration.type === 'java' && session.configuration._isJspDebug) {
      // Find the Java debug extension
      const javaDebugExtension = vscode.extensions.getExtension('vscjava.vscode-java-debug');
      
      if (!javaDebugExtension) {
        vscode.window.showErrorMessage('Java debug extension is required for JSP debugging. Please install vscjava.vscode-java-debug.');
        return null;
      }

      // Return null to use the default Java debug adapter
      return null;
    }

    return executable;
  }
}