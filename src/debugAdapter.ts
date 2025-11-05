import {
  DebugSession,
  InitializedEvent,
  TerminatedEvent,
  StoppedEvent,
  BreakpointEvent,
  OutputEvent,
  Thread,
  StackFrame,
  Source,
  Handles,
  Breakpoint
} from 'vscode-debugadapter';
import { DebugProtocol } from 'vscode-debugprotocol';
import { JspMapper } from './jspMapper';
import { ConfigurationManager } from './configurationManager';
import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';

interface JspDebugArguments extends DebugProtocol.AttachRequestArguments {
  hostName: string;
  port: number;
  projectName?: string;
  timeout?: number;
}

interface ServletBreakpointMapping {
  jspFile: string;
  jspLine: number;
  servletClass: string;
  servletFile?: string;
}

export class JspDebugSession extends DebugSession {
  private jspMapper: JspMapper;
  private configManager: ConfigurationManager;
  private javaDebugSession: any = null;
  private jspBreakpoints = new Map<string, ServletBreakpointMapping[]>();
  private servletToJspMapping = new Map<string, string>();

  constructor() {
    super();
    this.jspMapper = new JspMapper();
    this.configManager = ConfigurationManager.getInstance();
  }

  /**
   * Initialize the debug session
   */
  protected initializeRequest(
    response: DebugProtocol.InitializeResponse,
    args: DebugProtocol.InitializeRequestArguments
  ): void {
    
    response.body = response.body || {};
    response.body.supportsConfigurationDoneRequest = true;
    response.body.supportsEvaluateForHovers = true;
    response.body.supportsStepBack = false;
    response.body.supportsSetVariable = true;
    response.body.supportsRestartFrame = false;
    response.body.supportsGotoTargetsRequest = false;
    response.body.supportsStepInTargetsRequest = false;
    response.body.supportsCompletionsRequest = false;
    response.body.supportsExceptionInfoRequest = true;

    this.sendResponse(response);
    this.sendEvent(new InitializedEvent());
  }

  /**
   * Configure debug session
   */
  protected configurationDoneRequest(
    response: DebugProtocol.ConfigurationDoneResponse,
    args: DebugProtocol.ConfigurationDoneArguments
  ): void {
    // Start the underlying Java debug session
    this.startJavaDebugSession();
    this.sendResponse(response);
  }

  /**
   * Attach to the target JVM
   */
  protected async attachRequest(
    response: DebugProtocol.AttachResponse,
    args: JspDebugArguments
  ): Promise<void> {
    
    try {
      // Validate configuration
      const config = this.configManager.getConfiguration();
      if (!config) {
        throw new Error('JSP debug configuration not found');
      }

      // The actual connection to JVM will be handled by the Java debug adapter
      this.sendResponse(response);
      this.sendEvent(new OutputEvent('JSP Debug session started. Ready to debug JSP files.\n'));
      
    } catch (error) {
      response.success = false;
      response.message = `Failed to attach: ${error}`;
      this.sendResponse(response);
    }
  }

