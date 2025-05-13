# @kalxjs/compiler

Compiler for KalxJS single-file components (.klx files). This compiler transforms .klx single-file components into JavaScript code that can be used with the KalxJS runtime.

## Features

- Parses single-file components with template, script, and style sections
- Transforms template syntax into render functions
- Handles component attributes and properties
- Supports event handling with @event syntax
- Processes expressions with {{ }} syntax
- Properly handles HTML comments
- Supports hyphenated attribute names

## Installation

```bash
npm install @kalxjs/compiler
```

## Usage

```javascript
import { compile } from '@kalxjs/compiler';

// Compile a single-file component
const source = `
<template>
  <div>
    <h1>{{ title }}</h1>
    <button @click="increment">Count: {{ count }}</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      title: 'Hello KalxJS',
      count: 0
    };
  },
  methods: {
    increment() {
      this.count++;
    }
  }
}
</script>

<style>
h1 {
  color: #42b883;
}
button {
  background-color: #35495e;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}
</style>
`;

const result = compile(source, {
  filename: 'MyComponent.klx',
  sourceMap: true
});

console.log(result.code); // Compiled JavaScript code
console.log(result.map);  // Source map
console.log(result.styles); // Extracted styles
```

## API

### compile(source, options)

Compiles a KalxJS single-file component.

#### Options

- `filename` - The filename of the component (used for source maps and error messages)
- `sourceMap` - Generate source maps (default: `false`)
- `optimize` - Enable optimizations (default: `process.env.NODE_ENV === 'production'`)
- `styleProcessor` - Custom function to process styles (default: `null`)
- `scriptProcessor` - Custom function to process scripts (default: `null`)
- `templateProcessor` - Custom function to process templates (default: `null`)

#### Returns

An object containing:

- `code` - The compiled JavaScript code
- `map` - The source map (if `sourceMap` is enabled)
- `styles` - The extracted styles
- `template` - The processed template
- `script` - The processed script
- `errors` - Array of compilation errors (if any)

### Vite Plugin

The compiler also includes a Vite plugin for seamless integration with Vite-based projects:

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import kalx from '@kalxjs/compiler/vite-plugin';

export default defineConfig({
  plugins: [
    kalx({
      // Plugin options
      include: /\.klx$/,
      exclude: /node_modules/
    })
  ]
});
```

## Components

KalxJS single-file components have three sections:

### Template

```html
<template>
  <!-- HTML template with KalxJS template syntax -->
  <div>
    <h1>{{ title }}</h1>
    <button @click="increment">Count: {{ count }}</button>
    <!-- Comments are properly handled and removed from the output -->
    <p class="description">{{ description }}</p>
    <!-- Hyphenated attributes are supported -->
    <router-link :to="path" active-class="active">Home</router-link>
  </div>
</template>
```

#### Template Syntax

The template syntax supports:

- Text interpolation with `{{ expression }}`
- Event binding with `@event="handler"`
- Attribute binding with `:attr="value"`
- Hyphenated attributes like `active-class="active"`
- HTML comments (removed in the output)
- Nested components

### Script

```html
<script>
// Component definition
export default {
  name: 'MyComponent',
  components: {
    RouterLink,
    CustomButton
  },
  data() {
    return {
      title: 'Hello KalxJS',
      count: 0,
      description: 'A modern JavaScript framework',
      path: '/'
    };
  },
  methods: {
    increment() {
      this.count++;
    }
  }
}
</script>
```

### Style

```html
<style>
/* CSS styles */
h1 {
  color: #42b883;
}
button {
  background-color: #35495e;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
}
.description {
  font-style: italic;
  margin: 10px 0;
}
.active {
  font-weight: bold;
}
</style>
```

You can also use scoped styles:

```html
<style scoped>
/* These styles will only apply to this component */
.container {
  padding: 20px;
}
</style>
```

## Changelog

### Version 1.2.14
- Fixed handling of hyphenated attributes in templates
- Improved HTML comment handling in templates
- Fixed duplicate variable declarations in parser
- Enhanced template parsing for better component nesting
- Added better error reporting

## License

MIT