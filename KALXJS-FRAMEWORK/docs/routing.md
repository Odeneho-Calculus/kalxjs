# Routing

KALXJS provides a powerful routing system for building single-page applications.

## Basic Usage

```javascript
import { createApp } from 'kalxjs-framework/core';
import { createRouter } from 'kalxjs-framework/router';

// Define components
const Home = { template: '<div>Home Page</div>' };
const About = { template: '<div>About Page</div>' };
const NotFound = { template: '<div>Page Not Found</div>' };

// Create router instance
const router = createRouter({
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About },
    { path: '/:pathMatch(.*)*', component: NotFound }
  ]
});

// Create app and use router
const app = createApp({
  template: `
    <div>
      <nav>
        <router-link to="/">Home</router-link>
        <router-link to="/about">About</router-link>
      </nav>
      <router-view></router-view>
    </div>
  `
});

app.use(router);
app.mount('#app');
```

## Route Parameters

You can define dynamic route parameters:

```javascript
const router = createRouter({
  routes: [
    { path: '/user/:id', component: User }
  ]
});

// In the User component
const User = {
  template: '<div>User ID: {{ $route.params.id }}</div>'
};
```

## Nested Routes

Routes can be nested for complex layouts:

```javascript
const router = createRouter({
  routes: [
    { 
      path: '/user', 
      component: UserLayout,
      children: [
        { path: '', component: UserHome },
        { path: 'profile', component: UserProfile },
        { path: 'posts', component: UserPosts }
      ]
    }
  ]
});

// UserLayout component
const UserLayout = {
  template: `
    <div>
      <h2>User Section</h2>
      <nav>
        <router-link to="/user">Dashboard</router-link>
        <router-link to="/user/profile">Profile</router-link>
        <router-link to="/user/posts">Posts</router-link>
      </nav>
      <router-view></router-view>
    </div>
  `
};
```

## Navigation Guards

You can control navigation with guards:

```javascript
// Global guards
router.beforeEach((to, from) => {
  // Check if the user is authenticated
  if (to.meta.requiresAuth && !isAuthenticated()) {
    return '/login';
  }
});

// Route-specific guards
const router = createRouter({
  routes: [
    {
      path: '/admin',
      component: Admin,
      meta: { requiresAuth: true },
      beforeEnter: (to, from) => {
        // Additional checks
        if (!hasAdminRights()) {
          return '/unauthorized';
        }
      }
    }
  ]
});

// Component guards
const ProfileComponent = {
  template: '<div>Profile</div>',
  beforeRouteEnter(to, from, next) {
    // Called before the component is created
    next(vm => {
      // Access to component instance via `vm`
    });
  },
  beforeRouteUpdate(to, from) {
    // Called when the route changes but this component is reused
  },
  beforeRouteLeave(to, from) {
    // Called when navigating away from this component
    if (hasUnsavedChanges()) {
      if (!confirm('Discard changes?')) {
        return false;
      }
    }
  }
};
```

## Programmatic Navigation

You can navigate programmatically:

```javascript
// In a component
const NavigationExample = {
  methods: {
    goToHome() {
      this.$router.push('/');
    },
    goToUser(id) {
      this.$router.push(`/user/${id}`);
    },
    goBack() {
      this.$router.back();
    },
    replaceRoute() {
      this.$router.replace('/new-path');
    }
  },
  template: `
    <div>
      <button @click="goToHome">Go Home</button>
      <button @click="goToUser(123)">Go to User 123</button>
      <button @click="goBack">Go Back</button>
      <button @click="replaceRoute">Replace Route</button>
    </div>
  `
};
```