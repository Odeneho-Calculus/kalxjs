# Priority 1 Features - Examples

This directory contains complete, runnable examples demonstrating all Priority 1 features implemented in KALXJS.

## 📁 Files

- **`signals-demo.js`** - Demonstrates the new Signals-based reactivity system
- **`components-demo.js`** - Shows Suspense, Teleport, ErrorBoundary, and Fragment components
- **`directives-demo.klx`** - Template directives (v-model, v-if, v-for, v-show, v-slot)

## 🚀 Running the Examples

### 1. Signals Demo

```bash
node examples/priority-1-features/signals-demo.js
```

This will demonstrate:
- Basic signal creation and updates
- Effects with automatic dependency tracking
- Computed signals
- Batch updates for performance
- Untrack for breaking reactivity
- Memoized computations
- Async resources
- Real-world shopping cart example
- Performance comparisons

### 2. Components Demo

```bash
# Start development server
npm run dev

# Open browser to components demo
# http://localhost:3000/priority-1-features/components-demo.html
```

This will demonstrate:
- **Suspense**: Loading states for async components
- **Teleport**: Rendering modals and notifications
- **ErrorBoundary**: Catching and handling errors
- **Fragment**: Multiple root nodes

### 3. Directives Demo

```bash
# Start development server
npm run dev

# Open browser to directives demo
# http://localhost:3000/priority-1-features/directives-demo.html
```

This will demonstrate:
- **v-model**: Two-way data binding
- **v-if/v-else-if/v-else**: Conditional rendering
- **v-for**: List rendering with keys
- **v-show**: Display toggling
- **v-slot**: Named and scoped slots
- **Combined**: Full todo app using all directives

## 📖 Feature Highlights

### Signals Reactivity

```javascript
import { signal, computed, effect } from '@kalxjs/core';

const count = signal(0);
const doubled = computed(() => count() * 2);

effect(() => {
    console.log('Count:', count(), 'Doubled:', doubled());
});

count.set(5); // Automatically updates
```

### Suspense Component

```javascript
<Suspense fallback={<LoadingSpinner />}>
    <AsyncComponent />
</Suspense>
```

### Teleport Component

```javascript
<Teleport to="body">
    <Modal />
</Teleport>
```

### Error Boundary

```javascript
<ErrorBoundary
    fallback={({ error, reset }) => <ErrorDisplay error={error} onReset={reset} />}
>
    <App />
</ErrorBoundary>
```

### Template Directives

```html
<!-- v-model -->
<input v-model="message" />

<!-- v-if -->
<div v-if="show">Visible</div>

<!-- v-for -->
<div v-for="item in items" :key="item.id">{{ item.name }}</div>

<!-- v-show -->
<div v-show="visible">Toggled</div>

<!-- v-slot -->
<Card>
    <template #header>Header Content</template>
</Card>
```

## 🎯 Learning Path

1. **Start with Signals** - Understand the new reactivity system
2. **Explore Components** - Learn advanced component features
3. **Master Directives** - Use template directives effectively
4. **Build Real Apps** - Combine all features in production apps

## 📚 Documentation

For detailed documentation, see:
- `/PRIORITY_1_IMPLEMENTATION.md` - Complete implementation guide
- `/UPDATE_PLAN.md` - Overall enhancement plan
- `/docs/` - API documentation

## 💡 Tips

1. **Signals vs Proxy Reactivity**: Use Signals for fine-grained updates, Proxy reactivity for complex state
2. **Suspense**: Combine with Error Boundary for robust async handling
3. **Teleport**: Perfect for modals, tooltips, notifications
4. **v-if vs v-show**: Use v-if for conditional rendering, v-show for toggling visibility
5. **Performance**: Use batch() for multiple signal updates

## 🐛 Troubleshooting

If examples don't work:

1. **Check Installation**:
   ```bash
   npm install
   npm run build
   ```

2. **Verify Exports**:
   ```bash
   node -e "console.log(require('@kalxjs/core'))"
   ```

3. **Clear Cache**:
   ```bash
   npm run clean
   npm run build
   ```

## ✅ Next Steps

After exploring these examples:

1. Build a real application using Priority 1 features
2. Write tests for your components
3. Optimize performance with Signals
4. Explore Priority 2 features (DevTools, TypeScript, etc.)

Happy coding with KALXJS! 🎉