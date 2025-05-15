# @kalxjs/ai

AI integration utilities for KalxJS applications.

## Installation

```bash
npm install @kalxjs/ai
```

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

## License

MIT