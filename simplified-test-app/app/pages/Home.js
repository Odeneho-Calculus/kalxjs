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
    },
    navigateToProduct(productId, discount) {
      window.router.push({
        path: `/product/${productId}`,
        query: {
          discount: discount || '0%',
          color: 'blue',
          size: 'large'
        }
      });
    },
    navigateToUser(username) {
      window.router.push({
        path: `/user/${username}`,
        query: { tab: 'profile' }
      });
    },
    navigateToSearch(query) {
      window.router.push({
        path: '/search',
        query: {
          q: query,
          category: 'electronics',
          sort: 'price',
          page: '1'
        }
      });
    },
    navigateToItem(categoryId, itemId) {
      window.router.push(`/category/${categoryId}/item/${itemId}`);
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
          ]),

          // Phase 4: Dynamic Routes Testing
          h('section', { class: 'testing-section' }, [
            h('h2', {}, ['Phase 4: Dynamic Routes & Parameters Testing']),

            h('div', { class: 'test-group' }, [
              h('h3', {}, ['Test 1: Single Parameter (:id)']),
              h('button', { onclick: () => this.navigateToProduct(1) }, 'Go to Product 1'),
              h('button', { onclick: () => this.navigateToProduct(2) }, 'Go to Product 2'),
              h('button', { onclick: () => this.navigateToProduct(101) }, 'Go to Product 101'),
              h('button', { onclick: () => this.navigateToProduct(999) }, 'Go to Product 999 (Mock)')
            ]),

            h('div', { class: 'test-group' }, [
              h('h3', {}, ['Test 2: Parameter + Query String']),
              h('button', { onclick: () => this.navigateToProduct(1, '10%') }, 'Product 1 - 10% discount'),
              h('button', { onclick: () => this.navigateToProduct(2, '20%') }, 'Product 2 - 20% discount')
            ]),

            h('div', { class: 'test-group' }, [
              h('h3', {}, ['Test 3: String Parameter (:username)']),
              h('button', { onclick: () => this.navigateToUser('john') }, 'Go to @john'),
              h('button', { onclick: () => this.navigateToUser('jane') }, 'Go to @jane'),
              h('button', { onclick: () => this.navigateToUser('bob') }, 'Go to @bob'),
              h('button', { onclick: () => this.navigateToUser('alice') }, 'Go to @alice')
            ]),

            h('div', { class: 'test-group' }, [
              h('h3', {}, ['Test 4: Multiple Query Parameters']),
              h('button', { onclick: () => this.navigateToSearch('laptop') }, 'Search: laptop'),
              h('button', { onclick: () => this.navigateToSearch('phone') }, 'Search: phone'),
              h('button', { onclick: () => this.navigateToSearch('tablet') }, 'Search: tablet')
            ]),

            h('div', { class: 'test-group' }, [
              h('h3', {}, ['Test 5: Nested Parameters (:categoryId/item/:itemId)']),
              h('button', { onclick: () => this.navigateToItem('electronics', '1') }, 'Electronics - Item 1'),
              h('button', { onclick: () => this.navigateToItem('electronics', '2') }, 'Electronics - Item 2'),
              h('button', { onclick: () => this.navigateToItem('clothing', '1') }, 'Clothing - Item 1'),
              h('button', { onclick: () => this.navigateToItem('books', '2') }, 'Books - Item 2')
            ])
          ])
        ])
      ])
    ]);
  }
});