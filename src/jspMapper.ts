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
   * Extract SMAP data from compiled .class file
   */
  private extractSmapFromClassFile(classFilePath: string, jspFilePath: string): Map<number, number> {
    const mapping = new Map<number, number>();
    
    try {
      console.log(`JSP Debug: Extracting SMAP from class file: ${classFilePath}`);
      
      // Read the .class file as binary data
      const classData = fs.readFileSync(classFilePath);
      
      // Look for SMAP attribute in the class file
      // SMAP data is stored as a SourceDebugExtension attribute
      const smapData = this.findSmapInClassFile(classData);
      
      if (smapData) {
        console.log(`JSP Debug: Found SMAP data in class file`);
        console.log(`JSP Debug: SMAP content preview: ${smapData.substring(0, 200)}...`);
        
        return this.parseSmapContent(smapData, path.basename(jspFilePath));
      } else {
        console.log(`JSP Debug: No SMAP data found in class file`);
      }
      
    } catch (error) {
      console.error(`JSP Debug: Error extracting SMAP from class file:`, error);
    }
    
    return mapping;
  }

  /**
   * Find SMAP data in compiled class file bytes
   */
  private findSmapInClassFile(classData: Buffer): string | null {
    try {
      // Convert to string to search for SMAP marker
      const classStr = classData.toString('latin1');
      
      // Look for SMAP section - it's usually marked with SMAP header
      const smapStart = classStr.indexOf('SMAP');
      if (smapStart === -1) {
        return null;
      }
      
      // Find the end marker *E*
      const smapEnd = classStr.indexOf('*E*', smapStart);
      if (smapEnd === -1) {
        return null;
      }
      
      // Extract SMAP content
      const smapContent = classStr.substring(smapStart, smapEnd + 3);
      return smapContent;
      
    } catch (error) {
      console.error(`JSP Debug: Error parsing class file for SMAP:`, error);
      return null;
    }
  }

  /**
   * Parse SMAP content and extract line mappings
   */
  private parseSmapContent(smapData: string, jspFileName: string): Map<number, number> {
    const mapping = new Map<number, number>();
    
    console.log(`JSP Debug: Parsing SMAP content for ${jspFileName}`);
    
    const lines = smapData.split(/\r?\n/);
    let inFileSection = false;
    let inLineSection = false;
    let currentFileId = '';
    let targetFileFound = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) continue;
      
      console.log(`JSP Debug: SMAP line ${i}: "${line}"`);
      
      // Section headers
      if (line === '*F') {
        inFileSection = true;
        inLineSection = false;
        console.log(`JSP Debug: Entering *F (File) section`);
        continue;
      }
      
      if (line === '*L') {
        inLineSection = true;
        inFileSection = false;
        console.log(`JSP Debug: Entering *L (Line) section`);
        continue;
      }
      
      if (line.startsWith('*') && line !== '*E*') {
        inFileSection = false;
        inLineSection = false;
        continue;
      }
      
      if (line === '*E*') {
        console.log(`JSP Debug: End of SMAP (*E*)`);
        break;
      }
      
      // Parse file section
      if (inFileSection) {
        // Format: "+ 0 index.jsp" or just "index.jsp"
        if (line.startsWith('+')) {
          const parts = line.substring(1).trim().split(' ');
          if (parts.length >= 2) {
            currentFileId = parts[0];
            const fileName = parts[1];
            targetFileFound = true;
            console.log(`JSP Debug: Found file mapping: ID=${currentFileId}, file=${fileName}`);
          }
        } else if (line.includes('.jsp')) {
          targetFileFound = true;
          console.log(`JSP Debug: Found JSP file reference: ${line}`);
        }
      }
      
      // Parse line section - CRITICAL FORMAT PARSING
      if (inLineSection && targetFileFound) {
        // SMAP line mapping formats:
        // "1,5:122" = JSP lines 1-5 (5 lines total) map to servlet line 122
        // "7,52:128" = JSP lines 7-58 (52 lines total) map to servlet line 128
        // "58,66:180" = JSP lines 58-123 (66 lines total) map to servlet line 180
        // "15:67" = JSP line 15 maps to servlet line 67
        // "124,4:246,3" = JSP lines 124-127 (4 lines) map to servlet lines 246+ with increment of 3
        
        const match = line.match(/^(\d+)(?:,(\d+))?:(\d+)(?:,(\d+))?$/);
        if (match) {
          const inputStartLine = parseInt(match[1]); // JSP start line
          const lineFileCount = match[2] ? parseInt(match[2]) : 1; // Number of JSP lines
          const outputStartLine = parseInt(match[3]); // Servlet start line
          const lineIncrement = match[4] ? parseInt(match[4]) : 1; // Servlet line increment
          
          console.log(`JSP Debug: SMAP mapping: JSP ${inputStartLine}${lineFileCount > 1 ? `,${lineFileCount}` : ''} -> Servlet ${outputStartLine}${lineIncrement > 1 ? `,${lineIncrement}` : ''}`);
          
          // Map each JSP line to corresponding servlet line
          for (let j = 0; j < lineFileCount; j++) {
            const jspLine = inputStartLine + j;
            const servletLine = outputStartLine + (j * lineIncrement);
            mapping.set(jspLine, servletLine);
            
            if (jspLine === 7) {
              console.log(`JSP Debug: 🎯 FOUND JSP LINE 7 -> Servlet line ${servletLine}`);
            }
          }
          
          console.log(`JSP Debug: Mapped JSP lines ${inputStartLine}-${inputStartLine + lineFileCount - 1} to servlet lines ${outputStartLine}-${outputStartLine + ((lineFileCount - 1) * lineIncrement)}`);
          continue;
        }
        
        // Alternative format with file ID: "15#1:67"
        const fileMatch = line.match(/^(\d+)#(\d+):(\d+)(?:,(\d+))?$/);
        if (fileMatch) {
          const jspLine = parseInt(fileMatch[1]);
          const fileId = fileMatch[2];
          const servletLine = parseInt(fileMatch[3]);
          const lineCount = fileMatch[4] ? parseInt(fileMatch[4]) : 1;
          
          if (fileId === currentFileId || !currentFileId) {
            for (let j = 0; j < lineCount; j++) {
              mapping.set(jspLine + j, servletLine + j);
            }
            console.log(`JSP Debug: SMAP file mapping: JSP ${jspLine} -> Servlet ${servletLine} (file ${fileId})`);
          }
        }
      }
    }
    
    console.log(`JSP Debug: Extracted ${mapping.size} line mappings from SMAP`);
    
    // Log specific mapping for JSP line 7
    if (mapping.has(7)) {
      console.log(`JSP Debug: ✅ JSP line 7 maps to servlet line ${mapping.get(7)}`);
    } else {
      console.log(`JSP Debug: ❌ No direct mapping found for JSP line 7`);
    }
    
    return mapping;
  }

  /**
   * Find closest mapping (helper method)
   */
  private findClosestMapping(mapping: Map<number, number>, targetLine: number): {jspLine: number, servletLine: number} | null {
    let closestJspLine = -1;
    let closestServletLine = -1;
    
    for (const [jspLine, servletLine] of mapping.entries()) {
      if (jspLine <= targetLine && jspLine > closestJspLine) {
        closestJspLine = jspLine;
        closestServletLine = servletLine;
      }
    }
    
    if (closestJspLine !== -1) {
      return { jspLine: closestJspLine, servletLine: closestServletLine };
    }
    
    return null;
  }

  /**
   * Map servlet line number back to JSP line number using javap SMAP extraction
   */
  public mapServletLineToJspLine(jspFilePath: string, servletLine: number): number | null {
    console.log(`JSP Debug: === JAVAP-BASED REVERSE MAPPING ===`);
    console.log(`JSP Debug: Servlet line: ${servletLine}`);
    console.log(`JSP Debug: JSP file: ${jspFilePath}`);

    const servletClassFile = this.getServletClassFilePath(jspFilePath);
    if (!servletClassFile || !fs.existsSync(servletClassFile)) {
      console.error(`JSP Debug: Servlet class file not found for reverse mapping`);
      return null;
    }

    try {
      // Extract SMAP using javap (like IDEs do)
      const smapMappings = this.extractSmapUsingJavap(servletClassFile, jspFilePath);
      
      if (smapMappings.size === 0) {
        console.warn(`JSP Debug: No javap SMAP, trying direct class file parsing`);
        const fallbackMappings = this.extractSmapFromClassFile(servletClassFile, jspFilePath);
        
        if (fallbackMappings.size === 0) {
          console.warn(`JSP Debug: No SMAP in class file, using Java source fallback`);
          return this.fallbackReverseMapping(jspFilePath, servletLine);
        }
        
        return this.findReverseMappedLine(fallbackMappings, servletLine);
      }

      console.log(`JSP Debug: Using ${smapMappings.size} javap SMAP mappings for reverse lookup`);

      return this.findReverseMappedLine(smapMappings, servletLine);

    } catch (error) {
      console.error(`JSP Debug: Error in javap reverse mapping:`, error);
      return this.fallbackReverseMapping(jspFilePath, servletLine);
    }
  }

  /**
   * Find JSP line from servlet line using SMAP data (exact match or interpolation)
   */
  private findReverseMappedLine(smapMappings: Map<number, number>, servletLine: number): number | null {
    console.log(`JSP Debug: === REVERSE MAPPING LOOKUP ===`);
    console.log(`JSP Debug: Looking for servlet line ${servletLine} in SMAP mappings`);
    
    // Build reverse mapping: Servlet -> JSP
    // IMPORTANT: SMAP has ranges like "7,52:128" meaning JSP 7-58 map to servlet 128 onwards
    // So we need to find which JSP line range contains our servlet line
    
    const reverseMappings = new Map<number, number>(); // Servlet -> JSP
    
    // Collect all JSP->Servlet mappings and log them
    const mappingList: Array<{jspLine: number, servletLine: number}> = [];
    for (const [jspLine, servletLineNum] of smapMappings.entries()) {
      mappingList.push({jspLine, servletLine: servletLineNum});
      reverseMappings.set(servletLineNum, jspLine);
    }
    
    // Sort by servlet line for better analysis
    mappingList.sort((a, b) => a.servletLine - b.servletLine);
    
    console.log(`JSP Debug: Available SMAP mappings (sorted by servlet line):`);
    mappingList.forEach(m => {
      console.log(`  JSP ${m.jspLine} -> Servlet ${m.servletLine}`);
    });

    // Check for exact reverse mapping
    if (reverseMappings.has(servletLine)) {
      const mappedJspLine = reverseMappings.get(servletLine)!;
      console.log(`JSP Debug: ✅ EXACT REVERSE - Servlet ${servletLine} -> JSP ${mappedJspLine}`);
      return mappedJspLine;
    }

    // Find the JSP line range that contains this servlet line
    // SMAP format: "7,52:128" means JSP 7-58 map to servlet starting at 128
    // So if servlet line is 130, it should map back to JSP line 9 (7 + (130-128))
    
    let foundJspLine: number | null = null;
    
    for (let i = 0; i < mappingList.length; i++) {
      const current = mappingList[i];
      const next = mappingList[i + 1];
      
      if (next) {
        // If servlet line is between current and next mapping
        if (servletLine >= current.servletLine && servletLine < next.servletLine) {
          const servletOffset = servletLine - current.servletLine;
          foundJspLine = current.jspLine + servletOffset;
          console.log(`JSP Debug: 🎯 FOUND IN RANGE - Servlet ${servletLine} is in range [${current.servletLine}, ${next.servletLine})`);
          console.log(`JSP Debug: JSP range starts at ${current.jspLine}, offset ${servletOffset} -> JSP line ${foundJspLine}`);
          break;
        }
      } else {
        // Last mapping - check if servlet line is after it
        if (servletLine >= current.servletLine) {
          const servletOffset = servletLine - current.servletLine;
          foundJspLine = current.jspLine + servletOffset;
          console.log(`JSP Debug: 🎯 AFTER LAST MAPPING - Servlet ${servletLine} is after ${current.servletLine}`);
          console.log(`JSP Debug: JSP starts at ${current.jspLine}, offset ${servletOffset} -> JSP line ${foundJspLine}`);
          break;
        }
      }
    }
    
    if (foundJspLine !== null) {
      return Math.max(1, foundJspLine);
    }

    console.error(`JSP Debug: ❌ No reverse mapping found for servlet line ${servletLine}`);
    return null;
  }

  /**
   * Fallback reverse mapping using Java source comments
   */
  private fallbackReverseMapping(jspFilePath: string, servletLine: number): number | null {
    console.log(`JSP Debug: === FALLBACK REVERSE MAPPING ===`);
    
    const servletJavaFile = this.getServletSourceFilePath(jspFilePath);
    if (!servletJavaFile || !fs.existsSync(servletJavaFile)) {
      console.error(`JSP Debug: Servlet Java file not found for fallback reverse mapping`);
      return null;
    }

    try {
      const servletContent = fs.readFileSync(servletJavaFile, 'utf8');
      const lines = servletContent.split('\n');
      
      // Build reverse mappings from Java source comments
      const reverseMappings = new Map<number, number>(); // Servlet -> JSP

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const servletLineNumber = i + 1;
        
        // Look for standard Tomcat line mapping format
        const match = line.match(/\/\/line\s+(\d+)\s+"[^"]*\.jsp"/i);
        if (match) {
          const jspLineNumber = parseInt(match[1]);
          reverseMappings.set(servletLineNumber, jspLineNumber);
        }
      }

      if (reverseMappings.has(servletLine)) {
        const mappedJspLine = reverseMappings.get(servletLine)!;
        console.log(`JSP Debug: ✅ EXACT FALLBACK REVERSE MAPPING - Servlet line ${servletLine} -> JSP line ${mappedJspLine}`);
        return mappedJspLine;
      }

      // Find closest mapping
      let closestServletLine = -1;
      let closestJspLine = -1;
      
      for (const [servletLineNum, jspLineNum] of reverseMappings.entries()) {
        if (servletLineNum <= servletLine && servletLineNum > closestServletLine) {
          closestServletLine = servletLineNum;
          closestJspLine = jspLineNum;
        }
      }

      if (closestServletLine !== -1) {
        console.log(`JSP Debug: ⚠️ FALLBACK REVERSE APPROXIMATION - Servlet line ${servletLine} -> JSP line ${closestJspLine}`);
        return closestJspLine;
      }

      console.error(`JSP Debug: ❌ NO FALLBACK REVERSE MAPPING FOUND`);
      return null;

    } catch (error) {
      console.error(`JSP Debug: Error in fallback reverse mapping:`, error);
      return null;
    }
  }

  /**
   * Find closest reverse mapping
   */
  private findClosestReverseMapping(reverseMapping: Map<number, number>, targetServletLine: number): {servletLine: number, jspLine: number} | null {
    let closestServletLine = -1;
    let closestJspLine = -1;
    
    for (const [servletLine, jspLine] of reverseMapping.entries()) {
      if (servletLine <= targetServletLine && servletLine > closestServletLine) {
        closestServletLine = servletLine;
        closestJspLine = jspLine;
      }
    }
    
    if (closestServletLine !== -1) {
      return { servletLine: closestServletLine, jspLine: closestJspLine };
    }
    
    return null;
  }

  /**
   * Analyze servlet file around a specific line to understand the mapping
   */
  public analyzeServletLineContext(jspFilePath: string, targetJspLine: number, actualServletLine: number, expectedServletLine: number): void {
    console.log(`JSP Debug: === LINE ANALYSIS ===`);
    console.log(`JSP Debug: JSP Line: ${targetJspLine}`);
    console.log(`JSP Debug: Expected Servlet Line: ${expectedServletLine}`);
    console.log(`JSP Debug: Actual Servlet Line: ${actualServletLine}`);
    
    const servletJavaFile = this.getServletSourceFilePath(jspFilePath);
    if (!servletJavaFile || !fs.existsSync(servletJavaFile)) {
      console.error(`JSP Debug: Cannot analyze - servlet file not found`);
      return;
    }

    try {
      const servletContent = fs.readFileSync(servletJavaFile, 'utf8');
      const lines = servletContent.split('\n');
      
      console.log(`JSP Debug: Servlet context around actual line ${actualServletLine}:`);
      const startLine = Math.max(0, actualServletLine - 6);
      const endLine = Math.min(lines.length - 1, actualServletLine + 5);
      
      for (let i = startLine; i <= endLine; i++) {
        const lineNum = i + 1;
        const marker = lineNum === actualServletLine ? ' >>> ' : '     ';
        console.log(`${marker}${lineNum}: ${lines[i]}`);
      }
      
      console.log(`JSP Debug: Servlet context around expected line ${expectedServletLine}:`);
      const startLine2 = Math.max(0, expectedServletLine - 6);
      const endLine2 = Math.min(lines.length - 1, expectedServletLine + 5);
      
      for (let i = startLine2; i <= endLine2; i++) {
        const lineNum = i + 1;
        const marker = lineNum === expectedServletLine ? ' >>> ' : '     ';
        console.log(`${marker}${lineNum}: ${lines[i]}`);
      }
      
      // Look for line mappings around both areas
      console.log(`JSP Debug: Line mappings near actual line ${actualServletLine}:`);
      const searchStart = Math.max(0, actualServletLine - 20);
      const searchEnd = Math.min(lines.length - 1, actualServletLine + 20);
      
      for (let i = searchStart; i <= searchEnd; i++) {
        const line = lines[i];
        if (line.includes('.jsp') && line.includes('//line')) {
          console.log(`  Line ${i + 1}: ${line.trim()}`);
        }
      }
      
    } catch (error) {
      console.error(`JSP Debug: Error analyzing servlet context:`, error);
    }
  }

  /**
   * Test and debug servlet file content - call this to see what's actually in the file
   */
  public debugServletFile(jspFilePath: string): void {
    console.log(`JSP Debug: === SERVLET FILE DEBUG ===`);
    
    const servletJavaFile = this.getServletSourceFilePath(jspFilePath);
    if (!servletJavaFile) {
      console.error(`JSP Debug: No servlet file path found for: ${jspFilePath}`);
      return;
    }

    console.log(`JSP Debug: Servlet file path: ${servletJavaFile}`);
    console.log(`JSP Debug: File exists: ${fs.existsSync(servletJavaFile)}`);

    if (!fs.existsSync(servletJavaFile)) {
      console.error(`JSP Debug: Servlet file does not exist!`);
      
      // Check the directory
      const dir = path.dirname(servletJavaFile);
      console.log(`JSP Debug: Checking directory: ${dir}`);
      console.log(`JSP Debug: Directory exists: ${fs.existsSync(dir)}`);
      
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        console.log(`JSP Debug: Files in directory:`, files);
      }
      return;
    }

    try {
      const content = fs.readFileSync(servletJavaFile, 'utf8');
      const lines = content.split('\n');
      
      console.log(`JSP Debug: File size: ${content.length} characters`);
      console.log(`JSP Debug: Line count: ${lines.length}`);
      
      console.log(`JSP Debug: First 20 lines:`);
      for (let i = 0; i < Math.min(20, lines.length); i++) {
        console.log(`  ${i + 1}: ${lines[i]}`);
      }
      
      console.log(`JSP Debug: Lines containing 'jsp':`);
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes('jsp')) {
          console.log(`  Line ${index + 1}: ${line.trim()}`);
        }
      });
      
      console.log(`JSP Debug: Lines containing '//' comments:`);
      lines.forEach((line, index) => {
        if (line.includes('//')) {
          console.log(`  Line ${index + 1}: ${line.trim()}`);
        }
      });
      
    } catch (error) {
      console.error(`JSP Debug: Error reading servlet file:`, error);
    }
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
   * Map JSP line number to servlet line number using javap to extract SMAP like IDEs do
   */
  public mapJspLineToServletLine(jspFilePath: string, jspLine: number): number | null {
    console.log(`JSP Debug: === JAVAP-BASED SMAP EXTRACTION ===`);
    console.log(`JSP Debug: JSP File: ${jspFilePath}`);
    console.log(`JSP Debug: JSP Line: ${jspLine}`);

    // Step 1: Get the compiled servlet class file (.class)
    const servletClassFile = this.getServletClassFilePath(jspFilePath);
    if (!servletClassFile || !fs.existsSync(servletClassFile)) {
      console.error(`JSP Debug: Servlet class file not found: ${servletClassFile}`);
      return null;
    }

    console.log(`JSP Debug: Servlet class file: ${servletClassFile}`);

    try {
      // Step 2: Use javap to extract SMAP (like Eclipse/IntelliJ do)
      const smapMappings = this.extractSmapUsingJavap(servletClassFile, jspFilePath);
      
      if (smapMappings.size === 0) {
        console.warn(`JSP Debug: No SMAP mappings from javap, trying direct class file parsing`);
        const fallbackMappings = this.extractSmapFromClassFile(servletClassFile, jspFilePath);
        
        if (fallbackMappings.size === 0) {
          console.warn(`JSP Debug: No SMAP in class file, using Java source comments`);
          return this.fallbackToJavaSourceMapping(jspFilePath, jspLine);
        }
        
        return this.findMappedLine(fallbackMappings, jspLine);
      }

      console.log(`JSP Debug: Extracted ${smapMappings.size} SMAP mappings from javap`);

      // Step 3: Use the SMAP mappings to find the servlet line
      return this.findMappedLine(smapMappings, jspLine);

    } catch (error) {
      console.error(`JSP Debug: Error in SMAP extraction:`, error);
      return this.fallbackToJavaSourceMapping(jspFilePath, jspLine);
    }
  }

  /**
   * Extract SMAP using javap command (like Eclipse and IntelliJ do)
   */
  private extractSmapUsingJavap(classFilePath: string, jspFilePath: string): Map<number, number> {
    const mapping = new Map<number, number>();
    
    try {
      console.log(`JSP Debug: Running javap -v to extract SMAP from: ${classFilePath}`);
      
      // Run javap -v to get verbose output including SMAP (SourceDebugExtension)
      const { execSync } = require('child_process');
      
      // Use javap -v to get SMAP data
      const javapOutput = execSync(`javap -v "${classFilePath}"`, { 
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      console.log(`JSP Debug: javap -v output received (${javapOutput.length} bytes)`);
      
      // Extract SMAP section from javap verbose output
      return this.extractSmapFromJavapOutput(javapOutput, path.basename(jspFilePath));
      
    } catch (error: any) {
      console.error(`JSP Debug: Error running javap -v:`, error.message);
      console.log(`JSP Debug: Make sure Java JDK is installed and javap is in PATH`);
      
      // Fallback: try to extract SMAP directly from class file
      console.log(`JSP Debug: Falling back to direct SMAP extraction from class file`);
      return this.extractSmapFromClassFile(classFilePath, jspFilePath);
    }
  }

  /**
   * Extract SMAP from javap -v output
   */
  private extractSmapFromJavapOutput(javapOutput: string, jspFileName: string): Map<number, number> {
    const mapping = new Map<number, number>();
    
    console.log(`JSP Debug: Extracting SMAP from javap -v output for ${jspFileName}`);
    
    // Look for SourceDebugExtension which contains SMAP data
    // Format in javap -v output:
    //   SourceDebugExtension:
    //     SMAP
    //     filename.jsp
    //     JSP
    //     *S JSP
    //     *F
    //     + 0 filename.jsp
    //     *L
    //     1:52
    //     ...
    //     *E
    
    const smapMatch = javapOutput.match(/SourceDebugExtension:\s*\n([\s\S]*?)(?=\n\S|\n*$)/);
    
    if (!smapMatch) {
      console.log(`JSP Debug: No SourceDebugExtension found in javap output`);
      console.log(`JSP Debug: Checking first 500 chars of output: ${javapOutput.substring(0, 500)}`);
      return mapping;
    }
    
    console.log(`JSP Debug: Found SourceDebugExtension in javap output`);
    const smapData = smapMatch[1];
    
    console.log(`JSP Debug: SMAP data preview (first 300 chars):`);
    console.log(smapData.substring(0, 300));
    
    // Parse the SMAP content
    return this.parseSmapContent(smapData, jspFileName);
  }

  /**
   * Find mapped servlet line from SMAP data (exact match or interpolation)
   */
  private findMappedLine(smapMappings: Map<number, number>, jspLine: number): number | null {
    // Check for exact mapping
    if (smapMappings.has(jspLine)) {
      const mappedLine = smapMappings.get(jspLine)!;
      console.log(`JSP Debug: ✅ EXACT SMAP MAPPING - JSP line ${jspLine} -> Servlet line ${mappedLine}`);
      return mappedLine;
    }

    // Find bracketing mappings for interpolation
    let previousJspLine = -1;
    let previousServletLine = -1;
    let nextJspLine = Infinity;
    let nextServletLine = -1;

    for (const [jspLineNum, servletLineNum] of smapMappings.entries()) {
      if (jspLineNum <= jspLine && jspLineNum > previousJspLine) {
        previousJspLine = jspLineNum;
        previousServletLine = servletLineNum;
      }
      
      if (jspLineNum >= jspLine && jspLineNum < nextJspLine) {
        nextJspLine = jspLineNum;
        nextServletLine = servletLineNum;
      }
    }

    // Interpolate between known mappings
    if (previousJspLine !== -1 && nextJspLine !== Infinity && nextJspLine !== previousJspLine) {
      const jspRange = nextJspLine - previousJspLine;
      const servletRange = nextServletLine - previousServletLine;
      const jspOffset = jspLine - previousJspLine;
      
      const ratio = jspOffset / jspRange;
      const interpolatedLine = previousServletLine + Math.round(ratio * servletRange);
      
      console.log(`JSP Debug: 🎯 INTERPOLATED - JSP ${jspLine} -> Servlet ${interpolatedLine}`);
      console.log(`JSP Debug: Based on JSP ${previousJspLine}-${nextJspLine} → Servlet ${previousServletLine}-${nextServletLine}`);
      
      return interpolatedLine;
    }

    // Use closest mapping with 1:1 offset (safest fallback)
    if (previousJspLine !== -1) {
      const offset = jspLine - previousJspLine;
      const estimatedLine = previousServletLine + offset;
      console.log(`JSP Debug: ⚠️ OFFSET - JSP ${jspLine} -> Servlet ${estimatedLine} (offset ${offset})`);
      return estimatedLine;
    }

    console.error(`JSP Debug: ❌ No mapping found for JSP line ${jspLine}`);
    return null;
  }

  /**
   * Fallback to Java source file parsing when SMAP is not available
   */
  private fallbackToJavaSourceMapping(jspFilePath: string, jspLine: number): number | null {
    console.log(`JSP Debug: === FALLBACK TO JAVA SOURCE PARSING ===`);
    
    const servletJavaFile = this.getServletSourceFilePath(jspFilePath);
    if (!servletJavaFile || !fs.existsSync(servletJavaFile)) {
      console.error(`JSP Debug: Servlet Java file not found: ${servletJavaFile}`);
      return null;
    }

    try {
      const servletContent = fs.readFileSync(servletJavaFile, 'utf8');
      const lines = servletContent.split('\n');
      
      console.log(`JSP Debug: Parsing Java source file with ${lines.length} lines`);

      // Parse line mapping comments from Java source
      const mappings = new Map<number, number>();
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const servletLineNumber = i + 1;
        
        // Look for standard Tomcat line mapping format: //line X "file.jsp"
        const match = line.match(/\/\/line\s+(\d+)\s+"[^"]*\.jsp"/i);
        if (match) {
          const jspLineNumber = parseInt(match[1]);
          mappings.set(jspLineNumber, servletLineNumber);
          console.log(`JSP Debug: Java source mapping - JSP line ${jspLineNumber} -> Servlet line ${servletLineNumber}`);
        }
      }

      if (mappings.has(jspLine)) {
        const mappedLine = mappings.get(jspLine)!;
        console.log(`JSP Debug: ✅ EXACT JAVA SOURCE MAPPING - JSP line ${jspLine} -> Servlet line ${mappedLine}`);
        return mappedLine;
      }

      // Simple estimation if no exact mapping found
      console.warn(`JSP Debug: No exact mapping found, using estimation`);
      return Math.max(50, jspLine * 3);

    } catch (error) {
      console.error(`JSP Debug: Error in fallback mapping:`, error);
      return null;
    }
  }

  /**
   * Build exact mapping from servlet line comments
   */
  private buildExactMapping(servletLines: string[], jspFileName: string): Map<number, number> {
    const mapping = new Map<number, number>();
    
    console.log(`JSP Debug: Building exact mapping for ${jspFileName}`);
    
    for (let servletLineIndex = 0; servletLineIndex < servletLines.length; servletLineIndex++) {
      const line = servletLines[servletLineIndex].trim();
      const servletLineNumber = servletLineIndex + 1;
      
      // Parse Tomcat's standard line mapping format: //line X "filename.jsp"
      const match = line.match(/^\/\/line\s+(\d+)\s+"([^"]*\.jsp)"/i);
      if (match) {
        const jspLineNumber = parseInt(match[1], 10);
        const fileName = match[2];
        
        // Only map if this is the JSP file we're interested in
        if (fileName === jspFileName || fileName.endsWith(`/${jspFileName}`) || fileName.includes(jspFileName)) {
          mapping.set(jspLineNumber, servletLineNumber);
          console.log(`JSP Debug: Found exact mapping: JSP line ${jspLineNumber} -> Servlet line ${servletLineNumber} (from: ${line})`);
        }
      }
    }
    
    return mapping;
  }

  /**
   * Find the closest previous mapping for estimation
   */
  private findPreviousMapping(mapping: Map<number, number>, targetJspLine: number): {jspLine: number, servletLine: number} | null {
    let closestJspLine = -1;
    let closestServletLine = -1;
    
    for (const [jspLine, servletLine] of mapping.entries()) {
      if (jspLine <= targetJspLine && jspLine > closestJspLine) {
        closestJspLine = jspLine;
        closestServletLine = servletLine;
      }
    }
    
    if (closestJspLine !== -1) {
      return { jspLine: closestJspLine, servletLine: closestServletLine };
    }
    
    return null;
  }

  /**
   * Estimate servlet line based on servlet structure when no mapping available
   */
  private estimateServletLine(servletContent: string, jspLine: number): number | null {
    const lines = servletContent.split('\n');
    
    // Find _jspService method
    let serviceStart = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('_jspService') && lines[i].includes('(')) {
        serviceStart = i;
        break;
      }
    }
    
    if (serviceStart === -1) {
      // Fallback: assume content starts after class declaration
      return Math.min(50 + jspLine * 2, lines.length);
    }
    
    // Estimate position within service method
    return serviceStart + 10 + (jspLine * 3); // Rough estimate
  }

  /**
   * Find closest line mapping for JSP line
   */
  private findClosestLineMapping(lineMapping: Map<number, number>, targetJspLine: number): {jspLine: number, servletLine: number} | null {
    let closestJspLine = -1;
    let closestServletLine = -1;
    let minDistance = Infinity;
    
    for (const [jspLine, servletLine] of lineMapping.entries()) {
      const distance = Math.abs(jspLine - targetJspLine);
      if (distance < minDistance && jspLine <= targetJspLine) {
        minDistance = distance;
        closestJspLine = jspLine;
        closestServletLine = servletLine;
      }
    }
    
    if (closestJspLine !== -1) {
      // Estimate the servlet line by adding the offset
      const offset = targetJspLine - closestJspLine;
      return {
        jspLine: targetJspLine,
        servletLine: closestServletLine + offset
      };
    }
    
    return null;
  }

  /**
   * Parse line mapping information from servlet source
   */
  private parseLineMapping(servletContent: string, jspFilePath?: string): Map<number, number> {
    const lineMappings = new Map<number, number>();
    
    console.log(`JSP Debug: Parsing line mappings for ${jspFilePath || 'unknown JSP'}`);
    
    const lines = servletContent.split('\n');
    let mappingCount = 0;
    
    // First, let's dump some sample lines to understand the format
    const sampleLines = lines.slice(0, 50).filter(line => 
      line.includes('//') || line.includes('/*') || line.includes('line') || line.includes('Line')
    );
    console.log(`JSP Debug: Sample comment lines from servlet:`, sampleLines);
    
    lines.forEach((line, servletLineNumber) => {
      // More comprehensive regex patterns to match actual Tomcat output
      let match;
      
      // Pattern 1: Standard Tomcat format: "      //line 15 \"index.jsp\""
      match = line.match(/^\s*\/\/line\s+(\d+)\s+"([^"]*\.jsp)"/i);
      if (match) {
        const jspLineNumber = parseInt(match[1]);
        const jspFile = match[2];
        
        // Only map if this is the JSP file we're interested in
        if (!jspFilePath || jspFile.includes(path.basename(jspFilePath))) {
          lineMappings.set(jspLineNumber, servletLineNumber + 1);
          mappingCount++;
          console.log(`JSP Debug: Found mapping comment: JSP line ${jspLineNumber} -> servlet line ${servletLineNumber + 1}`);
        }
        return;
      }
      
      // Pattern 2: Alternative format: "// Line 15, JSP file: /index.jsp"
      match = line.match(/^\s*\/\/\s*Line\s+(\d+),\s*JSP\s*file:\s*([^\s]+\.jsp)/i);
      if (match) {
        const jspLineNumber = parseInt(match[1]);
        const jspFile = match[2];
        
        if (!jspFilePath || jspFile.includes(path.basename(jspFilePath))) {
          lineMappings.set(jspLineNumber, servletLineNumber + 1);
          mappingCount++;
          console.log(`JSP Debug: Found mapping comment: JSP line ${jspLineNumber} -> servlet line ${servletLineNumber + 1}`);
        }
        return;
      }
      
      // Pattern 3: Block comment format: "/* Line 15, file: index.jsp */"
      match = line.match(/^\s*\/\*\s*Line\s+(\d+),\s*file:\s*([^\s]+\.jsp)\s*\*\//i);
      if (match) {
        const jspLineNumber = parseInt(match[1]);
        const jspFile = match[2];
        
        if (!jspFilePath || jspFile.includes(path.basename(jspFilePath))) {
          lineMappings.set(jspLineNumber, servletLineNumber + 1);
          mappingCount++;
          console.log(`JSP Debug: Found mapping comment: JSP line ${jspLineNumber} -> servlet line ${servletLineNumber + 1}`);
        }
        return;
      }
      
      // Pattern 4: Inline comment with line reference
      match = line.match(/\/\/.*line\s*(\d+)/i);
      if (match && line.includes('.jsp')) {
        const jspLineNumber = parseInt(match[1]);
        lineMappings.set(jspLineNumber, servletLineNumber + 1);
        mappingCount++;
        console.log(`JSP Debug: Found inline mapping: JSP line ${jspLineNumber} -> servlet line ${servletLineNumber + 1}`);
        return;
      }
    });
    
    console.log(`JSP Debug: Found ${mappingCount} line mappings from comments`);
    
    // If we found some mappings, enhance them with interpolation
    if (mappingCount > 0) {
      console.log(`JSP Debug: Enhancing mappings with interpolation`);
      const enhancedMappings = this.enhanceLineMappings(lineMappings, servletContent);
      console.log(`JSP Debug: Enhanced to ${enhancedMappings.size} total mappings`);
      return enhancedMappings;
    }
    
    // Method 2: If no comment-based mappings found, try SMAP parsing
    console.log(`JSP Debug: No comment mappings found, trying SMAP parsing`);
    const smapMappings = this.parseSmapData(servletContent);
    if (smapMappings.size > 0) {
      console.log(`JSP Debug: Found ${smapMappings.size} SMAP mappings`);
      return smapMappings;
    }
    
    // Method 3: Create intelligent heuristic mapping based on servlet structure
    console.warn(`JSP Debug: No line mappings found, creating intelligent heuristic mapping`);
    return this.createHeuristicMapping(servletContent, jspFilePath);
  }

  /**
   * Parse SMAP (Source Map) data from servlet
   */
  private parseSmapData(servletContent: string): Map<number, number> {
    const mappings = new Map<number, number>();
    
    console.log(`JSP Debug: Looking for SMAP data in servlet`);
    
    // Look for SMAP section in the servlet file or class file
    let smapMatch = servletContent.match(/SMAP\s*\n([\s\S]*?)\*E\*/);
    
    if (!smapMatch) {
      // Try alternative SMAP format
      smapMatch = servletContent.match(/\/\*\s*SMAP\s*\n([\s\S]*?)\*E\*\s*\*\//);
    }
    
    if (!smapMatch) {
      console.log(`JSP Debug: No SMAP data found in servlet`);
      return mappings;
    }
    
    console.log(`JSP Debug: Found SMAP data`);
    const smapData = smapMatch[1];
    const lines = smapData.split('\n');
    
    let inLineSection = false;
    let inFileSection = false;
    let currentFileId = '';
    let fileName = '';
    
    for (const line of lines.map(l => l.trim())) {
      if (!line) continue;
      
      console.log(`JSP Debug: Processing SMAP line: ${line}`);
      
      // Section markers
      if (line.startsWith('*F')) {
        inFileSection = true;
        inLineSection = false;
        continue;
      }
      
      if (line.startsWith('*L')) {
        inLineSection = true;
        inFileSection = false;
        continue;
      }
      
      if (line.startsWith('*')) {
        inFileSection = false;
        inLineSection = false;
        continue;
      }
      
      // Parse file section
      if (inFileSection) {
        if (line.includes('.jsp')) {
          const parts = line.split(' ');
          if (parts.length >= 2) {
            currentFileId = parts[0];
            fileName = parts[1];
            console.log(`JSP Debug: Found file mapping: ${currentFileId} -> ${fileName}`);
          }
        }
      }
      
      // Parse line section
      if (inLineSection && fileName.includes('.jsp')) {
        // Multiple SMAP line formats:
        // Format 1: "jspLine:servletLine"
        let match = line.match(/^(\d+):(\d+)$/);
        if (match) {
          const jspLine = parseInt(match[1]);
          const servletLine = parseInt(match[2]);
          mappings.set(jspLine, servletLine);
          console.log(`JSP Debug: SMAP mapping: JSP ${jspLine} -> Servlet ${servletLine}`);
          continue;
        }
        
        // Format 2: "jspLine:servletLine,lineCount"
        match = line.match(/^(\d+):(\d+),(\d+)$/);
        if (match) {
          const jspLine = parseInt(match[1]);
          const servletLine = parseInt(match[2]);
          const lineCount = parseInt(match[3]);
          
          for (let i = 0; i < lineCount; i++) {
            mappings.set(jspLine + i, servletLine + i);
          }
          console.log(`JSP Debug: SMAP range mapping: JSP ${jspLine}+${lineCount} -> Servlet ${servletLine}+${lineCount}`);
          continue;
        }
        
        // Format 3: "jspStart#servletStart,jspCount:servletLine,servletCount"
        match = line.match(/^(\d+)#(\d+)(?:,(\d+))?:(\d+)(?:,(\d+))?$/);
        if (match) {
          const jspStartLine = parseInt(match[1]);
          const servletStartLine = parseInt(match[2]);
          const jspLineCount = match[3] ? parseInt(match[3]) : 1;
          const outputServletLine = parseInt(match[4]);
          const servletLineCount = match[5] ? parseInt(match[5]) : 1;
          
          // Map each JSP line to corresponding servlet line
          for (let i = 0; i < jspLineCount; i++) {
            const jspLine = jspStartLine + i;
            const servletLine = outputServletLine + Math.floor(i * servletLineCount / jspLineCount);
            mappings.set(jspLine, servletLine);
          }
          console.log(`JSP Debug: SMAP complex mapping: JSP ${jspStartLine}+${jspLineCount} -> Servlet ${outputServletLine}+${servletLineCount}`);
        }
      }
    }
    
    console.log(`JSP Debug: Parsed ${mappings.size} SMAP line mappings`);
    return mappings;
  }

  /**
   * Find the first line in servlet that contains actual JSP code
   */
  private findFirstJspCodeLine(servletContent: string): number {
    const lines = servletContent.split('\n');
    
    // Look for common servlet patterns that indicate JSP code starts
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for the _jspService method or similar
      if (line.includes('_jspService') || 
          line.includes('out.write') || 
          line.includes('pageContext') ||
          line.includes('JspWriter')) {
        return i + 1;
      }
    }
    
    // Default fallback
    return 50; // Most servlet boilerplate is in first 50 lines
  }

  /**
   * Enhance line mappings by interpolating between known mappings
   */
  private enhanceLineMappings(lineMappings: Map<number, number>, servletContent: string): Map<number, number> {
    const enhanced = new Map<number, number>(lineMappings);
    
    // Get sorted arrays of JSP and servlet lines
    const mappingPairs = Array.from(lineMappings.entries()).sort((a, b) => a[0] - b[0]);
    
    console.log(`JSP Debug: Enhancing mappings between ${mappingPairs.length} known points`);
    
    // Fill in gaps between known mappings with linear interpolation
    for (let i = 0; i < mappingPairs.length - 1; i++) {
      const [jspStart, servletStart] = mappingPairs[i];
      const [jspEnd, servletEnd] = mappingPairs[i + 1];
      
      const jspGap = jspEnd - jspStart;
      const servletGap = servletEnd - servletStart;
      
      // Only interpolate if the gap is reasonable (not too large)
      if (jspGap > 1 && jspGap <= 20 && servletGap > 0) {
        const ratio = servletGap / jspGap;
        
        for (let j = 1; j < jspGap; j++) {
          const interpolatedJspLine = jspStart + j;
          const interpolatedServletLine = Math.round(servletStart + (j * ratio));
          
          if (!enhanced.has(interpolatedJspLine)) {
            enhanced.set(interpolatedJspLine, interpolatedServletLine);
          }
        }
      }
    }
    
    return enhanced;
  }

  /**
   * Create intelligent heuristic mapping based on servlet structure
   */
  private createHeuristicMapping(servletContent: string, jspFilePath?: string): Map<number, number> {
    const mappings = new Map<number, number>();
    const lines = servletContent.split('\n');
    
    console.log(`JSP Debug: Creating heuristic mapping for servlet with ${lines.length} lines`);
    
    // Find the main service method where JSP content is likely to be
    let serviceMethodStart = -1;
    let serviceMethodEnd = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Look for the _jspService method
      if (line.includes('_jspService') && line.includes('(')) {
        serviceMethodStart = i;
        console.log(`JSP Debug: Found _jspService method at line ${i + 1}`);
        
        // Find the end of this method
        let braceCount = 0;
        for (let j = i; j < lines.length; j++) {
          const methodLine = lines[j];
          braceCount += (methodLine.match(/{/g) || []).length;
          braceCount -= (methodLine.match(/}/g) || []).length;
          
          if (braceCount === 0 && j > i) {
            serviceMethodEnd = j;
            break;
          }
        }
        break;
      }
    }
    
    if (serviceMethodStart === -1) {
      console.warn(`JSP Debug: Could not find _jspService method, using basic mapping`);
      // Fallback: assume JSP content starts after imports and class declaration
      const basicStart = Math.min(50, Math.floor(lines.length * 0.2));
      mappings.set(1, basicStart);
      return mappings;
    }
    
    console.log(`JSP Debug: _jspService method spans lines ${serviceMethodStart + 1} to ${serviceMethodEnd + 1}`);
    
    // Create mappings within the service method
    const methodLines = serviceMethodEnd - serviceMethodStart;
    const estimatedJspLines = Math.max(1, Math.floor(methodLines / 3)); // Rough estimate
    
    // Create basic linear mapping within the service method
    for (let jspLine = 1; jspLine <= estimatedJspLines; jspLine++) {
      const ratio = (jspLine - 1) / Math.max(1, estimatedJspLines - 1);
      const servletLine = serviceMethodStart + Math.floor(ratio * methodLines) + 1;
      mappings.set(jspLine, servletLine);
    }
    
    console.log(`JSP Debug: Created heuristic mapping for ${estimatedJspLines} JSP lines`);
    
    return mappings;
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