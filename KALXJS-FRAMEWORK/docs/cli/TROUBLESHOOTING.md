# CLI Troubleshooting Guide

Comprehensive guide for diagnosing and fixing common KalxJS CLI issues.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Project Creation Issues](#project-creation-issues)
3. [Code Generation Issues](#code-generation-issues)
4. [Development Server Issues](#development-server-issues)
5. [Build Issues](#build-issues)
6. [Package Manager Issues](#package-manager-issues)
7. [Platform-Specific Issues](#platform-specific-issues)
8. [Performance Issues](#performance-issues)
9. [Debugging](#debugging)

---

## Installation Issues

### Issue: "kalxjs: command not found"

**Causes:**
- CLI not installed globally
- npm prefix misconfigured
- Shell PATH not updated
- Node modules directory not in PATH

**Solutions:**

1. Verify installation:
```bash
npm list -g @kalxjs/cli
```

2. Reinstall globally:
```bash
npm uninstall -g @kalxjs/cli
npm cache clean --force
npm install -g @kalxjs/cli
```

3. Check npm prefix:
```bash
npm config get prefix
# Should output a valid directory path
```

4. Update PATH (if needed):
```bash
# Add to ~/.bashrc or ~/.zshrc
export PATH="$(npm config get prefix)/bin:$PATH"

# Reload shell
source ~/.bashrc
```

5. Use with npx instead:
```bash
npx @kalxjs/cli create my-app
npx kalxjs --version
```

---

### Issue: "EACCES: permission denied"

**Cause:** npm global directory requires sudo

**Solutions:**

1. Fix npm permissions (recommended):
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

2. Or use sudo (not recommended):
```bash
sudo npm install -g @kalxjs/cli
```

3. Or fix directory ownership:
```bash
sudo chown -R $(whoami) /usr/local/lib/node_modules
sudo chown -R $(whoami) /usr/local/bin
```

---

### Issue: Multiple Node.js Versions Installed

**Causes:**
- nvm, nvm-windows, fnm, or other version managers
- System Node.js + installed via package manager
- Different CLI versions for different Node versions

**Solution:**

```bash
# Check which Node.js is active
which node
node --version

# List installed versions (if using nvm)
nvm list
nvm use 18.x

# Reinstall CLI for current Node version
npm install -g @kalxjs/cli
```

---

## Project Creation Issues

### Issue: "Invalid project name"

**Error:**
```
❌ Invalid project name: "123-app"
  ✖ Error: Project name cannot start with a number
```

**Solution:** Use valid npm package name:
```bash
# ❌ Invalid
kalxjs create 123-app
kalxjs create my app
kalxjs create my_app
kalxjs create my@app

# ✅ Valid
kalxjs create my-app
kalxjs create myapp
kalxjs create my-app-123
```

**Rules:**
- Must start with letter or underscore
- Can contain letters, numbers, hyphens, underscores
- No spaces or special characters
- Lowercase only

---

### Issue: "Directory already exists"

**Error:**
```
❌ Directory my-app already exists.
```

**Solutions:**

1. Use different name:
```bash
kalxjs create my-app-2
```

2. Remove existing directory:
```bash
rm -rf my-app
kalxjs create my-app
```

3. Create in different location:
```bash
kalxjs create my-app --cwd /custom/path
```

---

### Issue: Project creation hangs or is slow

**Causes:**
- Network issues downloading dependencies
- Slow npm registry
- Large package dependencies

**Solutions:**

1. Skip installation (install manually later):
```bash
kalxjs create my-app --skip-install
cd my-app
npm install
```

2. Use faster npm registry:
```bash
npm config set registry https://registry.npmjs.org/
npm install -g @kalxjs/cli
```

3. Use alternative package manager:
```bash
# Try yarn
npm install -g yarn
yarn config set registry https://registry.npmjs.org/
kalxjs create my-app

# Or pnpm
npm install -g pnpm
pnpm config set registry https://registry.npmjs.org/
kalxjs create my-app
```

4. Check network:
```bash
npm ping
# If timeout, check internet connection
```

---

### Issue: Features not installed

**Error:** Router/State/Testing not available after project creation

**Causes:**
- Flags not used during creation
- Features not properly installed

**Solution:**

Use flags explicitly:
```bash
kalxjs create my-app --router --state --testing
```

Or manually add later:
```bash
cd my-app
npm install @kalxjs/router @kalxjs/store
```

---

## Code Generation Issues

### Issue: "Component not created" or "File not found"

**Causes:**
- Working directory not a KalxJS project
- Invalid component name
- Permission issues

**Solutions:**

1. Verify you're in project root:
```bash
ls src/
# Should show: components/, App.js, main.js
```

2. Use valid component name:
```bash
# ✅ Valid (PascalCase)
kalxjs g c Button
kalxjs g c UserProfile

# ❌ Invalid
kalxjs g c button
kalxjs g c user-profile
```

3. Check file permissions:
```bash
chmod 755 src/components
chmod 644 src/components/*
```

4. Create custom directory:
```bash
kalxjs g c Button --dir src/ui
# Creates src/ui/Button.js
```

---

### Issue: "Cannot generate in nested directory"

**Solution:** Use absolute or relative paths:

```bash
# Relative path
kalxjs g c Button --dir src/components/form

# Absolute path
kalxjs g c Button --dir /Users/name/project/src/components/form

# CLI creates directory if it doesn't exist
```

---

### Issue: Style file not created

**Problem:** Component generated but no stylesheet

**Solution:** Use explicit style flag:

```bash
# ❌ Not created
kalxjs g c Button

# ✅ CSS file created
kalxjs g c Button --style css

# ✅ SCSS file created
kalxjs g c Button --style scss
```

---

### Issue: Test file has syntax errors

**Cause:** Jest environment misconfiguration

**Solution:**

1. Verify jest.config.js exists:
```bash
ls jest.config.js
```

2. Check jest configuration:
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['js', 'json'],
  testMatch: ['**/__tests__/**/*.test.js']
};
```

3. Run test:
```bash
npm test -- src/components/__tests__/Button.test.js
```

---

## Development Server Issues

### Issue: "Port already in use"

**Error:**
```
Error: Port 3000 is already in use
```

**Solutions:**

1. Use different port:
```bash
kalxjs serve --port 3001
kalxjs serve --port 8080
```

2. Kill process using port (macOS/Linux):
```bash
lsof -i :3000
kill -9 <PID>
```

Windows (PowerShell):
```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

3. CLI auto-detects and uses next available port:
```bash
kalxjs serve
# Automatically tries 3000, 3001, 3002, etc.
```

---

### Issue: "Cannot find module" or "Module not found"

**Causes:**
- Dependencies not installed
- Import path incorrect
- Node modules corrupted

**Solutions:**

1. Install dependencies:
```bash
npm install
```

2. Check import path:
```javascript
// ❌ Wrong
import Button from './Button'        // Missing .js
import App from '/src/App.js'        // Wrong path

// ✅ Correct
import Button from './Button.js'
import App from './App.js'
```

3. Clear cache and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

4. Use module aliases (if configured):
```javascript
import Button from '@/components/Button.js'
```

---

### Issue: "Browser won't open" with --open flag

**Cause:** Default browser not detected

**Solution:**

1. Open manually:
```bash
kalxjs serve
# Then manually visit http://localhost:3000
```

2. Specify host for network access:
```bash
kalxjs serve --host 0.0.0.0
```

3. Check environment:
```bash
# macOS
open http://localhost:3000

# Linux (gnome)
gnome-open http://localhost:3000

# Linux (kde)
kdeopen http://localhost:3000

# Windows
start http://localhost:3000
```

---

### Issue: "Hot Module Replacement (HMR) not working"

**Cause:** Build tool or configuration issue

**Solutions:**

1. Check vite.config.js:
```javascript
export default {
  server: {
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173
    }
  }
};
```

2. Restart dev server:
```bash
# Stop (Ctrl+C)
# Restart
kalxjs serve
```

3. Clear browser cache:
- DevTools > Storage > Clear site data
- Or hard refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)

---

## Build Issues

### Issue: "Build fails" or "Bundle error"

**Solutions:**

1. Enable verbose output:
```bash
kalxjs build --verbose
```

2. Check for JavaScript errors:
```bash
npm test
# Run tests to catch errors
```

3. Check build configuration:
```bash
cat vite.config.js
```

4. Clear build artifacts:
```bash
rm -rf dist
kalxjs build
```

---

### Issue: "Bundle too large"

**Causes:**
- Large dependencies
- Unused code not tree-shaken
- Missing code splitting

**Solutions:**

1. Analyze bundle:
```bash
kalxjs build --analyze
```

2. Identify large modules:
```bash
# Shows bundle composition
kalxjs build --verbose
```

3. Enable code splitting:
```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['@kalxjs/core', '@kalxjs/router']
        }
      }
    }
  }
};
```

4. Lazy load components:
```javascript
const HeavyComponent = defineAsyncComponent(() =>
  import('./components/Heavy.js')
);
```

---

### Issue: "CSS not minified" or "Code not minified"

**Solution:**

Minification is on by default. To disable (for debugging):

```bash
kalxjs build --no-minify
```

Then re-enable:

```bash
kalxjs build
```

---

### Issue: "Source maps missing"

**Solution:**

Enable source maps for debugging:

```javascript
// vite.config.js
export default {
  build: {
    sourcemap: true  // or 'hidden' for production
  }
};
```

Then build:

```bash
kalxjs build
```

---

## Package Manager Issues

### Issue: "npm install" hangs or fails

**Solutions:**

1. Clear npm cache:
```bash
npm cache clean --force
```

2. Check registry:
```bash
npm config get registry
npm config set registry https://registry.npmjs.org/
```

3. Try alternative package managers:
```bash
# Try yarn
yarn install

# Try pnpm
pnpm install
```

4. Install with no-optional:
```bash
npm install --no-optional
```

---

### Issue: "Yarn/pnpm not detected"

**Solution:**

CLI auto-detects based on lock files. Create appropriate lock file:

```bash
# For npm
rm yarn.lock pnpm-lock.yaml 2>/dev/null
npm install

# For yarn
rm package-lock.json pnpm-lock.yaml 2>/dev/null
yarn install

# For pnpm
rm package-lock.json yarn.lock 2>/dev/null
pnpm install
```

---

### Issue: "Dependency version conflicts"

**Solutions:**

1. Check versions:
```bash
npm list @kalxjs/core
npm list @kalxjs/router
```

2. Update dependencies:
```bash
npm update
```

3. Install compatible versions:
```bash
npm install @kalxjs/core@^2.2.0 @kalxjs/router@^2.0.0
```

---

## Platform-Specific Issues

### Windows Issues

**Issue: "Long file paths"**

Enable long file paths in Windows:

```powershell
# Run as Administrator
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
  -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

**Issue: "Line ending conflicts (CRLF vs LF)"**

Configure git:

```bash
git config core.autocrlf true
```

---

### macOS Issues

**Issue: "Xcode Command Line Tools missing"**

Install:

```bash
xcode-select --install
```

---

### Linux Issues

**Issue: "Build fails with EMFILE"**

Too many open files. Increase limit:

```bash
ulimit -n 4096
```

---

## Performance Issues

### Slow Project Creation

**Solutions:**

1. Skip installation:
```bash
kalxjs create my-app --skip-install
```

2. Use faster network:
```bash
npm config set registry https://registry.npmjs.org/
```

3. Use SSD:
```bash
kalxjs create my-app --cwd /mnt/ssd/projects
```

---

### Slow Dev Server

**Solutions:**

1. Reduce dependencies:
```bash
# Only install needed packages
npm install --only=prod
```

2. Use fast HMR:
```javascript
// vite.config.js
export default {
  server: {
    middlewareMode: false
  }
};
```

---

## Debugging

### Enable Debug Logging

```bash
# Debug CLI operations
DEBUG=kalxjs* kalxjs create my-app

# Debug Vite
DEBUG=vite* kalxjs serve

# Debug everything
DEBUG=* kalxjs build
```

### Check Node.js Version

```bash
node --version
# Should be >= 14.0.0 (16+ recommended)
```

### Check npm Version

```bash
npm --version
# Should be >= 6.0.0
```

### View CLI Help

```bash
kalxjs --help
kalxjs create --help
kalxjs generate --help
kalxjs serve --help
kalxjs build --help
```

### Test Basic Functionality

```bash
# Test version
kalxjs --version

# Test help
kalxjs --help

# Test create in temp directory
mkdir /tmp/test-kalxjs
cd /tmp/test-kalxjs
kalxjs create test-app --skip-install
```

---

## Getting Help

### Resources

1. **Documentation:**
   - [Quick Start](./QUICK_START.md)
   - [Commands Reference](./COMMANDS.md)
   - [API Reference](./API_REFERENCE.md)

2. **Community:**
   - GitHub Issues: https://github.com/Odeneho-Calculus/kalxjs/issues
   - GitHub Discussions: https://github.com/Odeneho-Calculus/kalxjs/discussions

3. **Debugging Info to Include:**
```bash
# Collect diagnostic info
echo "=== Environment ==="
node --version
npm --version
kalxjs --version

echo "=== npm Configuration ==="
npm config list

echo "=== Installed Packages ==="
npm list -g @kalxjs/cli

echo "=== Error Output ==="
# [Run your command with DEBUG]
DEBUG=* kalxjs create test-app 2>&1 | head -50
```

---

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `ENOENT` | File not found | Check paths, run from correct directory |
| `EACCES` | Permission denied | Fix npm permissions or use sudo |
| `ETIMEDOUT` | Network timeout | Check internet, use different npm registry |
| `ERR! 404` | Package not found | Check package name, verify registry |
| `ERR! code E401` | Authentication required | Run `npm login` |
| `EEXIST` | Directory exists | Remove directory or use different name |
| `EPERM` | Operation not permitted | Check file permissions, use sudo |

---

## Next Steps

- [Quick Start Guide](./QUICK_START.md)
- [Commands Reference](./COMMANDS.md)
- [Advanced Usage](./ADVANCED_USAGE.md)