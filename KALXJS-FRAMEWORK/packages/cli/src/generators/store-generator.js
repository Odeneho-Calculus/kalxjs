/**
 * Store Generator
 * Generate store modules
 *
 * @module @kalxjs/cli/generators/store-generator
 */

import path from 'path';
import { writeFile, ensureDir } from '../utils/file-system.js';

/**
 * Generate store module
 */
export async function generateStore(name, options = {}) {
    const {
        style = 'pinia',
        directory = 'src/store/modules',
        withPersistence = false,
    } = options;

    const storePath = path.join(process.cwd(), directory);
    await ensureDir(storePath);

    // Generate store file
    const storeContent = style === 'pinia'
        ? generatePiniaStore(name, withPersistence)
        : generateVuexStore(name, withPersistence);

    const storeFilePath = path.join(storePath, `${name}.js`);
    await writeFile(storeFilePath, storeContent);

    console.log(`✓ Created store module: ${storeFilePath}`);

    // Generate test file
    const testContent = generateStoreTest(name, style);
    const testFilePath = path.join(storePath, `${name}.test.js`);
    await writeFile(testFilePath, testContent);

    console.log(`✓ Created test: ${testFilePath}`);

    return {
        storePath: storeFilePath,
        testPath: testFilePath,
        name,
    };
}

/**
 * Generate Pinia-style store
 */
function generatePiniaStore(name, withPersistence) {
    const persistencePlugin = withPersistence
        ? `,
    persist: {
      enabled: true,
      strategies: [
        {
          key: '${name}-store',
          storage: localStorage,
        },
      ],
    },`
        : '';

    return `/**
 * ${name.charAt(0).toUpperCase() + name.slice(1)} Store
 * Pinia-style store module
 */
import { defineStore } from '@kalxjs/store';
import { ref, computed } from '@kalxjs/core';

export const use${name.charAt(0).toUpperCase() + name.slice(1)}Store = defineStore('${name}', () => {
  // State
  const items = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // Getters
  const itemCount = computed(() => items.value.length);
  const hasItems = computed(() => items.value.length > 0);

  // Actions
  async function fetchItems() {
    loading.value = true;
    error.value = null;

    try {
      // Replace with actual API call
      const response = await fetch('/api/${name}');
      const data = await response.json();
      items.value = data;
    } catch (err) {
      error.value = err.message;
      console.error('Failed to fetch items:', err);
    } finally {
      loading.value = false;
    }
  }

  function addItem(item) {
    items.value.push(item);
  }

  function removeItem(id) {
    const index = items.value.findIndex(item => item.id === id);
    if (index !== -1) {
      items.value.splice(index, 1);
    }
  }

  function updateItem(id, updates) {
    const item = items.value.find(item => item.id === id);
    if (item) {
      Object.assign(item, updates);
    }
  }

  function clearItems() {
    items.value = [];
  }

  function reset() {
    items.value = [];
    loading.value = false;
    error.value = null;
  }

  return {
    // State
    items,
    loading,
    error,

    // Getters
    itemCount,
    hasItems,

    // Actions
    fetchItems,
    addItem,
    removeItem,
    updateItem,
    clearItems,
    reset,
  };
}${persistencePlugin});
`;
}

/**
 * Generate Vuex-style store
 */
