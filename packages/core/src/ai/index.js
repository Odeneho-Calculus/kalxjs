// @kalxjs/core - AI-powered components

/**
 * AI Model types supported by KalxJS
 */
export const AI_MODEL_TYPES = {
    TEXT: 'text',
    IMAGE: 'image',
    AUDIO: 'audio',
    VIDEO: 'video',
    MULTIMODAL: 'multimodal'
};

/**
 * Default AI providers configuration
 */
const DEFAULT_PROVIDERS = {
    openai: {
        baseUrl: 'https://api.openai.com/v1',
        models: {
            [AI_MODEL_TYPES.TEXT]: ['gpt-3.5-turbo', 'gpt-4'],
            [AI_MODEL_TYPES.IMAGE]: ['dall-e-3'],
            [AI_MODEL_TYPES.AUDIO]: ['whisper-1'],
            [AI_MODEL_TYPES.MULTIMODAL]: ['gpt-4-vision']
        }
    },
    anthropic: {
        baseUrl: 'https://api.anthropic.com/v1',
        models: {
            [AI_MODEL_TYPES.TEXT]: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']
        }
    },
    huggingface: {
        baseUrl: 'https://api-inference.huggingface.co/models',
        models: {
            [AI_MODEL_TYPES.TEXT]: ['mistralai/Mistral-7B-Instruct-v0.2'],
            [AI_MODEL_TYPES.IMAGE]: ['stabilityai/stable-diffusion-xl-base-1.0'],
            [AI_MODEL_TYPES.AUDIO]: ['openai/whisper-large-v3']
        }
    },
    local: {
        baseUrl: 'http://localhost:11434/api',
        models: {
            [AI_MODEL_TYPES.TEXT]: ['llama3', 'mistral']
        }
    }
};

/**
 * Creates an AI manager for KalxJS
 * @param {Object} options - AI manager options
 * @returns {Object} AI manager
 */
