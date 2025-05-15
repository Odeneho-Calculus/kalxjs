# Migrating from .klx to Standard JS Components

This guide will help you migrate your KalxJS components from the .klx format to standard JavaScript files.

## Why Migrate?

- **Simplicity**: Standard JS files are easier to work with and don't require special compilation
- **Tooling**: Better compatibility with existing JavaScript tools and IDEs
- **Performance**: Reduced build time by eliminating the .klx compilation step
- **Ecosystem**: Better alignment with the JavaScript ecosystem

## Migration Steps

### 1. Component Structure

#### Before (.klx.js file)

```javascript
// counter.klx.js
<template>
  <div class="counter">
    <h1>Counter: {{ count }}</h1>
    <button @click="increment">Increment</button>
    <button @click="decrement">Decrement</button>
  </div>
</template>

<script>
export default {
  name: 'CounterComponent',
  
  data() {
    return {
      count: 0
    };
  },
  
  methods: {
    increment() {
      this.count++;
    },
    
    decrement() {
      this.count--;
    }
  }
};
</script>

<style>
.counter {
  padding: 20px;
  text-align: center;
}

button {
  margin: 0 5px;
  padding: 8px 16px;
}
</style>
```

#### After (standard .js file)

```javascript
// counter.js
import { h, defineComponent, reactive, createStyles } from '@kalxjs/core';

// Define styles
const styles = createStyles(`
  .counter {
    padding: 20px;
    text-align: center;
  }
  
  button {
    margin: 0 5px;
    padding: 8px 16px;
  }
`);

export default defineComponent({
  name: 'CounterComponent',
  
  setup() {
    // Component state
    const state = reactive({
      count: 0
    });
    
    // Methods
    function increment() {
      state.count++;
    }
    
    function decrement() {
      state.count--;
    }
    
    // Render function
    function render() {
      return h('div', { class: 'counter' }, [
        h('h1', {}, [`Counter: ${state.count}`]),
        h('button', { onClick: increment }, ['Increment']),
        h('button', { onClick: decrement }, ['Decrement'])
      ]);
    }
    
    // Return all the component's public properties and methods
    return {
      state,
      increment,
      decrement,
      render
    };
  }
});
```

### 2. Handling Styles

In the .klx format, styles were included in the `<style>` section. In the new format, use the `createStyles` utility:

```javascript
import { createStyles } from '@kalxjs/core';

const styles = createStyles(`
  .my-component {
    color: blue;
    font-size: 16px;
  }
  
  .my-component h1 {
    color: #42b883;
  }
`);
```

### 3. Template to Render Function

Convert your template to a render function using the `h` function:

#### Template (Before)
```html
<div class="user-profile">
  <h2>{{ user.name }}</h2>
  <p>Email: {{ user.email }}</p>
  <button @click="updateUser">Update</button>
</div>
```

#### Render Function (After)
```javascript
function render() {
  return h('div', { class: 'user-profile' }, [
    h('h2', {}, [state.user.name]),
    h('p', {}, [`Email: ${state.user.email}`]),
    h('button', { onClick: updateUser }, ['Update'])
  ]);
}
```

### 4. Event Handling

#### Before
```html
<button @click="handleClick">Click Me</button>
```

#### After
```javascript
h('button', { onClick: handleClick }, ['Click Me'])
```

### 5. Conditional Rendering

#### Before
```html
<div v-if="isVisible">This is visible</div>
```

#### After
```javascript
state.isVisible ? h('div', {}, ['This is visible']) : null
```

### 6. List Rendering

#### Before
```html
<ul>
  <li v-for="item in items" :key="item.id">{{ item.name }}</li>
</ul>
```

#### After
```javascript
h('ul', {}, [
  state.items.map(item => h('li', { key: item.id }, [item.name]))
])
```

### 7. Component Lifecycle

#### Before
```javascript
export default {
  mounted() {
    console.log('Component mounted');
  },
  updated() {
    console.log('Component updated');
  }
};
```

#### After
```javascript
setup() {
  function mounted() {
    console.log('Component mounted');
  }
  
  function updated() {
    console.log('Component updated');
  }
  
  return {
    mounted,
    updated,
    // other properties and methods
  };
}
```

### 8. Computed Properties

#### Before
```javascript
export default {
  computed: {
    fullName() {
      return `${this.firstName} ${this.lastName}`;
    }
  }
};
```

