import * as vscode from 'vscode';
import { JspDebugConfigurationProvider, JspDebugAdapterDescriptorFactory } from './debugConfigurationProvider';
import { JspDebugAdapterTrackerFactory } from './debugTracker';
import { JspBreakpointManager } from './breakpointManager';
import { ConfigurationManager } from './configurationManager';
import { JspMapper } from './jspMapper';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  console.log('JSP Debug extension activated');

  const configManager = ConfigurationManager.getInstance();
  const jspMapper = new JspMapper();
  const breakpointManager = JspBreakpointManager.getInstance();

  // Register debug configuration provider
  const provider = new JspDebugConfigurationProvider();
  context.subscriptions.push(
    vscode.debug.registerDebugConfigurationProvider('jsp', provider)
  );

  // Register debug adapter descriptor factory
  const factory = new JspDebugAdapterDescriptorFactory();
  context.subscriptions.push(
    vscode.debug.registerDebugAdapterDescriptorFactory('jsp', factory)
  );

  // Register debug adapter tracker factory for source mapping
  const trackerFactory = new JspDebugAdapterTrackerFactory();
  context.subscriptions.push(
    vscode.debug.registerDebugAdapterTrackerFactory('java', trackerFactory),
    vscode.debug.registerDebugAdapterTrackerFactory('jsp', trackerFactory)
  );

  // Register breakpoint change handler
  context.subscriptions.push(
    vscode.debug.onDidChangeBreakpoints(async (event) => {
      await breakpointManager.handleBreakpointChange(event);
    })
  );

  // Register command to show compiled servlet path
  const showServletPathCommand = vscode.commands.registerCommand(
    'jsp.showCompiledServletPath',
    async () => {
      const activeEditor = vscode.window.activeTextEditor;
      
      if (!activeEditor) {
        vscode.window.showWarningMessage('No active editor found');
        return;
      }

      const filePath = activeEditor.document.fileName;
      
      if (!jspMapper.isJspFile(filePath)) {
        vscode.window.showWarningMessage('Current file is not a JSP file');
        return;
      }

      const servletClassFile = configManager.findCompiledServletClass(filePath);
      const servletClassName = configManager.jspPathToServletClassName(filePath);
      
      if (servletClassFile) {
        const message = `JSP: ${path.basename(filePath)}
Servlet Class: ${servletClassName}
Compiled Class: ${servletClassFile}`;
        
        vscode.window.showInformationMessage(message, 'Copy Path').then(selection => {
          if (selection === 'Copy Path') {
            vscode.env.clipboard.writeText(servletClassFile);
          }
        });
      } else {
        const message = `JSP: ${path.basename(filePath)}
Servlet Class: ${servletClassName}
Status: Not compiled (class file not found)

Make sure Tomcat has compiled this JSP by accessing it in a browser first.`;
        
        vscode.window.showWarningMessage(message);
      }
    }
  );

  context.subscriptions.push(showServletPathCommand);

  // Register command to validate JSP debugging setup
  const validateSetupCommand = vscode.commands.registerCommand(
    'jsp.validateSetup',
    async () => {
      const config = configManager.loadConfiguration();
      
      if (!config) {
        vscode.window.showErrorMessage('JSP debug setup is not valid. Please check config.json.');
        return;
      }

      const servletDir = configManager.getCompiledServletDirectory();
      
      let message = `✅ JSP Debug Setup Validation

Tomcat Home: ${config.catalinaHome}
Tomcat Base: ${config.catalinaBase}
Servlet Directory: ${servletDir}
Status: Configuration is valid`;

      if (servletDir && require('fs').existsSync(servletDir)) {
        message += '\n\n✅ Servlet directory exists';
      } else {
        message += '\n\n⚠️ Servlet directory not found - JSPs may not be compiled yet';
      }

      vscode.window.showInformationMessage(message);
    }
  );

  context.subscriptions.push(validateSetupCommand);

  // Register breakpoint event handlers
  context.subscriptions.push(
    vscode.debug.onDidStartDebugSession((session) => {
      if (session.type === 'java' && session.configuration._isJspDebug) {
        console.log('JSP debug session started via Java debugger:', session.name);
        vscode.window.showInformationMessage('JSP debug session started. Breakpoints in JSP files will be mapped to servlet classes.');
      }
    })
  );

  context.subscriptions.push(
    vscode.debug.onDidTerminateDebugSession((session) => {
      if (session.type === 'java' && session.configuration._isJspDebug) {
        console.log('JSP debug session terminated:', session.name);
      }
    })
  );

  // Register file watcher for config.json changes
  const configWatcher = vscode.workspace.createFileSystemWatcher('**/config.json');
  
  configWatcher.onDidChange(() => {
    configManager.loadConfiguration();
    vscode.window.showInformationMessage('JSP debug configuration reloaded');
  });

  context.subscriptions.push(configWatcher);

  // Show welcome message on first activation
  const isFirstActivation = context.globalState.get('jsp.firstActivation', true);
  
  if (isFirstActivation) {
    context.globalState.update('jsp.firstActivation', false);
    
    vscode.window.showInformationMessage(
      'JSP Debug extension activated! Create a config.json file in your workspace to get started.',
      'Create Config',
      'Learn More'
    ).then(selection => {
      if (selection === 'Create Config') {
        vscode.commands.executeCommand('jsp.validateSetup');
      } else if (selection === 'Learn More') {
        vscode.env.openExternal(vscode.Uri.parse('https://github.com/your-repo/vscode-jsp-debug'));
      }
    });
  }
}

export function deactivate() {
  console.log('JSP Debug extension deactivated');
}