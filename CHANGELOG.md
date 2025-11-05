# Changelog

All notable changes to the JSP Glass extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024

### ✨ Initial Release

First stable release of JSP Glass - Debug JSP files on Apache Tomcat with accurate breakpoint mapping.

### Added

#### Features
- **SMAP-Based Line Mapping:** Extract Source Map from compiled servlet `.class` files using javap
- **Bidirectional Mapping:** JSP ↔ Servlet line number conversion
- **Transparent Debugging:** Debug JSP files directly (shows `.jsp` not `_jsp.java`)
- **Accurate Breakpoints:** Set breakpoints in JSP files that work correctly
- **Stack Frame Interception:** Automatically correct line numbers in debug sessions
- **Caching Strategy:** Cache SMAP data to avoid repeated javap executions
- **Debug Logging:** Detailed console output for troubleshooting
- **Remote Debugging Support:** Debug JSP on remote Tomcat servers
- **Multi-Module Projects:** Support for complex project structures

#### Configuration Options
- `jsp.tomcatWorkDirectory` - Path to Tomcat work directory
- `jsp.enableDebugLogging` - Enable verbose debug output

#### Documentation
- Comprehensive user guide (README.md)
- Detailed setup instructions (SETUP.md)
- Technical implementation details (IMPLEMENTATION.md)
- Quick reference guide (QUICK_REFERENCE.md)
- Project summary and disclaimer

### Requirements

#### System Requirements
- Visual Studio Code 1.74.0 or higher
- Java Development Kit (JDK) 8 or higher with javap
- Apache Tomcat 8.5 or higher (9.x recommended)

#### VS Code Extensions
- Language Support for Java™ by Red Hat (`redhat.java`)
- Debugger for Java (`vscjava.vscode-java-debug`)

#### Tomcat Configuration
- JPDA debugging enabled (port 8000)
- JSP servlet configured with `mappedfile=true`
- Recommended: `keepgenerated=true` and `development=true`

### Known Limitations

- Requires JSP to be accessed at least once to trigger compilation
- Requires javap in system PATH
- Supports Tomcat-generated SMAP format (not tested with other containers)
- Line mapping only works where SMAP data is available

### Compatibility

#### Tested With
- VS Code 1.74.0+
- Java 8, 11, 17, 21
- Apache Tomcat 8.5, 9.0, 10.0

#### Supported Platforms
- Windows 10/11
- Linux (Ubuntu, Fedora, etc.)
- macOS

### Security

- No external network requests
- Only reads from configured Tomcat work directory
- Executes javap (system JDK tool) with validated parameters
- No credentials or sensitive data stored

---

## Development History

### Phase 1: Initial Implementation
- Custom line mapping logic (replaced in later phases)
- Basic breakpoint conversion
- Debug adapter integration

### Phase 2: SMAP Integration
- Switched to javap-based SMAP extraction
- Implemented SMAP parser
- Added bidirectional mapping

### Phase 3: Stack Frame Correction
- Discovered debugger shows servlet files
- Implemented stack frame interception
- Added reverse mapping for line numbers

### Phase 4: Testing & Refinement
- User testing revealed line mapping issues
- Fixed SMAP range format parsing (`startLine,count:outputLine`)
- Corrected reverse mapping algorithm
- **Status:** User confirmed working! ✅

### Phase 5: Branding & Documentation
- Renamed to "JSP Glass"
- Publisher: "syntaxkraken"
- Created comprehensive documentation suite
- Added logo support

---

## Future Roadmap

### v1.1.0 (Planned)
- [ ] Hot reload detection (watch work directory for recompiled JSPs)
- [ ] Support for Jetty and WildFly
- [ ] Improved error messages with suggestions
- [ ] Configuration wizard for first-time setup

### v1.2.0 (Planned)
- [ ] Variable name mapping for JSTL variables
- [ ] Support for JSP fragments (`.jspf`)
- [ ] Multi-JSP debugging (include directives)
- [ ] Performance profiling for JSPs

### v2.0.0 (Future)
- [ ] Expression Language (EL) debugging support
- [ ] Step into taglib implementations
- [ ] JSP code completion and IntelliSense
- [ ] Integrated JSP syntax validation

---

## Contributing

Contributions are welcome! Please see the repository for contribution guidelines.

### Areas for Contribution
- Testing with different Tomcat versions
- Support for other JSP containers (Jetty, WildFly)
- Documentation improvements
- Bug reports and feature requests

---

## Acknowledgments

- **SMAP Specification:** Java Community Process (JCP) - JSR-045
- **Inspiration:** Eclipse WTP and IntelliJ IDEA JSP debugging
- **Technology:** VS Code Extension API and Debug Adapter Protocol
- **Testing:** Real-world JSP projects and user feedback

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Contact

- **Publisher:** syntaxkraken
- **Repository:** https://github.com/syntaxkraken/jsp-glass
- **Issues:** https://github.com/syntaxkraken/jsp-glass/issues

---

**JSP Glass** - Making JSP debugging transparent! 🔍✨
