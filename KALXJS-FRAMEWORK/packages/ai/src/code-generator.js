/**
 * AI-Powered Code Generator
 * Generates KalxJS components, pages, and code snippets using AI
 */

import { generateText } from './index.js';

/**
 * Generate a KalxJS component from natural language description
 * @param {string} description - Natural language description of the component
 * @param {Object} options - Generation options
 * @returns {Promise<string>} Generated component code
 */
export async function generateComponent(description, options = {}) {
    const {
        style = 'composition', // 'composition' or 'options'
        typescript = false,
        includeTests = false
    } = options;

    const prompt = `Generate a KalxJS component using ${style} API${typescript ? ' with TypeScript' : ''}:

Description: ${description}

Requirements:
- Use modern KalxJS patterns
- Include proper prop validation
- Add comments for clarity
- Follow KalxJS best practices
${includeTests ? '- Include basic unit tests' : ''}

Output only the code without explanations.`;

    return await generateText(prompt, { maxTokens: 2000 });
}

/**
 * Generate a KalxJS page component
 * @param {string} description - Page description
 * @param {Object} options - Generation options
 * @returns {Promise<string>} Generated page code
 */
export async function generatePage(description, options = {}) {
    const {
        includeRouter = true,
        includeState = false,
        layout = 'default'
    } = options;

    const prompt = `Generate a KalxJS page component:

Description: ${description}

Requirements:
- Full page structure with layout
${includeRouter ? '- Include router navigation' : ''}
${includeState ? '- Include state management' : ''}
- Use ${layout} layout
- Responsive design
- Accessibility features

Output only the code.`;

    return await generateText(prompt, { maxTokens: 3000 });
}

/**
 * Generate a composable/hook
 * @param {string} description - Composable description
 * @param {Object} options - Generation options
 * @returns {Promise<string>} Generated composable code
 */
export async function generateComposable(description, options = {}) {
    const prompt = `Generate a KalxJS composable function:

Description: ${description}

Requirements:
- Use composition API
- Return reactive values and methods
- Include proper cleanup
- Add JSDoc comments

Output only the code.`;

    return await generateText(prompt, { maxTokens: 1500 });
}

/**
 * Generate a store module
 * @param {string} description - Store description
 * @param {Object} options - Generation options
 * @returns {Promise<string>} Generated store code
 */
export async function generateStore(description, options = {}) {
    const {
        persistence = false,
        devtools = true
    } = options;

    const prompt = `Generate a KalxJS store module:

Description: ${description}

Requirements:
- Use KalxJS store API
- Include state, getters, and actions
${persistence ? '- Add persistence support' : ''}
${devtools ? '- Enable devtools integration' : ''}
- Type-safe design

Output only the code.`;

    return await generateText(prompt, { maxTokens: 2000 });
}

/**
 * Generate test cases for existing code
 * @param {string} code - Existing code to test
 * @param {Object} options - Generation options
 * @returns {Promise<string>} Generated test code
 */
export async function generateTests(code, options = {}) {
    const {
        framework = 'jest',
        coverage = 'unit'
    } = options;

    const prompt = `Generate ${coverage} tests for the following KalxJS code using ${framework}:

\`\`\`javascript
${code}
\`\`\`

Requirements:
- Comprehensive test coverage
- Test edge cases
- Mock dependencies appropriately
- Follow testing best practices

Output only the test code.`;

    return await generateText(prompt, { maxTokens: 2500 });
}

/**
 * Convert natural language to component
 * @param {string} naturalLanguage - Natural language description
 * @param {Object} options - Conversion options
 * @returns {Promise<Object>} Component structure
 */
export async function naturalLanguageToComponent(naturalLanguage, options = {}) {
    const code = await generateComponent(naturalLanguage, options);

    return {
        code,
        language: options.typescript ? 'typescript' : 'javascript',
        type: 'component',
        suggestions: await generateSuggestions(code)
    };
}

/**
 * Generate improvement suggestions for code
 * @param {string} code - Code to analyze
 * @returns {Promise<Array>} Array of suggestions
 */
export async function generateSuggestions(code) {
    const prompt = `Analyze this KalxJS code and provide improvement suggestions:

\`\`\`javascript
${code}
\`\`\`

Provide suggestions for:
1. Performance optimizations
2. Best practices
3. Accessibility improvements
4. Code organization

Return as JSON array with format: [{"type": "performance", "suggestion": "...", "priority": "high|medium|low"}]`;

    const result = await generateText(prompt, { maxTokens: 1500 });

    try {
        return JSON.parse(result);
    } catch (error) {
        return [];
    }
}

export default {
    generateComponent,
    generatePage,
    generateComposable,
    generateStore,
    generateTests,
    naturalLanguageToComponent,
    generateSuggestions
};