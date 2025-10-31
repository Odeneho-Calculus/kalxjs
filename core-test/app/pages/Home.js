import { h, defineComponent } from '@kalxjs/core';
import ThemeSwitcher from '../components/ThemeSwitcher.js';
import AnimatedCounter from '../components/AnimatedCounter.js';
import SignalDemo from '../components/SignalDemo.js';
import BatchUpdatesDemo from '../components/BatchUpdatesDemo.js';
import UntrackDemo from '../components/UntrackDemo.js';
import MemoDemo from '../components/MemoDemo.js';

export default defineComponent({
  name: 'HomeView',

  components: {
    ThemeSwitcher,
    AnimatedCounter,
    SignalDemo,
    BatchUpdatesDemo,
    UntrackDemo,
    MemoDemo
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
      activeTab: 'counter',
      activePhase: 'phase1'
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

    setActivePhase(phase) {
      this.activePhase = phase;
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

        // Phase selection and content
        h('section', { class: 'testing-phases text-center' }, [
          h('h2', { class: 'section-title' }, ['Testing Phases']),

          // Phase tabs
          h('div', { class: 'phase-tabs' }, [
            h('button', {
              class: `tab-btn ${this.activePhase === 'phase1' ? 'active' : ''}`,
              onClick: () => this.setActivePhase('phase1')
            }, ['Phase 1: Reactivity']),

            h('button', {
              class: `tab-btn ${this.activePhase === 'phase2' ? 'active' : ''}`,
              onClick: () => this.setActivePhase('phase2')
            }, ['Phase 2: Signals'])
          ]),

          // Phase 1 content
          this.activePhase === 'phase1' ? h('div', { class: 'phase-content fade-in' }, [
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
          ]) : null,

          // Phase 2 content - Signal-based Reactivity
          this.activePhase === 'phase2' ? h('div', { class: 'phase-content fade-in' }, [
            h('h2', { class: 'hero-title' }, ['Phase 2: Signal-Based Reactivity']),
            h('p', { class: 'hero-subtitle' }, [
              'Fine-grained reactivity with signals, batch updates, untrack, and memoization'
            ]),

            h('div', { class: 'phase2-grid' }, [
              h('div', { class: 'phase2-component' }, [h(SignalDemo)]),
              h('div', { class: 'phase2-component' }, [h(BatchUpdatesDemo)]),
              h('div', { class: 'phase2-component' }, [h(UntrackDemo)]),
              h('div', { class: 'phase2-component' }, [h(MemoDemo)])
            ])
          ]) : null
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