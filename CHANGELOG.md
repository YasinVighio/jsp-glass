# CHANGELOG

All notable changes to the JSP Debug extension will be documented in this file.

## [1.0.0] - 2025-11-06

### Added
- Initial release of JSP Debug extension for VS Code
- Direct JSP file debugging support with breakpoints
- Automatic mapping of JSP files to compiled servlet classes
- Integration with VS Code's Java debug adapter
- Configuration management via workspace `config.json`
- Support for Apache Tomcat JPDA debugging
- Diagnostic commands:
  - `JSP: Show Compiled Servlet Path`
  - `JSP: Validate Setup`
- Support for common Java web project structures:
  - Maven standard layout (`src/main/webapp`)
  - Eclipse Dynamic Web Projects (`WebContent`)
  - Custom webapp directories
- Automatic servlet class discovery in Tomcat work directory
- Breakpoint validation and servlet mapping
- Real-time configuration reloading
- Welcome messages and setup guidance

### Features
- **JSP Breakpoint Support**: Set breakpoints directly in `.jsp` files
- **Servlet Mapping**: Automatic mapping between JSP and compiled servlet classes  
- **Tomcat Integration**: Seamless integration with Tomcat's JPDA debugging
- **Multi-Context Support**: Support for different webapp contexts
- **Path Resolution**: Intelligent resolution of JSP paths in various project structures
- **Error Handling**: Comprehensive error messages and troubleshooting guidance

### Technical Details
- Built with TypeScript for VS Code extension API
- Leverages VS Code Debug Adapter Protocol (DAP)
- Integrates with existing Java debug infrastructure
- Modular architecture with separate concerns:
  - Configuration management
  - JSP-to-servlet mapping
  - Debug session handling
  - Breakpoint management

### Supported Platforms
- Windows
- Linux  
- macOS

### Requirements
- VS Code 1.74.0 or higher
- Java Extension Pack (includes Java Debug)
- Apache Tomcat with JPDA debugging enabled