function generateVuexStore(name, withPersistence) {
    return `/**
 * ${name.charAt(0).toUpperCase() + name.slice(1)} Store Module
 * Vuex-style store module
 */

const state = () => ({
  items: [],
  loading: false,
  error: null,
});

const getters = {
  itemCount: (state) => state.items.length,
  hasItems: (state) => state.items.length > 0,
};

const mutations = {
  SET_ITEMS(state, items) {
    state.items = items;
  },

  SET_LOADING(state, loading) {
    state.loading = loading;
  },

  SET_ERROR(state, error) {
    state.error = error;
  },

  ADD_ITEM(state, item) {
    state.items.push(item);
  },

  REMOVE_ITEM(state, id) {
    const index = state.items.findIndex(item => item.id === id);
    if (index !== -1) {
      state.items.splice(index, 1);
    }
  },

  UPDATE_ITEM(state, { id, updates }) {
    const item = state.items.find(item => item.id === id);
    if (item) {
      Object.assign(item, updates);
    }
  },

  CLEAR_ITEMS(state) {
    state.items = [];
  },

  RESET(state) {
    Object.assign(state, state());
  },
};

const actions = {
  async fetchItems({ commit }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);

    try {
      // Replace with actual API call
      const response = await fetch('/api/${name}');
      const data = await response.json();
      commit('SET_ITEMS', data);
    } catch (error) {
      commit('SET_ERROR', error.message);
      console.error('Failed to fetch items:', error);
    } finally {
      commit('SET_LOADING', false);
    }
  },

  addItem({ commit }, item) {
    commit('ADD_ITEM', item);
  },

  removeItem({ commit }, id) {
    commit('REMOVE_ITEM', id);
  },

  updateItem({ commit }, { id, updates }) {
    commit('UPDATE_ITEM', { id, updates });
  },

  clearItems({ commit }) {
    commit('CLEAR_ITEMS');
  },

  reset({ commit }) {
    commit('RESET');
  },
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
};
`;
}

/**
 * Generate store test
 */
function generateStoreTest(name, style) {
    if (style === 'pinia') {
        return `import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from '@kalxjs/store';
import { use${name.charAt(0).toUpperCase() + name.slice(1)}Store } from './${name}';

describe('${name} Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('initializes with empty items', () => {
    const store = use${name.charAt(0).toUpperCase() + name.slice(1)}Store();
    expect(store.items).toEqual([]);
    expect(store.itemCount).toBe(0);
    expect(store.hasItems).toBe(false);
  });

  it('adds items', () => {
    const store = use${name.charAt(0).toUpperCase() + name.slice(1)}Store();
    const item = { id: 1, name: 'Test Item' };

    store.addItem(item);

    expect(store.items).toHaveLength(1);
    expect(store.items[0]).toEqual(item);
    expect(store.itemCount).toBe(1);
  });

  it('removes items', () => {
    const store = use${name.charAt(0).toUpperCase() + name.slice(1)}Store();
    const item = { id: 1, name: 'Test Item' };

    store.addItem(item);
    store.removeItem(1);

    expect(store.items).toHaveLength(0);
  });

  it('updates items', () => {
    const store = use${name.charAt(0).toUpperCase() + name.slice(1)}Store();
    const item = { id: 1, name: 'Test Item' };

    store.addItem(item);
    store.updateItem(1, { name: 'Updated Item' });

    expect(store.items[0].name).toBe('Updated Item');
  });

  it('clears all items', () => {
    const store = use${name.charAt(0).toUpperCase() + name.slice(1)}Store();

    store.addItem({ id: 1, name: 'Item 1' });
    store.addItem({ id: 2, name: 'Item 2' });
    store.clearItems();

    expect(store.items).toHaveLength(0);
  });
});
`;
    } else {
        return `import { describe, it, expect } from 'vitest';
import ${name}Module from './${name}';

describe('${name} Module', () => {
  it('has correct initial state', () => {
    const state = ${name}Module.state();
    expect(state.items).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('SET_ITEMS mutation works', () => {
    const state = ${name}Module.state();
    const items = [{ id: 1, name: 'Test' }];

    ${name}Module.mutations.SET_ITEMS(state, items);

    expect(state.items).toEqual(items);
  });

  it('ADD_ITEM mutation works', () => {
    const state = ${name}Module.state();
    const item = { id: 1, name: 'Test Item' };

    ${name}Module.mutations.ADD_ITEM(state, item);

    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toEqual(item);
  });

  it('itemCount getter works', () => {
    const state = ${name}Module.state();
    state.items = [{ id: 1 }, { id: 2 }];

    const count = ${name}Module.getters.itemCount(state);

    expect(count).toBe(2);
  });
});
`;
    }
}

/**
 * Export default
 */
export default generateStore;