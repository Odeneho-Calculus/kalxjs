# AI API Reference

This document provides a comprehensive reference for the AI module in KalxJS v2.1.14, which enables AI capabilities in your applications.

## Installation

The AI capabilities are available through the `@kalxjs/ai` package (v1.2.11), which can be installed separately or used through the core package:

```bash
# Install latest version
npm install @kalxjs/ai@latest

# Install specific version
npm install @kalxjs/ai@x.x.x

# Or as part of the core package
npm install @kalxjs/core@latest
```

## Core API

### configure

Configures the AI module with global settings.

```javascript
import { configure } from '@kalxjs/ai';

configure(options);
```

#### Options

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `apiKey` | `String` | API key for the AI service | `null` |
| `endpoint` | `String` | API endpoint | `'https://api.openai.com/v1'` |
| `model` | `String` | Default model to use | `'gpt-3.5-turbo'` |
| `maxTokens` | `Number` | Maximum tokens to generate | `1000` |
| `temperature` | `Number` | Temperature for generation | `0.7` |

Example:

```javascript
import { configure } from '@kalxjs/ai';

configure({
  apiKey: 'your-api-key',
  model: 'gpt-4',
  maxTokens: 2000,
  temperature: 0.5
});
```

### generateText

Generates text using the configured AI service.

```javascript
import { generateText } from '@kalxjs/ai';

const result = await generateText(prompt, options);
```

#### Parameters

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `prompt` | `String` | The prompt to generate from | Yes |
| `options` | `Object` | Additional options | No |

#### Options

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `model` | `String` | Model to use | Value from configure() |
| `maxTokens` | `Number` | Maximum tokens to generate | Value from configure() |
| `temperature` | `Number` | Temperature for generation | Value from configure() |

Example:

```javascript
import { generateText } from '@kalxjs/ai';

const story = await generateText(
  'Write a short story about a robot learning to paint',
  {
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 500
  }
);

console.log(story);
```

### useAI

Creates a composable AI hook for use in components.

```javascript
import { useAI } from '@kalxjs/ai';

const ai = useAI(options);
```

#### Options

| Property | Type | Description |
|----------|------|-------------|
| `apiKeys` | `Object` | API keys for different providers |
| Any options from `configure()` | Various | Override default configuration |

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `generate` | `Function` | Generates text from a prompt |
| `loading` | `Function` | Returns the current loading state |
| `error` | `Function` | Returns any error that occurred |
| `result` | `Function` | Returns the last generated result |

Example:

```javascript
import { useAI } from '@kalxjs/ai';
import { ref } from '@kalxjs/core';

export default {
  setup() {
    const ai = useAI({
      apiKeys: {
        openai: 'your-api-key'
      }
    });
    
    const prompt = ref('');
    const result = ref('');
    
    async function generateText() {
      try {
        result.value = await ai.generate(prompt.value);
      } catch (error) {
        console.error('Error:', error);
      }
    }
    
    return {
      prompt,
      result,
      generateText,
      isLoading: ai.loading
    };
  }
};
```

### createAIManager

Creates an AI manager for KalxJS applications with more advanced features.

```javascript
import { createAIManager } from '@kalxjs/ai';

const ai = createAIManager(options);
```

#### Options

| Property | Type | Description |
|----------|------|-------------|
| `apiKeys` | `Object` | API keys for different providers |
| `defaultOptions` | `Object` | Default options for AI operations |

#### Return Value

An object with the following methods:

| Method | Description |
|--------|-------------|
| `generateText` | Generates text using AI |
| `generateImage` | Generates an image using AI (not implemented in v1.2.11) |
| `analyzeSentiment` | Analyzes sentiment of text |
| `extractEntities` | Extracts entities from text |
| `summarize` | Summarizes text |

Example:

```javascript
import { createAIManager } from '@kalxjs/ai';

const ai = createAIManager({
  apiKeys: {
    openai: 'your-api-key'
  },
  defaultOptions: {
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    max_length: 1000
  }
});

// Generate text
const text = await ai.generateText({
  prompt: 'Write a short story about a robot learning to paint'
});

console.log(text);
```

## Text Analysis Functions

### analyzeSentiment

Analyzes the sentiment of text.

