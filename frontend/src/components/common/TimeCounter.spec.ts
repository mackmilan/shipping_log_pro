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

  it('formats seconds with minutes and seconds correctly', () => {
    const wrapper = mount(TimeCounter, {
      props: { seconds: 125 },
    });
    expect(wrapper.text()).toBe('2m 05s');
  });

  it('formats hours, minutes and seconds when seconds >= 3600', () => {
    const wrapper = mount(TimeCounter, {
      props: { seconds: 3665 },
    });
    expect(wrapper.text()).toBe('1h 01m 05s');
  });

  it('computes elapsed seconds from startedAt to endedAt', () => {
    const start = new Date('2026-11-16T10:00:00Z');
    const end = new Date('2026-11-16T10:03:45Z');
    const wrapper = mount(TimeCounter, {
      props: { startedAt: start, endedAt: end },
    });
    expect(wrapper.text()).toBe('3m 45s');
  });

  it('displays real-time live indicator dot when live is true', () => {
    const start = new Date(Date.now() - 30 * 1000); // 30s ago
    const wrapper = mount(TimeCounter, {
      props: { startedAt: start, live: true },
    });
    const dot = wrapper.find('.animate-pulse');
    expect(dot.exists()).toBe(true);
    expect(wrapper.text()).toContain('0m 30s');
  });
});
