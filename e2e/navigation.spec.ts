import { expect, test } from '@playwright/test'

test('navigates between dashboard pages', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('link', { name: '事件列表' }).click()
  await expect(page).toHaveURL('/events')
  await expect(page.getByRole('heading', { name: '事件列表' })).toBeVisible()

  await page.getByRole('link', { name: '趋势分析' }).click()
  await expect(page).toHaveURL('/trend')
  await expect(page.getByRole('heading', { name: '趋势分析' })).toBeVisible()

  await page.getByRole('link', { name: '概览' }).click()
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('heading', { name: '概览' })).toBeVisible()
})
