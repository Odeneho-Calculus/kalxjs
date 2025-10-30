import { h, defineComponent } from '@kalxjs/core';
import ThemeSwitcher from '../components/ThemeSwitcher.js';

export default defineComponent({
  name: 'NotFoundView',

  components: {
    ThemeSwitcher
  },

  data() {
    return {
      animationActive: false
    };
  },

  mounted() {
    // Start animation after a short delay
    setTimeout(() => {
      this.animationActive = true;
      this.$update();
    }, 100);
  },

  methods: {
    navigateToHome(e) {
      e.preventDefault();

      // Add a small animation before navigation
      const notFoundView = document.querySelector('.not-found-view');
      if (notFoundView) {
        notFoundView.classList.add('fade-out');

        setTimeout(() => {
          window.router.push('/');
        }, 300);
      } else {
        window.router.push('/');
      }
    }
  },

  render() {
    return h('div', { class: 'not-found-view fade-in' }, [
      h('div', { class: 'container' }, [
        // Header with theme switcher
        h('header', { class: 'page-header flex flex-between' }, [
          h('div', { class: 'logo' }, [
            h('h1', { class: 'logo-text' }, ['KalxJS']),
            h('span', { class: 'logo-tagline' }, ['Modern JavaScript Framework'])
          ]),

          h(ThemeSwitcher)
        ]),

        // 404 content
        h('div', { class: 'not-found-content text-center' }, [
          h('div', {
            class: `error-code ${this.animationActive ? 'animate' : ''}`
          }, ['404']),

          h('h1', { class: 'error-title' }, ['Page Not Found']),

          h('p', { class: 'error-message' }, [
            'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.'
          ]),

          h('div', { class: 'error-illustration' }, [
            h('div', { class: 'planet' }, []),
            h('div', { class: 'astronaut' }, []),
            h('div', { class: 'stars' }, [
              ...[...Array(20)].map((_, i) =>
                h('div', {
                  class: 'star',
                  style: `
                    top: ${Math.random() * 100}%;
                    left: ${Math.random() * 100}%;
                    animation-delay: ${Math.random() * 2}s;
                  `
                }, [])
              )
            ])
          ]),

          h('div', { class: 'navigation-container mt-4' }, [
            h('a', {
              class: 'btn btn-pulse',
              href: '/',
              onClick: this.navigateToHome
            }, ['Return to Home Page'])
          ])
        ])
      ])
    ]);
  }
}); 