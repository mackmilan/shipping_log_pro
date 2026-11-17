import { test, expect } from '@playwright/test';

test.describe('Autenticação e Navegação por Perfil', () => {
  test('deve realizar login como Administrador e acessar rotas administrativas', async ({ page }) => {
    await page.goto('/login');

    // Clica no botão de acesso rápido Demo para Administrador
    await page.getByRole('button', { name: /Administrador/i }).click();

    // Aguarda redirecionamento para o dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText('Painel Operacional de Descarga')).toBeVisible();

    // Verifica que o badge de Administrador é exibido no menu
    await expect(page.getByText('Administrador').first()).toBeVisible();

    // Administrador deve ver o link de Usuários no menu
    const usersLink = page.getByRole('link', { name: /Usuários/i });
    await expect(usersLink).toBeVisible();
    await usersLink.click();
    await expect(page).toHaveURL(/.*users/);
    await expect(page.getByText('Gestão de Usuários & Perfis')).toBeVisible();
  });

  test('deve realizar login como Operador e ter acesso a janelas e docas', async ({ page }) => {
    await page.goto('/login');

    // Clica no botão de acesso rápido Demo para Operador
    await page.getByRole('button', { name: /Operador de Doca/i }).click();

    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText('Operador').first()).toBeVisible();

    // Operador NÃO deve ver o link de gestão de Usuários
    const usersLink = page.getByRole('link', { name: /Usuários/i });
    await expect(usersLink).not.toBeVisible();

    // Mas tem acesso a Janelas e Docas
    await page.getByRole('link', { name: /Janelas de Descarga/i }).click();
    await expect(page).toHaveURL(/.*schedules/);
    await expect(page.getByRole('button', { name: /Nova Janela/i })).toBeVisible();
  });

  test('deve realizar login como Usuário (visualizador) em modo somente leitura', async ({ page }) => {
    await page.goto('/login');

    // Clica no botão de acesso rápido Demo para Usuário
    await page.getByRole('button', { name: /Usuário Visualizador/i }).click();

    await expect(page).toHaveURL(/.*dashboard/);

    // Navega para janelas
    await page.getByRole('link', { name: /Janelas de Descarga/i }).click();
    await expect(page).toHaveURL(/.*schedules/);

    // Botão de Nova Janela NÃO deve aparecer para Usuário visualizador
    await expect(page.getByRole('button', { name: /Nova Janela/i })).not.toBeVisible();
  });
});
