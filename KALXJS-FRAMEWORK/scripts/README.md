# KalxJS Development Tools

A comprehensive suite of development tools for the KalxJS framework that provides local testing, cleanup, analysis, and workflow management capabilities.

## 🎯 Overview

The KalxJS development tools are designed to enhance developer productivity and maintain code quality through:

- **Local Testing Environment**: Isolated testing without npm conflicts
- **Smart File Cleanup**: Intelligent unused file detection and removal
- **Test Orchestration**: Automated testing with hot reload monitoring
- **Dependency Analysis**: Comprehensive codebase analysis and optimization
- **Unified Interface**: Single command-line tool for all development tasks

## 🚀 Quick Start

### Setup Local Testing Environment
```bash
# Setup complete local testing environment
npm run dev:setup

# Check environment status
npm run dev:status
```

### Start Development Testing
```bash
# Start all test applications with hot reload
npm run dev:test

# Start specific test applications
npm run dev:test -- --apps=basic-test,sfc-test
```

### Code Cleanup and Analysis
```bash
# Analyze unused files (dry run)
npm run dev:cleanup

# Actually remove unused files
npm run dev:cleanup:live

# Analyze dependencies and code quality
npm run dev:analyze
```

## 📋 Available Commands

### Main Development Tools Interface

```bash
# Show all available commands
npm run dev-tools help

# Setup local testing environment
npm run dev-tools setup

# Clean unused files
npm run dev-tools cleanup [--dry-run] [--no-interactive]

# Run test orchestrator
npm run dev-tools test [--apps=app1,app2] [--no-watch]

# Analyze dependencies
npm run dev-tools analyze [--include-tests] [--no-graphs]

# Show environment status
npm run dev-tools status [--verbose]
```

### Individual Tool Scripts

```bash
# Direct script access
npm run local:setup     # Setup local testing
npm run local:test      # Run test orchestrator
npm run local:cleanup   # Clean unused files
npm run local:analyze   # Analyze dependencies
```

## 🛠️ Tools Overview

### 1. Local Test Setup (`setup-local-test.js`)

**Purpose**: Creates an isolated local testing environment for KalxJS development.

**Features**:
- ✅ Clean previous local installations
- ✅ Build and link packages locally
- ✅ Create comprehensive test applications
- ✅ Setup development environment
- ✅ Cross-platform compatibility
- ✅ Automatic rollback on failure

**Test Applications Created**:
- **Basic Test** (Port 3001): Core KalxJS functionality
- **SFC Test** (Port 3002): Single File Components
- **Router Test** (Port 3003): Router functionality
- **Performance Test** (Port 3004): Performance testing and optimization

**Usage**:
```bash
node scripts/setup-local-test.js
# or
npm run dev:setup
```

### 2. Unused File Cleanup (`cleanup-unused.js`)

**Purpose**: Intelligently detects and safely removes unused files from the codebase.

**Features**:
- 🔍 Static code analysis with import/require detection
- 🔍 Dynamic import and lazy loading detection
- 🔍 Asset reference checking (HTML, CSS, JSON, config files)
- 🔍 Build tool configuration analysis
- 🔍 Test file dependency tracking
- 🔍 Documentation reference checking
- 💾 Safe cleanup with backup and rollback
- 🤔 Interactive file review

**Detection Methods**:
- Import/require statement analysis
- Dynamic import detection (`import()`, `lazy()`, etc.)
- Asset references in CSS (`url()`, `@import`)
- HTML references (`src`, `href`)
- Markdown links and images
- Build configuration references

**Usage**:
```bash
# Dry run (recommended first)
node scripts/cleanup-unused.js --dry-run

# Interactive cleanup
node scripts/cleanup-unused.js

# Non-interactive cleanup
node scripts/cleanup-unused.js --live --no-interactive
```

### 3. Test Runner (`test-runner.js`)

**Purpose**: Orchestrates local testing with hot reload, monitoring, and automated testing.

**Features**:
- 🚀 Multi-application server management
- 👀 File change monitoring with hot reload
- 🧪 Automated test execution
- 📊 Performance monitoring
- 🔄 Automatic rebuilds on changes
- 📝 Comprehensive logging

**Monitoring Capabilities**:
- Application health checks
- Memory usage monitoring
- Build failure detection
- Test result tracking
- Performance metrics

**Usage**:
```bash
# Start all test applications
node scripts/test-runner.js

# Start specific applications
node scripts/test-runner.js --apps=basic-test,sfc-test

# Disable file watching
node scripts/test-runner.js --no-watch
```

### 4. Dependency Analyzer (`dependency-analyzer.js`)

**Purpose**: Provides comprehensive dependency analysis and code quality insights.

**Features**:
- 🕸️ Complete dependency graph mapping
- 🔄 Circular dependency detection
- 💀 Dead code identification
- 📦 Package-level analysis
- 📊 Bundle impact assessment
- 📈 Dependency graph generation
- 🎯 Optimization recommendations

**Analysis Types**:
- **File Dependencies**: Import/export relationships
- **Package Dependencies**: Cross-package dependencies
- **Circular Dependencies**: Dependency cycles
- **Unused Exports**: Exports never imported
- **Dead Code**: Unreferenced files and functions
- **Bundle Analysis**: Size and optimization opportunities

**Usage**:
```bash
# Full analysis
node scripts/dependency-analyzer.js

# Include test files
node scripts/dependency-analyzer.js --include-tests

# Skip graph generation
node scripts/dependency-analyzer.js --no-graphs
```