export function createAIManager(options = {}) {
    const {
        providers = DEFAULT_PROVIDERS,
        defaultProvider = 'openai',
        apiKeys = {},
        cache = true,
        cacheSize = 100,
        debug = false
    } = options;

    // Cache for AI responses
    const responseCache = new Map();

    // Active AI sessions
    const activeSessions = new Map();

    /**
     * Logs debug information if debug mode is enabled
     * @param {string} message - Debug message
     * @param {any} data - Additional data to log
     */
    const logDebug = (message, data) => {
        if (debug) {
            console.log(`[KalxJS AI] ${message}`, data);
        }
    };

    /**
     * Generates a cache key for a request
     * @param {Object} params - Request parameters
     * @returns {string} Cache key
     */
    const generateCacheKey = (params) => {
        return JSON.stringify({
            provider: params.provider,
            model: params.model,
            prompt: params.prompt,
            options: params.options
        });
    };

    /**
     * Gets a response from the cache
     * @param {Object} params - Request parameters
     * @returns {any} Cached response or null
     */
    const getCachedResponse = (params) => {
        if (!cache) return null;

        const cacheKey = generateCacheKey(params);
        return responseCache.get(cacheKey) || null;
    };

    /**
     * Caches a response
     * @param {Object} params - Request parameters
     * @param {any} response - Response to cache
     */
    const cacheResponse = (params, response) => {
        if (!cache) return;

        const cacheKey = generateCacheKey(params);

        // Implement LRU cache behavior
        if (responseCache.size >= cacheSize) {
            const firstKey = responseCache.keys().next().value;
            responseCache.delete(firstKey);
        }

        responseCache.set(cacheKey, response);
    };

    /**
     * Gets the API key for a provider
     * @param {string} provider - Provider name
     * @returns {string} API key
     */
    const getApiKey = (provider) => {
        return apiKeys[provider] || '';
    };

    /**
     * Gets the base URL for a provider
     * @param {string} provider - Provider name
     * @returns {string} Base URL
     */
    const getBaseUrl = (provider) => {
        return providers[provider]?.baseUrl || '';
    };

    /**
     * Gets available models for a provider and type
     * @param {string} provider - Provider name
     * @param {string} type - Model type
     * @returns {Array} Available models
     */
    const getAvailableModels = (provider, type) => {
        return providers[provider]?.models[type] || [];
    };

    /**
     * Generates text using an AI model
     * @param {Object} params - Generation parameters
     * @returns {Promise} Generation promise
     */
    const generateText = async (params) => {
        const {
            prompt,
            provider = defaultProvider,
            model = providers[provider]?.models[AI_MODEL_TYPES.TEXT][0],
            options = {},
            stream = false,
            onProgress = null
        } = params;

        // Check cache first
        const cachedResponse = getCachedResponse({
            provider,
            model,
            prompt,
            options
        });

        if (cachedResponse && !stream) {
            logDebug('Using cached response', { provider, model, prompt });
            return cachedResponse;
        }

        // Prepare request based on provider
        let requestUrl, requestBody, requestHeaders;

        switch (provider) {
            case 'openai':
                requestUrl = `${getBaseUrl(provider)}/chat/completions`;
                requestBody = {
                    model,
                    messages: [{ role: 'user', content: prompt }],
                    stream,
                    ...options
                };
                requestHeaders = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getApiKey(provider)}`
                };
                break;

            case 'anthropic':
                requestUrl = `${getBaseUrl(provider)}/messages`;
                requestBody = {
                    model,
                    messages: [{ role: 'user', content: prompt }],
                    stream,
                    ...options
                };
                requestHeaders = {
                    'Content-Type': 'application/json',
                    'x-api-key': getApiKey(provider),
                    'anthropic-version': '2023-06-01'
                };
                break;

            case 'huggingface':
                requestUrl = `${getBaseUrl(provider)}/${model}`;
                requestBody = {
                    inputs: prompt,
                    ...options
                };
                requestHeaders = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getApiKey(provider)}`
                };
                break;

            case 'local':
                requestUrl = `${getBaseUrl(provider)}/generate`;
                requestBody = {
                    model,
                    prompt,
                    stream,
                    ...options
                };
                requestHeaders = {
                    'Content-Type': 'application/json'
                };
                break;

            default:
                throw new Error(`Unsupported AI provider: ${provider}`);
        }

        logDebug('Generating text', { provider, model, prompt });

        // Handle streaming responses
        if (stream && onProgress) {
            const response = await fetch(requestUrl, {
                method: 'POST',
                headers: requestHeaders,
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`AI request failed: ${response.status} ${response.statusText}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let fullResponse = '';

            // Create a session ID for this stream
            const sessionId = Date.now().toString();
            activeSessions.set(sessionId, { reader, controller: new AbortController() });

            try {
                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        break;
                    }

                    buffer += decoder.decode(value, { stream: true });

                    // Process the buffer based on provider format
                    let chunks;

                    switch (provider) {
                        case 'openai':
                            chunks = buffer.split('data: ').filter(chunk => chunk.trim() !== '' && chunk !== '[DONE]');
                            buffer = chunks.pop() || '';

                            for (const chunk of chunks) {
                                try {
                                    const data = JSON.parse(chunk);
                                    const content = data.choices[0]?.delta?.content || '';
                                    fullResponse += content;
                                    onProgress(content, fullResponse);
                                } catch (e) {
                                    // Ignore parsing errors in chunks
                                }
                            }
                            break;

                        case 'anthropic':
                            chunks = buffer.split('\n\n').filter(chunk => chunk.trim() !== '');
                            buffer = chunks.pop() || '';

                            for (const chunk of chunks) {
                                if (chunk.startsWith('event: content_block_delta')) {
                                    try {
                                        const dataLine = chunk.split('\n').find(line => line.startsWith('data: '));
                                        if (dataLine) {
                                            const data = JSON.parse(dataLine.slice(6));
                                            const content = data.delta?.text || '';
                                            fullResponse += content;
                                            onProgress(content, fullResponse);
                                        }
                                    } catch (e) {
                                        // Ignore parsing errors in chunks
                                    }
                                }
                            }
                            break;

                        case 'local':
                            chunks = buffer.split('\n').filter(chunk => chunk.trim() !== '');
                            buffer = chunks.pop() || '';

                            for (const chunk of chunks) {
                                try {
                                    const data = JSON.parse(chunk);
                                    const content = data.response || '';
                                    fullResponse += content;
                                    onProgress(content, fullResponse);
                                } catch (e) {
                                    // Ignore parsing errors in chunks
                                }
                            }
                            break;

                        default:
                            // For providers without streaming support
                            fullResponse = buffer;
                            onProgress(buffer, buffer);
                            buffer = '';
                    }
                }

                // Cache the full response
                cacheResponse({
                    provider,
                    model,
                    prompt,
                    options
                }, fullResponse);

                return fullResponse;
            } finally {
                activeSessions.delete(sessionId);
            }
        } else {
            // Non-streaming request
            const response = await fetch(requestUrl, {
                method: 'POST',
                headers: requestHeaders,
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`AI request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // Extract text based on provider
            let result;

            switch (provider) {
                case 'openai':
                    result = data.choices[0]?.message?.content || '';
                    break;

                case 'anthropic':
                    result = data.content[0]?.text || '';
                    break;

                case 'huggingface':
                    result = data[0]?.generated_text || data.generated_text || '';
                    break;

                case 'local':
                    result = data.response || '';
                    break;

                default:
                    result = JSON.stringify(data);
            }

            // Cache the response
            cacheResponse({
                provider,
                model,
                prompt,
                options
            }, result);

            return result;
        }
    };

    /**
     * Generates an image using an AI model
     * @param {Object} params - Generation parameters
     * @returns {Promise} Generation promise
     */
    const generateImage = async (params) => {
        const {
            prompt,
            provider = defaultProvider,
            model = providers[provider]?.models[AI_MODEL_TYPES.IMAGE][0],
            options = {}
        } = params;

        // Check cache first
        const cachedResponse = getCachedResponse({
            provider,
            model,
            prompt,
            options
        });

        if (cachedResponse) {
            logDebug('Using cached response', { provider, model, prompt });
            return cachedResponse;
        }

        // Prepare request based on provider
        let requestUrl, requestBody, requestHeaders;

        switch (provider) {
            case 'openai':
                requestUrl = `${getBaseUrl(provider)}/images/generations`;
                requestBody = {
                    model,
                    prompt,
                    n: options.n || 1,
                    size: options.size || '1024x1024',
                    ...options
                };
                requestHeaders = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getApiKey(provider)}`
                };
                break;

            case 'huggingface':
                requestUrl = `${getBaseUrl(provider)}/${model}`;
                requestBody = {
                    inputs: prompt,
                    ...options
                };
                requestHeaders = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getApiKey(provider)}`
                };
                break;

            default:
                throw new Error(`Unsupported AI provider for image generation: ${provider}`);
        }

        logDebug('Generating image', { provider, model, prompt });

        const response = await fetch(requestUrl, {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`AI request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Extract image URL based on provider
        let result;

        switch (provider) {
            case 'openai':
                result = data.data[0]?.url || '';
                break;

            case 'huggingface':
                // For Hugging Face, we get base64 image data
                result = `data:image/jpeg;base64,${data.output}`;
                break;

            default:
                result = '';
        }

        // Cache the response
        cacheResponse({
            provider,
            model,
            prompt,
            options
        }, result);

        return result;
    };

    /**
     * Transcribes audio using an AI model
     * @param {Object} params - Transcription parameters
     * @returns {Promise} Transcription promise
     */
    const transcribeAudio = async (params) => {
        const {
            audioData,
            provider = defaultProvider,
            model = providers[provider]?.models[AI_MODEL_TYPES.AUDIO][0],
            options = {}
        } = params;

        // Audio data can't be cached effectively by content

        // Prepare request based on provider
        let requestUrl, requestBody, requestHeaders;

        switch (provider) {
            case 'openai':
                requestUrl = `${getBaseUrl(provider)}/audio/transcriptions`;

                // Create form data
                const formData = new FormData();
                formData.append('model', model);

                // Handle different audio data formats
                if (audioData instanceof Blob) {
                    formData.append('file', audioData, 'audio.webm');
                } else if (audioData instanceof File) {
                    formData.append('file', audioData);
                } else if (typeof audioData === 'string' && audioData.startsWith('data:')) {
                    // Handle base64 data URL
                    const blob = await fetch(audioData).then(r => r.blob());
                    formData.append('file', blob, 'audio.webm');
                } else {
                    throw new Error('Unsupported audio data format');
                }

                // Add additional options
                Object.entries(options).forEach(([key, value]) => {
                    formData.append(key, value);
                });

                requestBody = formData;
                requestHeaders = {
                    'Authorization': `Bearer ${getApiKey(provider)}`
                };
                break;

            case 'huggingface':
                requestUrl = `${getBaseUrl(provider)}/${model}`;

                // Convert audio to appropriate format
                let audioBlob;
                if (audioData instanceof Blob || audioData instanceof File) {
                    audioBlob = audioData;
                } else if (typeof audioData === 'string' && audioData.startsWith('data:')) {
                    audioBlob = await fetch(audioData).then(r => r.blob());
                } else {
                    throw new Error('Unsupported audio data format');
                }

                requestBody = audioBlob;
                requestHeaders = {
                    'Authorization': `Bearer ${getApiKey(provider)}`
                };
                break;

            default:
                throw new Error(`Unsupported AI provider for audio transcription: ${provider}`);
        }

        logDebug('Transcribing audio', { provider, model });

        const response = await fetch(requestUrl, {
            method: 'POST',
            headers: requestHeaders,
            body: requestBody
        });

        if (!response.ok) {
            throw new Error(`AI request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Extract transcription based on provider
        let result;

        switch (provider) {
            case 'openai':
                result = data.text || '';
                break;

            case 'huggingface':
                result = data.text || data.output || '';
                break;

            default:
                result = '';
        }

        return result;
    };

    /**
     * Cancels an active AI session
     * @param {string} sessionId - Session ID to cancel
     */
    const cancelSession = (sessionId) => {
        const session = activeSessions.get(sessionId);

        if (session) {
            if (session.controller) {
                session.controller.abort();
            }

            if (session.reader) {
                try {
                    session.reader.cancel();
                } catch (e) {
                    // Ignore errors when canceling
                }
            }

            activeSessions.delete(sessionId);
            logDebug('Cancelled AI session', { sessionId });
        }
    };

    /**
     * Clears the response cache
     */
    const clearCache = () => {
        responseCache.clear();
        logDebug('Cleared AI response cache');
    };

    return {
        generateText,
        generateImage,
        transcribeAudio,
        cancelSession,
        clearCache,
        getAvailableModels,
        getApiKey,
        setApiKey: (provider, key) => {
            apiKeys[provider] = key;
        }
    };
}

