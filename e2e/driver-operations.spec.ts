import { test, expect } from '@playwright/test';

test.describe('Operações do Motorista na Tela Simplificada', () => {
  test('deve permitir ao motorista navegar, reportar parada com motivo e consultar localização/fotos', async ({ page }) => {
    await page.goto('/login');

    // Login com perfil motorista
    await page.getByRole('button', { name: /Motorista/i }).click();

    // Deve estar na tela simplificada /driver
    await expect(page).toHaveURL(/.*driver/);
    await expect(page.getByText('ShippingLog Motorista')).toBeVisible();

    // Deve exibir cartão de ações de etapa
    await expect(page.getByText('Avançar Etapa do Caminhão')).toBeVisible();

    // Deve exibir cronômetro em tempo real com segundos e indicador pulsante
    const liveTimer = page.locator('span[title="Atualizando em tempo real"]');
    await expect(liveTimer).toBeVisible();
    await expect(page.locator('text=/\\d+m\\s+\\d{1,2}s/')).toBeVisible();

    // Se o botão Reportar Parada estiver visível, clica para abrir o modal
    const reportStopBtn = page.getByRole('button', { name: /Reportar Parada/i });
    if (await reportStopBtn.isVisible()) {
      await reportStopBtn.click();
      await expect(page.getByText('Reportar Parada do Caminhão')).toBeVisible();

      // Clica em um motivo rápido
      await page.getByRole('button', { name: /Congestionamento \/ Trânsito/i }).click();

      // Confirma parada
      await page.getByRole('button', { name: /Confirmar Parada e Alertar/i }).click();
      await expect(page.getByText(/Etapa alterada para: Parado/i)).toBeVisible();
    }

    // Seção de Fotos e Comprovantes
    await expect(page.getByText('Fotos & Comprovantes da Etapa')).toBeVisible();
    await expect(page.getByText('Tirar Foto ou Escolher Arquivo')).toBeVisible();

    // Alterna idioma para Inglês
    await page.getByRole('button', { name: /\bEN\b/ }).click();
    await expect(page.getByText('ShippingLog Driver')).toBeVisible();
    await expect(page.getByText('Advance Truck Stage')).toBeVisible();
    await expect(page.getByText('Real-Time GPS Location')).toBeVisible();
  });
});
