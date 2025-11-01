import { h } from '@kalxjs/core';

// Mock user data
const users = {
    'john': { username: 'john', email: 'john@example.com', role: 'admin', joined: '2020-01-15' },
    'jane': { username: 'jane', email: 'jane@example.com', role: 'moderator', joined: '2021-03-20' },
    'bob': { username: 'bob', email: 'bob@example.com', role: 'user', joined: '2023-06-10' },
    'alice': { username: 'alice', email: 'alice@example.com', role: 'user', joined: '2023-08-25' }
};

export default {
    name: 'UserProfile',
    setup() {
        const switchTab = (tabName) => {
            if (window.router) {
                const username = window.router.currentRoute?.params?.username;
                window.router.push({
                    path: `/user/${username}`,
                    query: { tab: tabName }
                });
            }
        };

        const goToUser = (username) => {
            if (window.router) {
                window.router.push(`/user/${username}?tab=profile`);
            }
        };

        return {
            switchTab,
            goToUser
        };
    },
    render() {
        // Get current route and extract data directly
        const route = window.router?.currentRoute || {};
        const username = route.params?.username;

        // Get user data from mock data
        const userData = users[username] || {
            username: username,
            email: `${username}@example.com`,
            role: 'user',
            joined: 'N/A'
        };

        // Get active tab from query parameter
        const activeTab = route.query?.tab || 'profile';

        return h('div', { class: 'user-profile-page' }, [
            h('h1', null, `User Profile - @${userData.username}`),
            h('div', { class: 'user-info' }, [
                h('p', null, `Username: ${userData.username}`),
                h('p', null, `Email: ${userData.email}`),
                h('p', null, `Role: ${userData.role}`),
                h('p', null, `Joined: ${userData.joined}`)
            ]),
            h('div', { class: 'tabs' }, [
                h('button', {
                    class: activeTab === 'profile' ? 'active' : '',
                    onclick: () => this.switchTab('profile')
                }, 'Profile'),
                h('button', {
                    class: activeTab === 'settings' ? 'active' : '',
                    onclick: () => this.switchTab('settings')
                }, 'Settings'),
                h('button', {
                    class: activeTab === 'posts' ? 'active' : '',
                    onclick: () => this.switchTab('posts')
                }, 'Posts')
            ]),
            h('div', { class: 'tab-content' }, [
                h('p', null, `Active Tab: ${activeTab}`)
            ]),
            h('div', { class: 'user-navigation' }, [
                h('button', { onclick: () => this.goToUser('john') }, 'Go to @john'),
                h('button', { onclick: () => this.goToUser('jane') }, 'Go to @jane'),
                h('button', { onclick: () => this.goToUser('bob') }, 'Go to @bob'),
                h('button', { onclick: () => window.router.push('/') }, 'Back to Home')
            ])
        ]);
    }
};