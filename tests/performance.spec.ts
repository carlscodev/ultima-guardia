import { expect, test } from '@playwright/test'

test('arranca en Canvas2D y mantiene un frame rate jugable', async ({ page }, testInfo) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: /entrar en la zona/i })).toBeVisible()
  await page.getByRole('button', { name: /entrar en la zona/i }).click()
  await page.keyboard.down('KeyD')
  await page.waitForTimeout(8_000)
  await page.keyboard.up('KeyD')

  const telemetry = await page.evaluate(() => window.__UG_DEBUG__)
  console.info(`[perf:${testInfo.project.name}] ${JSON.stringify(telemetry)}`)
  expect(telemetry).toBeTruthy()
  expect(telemetry?.mode).toBe('canvas2d')
  expect(telemetry?.fps ?? 0).toBeGreaterThanOrEqual(45)
  expect(telemetry?.frameMs ?? 100).toBeLessThan(26)

  await testInfo.attach('telemetry.json', {
    body: JSON.stringify(telemetry, null, 2),
    contentType: 'application/json',
  })
})

test('controles de pausa y pulso responden', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /entrar en la zona/i }).click()
  await page.keyboard.press('Space')
  await expect(page.getByRole('button', { name: /pausar/i })).toBeVisible()
  await page.keyboard.press('KeyP')
  await expect(page.getByRole('button', { name: /continuar operación/i })).toBeVisible()
})
