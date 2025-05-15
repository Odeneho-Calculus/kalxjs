import { h, defineComponent, onMounted, ref } from '@kalxjs/core';
// Import the app styles
import '../styles/app.scss';

export default defineComponent({
  name: 'App',

  // Component setup with composition API
  setup() {
    console.log('App component setup called');

    // Active route tracking for navigation highlighting
    const activeRoute = ref('/');

    // Function to navigate programmatically
    const navigateTo = (path) => {
      console.log(`Navigating to: ${path}`);
      activeRoute.value = path;

      if (window.router) {
        window.router.push(path);
      } else {
        console.warn('Router not available');
        window.location.hash = path;
      }
    };

    // Theme toggle state
    const isDarkTheme = ref(false);

    // Toggle theme function
    const toggleTheme = () => {
      isDarkTheme.value = !isDarkTheme.value;
      document.body.classList.toggle('dark-theme', isDarkTheme.value);
    };

    // Lifecycle hooks
    onMounted(() => {
      console.log('App component mounted');

      // Check for saved theme preference
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        isDarkTheme.value = true;
        document.body.classList.add('dark-theme');
      }

      // Make sure the router view container is available
      const routerViewContainer = document.getElementById('router-view');
      if (routerViewContainer && window.router) {
        console.log('Router view container found, initializing router view');

        // Force an initial navigation to the current route
        const currentPath = window.location.hash.slice(1) || '/';
        activeRoute.value = currentPath;
        window.router.push(currentPath);
      }
    });

    return {
      navigateTo,
      activeRoute,
      isDarkTheme,
      toggleTheme
    };
  },

  // Add render function to ensure it works properly
  render() {
    return h('div', {
      class: ['app', { 'dark-theme': this.isDarkTheme }]
    }, [
      // Header with navigation
      h('header', { class: 'app-header' }, [
        h('div', { class: 'logo-container' }, [
          h('img', {
            src: '/assets/logo.svg',
            alt: 'KalxJS Logo',
            class: 'logo',
            onClick: () => this.navigateTo('/')
          }),
          h('h1', { class: 'app-title' }, ['my-app'])
        ]),

        h('nav', { class: 'app-nav' }, [
          h('a', {
            href: '/',
            class: ['nav-link', { 'active': this.activeRoute === '/' }],
            onClick: (e) => {
              e.preventDefault();
              this.navigateTo('/');
            }
          }, ['Home']),
          h('a', {
            href: '/about',
            class: ['nav-link', { 'active': this.activeRoute === '/about' }],
            onClick: (e) => {
              e.preventDefault();
              this.navigateTo('/about');
            }
          }, ['About']),
          h('a', {
            href: '/features',
            class: ['nav-link', { 'active': this.activeRoute === '/features' }],
            onClick: (e) => {
              e.preventDefault();
              this.navigateTo('/features');
            }
          }, ['Features']),
          h('button', {
            class: 'btn theme-toggle',
            onClick: this.toggleTheme,
            title: this.isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme'
          }, [
            this.isDarkTheme ? '☀️' : '🌙'
          ])
        ])
      ]),

      // Main content area
      h('main', { class: 'app-main' }, [
        // Welcome banner
        h('section', { class: 'welcome-banner' }, [
          h('h1', { class: 'welcome-title' }, ['Welcome to KalxJS']),
          h('p', { class: 'welcome-subtitle' }, ['A modern JavaScript framework for building powerful applications']),
          h('div', { class: 'action-buttons' }, [
            h('button', {
              class: 'btn btn-primary',
              onClick: () => window.open('https://github.com/Odeneho-Calculus/kalxjs', '_blank')
            }, ['GitHub']),
            h('button', {
              class: 'btn btn-secondary',
              onClick: () => this.navigateTo('/features')
            }, ['Explore Features'])
          ])
        ]),

        // Feature information section
        h('section', { class: 'features-section' }, [
          h('h2', null, ['Enabled Features']),
          h('ul', { class: 'features-list' }, [
            h('li', { class: 'feature-item router' }, ['✓ Router']),
            h('li', { class: 'feature-item state' }, ['✓ State Management']),
            h('li', { class: 'feature-item scss' }, ['✓ SCSS Support']),
            h('li', { class: 'feature-item sfc' }, ['✓ Single File Components']),
            h('li', { class: 'feature-item api' }, ['✓ API Integration']),
            h('li', { class: 'feature-item composition' }, ['✓ Composition API']),
            h('li', { class: 'feature-item performance' }, ['✓ Performance Utilities']),
            h('li', { class: 'feature-item plugins' }, ['✓ Plugin System']),
            h('li', { class: 'feature-item testing' }, ['✓ Testing']),
            h('li', { class: 'feature-item linting' }, ['✓ Linting']),
          ])
        ]),

        // Router view container
        h('section', { class: 'router-view-container' }, [
          h('div', { id: 'router-view' })
        ])
      ]),

      // Footer
      h('footer', { class: 'app-footer' }, [
        h('div', { class: 'footer-content' }, [
          h('p', { class: 'copyright' }, ['© 2023 Powered by KalxJS']),
          h('div', { class: 'footer-links' }, [
            h('a', { href: 'https://github.com/Odeneho-Calculus/kalxjs', target: '_blank' }, ['GitHub']),
            h('a', { href: '#', onClick: (e) => { e.preventDefault(); this.navigateTo('/about'); } }, ['About']),
            h('a', { href: '#', onClick: (e) => { e.preventDefault(); this.navigateTo('/features'); } }, ['Features'])
          ])
        ])
      ])
    ]);
  }
});