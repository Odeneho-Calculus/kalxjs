/**
 * AI-Powered Performance Optimizer
 * Analyzes and suggests performance optimizations
 */

import { generateText } from './index.js';

/**
 * Analyze code for performance issues
 * @param {string} code - Code to analyze
 * @param {Object} options - Analysis options
 * @returns {Promise<Object>} Performance analysis
 */
export async function analyzePerformance(code, options = {}) {
    const {
        includeMetrics = true,
        autoOptimize = false
    } = options;

    const prompt = `Analyze this KalxJS code for performance issues:

\`\`\`javascript
${code}
\`\`\`

Check for:
1. Unnecessary re-renders
2. Memory leaks
3. Expensive operations in render
4. Missing memoization opportunities
5. Bundle size concerns
6. Inefficient reactivity
7. DOM manipulation issues
8. Network request optimization

Return as JSON: {
  "score": 0-100,
  "issues": [{
    "type": "...",
    "severity": "critical|high|medium|low",
    "description": "...",
    "location": "...",
    "fix": "..."
  }],
  "estimatedImprovement": "...",
  "metrics": {...}
}`;

    const result = await generateText(prompt, { maxTokens: 2500 });

    try {
        const analysis = JSON.parse(result);

        if (autoOptimize && analysis.issues && analysis.issues.length > 0) {
            analysis.optimizedCode = await optimizeCode(code, analysis.issues);
        }

        return analysis;
    } catch (error) {
        console.error('Error parsing performance analysis:', error);
        return {
            score: 0,
            issues: [],
            error: error.message
        };
    }
}

/**
 * Optimize code based on identified issues
 * @param {string} code - Original code
 * @param {Array} issues - Performance issues
 * @returns {Promise<string>} Optimized code
 */
export async function optimizeCode(code, issues) {
    const fixes = issues.map(issue => issue.fix || issue.description);

    const prompt = `Optimize this KalxJS code:

Original:
\`\`\`javascript
${code}
\`\`\`

Apply these optimizations:
${fixes.map((fix, i) => `${i + 1}. ${fix}`).join('\n')}

Return only the optimized code.`;

    return await generateText(prompt, { maxTokens: 3000 });
}

/**
 * Suggest memoization opportunities
 * @param {string} code - Component code
 * @returns {Promise<Object>} Memoization suggestions
 */
export async function suggestMemoization(code) {
    const prompt = `Identify memoization opportunities in this KalxJS component:

\`\`\`javascript
${code}
\`\`\`

Suggest:
1. computed() for derived state
2. memo() for expensive calculations
3. useMemo/useCallback equivalents
4. Component memoization with KeepAlive

Return as JSON: {
  "suggestions": [{
    "target": "...",
    "technique": "...",
    "benefit": "...",
    "example": "..."
  }]
}`;

    const result = await generateText(prompt, { maxTokens: 1500 });

    try {
        return JSON.parse(result);
    } catch (error) {
        return { suggestions: [] };
    }
}

/**
 * Analyze and optimize bundle size
 * @param {Object} bundleInfo - Bundle information
 * @returns {Promise<Object>} Bundle optimization suggestions
 */
export async function optimizeBundleSize(bundleInfo) {
    const { dependencies, size, chunks } = bundleInfo;

    const prompt = `Analyze bundle and suggest optimizations:

Current Size: ${size}
Dependencies: ${JSON.stringify(dependencies, null, 2)}
Chunks: ${JSON.stringify(chunks, null, 2)}

Suggest:
1. Tree shaking opportunities
2. Code splitting strategies
3. Dynamic imports
4. Dependency alternatives
5. Dead code elimination

Return as JSON with prioritized suggestions.`;

    const result = await generateText(prompt, { maxTokens: 2000 });

    try {
        return JSON.parse(result);
    } catch (error) {
        return { suggestions: [] };
    }
}

/**
 * Detect and fix memory leaks
 * @param {string} code - Component code
 * @returns {Promise<Object>} Memory leak analysis
 */
export async function detectMemoryLeaks(code) {
    const prompt = `Detect potential memory leaks in this KalxJS component:

\`\`\`javascript
${code}
\`\`\`

Check for:
1. Uncleaned event listeners
2. Timers not cleared
3. Unsubscribed observables
4. Circular references
5. Large object retention

Return as JSON: {
  "leaks": [{
    "type": "...",
    "severity": "...",
    "description": "...",
    "fix": "..."
  }],
  "fixedCode": "..."
}`;

    const result = await generateText(prompt, { maxTokens: 2000 });

    try {
        return JSON.parse(result);
    } catch (error) {
        return { leaks: [] };
    }
}

/**
 * Optimize reactivity patterns
 * @param {string} code - Component code
 * @returns {Promise<string>} Optimized code
 */
export async function optimizeReactivity(code) {
    const prompt = `Optimize reactivity in this KalxJS component:

\`\`\`javascript
${code}
\`\`\`

Optimizations:
1. Use signals for fine-grained updates
2. Batch multiple state updates
3. Use untrack() to prevent unnecessary tracking
4. Optimize computed dependencies
5. Avoid over-reactivity

Return only the optimized code.`;

    return await generateText(prompt, { maxTokens: 2500 });
}

/**
 * Generate performance report
 * @param {string} code - Code to analyze
 * @returns {Promise<string>} Performance report in Markdown
 */
export async function generatePerformanceReport(code) {
    const analysis = await analyzePerformance(code, { includeMetrics: true });

    const prompt = `Generate a comprehensive performance report:

Analysis Results:
${JSON.stringify(analysis, null, 2)}

Create a Markdown report with:
1. Executive summary
2. Performance score and grade
3. Critical issues (with code examples)
4. Optimization recommendations
5. Expected improvements
6. Action items prioritized by impact

Return as Markdown.`;

    return await generateText(prompt, { maxTokens: 3000 });
}

export default {
    analyzePerformance,
    optimizeCode,
    suggestMemoization,
    optimizeBundleSize,
    detectMemoryLeaks,
    optimizeReactivity,
    generatePerformanceReport
};