  /**
   * Set breakpoints in JSP files
   */
  protected async setBreakPointsRequest(
    response: DebugProtocol.SetBreakpointsResponse,
    args: DebugProtocol.SetBreakpointsArguments
  ): Promise<void> {
    
    const sourcePath = args.source.path!;
    const clientLines = args.lines || [];

    if (!this.jspMapper.isJspFile(sourcePath)) {
      // Not a JSP file, delegate to Java debugger
      if (this.javaDebugSession) {
        try {
          const javaResponse = await this.forwardRequestToJavaDebugger('setBreakpoints', args);
          response.body = javaResponse.body;
          this.sendResponse(response);
        } catch (error) {
          response.success = false;
          response.message = (error as Error).message;
          this.sendResponse(response);
        }
      } else {
        response.body = { breakpoints: [] };
        this.sendResponse(response);
      }
      return;
    }

    // Handle JSP breakpoints
    const breakpoints: Breakpoint[] = [];
    const servletBreakpoints: ServletBreakpointMapping[] = [];
    
    // Check if servlet is compiled
    const servletClassFile = this.configManager.findCompiledServletClass(sourcePath);
    const servletJavaFile = this.jspMapper.getServletSourceFilePath(sourcePath);
    
    if (!servletClassFile || !servletJavaFile) {
      // Servlet not compiled yet - create unverified breakpoints
      for (const line of clientLines) {
        const bp = new Breakpoint(false, line);
        breakpoints.push(bp);
      }
      
      this.sendEvent(new OutputEvent(`⚠ Servlet not compiled for ${path.basename(sourcePath)}. Access the JSP in browser first to compile it.\n`));
      
      response.body = { breakpoints };
      this.sendResponse(response);
      return;
    }

    // Create servlet breakpoint mapping
    try {
      const mappingFile = await this.jspMapper.createServletBreakpointMapping(sourcePath, clientLines);
      
      if (mappingFile) {
        // Read the mapping to get servlet lines
        const mappingData = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));
        
        for (const mapping of mappingData.mappings) {
          const servletMapping: ServletBreakpointMapping = {
            jspFile: sourcePath,
            jspLine: mapping.jspLine,
            servletClass: this.jspMapper.getServletClassName(sourcePath),
            servletFile: servletJavaFile
          };
          
          servletBreakpoints.push(servletMapping);
          this.servletToJspMapping.set(servletMapping.servletClass, sourcePath);
          
          // Create verified breakpoint for JSP
          const bp = new Breakpoint(true, mapping.jspLine);
          breakpoints.push(bp);
          
          // Set actual breakpoint in servlet file
          await this.setServletBreakpoint(servletMapping, mapping.servletLine);
          
          this.sendEvent(new OutputEvent(`✓ JSP breakpoint mapped: ${path.basename(sourcePath)}:${mapping.jspLine} -> ${path.basename(servletJavaFile)}:${mapping.servletLine}\n`));
        }
        
      } else {
        // Fallback: create breakpoints without mapping
        for (const line of clientLines) {
          const bp = new Breakpoint(true, line);
          breakpoints.push(bp);
          
          const servletMapping: ServletBreakpointMapping = {
            jspFile: sourcePath,
            jspLine: line,
            servletClass: this.jspMapper.getServletClassName(sourcePath),
            servletFile: servletJavaFile
          };
          
          await this.setServletBreakpoint(servletMapping, line); // Use same line number as fallback
        }
      }
    } catch (error) {
      this.sendEvent(new OutputEvent(`✗ Error creating breakpoint mapping: ${error}\n`));
      
      // Create unverified breakpoints as fallback
      for (const line of clientLines) {
        const bp = new Breakpoint(false, line);
        breakpoints.push(bp);
      }
    }

    // Store the mappings for this JSP file
    this.jspBreakpoints.set(sourcePath, servletBreakpoints);

    response.body = { breakpoints };
    this.sendResponse(response);
  }

  /**
   * Get stack trace - map servlet frames back to JSP
   */
  protected async stackTraceRequest(
    response: DebugProtocol.StackTraceResponse,
    args: DebugProtocol.StackTraceArguments
  ): Promise<void> {
    
    if (this.javaDebugSession) {
      try {
        const javaResponse = await this.forwardRequestToJavaDebugger('stackTrace', args);
        
        // Process stack frames to map servlet classes back to JSP files
        const stackFrames = javaResponse.body.stackFrames.map((frame: any) => {
          if (frame.source && frame.source.path) {
            // Check if this is a servlet generated from JSP
            const servletPath = frame.source.path;
            if (servletPath.includes('_jsp.java')) {
              // Find the corresponding JSP file
              const jspFile = this.findJspFileFromServletPath(servletPath);
              if (jspFile) {
                frame.source = new Source(path.basename(jspFile), jspFile);
                // TODO: Map line number from servlet to JSP using SMAP
              }
            }
          }
          return frame;
        });

        response.body = {
          stackFrames: stackFrames,
          totalFrames: javaResponse.body.totalFrames
        };
        
        this.sendResponse(response);
      } catch (error) {
        response.success = false;
        response.message = (error as Error).message;
        this.sendResponse(response);
      }
    } else {
      response.body = { stackFrames: [], totalFrames: 0 };
      this.sendResponse(response);
    }
  }

  /**
   * Forward other debug requests to Java debugger
   */
  protected continueRequest(response: DebugProtocol.ContinueResponse, args: DebugProtocol.ContinueArguments): void {
    this.forwardToJavaDebugger('continue', args, response);
  }

  protected nextRequest(response: DebugProtocol.NextResponse, args: DebugProtocol.NextArguments): void {
    this.forwardToJavaDebugger('next', args, response);
  }

  protected stepInRequest(response: DebugProtocol.StepInResponse, args: DebugProtocol.StepInArguments): void {
    this.forwardToJavaDebugger('stepIn', args, response);
  }

  protected stepOutRequest(response: DebugProtocol.StepOutResponse, args: DebugProtocol.StepOutArguments): void {
    this.forwardToJavaDebugger('stepOut', args, response);
  }

  protected threadsRequest(response: DebugProtocol.ThreadsResponse): void {
    this.forwardToJavaDebugger('threads', {}, response);
  }

  protected scopesRequest(response: DebugProtocol.ScopesResponse, args: DebugProtocol.ScopesArguments): void {
    this.forwardToJavaDebugger('scopes', args, response);
  }

  protected variablesRequest(response: DebugProtocol.VariablesResponse, args: DebugProtocol.VariablesArguments): void {
    this.forwardToJavaDebugger('variables', args, response);
  }

  protected evaluateRequest(response: DebugProtocol.EvaluateResponse, args: DebugProtocol.EvaluateArguments): void {
    this.forwardToJavaDebugger('evaluate', args, response);
  }

  /**
   * Disconnect from debug session
   */
  protected disconnectRequest(
    response: DebugProtocol.DisconnectResponse,
    args: DebugProtocol.DisconnectArguments
  ): void {
    
    if (this.javaDebugSession) {
      this.javaDebugSession.connected = false;
      this.javaDebugSession = null;
    }
    
    this.sendResponse(response);
    this.sendEvent(new TerminatedEvent());
  }

  /**
   * Start the underlying Java debug session
   */
  private startJavaDebugSession(): void {
    try {
      // We'll delegate to the real Java debug adapter but intercept responses
      this.sendEvent(new OutputEvent('Connecting to Java debug adapter...\n'));
      
      // Create a proxy to the Java debug adapter
      this.javaDebugSession = {
        connected: true,
        sendRequest: async (command: string, args: any) => {
          // For now, simulate responses - in a real implementation, 
          // we would forward to the actual Java debug adapter
          switch (command) {
            case 'setBreakpoints':
              return { 
                body: { 
                  breakpoints: args.breakpoints?.map((bp: any) => ({ 
                    verified: true, 
                    line: bp.line 
                  })) || [] 
                } 
              };
            case 'stackTrace':
              // This is where we would remap servlet stack frames back to JSP
              return { 
                body: { 
                  stackFrames: this.createJspMappedStackFrames(args),
                  totalFrames: 1
                } 
              };
            case 'threads':
              return { 
                body: { 
                  threads: [{ id: 1, name: 'main' }] 
                } 
              };
            default:
              return { body: {} };
          }
        }
      };
      
    } catch (error) {
      this.sendEvent(new OutputEvent(`Failed to start Java debug session: ${error}\n`));
    }
  }

  /**
   * Create JSP-mapped stack frames from servlet stack frames
   */
  private createJspMappedStackFrames(args: any): StackFrame[] {
    // This is where the magic happens - map servlet frames back to JSP
    const frames: StackFrame[] = [];
    
    // For each servlet frame, find the corresponding JSP file and line
    for (const [servletClass, jspFile] of this.servletToJspMapping) {
      // Read the mapping file to get line mappings
      try {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) continue;
        
        const mappingFile = path.join(
          workspaceFolder.uri.fsPath, 
          '.vscode', 
          'jsp-debug', 
          `${path.basename(jspFile, '.jsp')}.mapping.json`
        );
        
        if (fs.existsSync(mappingFile)) {
          const mappingData = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));
          
          // Create a stack frame that points to the JSP file
          const frame = new StackFrame(
            1, // frame id
            'JSP Execution', // frame name
            new Source(path.basename(jspFile), jspFile), // JSP source
            mappingData.mappings[0]?.jspLine || 1, // mapped JSP line
            0 // column
          );
          
          frames.push(frame);
        }
      } catch (error) {
        console.error('Error creating JSP-mapped stack frame:', error);
      }
    }
    
    return frames;
  }

  /**
   * Set breakpoint in servlet file
   */
  private async setServletBreakpoint(mapping: ServletBreakpointMapping, servletLine?: number): Promise<void> {
    if (!this.javaDebugSession || !mapping.servletFile) {
      return;
    }

    try {
      // Use provided servlet line or fallback to JSP line
      const targetLine = servletLine || mapping.jspLine;
      
      // Create breakpoint request for servlet file
      const servletBreakpointArgs = {
        source: { path: mapping.servletFile },
        lines: [targetLine],
        breakpoints: [{ line: targetLine }]
      };

      await this.forwardRequestToJavaDebugger('setBreakpoints', servletBreakpointArgs);
      
    } catch (error) {
      this.sendEvent(new OutputEvent(`Failed to set servlet breakpoint: ${error}\n`));
    }
  }

  /**
   * Forward request to Java debugger
   */
  private async forwardRequestToJavaDebugger(command: string, args: any): Promise<any> {
    if (!this.javaDebugSession) {
      throw new Error('Java debug session not available');
    }
    
    return this.javaDebugSession.sendRequest(command, args);
  }

  /**
   * Forward request to Java debugger (sync version)
   */
  private forwardToJavaDebugger(command: string, args: any, response: any): void {
    if (this.javaDebugSession) {
      this.javaDebugSession.sendRequest(command, args)
        .then((javaResponse: any) => {
          if (javaResponse.body) {
            response.body = javaResponse.body;
          }
          this.sendResponse(response);
        })
        .catch((error: any) => {
          response.success = false;
          response.message = error.message;
          this.sendResponse(response);
        });
    } else {
      this.sendResponse(response);
    }
  }

  /**
   * Find JSP file from servlet path
   */
  private findJspFileFromServletPath(servletPath: string): string | null {
    // Extract servlet class name from path
    const fileName = path.basename(servletPath, '.java');
    
    // Check our mappings
    for (const [servletClass, jspFile] of this.servletToJspMapping) {
      if (servletClass.endsWith(fileName)) {
        return jspFile;
      }
    }
    
    // Fallback: try to convert servlet name back to JSP
    return this.jspMapper.getJspFileFromServletClass('org.apache.jsp.' + fileName);
  }
}

// Entry point for the debug adapter
if (require.main === module) {
  DebugSession.run(JspDebugSession);
}