export default async function run(page) {
  await page.getByRole('button', { name: 'Access Portal →' }).nth(4).click();
  const mobile = page.getByRole('textbox', { name: '10-digit mobile number' });
  await mobile.fill('9440261145');
  await page.getByRole('button', { name: 'Send OTP' }).click();
  await page.waitForTimeout(1200);

  const otpInput = page.getByRole('textbox', { name: '6-digit OTP' });
  await otpInput.fill('123456');

  await page.getByRole('button', { name: 'Verify OTP' }).click();
  await page.waitForTimeout(1800);

  return {
    url: page.url(),
    bodyText: await page.locator('body').innerText(),
  };
}
