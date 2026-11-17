import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TimeCounter from './TimeCounter.vue';

describe('TimeCounter.vue', () => {
  it('formats minutes less than 60', () => {
    const wrapper = mount(TimeCounter, {
      props: { minutes: 42 },
    });
    expect(wrapper.text()).toBe('42 min');
  });

  it('formats hours and minutes when >= 60', () => {
    const wrapper = mount(TimeCounter, {
      props: { minutes: 95 },
    });
    expect(wrapper.text()).toBe('1h 35m');
  });

  it('formats exact hours without remaining minutes', () => {
    const wrapper = mount(TimeCounter, {
      props: { minutes: 120 },
    });
    expect(wrapper.text()).toBe('2h');
  });

  it('applies warning pulse classes when highlightWarning is true and minutes > 30', () => {
    const wrapper = mount(TimeCounter, {
      props: { minutes: 45, highlightWarning: true },
    });
    expect(wrapper.classes()).toContain('animate-pulse');
    expect(wrapper.classes()).toContain('text-rose-300');
  });
});
