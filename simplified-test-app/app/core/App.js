import { h, defineComponent, ref } from '@kalxjs/core';
import '../styles/app.scss';

export default defineComponent({
  name: 'App',

  setup() {
    const activeRoute = ref('/');

    const navigateTo = (path) => {
      activeRoute.value = path;
      if (window.router) {
        window.router.push(path);
      }
    };

    return {
      navigateTo,
      activeRoute
    };
  },

  render() {
    return h('div', { class: 'app' }, [
      // Header
      h('header', { class: 'app-header' }, [
        h('div', { class: 'logo-container' }, [
          h('h1', { class: 'app-title' }, ['simplified-test-app'])
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
            href: 'https://github.com/Odeneho-Calculus/kalxjs',
            target: '_blank',
            rel: 'noopener noreferrer',
            class: 'github-link',
            title: 'View on GitHub'
          }, ['🐙 GitHub'])
        ])
      ]),

      // Main content
      h('main', { class: 'app-main' }, [
        h('section', { id: 'router-view' })
      ]),

      // Footer
      h('footer', { class: 'app-footer' }, [
        h('p', {}, ['© 2024 Powered by KalxJS'])
      ])
    ]);
  }
});