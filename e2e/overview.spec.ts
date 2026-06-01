import { expect, test } from '@playwright/test'

test('loads the overview dashboard', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByText('Analytics')).toBeVisible()
  await expect(page.getByRole('link', { name: '概览' })).toBeVisible()
  await expect(page.getByRole('link', { name: '事件列表' })).toBeVisible()
  await expect(page.getByRole('link', { name: '趋势分析' })).toBeVisible()

  await expect(page.getByRole('heading', { name: '概览' })).toBeVisible()
  await expect(page.getByText('总事件数')).toBeVisible()
  await expect(page.getByText('页面浏览 (PV)')).toBeVisible()
  await expect(page.getByText('独立用户 (UV)')).toBeVisible()
  await expect(page.getByText('事件类型数')).toBeVisible()
  await expect(page.getByText('事件趋势')).toBeVisible()
  await expect(page.getByText('热门事件 Top 10')).toBeVisible()
})
