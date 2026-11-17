import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import StageBadge from './StageBadge.vue';
import { ScheduleStage } from '../../types';

describe('StageBadge.vue', () => {
  it('renders "Em Trânsito" badge correctly', () => {
    const wrapper = mount(StageBadge, {
      props: {
        stage: ScheduleStage.IN_TRANSIT,
      },
    });
    expect(wrapper.text()).toContain('Em Trânsito');
    expect(wrapper.classes()).toContain('text-blue-400');
  });

  it('renders "Parado" badge with pulse warning animation', () => {
    const wrapper = mount(StageBadge, {
      props: {
        stage: ScheduleStage.STOPPED,
        showDot: true,
      },
    });
    expect(wrapper.text()).toContain('Parado');
    expect(wrapper.classes()).toContain('animate-pulse');
  });

  it('renders "Em Descarga" badge correctly', () => {
    const wrapper = mount(StageBadge, {
      props: {
        stage: ScheduleStage.UNLOADING,
      },
    });
    expect(wrapper.text()).toContain('Em Descarga');
    expect(wrapper.classes()).toContain('text-emerald-400');
  });

  it('renders "Finalizado" badge correctly', () => {
    const wrapper = mount(StageBadge, {
      props: {
        stage: ScheduleStage.COMPLETED,
      },
    });
    expect(wrapper.text()).toContain('Finalizado');
  });
});
