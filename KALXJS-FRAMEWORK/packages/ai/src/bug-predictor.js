/**
 * AI-Powered Bug Predictor
 * Predicts potential bugs and suggests preventive measures
 */

import { generateText } from './index.js';

/**
 * Predict potential bugs in code
 * @param {string} code - Code to analyze
 * @param {Object} options - Prediction options
 * @returns {Promise<Object>} Bug predictions
 */
export async function predictBugs(code, options = {}) {
    const {
        confidence = 0.7, // Minimum confidence level (0-1)
        includeTests = true
    } = options;

    const prompt = `Analyze this KalxJS code and predict potential bugs:

\`\`\`javascript
${code}
\`\`\`

Check for:
1. Null/undefined access
2. Type mismatches
3. Race conditions
4. Edge cases not handled
5. Async/await issues
6. State management bugs
7. Lifecycle issues
8. Event handler problems
9. Memory issues
10. Security vulnerabilities

Return as JSON: {
  "predictions": [{
    "type": "...",
    "severity": "critical|high|medium|low",
    "confidence": 0-1,
    "description": "...",
    "location": "...",
    "fix": "...",
    "testCase": "..."
  }],
  "overallRisk": "high|medium|low"
}`;

    const result = await generateText(prompt, { maxTokens: 3000 });

    try {
        const predictions = JSON.parse(result);

        // Filter by confidence level
        if (predictions.predictions) {
            predictions.predictions = predictions.predictions.filter(
                p => (p.confidence || 1) >= confidence
            );
        }

        return predictions;
    } catch (error) {
        console.error('Error parsing bug predictions:', error);
        return {
            predictions: [],
            overallRisk: 'unknown',
            error: error.message
        };
    }
}

/**
 * Analyze code for security vulnerabilities
 * @param {string} code - Code to analyze
 * @returns {Promise<Object>} Security analysis
 */
export async function analyzeSecurity(code) {
    const prompt = `Analyze this KalxJS code for security vulnerabilities:

\`\`\`javascript
${code}
\`\`\`

Check for:
1. XSS vulnerabilities
2. SQL injection risks
3. Insecure data handling
4. Authentication issues
5. Authorization flaws
6. Sensitive data exposure
7. CSRF vulnerabilities
8. Insecure dependencies

Return as JSON: {
  "vulnerabilities": [{
    "type": "...",
    "severity": "critical|high|medium|low",
    "cwe": "CWE-XXX",
    "description": "...",
    "fix": "...",
    "references": [...]
  }],
  "securityScore": 0-100
}`;

    const result = await generateText(prompt, { maxTokens: 2500 });

    try {
        return JSON.parse(result);
    } catch (error) {
        return { vulnerabilities: [], securityScore: 0 };
    }
}

/**
 * Check for edge cases
 * @param {string} code - Code to analyze
 * @returns {Promise<Array>} Edge cases
 */
export async function checkEdgeCases(code) {
    const prompt = `Identify edge cases not handled in this code:

\`\`\`javascript
${code}
\`\`\`

Consider:
1. Empty/null inputs
2. Very large/small values
3. Special characters
4. Network failures
5. Race conditions
6. Concurrent operations
7. Browser compatibility
8. Resource exhaustion

Return as JSON array: [{
  "case": "...",
  "impact": "...",
  "testScenario": "...",
  "suggestedFix": "..."
}]`;

    const result = await generateText(prompt, { maxTokens: 2000 });

    try {
        return JSON.parse(result);
    } catch (error) {
        return [];
    }
}

/**
 * Detect race conditions
 * @param {string} code - Code to analyze
 * @returns {Promise<Object>} Race condition analysis
 */
export async function detectRaceConditions(code) {
    const prompt = `Detect potential race conditions in this code:

\`\`\`javascript
${code}
\`\`\`

Look for:
1. Async operations without proper synchronization
2. State updates in rapid succession
3. Event handler conflicts
4. Concurrent API calls
5. Promise chain issues

Return as JSON: {
  "raceConditions": [{
    "location": "...",
    "description": "...",
    "scenario": "...",
    "fix": "...",
    "preventionPattern": "..."
  }]
}`;

    const result = await generateText(prompt, { maxTokens: 1500 });

    try {
        return JSON.parse(result);
    } catch (error) {
        return { raceConditions: [] };
    }
}

/**
 * Generate preventive tests
 * @param {Object} predictions - Bug predictions
 * @returns {Promise<string>} Test code
 */
export async function generatePreventiveTests(predictions) {
    const bugs = predictions.predictions || [];

    const prompt = `Generate preventive test cases for these potential bugs:

${JSON.stringify(bugs, null, 2)}

Create comprehensive tests using Jest that:
1. Test each predicted bug scenario
2. Include edge cases
3. Use proper mocking
4. Follow AAA pattern (Arrange, Act, Assert)

Return only the test code.`;

    return await generateText(prompt, { maxTokens: 3000 });
}

/**
 * Suggest defensive programming patterns
 * @param {string} code - Code to analyze
 * @returns {Promise<Object>} Defensive programming suggestions
 */
export async function suggestDefensiveProgramming(code) {
    const prompt = `Suggest defensive programming patterns for this code:

\`\`\`javascript
${code}
\`\`\`

Recommend:
1. Input validation
2. Error handling
3. Null checks
4. Type guards
5. Graceful degradation
6. Logging strategies

Return as JSON with code examples.`;

    const result = await generateText(prompt, { maxTokens: 2000 });

    try {
        return JSON.parse(result);
    } catch (error) {
        return { suggestions: [] };
    }
}

/**
 * Generate bug report
 * @param {string} code - Code analyzed
 * @param {Object} predictions - Bug predictions
 * @returns {Promise<string>} Bug report in Markdown
 */
export async function generateBugReport(code, predictions) {
    const prompt = `Generate a bug prediction report:

Code Analyzed:
\`\`\`javascript
${code}
\`\`\`

Predictions:
${JSON.stringify(predictions, null, 2)}

Create a Markdown report with:
1. Risk assessment summary
2. Critical bugs (prioritized)
3. Detailed explanations
4. Recommended fixes
5. Preventive measures
6. Test scenarios

Return as Markdown.`;

    return await generateText(prompt, { maxTokens: 3000 });
}

export default {
    predictBugs,
    analyzeSecurity,
    checkEdgeCases,
    detectRaceConditions,
    generatePreventiveTests,
    suggestDefensiveProgramming,
    generateBugReport
};