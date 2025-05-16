/**
 * @jest-environment jsdom
 */
import { 
  createStore, 
  mapState, 
  mapGetters, 
  mapMutations, 
  mapActions 
} from '@kalxjs/store';

// Mock the core reactivity module
jest.mock('../../core/src/reactivity/reactive', () => ({
  reactive: jest.fn(obj => ({ ...obj, __isReactive: true })),
  effect: jest.fn(fn => {
    fn();
    return () => {};
  })
}));

describe('@kalxjs/store', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock console methods
    jest.spyOn(console, 'warn').mockImplementation();
  });
  
  afterEach(() => {
    console.warn.mockRestore();
  });

  describe('createStore', () => {
    test('should create a store with initial state', () => {
      // Setup
      const initialState = { count: 0, user: { name: 'John' } };
      
      // Test
      const store = createStore({ state: initialState });
      
      // Assert
      expect(store.state).toEqual(expect.objectContaining(initialState));
      expect(store.state.__isReactive).toBe(true);
    });

    test('should register mutations', () => {
      // Setup
      const mutations = {
        increment: jest.fn((state, amount = 1) => {
          state.count += amount;
        })
      };
      
      // Test
      const store = createStore({
        state: { count: 0 },
        mutations
      });
      
      // Call mutation
      store.commit('increment', 5);
      
      // Assert
      expect(mutations.increment).toHaveBeenCalledWith(store.state, 5);
    });

    test('should warn on unknown mutation', () => {
      // Setup
      const store = createStore({
        state: { count: 0 },
        mutations: {
          increment: jest.fn()
        }
      });
      
      // Test
      store.commit('unknown');
      
      // Assert
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Unknown mutation type: unknown')
      );
    });

    test('should register actions', async () => {
      // Setup
      const actions = {
        incrementAsync: jest.fn().mockResolvedValue('result')
      };
      
      // Test
      const store = createStore({
        state: { count: 0 },
        actions
      });
      
      // Call action
      const result = await store.dispatch('incrementAsync', 5);
      
      // Assert
      expect(actions.incrementAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          commit: expect.any(Function),
          dispatch: expect.any(Function),
          state: store.state,
          getters: store.getters
        }),
        5
      );
      
      expect(result).toBe('result');
    });

    test('should warn on unknown action', async () => {
      // Setup
      const store = createStore({
        state: { count: 0 },
        actions: {
          incrementAsync: jest.fn()
        }
      });
      
      // Test
      await store.dispatch('unknown');
      
      // Assert
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Unknown action type: unknown')
      );
    });

    test('should register getters', () => {
      // Setup
      const getters = {
        doubleCount: jest.fn(state => state.count * 2),
        countPlusN: jest.fn((state, getters) => n => state.count + n)
      };
      
      // Test
      const store = createStore({
        state: { count: 10 },
        getters
      });
      
      // Access getters
      const doubleCount = store.getters.doubleCount;
      
      // Assert
      expect(getters.doubleCount).toHaveBeenCalledWith(store.state, store.getters);
      expect(doubleCount).toBeDefined();
    });

    test('should notify subscribers on mutation', () => {
      // Setup
      const subscriber = jest.fn();
      const store = createStore({
        state: { count: 0 },
        mutations: {
          increment: (state, amount = 1) => {
            state.count += amount;
          }
        }
      });
      
      // Subscribe
      store.subscribe(subscriber);
      
      // Test
      store.commit('increment', 5);
      
      // Assert
      expect(subscriber).toHaveBeenCalledWith(
        { type: 'increment', payload: 5 },
        store.state
      );
    });

    test('should unsubscribe correctly', () => {
      // Setup
      const subscriber = jest.fn();
      const store = createStore({
        state: { count: 0 },
        mutations: {
          increment: (state) => { state.count++; }
        }
      });
      
      // Subscribe and get unsubscribe function
      const unsubscribe = store.subscribe(subscriber);
      
      // First mutation should notify
      store.commit('increment');
      expect(subscriber).toHaveBeenCalledTimes(1);
      
      // Unsubscribe
      unsubscribe();
      
      // Second mutation should not notify
      store.commit('increment');
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    test('should warn if subscriber is not a function', () => {
      // Setup
      const store = createStore({ state: {} });
      
      // Test
      store.subscribe('not a function');
      
      // Assert
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Store subscriber must be a function')
      );
    });

    test('should install into Vue app', () => {
      // Setup
      const store = createStore({ state: {} });
      const app = {
        _context: {},
        config: {
          globalProperties: {}
        }
      };
      
      // Test
      store.install(app);
      
      // Assert
      expect(app._context.$store).toBe(store);
      expect(app.config.globalProperties.$store).toBe(store);
    });
  });

  describe('mapState', () => {
    test('should map state properties as array', () => {
      // Setup
      const store = {
        state: {
          count: 10,
          user: { name: 'John' }
        }
      };
      
      // Test
      const mappedState = mapState(['count', 'user']);
      
      // Create component context
      const component = {
        $store: store
      };
      
      // Assert
      expect(mappedState.count.call(component)).toBe(10);
      expect(mappedState.user.call(component)).toEqual({ name: 'John' });
    });

    test('should map state properties as object', () => {
      // Setup
      const store = {
        state: {
          count: 10,
          user: { name: 'John' }
        }
      };
      
      // Test
      const mappedState = mapState({
        myCount: 'count',
        myUser: 'user',
        custom: state => state.count * 2
      });
      
      // Create component context
      const component = {
        $store: store
      };
      
      // Assert
      expect(mappedState.myCount.call(component)).toBe(10);
      expect(mappedState.myUser.call(component)).toEqual({ name: 'John' });
      expect(mappedState.custom.call(component)).toBe(20);
    });

    test('should handle namespaced state', () => {
      // Setup
      const store = {
        state: {
          module1: {
            count: 10
          }
        }
      };
      
      // Test
      const mappedState = mapState('module1', ['count']);
      
      // Create component context
      const component = {
        $store: store
      };
      
      // Assert
      expect(mappedState.count.call(component)).toBe(10);
    });

    test('should warn if store is not injected', () => {
      // Setup
      const mappedState = mapState(['count']);
      
      // Create component context without store
      const component = {};
      
      // Test
      mappedState.count.call(component);
      
      // Assert
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('No store injected')
      );
    });
  });

  describe('mapGetters', () => {
    test('should map getters as array', () => {
      // Setup
      const store = {
        getters: {
          doubleCount: 20,
          isAdmin: true
        }
      };
      
      // Test
      const mappedGetters = mapGetters(['doubleCount', 'isAdmin']);
      
      // Create component context
      const component = {
        $store: store
      };
      
      // Assert
      expect(mappedGetters.doubleCount.call(component)).toBe(20);
      expect(mappedGetters.isAdmin.call(component)).toBe(true);
    });

    test('should map getters as object', () => {
      // Setup
      const store = {
        getters: {
          doubleCount: 20,
          isAdmin: true
        }
      };
      
      // Test
      const mappedGetters = mapGetters({
        myDouble: 'doubleCount',
        myAdmin: 'isAdmin'
      });
      
      // Create component context
      const component = {
        $store: store
      };
      
      // Assert
      expect(mappedGetters.myDouble.call(component)).toBe(20);
      expect(mappedGetters.myAdmin.call(component)).toBe(true);
    });

    test('should handle namespaced getters', () => {
      // Setup
      const store = {
        getters: {
          'module1/doubleCount': 20
        }
      };
      
      // Test
      const mappedGetters = mapGetters('module1', ['doubleCount']);
      
      // Create component context
      const component = {
        $store: store
      };
      
      // Assert
      expect(mappedGetters.doubleCount.call(component)).toBe(20);
    });

    test('should warn if store is not injected', () => {
      // Setup
      const mappedGetters = mapGetters(['doubleCount']);
      
      // Create component context without store
      const component = {};
      
      // Test
      mappedGetters.doubleCount.call(component);
      
      // Assert
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('No store injected')
      );
    });
  });

  describe('mapMutations', () => {
    test('should map mutations as array', () => {
      // Setup
      const store = {
        commit: jest.fn()
      };
      
      // Test
      const mappedMutations = mapMutations(['increment', 'decrement']);
      
      // Create component context
      const component = {
        $store: store
      };
      
      // Call mapped mutation
      mappedMutations.increment.call(component, 5);
      
      // Assert
      expect(store.commit).toHaveBeenCalledWith('increment', 5);
    });

    test('should map mutations as object', () => {
      // Setup
      const store = {
        commit: jest.fn()
      };
      
      // Test
      const mappedMutations = mapMutations({
        add: 'increment',
        remove: 'decrement'
      });
      
      // Create component context
      const component = {
        $store: store
      };
      
      // Call mapped mutation
      mappedMutations.add.call(component, 5);
      
      // Assert
      expect(store.commit).toHaveBeenCalledWith('increment', 5);
    });

    test('should handle namespaced mutations', () => {
      // Setup
      const store = {
        commit: jest.fn()
      };
      
      // Test
      const mappedMutations = mapMutations('module1', ['increment']);
      
      // Create component context
      const component = {
        $store: store
      };
      
      // Call mapped mutation
      mappedMutations.increment.call(component, 5);
      
      // Assert
      expect(store.commit).toHaveBeenCalledWith('module1/increment', 5);
    });

    test('should warn if store is not injected', () => {
      // Setup
      const mappedMutations = mapMutations(['increment']);
      
      // Create component context without store
      const component = {};
      
      // Test
      mappedMutations.increment.call(component, 5);
      
      // Assert
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('No store injected')
      );
    });
  });

  describe('mapActions', () => {
    test('should map actions as array', () => {
      // Setup
      const store = {
        dispatch: jest.fn().mockResolvedValue('result')
      };
      
      // Test
      const mappedActions = mapActions(['fetchData', 'saveData']);
      
      // Create component context
      const component = {
        $store: store
      };
      
      // Call mapped action
      mappedActions.fetchData.call(component, { id: 1 });
      
      // Assert
      expect(store.dispatch).toHaveBeenCalledWith('fetchData', { id: 1 });
    });

    test('should map actions as object', () => {
      // Setup
      const store = {
        dispatch: jest.fn().mockResolvedValue('result')
      };
      
      // Test
      const mappedActions = mapActions({
        fetch: 'fetchData',
        save: 'saveData'
      });
      
      // Create component context
      const component = {
        $store: store
      };
      
      // Call mapped action
      mappedActions.fetch.call(component, { id: 1 });
      
      // Assert
      expect(store.dispatch).toHaveBeenCalledWith('fetchData', { id: 1 });
    });

    test('should handle namespaced actions', () => {
      // Setup
      const store = {
        dispatch: jest.fn().mockResolvedValue('result')
      };
      
      // Test
      const mappedActions = mapActions('module1', ['fetchData']);
      
      // Create component context
      const component = {
        $store: store
      };
      
      // Call mapped action
      mappedActions.fetchData.call(component, { id: 1 });
      
      // Assert
      expect(store.dispatch).toHaveBeenCalledWith('module1/fetchData', { id: 1 });
    });

    test('should warn if store is not injected', () => {
      // Setup
      const mappedActions = mapActions(['fetchData']);
      
      // Create component context without store
      const component = {};
      
      // Test
      mappedActions.fetchData.call(component, { id: 1 });
      
      // Assert
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('No store injected')
      );
    });
  });
});