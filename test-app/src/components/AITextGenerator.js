import { defineComponent, h, ref } from '@kalxjs/core';
import { aiManager, generateText, useAIHelper } from '../ai/aiManager';

export default defineComponent({
  name: 'AITextGenerator',
  props: {
    initialPrompt: String,
    placeholder: {
      type: String,
      default: 'Enter your prompt here...'
    },
    model: {
      type: String,
      default: 'gpt-3.5-turbo'
    },
    temperature: {
      type: Number,
      default: 0.7
    },
    maxLength: {
      type: Number,
      default: 200
    }
  },
  setup(props) {
    const prompt = ref(props.initialPrompt || '');
    const result = ref('');
    const loading = ref(false);
    const error = ref(null);

    // Use the AI helper for additional functionality
    const ai = useAIHelper();

    const generateContent = async () => {
      if (!prompt.value) return;

      loading.value = true;
      error.value = null;

      try {
        // Try using the helper function first (which handles both approaches)
        result.value = await generateText(prompt.value, {
          model: props.model,
          temperature: props.temperature,
          max_length: props.maxLength
        });
      } catch (err) {
        error.value = err.message || 'Failed to generate text';
        console.error('AI text generation error:', err);
      } finally {
        loading.value = false;
      }
    };

    return {
      prompt,
      result,
      loading,
      error,
      generateContent,
      ai,
      aiManager // Export the manager for advanced usage
    };
  },
  render() {
    return h('div', { class: 'ai-text-generator' }, [
      h('div', { class: 'input-group' }, [
        h('textarea', {
          value: this.prompt,
          onInput: (e) => this.prompt = e.target.value,
          placeholder: this.placeholder,
          rows: 3,
          style: 'width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid #e2e8f0;'
        })
      ]),

      h('div', { class: 'controls', style: 'margin-top: 1rem;' }, [
        h('button', {
          onClick: this.generateContent,
          disabled: this.loading || !this.prompt,
          style: `
            padding: 0.5rem 1rem;
            background-color: #4299e1;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: ${this.loading || !this.prompt ? 'not-allowed' : 'pointer'};
            opacity: ${this.loading || !this.prompt ? 0.7 : 1};
          `
        }, this.loading ? 'Generating...' : 'Generate Text')
      ]),

      this.error && h('div', {
        class: 'error',
        style: 'margin-top: 1rem; color: #e53e3e; padding: 0.5rem; background-color: #fff5f5; border-radius: 4px;'
      }, this.error),

      this.result && h('div', {
        class: 'result',
        style: 'margin-top: 1rem; padding: 1rem; background-color: #f7fafc; border-radius: 4px; border: 1px solid #e2e8f0;'
      }, this.result)
    ]);
  }
});