# Components

Components are the building blocks of KALXJS applications. They encapsulate reusable UI elements along with their functionality.

## Creating Components

A component in KALXJS is an object with a template and optional properties:

```javascript
const MyComponent = {
  // Template defines the HTML structure
  template: `<div>Hello {{ name }}</div>`,
  
  // Data properties
  data() {
    return {
      name: 'World'
    };
  },
  
  // Methods
  methods: {
    greet() {
      console.log(`Hello, ${this.name}!`);
    }
  },
  
  // Lifecycle hooks
  mounted() {
    this.greet();
  }
};
```

## Component Registration

Components can be registered globally or locally:

### Global Registration

```javascript
import { createApp } from 'kalxjs-framework/core';
import MyComponent from './MyComponent.js';

const app = createApp({});
app.component('my-component', MyComponent);
```

### Local Registration

```javascript
import MyComponent from './MyComponent.js';

const App = {
  components: {
    'my-component': MyComponent
  },
  template: `<div><my-component></my-component></div>`
};
```

## Props

Props allow you to pass data from a parent component to a child component:

```javascript
// Child component
const ChildComponent = {
  props: ['message'],
  template: `<div>{{ message }}</div>`
};

// Parent component
const ParentComponent = {
  components: {
    'child-component': ChildComponent
  },
  template: `<child-component message="Hello from parent"></child-component>`
};
```

## Events

Components can emit events to communicate with their parent:

```javascript
// Child component
const ChildComponent = {
  template: `<button @click="onClick">Click me</button>`,
  methods: {
    onClick() {
      this.$emit('button-clicked', 'Data to send');
    }
  }
};

// Parent component
const ParentComponent = {
  components: {
    'child-component': ChildComponent
  },
  methods: {
    handleClick(data) {
      console.log('Button clicked with data:', data);
    }
  },
  template: `<child-component @button-clicked="handleClick"></child-component>`
};
```

## Slots

Slots allow you to pass content to a component:

```javascript
// Component with slots
const Card = {
  template: `
    <div class="card">
      <div class="card-header">
        <slot name="header">Default header</slot>
      </div>
      <div class="card-body">
        <slot>Default content</slot>
      </div>
      <div class="card-footer">
        <slot name="footer">Default footer</slot>
      </div>
    </div>
  `
};

// Using the component with slots
const App = {
  components: { Card },
  template: `
    <card>
      <template #header>Custom Header</template>
      <p>This is the main content</p>
      <template #footer>Custom Footer</template>
    </card>
  `
};
```