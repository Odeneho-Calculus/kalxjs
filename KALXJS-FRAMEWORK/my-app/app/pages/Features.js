import { h, defineComponent } from '@kalxjs/core';
import ThemeSwitcher from '../components/ThemeSwitcher.js';

export default defineComponent({
  name: 'Features',
  
  components: {
    ThemeSwitcher
  },
  
  data() {
    return {
      animationActive: false,
      features: [
        { 
          title: 'Virtual DOM', 
          description: 'Efficient DOM updates with virtual DOM diffing algorithm for optimal performance.'
        },
        { 
          title: 'Component System', 
          description: 'Create reusable, encapsulated components with their own state and lifecycle.'
        },
        { 
          title: 'Reactive Data', 
          description: 'Automatic UI updates when your data changes, keeping everything in sync.'
        },
        { 
          title: 'Routing', 
          description: 'Built-in client-side routing with support for nested routes and guards.'
        },
        { 
          title: 'State Management', 
          description: 'Centralized state management for complex applications with predictable data flow.'
        },
        { 
          title: 'SCSS Support', 
          description: 'First-class support for SCSS styling with scoped styles and CSS modules.'
        },
        { 
          title: 'Single File Components', 
          description: 'Write your components in a single file with template, script, and style sections.'
        },
        { 
          title: 'API Integration', 
          description: 'Built-in utilities for API integration with support for REST and GraphQL.'
        },
        { 
          title: 'Composition API', 
          description: 'A modern API for composing component logic with better TypeScript support.'
        },
        { 
          title: 'Performance Utilities', 
          description: 'Tools for measuring and optimizing application performance.'
        }
      ]
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
      window.router.push('/');
    }
  },
  
  render() {
    return h('div', { class: `features-page ${this.animationActive ? 'fade-in' : ''}` }, [
      h('h1', { class: 'page-title' }, ['KalxJS Features']),
      
      h('p', { class: 'page-description' }, [
        'KalxJS comes with a rich set of features to help you build modern web applications.'
      ]),
      
      h('div', { class: 'features-grid' }, 
        this.features.map(feature => 
          h('div', { class: 'feature-card' }, [
            h('h3', { class: 'feature-title' }, [feature.title]),
            h('p', { class: 'feature-description' }, [feature.description])
          ])
        )
      ),
      
      h('div', { class: 'actions' }, [
        h('button', { 
          class: 'btn btn-primary', 
          onClick: this.navigateToHome 
        }, ['Back to Home'])
      ])
    ]);
  }
});