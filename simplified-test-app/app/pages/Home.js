import { h, defineComponent } from '@kalxjs/core';

export default defineComponent({
  name: 'HomeView',

  data() {
    return {
      message: 'Welcome to KalxJS'
    };
  },

  methods: {
    navigateToAbout(e) {
      e.preventDefault();
      window.router.push('/about');
    }
  },

  render() {
    return h('div', { class: 'home-view' }, [
      h('div', { class: 'container' }, [
        h('section', { class: 'hero text-center' }, [
          h('h1', {}, ['Welcome to KalxJS']),
          h('p', { class: 'hero-subtitle' }, [
            'A modern JavaScript framework for building user interfaces'
          ]),

          h('div', { class: 'cta-container mt-4' }, [
            h('a', {
              class: 'btn btn-primary',
              href: '/about',
              onClick: this.navigateToAbout
            }, ['Learn More'])
          ])
        ])
      ])
    ]);
  }
});