### 5. Main Control Script (`dev-tools.js`)

**Purpose**: Unified interface for all development tools with consistent command-line experience.

**Features**:
- 🎯 Single entry point for all tools
- 📋 Consistent command-line interface
- 🔧 Environment status checking
- 📊 Integrated reporting
- 🆘 Built-in help system

## 📁 Generated Files and Directories

### Local Test Environment
```
local-test/
├── basic-test/          # Basic functionality test app
├── sfc-test/           # Single File Component test app
├── router-test/        # Router functionality test app
├── performance-test/   # Performance testing app
└── scripts/
    ├── start-all.js    # Start all applications
    ├── start-basic-test.js
    ├── start-sfc-test.js
    ├── start-router-test.js
    └── start-performance-test.js
```

### Analysis Reports
```
dependency-analysis-[timestamp].json    # Dependency analysis report
cleanup-report-[timestamp].json         # Cleanup analysis report
dependency-graphs/
├── packages.dot                        # Package dependency graph
└── files.dot                          # File dependency graph
```

### Logs
```
local-test-setup.log        # Setup process log
cleanup-unused.log          # Cleanup process log
test-runner.log            # Test runner log
dependency-analysis.log    # Analysis process log
```

### Backups
```
.local-test-backup/        # Local test setup backup
.cleanup-backup/           # File cleanup backup
```

## 🔧 Configuration

### Environment Variables
```bash
NODE_ENV=development       # Development mode
PORT=3001                 # Default port for basic test
KALX_DEV_MODE=true        # Enable development features
```

### Command Options

#### Global Options
- `--verbose, -v`: Show detailed output
- `--help, -h`: Show command-specific help
- `--dry-run`: Preview changes without executing
- `--no-interactive`: Skip interactive prompts
- `--force`: Force operation even if risky

#### Setup Options
- `--force`: Force setup even if environment exists

#### Cleanup Options
- `--no-backup`: Skip creating backup before deletion
- `--verbose`: Show detailed analysis output

#### Test Runner Options
- `--apps=app1,app2`: Specify which test apps to run
- `--no-watch`: Disable file watching
- `--no-tests`: Skip running automated tests
- `--no-monitor`: Disable performance monitoring

#### Analysis Options
- `--include-tests`: Include test files in analysis
- `--no-graphs`: Skip generating dependency graphs
- `--no-circular`: Skip circular dependency detection
- `--no-dead-code`: Skip dead code analysis
- `--format=json`: Output format (json, html)

## 🚨 Safety Features

### Backup and Rollback
- Automatic backup creation before destructive operations
- Rollback capability for failed operations
- Manifest files for tracking changes

### Validation and Checks
- Environment validation before operations
- File existence checks
- Permission validation
- Dependency verification

### Error Handling
- Graceful error handling with detailed messages
- Automatic cleanup on failure
- Process isolation to prevent system interference

## 📊 Monitoring and Reporting

### Real-time Monitoring
- Application health checks every 30 seconds
- System resource monitoring every minute
- File change detection and response
- Build status tracking

### Comprehensive Reporting
- Detailed analysis reports in JSON format
- Visual dependency graphs (DOT format)
- Performance metrics and recommendations
- Code quality insights

### Logging
- Structured logging with timestamps
- Multiple log levels (INFO, WARN, ERROR)
- Separate logs for each tool
- Log rotation and cleanup

## 🔍 Troubleshooting

### Common Issues

#### Setup Fails
```bash
# Check environment
npm run dev:status --verbose

# Force clean setup
npm run dev:setup --force

# Check logs
cat local-test-setup.log
```

#### Test Apps Won't Start
```bash
# Check if ports are in use
netstat -an | grep :3001

# Restart with specific apps
npm run dev:test -- --apps=basic-test

# Check test runner logs
cat test-runner.log
```

#### Cleanup Removes Important Files
```bash
# Restore from backup
cp -r .cleanup-backup/* .

# Use dry run first
npm run dev:cleanup --dry-run

# Review cleanup report
cat cleanup-report-*.json
```

#### Analysis Takes Too Long
```bash
# Skip expensive operations
npm run dev:analyze --no-graphs --no-dead-code

# Exclude test files
npm run dev:analyze --no-include-tests
```

### Debug Mode
```bash
# Enable verbose output for all commands
npm run dev-tools <command> --verbose

# Check environment status
npm run dev:status --verbose

# Review all log files
ls -la *.log
```

## 🤝 Contributing

### Adding New Tools
1. Create script in `scripts/` directory
2. Follow existing patterns for logging and error handling
3. Add command to `dev-tools.js`
4. Update package.json scripts
5. Add documentation

### Testing Tools
1. Test on clean environment
2. Verify cross-platform compatibility
3. Test error conditions and rollback
4. Validate safety features

### Code Style
- Use ES modules
- Implement comprehensive error handling
- Include detailed logging
- Follow existing naming conventions
- Add JSDoc documentation

## 📚 Additional Resources

- [KalxJS Framework Documentation](../README.md)
- [Contributing Guidelines](../CONTRIBUTING.md)
- [Strategic Enhancement Plan](../STRATEGIC_ENHANCEMENT_PLAN.md)
- [Project Structure](../docs/project-structure.md)

## 🆘 Support

For issues with development tools:
1. Check this documentation
2. Review log files
3. Use `--verbose` flag for detailed output
4. Check environment status with `npm run dev:status`
5. Create issue with reproduction steps

---

**Note**: These tools are designed for development use only. Always use `--dry-run` first when using cleanup tools, and ensure you have backups of important work.