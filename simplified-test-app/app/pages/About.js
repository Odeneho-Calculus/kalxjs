import { h, defineComponent } from '@kalxjs/core';

export default defineComponent({
  name: 'AboutView',

  methods: {
    navigateToHome(e) {
      e.preventDefault();
      window.router.push('/');
    }
  },

  render() {
    return h('div', { class: 'about-view' }, [
      h('div', { class: 'container' }, [
        h('section', { class: 'about-section' }, [
          h('h2', {}, ['About KalxJS']),

          h('div', { class: 'about-content' }, [
            h('p', {}, [
              'KalxJS is a modern JavaScript framework designed for building fast, interactive user interfaces with a focus on simplicity and performance.'
            ])
          ]),

          h('div', { class: 'navigation-container mt-4' }, [
            h('a', {
              class: 'btn btn-primary',
              href: '/',
              onClick: this.navigateToHome
            }, ['Back to Home'])
          ])
        ])
      ])
    ]);
  }
});