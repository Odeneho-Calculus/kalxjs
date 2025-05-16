import { h, defineComponent } from '@kalxjs/core';
import ThemeSwitcher from '../components/ThemeSwitcher.js';

export default defineComponent({
  name: 'AboutView',

  components: {
    ThemeSwitcher
  },

  data() {
    return {
      features: [
        {
          title: 'Virtual DOM',
          description: 'Efficiently updates the UI by comparing virtual DOM representations and applying only the necessary changes to the real DOM.',
          icon: '🔄'
        },
        {
          title: 'Component System',
          description: 'Build encapsulated, reusable components that manage their own state and can be composed to create complex UIs.',
          icon: '🧩'
        },
        {
          title: 'Reactive Data',
          description: 'Automatically updates the UI when the underlying data changes, making state management simple and intuitive.',
          icon: '⚡'
        },
        {
          title: 'Routing',
          description: 'Built-in client-side routing with support for nested routes, route parameters, and navigation guards.',
          icon: '🧭'
        },
        {
          title: 'State Management',
          description: 'Centralized state management for complex applications with predictable state mutations.',
          icon: '📦'
        },
        {
          title: 'Developer Tools',
          description: 'Comprehensive developer tools for debugging, performance monitoring, and state inspection.',
          icon: '🛠️'
        }
      ],
      activeFeature: null,
      showBackToTop: false
    };
  },

  mounted() {
    // Add scroll listener for back-to-top button
    window.addEventListener('scroll', this.handleScroll);

    // Animate features in sequence
    this.animateFeaturesSequentially();
  },

  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  },

  methods: {
    handleScroll() {
      this.showBackToTop = window.scrollY > 300;
      this.$update();
    },

    scrollToTop() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    },

    setActiveFeature(index) {
      this.activeFeature = this.activeFeature === index ? null : index;
      this.$update();
    },

    animateFeaturesSequentially() {
      const featureElements = document.querySelectorAll('.feature-card');

      featureElements.forEach((el, index) => {
        setTimeout(() => {
          el.classList.add('fade-in');
        }, 100 * index);
      });
    },

    navigateToHome(e) {
      e.preventDefault();

      // Add a small animation before navigation
      const aboutView = document.querySelector('.about-view');
      if (aboutView) {
        aboutView.classList.add('fade-out');

        setTimeout(() => {
          window.router.push('/');
        }, 300);
      } else {
        window.router.push('/');
      }
    }
  },

  render() {
    return h('div', { class: 'about-view fade-in' }, [
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

        // About section
        h('section', { class: 'about-section' }, [
          h('h2', { class: 'section-title' }, ['About KalxJS']),

          h('div', { class: 'about-content' }, [
            h('p', { class: 'lead-text' }, [
              'KalxJS is a modern JavaScript framework designed for building fast, interactive user interfaces with a focus on simplicity and performance.'
            ]),

            h('p', {}, [
              'Built with a virtual DOM implementation and a reactive component system, KalxJS makes it easy to create complex applications that respond instantly to data changes.'
            ]),

            h('div', { class: 'tech-stack mt-4' }, [
              h('h3', {}, ['Technology Stack']),

              h('div', { class: 'tech-badges' }, [
                h('span', { class: 'badge' }, ['JavaScript']),
                h('span', { class: 'badge' }, ['Virtual DOM']),
                h('span', { class: 'badge' }, ['Reactive']),
                h('span', { class: 'badge' }, ['Component-Based']),
                h('span', { class: 'badge' }, ['Router']),
                h('span', { class: 'badge' }, ['State Management'])
              ])
            ])
          ])
        ]),

        // Features section
        h('section', { class: 'features-section mt-4' }, [
          h('h2', { class: 'section-title' }, ['Key Features']),

          h('div', { class: 'features-grid' },
            this.features.map((feature, index) =>
              h('div', {
                class: `feature-card ${this.activeFeature === index ? 'active' : ''}`,
                onClick: () => this.setActiveFeature(index)
              }, [
                h('div', { class: 'feature-icon' }, [feature.icon]),
                h('h3', { class: 'feature-title' }, [feature.title]),
                h('p', { class: 'feature-description' }, [feature.description])
              ])
            )
          )
        ]),

        // Getting started section
        h('section', { class: 'getting-started-section mt-4' }, [
          h('h2', { class: 'section-title' }, ['Getting Started']),

          h('div', { class: 'card code-card' }, [
            h('h3', { class: 'card-title' }, ['Installation']),

            h('pre', { class: 'code-block' }, [
              h('code', {}, ['npm install @kalxjs/core @kalxjs/router @kalxjs/state'])
            ]),

            h('h3', { class: 'card-title mt-4' }, ['Create Your First Component']),

            h('pre', { class: 'code-block' }, [
              h('code', {}, [
                `import { h, defineComponent } from '@kalxjs/core';

export default defineComponent({
  name: 'HelloWorld',
  
  data() {
    return {
      message: 'Hello, KalxJS!'
    };
  },
  
  render() {
    return h('div', {}, [
      h('h1', {}, [this.message])
    ]);
  }
});`
              ])
            ])
          ])
        ]),

        // Navigation
        h('div', { class: 'navigation-container text-center mt-4' }, [
          h('a', {
            class: 'btn btn-outline',
            href: '/',
            onClick: this.navigateToHome
          }, ['Back to Home'])
        ]),

        // Back to top button
        this.showBackToTop ? h('button', {
          class: 'back-to-top-btn',
          onClick: this.scrollToTop
        }, ['↑']) : null
      ])
    ]);
  }
});