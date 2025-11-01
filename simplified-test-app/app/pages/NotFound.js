import { h, defineComponent } from '@kalxjs/core';

export default defineComponent({
  name: 'NotFoundView',

  methods: {
    navigateToHome(e) {
      e.preventDefault();
      window.router.push('/');
    }
  },

  render() {
    return h('div', { class: 'not-found-view' }, [
      h('div', { class: 'container' }, [
        h('div', { class: 'not-found-content text-center' }, [
          h('h1', {}, ['404 - Page Not Found']),

          h('p', {}, [
            'The page you are looking for does not exist.'
          ]),

          h('div', { class: 'navigation-container mt-4' }, [
            h('a', {
              class: 'btn btn-primary',
              href: '/',
              onClick: this.navigateToHome
            }, ['Return to Home'])
          ])
        ])
      ])
    ]);
  }
});