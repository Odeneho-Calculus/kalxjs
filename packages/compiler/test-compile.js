// Test script for the KLX compiler
import { compileKLX } from './src/index.js';

// Sample KLX content from your App.klx
const sampleKlx = `<template>
  <div class="app">
    <header class="app-header">
      <h1>Welcome to KalxJS</h1>
      <!-- Navigation if router is enabled -->
      <nav class="app-nav">
        <RouterLink to="/" active-class="active" exact-active-class="exact-active">Home</RouterLink>
        <RouterLink to="/about" active-class="active" exact-active-class="exact-active">About</RouterLink>
        <RouterLink to="/user/1" active-class="active" exact-active-class="exact-active">User Profile</RouterLink>
      </nav>
    </header>
    <main class="app-main">
      <!-- Feature information section -->
      <section class="features-section">
        <h2>Enabled Features:</h2>
        <ul class="features-list">
          <li class="feature-item router">✓ Advanced Router (v2.0)</li>
          <li class="feature-item state">✓ State Management</li>
          <li class="feature-item scss">✓ SCSS Support</li>
        </ul>
      </section>
    </main>
  </div>
</template>
<script>
export default {
  name: 'App',
  components: {
    RouterLink,
    RouterView,
  }
}
</script>`;

// Compile the sample
const result = await compileKLX(sampleKlx, {
  filename: 'App.klx'
});

// Log the result
console.log('Compilation result:');
console.log('Errors:', result.errors);
console.log('Code:', result.code);