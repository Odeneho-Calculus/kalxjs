# Project Structure Guide

Understanding the organization and file structure of KalxJS projects created by the CLI.

## Table of Contents

1. [Basic Project Structure](#basic-project-structure)
2. [With Router](#with-router)
3. [With State Management](#with-state-management)
4. [Full-Featured Project](#full-featured-project)
5. [Scaling Your Project](#scaling-your-project)
6. [Configuration Files](#configuration-files)
7. [File Naming Conventions](#file-naming-conventions)

---

## Basic Project Structure

Created with: `kalxjs create my-app`

```
my-app/
├── src/                          # Source code
│   ├── components/               # Reusable components
│   ├── assets/                   # Static assets (images, fonts, etc.)
│   ├── App.js                    # Root component
│   ├── main.js                   # Application entry point
│   └── styles.css                # Global styles
├── public/                        # Served as-is (favicons, robots.txt, etc.)
├── index.html                    # HTML template
├── package.json                  # Project metadata & dependencies
├── .gitignore                    # Git ignore rules
├── vite.config.js                # Vite configuration
├── README.md                     # Project documentation
└── .env                          # Environment variables

```

### File Descriptions

#### `src/`
Main application source code directory. All your components, styles, and logic live here.

#### `src/components/`
Stores reusable UI components:
```
src/components/
├── Button.js
├── Card.js
├── Header.js
└── Footer.js
```

#### `src/assets/`
Static files:
```
src/assets/
├── images/
│   └── logo.png
├── fonts/
│   └── custom-font.ttf
└── icons/
    └── menu.svg
```

#### `src/main.js`
Application entry point that mounts the root component:

```javascript
import { createApp } from '@kalxjs/core';
import App from './App.js';

const app = createApp(App);
app.mount('#app');
```

#### `src/App.js`
Root component of your application:

```javascript
export default {
  name: 'App',
  template: `
    <div class="app">
      <h1>Welcome to KalxJS</h1>
    </div>
  `
};
```

#### `public/`
Files here are served at the root URL without processing. Use for:
- `favicon.ico`
- `robots.txt`
- `manifest.json`
- Pre-compressed assets

#### `index.html`
HTML entry point:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>KalxJS App</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

#### `vite.config.js`
Vite development server & build configuration:

```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist'
  }
});
```

#### `package.json`
Project metadata and dependencies:

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "description": "My KalxJS App",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@kalxjs/core": "^2.2.8",
    "vue": "^3.3.0"
  }
}
```

#### `.gitignore`
Git ignore rules:

```
node_modules/
dist/
.env.local
.vscode/
.idea/
*.log
```

#### `.env`
Environment variables:

```
VITE_APP_TITLE=My App
VITE_API_URL=http://localhost:3001
```

Access in code:
```javascript
const title = import.meta.env.VITE_APP_TITLE;
```

---

## With Router

Created with: `kalxjs create my-app --router`

```
my-app/
├── src/
│   ├── components/
│   ├── views/                    # Page components
│   │   ├── HomeView.js
│   │   └── AboutView.js
│   ├── router/                   # Router configuration
│   │   ├── index.js              # Main router setup
│   │   └── routes/               # Individual route definitions
│   │       ├── home.js
│   │       └── about.js
│   ├── App.js
│   ├── main.js
│   └── styles.css
├── [rest as before]
```

### Router Setup

#### `src/router/index.js`
Main router configuration:

```javascript
import { createRouter, createWebHistory } from '@kalxjs/router';
import routes from './routes';

export const router = createRouter({
  history: createWebHistory(),
  routes
});
```

#### `src/router/routes/home.js`
Individual route:

```javascript
import HomeView from '../../views/HomeView.js';

export default {
  path: '/',
  name: 'Home',
  component: HomeView
};
```

#### `src/views/`
Page/route components. Conventionally named with `View` suffix:

```
src/views/
├── HomeView.js
├── AboutView.js
├── ProductsView.js
└── NotFoundView.js
```

---

## With State Management

Created with: `kalxjs create my-app --state`

```
my-app/
├── src/
│   ├── components/
│   ├── stores/                   # State management modules
│   │   ├── user.js
│   │   ├── products.js
│   │   └── ui.js
│   ├── App.js
│   ├── main.js
│   └── styles.css
├── [rest as before]
```

### Store Structure

#### `src/stores/user.js`
State management module:

```javascript
import { defineStore } from '@kalxjs/store';
import { ref, computed } from '@kalxjs/core';

export const useUserStore = defineStore('user', () => {
  const user = ref(null);
  const isAuthenticated = computed(() => !!user.value);

  const setUser = (userData) => {
    user.value = userData;
  };

  const logout = () => {
    user.value = null;
  };

  return { user, isAuthenticated, setUser, logout };
});
```

#### Using Store in Components

```javascript
import { useUserStore } from '../stores/user.js';

export default {
  setup() {
    const store = useUserStore();

    return {
      user: computed(() => store.user),
      logout: () => store.logout()
    };
  }
};
```

---

## Full-Featured Project

Created with: `kalxjs create my-app --router --state --scss --testing --linting`

```
my-app/
├── src/
│   ├── components/
│   │   ├── common/               # Shared components
│   │   │   ├── Button.js
│   │   │   ├── Card.js
│   │   │   └── Modal.js
│   │   ├── layout/               # Layout components
│   │   │   ├── Header.js
│   │   │   ├── Sidebar.js
│   │   │   └── Footer.js
│   │   └── features/             # Feature-specific components
│   │       ├── ProductCard.js
│   │       └── UserProfile.js
│   ├── views/
│   │   ├── HomeView.js
│   │   ├── ProductsView.js
│   │   └── UserProfileView.js
│   ├── router/
│   │   ├── index.js
│   │   └── routes/
│   │       ├── home.js
│   │       ├── products.js
│   │       └── user-profile.js
│   ├── stores/
│   │   ├── user.js
│   │   ├── products.js
│   │   └── ui.js
│   ├── styles/                   # Global & component styles
│   │   ├── main.scss             # Global imports
│   │   ├── variables.scss        # SCSS variables
│   │   ├── mixins.scss           # SCSS mixins
│   │   ├── components/           # Component styles
│   │   │   ├── Button.scss
│   │   │   ├── Card.scss
│   │   │   └── Modal.scss
│   │   └── views/                # Page/view styles
│   │       ├── HomeView.scss
│   │       └── ProductsView.scss
│   ├── composables/              # Reusable logic (optional)
│   │   ├── useFetch.js
│   │   └── useForm.js
│   ├── utils/                    # Utility functions (optional)
│   │   ├── api.js
│   │   └── helpers.js
│   ├── App.js
│   ├── main.js
│   └── polyfills.js
├── tests/                        # Test files
│   ├── unit/
│   │   └── components/
│   │       └── Button.test.js
│   ├── integration/
│   │   └── router.test.js
│   └── setup.js
├── public/
│   ├── favicon.ico
│   └── manifest.json
├── .env                          # Environment variables
├── .env.local                    # Local env (git-ignored)
├── .eslintrc.json                # ESLint configuration
├── .prettierrc                   # Prettier configuration
├── eslint.config.js              # ESLint config (newer format)
├── index.html
├── package.json
├── vite.config.js
├── jest.config.js                # Jest configuration
├── .gitignore
├── README.md
└── .gitkeep files (to preserve empty directories in git)
```

### Advanced Organization

For larger projects, consider:

```
src/
├── api/                          # API client modules
│   ├── client.js
│   ├── endpoints.js
│   └── interceptors.js
├── constants/                    # Application constants
│   ├── routes.js
│   ├── storage-keys.js
│   └── api-endpoints.js
├── hooks/                        # Custom composables/hooks
│   ├── useAuth.js
│   ├── usePagination.js
│   └── useFetch.js
├── plugins/                      # Vue plugins
│   ├── auth.js
│   ├── i18n.js
│   └── analytics.js
├── middleware/                   # Route/request middleware
│   ├── auth.js
│   └── permissions.js
├── layouts/                      # Layout components
│   ├── DefaultLayout.js
│   ├── AuthLayout.js
│   └── AdminLayout.js
└── [existing directories]
```

---

## Configuration Files

### vite.config.js

```javascript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],

  server: {
    port: 3000,
    open: true,
    hmr: true
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['@kalxjs/core', '@kalxjs/router']
        }
      }
    }
  },

  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
```

### jest.config.js

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
```

### .eslintrc.json

```json
{
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": ["eslint:recommended"],
  "parserOptions": {
    "ecmaVersion": 12,
    "sourceType": "module"
  },
  "rules": {
    "no-unused-vars": "warn",
    "semi": ["error", "always"],
    "quotes": ["error", "single"]
  }
}
```

---

## File Naming Conventions

### Components
- **PascalCase**: `Button.js`, `UserCard.js`, `FormInput.js`
- **Reason**: Constructor functions, ES6 class convention

```javascript
// ✅ Correct
export default { name: 'Button' }    // Button.js

// ❌ Incorrect
export default { name: 'button' }    // button.js
```

### Views / Pages
- **PascalCase with View suffix**: `HomeView.js`, `ProductsView.js`
- **Reason**: Clear distinction from components

```
src/views/
├── HomeView.js
├── ProductsView.js
├── UserProfileView.js
└── NotFoundView.js
```

### Stores
- **camelCase with 'use' prefix**: `useUserStore`, `useProductsStore`
- **Reason**: Composable/hook convention

```
src/stores/
├── user.js              // useUserStore
├── products.js          // useProductsStore
├── cart.js              // useCartStore
└── ui.js                // useUiStore
```

### Routes
- **kebab-case**: `about.js`, `user-profile.js`, `admin-dashboard.js`
- **Reason**: Matches URL paths

```
src/router/routes/
├── home.js              // /
├── about.js             // /about
├── user-profile.js      // /user-profile
└── admin-dashboard.js   // /admin-dashboard
```

### Composables/Hooks
- **camelCase with 'use' prefix**: `useFetch.js`, `useForm.js`, `useAuth.js`
- **Reason**: Hook convention

```
src/composables/
├── useFetch.js
├── useForm.js
├── useAuth.js
└── usePagination.js
```

### Utility Functions
- **camelCase**: `api.js`, `helpers.js`, `validators.js`

```
src/utils/
├── api.js
├── helpers.js
├── validators.js
└── formatters.js
```

### Styles
- **Match component name**: `Button.scss`, `Card.scss`
- **Location**: Mirrored in `src/styles/`

```
src/styles/
├── components/
│   ├── Button.scss      // Matches Button.js
│   ├── Card.scss        # Matches Card.js
│   └── Modal.scss
└── views/
    ├── HomeView.scss    // Matches HomeView.js
    └── ProductsView.scss
```

---

## Scaling Your Project

### Small Projects (< 5 pages)

```
src/
├── components/
├── views/
├── stores/
├── App.js
└── main.js
```

### Medium Projects (5-20 pages)

```
src/
├── components/
│   ├── common/
│   ├── layout/
│   └── features/
├── views/
├── stores/
├── router/
├── styles/
├── utils/
├── App.js
└── main.js
```

### Large Projects (20+ pages)

```
src/
├── components/
│   ├── common/
│   ├── layout/
│   ├── features/
│   ├── dashboard/
│   ├── admin/
│   └── shared/
├── views/
│   ├── public/
│   ├── dashboard/
│   └── admin/
├── stores/
├── router/
├── api/
├── composables/
├── utils/
├── constants/
├── styles/
├── middleware/
├── layouts/
├── plugins/
├── App.js
└── main.js
```

---

## Building for Production

```bash
kalxjs build
```

Creates `dist/` with optimized files:

```
dist/
├── index.html                    # Optimized HTML
├── assets/
│   ├── app-abc123.js            # Minified JavaScript
│   ├── app-def456.css           # Minified CSS
│   ├── vendor-789012.js         # Vendor code chunk
│   └── [other chunk files]
└── favicon.ico
```

### Deployment

1. Build your project:
```bash
kalxjs build
```

2. Deploy `dist/` directory to your host:
- Netlify
- Vercel
- GitHub Pages
- Your own server

---

## Environment Variables

Create `.env` file:

```
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=My App
VITE_DEBUG=true
```

Create `.env.local` (not committed):

```
VITE_API_TOKEN=secret_token
```

Access in code:

```javascript
const apiUrl = import.meta.env.VITE_API_URL;
const appName = import.meta.env.VITE_APP_NAME;
```

---

## Next Steps

1. **Generate Code**: Use [Code Generation Guide](./GENERATION.md)
2. **Advanced Features**: See [Advanced Usage](./ADVANCED_USAGE.md)
3. **Troubleshooting**: Check [Troubleshooting Guide](./TROUBLESHOOTING.md)