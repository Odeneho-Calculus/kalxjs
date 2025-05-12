# @kalxjs/compiler-plugin

Webpack and Rollup plugin for KalxJS single-file components.

## Installation

```bash
npm install --save-dev @kalxjs/compiler-plugin
```

## Usage with Webpack

```javascript
// webpack.config.js
const { WebpackPlugin } = require('@kalxjs/compiler-plugin');

module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.klx$/,
        use: [
          'babel-loader',
          {
            loader: require.resolve('@kalxjs/compiler-plugin/loader'),
            options: {
              // compiler options
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new WebpackPlugin({
      // plugin options
    })
  ]
};
```

## Usage with Rollup

```javascript
// rollup.config.js
import { rollupPlugin } from '@kalxjs/compiler-plugin';

export default {
  // ...
  plugins: [
    rollupPlugin({
      // plugin options
    })
  ]
};
```

## Options

- `sourceMap` - Generate source maps (default: `false`)
- `hot` - Enable hot module replacement (default: `false`)
- `optimize` - Enable optimizations (default: `process.env.NODE_ENV === 'production'`)

## Features

- Compiles KalxJS single-file components (`.klx` files)
- Supports both Webpack and Rollup
- Integrates with Babel for transpilation
- Supports source maps
- Supports hot module replacement

## License

MIT