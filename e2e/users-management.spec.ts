import { test, expect } from '@playwright/test';

test.describe('Gestão Administrativa de Usuários e Perfis', () => {
  test('deve criar um novo operador pelo painel administrativo e validar na listagem', async ({ page }) => {
    const timestamp = Date.now();
    const uniqueUserName = `Operador Teste ${timestamp}`;
    const uniqueEmail = `operador.e2e.${timestamp}@shippinglog.local`;

    // 1. Login como Administrador
    await page.goto('/login');
    await page.getByRole('button', { name: /Administrador/i }).click();
    await expect(page).toHaveURL(/.*dashboard/);

    // 2. Navegar para Usuários
    await page.getByRole('link', { name: /Usuários/i }).click();
    await expect(page).toHaveURL(/.*users/);

    // 3. Abrir modal de novo usuário
    await page.getByRole('button', { name: /Novo Usuário/i }).click();
    await expect(page.getByText('Novo Usuário Local')).toBeVisible();

    // Preencher campos
    await page.locator('input[placeholder*="Carlos Eduardo" i]').fill(uniqueUserName);
    await page.locator('input[placeholder*="carlos@empresa.com" i]').fill(uniqueEmail);
    await page.locator('input[type="password"]').fill('senhaSegura123');

    // Selecionar perfil Operador
    await page.locator('select').selectOption({ label: 'Operador (Avanço de etapas e docas)' });

    // Salvar
    await page.getByRole('button', { name: /Salvar Usuário/i }).click();

    // 4. Validar na listagem
    await expect(page.getByText(uniqueUserName)).toBeVisible();
    await expect(page.getByText(uniqueEmail)).toBeVisible();
  });
});
