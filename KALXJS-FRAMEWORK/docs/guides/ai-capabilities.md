# AI Capabilities Guide

KalxJS v2.1.14 provides powerful AI integration capabilities that allow you to easily incorporate AI-powered features into your applications. This guide will walk you through how to use these features effectively.

## Overview

The AI module in KalxJS provides a set of utilities for integrating with popular AI services, allowing you to:

- Generate text using large language models
- Analyze text for sentiment and entities
- Summarize content
- Extract information from text
- Configure and manage AI service connections

## Installation

The AI capabilities are available through the `@kalxjs/ai` package, which is an optional dependency of the core package. You can install it separately:

```bash
# Using npm
npm install @kalxjs/ai@1.2.8

# Using yarn
yarn add @kalxjs/ai@1.2.8

# Using pnpm
pnpm add @kalxjs/ai@1.2.8
```

Or you can use it directly from the core package:

```bash
# Using npm
npm install @kalxjs/core@2.1.14

# Using yarn
yarn add @kalxjs/core@2.1.14

# Using pnpm
pnpm add @kalxjs/core@2.1.14
```

## Basic Usage

### Text Generation

Here's a simple example of how to generate text using the OpenAI integration:

```javascript
import { ref } from '@kalxjs/core';
import { useAI } from '@kalxjs/core/ai';
// Or import directly from the AI package
// import { useAI } from '@kalxjs/ai';

export default {
  setup() {
    // Initialize AI with your API key
    const ai = useAI({
      apiKeys: {
        openai: 'your-api-key'
      }
    });
    
    const prompt = ref('');
    const result = ref('');
    
    async function generateText() {
      result.value = await ai.generate(prompt.value);
    }
    
    return {
      prompt,
      result,
      generateText
    };
  }
};
```

### Using the AI Manager

For more advanced usage, you can use the `createAIManager` function:

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
  prompt: 'Write a short story about a robot learning to paint',
  model: 'gpt-4' // Override the default model
});

console.log(text);
```

## Text Analysis Features

### Sentiment Analysis

Analyze the sentiment of text:

```javascript
import { analyzeSentiment } from '@kalxjs/ai';
// Or with the AI manager
// const sentiment = await ai.analyzeSentiment('I love this product!');

const sentiment = await analyzeSentiment('I love this product!');
// Returns: "positive"
```

### Entity Extraction

Extract named entities from text:

```javascript
import { extractEntities } from '@kalxjs/ai';

const entities = await extractEntities('Apple is headquartered in Cupertino, California.');
// Returns: [
//   { entity: "Apple", type: "ORGANIZATION" },
//   { entity: "Cupertino", type: "LOCATION" },
//   { entity: "California", type: "LOCATION" }
// ]
```

### Text Summarization

Summarize long text:

```javascript
import { summarize } from '@kalxjs/ai';

const summary = await summarize(longText, { maxLength: 100 });
// Returns a summarized version of the text
```

## Advanced Usage

### Configuration Options

You can configure the AI module with various options:

```javascript
import { configure } from '@kalxjs/ai';

configure({
  apiKey: 'your-api-key',
  endpoint: 'https://api.openai.com/v1',
  model: 'gpt-4',
  maxTokens: 2000,
  temperature: 0.5
});
```

### Environment Variables

The AI module can use environment variables for configuration:

```javascript
// In your .env file
OPENAI_API_KEY=your-api-key

// In your code
import { createAIManager, getEnvVar } from '@kalxjs/ai';

const ai = createAIManager();
// The API key will be automatically loaded from the environment variable
```

### Creating an AI-Powered Component

Here's an example of a complete AI-powered component:

```javascript
import { defineComponent, ref, computed } from '@kalxjs/core';
import { useAI } from '@kalxjs/ai';

export default defineComponent({
  setup() {
    const ai = useAI({
      apiKeys: {
        openai: 'your-api-key'
      }
    });
    
    const prompt = ref('');
    const results = ref([]);
    const isLoading = ref(false);
    const error = ref(null);
    
    const hasResults = computed(() => results.value.length > 0);
    
    async function generateContent() {
      if (!prompt.value) return;
      
      isLoading.value = true;
      error.value = null;
      
      try {
        const result = await ai.generate(prompt.value);
        
        results.value.push({
          prompt: prompt.value,
          response: result,
          timestamp: new Date()
        });
        
        prompt.value = '';
      } catch (err) {
        error.value = err.message || 'An error occurred';
      } finally {
        isLoading.value = false;
      }
    }
    
    function clearResults() {
      results.value = [];
    }
    
    return {
      prompt,
      results,
      isLoading,
      error,
      hasResults,
      generateContent,
      clearResults
    };
  }
});
```

## Error Handling

It's important to handle errors when working with AI services:

```javascript
try {
  const result = await ai.generateText({
    prompt: 'Hello, AI!',
    model: 'gpt-3.5-turbo'
  });
  // Handle successful result
} catch (error) {
  console.error('Error generating text:', error);
  // Handle the error appropriately
}
```

## Best Practices

When using AI capabilities in your KalxJS applications:

1. **Store API keys securely**: Never expose API keys in client-side code. Use environment variables and server-side proxies.

2. **Implement rate limiting**: Add rate limiting to prevent excessive API usage.

3. **Provide fallbacks**: Always have a fallback in case the AI service is unavailable.

4. **Handle loading states**: Show loading indicators during AI operations.

5. **Validate inputs**: Validate user inputs before sending them to AI services.

6. **Cache results**: Cache common AI responses to reduce API calls.

7. **Use appropriate models**: Choose the right model for your use case to balance cost and performance.

8. **Implement retry logic**: Add retry logic for transient errors.

## Current Limitations

The current implementation has some limitations to be aware of:

1. Image generation is not yet fully implemented in version 1.2.8.
2. Only OpenAI is supported as a provider in the current version.
3. Some advanced features mentioned in the API documentation are planned for future releases.

## Conclusion

The AI capabilities in KalxJS make it easy to add powerful AI features to your applications. By following the patterns and practices outlined in this guide, you can create sophisticated AI-powered experiences for your users.

For more information, check out the [AI API Reference](../api/ai.md) and the [AI Examples](../../examples/ai-features).