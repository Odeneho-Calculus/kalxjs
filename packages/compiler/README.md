# @kalxjs/compiler

Compiler for KalxJS single-file components (.klx files).

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

## Components

KalxJS single-file components have three sections:

### Template

```html
<template>
  <!-- HTML template with KalxJS template syntax -->
  <div>
    <h1>{{ title }}</h1>
    <button @click="increment">Count: {{ count }}</button>
  </div>
</template>
```

### Script

```html
<script>
// Component definition
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
}
</style>
```

## License

MIT