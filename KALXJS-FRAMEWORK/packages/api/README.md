# @kalxjs/api

API integration utilities for KalxJs framework.

## Installation

```bash
npm install @kalxjs/api
```

## Usage

```javascript
import { useApi } from '@kalxjs/api';

// Create an API instance
const api = useApi({
  baseUrl: 'https://api.example.com',
  headers: {
    'Authorization': 'Bearer token'
  },
  timeout: 5000
});

// Make requests
async function fetchData() {
  try {
    // GET request
    const users = await api.get('/users');
    
    // POST request
    const newUser = await api.post('/users', { name: 'John', email: 'john@example.com' });
    
    // PUT request
    const updatedUser = await api.put('/users/1', { name: 'John Updated' });
    
    // DELETE request
    await api.delete('/users/1');
    
  } catch (error) {
    console.error('API Error:', error);
  }
}

// Access reactive state
console.log(api.isLoading.value); // Check if a request is in progress
console.log(api.error.value);     // Check if there was an error
```

## Features

- Reactive state management
- Request cancellation
- Timeout handling
- Automatic JSON parsing
- Convenience methods for common HTTP verbs
- Error handling

## API Reference

### useApi(options)

Creates an API instance with the provided options.

#### Options

- `baseUrl` - Base URL for all requests
- `headers` - Default headers for all requests
- `timeout` - Request timeout in milliseconds
- `onError` - Global error handler function

#### Returns

An object containing:

- `isLoading` - Reactive reference indicating if a request is in progress
- `error` - Reactive reference containing the last error
- `hasError` - Computed property indicating if there is an error
- `request(config)` - Method to make a custom request
- `get(url, config)` - Method to make a GET request
- `post(url, data, config)` - Method to make a POST request
- `put(url, data, config)` - Method to make a PUT request
- `patch(url, data, config)` - Method to make a PATCH request
- `delete(url, config)` - Method to make a DELETE request
- `abort(key)` - Method to abort a specific request
- `abortAll()` - Method to abort all ongoing requests

## License

MIT