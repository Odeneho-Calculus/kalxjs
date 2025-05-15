<template>
  <div class="counter">
    <h1>Counter: {{ count }}</h1>
    <div class="counter-controls">
      <button class="counter-button decrement" @click="decrement">-</button>
      <button class="counter-button reset" @click="reset">Reset</button>
      <button class="counter-button increment" @click="increment">+</button>
    </div>
    <div class="counter-stats">
      <div class="stat-item">
        <div class="stat-label">Double Count</div>
        <div class="stat-value">{{ doubleCount }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Is Even?</div>
        <div class="stat-value">{{ isEven }}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CounterComponent',
  
  data() {
    return {
      count: 0
    };
  },
  
  computed: {
    doubleCount() {
      return this.count * 2;
    },
    
    isEven() {
      return this.count % 2 === 0 ? 'Yes' : 'No';
    }
  },
  
  methods: {
    increment() {
      this.count++;
    },
    
    decrement() {
      this.count--;
    },
    
    reset() {
      this.count = 0;
    }
  },
  
  mounted() {
    console.log('Counter component mounted!');
  }
};
</script>

<style>
.counter {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  font-family: Arial, sans-serif;
  text-align: center;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.counter-controls {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.counter-button {
  width: 60px;
  height: 60px;
  font-size: 1.5rem;
  font-weight: bold;
  border: none;
  border-radius: 50%;
  cursor: pointer;
}

.counter-button.increment {
  background-color: #42b883;
  color: white;
}

.counter-button.decrement {
  background-color: #e74c3c;
  color: white;
}

.counter-button.reset {
  background-color: #7f8c8d;
  color: white;
  font-size: 0.9rem;
}

.counter-stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #35495e;
}
</style>