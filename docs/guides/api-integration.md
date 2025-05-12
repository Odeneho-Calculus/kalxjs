# API Integration Guide

KalxJS provides a built-in API integration system that makes it easy to interact with REST APIs. It includes features like automatic caching, request/response interceptors, and reactive state.

## Basic Usage

```js
import { createApi } from '@kalxjs/core';

// Create an API client
const api = createApi({
  baseUrl: 'https://api.example.com'
});

// Make a GET request
api.get('/users')
  .then(users => console.log(users))
  .catch(error => console.error(error));

// Make a POST request
api.post('/users', { name: 'John', email: 'john@example.com' })
  .then(user => console.log(user))
  .catch(error => console.error(error));
```

## API Client Options

When creating an API client, you can pass various options to customize its behavior:

```js
const api = createApi({
  // Base URL for all requests
  baseUrl: 'https://api.example.com',
  
  // Default headers for all requests
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token'
  },
  
  // Custom fetch implementation
  fetchImplementation: customFetch,
  
  // Request interceptor
  onRequest: (url, options) => {
    console.log(`Request: ${url}`);
    return { url, options };
  },
  
  // Response interceptor
  onResponse: (response, request) => {
    console.log(`Response from ${request.url}:`, response);
    return response;
  },
  
  // Error interceptor
  onError: (error, request) => {
    console.error(`Error from ${request.url}:`, error);
  }
});
```

## Making Requests

The API client provides methods for all common HTTP methods:

```js
// GET request
api.get('/users', {
  params: { page: 1, limit: 10 }
});

// POST request
api.post('/users', {
  name: 'John',
  email: 'john@example.com'
});

// PUT request
api.put('/users/1', {
  name: 'John Doe'
});

// PATCH request
api.patch('/users/1', {
  name: 'John Doe'
});

// DELETE request
api.delete('/users/1');

// Custom request
api.request('/users', {
  method: 'HEAD',
  headers: {
    'X-Custom-Header': 'value'
  }
});
```

## Request Options

Each request method accepts an options object that can include:

```js
api.get('/users', {
  // Query parameters
  params: {
    page: 1,
    limit: 10,
    sort: 'name'
  },
  
  // Request headers
  headers: {
    'X-Custom-Header': 'value'
  },
  
  // Enable caching (GET requests only)
  cache: true,
  
  // Cache time in milliseconds (default: 60000)
  cacheTime: 300000, // 5 minutes
  
  // Number of retries on failure
  retry: 3,
  
  // Delay between retries in milliseconds
  retryDelay: 1000,
  
  // Transform response
  transform: response => {
    return response.data.map(user => ({
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email
    }));
  }
});
```

## Caching

The API client includes built-in caching for GET requests:

```js
// Make a cached request
api.get('/users', { cache: true });

// Clear the cache for a specific URL
api.clearCache('/users');

// Clear the entire cache
api.clearCache();
```

## Reactive State

The API client includes reactive state that you can use in your components:

```js
// In a component
export default {
  setup() {
    onMounted(() => {
      api.get('/users');
    });
    
    return {
      loading: () => api.state.loading,
      error: () => api.state.error,
      users: () => api.state.data
    };
  }
};
```

## Composition API Integration

KalxJS provides a `useApi` composable for using the API client in components:

```js
import { useApi } from '@kalxjs/core';

export default {
  setup() {
    // Create a reactive API endpoint
    const { data, loading, error, execute } = useApi('/users', {
      method: 'GET',
      immediate: true, // Execute immediately
      transform: response => response.data,
      onSuccess: users => console.log('Users loaded:', users),
      onError: error => console.error('Error loading users:', error)
    });
    
    // Refresh the data
    const refreshUsers = () => {
      execute();
    };
    
    return {
      users: data,
      loading,
      error,
      refreshUsers
    };
  }
};
```

## API Plugin

KalxJS provides an API plugin that you can use to add the API client to your application:

```js
import { createApp, createApiPlugin } from '@kalxjs/core';

const app = createApp({
  // App options
});

// Use the API plugin
app.use(createApiPlugin({
  baseUrl: 'https://api.example.com',
  headers: {
    'Content-Type': 'application/json'
  }
}));

app.mount('#app');
```

Once the plugin is installed, you can access the API client in your components:

```js
export default {
  setup() {
    onMounted(() => {
      this.$api.get('/users');
    });
    
    return {
      loading: () => this.$api.state.loading,
      error: () => this.$api.state.error,
      users: () => this.$api.state.data
    };
  }
};
```

You can also use the `useApi` composable:

```js
export default {
  setup() {
    const { data, loading, error, execute } = useApi('/users', {
      method: 'GET',
      immediate: true
    });
    
    return {
      users: data,
      loading,
      error,
      refreshUsers: execute
    };
  }
};
```

## Advanced Usage

### Custom Fetch Implementation

You can provide a custom fetch implementation to the API client:

```js
const customFetch = async (url, options) => {
  // Add a timestamp to the URL to bypass cache
  const timestamp = Date.now();
  const separator = url.includes('?') ? '&' : '?';
  const finalUrl = `${url}${separator}_=${timestamp}`;
  
  // Make the request
  const response = await fetch(finalUrl, options);
  
  // Handle response
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

const api = createApi({
  baseUrl: 'https://api.example.com',
  fetchImplementation: customFetch
});
```

### Request/Response Interceptors

You can use interceptors to modify requests and responses:

```js
const api = createApi({
  baseUrl: 'https://api.example.com',
  
  // Request interceptor
  onRequest: (url, options) => {
    // Add an authorization header
    options.headers = options.headers || {};
    options.headers['Authorization'] = `Bearer ${getToken()}`;
    
    return { url, options };
  },
  
  // Response interceptor
  onResponse: (response, request) => {
    // Transform the response
    if (response.data) {
      return response.data;
    }
    
    return response;
  },
  
  // Error interceptor
  onError: (error, request) => {
    // Handle authentication errors
    if (error.status === 401) {
      redirectToLogin();
    }
    
    // Log the error
    logError(error, request);
  }
});
```

### Combining with State Management

You can combine the API client with the state management system:

```js
import { createStore, createApi } from '@kalxjs/core';

// Create an API client
const api = createApi({
  baseUrl: 'https://api.example.com'
});

// Create a store
const store = createStore({
  state: {
    users: [],
    loading: false,
    error: null
  },
  mutations: {
    setUsers: (state, users) => state.users = users,
    setLoading: (state, loading) => state.loading = loading,
    setError: (state, error) => state.error = error
  },
  actions: {
    async fetchUsers({ commit }) {
      commit('setLoading', true);
      commit('setError', null);
      
      try {
        const users = await api.get('/users');
        commit('setUsers', users);
      } catch (error) {
        commit('setError', error.message);
      } finally {
        commit('setLoading', false);
      }
    }
  }
});
```