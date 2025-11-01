import { h } from '@kalxjs/core';

export default {
    name: 'Search',
    setup() {
        const performSearch = (query) => {
            if (window.router) {
                window.router.push({
                    path: '/search',
                    query: {
                        q: query,
                        category: 'all',
                        sort: 'relevance',
                        page: '1'
                    }
                });
            }
        };

        const filterByCategory = (category, currentQuery, currentSort) => {
            if (window.router) {
                window.router.push({
                    path: '/search',
                    query: {
                        q: currentQuery,
                        category: category,
                        sort: currentSort,
                        page: '1'
                    }
                });
            }
        };

        const changePage = (page, currentQuery, currentCategory, currentSort) => {
            if (window.router) {
                window.router.push({
                    path: '/search',
                    query: {
                        q: currentQuery,
                        category: currentCategory,
                        sort: currentSort,
                        page: page
                    }
                });
            }
        };

        return {
            performSearch,
            filterByCategory,
            changePage
        };
    },
    render() {
        // Get current route and extract data directly
        const route = window.router?.currentRoute || {};
        const query = route.query || {};

        const searchData = {
            query: query.q || '',
            category: query.category || 'all',
            sort: query.sort || 'relevance',
            page: query.page || '1',
            limit: query.limit || '10'
        };

        // Generate mock search results based on query
        let results = [];
        if (searchData.query) {
            results = [
                { id: 1, title: `${searchData.query} Result 1`, category: searchData.category },
                { id: 2, title: `${searchData.query} Result 2`, category: searchData.category },
                { id: 3, title: `${searchData.query} Result 3`, category: searchData.category }
            ];
        }

        return h('div', { class: 'search-page' }, [
            h('h1', null, 'Search Products'),
            h('div', { class: 'search-info' }, [
                h('p', null, `Query: "${searchData.query}"`),
                h('p', null, `Category: ${searchData.category}`),
                h('p', null, `Sort: ${searchData.sort}`),
                h('p', null, `Page: ${searchData.page}/${Math.ceil(parseInt(searchData.limit))}`)
            ]),
            h('div', { class: 'filters' }, [
                h('div', null, [
                    h('h3', null, 'Category'),
                    h('button', { onclick: () => this.filterByCategory('all', searchData.query, searchData.sort) }, 'All'),
                    h('button', { onclick: () => this.filterByCategory('electronics', searchData.query, searchData.sort) }, 'Electronics'),
                    h('button', { onclick: () => this.filterByCategory('media', searchData.query, searchData.sort) }, 'Media'),
                    h('button', { onclick: () => this.filterByCategory('audio', searchData.query, searchData.sort) }, 'Audio')
                ])
            ]),
            h('div', { class: 'results' }, [
                h('h2', null, `Results (${results.length})`),
                ...results.map(result =>
                    h('div', { class: 'result-item' }, [
                        h('h4', null, result.title),
                        h('p', null, `Category: ${result.category}`)
                    ])
                )
            ]),
            h('div', { class: 'pagination' }, [
                h('button', { onclick: () => this.changePage('1', searchData.query, searchData.category, searchData.sort) }, 'Page 1'),
                h('button', { onclick: () => this.changePage('2', searchData.query, searchData.category, searchData.sort) }, 'Page 2'),
                h('button', { onclick: () => this.changePage('3', searchData.query, searchData.category, searchData.sort) }, 'Page 3')
            ]),
            h('div', { class: 'search-tests' }, [
                h('button', { onclick: () => this.performSearch('laptop') }, 'Search: laptop'),
                h('button', { onclick: () => this.performSearch('phone') }, 'Search: phone'),
                h('button', { onclick: () => window.router.push('/') }, 'Back to Home')
            ])
        ]);
    }
};