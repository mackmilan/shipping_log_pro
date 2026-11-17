import { test, expect } from '@playwright/test';

test.describe('Internacionalização (i18n) - Português e Inglês', () => {
  test('deve alternar idioma na tela de login e propagar por todas as páginas da aplicação', async ({ page }) => {
    // 1. Acessa tela de login (padrão Português)
    await page.goto('/login');
    await expect(page.getByText('Controle de Janelas e Tempos de Descarga')).toBeVisible();
    await expect(page.getByRole('button', { name: /Acessar Sistema/i })).toBeVisible();

    // 2. Alterna para Inglês Internacional (EN) na tela de login
    const enButton = page.getByRole('button', { name: /EN/i });
    await expect(enButton).toBeVisible();
    await enButton.click();

    // Valida textos em inglês na tela de login
    await expect(page.getByText('Truck Unloading Window & Time Control')).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
    await expect(page.getByText('Quick Access by Profile (Demo)')).toBeVisible();
    await expect(page.getByText('Administrator').first()).toBeVisible();
    await expect(page.getByText('Dock Operator')).toBeVisible();

    // 3. Realiza login como Administrador
    await page.getByRole('button', { name: /Administrator/i }).click();

    // 4. Valida Dashboard em Inglês
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText('Operational Unloading Dashboard')).toBeVisible();
    await expect(page.getByText('Real Time')).toBeVisible();
    await expect(page.getByRole('button', { name: /Refresh Data/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /View Schedules/i })).toBeVisible();
    await expect(page.getByText('In Transit').first()).toBeVisible();
    await expect(page.getByText('Stopped Trucks').first()).toBeVisible();

    // Valida menu lateral em Inglês
    await expect(page.getByRole('link', { name: /Unloading Schedules/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Docks/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Trucks/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Users/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Log Out/i })).toBeVisible();

    // 5. Navega para Janelas de Descarga (Schedules) em Inglês
    await page.getByRole('link', { name: /Unloading Schedules/i }).click();
    await expect(page).toHaveURL(/.*schedules/);
    await expect(page.getByRole('button', { name: /New Schedule/i })).toBeVisible();
    await expect(page.locator('input[placeholder*="Search by plate" i]')).toBeVisible();

    // 6. Navega para Docas (Docks) em Inglês
    await page.getByRole('link', { name: /Docks/i }).click();
    await expect(page).toHaveURL(/.*docks/);
    await expect(page.getByRole('button', { name: /New Dock/i })).toBeVisible();

    // 7. Navega para Caminhões (Trucks) em Inglês
    await page.getByRole('link', { name: /Trucks/i }).click();
    await expect(page).toHaveURL(/.*trucks/);
    await expect(page.getByRole('button', { name: /Register Truck/i })).toBeVisible();

    // 8. Navega para Usuários (Users) em Inglês
    await page.getByRole('link', { name: /Users/i }).click();
    await expect(page).toHaveURL(/.*users/);
    await expect(page.getByText('User & Profile Management')).toBeVisible();
    await expect(page.getByRole('button', { name: /New User/i })).toBeVisible();

    // 9. Alterna de volta para Português Brasileiro (PT-BR) no menu lateral
    const ptButton = page.getByRole('button', { name: /PT-BR/i });
    await expect(ptButton).toBeVisible();
    await ptButton.click();

    // Valida que a página e menu retornaram para Português imediatamente
    await expect(page.getByText('Gestão de Usuários & Perfis')).toBeVisible();
    await expect(page.getByRole('button', { name: /Novo Usuário/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Janelas de Descarga/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Encerrar Sessão/i })).toBeVisible();
  });
});
