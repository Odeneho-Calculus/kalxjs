import { h, defineComponent } from '@kalxjs/core';

export default defineComponent({
  name: 'ThemeSwitcher',

  data() {
    return {
      isDarkTheme: true, // Set default to true for dark theme
    };
  },

  mounted() {
    console.log('ThemeSwitcher mounting...');

    // Check if user has a theme preference stored
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      console.log('Found stored theme preference:', storedTheme);
      this.isDarkTheme = storedTheme === 'dark';
    } else {
      // Set dark theme as default
      console.log('No stored theme, setting dark theme as default.');
      this.isDarkTheme = true;
      localStorage.setItem('theme', 'dark');
    }

    // Apply theme immediately
    this.applyTheme();
    this.$update();

    console.log('ThemeSwitcher mounted, dark theme:', this.isDarkTheme);
  },

  methods: {
    // Apply theme to document
    applyTheme() {
      console.log('Applying theme:', this.isDarkTheme ? 'dark' : 'light');

      if (this.isDarkTheme) {
        document.documentElement.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
        document.body.style.backgroundColor = '#121212';
        document.body.style.color = '#ffffff';
      } else {
        document.documentElement.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
        document.body.style.backgroundColor = '#ffffff';
        document.body.style.color = '#333333';
      }

      // Force a repaint to ensure styles are applied
      const repaint = document.body.offsetHeight;
    },

    // Toggle theme function - simplified to match counter pattern
    toggleTheme() {
      console.log('Toggle theme clicked, current:', this.isDarkTheme);
      this.isDarkTheme = !this.isDarkTheme;
      this.applyTheme();
      this.$update();
    }
  },

  render() {
    // Create a simple button similar to the counter buttons
    return h('div', {
      class: 'theme-switcher-wrapper',
      style: 'display: flex; align-items: center; justify-content: center;'
    }, [
      h('button', {
        class: 'theme-button',
        onClick: this.toggleTheme,
        style: `
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          background-color: var(--primary-color);
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
          outline: none;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        `
      }, [
        this.isDarkTheme ? '☀️' : '🌙'
      ]),

      h('span', {
        style: 'margin-left: 10px; font-weight: 500;'
      }, [
        this.isDarkTheme ? 'Light Mode' : 'Dark Mode'
      ])
    ]);
  }
});