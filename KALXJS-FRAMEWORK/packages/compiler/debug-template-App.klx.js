import { defineComponent, onMounted, h } from '@kalxjs/core';
import { useRouter, RouterLink, RouterView } from '@kalxjs/router';
import { useStore } from './store/useStore';
import { useApi } from './api/useApi';
import { useWindowSize } from './composables/useWindowSize';
import { useLazyLoad } from './utils/performance/lazyLoad';
import { plugins } from './plugins';
import { aiManager, generateText, useAI } from './ai/aiManager';

export default defineComponent({
name: 'App',

  // Register components
  components: {
    RouterLink,
    RouterView,
  },

  // Component setup with composition API
  setup() {
    console.log('App component setup called');

    // Initialize features based on configuration
    const { route, meta, beforeEach } = useRouter();

    // Set page title based on route meta
    beforeEach((to, from, next) => {
      // You can add global navigation guards here
      console.log(`Navigating from ${from.path} to ${to.path}`);
      next();
    });

    const store = useStore();

    const api = useApi({
      baseUrl: 'https://api.example.com'
    });

    const { width, height, isMobile } = useWindowSize();

    // Register plugins
    plugins.register('logger', {
      install: () => console.log('Logger plugin installed')
    });

    // Lifecycle hooks
    onMounted(() => {
      console.log('App component mounted');
    });

    return {
      route,
      meta,
      store,
      api,
      width, height, isMobile,
    };
  },
  
  // Add render function to ensure it works properly
  render() {
    return h('div', { class: 'app' }, [
      h('header', { class: 'app-header' }, [
        h('div', { class: 'logo-container' }, [
          h('img', { src: './assets/logo.svg', alt: 'KalxJS Logo', class: 'logo' }),
          h('h1', { class: 'app-title' }, ['test-app'])
        ]),
        
        h('nav', { class: 'app-nav' }, [
          h(RouterLink, { to: '/', activeClass: 'active', exactActiveClass: 'exact-active' }, ['Home']),
          h(RouterLink, { to: '/about', activeClass: 'active', exactActiveClass: 'exact-active' }, ['About'])
        ])
      ]),
      
      h('main', { class: 'app-main' }, [
        h('section', { class: 'features-section' }, [
          h('h2', {}, ['Enabled Features:']),
          h('ul', { class: 'features-list' }, [
            h('li', { class: 'feature-item router' }, ['✓ Router']),
            h('li', { class: 'feature-item state' }, ['✓ State Management']),
            h('li', { class: 'feature-item scss' }, ['✓ SCSS Support']),
            h('li', { class: 'feature-item sfc' }, ['✓ Single File Components']),
            h('li', { class: 'feature-item api' }, ['✓ API Integration']),
            h('li', { class: 'feature-item composition' }, ['✓ Composition API']),
            h('li', { class: 'feature-item performance' }, ['✓ Performance Utilities']),
            h('li', { class: 'feature-item plugins' }, ['✓ Plugin System']),
            h('li', { class: 'feature-item ai' }, ['✓ AI Features']),
            h('li', { class: 'feature-item testing' }, ['✓ Testing']),
            h('li', { class: 'feature-item linting' }, ['✓ Linting']),
          ].filter(Boolean))
        ]),
        
        h('section', { class: 'router-view-container' }, [
          h(RouterView)
        ])
      ]),
      
      h('footer', { class: 'app-footer' }, [
        h('p', {}, ['Powered by KalxJS'])
      ])
    ]);
});

// Inject component styles
(function() {
  if (typeof document !== 'undefined') {
    // Check if style already exists
    if (!document.getElementById('klx-style-jua8ybwo')) {
      const style = document.createElement('style');
      style.textContent = ".app {\n  display: flex;\n  flex-direction: column;\n  min-height: 100vh;\n}\n\n.app-header {\n  background-color: var(--secondary-color);\n  color: white;\n  padding: 1rem 2rem;\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}\n\n.logo-container {\n  display: flex;\n  align-items: center;\n}\n\n.logo {\n  width: 40px;\n  height: 40px;\n  margin-right: 1rem;\n}\n\n.app-title {\n  font-size: 1.5rem;\n  margin: 0;\n}\n\n.app-nav {\n  display: flex;\n  gap: 1.5rem;\n}\n\n.app-nav a {\n  color: white;\n  text-decoration: none;\n  padding: 0.5rem 0;\n  position: relative;\n  font-weight: 500;\n}\n\n.app-nav a::after {\n  content: '';\n  position: absolute;\n  bottom: 0;\n  left: 0;\n  width: 0;\n  height: 2px;\n  background-color: var(--primary-color);\n  transition: width 0.3s;\n}\n\n.app-nav a:hover::after,\n.app-nav a.active::after,\n.app-nav a.exact-active::after {\n  width: 100%;\n}\n\n.app-main {\n  flex: 1;\n  padding: 2rem;\n  max-width: 1200px;\n  margin: 0 auto;\n  width: 100%;\n}\n\n.features-section {\n  margin-bottom: 2rem;\n  padding: 1.5rem;\n  background-color: var(--bg-secondary);\n  border-radius: 8px;\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);\n}\n\n.features-section h2 {\n  margin-top: 0;\n  color: var(--secondary-color);\n  font-size: 1.5rem;\n}\n\n.features-list {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 1rem;\n  list-style: none;\n  padding: 0;\n  margin: 0;\n}\n\n.feature-item {\n  background-color: var(--bg-color);\n  padding: 0.5rem 1rem;\n  border-radius: 4px;\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);\n  display: flex;\n  align-items: center;\n  font-size: 0.9rem;\n}\n\n.router-view-container {\n  margin-top: 2rem;\n}\n\n.app-footer {\n  background-color: var(--secondary-color);\n  color: white;\n  text-align: center;\n  padding: 1rem;\n  margin-top: 2rem;\n}\n\n.edit-prompt {\n  text-align: center;\n  margin: 3rem 0;\n  color: var(--text-muted);\n  font-style: italic;\n}\n\n/* Transitions */\n.fade-enter-active,\n.fade-leave-active {\n  transition: opacity 0.3s ease;\n}\n\n.fade-enter-from,\n.fade-leave-to {\n  opacity: 0;\n}";
      style.setAttribute('id', 'klx-style-jua8ybwo');
      document.head.appendChild(style);
    }
  }
})();
