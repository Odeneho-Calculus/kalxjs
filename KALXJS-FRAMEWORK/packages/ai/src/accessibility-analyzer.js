/**
 * AI-Powered Accessibility Analyzer
 * Automatically detects and fixes accessibility issues
 */

import { generateText } from './index.js';

/**
 * Analyze code for accessibility issues
 * @param {string} code - Component code to analyze
 * @param {Object} options - Analysis options
 * @returns {Promise<Object>} Analysis results with issues and fixes
 */
export async function analyzeAccessibility(code, options = {}) {
    const {
        wcagLevel = 'AA', // 'A', 'AA', or 'AAA'
        autoFix = false
    } = options;

    const prompt = `Analyze this KalxJS component for WCAG ${wcagLevel} accessibility issues:

\`\`\`javascript
${code}
\`\`\`

Check for:
1. Missing ARIA labels
2. Keyboard navigation issues
3. Color contrast problems
4. Form accessibility
5. Semantic HTML usage
6. Focus management
7. Screen reader compatibility

Return as JSON: {"issues": [...], "score": 0-100, "fixes": [...]}`;

    const result = await generateText(prompt, { maxTokens: 2000 });

    try {
        const analysis = JSON.parse(result);

        if (autoFix && analysis.fixes && analysis.fixes.length > 0) {
            analysis.fixedCode = await applyAccessibilityFixes(code, analysis.fixes);
        }

        return analysis;
    } catch (error) {
        console.error('Error parsing accessibility analysis:', error);
        return {
            issues: [],
            score: 0,
            fixes: [],
            error: error.message
        };
    }
}

/**
 * Apply accessibility fixes to code
 * @param {string} code - Original code
 * @param {Array} fixes - Array of fixes to apply
 * @returns {Promise<string>} Fixed code
 */
export async function applyAccessibilityFixes(code, fixes) {
    const prompt = `Apply these accessibility fixes to the code:

Original code:
\`\`\`javascript
${code}
\`\`\`

Fixes to apply:
${fixes.map((fix, i) => `${i + 1}. ${fix.description || fix}`).join('\n')}

Return only the fixed code.`;

    return await generateText(prompt, { maxTokens: 2500 });
}

/**
 * Generate ARIA attributes for a component
 * @param {Object} componentInfo - Component information
 * @returns {Promise<Object>} Recommended ARIA attributes
 */
export async function generateAriaAttributes(componentInfo) {
    const { type, role, props, children } = componentInfo;

    const prompt = `Generate appropriate ARIA attributes for a KalxJS component:

Type: ${type}
Role: ${role || 'none'}
Props: ${JSON.stringify(props || {})}
Has Children: ${!!children}

Return as JSON object with ARIA attributes.`;

    const result = await generateText(prompt, { maxTokens: 500 });

    try {
        return JSON.parse(result);
    } catch (error) {
        return {};
    }
}

/**
 * Check color contrast and suggest improvements
 * @param {string} foreground - Foreground color (hex, rgb, etc.)
 * @param {string} background - Background color
 * @param {Object} options - Check options
 * @returns {Promise<Object>} Contrast analysis
 */
export async function checkColorContrast(foreground, background, options = {}) {
    const { wcagLevel = 'AA', fontSize = '16px' } = options;

    const prompt = `Analyze color contrast for WCAG ${wcagLevel}:

Foreground: ${foreground}
Background: ${background}
Font Size: ${fontSize}

Return as JSON: {
  "ratio": number,
  "passes": boolean,
  "level": "A|AA|AAA",
  "suggestions": ["alternative colors..."]
}`;

    const result = await generateText(prompt, { maxTokens: 500 });

    try {
        return JSON.parse(result);
    } catch (error) {
        return { ratio: 0, passes: false, suggestions: [] };
    }
}

/**
 * Generate keyboard navigation handlers
 * @param {string} componentCode - Component code
 * @returns {Promise<string>} Code with keyboard handlers
 */
export async function addKeyboardNavigation(componentCode) {
    const prompt = `Add keyboard navigation to this component:

\`\`\`javascript
${componentCode}
\`\`\`

Requirements:
- Tab navigation support
- Arrow key navigation where appropriate
- Enter/Space activation
- Escape key handling
- Focus management

Return only the enhanced code.`;

    return await generateText(prompt, { maxTokens: 2000 });
}

/**
 * Generate accessibility documentation
 * @param {string} componentCode - Component code
 * @returns {Promise<string>} Accessibility documentation
 */
export async function generateA11yDocumentation(componentCode) {
    const prompt = `Generate accessibility documentation for this component:

\`\`\`javascript
${componentCode}
\`\`\`

Include:
1. Keyboard navigation instructions
2. Screen reader behavior
3. ARIA attributes used
4. WCAG compliance level
5. Usage examples for accessible implementation

Return as Markdown.`;

    return await generateText(prompt, { maxTokens: 1500 });
}

export default {
    analyzeAccessibility,
    applyAccessibilityFixes,
    generateAriaAttributes,
    checkColorContrast,
    addKeyboardNavigation,
    generateA11yDocumentation
};