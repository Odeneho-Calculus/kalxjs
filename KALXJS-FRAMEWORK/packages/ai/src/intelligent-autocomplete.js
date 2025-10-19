/**
 * Intelligent Autocomplete
 * AI-powered code completion and suggestions
 */

import { generateText } from './index.js';

/**
 * Get intelligent code completions
 * @param {Object} context - Code context
 * @returns {Promise<Array>} Completion suggestions
 */
export async function getCompletions(context) {
    const {
        code,
        cursorPosition,
        fileType = 'javascript',
        currentLine,
        previousLines = [],
        imports = []
    } = context;

    const prompt = `Provide intelligent code completions for KalxJS:

Current file type: ${fileType}
Imports: ${imports.join(', ')}

Previous lines:
${previousLines.slice(-5).join('\n')}

Current line (cursor at |): ${currentLine}

Full context:
\`\`\`javascript
${code}
\`\`\`

Suggest:
1. Method/property completions
2. Variable names
3. Import statements
4. Component props
5. KalxJS API usage
6. Common patterns

Return as JSON array: [{
  "text": "completion text",
  "type": "method|property|variable|keyword|snippet",
  "description": "...",
  "documentation": "...",
  "priority": 0-100
}]

Limit to top 10 suggestions.`;

    const result = await generateText(prompt, { maxTokens: 1500 });

    try {
        const completions = JSON.parse(result);
        return completions.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    } catch (error) {
        console.error('Error parsing completions:', error);
        return [];
    }
}

/**
 * Get smart imports suggestions
 * @param {string} code - Current code
 * @param {Array} availableModules - Available modules
 * @returns {Promise<Array>} Import suggestions
 */
export async function suggestImports(code, availableModules = []) {
    const prompt = `Suggest missing imports for this KalxJS code:

\`\`\`javascript
${code}
\`\`\`

Available modules: ${availableModules.join(', ')}

Identify:
1. Used but not imported identifiers
2. Recommended KalxJS imports
3. Optimal import structure

Return as JSON array: [{
  "module": "@kalxjs/...",
  "imports": ["item1", "item2"],
  "type": "named|default|namespace",
  "reason": "..."
}]`;

    const result = await generateText(prompt, { maxTokens: 1000 });

    try {
        return JSON.parse(result);
    } catch (error) {
        return [];
    }
}

/**
 * Complete function implementation
 * @param {string} functionSignature - Function signature
 * @param {string} context - Surrounding code context
 * @returns {Promise<string>} Function implementation
 */
export async function completeFunctionImplementation(functionSignature, context = '') {
    const prompt = `Complete this KalxJS function implementation:

Context:
\`\`\`javascript
${context}
\`\`\`

Function to complete:
\`\`\`javascript
${functionSignature}
\`\`\`

Provide:
1. Full implementation
2. Error handling
3. Input validation
4. Return value
5. Comments for complex logic

Return only the function code.`;

    return await generateText(prompt, { maxTokens: 1500 });
}

/**
 * Suggest component props
 * @param {string} componentCode - Component code
 * @returns {Promise<Array>} Prop suggestions
 */
export async function suggestComponentProps(componentCode) {
    const prompt = `Suggest appropriate props for this KalxJS component:

\`\`\`javascript
${componentCode}
\`\`\`

Based on usage and best practices, suggest:
1. Prop names and types
2. Default values
3. Validation rules
4. Optional vs required
5. Documentation

Return as JSON array: [{
  "name": "...",
  "type": "...",
  "required": boolean,
  "default": "...",
  "description": "..."
}]`;

    const result = await generateText(prompt, { maxTokens: 1500 });

    try {
        return JSON.parse(result);
    } catch (error) {
        return [];
    }
}

/**
 * Get context-aware snippets
 * @param {Object} context - Code context
 * @returns {Promise<Array>} Snippet suggestions
 */
export async function getContextualSnippets(context) {
    const { componentType, currentScope, userIntent } = context;

    const prompt = `Suggest code snippets for KalxJS:

Component Type: ${componentType}
Current Scope: ${currentScope}
User Intent: ${userIntent || 'unknown'}

Provide relevant snippets for:
1. Common patterns
2. Best practices
3. Component lifecycle
4. State management
5. Event handling

Return as JSON array: [{
  "name": "...",
  "trigger": "...",
  "code": "...",
  "description": "...",
  "category": "..."
}]`;

    const result = await generateText(prompt, { maxTokens: 2000 });

    try {
        return JSON.parse(result);
    } catch (error) {
        return [];
    }
}

/**
 * Predict next code block
 * @param {string} code - Current code
 * @returns {Promise<Object>} Next code prediction
 */
export async function predictNextCode(code) {
    const prompt = `Predict the next logical code block:

Current code:
\`\`\`javascript
${code}
\`\`\`

Analyze patterns and suggest what typically comes next:
1. Matching closing braces
2. Related functionality
3. Error handling
4. Validation
5. Return statements

Return as JSON: {
  "prediction": "...",
  "confidence": 0-1,
  "explanation": "...",
  "alternatives": [...]
}`;

    const result = await generateText(prompt, { maxTokens: 1000 });

    try {
        return JSON.parse(result);
    } catch (error) {
        return { prediction: '', confidence: 0 };
    }
}

/**
 * Fix syntax errors with suggestions
 * @param {string} code - Code with syntax errors
 * @param {Array} errors - Syntax errors
 * @returns {Promise<Object>} Fix suggestions
 */
export async function fixSyntaxErrors(code, errors) {
    const prompt = `Fix syntax errors in this KalxJS code:

Code:
\`\`\`javascript
${code}
\`\`\`

Errors:
${JSON.stringify(errors, null, 2)}

Provide:
1. Corrected code
2. Explanation of fixes
3. Prevention tips

Return as JSON: {
  "fixedCode": "...",
  "fixes": [{
    "error": "...",
    "fix": "...",
    "explanation": "..."
  }]
}`;

    const result = await generateText(prompt, { maxTokens: 2000 });

    try {
        return JSON.parse(result);
    } catch (error) {
        return { fixedCode: code, fixes: [] };
    }
}

export default {
    getCompletions,
    suggestImports,
    completeFunctionImplementation,
    suggestComponentProps,
    getContextualSnippets,
    predictNextCode,
    fixSyntaxErrors
};