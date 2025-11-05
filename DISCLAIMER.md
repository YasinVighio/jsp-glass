# Disclaimer

## ⚠️ Beta Software Notice

**JSP Glass** is currently in its initial release phase. While the extension has been tested and confirmed working by users, please be aware of the following:

### Known Considerations

1. **Potential Bugs**
   - This is version 1.0.0 and may contain undiscovered bugs
   - Edge cases in complex JSP scenarios may not be fully handled
   - Not all JSP/Servlet container configurations have been tested

2. **Testing Scope**
   - Primary testing has been with Apache Tomcat 9.x
   - Limited testing with other Tomcat versions (8.5, 10.x)
   - Not tested with other servlet containers (Jetty, WildFly, etc.)

3. **Performance**
   - Performance characteristics have not been formally benchmarked
   - No claims are made about execution speed or resource usage
   - Large-scale JSP applications may experience different behavior

4. **Compatibility**
   - Primarily tested on Windows and Linux environments
   - macOS compatibility assumed but not extensively verified
   - Various Java versions (8, 11, 17, 21) supported in theory

### Use at Your Own Risk

By using JSP Glass, you acknowledge that:

- **No Warranty**: This software is provided "AS IS" without warranty of any kind, express or implied
- **No Liability**: The authors are not responsible for any data loss, debugging issues, or project complications
- **Development Status**: This is an early-stage extension under active development
- **Breaking Changes**: Future versions may introduce breaking changes

### Backup Recommendations

Before using JSP Glass in critical projects:

1. ✅ **Commit your code** to version control (Git)
2. ✅ **Test in development** environment first (not production)
3. ✅ **Backup Tomcat configuration** before making changes
4. ✅ **Review generated files** if the extension creates or modifies files

### Reporting Issues

If you encounter bugs or issues:

1. **Check existing documentation** (README.md, SETUP.md, IMPLEMENTATION.md)
2. **Enable debug logging**: Set `"jsp.enableDebugLogging": true` in settings
3. **Review console output**: Help → Toggle Developer Tools → Console
4. **Report issues**: https://github.com/syntaxkraken/jsp-glass/issues

When reporting, please include:
- VS Code version
- Java/JDK version
- Tomcat version
- Extension configuration (settings.json, launch.json)
- Console output with debug logging enabled
- Steps to reproduce the issue

### What Works

Based on user feedback and testing:

✅ **Confirmed Working:**
- SMAP extraction from Tomcat-compiled JSP servlets using javap
- Bidirectional line mapping (JSP ↔ Servlet)
- Breakpoint setting in JSP files
- Stack frame line number correction during debugging
- Debug session with Apache Tomcat via JPDA

### What May Not Work

⚠️ **Potential Issues:**
- Complex JSP includes or fragments
- Non-standard Tomcat work directory structures
- JSPs with heavy JSTL/EL expressions
- Multi-war deployments with overlapping contexts
- JSP runtime compilation during debugging
- Hot reload scenarios
- Custom JSP tag libraries with complex logic

### Experimental Features

Some features are considered experimental:
- Remote debugging support
- Docker container debugging
- Multi-module Maven projects
- Non-Maven project structures

### Future Improvements

This disclaimer will be updated as:
- More testing is completed
- Bugs are discovered and fixed
- New features are added
- User feedback is incorporated

### Support Limitations

- **Community Support**: This is an open-source project with community-based support
- **No SLA**: No service level agreement or guaranteed response time
- **Best Effort**: Maintainers will address issues on a best-effort basis
- **Contributions Welcome**: Community contributions are encouraged

### Legal

This extension is released under the **MIT License**. See LICENSE file for full terms.

Key points:
- Free to use, modify, and distribute
- No warranty provided
- Use at your own risk
- Attribution appreciated but not required

---

## Acknowledgment

By installing and using JSP Glass, you acknowledge that you have read, understood, and agreed to this disclaimer.

**If you find this extension useful despite these limitations, please:**
- ⭐ Star the repository on GitHub
- 📝 Report bugs and suggest improvements
- 🤝 Contribute code or documentation
- 💬 Share your experience with the community

---

**JSP Glass** - Transparent JSP debugging, use responsibly! 🔍✨

---

*Last Updated: November 6, 2024*
*Version: 1.0.0*
