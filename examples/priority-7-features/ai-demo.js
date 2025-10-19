/**
 * Priority 7 - AI Features Demo
 * Demonstrates AI-powered development tools
 */

import {
    CodeGenerator,
    AccessibilityAnalyzer,
    PerformanceOptimizer,
    BugPredictor,
    CodeReviewer,
    IntelligentAutocomplete
} from '@kalxjs/ai';

console.log('=== KALXJS AI Features Demo ===\n');

// 1. Code Generation Demo
async function demoCodeGeneration() {
    console.log('1. Code Generation');
    console.log('------------------');

    const generator = new CodeGenerator({
        apiKey: 'demo-key',
        model: 'gpt-4'
    });

    // Generate a simple component
    const componentPrompt = 'Create a counter component with increment and decrement buttons';
    console.log(`Prompt: "${componentPrompt}"\n`);

    const component = await generator.generateComponent(componentPrompt);
    console.log('Generated Component:');
    console.log(component.code.substring(0, 200) + '...');
    console.log(`Language: ${component.language}`);
    console.log(`Has Tests: ${component.hasTests}\n`);
}

// 2. Accessibility Analysis Demo
async function demoAccessibility() {
    console.log('2. Accessibility Analysis');
    console.log('-------------------------');

    const analyzer = new AccessibilityAnalyzer();

    const problemCode = `
        <div onclick="handleClick()">
            <img src="avatar.jpg">
            <button>Submit</button>
        </div>
    `;

    console.log('Analyzing component for accessibility issues...\n');
    const issues = await analyzer.analyzeComponent(problemCode);

    console.log(`Found ${issues.length} issues:`);
    issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. [${issue.severity}] ${issue.type}`);
        console.log(`     ${issue.message}`);
        console.log(`     Fix: ${issue.fix}\n`);
    });

    // Auto-fix
    const fixed = await analyzer.fixComponent(problemCode);
    console.log('Fixed Component:');
    console.log(fixed.substring(0, 200) + '...\n');
}

// 3. Performance Optimization Demo
async function demoPerformanceOptimization() {
    console.log('3. Performance Optimization');
    console.log('---------------------------');

    const optimizer = new PerformanceOptimizer();

    const unoptimizedCode = `
        const Component = {
            setup() {
                const items = ref([1, 2, 3]);

                const expensiveComputation = () => {
                    return items.value.map(i => i * 2);
                };

                return () => (
                    <div>
                        {expensiveComputation().map(item => (
                            <div>{item}</div>
                        ))}
                    </div>
                );
            }
        };
    `;

    console.log('Analyzing performance...\n');
    const issues = await optimizer.analyzePerformance(unoptimizedCode);

    console.log(`Found ${issues.length} performance issues:`);
    issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. ${issue.type} (Impact: ${issue.impact})`);
        console.log(`     ${issue.description}\n`);
    });

    const suggestions = await optimizer.suggestOptimizations(unoptimizedCode);
    console.log('Optimization Suggestions:');
    suggestions.forEach((s, i) => {
        console.log(`  ${i + 1}. ${s.type}: ${s.description}`);
        console.log(`     Expected gain: ${s.expectedGain}%\n`);
    });
}

// 4. Bug Prediction Demo
async function demoBugPrediction() {
    console.log('4. Bug Prediction');
    console.log('-----------------');

    const predictor = new BugPredictor({ apiKey: 'demo-key' });

    const riskyCode = `
        function processUser(user) {
            const name = user.name.toUpperCase();
            localStorage.setItem('user-' + user.id, user.data);
            return fetch('/api/users/' + user.id).then(r => r.json());
        }
    `;

    console.log('Predicting potential bugs...\n');
    const predictions = await predictor.predictBugs(riskyCode);

    console.log(`Found ${predictions.length} potential bugs:`);
    predictions.forEach((bug, i) => {
        console.log(`  ${i + 1}. ${bug.type} [${bug.severity}]`);
        console.log(`     Line ${bug.line}: ${bug.description}`);
        console.log(`     Confidence: ${(bug.confidence * 100).toFixed(0)}%`);
        console.log(`     Fix: ${bug.suggestedFix}\n`);
    });
}

// 5. Code Review Demo
async function demoCodeReview() {
    console.log('5. Automated Code Review');
    console.log('------------------------');

    const reviewer = new CodeReviewer({ apiKey: 'demo-key' });

    const codeToReview = `
        const UserList = {
            setup() {
                const users = ref([]);
                const loading = ref(true);

                onMounted(async () => {
                    const response = await fetch('/api/users');
                    users.value = await response.json();
                    loading.value = false;
                });

                return () => (
                    <div>
                        {loading.value ? <div>Loading...</div> : null}
                        {users.value.map(user => <div>{user.name}</div>)}
                    </div>
                );
            }
        };
    `;

    console.log('Reviewing code...\n');
    const review = await reviewer.reviewCode(codeToReview);

    console.log(`Overall Score: ${review.score}/100`);
    console.log(`Quality: ${review.quality}`);
    console.log(`\nIssues found: ${review.issues.length}`);

    review.issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. [${issue.severity}] ${issue.category}`);
        console.log(`     Line ${issue.line}: ${issue.message}`);
        console.log(`     Suggestion: ${issue.suggestion}\n`);
    });

    console.log('Strengths:');
    review.strengths.forEach(s => console.log(`  ✓ ${s}`));
    console.log('\nWeaknesses:');
    review.weaknesses.forEach(w => console.log(`  ✗ ${w}`));
}

// 6. Intelligent Autocomplete Demo
async function demoIntelligentAutocomplete() {
    console.log('\n6. Intelligent Autocomplete');
    console.log('---------------------------');

    const autocomplete = new IntelligentAutocomplete({ apiKey: 'demo-key' });

    const partialCode = `
        import { ref } from '@kalxjs/core';

        const Component = {
            setup() {
                const count = ref(0);

                const increment = () => {
                    // |cursor here
    `;

    console.log('Getting context-aware completions...\n');
    const completions = await autocomplete.getCompletions(partialCode, 150);

    console.log('Suggested completions:');
    completions.slice(0, 5).forEach((c, i) => {
        console.log(`  ${i + 1}. ${c.label}`);
        console.log(`     ${c.detail}`);
        console.log(`     Insert: ${c.insertText.substring(0, 50)}...\n`);
    });

    // Smart import suggestions
    console.log('Smart import suggestions for "computed":');
    const imports = await autocomplete.suggestImports('computed', {
        framework: 'kalxjs'
    });

    imports.forEach((imp, i) => {
        console.log(`  ${i + 1}. ${imp.statement}`);
        console.log(`     ${imp.description}\n`);
    });
}

// Run all demos
async function runAllDemos() {
    try {
        await demoCodeGeneration();
        console.log('\n' + '='.repeat(50) + '\n');

        await demoAccessibility();
        console.log('\n' + '='.repeat(50) + '\n');

        await demoPerformanceOptimization();
        console.log('\n' + '='.repeat(50) + '\n');

        await demoBugPrediction();
        console.log('\n' + '='.repeat(50) + '\n');

        await demoCodeReview();
        console.log('\n' + '='.repeat(50) + '\n');

        await demoIntelligentAutocomplete();

        console.log('\n' + '='.repeat(50));
        console.log('✓ All AI features demonstrated successfully!');
        console.log('='.repeat(50));

    } catch (error) {
        console.error('Demo error:', error);
    }
}

// Run demos
runAllDemos();