```javascript
import { analyzeSentiment } from '@kalxjs/ai';

const sentiment = await analyzeSentiment(text);
```

Example:

```javascript
const sentiment = await analyzeSentiment('I love this product!');
// Returns: "positive"
```

### extractEntities

Extracts named entities from text.

```javascript
import { extractEntities } from '@kalxjs/ai';

const entities = await extractEntities(text);
```

Example:

```javascript
const entities = await extractEntities('Apple is headquartered in Cupertino, California.');
// Returns: [
//   { entity: "Apple", type: "ORGANIZATION" },
//   { entity: "Cupertino", type: "LOCATION" },
//   { entity: "California", type: "LOCATION" }
// ]
```

### summarize

Summarizes text.

```javascript
import { summarize } from '@kalxjs/ai';

const summary = await summarize(text, options);
```

#### Options

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `maxLength` | `Number` | Maximum length of the summary in words | `100` |

Example:

```javascript
const longText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit..."; // Long text
const summary = await summarize(longText, { maxLength: 50 });
// Returns a summarized version of the text
```

## Utility Functions

### getEnvVar

Helper function to get environment variables in different environments.

```javascript
import { getEnvVar } from '@kalxjs/ai';

const apiKey = getEnvVar('OPENAI_API_KEY');
```

Example:

```javascript
// For Vite or webpack projects
const apiKey = getEnvVar('OPENAI_API_KEY');
console.log(apiKey); // Returns the value of OPENAI_API_KEY environment variable
```

## Error Handling

When using the AI functions, it's important to handle potential errors:

```javascript
import { generateText } from '@kalxjs/ai';

try {
  const result = await generateText('Hello, AI!');
  console.log(result);
} catch (error) {
  if (error.message.includes('API key not configured')) {
    console.error('Please configure your API key first');
  } else if (error.message.includes('rate_limit')) {
    console.error('Rate limit exceeded. Please try again later.');
  } else {
    console.error('Error generating text:', error);
  }
}
```

## Environment Setup

### API Keys

For security reasons, it's recommended to store your API keys in environment variables rather than hardcoding them in your application. The `getEnvVar` utility function helps retrieve environment variables in different environments:

```javascript
import { configure, getEnvVar } from '@kalxjs/ai';

// Get API key from environment variable
const apiKey = getEnvVar('OPENAI_API_KEY');

// Configure the AI service
configure({
  apiKey,
  model: 'gpt-3.5-turbo'
});
```

### Environment Variables in Different Frameworks

#### Vite
```
// .env file
VITE_OPENAI_API_KEY=your-api-key
```

```javascript
// Access with getEnvVar
const apiKey = getEnvVar('VITE_OPENAI_API_KEY');

// Or directly
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
```

#### Node.js/Express
```
// .env file
OPENAI_API_KEY=your-api-key
```

```javascript
// Access with getEnvVar
const apiKey = getEnvVar('OPENAI_API_KEY');

// Or directly
const apiKey = process.env.OPENAI_API_KEY;
```

### Best Practices

1. **API Key Security**: Never expose API keys in client-side code. Use environment variables and server-side proxies when possible.
2. **Error Handling**: Always implement proper error handling for AI operations.
3. **Rate Limiting**: Implement rate limiting to avoid excessive API calls and costs.
4. **User Feedback**: Provide feedback to users during AI operations (loading states, etc.).
5. **Prompt Engineering**: Carefully design prompts for consistent and reliable results.
6. **Content Filtering**: Consider implementing content filtering for user inputs to prevent misuse.

## Integration with KalxJS Components

### Using with Composition API

```javascript
import { defineComponent, ref } from '@kalxjs/core';
import { useAI } from '@kalxjs/ai';

export default defineComponent({
  setup() {
    const ai = useAI({
      apiKeys: {
        openai: 'your-api-key'
      }
    });
    
    const prompt = ref('');
    const result = ref('');
    const isLoading = ref(false);
    const error = ref(null);
    
    async function generateText() {
      if (!prompt.value) return;
      
      isLoading.value = true;
      error.value = null;
      
      try {
        result.value = await ai.generate(prompt.value);
      } catch (err) {
        error.value = err.message;
      } finally {
        isLoading.value = false;
      }
    }
    
    return {
      prompt,
      result,
      isLoading,
      error,
      generateText
    };
  }
});
```

