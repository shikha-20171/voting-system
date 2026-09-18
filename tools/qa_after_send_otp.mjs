export default async function run(page, ui) {
  await page.getByRole('button', { name: 'Access Portal →' }).nth(4).click();
  await page.getByRole('textbox', { name: '10-digit mobile number' }).fill('9440261145');
  await page.getByRole('button', { name: 'Send OTP' }).click();
  await page.waitForTimeout(1500);
  return {
    snapshot: await ui.snapshot({ full: true }),
    bodyText: await page.locator('body').innerText(),
  };
}
