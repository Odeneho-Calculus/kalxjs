import { h, defineComponent } from '@kalxjs/core';
import { RouterView } from '@kalxjs/router';
// Import the app styles
import '../styles/app.scss';
// Import ThemeSwitcher component
import ThemeSwitcher from '../components/ThemeSwitcher.js';

export default defineComponent({
  name: 'App',

  components: {
    RouterView
  },

  data() {
    return {
      activeRoute: '/'
    };
  },

  mounted() {
    console.log('App component mounted');

    // Get initial route
    let currentPath = '/';
    if (window.router) {
      if (window.router.mode === 'hash') {
        currentPath = window.location.hash.slice(1) || '/';
      } else {
        currentPath = window.location.pathname || '/';
      }
      this.activeRoute = currentPath;

      // Listen to route changes
      if (window.router.afterEach) {
        window.router.afterEach((to, from) => {
          console.log('Route changed from', from?.path, 'to', to.path);
          this.activeRoute = to.path || '/';
          this.$update();
        });
      }
    }
  },

  methods: {
    navigateTo(path) {
      // Ensure path is not empty
      const targetPath = path || '/';
      console.log(`Navigating to: ${targetPath}`);
      this.activeRoute = targetPath;

      if (window.router) {
        window.router.push(targetPath).catch(err => {
          console.error('Navigation failed:', err);
        });
      } else {
        console.warn('Router not available');
      }
    }
  },

  render() {
    console.log('App render called, activeRoute:', this.activeRoute);

    return h('div', {
      class: 'app'
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
          h('h1', { class: 'app-title' }, ['core-test'])
        ]),

        h('nav', { class: 'app-nav' }, [
          // Import and use ThemeSwitcher component
          h('div', { class: 'theme-switcher-container' }, [
            h(ThemeSwitcher)
          ]),
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
          }, ['Features'])
        ])
      ]),

      // Main content area
      h('main', { class: 'app-main' }, [
        // Conditionally render welcome banner and features section only on home route
        ...(this.activeRoute === '/' ? [
          // Welcome banner (home page only)
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

          // Feature information section (home page only)
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
          ])
        ] : []),

        // Router view container (always visible)
        h('section', { id: 'router-view', class: 'router-view-container' }, [
          h(RouterView)
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