## Advanced Usage Patterns

### Chaining AI Operations

You can chain multiple AI operations together for more complex workflows:

```javascript
import { generateText, analyzeSentiment, summarize } from '@kalxjs/ai';

async function processUserInput(input) {
  // Generate a response
  const response = await generateText(`Respond to: ${input}`);
  
  // Analyze the sentiment of the response
  const sentiment = await analyzeSentiment(response);
  
  // Summarize if the response is too long
  let finalResponse = response;
  if (response.split(' ').length > 100) {
    finalResponse = await summarize(response, { maxLength: 50 });
  }
  
  return {
    originalResponse: response,
    sentiment,
    finalResponse
  };
}
```

### Using the AI Manager

The `createAIManager` function provides a more structured way to use AI capabilities:

```javascript
import { createAIManager } from '@kalxjs/ai';

// Create an AI manager with configuration
const ai = createAIManager({
  apiKeys: {
    openai: 'your-api-key' // Or use environment variables
  },
  defaultOptions: {
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    max_length: 1000
  }
});

// Use the manager for various AI operations
async function processData(text) {
  // Generate text
  const generatedText = await ai.generateText({
    prompt: 'Explain the following concept: ' + text
  });
  
  // Analyze sentiment
  const sentiment = await ai.analyzeSentiment(text);
  
  // Extract entities
  const entities = await ai.extractEntities(text);
  
  // Summarize
  const summary = await ai.summarize(text, { maxLength: 50 });
  
  return {
    generatedText,
    sentiment,
    entities,
    summary
  };
}
```

## Current Limitations

The current implementation (v1.2.11) has some limitations:

1. Image generation is not yet fully implemented (the method exists but throws an error)
2. Only OpenAI is supported as a provider
3. Advanced features like streaming responses are not directly supported
4. No built-in caching mechanism for API responses

## Browser Support

The AI package supports all modern browsers. For older browsers, you may need to include appropriate polyfills for fetch and Promise APIs.

## Implementation Details

The AI package is implemented as a lightweight wrapper around the OpenAI API. Here's how the key functions work:

### Text Generation

The `generateText` function uses the OpenAI Chat Completions API to generate text responses:

```javascript
// Simplified implementation
export async function generateText(prompt, options = {}) {
    // Validate API key
    if (!config.apiKey) {
        throw new Error('API key not configured');
    }

    // Make API request to OpenAI
    const response = await fetch(`${config.endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
            model: options.model || config.model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: options.maxTokens || config.maxTokens,
            temperature: options.temperature || config.temperature
        })
    });

    // Process response
    const data = await response.json();
    return data.choices[0].message.content.trim();
}
```

### Text Analysis Functions

The text analysis functions (`analyzeSentiment`, `extractEntities`, `summarize`) are implemented using prompt engineering with the same underlying `generateText` function:

```javascript
// Sentiment analysis implementation
export async function analyzeSentiment(text) {
    return generateText(
        `Analyze the sentiment of the following text and respond with only "positive", "negative", or "neutral": "${text}"`
    );
}

// Entity extraction implementation
export async function extractEntities(text) {
    const result = await generateText(
        `Extract named entities from the following text and respond with a JSON array of objects with "entity" and "type" properties: "${text}"`
    );
    return JSON.parse(result);
}
```

## Version History

### v1.2.11 (2025-05-15)
- Version bump only

### v1.2.10 (2025-05-14)
- Version bump only

### v1.2.9 (2025-05-14)
- Version bump only

### v1.2.8 (2025-05-13)
- Version bump only

### v1.2.7 (2025-05-13)
- Version bump only

### v1.2.6 (2025-05-13)
- Version bump only

### v1.2.5 (2025-05-12)
- Version bump only

### v1.2.4 (2025-05-12)
- Version bump only

### v1.2.3 (2025-05-12)
- Version bump only

### v1.2.2 (2023-05-15)
- Initial release of the AI package
- Added text generation capabilities
- Added sentiment analysis
- Added entity extraction
- Added text summarization
- Added composable AI hook for components