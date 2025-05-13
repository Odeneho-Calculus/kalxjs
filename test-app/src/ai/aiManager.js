import { createAIManager, configure, generateText as aiGenerateText, useAI } from '@kalxjs/ai';

// Helper function to get environment variables in different environments
const getEnvVar = (name) => {
  // For Vite
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[name] || '';
  }
  // For webpack
  else if (typeof process !== 'undefined' && process.env) {
    return process.env[name] || '';
  }
  return '';
};

// Get API key from environment
const apiKey = getEnvVar('OPENAI_API_KEY') || '';

// Create AI manager instance
export const aiManager = createAIManager({
  apiKeys: {
    openai: apiKey
  },
  defaultOptions: {
    temperature: 0.7,
    max_length: 1000
  }
});

// Configure the AI service (alternative approach)
configure({
  apiKey: apiKey,
  endpoint: 'https://api.openai.com/v1',
  model: 'gpt-3.5-turbo',
  maxTokens: 1000,
  temperature: 0.7
});

// Helper functions for common AI tasks
export async function generateText(prompt, options = {}) {
  try {
    // Try using the AI manager first
    return await aiManager.generateText({
      prompt,
      model: options.model || 'gpt-3.5-turbo',
      options: {
        temperature: options.temperature || 0.7,
        max_tokens: options.max_length || 100,
        ...options
      }
    });
  } catch (error) {
    // Fall back to direct API if manager fails
    return aiGenerateText(prompt, {
      model: options.model || 'gpt-3.5-turbo',
      maxTokens: options.max_length || 100,
      temperature: options.temperature || 0.7,
      ...options
    });
  }
}

// Create a hook for AI functionality
export function useAIHelper(options = {}) {
  return useAI(options);
}

// Export other AI utilities
export { useAI } from '@kalxjs/ai';