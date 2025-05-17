# Migration Guide: .klx to .js

This guide will help you migrate your KALXJS project from using .klx files to standard .js files.

## Why Migrate?

- Better compatibility with standard JavaScript tooling
- Improved IDE support and syntax highlighting
- Simplified build process
- Better integration with the JavaScript ecosystem

## Automatic Migration

The easiest way to migrate is to use the KALXJS migration tool:

```bash
npx @kalxjs/cli migrate
```

This tool will:
1. Rename all .klx files to .js
2. Update all import statements
3. Update your build configuration
4. Update your linting configuration

## Manual Migration Steps

If you prefer to migrate manually, follow these steps:

### 1. Rename Files

Rename all your .klx files to .js:

```bash
# Find all .klx files and rename them to .js
find src -name "*.klx" -exec sh -c 'mv "$1" "${1%.klx}.js"' _ {} \;
```

### 2. Update Import Statements

Update all import statements in your code to reference .js files instead of .klx files:

```bash
# Find all .js files and replace .klx with .js in import statements
find src -name "*.js" -exec sed -i 's/from '\''.*\.klx'\''/from '\''&.js'\''/g' {} \;
```

### 3. Update Build Configuration

If you're using Vite, update your vite.config.js file:

```javascript
// Old configuration
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  // ...
})

// New configuration
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app'),
      '@core': path.resolve(__dirname, './app/core'),
      '@components': path.resolve(__dirname, './app/components'),
      '@assets': path.resolve(__dirname, './app/assets'),
      '@config': path.resolve(__dirname, './config')
    }
  },
  // ...
})
```

### 4. Update ESLint Configuration

If you're using ESLint, update your .eslintrc.js file:

```javascript
// Old configuration
module.exports = {
  // ...
  overrides: [
    {
      files: ['*.klx'],
      // ...
    }
  ]
}

// New configuration
module.exports = {
  // ...
  overrides: [
    {
      files: ['*.js'],
      // ...
    }
  ]
}
```

### 5. Update package.json Scripts

Update your package.json scripts to reference .js files instead of .klx files:

```json
// Old configuration
{
  "scripts": {
    "lint": "eslint . --ext .js,.klx",
    "lint:fix": "eslint . --ext .js,.klx --fix"
  }
}

// New configuration
{
  "scripts": {
    "lint": "eslint . --ext .js",
    "lint:fix": "eslint . --ext .js --fix"
  }
}
```

## Directory Structure Changes

The new KALXJS project structure uses an `app` directory instead of `src`:

| Old Structure | New Structure |
|---------------|---------------|
| src/App.klx | app/core/App.js |
| src/main.js | app/main.js |
| src/components/ | app/components/ |
| src/views/ | app/pages/ |
| src/router/ | app/navigation/ |
| src/store/ | app/state/ |
| src/api/ | app/services/ |
| src/composables/ | app/hooks/ |
| src/plugins/ | app/extensions/ |

## Testing Your Migration

After migrating, run the following commands to ensure everything works correctly:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Common Issues and Solutions

### Issue: Import Statements Not Updated

If some import statements were missed during the migration:

```javascript
// Find files with remaining .klx imports
grep -r "\.klx" --include="*.js" .
```

### Issue: Build Errors

If you encounter build errors after migration:

1. Check that all import paths are correct
2. Verify that your build configuration is updated
3. Clear your build cache: `rm -rf node_modules/.vite`

### Issue: Runtime Errors

If you encounter runtime errors after migration:

1. Check the browser console for specific error messages
2. Verify that all components are properly exported and imported
3. Check for any remaining references to .klx files

## Getting Help

If you encounter issues during migration, you can:

1. Open an issue on the [KALXJS GitHub repository](https://github.com/Odeneho-Calculus/kalxjs/issues)
2. Join the KALXJS Discord community for real-time help
3. Check the [KALXJS documentation](https://kalxjs.dev) for more information