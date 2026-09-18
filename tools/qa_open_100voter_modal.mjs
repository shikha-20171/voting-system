export default async function run(page, ui) {
  await page.getByRole('button', { name: 'Access Portal →' }).nth(4).click();
  await page.waitForTimeout(800);
  const snapshot = await ui.snapshot({ full: true });
  return { snapshot };
}
