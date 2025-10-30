import { h, defineComponent } from '@kalxjs/core';
import ThemeSwitcher from '../components/ThemeSwitcher.js';
import AnimatedCounter from '../components/AnimatedCounter.js';

export default defineComponent({
  name: 'HomeView',

  components: {
    ThemeSwitcher,
    AnimatedCounter
  },

  data() {
    return {
      count: 0,
      features: [
        { id: 1, title: 'Virtual DOM', description: 'Efficient DOM updates with virtual DOM diffing' },
        { id: 2, title: 'Component System', description: 'Modular, reusable component architecture' },
        { id: 3, title: 'Reactive Data', description: 'Automatic UI updates when data changes' },
        { id: 4, title: 'Routing', description: 'Built-in client-side routing system' }
      ],
      showFeatures: false,
      activeTab: 'counter'
    };
  },

  mounted() {
    // Animate features in after a short delay
    setTimeout(() => {
      this.showFeatures = true;
      this.$update();
    }, 500);
  },

  methods: {
    increment() {
      console.log('Incrementing count');
      this.count++;
      this.$update();
    },

    decrement() {
      console.log('Decrementing count');
      this.count--;
      this.$update();
    },

    resetCount() {
      console.log('Resetting count');
      this.count = 0;
      this.$update();
    },

    setActiveTab(tab) {
      this.activeTab = tab;
      this.$update();
    },

    navigateToAbout(e) {
      e.preventDefault();

      // Add a small animation before navigation
      const homeView = document.querySelector('.home-view');
      if (homeView) {
        homeView.classList.add('fade-out');

        setTimeout(() => {
          window.router.push('/about');
        }, 300);
      } else {
        window.router.push('/about');
      }
    }
  },

  render() {
    return h('div', { class: 'home-view fade-in' }, [
      h('div', { class: 'container' }, [
        // Header section
        h('header', { class: 'page-header flex flex-between' }, [
          h('div', { class: 'logo' }, [
            h('h1', { class: 'logo-text' }, ['KalxJS']),
            h('span', { class: 'logo-tagline' }, ['Modern JavaScript Framework'])
          ]),

          // Theme switcher component
          h(ThemeSwitcher)
        ]),

        // Hero section
        h('section', { class: 'hero text-center' }, [
          h('h2', { class: 'hero-title' }, ['Welcome to KalxJS']),
          h('p', { class: 'hero-subtitle' }, [
            'A lightweight, modern JavaScript framework for building user interfaces'
          ]),

          // Tabs navigation
          h('div', { class: 'tabs mt-4' }, [
            h('div', { class: 'tab-nav' }, [
              h('button', {
                class: `tab-btn ${this.activeTab === 'counter' ? 'active' : ''}`,
                onClick: () => this.setActiveTab('counter')
              }, ['Counter Demo']),

              h('button', {
                class: `tab-btn ${this.activeTab === 'features' ? 'active' : ''}`,
                onClick: () => this.setActiveTab('features')
              }, ['Features'])
            ]),

            // Tab content
            h('div', { class: 'tab-content' }, [
              // Counter tab
              this.activeTab === 'counter' ? h('div', { class: 'tab-pane fade-in' }, [
                h('div', { class: 'card counter-demo' }, [
                  h('h3', { class: 'card-title' }, ['Interactive Counter']),

                  h('div', { class: 'counter flex flex-center' }, [
                    h('button', {
                      class: 'btn btn-circle',
                      onClick: this.decrement
                    }, ['-']),

                    h(AnimatedCounter, {
                      value: this.count,
                      duration: 500
                    }),

                    h('button', {
                      class: 'btn btn-circle',
                      onClick: this.increment
                    }, ['+'])
                  ]),

                  h('div', { class: 'text-center mt-3' }, [
                    h('button', {
                      class: 'btn btn-secondary',
                      onClick: this.resetCount
                    }, ['Reset'])
                  ])
                ])
              ]) : null,

              // Features tab
              this.activeTab === 'features' ? h('div', { class: 'tab-pane fade-in' }, [
                h('div', { class: 'features-grid' },
                  this.features.map((feature, index) =>
                    h('div', {
                      class: `card feature-card ${this.showFeatures ? 'slide-in-right' : ''}`,
                      style: `animation-delay: ${index * 100}ms`
                    }, [
                      h('h3', { class: 'card-title' }, [feature.title]),
                      h('p', {}, [feature.description])
                    ])
                  )
                )
              ]) : null
            ])
          ])
        ]),

        // Call to action
        h('div', { class: 'cta-container text-center mt-4' }, [
          h('a', {
            class: 'btn btn-pulse',
            href: '/about',
            onClick: this.navigateToAbout
          }, ['Explore More Features'])
        ])
      ])
    ]);
  }
});