# @kalxjs/ai

AI integration utilities for KalxJS applications.

## Installation

```bash
# Install latest version
npm install @kalxjs/ai@latest

# Install specific version
npm install @kalxjs/ai@x.x.x
```

Current version: 1.2.11

## Usage

### Basic Usage

```javascript
import { configure, generateText } from '@kalxjs/ai';

// Configure the AI service
configure({
  apiKey: 'your-api-key',
  model: 'gpt-3.5-turbo'
});

// Generate text
async function example() {
  const response = await generateText('Write a short poem about programming');
  console.log(response);
}

example();
```

### Component Integration

```javascript
import { useAI } from '@kalxjs/ai';

export default {
  setup() {
    const ai = useAI();
    
    const generateResponse = async () => {
      try {
        const result = await ai.generate('Explain how JavaScript works in 3 sentences');
        console.log(result);
      } catch (error) {
        console.error('AI generation failed:', error);
      }
    };
    
    return {
      generateResponse,
      isLoading: ai.loading,
      error: ai.error,
      result: ai.result
    };
  }
};
```

### Text Analysis

```javascript
import { analyzeSentiment, extractEntities, summarize } from '@kalxjs/ai';

async function analyzeText(text) {
  // Analyze sentiment
  const sentiment = await analyzeSentiment(text);
  console.log('Sentiment:', sentiment);
  
  // Extract entities
  const entities = await extractEntities(text);
  console.log('Entities:', entities);
  
  // Summarize text
  const summary = await summarize(text, { maxLength: 50 });
  console.log('Summary:', summary);
}
```

## API Reference

### configure(options)

Configure the AI service.

**Options:**
- `apiKey` - API key for the AI service
- `endpoint` - API endpoint (default: 'https://api.openai.com/v1')
- `model` - Model to use (default: 'gpt-3.5-turbo')
- `maxTokens` - Maximum tokens to generate (default: 1000)
- `temperature` - Temperature for generation (default: 0.7)

### generateText(prompt, options)

Generate text using the configured AI service.

**Parameters:**
- `prompt` - The prompt to generate from
- `options` - Additional options (same as configure)

**Returns:** Promise resolving to the generated text

### useAI(options)

Create a composable AI hook for use in components.

**Returns:** An object with:
- `generate(prompt, options)` - Function to generate text
- `loading()` - Function that returns the loading state
- `error()` - Function that returns any error
- `result()` - Function that returns the latest result

### analyzeSentiment(text)

Analyze the sentiment of text.

**Returns:** Promise resolving to "positive", "negative", or "neutral"

### extractEntities(text)

Extract named entities from text.

**Returns:** Promise resolving to an array of entity objects

### summarize(text, options)

Summarize text.

**Options:**
- `maxLength` - Maximum length of the summary in words (default: 100)

**Returns:** Promise resolving to the summarized text

## Advanced Usage

### Using the AI Manager

```javascript
import { createAIManager } from '@kalxjs/ai';

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

### Environment Variables

For security reasons, it's recommended to store your API keys in environment variables:

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

## Current Limitations

The current implementation (v1.2.11) has some limitations:

1. Image generation is not yet fully implemented
2. Only OpenAI is supported as a provider
3. Advanced features like streaming responses are not directly supported
4. No built-in caching mechanism for API responses

## Version History

See [CHANGELOG.md](./CHANGELOG.md) for a detailed version history.

## License

MIT