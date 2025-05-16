/**
 * @jest-environment jsdom
 */
import {
    configure,
    generateText,
    useAI,
    createAIManager,
    analyzeSentiment,
    extractEntities,
    summarize,
    getEnvVar
} from '@kalxjs/ai';

// Mock fetch globally
global.fetch = jest.fn();

describe('@kalxjs/ai', () => {
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Setup default successful response
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                choices: [{ message: { content: 'AI response' } }]
            }),
            headers: {
                get: () => 'application/json'
            }
        });
    });

    describe('getEnvVar', () => {
        test('should get environment variable from process.env', () => {
            // Setup
            const originalEnv = process.env;
            process.env = { TEST_VAR: 'test-value' };

            // Test
            const result = getEnvVar('TEST_VAR');

            // Assert
            expect(result).toBe('test-value');

            // Cleanup
            process.env = originalEnv;
        });

        test('should return empty string if environment variable not found', () => {
            const result = getEnvVar('NON_EXISTENT_VAR');
            expect(result).toBe('');
        });
    });

    describe('configure', () => {
        test('should update configuration with provided options', () => {
            // Setup
            const options = {
                apiKey: 'test-api-key',
                endpoint: 'https://test-endpoint.com',
                model: 'test-model',
                maxTokens: 500,
                temperature: 0.5
            };

            // Test
            configure(options);

            // Assert - we'll verify through generateText
            expect(() => generateText('test')).not.toThrow();
            expect(fetch).toHaveBeenCalledWith(
                'https://test-endpoint.com/chat/completions',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer test-api-key'
                    }),
                    body: expect.stringContaining('"model":"test-model"')
                })
            );
        });
    });

    describe('generateText', () => {
        test('should throw error if API key not configured', async () => {
            // Setup - configure with null API key
            configure({ apiKey: null });

            // Test & Assert
            await expect(generateText('test prompt')).rejects.toThrow('API key not configured');
        });

        test('should make request with correct parameters', async () => {
            // Setup
            configure({
                apiKey: 'test-api-key',
                endpoint: 'https://api.test.com',
                model: 'gpt-test',
                maxTokens: 100,
                temperature: 0.3
            });

            // Test
            await generateText('test prompt');

            // Assert
            expect(fetch).toHaveBeenCalledWith(
                'https://api.test.com/chat/completions',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer test-api-key'
                    }),
                    body: expect.stringContaining('"model":"gpt-test"')
                })
            );

            // Verify body content
            const bodyContent = JSON.parse(fetch.mock.calls[0][1].body);
            expect(bodyContent).toEqual({
                model: 'gpt-test',
                messages: [{ role: 'user', content: 'test prompt' }],
                max_tokens: 100,
                temperature: 0.3
            });
        });

        test('should override config with options', async () => {
            // Setup
            configure({
                apiKey: 'test-api-key',
                model: 'default-model',
                maxTokens: 100,
                temperature: 0.3
            });

            // Test
            await generateText('test prompt', {
                model: 'override-model',
                maxTokens: 200,
                temperature: 0.8
            });

            // Assert - verify body content
            const bodyContent = JSON.parse(fetch.mock.calls[0][1].body);
            expect(bodyContent).toEqual({
                model: 'override-model',
                messages: [{ role: 'user', content: 'test prompt' }],
                max_tokens: 200,
                temperature: 0.8
            });
        });

        test('should handle API error responses', async () => {
            // Setup
            configure({ apiKey: 'test-api-key' });

            // Mock error response
            global.fetch.mockResolvedValueOnce({
                ok: false,
                json: async () => ({
                    error: { message: 'API error message' }
                }),
                statusText: 'Bad Request'
            });

            // Mock console.error to prevent test output pollution
            const originalConsoleError = console.error;
            console.error = jest.fn();

            try {
                // Test & Assert
                await expect(generateText('test prompt')).rejects.toThrow('AI service error');
            } finally {
                // Restore console.error
                console.error = originalConsoleError;
            }
        });

        test('should handle network errors', async () => {
            // Setup
            configure({ apiKey: 'test-api-key' });

            // Mock network error
            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            // Mock console.error to prevent test output pollution
            const originalConsoleError = console.error;
            console.error = jest.fn();

            try {
                // Test & Assert
                await expect(generateText('test prompt')).rejects.toThrow('Network error');
            } finally {
                // Restore console.error
                console.error = originalConsoleError;
            }
        });

        test('should return trimmed content from response', async () => {
            // Setup
            configure({ apiKey: 'test-api-key' });

            // Mock response with specific content
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: '  trimmed response  ' } }]
                })
            });

            // Test
            const result = await generateText('test prompt');

            // Assert
            expect(result).toBe('trimmed response');
        });
    });

    describe('useAI', () => {
        test('should return hook with correct methods', () => {
            // Test
            const hook = useAI();

            // Assert
            expect(hook).toHaveProperty('generate');
            expect(hook).toHaveProperty('loading');
            expect(hook).toHaveProperty('error');
            expect(hook).toHaveProperty('result');
            expect(typeof hook.generate).toBe('function');
            expect(typeof hook.loading).toBe('function');
            expect(typeof hook.error).toBe('function');
            expect(typeof hook.result).toBe('function');
        });

        test('should track loading state during generation', async () => {
            // Setup
            configure({ apiKey: 'test-api-key' });
            const hook = useAI();

            // Create a delayed response
            let resolvePromise;
            const delayedPromise = new Promise(resolve => {
                resolvePromise = resolve;
            });

            global.fetch.mockImplementationOnce(() => delayedPromise);

            // Start generation (don't await)
            const generatePromise = hook.generate('test prompt');

            // Assert loading state is true during generation
            expect(hook.loading()).toBe(true);

            // Resolve the fetch promise
            resolvePromise({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'response' } }]
                })
            });

            // Wait for generation to complete
            await generatePromise;

            // Assert loading state is false after generation
            expect(hook.loading()).toBe(false);
            expect(hook.result()).toBe('response');
            expect(hook.error()).toBe(null);
        });

        test('should handle errors in generate method', async () => {
            // Setup
            configure({ apiKey: 'test-api-key' });
            const hook = useAI();

            // Mock error
            global.fetch.mockRejectedValueOnce(new Error('Test error'));

            // Mock console.error to prevent test output pollution
            const originalConsoleError = console.error;
            console.error = jest.fn();

            try {
                // Test
                try {
                    await hook.generate('test prompt');
                    // Use expect().fail() instead of fail()
                    expect('This should not be reached').toBe('Error should have been thrown');
                } catch (error) {
                    // Assert
                    expect(error.message).toBe('Test error');
                    expect(hook.loading()).toBe(false);
                    expect(hook.error()).toEqual(error);
                    expect(hook.result()).toBe(null);
                }
            } finally {
                // Restore console.error
                console.error = originalConsoleError;
            }
        });
    });

    describe('createAIManager', () => {
        test('should configure with API key from options', () => {
            // Setup
            const manager = createAIManager({
                apiKeys: { openai: 'test-api-key' },
                defaultOptions: {
                    model: 'test-model',
                    max_length: 500,
                    temperature: 0.5
                }
            });

            // Test
            expect(manager).toHaveProperty('generateText');
            expect(manager).toHaveProperty('generateImage');
            expect(manager).toHaveProperty('analyzeSentiment');
            expect(manager).toHaveProperty('extractEntities');
            expect(manager).toHaveProperty('summarize');

            // Verify configuration through a call
            manager.generateText({ prompt: 'test' });

            // Assert
            expect(fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer test-api-key'
                    }),
                    body: expect.stringContaining('"model":"test-model"')
                })
            );
        });

        test('should use environment variable for API key if not in options', () => {
            // Setup
            const originalEnv = process.env;
            process.env = { OPENAI_API_KEY: 'env-api-key' };

            // Test
            const manager = createAIManager();
            manager.generateText({ prompt: 'test' });

            // Assert
            expect(fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer env-api-key'
                    })
                })
            );

            // Cleanup
            process.env = originalEnv;
        });

        test('generateImage should throw not implemented error', async () => {
            // Setup
            const manager = createAIManager({ apiKeys: { openai: 'test-api-key' } });

            // Test & Assert
            await expect(manager.generateImage({ prompt: 'test' }))
                .rejects.toThrow('Image generation not implemented');
        });
    });

    describe('analyzeSentiment', () => {
        test('should call generateText with correct prompt', async () => {
            // Setup
            configure({ apiKey: 'test-api-key' });

            // Test
            await analyzeSentiment('This is a test text');

            // Assert
            const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
            expect(requestBody.messages[0].content).toContain('Analyze the sentiment');
            expect(requestBody.messages[0].content).toContain('This is a test text');
        });
    });

    describe('extractEntities', () => {
        test('should call generateText with correct prompt', async () => {
            // Setup
            configure({ apiKey: 'test-api-key' });

            // Test
            await extractEntities('John Doe works at Acme Corp');

            // Assert
            const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
            expect(requestBody.messages[0].content).toContain('Extract named entities');
            expect(requestBody.messages[0].content).toContain('John Doe works at Acme Corp');
        });

        test('should parse JSON response', async () => {
            // Setup
            configure({ apiKey: 'test-api-key' });

            // Mock JSON response
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            content: '[{"entity":"John Doe","type":"PERSON"},{"entity":"Acme Corp","type":"ORGANIZATION"}]'
                        }
                    }]
                })
            });

            // Mock console.error to prevent test output pollution
            const originalConsoleError = console.error;
            console.error = jest.fn();

            try {
                // Test
                const result = await extractEntities('John Doe works at Acme Corp');

                // Assert
                expect(result).toEqual([
                    { entity: 'John Doe', type: 'PERSON' },
                    { entity: 'Acme Corp', type: 'ORGANIZATION' }
                ]);
            } finally {
                // Restore console.error
                console.error = originalConsoleError;
            }
        });

        test('should handle invalid JSON response', async () => {
            // Setup
            configure({ apiKey: 'test-api-key' });

            // Mock invalid JSON response
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            content: 'Not valid JSON'
                        }
                    }]
                })
            });

            // Mock console.error
            const originalConsoleError = console.error;
            console.error = jest.fn();

            // Test
            const result = await extractEntities('John Doe works at Acme Corp');

            // Assert
            expect(result).toEqual([]);
            expect(console.error).toHaveBeenCalled();

            // Restore console.error
            console.error = originalConsoleError;
        });
    });

    describe('summarize', () => {
        test('should call generateText with correct prompt and default maxLength', async () => {
            // Setup
            configure({ apiKey: 'test-api-key' });

            // Test
            await summarize('This is a long text that needs to be summarized');

            // Assert
            const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
            expect(requestBody.messages[0].content).toContain('Summarize the following text in 100 words or less');
            expect(requestBody.messages[0].content).toContain('This is a long text that needs to be summarized');
        });

        test('should use custom maxLength if provided', async () => {
            // Setup
            configure({ apiKey: 'test-api-key' });

            // Test
            await summarize('This is a long text that needs to be summarized', { maxLength: 50 });

            // Assert
            const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
            expect(requestBody.messages[0].content).toContain('Summarize the following text in 50 words or less');
        });
    });
});