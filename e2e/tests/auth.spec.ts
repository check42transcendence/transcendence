import { randomUUID } from 'node:crypto'
import { test, expect } from '@playwright/test';

// Verifies the authentication flow against the real application.
test('completes the authentication flow', async ({ page }) => {
  const suffix = randomUUID()
  const email = `e2e-${suffix}@example.com`
  const username = `e2e-${suffix}`
  const password = 'example-password'

  // Registers a new account.
  await page.goto('/register')

  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Username', { exact: true }).fill(username)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByLabel('Confirm password', { exact: true }).fill(password)

  await page.getByRole('button', { name: 'Create account' }).click()

  await expect(
    page.getByText('Account created. Please sign in.'),
  ).toBeVisible()

  // Signs in with the newly registered account.
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()

  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeVisible()

  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)

  await page.getByRole('button', { name: 'Sign in', exact: true }).click()

  await expect(page).toHaveURL(/\/home$/)
  await expect(
    page.getByText(username, { exact: true }),
  ).toBeVisible()

  // Restores the authenticated user after a page reload.
  await page.reload()

  await expect(page).toHaveURL(/\/home$/)
  await expect(
    page.getByText(username, { exact: true }),
  ).toBeVisible()

  // Signs out and returns to login.
  await page.getByRole('button', { name: 'Sign out', exact: true }).click()

  await expect(page).toHaveURL(/\/login$/)
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeVisible()

  // Checks that logout persists after a fresh page load.
  await page.goto('/home')

  await expect(page).toHaveURL(/\/login$/)
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeVisible()
})
