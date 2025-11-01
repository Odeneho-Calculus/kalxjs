import { h } from '@kalxjs/core';

// Mock product data
const products = {
    1: { id: 1, name: 'Laptop', price: '$999', category: 'Electronics' },
    2: { id: 2, name: 'Phone', price: '$599', category: 'Electronics' },
    3: { id: 3, name: 'Tablet', price: '$299', category: 'Electronics' },
    101: { id: 101, name: 'Book', price: '$25', category: 'Media' },
    202: { id: 202, name: 'Headphones', price: '$149', category: 'Audio' }
};

export default {
    name: 'Product',
    setup() {
        const goToOtherProduct = (productId) => {
            if (window.router) {
                window.router.push({
                    path: `/product/${productId}`,
                    query: { color: 'red', discount: '10%' }
                });
            }
        };

        return {
            goToOtherProduct
        };
    },
    render() {
        // Get current route and extract data directly
        const route = window.router?.currentRoute || {};
        const productId = route.params?.id;
        const product = products[productId] || {
            id: productId,
            name: productId ? `Product ${productId}` : 'Product',
            price: 'N/A',
            category: productId ? 'Unknown' : 'N/A'
        };

        const query = route.query || {};
        const queryParams = {
            discount: query.discount || 'none',
            color: query.color || 'default',
            size: query.size || 'medium'
        };

        return h('div', { class: 'product-page' }, [
            h('h1', null, `Product Details - ${product.name || 'Unknown'}`),
            h('div', { class: 'product-info' }, [
                h('p', null, `ID: ${product.id || 'N/A'}`),
                h('p', null, `Name: ${product.name || 'N/A'}`),
                h('p', null, `Price: ${product.price || 'N/A'}`),
                h('p', null, `Category: ${product.category || 'N/A'}`)
            ]),
            h('div', { class: 'query-params' }, [
                h('h2', null, 'Query Parameters'),
                h('p', null, `Discount: ${query.discount || 'none'}`),
                h('p', null, `Color: ${query.color || 'default'}`),
                h('p', null, `Size: ${query.size || 'medium'}`)
            ]),
            h('div', { class: 'navigation-buttons' }, [
                h('button', { onclick: () => this.goToOtherProduct(1) }, 'Go to Product 1'),
                h('button', { onclick: () => this.goToOtherProduct(2) }, 'Go to Product 2'),
                h('button', { onclick: () => this.goToOtherProduct(101) }, 'Go to Product 101'),
                h('button', { onclick: () => window.router.push('/') }, 'Back to Home')
            ])
        ]);
    }
};