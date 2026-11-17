import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import PriorityBadge from './PriorityBadge.vue';
import { SchedulePriority } from '../../types';
import { setLocale } from '../../i18n';

describe('PriorityBadge.vue', () => {
  beforeEach(() => {
    setLocale('pt-BR');
  });

  it('renders priority badges correctly in Portuguese (pt-BR)', () => {
    const wrapperUrgent = mount(PriorityBadge, {
      props: { priority: SchedulePriority.URGENT },
    });
    expect(wrapperUrgent.text()).toBe('Urgente');

    const wrapperHigh = mount(PriorityBadge, {
      props: { priority: SchedulePriority.HIGH },
    });
    expect(wrapperHigh.text()).toBe('Alta');

    const wrapperNormal = mount(PriorityBadge, {
      props: { priority: SchedulePriority.NORMAL },
    });
    expect(wrapperNormal.text()).toBe('Normal');

    const wrapperLow = mount(PriorityBadge, {
      props: { priority: SchedulePriority.LOW },
    });
    expect(wrapperLow.text()).toBe('Baixa');
  });

  it('renders priority badges correctly in English (en)', () => {
    setLocale('en');

    const wrapperUrgent = mount(PriorityBadge, {
      props: { priority: SchedulePriority.URGENT },
    });
    expect(wrapperUrgent.text()).toBe('Urgent');

    const wrapperHigh = mount(PriorityBadge, {
      props: { priority: SchedulePriority.HIGH },
    });
    expect(wrapperHigh.text()).toBe('High');

    const wrapperNormal = mount(PriorityBadge, {
      props: { priority: SchedulePriority.NORMAL },
    });
    expect(wrapperNormal.text()).toBe('Normal');

    const wrapperLow = mount(PriorityBadge, {
      props: { priority: SchedulePriority.LOW },
    });
    expect(wrapperLow.text()).toBe('Low');
  });
});
