# CLI Installation & Setup Guide

This guide covers installation methods, system requirements, verification, and troubleshooting.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation Methods](#installation-methods)
3. [Package Manager Detection](#package-manager-detection)
4. [Verification](#verification)
5. [Configuration](#configuration)
6. [Uninstallation](#uninstallation)
7. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Node.js Version
- **Minimum**: Node.js 14.0.0 or higher
- **Recommended**: Node.js 16.0.0 or higher (for better performance)

Check your Node.js version:
```bash
node --version
```

If you don't have Node.js installed, download from [nodejs.org](https://nodejs.org/).

### Package Manager
You need one of:
- **npm** (≥6.0.0) — Comes with Node.js
- **yarn** (≥1.22.0) — Optional, CLI auto-detects
- **pnpm** (≥6.0.0) — Optional, CLI auto-detects

### Disk Space
- **CLI package**: ~50MB
- **Typical project**: ~200MB (with dependencies)
- **Recommended**: 500MB free disk space

### Supported Platforms
- ✅ Windows 7+
- ✅ macOS 10.12+
- ✅ Linux (all major distributions)
- ✅ WSL (Windows Subsystem for Linux)

---

## Installation Methods

### Method 1: Global Installation (Recommended)

Install globally to use the CLI from any directory:

```bash
npm install -g @kalxjs/cli
```

**Advantages:**
- ✅ Use `kalxjs` command anywhere
- ✅ Simpler command syntax
- ✅ Version managed centrally
- ✅ Easy updates

**Verify installation:**
```bash
kalxjs --version
```

### Method 2: Local Project Installation

Install as a dev dependency in your project:

```bash
npm install --save-dev @kalxjs/cli
```

**Advantages:**
- ✅ Version locked per project
- ✅ No global dependencies
- ✅ Team consistency

**Use with npx:**
```bash
npx kalxjs create my-app
# or
npx kalxjs generate component Button
```

### Method 3: Using Yarn

```bash
# Global installation
yarn global add @kalxjs/cli

# Local installation
yarn add --dev @kalxjs/cli
```

### Method 4: Using pnpm

```bash
# Global installation
pnpm add -g @kalxjs/cli

# Local installation
pnpm add -D @kalxjs/cli
```

### Method 5: From Source (Development)

For contributing or testing latest features:

```bash
# Clone the repository
git clone https://github.com/Odeneho-Calculus/kalxjs.git
cd kalxjs/KALXJS-FRAMEWORK/packages/cli

# Install dependencies
npm install

# Link globally for testing
npm link
```

Then use:
```bash
kalxjs --version
```

---

## Package Manager Detection

The CLI automatically detects and uses your project's package manager:

### Detection Order
1. Checks for `pnpm-lock.yaml` → Uses pnpm
2. Checks for `yarn.lock` → Uses yarn
3. Defaults to npm

### Example
In a project with `yarn.lock`:
```bash
kalxjs create my-app
# CLI will automatically use yarn for dependency installation
```

---

## Verification

### Step 1: Check Installation
```bash
kalxjs --version
# Output: 2.0.31 (or higher)
```

### Step 2: View Help Menu
```bash
kalxjs --help
# Shows all available commands
```

### Step 3: Test Create Command
```bash
# Create a test project
kalxjs create test-project --skip-install

# Check structure
ls test-project/
# Output: src/ public/ package.json index.html .gitignore README.md

# Clean up
rm -rf test-project
```

### Step 4: Verify Node Modules
```bash
npm list -g @kalxjs/cli
# Shows installation path and version
```

---

## Configuration

### Global Configuration

The CLI uses your system Node.js and npm settings. Customize behavior via:

#### npm Configuration
```bash
# Set default npm registry
npm config set registry https://registry.npmjs.org/

# View all settings
npm config list
```

#### Environment Variables
```bash
# Use PNPM for all CLI operations (if installed)
export NPM_CLIENT=pnpm

# Disable interactive prompts
export KALXJS_SKIP_PROMPTS=true

# Enable verbose logging
export KALXJS_VERBOSE=true
```

### Per-Project Configuration

Create `kalxjs.config.js` in project root:

```javascript
module.exports = {
  // Default component style
  componentStyle: 'Options API', // or 'Composition API'

  // Default style preprocessor
  defaultStylePreprocessor: 'css', // or 'scss'

  // Code generation directories
  directories: {
    components: 'src/components',
    stores: 'src/stores',
    pages: 'src/pages',
    routes: 'src/router'
  },

  // Auto-install dependencies
  autoInstall: true,

  // Logging level
  logLevel: 'info' // 'debug', 'info', 'warn', 'error'
};
```

### IDE Integration

#### Visual Studio Code
Install the KalxJS extension (if available):
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "KalxJS"
4. Install the extension

This enables:
- Syntax highlighting for KalxJS components
- Component snippets
- Integrated terminal commands

#### WebStorm / IntelliJ
1. Go to Settings → Languages & Frameworks → JavaScript → KalxJS
2. Enable KalxJS language support
3. Configure code completion

---

## Uninstallation

### Uninstall Global CLI
```bash
npm uninstall -g @kalxjs/cli
```

### Uninstall Local CLI
```bash
npm uninstall --save-dev @kalxjs/cli
```

### Remove All KalxJS Packages
```bash
# List all installed KalxJS packages
npm list -g | grep kalxjs

# Uninstall all
npm uninstall -g @kalxjs/cli @kalxjs/core @kalxjs/router @kalxjs/store
```

### Clean npm Cache
```bash
npm cache clean --force
```

---

## Troubleshooting

### Issue: "kalxjs command not found"

**Causes:**
- CLI not installed
- npm prefix misconfigured
- Shell not reloaded after installation

**Solutions:**

1. Verify installation:
```bash
npm list -g @kalxjs/cli
```

2. Reinstall:
```bash
npm uninstall -g @kalxjs/cli
npm install -g @kalxjs/cli
```

3. Reload shell:
```bash
# Bash
source ~/.bashrc

# Zsh
source ~/.zshrc

# Fish
source ~/.config/fish/config.fish
```

4. Check npm prefix:
```bash
npm config get prefix
# Should be /usr/local or your home directory
```

### Issue: "Permission denied" During Installation

**Cause:** Insufficient file permissions

**Solutions:**

1. Use `sudo` (not recommended):
```bash
sudo npm install -g @kalxjs/cli
```

2. Change npm permissions (recommended):
```bash
# Create directory for global packages
mkdir ~/.npm-global

# Configure npm to use it
npm config set prefix '~/.npm-global'

# Add to PATH (add to ~/.bashrc or ~/.zshrc)
export PATH=~/.npm-global/bin:$PATH

# Reload shell
source ~/.bashrc
```

3. Install locally instead:
```bash
npm install --save-dev @kalxjs/cli
npx kalxjs --version
```

### Issue: "EACCES: permission denied" on macOS/Linux

```bash
# Fix directory permissions
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Or use a prefix directory
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

### Issue: Old Version Persists After Update

**Cause:** Multiple Node.js installations or npm cache issues

**Solution:**

```bash
# Clear npm cache
npm cache clean --force

# Uninstall globally
npm uninstall -g @kalxjs/cli

# Wait 2 seconds
sleep 2

# Reinstall
npm install -g @kalxjs/cli

# Verify
kalxjs --version
```

### Issue: Package Installation Fails with npm Errors

**Causes:**
- Network issues
- Registry problems
- Disk space

**Solutions:**

1. Check internet connection:
```bash
npm ping
```

2. Use npm registry directly:
```bash
npm install -g @kalxjs/cli --registry https://registry.npmjs.org/
```

3. Clear cache and retry:
```bash
npm cache clean --force
npm install -g @kalxjs/cli
```

4. Check disk space:
```bash
# On macOS/Linux
df -h

# On Windows
dir C:\ (in PowerShell)
```

### Issue: Different Results with npm, yarn, pnpm

**Cause:** Lock file incompatibilities or different package versions

**Solution:**

1. Delete lock files and reinstall:
```bash
rm package-lock.json yarn.lock pnpm-lock.yaml

# Reinstall with your preferred manager
npm install
```

2. Force package resolution:
```bash
npm install @kalxjs/cli --no-optional
```

### Issue: CLI Doesn't Update After npm update

**Cause:** Version caching or npm resolution issues

**Solution:**

```bash
# Force reinstall
npm install -g @kalxjs/cli@latest

# Or specify exact version
npm install -g @kalxjs/cli@2.0.31
```

---

## Next Steps

After successful installation:

1. **Quick Start**: See [Quick Start Guide](./QUICK_START.md)
2. **Create a Project**: Run `kalxjs create my-app`
3. **Learn Commands**: Read [Commands Reference](./COMMANDS.md)
4. **Explore Generation**: Check [Code Generation](./GENERATION.md)

## Getting Help

- 📖 [CLI Documentation](./README.md)
- 💬 [GitHub Discussions](https://github.com/Odeneho-Calculus/kalxjs/discussions)
- 🐛 [Report Issues](https://github.com/Odeneho-Calculus/kalxjs/issues)