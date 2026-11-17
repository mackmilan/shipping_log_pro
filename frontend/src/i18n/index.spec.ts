import { describe, it, expect, beforeEach } from 'vitest';
import { t, setLocale, currentLocale, formatDate, formatTime, availableLocales } from './index';
import { ptBR } from './locales/pt-BR';
import { en } from './locales/en';

describe('i18n core module', () => {
  beforeEach(() => {
    setLocale('pt-BR');
  });

  it('translates correctly in Brazilian Portuguese (default)', () => {
    expect(currentLocale.value).toBe('pt-BR');
    expect(t('common.brandName')).toBe('ShippingLog');
    expect(t('nav.dashboard')).toBe('Dashboard');
    expect(t('nav.schedules')).toBe('Janelas de Descarga');
    expect(t('roles.admin')).toBe('Administrador');
    expect(t('stages.inTransit')).toBe('Em Trânsito');
    expect(t('stages.stopped')).toBe('Parado');
    expect(t('docks.title')).toBe('Docas de Descarga');
    expect(t('trucks.title')).toBe('Caminhões e Frotas');
    expect(t('users.title')).toBe('Gestão de Usuários & Perfis');
    expect(t('login.signIn')).toBe('Acessar Sistema');
  });

  it('switches to English (en) and translates all pages and terms', () => {
    setLocale('en');
    expect(currentLocale.value).toBe('en');
    expect(t('common.brandSubtitle')).toBe('Unloading Management');
    expect(t('nav.dashboardDesc')).toBe('Key Metrics & Overview');
    expect(t('nav.schedules')).toBe('Unloading Schedules');
    expect(t('nav.schedulesDesc')).toBe('Stage & Time Tracking');
    expect(t('nav.docks')).toBe('Docks');
    expect(t('nav.trucks')).toBe('Trucks');
    expect(t('nav.users')).toBe('Users');
    expect(t('roles.admin')).toBe('Administrator');
    expect(t('roles.operator')).toBe('Operator');
    expect(t('roles.user')).toBe('User (Viewer)');
    expect(t('stages.inTransit')).toBe('In Transit');
    expect(t('stages.stopped')).toBe('Stopped');
    expect(t('stages.unloading')).toBe('Unloading');
    expect(t('stages.completed')).toBe('Completed');
    expect(t('docks.title')).toBe('Unloading Docks');
    expect(t('trucks.title')).toBe('Trucks and Fleets');
    expect(t('users.title')).toBe('User & Profile Management');
    expect(t('login.signIn')).toBe('Sign In');
    expect(t('login.emailPlaceholder')).toBe('your.email@company.com');
  });

  it('interpolates parameters correctly in both languages', () => {
    setLocale('pt-BR');
    expect(t('schedules.delay', { minutes: 25 })).toBe('Atraso: +25 min');
    expect(t('docks.dockCount', { count: 8 })).toBe('8 docas');

    setLocale('en');
    expect(t('schedules.delay', { minutes: 25 })).toBe('Delay: +25 min');
    expect(t('docks.dockCount', { count: 8 })).toBe('8 docks');
  });

  it('provides available locales with pt-BR and en options', () => {
    expect(availableLocales.length).toBe(2);
    expect(availableLocales.map(l => l.code)).toEqual(['pt-BR', 'en']);
  });

  it('formats dates according to selected locale', () => {
    const testDate = new Date('2026-11-16T14:30:00.000Z');
    setLocale('pt-BR');
    const ptDate = formatDate(testDate);
    expect(ptDate).toBeTruthy();
    expect(ptDate).not.toBe('—');

    setLocale('en');
    const enDate = formatDate(testDate);
    expect(enDate).toBeTruthy();
    expect(enDate).not.toBe('—');
  });

  it('formats time counters cleanly', () => {
    expect(formatTime(45)).toBe('45 min');
    expect(formatTime(90)).toBe('1h 30m');
    expect(formatTime(120)).toBe('2h');
  });

  it('ensures all translation keys in pt-BR and en have non-empty string values', () => {
    function checkKeys(objPt: any, objEn: any, currentPath = '') {
      for (const key of Object.keys(objPt)) {
        const fullPath = currentPath ? `${currentPath}.${key}` : key;
        expect(objEn).toHaveProperty(key);

        if (typeof objPt[key] === 'object' && objPt[key] !== null) {
          expect(typeof objEn[key]).toBe('object');
          checkKeys(objPt[key], objEn[key], fullPath);
        } else {
          expect(typeof objPt[key]).toBe('string');
          expect(typeof objEn[key]).toBe('string');
          expect((objPt[key] as string).trim().length).toBeGreaterThan(0);
          expect((objEn[key] as string).trim().length).toBeGreaterThan(0);
        }
      }
    }

    checkKeys(ptBR, en);
  });
});
