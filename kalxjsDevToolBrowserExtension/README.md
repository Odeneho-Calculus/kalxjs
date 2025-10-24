# KALXJS DevTools Browser Extension

A professional-grade browser extension that provides comprehensive debugging and development tools for KALXJS framework applications directly within Chrome DevTools.

## Features

### 🔍 **Component Inspector**
- Real-time component tree visualization
- Component hierarchy navigation
- Component selection and inspection
- Props and state monitoring

### 📊 **State Management**
- Live state tracking and updates
- State history and time-travel debugging
- Computed properties inspection
- In-place state editing with validation

### ⚡ **Event System**
- Comprehensive event logging and tracking
- Event timeline with chronological visualization
- Advanced filtering by event type and component
- Performance impact analysis for events

### 📈 **Performance Profiling**
- Component render time analysis
- Memory usage monitoring and leak detection
- Bundle analysis and optimization suggestions
- Automated performance recommendations

## Installation

### Development Mode
1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the extension
4. Open Chrome and navigate to `chrome://extensions/`
5. Enable "Developer mode"
6. Click "Load unpacked" and select the `build` folder
7. The extension will be loaded and ready to use

### Production Mode
- Install from [Chrome Web Store](https://chromewebstore.google.com) (coming soon)

## Usage

1. **Enable DevTools in your KALXJS app**:
   ```javascript
   import { createDevTools } from '@kalxjs/devtools';

   if (process.env.NODE_ENV === 'development') {
     createDevTools({
       enabled: true,
       inspector: true,
       profiler: true
     });
   }
   ```

2. **Open Chrome DevTools** (F12) on any page using KALXJS

3. **Navigate to the "KALXJS" panel** in DevTools

4. **Start debugging** with comprehensive insights into your application

## Development

### Requirements
- Node.js 18+
- Chrome 88+ (for Manifest V3 support)

### Build Scripts
```bash
# Install dependencies
pnpm install

# Development build with watch mode
pnpm run dev

# Production build
pnpm run build:prod

# Create distributable package
pnpm run package

# Run tests
pnpm test

# Lint code
pnpm run lint

#Extra
rm -r build dist 2>/dev/null; echo "Cleaned build and dist directories"

```

### Project Structure
```
src/
├── background/          # Background service worker
├── content-script/      # Content scripts and page injection
├── devtools/           # DevTools page and panel
├── shared/             # Shared utilities and constants
└── assets/             # Extension icons and assets

build/                  # Built extension files
dist/                   # Distribution packages
scripts/                # Build and packaging scripts
tests/                  # Test files
```

### Architecture

The extension uses a multi-context architecture:
- **Background Service Worker**: Manages extension lifecycle and tab communication
- **Content Script**: Bridges between page and extension contexts
- **Injected Script**: Runs in page context for direct framework access
- **DevTools Panel**: Provides the debugging interface

Communication flows securely between contexts using Chrome's message passing APIs with comprehensive error handling and performance monitoring.

## Browser Compatibility

- **Chrome**: v88+ (Primary target)
- **Edge**: v88+ (Chromium-based)
- **Firefox**: v109+ (With compatibility layer)
- **Other Chromium browsers**: Brave, Opera, Arc

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with comprehensive tests
4. Follow the coding standards and commit conventions
5. Push to your branch: `git push origin feature/amazing-feature`
6. Open a Pull Request with detailed description

### Coding Standards
- Use TypeScript/JSDoc for type annotations
- Follow ESLint configuration
- Write comprehensive unit and integration tests
- Maintain 90%+ test coverage
- Document all public APIs

## Security

This extension follows security best practices:
- Manifest V3 compliance with strict CSP
- Minimal permissions principle
- Secure cross-context communication
- Input validation and sanitization
- Regular security audits

## Performance

The extension is designed for minimal performance impact:
- Lazy loading of components
- Efficient data structures
- Background processing
- Memory leak prevention
- Performance monitoring and alerts

## Support

- **Documentation**: [https://kalxjs.dev/devtools](https://kalxjs.dev/devtools)
- **Issues**: [GitHub Issues](https://github.com/Odeneho-Calculus/kalxjs/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Odeneho-Calculus/kalxjs/discussions)
- **Email**: devtools@kalxjs.dev

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and release notes.

---

**Built with ❤️ by the KALXJS Team**

*Enhancing developer productivity in the KALXJS ecosystem*