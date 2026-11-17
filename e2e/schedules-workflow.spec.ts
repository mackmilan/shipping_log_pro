import { test, expect } from '@playwright/test';

test.describe('Fluxo Operacional de Janelas de Descarga e Etapas', () => {
  test('deve criar uma nova janela, transicionar para Parado com motivo e consultar histórico', async ({ page }) => {
    const uniqueCargo = `Lote Especial ${Date.now()}`;
    const stopReason = `Problema nos freios na rodovia ${Date.now()}`;

    // 1. Login como Operador
    await page.goto('/login');
    await page.getByRole('button', { name: /Operador de Doca/i }).click();
    await expect(page).toHaveURL(/.*dashboard/);

    // 2. Navegar para Janelas de Descarga
    await page.getByRole('link', { name: /Janelas de Descarga/i }).click();
    await expect(page).toHaveURL(/.*schedules/);

    // 3. Testar alternância entre visualização em Lista e Kanban
    const boardToggle = page.getByTitle('Visualização em Quadro');
    await boardToggle.click();
    await expect(page.locator('span.font-bold', { hasText: 'Em Trânsito' })).toBeVisible();
    await expect(page.locator('span.font-bold', { hasText: 'Em Descarga' })).toBeVisible();

    const listToggle = page.getByTitle('Visualização em Lista');
    await listToggle.click();

    // 4. Criar nova janela de descarga
    await page.getByRole('button', { name: /Nova Janela/i }).click();
    await expect(page.getByText('Nova Janela de Descarga')).toBeVisible();

    // Preencher formulário
    await page.locator('input[placeholder*="peças automotivas" i]').fill(uniqueCargo);
    await page.locator('input[placeholder*="15000" i]').fill('12000');
    await page.locator('input[placeholder*="NF-e" i]').fill('NF-e 999888');

    // Submeter
    await page.getByRole('button', { name: /Criar Janela de Descarga/i }).click();

    // Verificar se o item criado aparece na tabela
    await expect(page.getByText(uniqueCargo)).toBeVisible();

    // 5. Atualizar etapa do caminhão para STOPPED (Parado) com motivo
    const scheduleRow = page.locator('tr', { hasText: uniqueCargo }).first();
    await scheduleRow.getByTitle('Mudar Etapa').click();

    await expect(page.getByText('Atualizar Etapa do Caminhão')).toBeVisible();

    // Selecionar etapa "Parado (Alerta)"
    await page.getByRole('button', { name: /Parado \(Alerta\)/i }).click();

    // Preencher motivo de parada
    const reasonInput = page.locator('input[placeholder*="Congestionamento na rodovia" i]');
    await reasonInput.fill(stopReason);

    // Confirmar transição
    await page.getByRole('button', { name: /Confirmar Transição/i }).click();

    // Verificar se a linha agora exibe o badge "Parado"
    await expect(scheduleRow.getByText('Parado')).toBeVisible();

    // 6. Consultar histórico de tempos e etapas (Timeline Modal)
    await scheduleRow.getByTitle('Ver Histórico de Etapas').click();
    await expect(page.getByText('Histórico de Tempos e Etapas')).toBeVisible();
    await expect(page.getByText(stopReason)).toBeVisible();

    // Fechar modal
    await page.getByRole('button', { name: /Fechar/i }).click();
  });
});
