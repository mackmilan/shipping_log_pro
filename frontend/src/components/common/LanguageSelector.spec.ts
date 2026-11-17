import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import LanguageSelector from './LanguageSelector.vue';
import { currentLocale, setLocale } from '../../i18n';

describe('LanguageSelector.vue', () => {
  beforeEach(() => {
    setLocale('pt-BR');
  });

  it('renders language buttons with PT-BR and EN', () => {
    const wrapper = mount(LanguageSelector, {
      props: { variant: 'segmented' },
    });
    expect(wrapper.text()).toContain('PT-BR');
    expect(wrapper.text()).toContain('EN');
  });

  it('switches locale to en when clicking EN button', async () => {
    const wrapper = mount(LanguageSelector, {
      props: { variant: 'segmented' },
    });

    const buttons = wrapper.findAll('button');
    const enButton = buttons.find((b) => b.text().includes('EN'));
    expect(enButton).toBeDefined();

    await enButton!.trigger('click');
    expect(currentLocale.value).toBe('en');
  });

  it('switches back to pt-BR when clicking PT-BR button', async () => {
    setLocale('en');
    const wrapper = mount(LanguageSelector, {
      props: { variant: 'segmented' },
    });

    const buttons = wrapper.findAll('button');
    const ptButton = buttons.find((b) => b.text().includes('PT-BR'));
    expect(ptButton).toBeDefined();

    await ptButton!.trigger('click');
    expect(currentLocale.value).toBe('pt-BR');
  });
});
