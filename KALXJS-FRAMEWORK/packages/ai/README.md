# @kalxjs/ai

AI-Powered Development Tools for KalxJS Framework - Enhance your development experience with AI assistance.

## Features

- 🤖 **Code Generation** - Generate components, pages, stores from natural language
- ♿ **Accessibility Analysis** - WCAG compliance checking and automatic fixes
- ⚡ **Performance Optimization** - AI-powered performance issue detection
- 🐛 **Bug Prediction** - Predict potential bugs before they happen
- 📝 **Code Review** - Automated code review with quality scoring
- 💡 **Intelligent Autocomplete** - Context-aware code completions

## Installation

```bash
npm install @kalxjs/ai
```

## Quick Start

### Code Generation

```javascript
import { CodeGenerator } from '@kalxjs/ai';

const generator = new CodeGenerator({
  apiKey: 'your-api-key'
});

// Generate a component
const component = await generator.generateComponent(
  'Create a user profile card with avatar, name, and bio'
);

console.log(component.code);
// Outputs complete component code

// Generate multiple artifacts
const result = await generator.generate(
  'Create a todo app with add/delete functionality',
  { type: 'page', includeTests: true }
);

console.log(result.component); // Component code
console.log(result.store);     // Store code
console.log(result.tests);     // Test code
```

### Accessibility Analysis

```javascript
import { AccessibilityAnalyzer } from '@kalxjs/ai';

const analyzer = new AccessibilityAnalyzer();

// Analyze component
const issues = await analyzer.analyzeComponent(`
  <button>Click me</button>
`);

console.log(issues);
// [{ type: 'missing-aria-label', severity: 'warning', ... }]

// Auto-fix issues
const fixed = await analyzer.fixComponent(`
  <button>Click me</button>
`);

console.log(fixed);
// '<button aria-label="Click me">Click me</button>'

// Check WCAG compliance
const compliance = await analyzer.checkCompliance(componentCode);
console.log(`WCAG Level: ${compliance.level}`); // 'A', 'AA', or 'AAA'
```

### Performance Optimization

```javascript
import { PerformanceOptimizer } from '@kalxjs/ai';

const optimizer = new PerformanceOptimizer();

// Analyze performance
const issues = await optimizer.analyzePerformance(componentCode);

console.log(issues);
// [{ type: 'missing-memo', impact: 'high', ... }]

// Get optimization suggestions
const suggestions = await optimizer.suggestOptimizations(componentCode);

suggestions.forEach(s => {
  console.log(`${s.type}: ${s.description}`);
  console.log(`Before:\n${s.before}`);
  console.log(`After:\n${s.after}`);
});

// Auto-optimize code
const optimized = await optimizer.optimizeCode(componentCode);
console.log(optimized.code);
console.log(`Performance gain: ${optimized.improvement}%`);
```

### Bug Prediction

```javascript
import { BugPredictor } from '@kalxjs/ai';

const predictor = new BugPredictor({
  apiKey: 'your-api-key'
});

// Predict bugs
const predictions = await predictor.predictBugs(componentCode);

predictions.forEach(bug => {
  console.log(`${bug.type} (${bug.severity}): ${bug.description}`);
  console.log(`Location: Line ${bug.line}`);
  console.log(`Fix: ${bug.suggestedFix}`);
});

// Analyze security vulnerabilities
const vulns = await predictor.analyzeSecurityVulnerabilities(code);

// Detect race conditions
const raceConditions = await predictor.detectRaceConditions(code);

// Detect edge cases
const edgeCases = await predictor.detectEdgeCases(code);
```

### Code Review

```javascript
import { CodeReviewer } from '@kalxjs/ai';

const reviewer = new CodeReviewer({
  apiKey: 'your-api-key'
});

// Review code
const review = await reviewer.reviewCode(componentCode);

console.log(`Score: ${review.score}/100`);
console.log(`Issues: ${review.issues.length}`);

review.issues.forEach(issue => {
  console.log(`[${issue.severity}] ${issue.message}`);
  console.log(`Line ${issue.line}: ${issue.suggestion}`);
});

// Check style consistency
const styleIssues = await reviewer.checkStyleConsistency(code);

// Evaluate test coverage
const coverage = await reviewer.evaluateTestCoverage(code, testCode);
console.log(`Coverage: ${coverage.percentage}%`);

// Suggest refactoring
const refactorings = await reviewer.suggestRefactoring(code);
```

### Intelligent Autocomplete

```javascript
import { IntelligentAutocomplete } from '@kalxjs/ai';

const autocomplete = new IntelligentAutocomplete({
  apiKey: 'your-api-key'
});

// Get completions
const completions = await autocomplete.getCompletions(
  code,
  cursorPosition
);

completions.forEach(c => {
  console.log(`${c.label} - ${c.detail}`);
});

// Smart import suggestions
const imports = await autocomplete.suggestImports(
  'useState',
  { framework: 'kalxjs' }
);

// Complete function implementation
const implementation = await autocomplete.completeFunction(
  'function sortUsers(users) {\n  // ',
  { context: 'Sort users by name alphabetically' }
);
```

## Configuration

### API Provider Setup

```javascript
import { setAIProvider } from '@kalxjs/ai';

// Use OpenAI
setAIProvider({
  provider: 'openai',
  apiKey: 'your-openai-key',
  model: 'gpt-4'
});

// Use custom provider
setAIProvider({
  provider: 'custom',
  endpoint: 'https://your-api.com',
  headers: { 'Authorization': 'Bearer token' }
});
```

### Plugin Integration

```javascript
import { createApp } from '@kalxjs/core';
import { aiPlugin } from '@kalxjs/ai';

const app = createApp({/* ... */});

app.use(aiPlugin, {
  enabled: process.env.NODE_ENV === 'development',
  features: {
    codeGeneration: true,
    accessibility: true,
    performance: true
  }
});
```

## CLI Integration

```bash
# Generate component with AI
kalxjs ai generate "user profile card"

# Analyze accessibility
kalxjs ai a11y check src/components/

# Optimize performance
kalxjs ai optimize src/components/MyComponent.klx

# Review code
kalxjs ai review src/
```

## Features in Detail

### Code Generation Options

- Components (functional, class-based)
- Pages with routing
- Composables (composition API)
- Stores (Vuex-like)
- Tests (unit, integration)
- API services
- Type definitions

### Accessibility Checks

- ARIA attributes
- Keyboard navigation
- Color contrast
- Screen reader support
- Focus management
- Semantic HTML
- Alt text for images

### Performance Optimizations

- Memoization opportunities
- Lazy loading suggestions
- Bundle size optimization
- Memory leak detection
- Render optimization
- Code splitting recommendations

### Bug Predictions

- Null reference errors
- Type mismatches
- Race conditions
- Memory leaks
- Security vulnerabilities
- Edge case handling
- Error boundary placement

## API Reference

See [PRIORITY_7_IMPLEMENTATION.md](../../PRIORITY_7_IMPLEMENTATION.md) for complete API documentation.

## Examples

- [AI-Assisted Development](../../examples/ai-development)
- [Accessibility Auditing](../../examples/ai-a11y)
- [Performance Optimization](../../examples/ai-performance)

## License

MIT
