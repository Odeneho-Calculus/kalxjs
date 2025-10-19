/**
 * KALXJS Priority 1 - Signals Demo
 * Demonstrates fine-grained reactivity system
 */

import {
    signal,
    effect,
    batch,
    untrack,
    memo,
    createResource
} from '@kalxjs/core';

// ============================================
// 1. Basic Signal Usage
// ============================================
console.log('=== Basic Signals ===');

const count = signal(0);
console.log('Initial count:', count()); // 0

count.set(5);
console.log('After set:', count()); // 5

count.update(n => n + 1);
console.log('After update:', count()); // 6

// ============================================
// 2. Effects (Auto-tracking)
// ============================================
console.log('\n=== Effects ===');

const name = signal('John');
const greeting = signal('');

effect(() => {
    greeting.set(`Hello, ${name()}!`);
    console.log('Effect ran:', greeting());
});

name.set('Jane'); // Effect automatically re-runs

// ============================================
// 3. Computed Signals (using memo)
// ============================================
console.log('\n=== Computed Signals ===');

const firstName = signal('John');
const lastName = signal('Doe');

const fullName = memo(() => {
    return `${firstName()} ${lastName()}`;
});

console.log('Full name:', fullName()); // John Doe

firstName.set('Jane');
console.log('Updated full name:', fullName()); // Jane Doe

// ============================================
// 4. Batch Updates
// ============================================
console.log('\n=== Batch Updates ===');

const x = signal(0);
const y = signal(0);

effect(() => {
    console.log('Effect executed:', x() + y());
});

// Without batch: effect runs twice
console.log('Without batch:');
x.set(10);
y.set(20);

// With batch: effect runs only once
console.log('\nWith batch:');
batch(() => {
    x.set(30);
    y.set(40);
});

// ============================================
// 5. Untrack (Break Reactivity)
// ============================================
console.log('\n=== Untrack ===');

const tracked = signal(0);
const untracked = signal(0);

effect(() => {
    console.log('Tracked value changed:', tracked());

    // This won't trigger effect re-run
    untrack(() => {
        console.log('Untracked value:', untracked());
    });
});

tracked.set(1); // Triggers effect
untracked.set(100); // Doesn't trigger effect

// ============================================
// 6. Memo (Memoized Computed)
// ============================================
console.log('\n=== Memo ===');

const expensive = signal(10);

const expensiveResult = memo(() => {
    console.log('Computing expensive operation...');
    return expensive() * expensive() * expensive();
});

console.log('Result:', expensiveResult()); // Computes once
console.log('Result:', expensiveResult()); // Uses cached value

expensive.set(20); // Triggers recomputation
console.log('New result:', expensiveResult());

// ============================================
// 7. Resource (Async Data) - COMMENTED OUT DUE TO BUNDLING ISSUE
// ============================================
// console.log('\n=== Resource ===');
// Note: createResource has an internal bundling issue that needs to be fixed
// The rest of the signals features work perfectly!

// ============================================
// 8. Practical Example: Shopping Cart
// ============================================
console.log('\n=== Shopping Cart Example ===');

const cart = signal([
    { id: 1, name: 'Product A', price: 10, quantity: 2 },
    { id: 2, name: 'Product B', price: 20, quantity: 1 }
]);

const total = memo(() => {
    return cart().reduce((sum, item) => {
        return sum + (item.price * item.quantity);
    }, 0);
});

const itemCount = memo(() => {
    return cart().reduce((sum, item) => sum + item.quantity, 0);
});

console.log('Cart:', cart());
console.log('Total:', total()); // 40
console.log('Items:', itemCount()); // 3

// Add item
cart.update(items => [
    ...items,
    { id: 3, name: 'Product C', price: 15, quantity: 1 }
]);

console.log('New total:', total()); // 55
console.log('New item count:', itemCount()); // 4

// ============================================
// 9. Performance Comparison
// ============================================
console.log('\n=== Performance Test ===');

// Test with 1000 updates
console.time('With Batch');
batch(() => {
    for (let i = 0; i < 1000; i++) {
        count.set(i);
    }
});
console.timeEnd('With Batch');

console.time('Without Batch');
for (let i = 0; i < 1000; i++) {
    count.set(i);
}
console.timeEnd('Without Batch');

console.log('\n✅ Signals demo complete!');