import { h } from '@kalxjs/core';

// Mock data
const categories = {
    'electronics': { id: 'electronics', name: 'Electronics' },
    'clothing': { id: 'clothing', name: 'Clothing' },
    'books': { id: 'books', name: 'Books' }
};

const categoryItems = {
    'electronics': {
        '1': { name: 'Laptop Pro', description: 'High-performance laptop', price: '$1299' },
        '2': { name: 'USB-C Cable', description: 'Premium USB-C cable', price: '$15' },
        '3': { name: 'Monitor', description: '4K Ultra HD Monitor', price: '$399' }
    },
    'clothing': {
        '1': { name: 'T-Shirt', description: 'Cotton T-Shirt', price: '$25' },
        '2': { name: 'Jeans', description: 'Blue Denim Jeans', price: '$65' },
        '3': { name: 'Jacket', description: 'Winter Jacket', price: '$150' }
    },
    'books': {
        '1': { name: 'JavaScript Guide', description: 'Complete JS tutorial', price: '$30' },
        '2': { name: 'React Mastery', description: 'Advanced React patterns', price: '$45' },
        '3': { name: 'Web Design', description: 'Modern web design principles', price: '$35' }
    }
};

export default {
    name: 'CategoryItem',
    setup() {
        const goToOtherItem = (categoryId, itemId) => {
            if (window.router) {
                window.router.push(`/category/${categoryId}/item/${itemId}`);
            }
        };

        const goToCategory = (categoryId) => {
            if (window.router) {
                window.router.push({
                    path: `/category/${categoryId}`,
                    query: { view: 'grid' }
                });
            }
        };

        return {
            goToOtherItem,
            goToCategory
        };
    },
    render() {
        // Get current route and extract data directly
        const route = window.router?.currentRoute || {};
        const categoryId = route.params?.categoryId;
        const itemId = route.params?.itemId;

        // Get category data
        const cat = categories[categoryId];
        const categoryName = cat?.name || categoryId || 'Unknown';

        // Get item data
        const item = categoryItems[categoryId]?.[itemId];
        const itemData = {
            categoryId: categoryId,
            itemId: itemId,
            categoryName: categoryName,
            itemName: item?.name || `Item ${itemId}`,
            description: item?.description || 'Item not found',
            price: item?.price || 'N/A'
        };

        return h('div', { class: 'category-item-page' }, [
            h('div', { class: 'breadcrumb' }, [
                h('span', null, 'Category: '),
                h('strong', null, itemData.categoryName),
                h('span', null, ' > Item: '),
                h('strong', null, itemData.itemName)
            ]),
            h('h1', null, itemData.itemName),
            h('div', { class: 'item-details' }, [
                h('p', null, `Category ID: ${itemData.categoryId}`),
                h('p', null, `Item ID: ${itemData.itemId}`),
                h('p', null, `Category: ${itemData.categoryName}`),
                h('p', null, `Description: ${itemData.description}`),
                h('p', null, `Price: ${itemData.price}`)
            ]),
            h('div', { class: 'nested-navigation' }, [
                h('h3', null, 'Other Items in This Category'),
                h('button', { onclick: () => this.goToOtherItem(categoryId, '1') }, 'Item 1'),
                h('button', { onclick: () => this.goToOtherItem(categoryId, '2') }, 'Item 2'),
                h('button', { onclick: () => this.goToOtherItem(categoryId, '3') }, 'Item 3')
            ]),
            h('div', { class: 'category-navigation' }, [
                h('h3', null, 'Other Categories'),
                h('button', { onclick: () => this.goToCategory('electronics') }, 'Electronics'),
                h('button', { onclick: () => this.goToCategory('clothing') }, 'Clothing'),
                h('button', { onclick: () => this.goToCategory('books') }, 'Books'),
                h('button', { onclick: () => window.router.push('/') }, 'Home')
            ])
        ]);
    }
};