#### After
```javascript
setup() {
  const state = reactive({
    firstName: 'John',
    lastName: 'Doe'
  });
  
  function fullName() {
    return `${state.firstName} ${state.lastName}`;
  }
  
  return {
    state,
    fullName,
    // other properties and methods
  };
}
```

## Complete Example

Here's a complete example of a component migrated from .klx to standard JS:

### Before (UserProfile.klx.js)

```javascript
<template>
  <div class="user-profile">
    <h2>{{ user.name }}</h2>
    <p>Email: {{ user.email }}</p>
    <p>Role: {{ userRole }}</p>
    <button @click="updateUser">Update</button>
  </div>
</template>

<script>
export default {
  name: 'UserProfile',
  
  props: {
    userId: {
      type: Number,
      required: true
    }
  },
  
  data() {
    return {
      user: {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user'
      }
    };
  },
  
  computed: {
    userRole() {
      return this.user.role.toUpperCase();
    }
  },
  
  methods: {
    updateUser() {
      // Update user logic
      this.user.name = 'Jane Doe';
    }
  },
  
  mounted() {
    console.log('User profile component mounted');
    this.fetchUserData();
  },
  
  methods: {
    fetchUserData() {
      // Fetch user data based on userId
      console.log(`Fetching data for user ${this.userId}`);
    }
  }
};
</script>

<style>
.user-profile {
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  max-width: 500px;
  margin: 0 auto;
}

h2 {
  color: #42b883;
}

button {
  background-color: #42b883;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #3aa876;
}
</style>
```

### After (UserProfile.js)

```javascript
import { h, defineComponent, reactive, createStyles } from '@kalxjs/core';

// Define styles
const styles = createStyles(`
  .user-profile {
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 5px;
    max-width: 500px;
    margin: 0 auto;
  }
  
  h2 {
    color: #42b883;
  }
  
  button {
    background-color: #42b883;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }
  
  button:hover {
    background-color: #3aa876;
  }
`);

export default defineComponent({
  name: 'UserProfile',
  
  // Define props
  props: {
    userId: {
      type: Number,
      required: true
    }
  },
  
  setup(props) {
    // Component state
    const state = reactive({
      user: {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user'
      }
    });
    
    // Computed property
    function userRole() {
      return state.user.role.toUpperCase();
    }
    
    // Methods
    function updateUser() {
      // Update user logic
      state.user.name = 'Jane Doe';
    }
    
    function fetchUserData() {
      // Fetch user data based on userId
      console.log(`Fetching data for user ${props.userId}`);
    }
    
    // Lifecycle hook
    function mounted() {
      console.log('User profile component mounted');
      fetchUserData();
    }
    
    // Render function
    function render() {
      return h('div', { class: 'user-profile' }, [
        h('h2', {}, [state.user.name]),
        h('p', {}, [`Email: ${state.user.email}`]),
        h('p', {}, [`Role: ${userRole()}`]),
        h('button', { onClick: updateUser }, ['Update'])
      ]);
    }
    
    // Return all the component's public properties and methods
    return {
      state,
      userRole,
      updateUser,
      fetchUserData,
      mounted,
      render
    };
  }
});
```

## Tips for a Smooth Migration

1. **Start with simple components**: Begin by migrating your simplest components first to get familiar with the process.

2. **Use the migration helper**: We provide a migration helper that can automatically convert most .klx files to JS:

   ```bash
   npx kalxjs-migrate path/to/component.klx.js
   ```

3. **Test thoroughly**: After migrating each component, test it thoroughly to ensure it works as expected.

4. **Gradual migration**: You don't need to migrate all components at once. The new system is compatible with the old one.

5. **Update imports**: Make sure to update your imports to use the new JS components.

## Common Issues and Solutions

### Issue: Event handlers not working

**Solution**: Make sure you're using camelCase for event handlers (e.g., `onClick` instead of `@click`).

### Issue: Styles not applying

**Solution**: Ensure you're using the `createStyles` function and that the style ID is unique.

### Issue: Component not updating when state changes

**Solution**: Make sure you're using `reactive` for your state and that your render function is accessing the reactive properties.

## Need Help?

If you encounter any issues during migration, please:

1. Check our [troubleshooting guide](./troubleshooting.md)
2. Ask for help in our [community forum](https://forum.kalxjs.org)
3. Open an issue on [GitHub](https://github.com/kalxjs/kalxjs)

Happy coding with KalxJS!