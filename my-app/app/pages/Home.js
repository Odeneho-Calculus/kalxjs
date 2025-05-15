import { h } from '@kalxjs/core';

export default {
  name: 'HomeView',
  
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
      
      h('div', { class: 'navigation' }, [
        h('a', { href: '/about', onClick: (e) => {
          e.preventDefault();
          window.router.push('/about');
        }}, ['Go to About Page'])
      ])
    ]);
  }
};

/* CSS styles
.home-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

h1 {
  color: #42b883;
  margin-bottom: 1rem;
}

.counter-demo {
  margin: 2rem 0;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.counter {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin: 1rem 0;
}

button {
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 1.2rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #3aa876;
}

.reset-button {
  background-color: #6c757d;
  margin-top: 0.5rem;
}

.reset-button:hover {
  background-color: #5a6268;
}

span {
  font-size: 2rem;
  font-weight: bold;
  min-width: 3rem;
}

.navigation {
  margin-top: 2rem;
}

.navigation a {
  color: #42b883;
  text-decoration: none;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border: 2px solid #42b883;
  border-radius: 4px;
  transition: all 0.2s;
}

.navigation a:hover {
  background-color: #42b883;
  color: white;
}
*/