/**
 * Creates a composable for using AI in components
 * @param {Object} options - AI options
 * @returns {Object} AI composable
 */
export function useAI(options = {}) {
    const instance = getCurrentInstance();

    if (!instance) {
        console.warn('[KalxJS AI] useAI() must be called within setup()');
        return null;
    }

    const aiManager = instance.appContext.config.globalProperties.$ai ||
        window.$kalxjs?.ai ||
        createAIManager(options);

    const loading = ref(false);
    const error = ref(null);
    const result = ref(null);

    /**
     * Generates text using an AI model
     * @param {Object} params - Generation parameters
     * @returns {Promise} Generation promise
     */
    const generateText = async (params) => {
        loading.value = true;
        error.value = null;

        try {
            result.value = await aiManager.generateText(params);
            return result.value;
        } catch (err) {
            error.value = err.message;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Generates an image using an AI model
     * @param {Object} params - Generation parameters
     * @returns {Promise} Generation promise
     */
    const generateImage = async (params) => {
        loading.value = true;
        error.value = null;

        try {
            result.value = await aiManager.generateImage(params);
            return result.value;
        } catch (err) {
            error.value = err.message;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Transcribes audio using an AI model
     * @param {Object} params - Transcription parameters
     * @returns {Promise} Transcription promise
     */
    const transcribeAudio = async (params) => {
        loading.value = true;
        error.value = null;

        try {
            result.value = await aiManager.transcribeAudio(params);
            return result.value;
        } catch (err) {
            error.value = err.message;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    return {
        loading,
        error,
        result,
        generateText,
        generateImage,
        transcribeAudio,
        getAvailableModels: aiManager.getAvailableModels
    };
}

/**
 * Creates an AI plugin for KalxJS
 * @param {Object} options - AI plugin options
 * @returns {Object} AI plugin
 */
export function createAIPlugin(options = {}) {
    return {
        name: 'ai',
        install(app) {
            // Create AI manager
            const aiManager = createAIManager(options);

            // Add AI manager to the app
            app.config = app.config || {};
            app.config.globalProperties = app.config.globalProperties || {};
            app.config.globalProperties.$ai = aiManager;

            // Add AI manager to the window for useAI
            if (typeof window !== 'undefined') {
                window.$kalxjs = window.$kalxjs || {};
                window.$kalxjs.ai = aiManager;
            }

            // Add useAI to the app
            app.useAI = useAI;

            // Register AI components
            app.component('AITextGenerator', {
                props: {
                    provider: {
                        type: String,
                        default: options.defaultProvider || 'openai'
                    },
                    model: String,
                    prompt: String,
                    options: {
                        type: Object,
                        default: () => ({})
                    },
                    stream: {
                        type: Boolean,
                        default: false
                    },
                    autoGenerate: {
                        type: Boolean,
                        default: false
                    }
                },
                setup(props, { slots, emit }) {
                    const ai = useAI();
                    const generatedText = ref('');
                    const isGenerating = ref(false);
                    const error = ref(null);

                    const generate = async () => {
                        if (isGenerating.value || !props.prompt) return;

                        isGenerating.value = true;
                        error.value = null;
                        generatedText.value = '';

                        try {
                            if (props.stream) {
                                await ai.generateText({
                                    prompt: props.prompt,
                                    provider: props.provider,
                                    model: props.model,
                                    options: props.options,
                                    stream: true,
                                    onProgress: (chunk, fullText) => {
                                        generatedText.value = fullText;
                                        emit('progress', chunk, fullText);
                                    }
                                });
                            } else {
                                const result = await ai.generateText({
                                    prompt: props.prompt,
                                    provider: props.provider,
                                    model: props.model,
                                    options: props.options
                                });

                                generatedText.value = result;
                            }

                            emit('complete', generatedText.value);
                        } catch (err) {
                            error.value = err.message;
                            emit('error', err);
                        } finally {
                            isGenerating.value = false;
                        }
                    };

                    // Auto-generate if enabled
                    watch(() => props.prompt, (newPrompt) => {
                        if (props.autoGenerate && newPrompt) {
                            generate();
                        }
                    }, { immediate: props.autoGenerate });

                    return () => {
                        // Default slot with state
                        if (slots.default) {
                            return slots.default({
                                text: generatedText.value,
                                loading: isGenerating.value,
                                error: error.value,
                                generate
                            });
                        }

                        // Default rendering
                        return h('div', { class: 'ai-text-generator' }, [
                            error.value ? h('div', { class: 'ai-error' }, [error.value]) : null,
                            isGenerating.value ? h('div', { class: 'ai-loading' }, ['Generating...']) : null,
                            generatedText.value ? h('div', { class: 'ai-result' }, [generatedText.value]) : null,
                            h('button', {
                                class: 'ai-generate-button',
                                onClick: generate,
                                disabled: isGenerating.value || !props.prompt
                            }, ['Generate'])
                        ]);
                    };
                }
            });

            app.component('AIImageGenerator', {
                props: {
                    provider: {
                        type: String,
                        default: options.defaultProvider || 'openai'
                    },
                    model: String,
                    prompt: String,
                    options: {
                        type: Object,
                        default: () => ({})
                    },
                    autoGenerate: {
                        type: Boolean,
                        default: false
                    }
                },
                setup(props, { slots, emit }) {
                    const ai = useAI();
                    const imageUrl = ref('');
                    const isGenerating = ref(false);
                    const error = ref(null);

                    const generate = async () => {
                        if (isGenerating.value || !props.prompt) return;

                        isGenerating.value = true;
                        error.value = null;

                        try {
                            const result = await ai.generateImage({
                                prompt: props.prompt,
                                provider: props.provider,
                                model: props.model,
                                options: props.options
                            });

                            imageUrl.value = result;
                            emit('complete', result);
                        } catch (err) {
                            error.value = err.message;
                            emit('error', err);
                        } finally {
                            isGenerating.value = false;
                        }
                    };

                    // Auto-generate if enabled
                    watch(() => props.prompt, (newPrompt) => {
                        if (props.autoGenerate && newPrompt) {
                            generate();
                        }
                    }, { immediate: props.autoGenerate });

                    return () => {
                        // Default slot with state
                        if (slots.default) {
                            return slots.default({
                                imageUrl: imageUrl.value,
                                loading: isGenerating.value,
                                error: error.value,
                                generate
                            });
                        }

                        // Default rendering
                        return h('div', { class: 'ai-image-generator' }, [
                            error.value ? h('div', { class: 'ai-error' }, [error.value]) : null,
                            isGenerating.value ? h('div', { class: 'ai-loading' }, ['Generating...']) : null,
                            imageUrl.value ? h('img', { class: 'ai-result', src: imageUrl.value, alt: props.prompt }) : null,
                            h('button', {
                                class: 'ai-generate-button',
                                onClick: generate,
                                disabled: isGenerating.value || !props.prompt
                            }, ['Generate Image'])
                        ]);
                    };
                }
            });
        }
    };
}