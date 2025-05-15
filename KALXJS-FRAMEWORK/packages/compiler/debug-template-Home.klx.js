import { h } from '@kalxjs/core';
import TestComponent from '../components/TestComponent.klx';
import { defineComponent } from '@kalxjs/core';

export default defineComponent({
name: 'HomeView',
  
  components: {
    TestComponent
  },
  
  data() {
    return {
      count: 0
    };
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
    }
  },
  
  render() {
    return h('div', { class: 'home-view' }, [
      h('h1', {}, ['Home Page']),
      h('p', {}, ['Welcome to the KalxJS demo application!']),
      
      h('div', { class: 'counter-demo' }, [
        h('h2', {}, ['Interactive Counter']),
        h('div', { class: 'counter' }, [
          h('button', { onClick: this.decrement }, ['-']),
          h('span', {}, [String(this.count)]),
          h('button', { onClick: this.increment }, ['+']),
        ]),
        h('button', { class: 'reset-button', onClick: this.resetCount }, ['Reset'])
      ]),
      
      // Include our test component
      h(TestComponent),
      
      h('div', { class: 'navigation' }, [
        h('a', { href: '/about', onClick: (e) => {
          e.preventDefault();
          window.router.push('/about');
        }}, ['Go to About Page'])
      ])
    ]);
  },
});

// Inject component styles
(function() {
  if (typeof document !== 'undefined') {
    // Check if style already exists
    if (!document.getElementById('klx-style-ggmhrplf')) {
      const style = document.createElement('style');
      style.textContent = ".home-view {\n  max-width: 800px;\n  margin: 0 auto;\n  padding: 2rem;\n  text-align: center;\n}\n\nh1 {\n  color: #42b883;\n  margin-bottom: 1rem;\n}\n\n.counter-demo {\n  margin: 2rem 0;\n  padding: 1.5rem;\n  background-color: #f8f9fa;\n  border-radius: 8px;\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);\n}\n\n.counter {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  gap: 1rem;\n  margin: 1rem 0;\n}\n\nbutton {\n  background-color: #42b883;\n  color: white;\n  border: none;\n  border-radius: 4px;\n  padding: 0.5rem 1rem;\n  font-size: 1.2rem;\n  cursor: pointer;\n  transition: background-color 0.2s;\n}\n\nbutton:hover {\n  background-color: #3aa876;\n}\n\n.reset-button {\n  background-color: #6c757d;\n  margin-top: 0.5rem;\n}\n\n.reset-button:hover {\n  background-color: #5a6268;\n}\n\nspan {\n  font-size: 2rem;\n  font-weight: bold;\n  min-width: 3rem;\n}\n\n.navigation {\n  margin-top: 2rem;\n}\n\n.navigation a {\n  color: #42b883;\n  text-decoration: none;\n  font-weight: 600;\n  padding: 0.5rem 1rem;\n  border: 2px solid #42b883;\n  border-radius: 4px;\n  transition: all 0.2s;\n}\n\n.navigation a:hover {\n  background-color: #42b883;\n  color: white;\n}";
      style.setAttribute('id', 'klx-style-ggmhrplf');
      document.head.appendChild(style);
    }
  }
})();
