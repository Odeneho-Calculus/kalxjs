<!-- kalxjs/docs/api/component.md -->
# Component API

Components are the building blocks of kalxjs applications. They encapsulate data, logic, and the user interface.

## Import

```javascript
import { defineComponent, createApp } from '@kalxjs-framework/runtime'
```

## Single File Components

kalxjs supports Single File Components (SFCs) with the `.klx` extension. These files combine template, script, and style in one file:

```klx
<template>
  <div>
    <h1>{{ title }}</h1>
    <button @click="increment">Count: {{ count }}</button>
  </div>
</template>

<script>
import { ref } from '@kalxjs-framework/runtime'

export default {
  name: 'MyComponent',
  setup() {
    const title = ref('Hello kalxjs')
    const count = ref(0)
    
    function increment() {
      count.value++
    }
    
    return {
      title,
      count,
      increment
    }
  }
}
</script>

<style>
button {
  background-color: #4a90e2;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
```

## defineComponent()

Defines a component with options.

```javascript
import { defineComponent, h } from '@kalxjs-framework/runtime'

const Button = defineComponent({
  name: 'Button',
  props: {
    label: String,
    primary: Boolean
  },
  setup(props, { emit }) {
    const handleClick = () => {
      emit('click')
    }
    
    return () => h('button', {
      class: props.primary ? 'btn-primary' : 'btn-default',
      onClick: handleClick
    }, props.label)
  }
})
```

### Arguments

- `{Object} options` - Component options

### Returns

- `{Object}` - Component definition

### Component Options

- `name` - Component name (for debugging)
- `props` - Component props definition
- `emits` - Component emitted events
- `components` - Registered child components
- `setup()` - Setup function for Composition API
- `data()` - Function that returns component data (Options API)
- `computed` - Computed properties (Options API)
- `methods` - Component methods (Options API)
- `render()` - Render function (Options API)
- Lifecycle hooks (see below)

## createApp()

Creates an application instance.

```javascript
import { createApp } from '@kalxjs-framework/runtime'
import App from './App.klx'
import router from './router'

const app = createApp(App)

// Add plugins
app.use(router)

// Mount the app
app.mount('#app')
```

### Arguments

- `{Object|Function} component` - Root component

### Returns

- `{Object}` - Application instance with the following methods:
  - `mount(selector)` - Mount the app to a DOM element
  - `use(plugin, options)` - Install a plugin
  - `component(name, component)` - Register a global component
  - `directive(name, directive)` - Register a global directive
  - `provide(key, value)` - Provide a value to all components

## Component Composition API

The Composition API provides a way to organize component logic by feature rather than by options.

```javascript
import { ref, computed, onMounted } from '@kalxjs-framework/runtime'

export default {
  props: {
    initialCount: {
      type: Number,
      default: 0
    }
  },
  setup(props, { emit }) {
    // Reactive state
    const count = ref(props.initialCount)
    
    // Computed property
    const doubleCount = computed(() => count.value * 2)
    
    // Methods
    function increment() {
      count.value++
      emit('increment', count.value)
    }
    
    // Lifecycle hooks
    onMounted(() => {
      console.log('Component mounted')
    })
    
    // Expose to template
    return {
      count,
      doubleCount,
      increment
    }
  }
}
```

## Component Options API

kalxjs also supports the Options API for component definition.

```javascript
import { defineComponent } from '@kalxjs-framework/runtime'

export default defineComponent({
  name: 'Counter',
  props: {
    initialCount: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      count: this.initialCount
    }
  },
  computed: {
    doubleCount() {
      return this.count * 2
    }
  },
  methods: {
    increment() {
      this.count++
      this.$emit('increment', this.count)
    }
  },
  mounted() {
    console.log('Component mounted')
  }
})
```

## Lifecycle Hooks

Components have the following lifecycle hooks:

### Composition API Hooks

- `onBeforeMount` - Called before the component is mounted to the DOM
- `onMounted` - Called after the component is mounted to the DOM
- `onBeforeUpdate` - Called before the component is updated
- `onUpdated` - Called after the component is updated
- `onBeforeUnmount` - Called before the component is unmounted from the DOM
- `onUnmounted` - Called after the component is unmounted from the DOM
- `onErrorCaptured` - Called when an error is captured from a child component

```javascript
import { onMounted, onBeforeUnmount } from '@kalxjs-framework/runtime'

export default {
  setup() {
    onMounted(() => {
      console.log('Component is mounted')
    })
    
    onBeforeUnmount(() => {
      console.log('Component will be unmounted')
    })
    
    return {}
  }
}
```

### Options API Hooks

- `beforeCreate` - Called before the component is initialized
- `created` - Called after the component is initialized
- `beforeMount` - Called before the component is mounted to the DOM
- `mounted` - Called after the component is mounted to the DOM
- `beforeUpdate` - Called before the component is updated
- `updated` - Called after the component is updated
- `beforeUnmount` - Called before the component is unmounted from the DOM
- `unmounted` - Called after the component is unmounted from the DOM

## Emitting Events

Components can emit events to their parent.

### Composition API

```javascript
export default {
  setup(props, { emit }) {
    function handleClick() {
      emit('click', { time: Date.now() })
    }
    
    return {
      handleClick
    }
  }
}
```

### Options API

```javascript
export default {
  methods: {
    handleClick() {
      this.$emit('click', { time: Date.now() })
    }
  }
}
```

## Slots

Components can accept content from their parent using slots.

### Template Syntax

```klx
<template>
  <div class="card">
    <div class="card-header">
      <slot name="header">Default Header</slot>
    </div>
    <div class="card-body">
      <slot>Default Content</slot>
    </div>
    <div class="card-footer">
      <slot name="footer">Default Footer</slot>
    </div>
  </div>
</template>
```

### Render Function

```javascript
import { h } from '@kalxjs-framework/runtime'

export default {
  setup(props, { slots }) {
    return () => h('div', { class: 'card' }, [
      h('div', { class: 'card-header' }, slots.header?.() || 'Default Header'),
      h('div', { class: 'card-body' }, slots.default?.() || 'Default Content'),
      h('div', { class: 'card-footer' }, slots.footer?.() || 'Default Footer')
    ])
  }
}
```

## Using Components

### In Templates

```klx
<template>
  <div>
    <my-component 
      :prop1="value1" 
      :prop2="value2"
      @event="handleEvent"
    >
      <template #header>
        <h2>Custom Header</h2>
      </template>
      
      <p>Main Content</p>
      
      <template #footer>
        <button>Action</button>
      </template>
    </my-component>
  </div>
</template>

<script>
import MyComponent from './MyComponent.klx'

export default {
  components: {
    MyComponent
  },
  setup() {
    // ...
  }
}
</script>
```

### In Render Functions

```javascript
import { h } from '@kalxjs-framework/runtime'
import MyComponent from './MyComponent.klx'

export default {
  setup() {
    return () => h(MyComponent, {
      prop1: 'value1',
      prop2: 'value2',
      onEvent: handleEvent
    }, {
      header: () => h('h2', null, 'Custom Header'),
      default: () => h('p', null, 'Main Content'),
      footer: () => h('button', null, 'Action')
    })
  }
}