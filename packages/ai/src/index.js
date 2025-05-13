/**
 * KalxJS AI Module
 * Provides utilities for integrating AI capabilities into KalxJS applications
 */

/**
 * Configuration for AI services
 * @type {Object}
 */
let config = {
    apiKey: null,
    endpoint: 'https://api.openai.com/v1',
    model: 'gpt-3.5-turbo',
    maxTokens: 1000,
    temperature: 0.7
};

/**
 * Configure AI services
 * @param {Object} options - Configuration options
 * @param {string} options.apiKey - API key for the AI service
 * @param {string} options.endpoint - API endpoint
 * @param {string} options.model - Model to use
 * @param {number} options.maxTokens - Maximum tokens to generate
 * @param {number} options.temperature - Temperature for generation
 */
export function configure(options = {}) {
    config = { ...config, ...options };
}

/**
 * Generate text using the configured AI service
 * @param {string} prompt - The prompt to generate from
 * @param {Object} options - Additional options
 * @returns {Promise<string>} Generated text
 */
export async function generateText(prompt, options = {}) {
    if (!config.apiKey) {
        throw new Error('API key not configured. Call configure() with your API key first.');
    }

    const requestOptions = {
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
    };

    try {
        const response = await fetch(`${config.endpoint}/chat/completions`, requestOptions);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`AI service error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error generating text:', error);
        throw error;
    }
}

/**
 * Create a composable AI hook for use in components
 * @param {Object} options - Hook options
 * @returns {Object} AI hook
 */
export function useAI(options = {}) {
    let loading = false;
    let error = null;
    let result = null;

    const generate = async (prompt, genOptions = {}) => {
        loading = true;
        error = null;

        try {
            result = await generateText(prompt, { ...options, ...genOptions });
            return result;
        } catch (err) {
            error = err;
            throw err;
        } finally {
            loading = false;
        }
    };

    return {
        generate,
        loading: () => loading,
        error: () => error,
        result: () => result
    };
}

/**
 * Creates an AI manager for KalxJS applications
 * @param {Object} options - AI manager options
 * @returns {Object} AI manager instance with methods for AI operations
 */
export function createAIManager(options = {}) {
    // Configure with provided options
    configure(options.apiKeys?.openai ? {
        apiKey: options.apiKeys.openai,
        model: options.defaultOptions?.model || 'gpt-3.5-turbo',
        maxTokens: options.defaultOptions?.max_length || 1000,
        temperature: options.defaultOptions?.temperature || 0.7
    } : options);

    return {
        /**
         * Generate text using AI
         * @param {Object} params - Text generation parameters
         * @param {string} params.prompt - The prompt to generate from
         * @param {string} params.model - Model to use (optional)
         * @param {string} params.provider - Provider to use (optional)
         * @param {Object} params.options - Additional options (optional)
         * @returns {Promise<string>} Generated text
         */
        generateText: async ({ prompt, model, provider, options = {} }) => {
            return generateText(prompt, {
                model: model || options.model || 'gpt-3.5-turbo',
                ...options
            });
        },

        /**
         * Generate an image using AI
         * @param {Object} params - Image generation parameters
         * @param {string} params.prompt - The prompt to generate from
         * @param {string} params.model - Model to use (optional)
         * @param {string} params.provider - Provider to use (optional)
         * @param {Object} params.options - Additional options (optional)
         * @returns {Promise<string>} Generated image URL or data
         */
        generateImage: async ({ prompt, model, provider, options = {} }) => {
            // Currently not implemented
            throw new Error('Image generation not implemented in this version');
        },

        /**
         * Analyze sentiment of text
         * @param {string} text - Text to analyze
         * @returns {Promise<string>} Sentiment analysis result
         */
        analyzeSentiment: async (text) => {
            return analyzeSentiment(text);
        },

        /**
         * Extract entities from text
         * @param {string} text - Text to analyze
         * @returns {Promise<Array>} Extracted entities
         */
        extractEntities: async (text) => {
            return extractEntities(text);
        },

        /**
         * Summarize text
         * @param {string} text - Text to summarize
         * @param {Object} options - Summarization options
         * @returns {Promise<string>} Summarized text
         */
        summarize: async (text, options = {}) => {
            return summarize(text, options);
        }
    };
}

/**
 * Analyze sentiment of text
 * @param {string} text - Text to analyze
 * @returns {Promise<Object>} Sentiment analysis
 */
export async function analyzeSentiment(text) {
    return generateText(`Analyze the sentiment of the following text and respond with only "positive", "negative", or "neutral": "${text}"`);
}

/**
 * Extract entities from text
 * @param {string} text - Text to analyze
 * @returns {Promise<Array>} Extracted entities
 */
export async function extractEntities(text) {
    const result = await generateText(
        `Extract named entities from the following text and respond with a JSON array of objects with "entity" and "type" properties: "${text}"`
    );

    try {
        return JSON.parse(result);
    } catch (error) {
        console.error('Error parsing entity extraction result:', error);
        return [];
    }
}

/**
 * Summarize text
 * @param {string} text - Text to summarize
 * @param {Object} options - Summarization options
 * @returns {Promise<string>} Summarized text
 */
export async function summarize(text, options = {}) {
    const maxLength = options.maxLength || 100;
    return generateText(`Summarize the following text in ${maxLength} words or less: "${text}"`);
}

export default {
    configure,
    generateText,
    useAI,
    createAIManager,
    analyzeSentiment,
    extractEntities,
    summarize
};