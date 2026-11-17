import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import StageBadge from './StageBadge.vue';
import { ScheduleStage } from '../../types';
import { setLocale } from '../../i18n';

describe('StageBadge.vue', () => {
  beforeEach(() => {
    setLocale('pt-BR');
  });

  it('renders "Em Trânsito" badge correctly in pt-BR', () => {
    const wrapper = mount(StageBadge, {
      props: {
        stage: ScheduleStage.IN_TRANSIT,
      },
    });
    expect(wrapper.text()).toContain('Em Trânsito');
    expect(wrapper.classes()).toContain('text-blue-400');
  });

  it('renders "Parado" badge with pulse warning animation in pt-BR', () => {
    const wrapper = mount(StageBadge, {
      props: {
        stage: ScheduleStage.STOPPED,
        showDot: true,
      },
    });
    expect(wrapper.text()).toContain('Parado');
    expect(wrapper.classes()).toContain('animate-pulse');
  });

  it('renders "Em Descarga" badge correctly in pt-BR', () => {
    const wrapper = mount(StageBadge, {
      props: {
        stage: ScheduleStage.UNLOADING,
      },
    });
    expect(wrapper.text()).toContain('Em Descarga');
    expect(wrapper.classes()).toContain('text-emerald-400');
  });

  it('renders "Finalizado" badge correctly in pt-BR', () => {
    const wrapper = mount(StageBadge, {
      props: {
        stage: ScheduleStage.COMPLETED,
      },
    });
    expect(wrapper.text()).toContain('Finalizado');
  });

  it('renders badges correctly in English when locale is switched to en', () => {
    setLocale('en');

    const wrapperTransit = mount(StageBadge, {
      props: { stage: ScheduleStage.IN_TRANSIT },
    });
    expect(wrapperTransit.text()).toContain('In Transit');

    const wrapperStopped = mount(StageBadge, {
      props: { stage: ScheduleStage.STOPPED },
    });
    expect(wrapperStopped.text()).toContain('Stopped');

    const wrapperUnload = mount(StageBadge, {
      props: { stage: ScheduleStage.UNLOADING },
    });
    expect(wrapperUnload.text()).toContain('Unloading');

    const wrapperCompleted = mount(StageBadge, {
      props: { stage: ScheduleStage.COMPLETED },
    });
    expect(wrapperCompleted.text()).toContain('Completed');
  });
});
