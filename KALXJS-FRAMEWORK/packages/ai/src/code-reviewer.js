/**
 * AI-Powered Code Review Automation
 * Automated code review with intelligent suggestions
 */

import { generateText } from './index.js';

/**
 * Perform automated code review
 * @param {string} code - Code to review
 * @param {Object} options - Review options
 * @returns {Promise<Object>} Review results
 */
export async function reviewCode(code, options = {}) {
    const {
        style = 'comprehensive', // 'comprehensive', 'quick', 'security'
        standards = ['airbnb', 'kalxjs'],
        severity = 'all' // 'all', 'critical', 'high'
    } = options;

    const prompt = `Perform a ${style} code review for this KalxJS code following ${standards.join(', ')} standards:

\`\`\`javascript
${code}
\`\`\`

Review aspects:
1. Code quality and style
2. Best practices adherence
3. Performance concerns
4. Security issues
5. Maintainability
6. Test coverage
7. Documentation quality
8. Error handling
9. Type safety
10. Accessibility

Return as JSON: {
  "overallScore": 0-100,
  "grade": "A+|A|B|C|D|F",
  "comments": [{
    "line": number,
    "type": "error|warning|suggestion|praise",
    "severity": "critical|high|medium|low",
    "category": "...",
    "message": "...",
    "suggestion": "...",
    "example": "..."
  }],
  "summary": "...",
  "strengths": [...],
  "improvements": [...]
}`;

    const result = await generateText(prompt, { maxTokens: 3500 });

    try {
        const review = JSON.parse(result);

        // Filter by severity if specified
        if (severity !== 'all' && review.comments) {
            const severityLevels = {
                critical: ['critical'],
                high: ['critical', 'high']
            };

            review.comments = review.comments.filter(
                c => severityLevels[severity]?.includes(c.severity)
            );
        }

        return review;
    } catch (error) {
        console.error('Error parsing code review:', error);
        return {
            overallScore: 0,
            grade: 'F',
            comments: [],
            error: error.message
        };
    }
}

/**
 * Check code style consistency
 * @param {string} code - Code to check
 * @param {Object} styleGuide - Style guide rules
 * @returns {Promise<Object>} Style violations
 */
export async function checkCodeStyle(code, styleGuide = {}) {
    const prompt = `Check code style consistency:

Code:
\`\`\`javascript
${code}
\`\`\`

Style Guide: ${JSON.stringify(styleGuide, null, 2)}

Check for:
1. Naming conventions
2. Indentation
3. Line length
4. Spacing
5. Quotes usage
6. Semicolons
7. Comments format
8. Import organization

Return as JSON with violations and auto-fix suggestions.`;

    const result = await generateText(prompt, { maxTokens: 1500 });

    try {
        return JSON.parse(result);
    } catch (error) {
        return { violations: [] };
    }
}

/**
 * Evaluate test coverage
 * @param {string} sourceCode - Source code
 * @param {string} testCode - Test code
 * @returns {Promise<Object>} Coverage analysis
 */
export async function evaluateTestCoverage(sourceCode, testCode) {
    const prompt = `Evaluate test coverage:

Source Code:
\`\`\`javascript
${sourceCode}
\`\`\`

Test Code:
\`\`\`javascript
${testCode}
\`\`\`

Analyze:
1. Code paths covered
2. Edge cases tested
3. Error scenarios
4. Missing tests
5. Test quality

Return as JSON: {
  "estimatedCoverage": 0-100,
  "coveredScenarios": [...],
  "missingTests": [...],
  "suggestions": [...]
}`;

    const result = await generateText(prompt, { maxTokens: 2000 });

    try {
        return JSON.parse(result);
    } catch (error) {
        return { estimatedCoverage: 0, missingTests: [] };
    }
}

/**
 * Check documentation quality
 * @param {string} code - Code with documentation
 * @returns {Promise<Object>} Documentation analysis
 */
export async function checkDocumentation(code) {
    const prompt = `Evaluate documentation quality:

\`\`\`javascript
${code}
\`\`\`

Check for:
1. JSDoc completeness
2. Parameter descriptions
3. Return value documentation
4. Example usage
5. Complex logic explanation
6. Public API documentation
7. TODO/FIXME comments

Return as JSON: {
  "score": 0-100,
  "missing": [...],
  "incomplete": [...],
  "suggestions": [...]
}`;

    const result = await generateText(prompt, { maxTokens: 1500 });

    try {
        return JSON.parse(result);
    } catch (error) {
        return { score: 0, missing: [] };
    }
}

/**
 * Suggest refactoring opportunities
 * @param {string} code - Code to analyze
 * @returns {Promise<Object>} Refactoring suggestions
 */
export async function suggestRefactoring(code) {
    const prompt = `Identify refactoring opportunities:

\`\`\`javascript
${code}
\`\`\`

Look for:
1. Code duplication
2. Long functions
3. Complex conditionals
4. Magic numbers/strings
5. Deep nesting
6. God objects
7. Feature envy
8. Dead code

Return as JSON: {
  "suggestions": [{
    "type": "...",
    "severity": "...",
    "description": "...",
    "before": "...",
    "after": "...",
    "benefit": "..."
  }]
}`;

    const result = await generateText(prompt, { maxTokens: 2500 });

    try {
        return JSON.parse(result);
    } catch (error) {
        return { suggestions: [] };
    }
}

/**
 * Generate review report
 * @param {Object} review - Review results
 * @param {Object} options - Report options
 * @returns {Promise<string>} Review report in Markdown
 */
export async function generateReviewReport(review, options = {}) {
    const { format = 'markdown', includeExamples = true } = options;

    const prompt = `Generate a code review report:

Review Results:
${JSON.stringify(review, null, 2)}

Create a ${format} report with:
1. Executive summary
2. Overall score and grade
3. Key findings (prioritized)
4. Critical issues with examples
5. Recommendations
6. Strengths to maintain
7. Action items checklist

${includeExamples ? 'Include code examples for major issues.' : ''}

Return as ${format}.`;

    return await generateText(prompt, { maxTokens: 3000 });
}

/**
 * Compare code changes (like PR review)
 * @param {string} beforeCode - Code before changes
 * @param {string} afterCode - Code after changes
 * @returns {Promise<Object>} Change review
 */
export async function reviewChanges(beforeCode, afterCode) {
    const prompt = `Review code changes:

Before:
\`\`\`javascript
${beforeCode}
\`\`\`

After:
\`\`\`javascript
${afterCode}
\`\`\`

Analyze:
1. Quality of changes
2. Potential issues introduced
3. Breaking changes
4. Performance impact
5. Test requirements
6. Documentation updates needed

Return as JSON with approval recommendation.`;

    const result = await generateText(prompt, { maxTokens: 2000 });

    try {
        return JSON.parse(result);
    } catch (error) {
        return { approved: false, concerns: [] };
    }
}

export default {
    reviewCode,
    checkCodeStyle,
    evaluateTestCoverage,
    checkDocumentation,
    suggestRefactoring,
    generateReviewReport,
    reviewChanges
};