import { expect, test, type Page } from "@playwright/test";

async function readDraftCount(page: Page): Promise<number> {
  return page.evaluate(
    async () =>
      await new Promise<number>((resolve, reject) => {
        const request = indexedDB.open("dossier-immo-local-v1");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const count = request.result
            .transaction("drafts", "readonly")
            .objectStore("drafts")
            .count();
          count.onerror = () => reject(count.error);
          count.onsuccess = () => resolve(count.result);
        };
      }),
  );
}

async function openDossierActions(page: Page) {
  const trigger = page.getByRole("button", { name: "Actions du dossier" });
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
}

async function waitForDraftSaved(page: Page) {
  await expect(page.locator(".save-state")).toContainText(
    "Brouillon local à jour",
  );
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "showSaveFilePicker", {
      configurable: true,
      value: undefined,
    });
  });
  await page.goto("/");
  await page.evaluate(
    async () =>
      await new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase("dossier-immo-local-v1");
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
        request.onblocked = () => resolve();
      }),
  );
  await page.reload();
});

test("les actions essentielles et l'autosauvegarde restent visibles sur mobile", async ({
  page,
}) => {
  await expect(page.locator(".save-state")).toBeVisible();
  await expect(page.locator(".save-state")).toContainText(
    "Brouillon local à jour",
  );
  await expect(
    page.locator(".topbar").getByRole("button", { name: "PDF", exact: true }),
  ).toBeVisible();

  await openDossierActions(page);
  for (const name of [
    "Guide",
    "Aperçu en direct",
    "Ouvrir un dossier",
    "Sauvegarder le dossier",
    "Nouveau dossier",
    "Charger l'exemple fictif",
    "Effacer les brouillons",
  ]) {
    await expect(
      page.getByRole("button", { name: new RegExp(`^${name}`) }),
    ).toBeVisible();
  }
  await expect(page).toHaveScreenshot("lot1-mobile-menu.png", {
    animations: "disabled",
    fullPage: false,
  });

  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Actions du dossier" }),
  ).toHaveAttribute("aria-expanded", "false");
  await expect(
    page.getByRole("button", { name: "Actions du dossier" }),
  ).toBeFocused();
});

test("l'en-tête reste utilisable sans débordement à 360 px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await expect(page.locator(".save-state")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Actions du dossier" }),
  ).toBeVisible();
  await expect(
    page.locator(".topbar").getByRole("button", { name: "PDF", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
  ).toBe(0);
});

test("le menu remplace les actions secondaires sur tablette", async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(page.locator(".save-state")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Actions du dossier" }),
  ).toBeVisible();
  await expect(page.locator(".topbar__desktop-action").first()).toBeHidden();
  await expect(page.locator(".step-footer__tools")).toBeHidden();
  await expect(
    page.locator(".topbar").getByRole("button", { name: "Télécharger le PDF" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
  ).toBe(0);
});

test("l'aperçu final ajuste les thèmes et la page A4 à un écran mobile", async ({
  page,
}) => {
  await page.locator(".step-link").last().click();

  const themeRail = page.getByRole("complementary", {
    name: "Changer le thème",
  });
  const preview = page.getByTitle("Aperçu du dossier bancaire");
  await expect(themeRail).toBeVisible();
  await expect(preview).toBeVisible();
  await expect(page.locator(".preview-zoom output")).toHaveText("45 %");
  await waitForDraftSaved(page);

  const [railBox, firstThemeBox, previewBox] = await Promise.all([
    themeRail.boundingBox(),
    themeRail.getByRole("button").first().boundingBox(),
    preview.boundingBox(),
  ]);
  expect(railBox).not.toBeNull();
  expect(firstThemeBox).not.toBeNull();
  expect(previewBox).not.toBeNull();
  expect(railBox!.height).toBeLessThan(80);
  expect(firstThemeBox!.height).toBeLessThan(70);
  expect(previewBox!.width).toBeGreaterThan(350);
  await expect(page).toHaveScreenshot("lot1-mobile-preview-themes.png", {
    animations: "disabled",
    fullPage: false,
  });
});

test("l'aperçu en direct occupe proprement l'écran mobile", async ({
  page,
}) => {
  await openDossierActions(page);
  await page.getByRole("button", { name: /^Aperçu en direct/ }).click();

  const livePreview = page.getByRole("complementary", {
    name: "Aperçu en direct",
  });
  await expect(livePreview).toBeVisible();
  await expect(livePreview.locator("output")).toHaveText("45 %");
  await waitForDraftSaved(page);

  const box = await livePreview.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBe(0);
  expect(box!.width).toBe(390);
  expect(box!.y).toBe(92);
  expect(box!.height).toBe(752);
  await expect(page).toHaveScreenshot("lot1-mobile-live-preview.png", {
    animations: "disabled",
    fullPage: false,
  });

  await page.keyboard.press("Escape");
  await expect(livePreview).toBeHidden();
});

test("la sauvegarde officielle est disponible depuis le menu mobile", async ({
  page,
}) => {
  await openDossierActions(page);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /^Sauvegarder le dossier/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(
    "demo-foyer-rennais-fictif.dossier-immo.json",
  );
  await expect(page.locator(".feedback-banner")).toContainText(
    "Sauvegarde officielle créée.",
  );
});

test("une sauvegarde peut être ouverte depuis le menu mobile", async ({
  page,
}) => {
  await openDossierActions(page);
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: /^Ouvrir un dossier/ }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles("config.example/dossier.json");

  await expect(page.locator(".feedback-banner")).toContainText(
    "Dossier ouvert.",
  );
  await expect(
    page.getByRole("heading", { name: "Votre dossier immobilier" }),
  ).toBeVisible();
});

test("les erreurs d'import sont annoncées comme des erreurs", async ({
  page,
}) => {
  await page.getByLabel("Importer un fichier Dossier Immo").setInputFiles({
    name: "dossier-invalide.json",
    mimeType: "application/json",
    buffer: Buffer.from("{invalide"),
  });

  const alert = page.getByRole("alert");
  await expect(alert).toContainText("Le fichier n'est pas un JSON valide.");
  await expect(alert).toHaveClass(/feedback-banner--error/);
});

test("l'effacement des brouillons exige une confirmation", async ({ page }) => {
  await expect.poll(() => readDraftCount(page)).toBeGreaterThan(0);

  await openDossierActions(page);
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: /^Effacer les brouillons/ }).click();
  await expect.poll(() => readDraftCount(page)).toBeGreaterThan(0);

  await page.locator(".step-link").nth(2).click();
  await page.getByLabel("Nom affiché").first().fill("Brouillon à effacer");
  await openDossierActions(page);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: /^Effacer les brouillons/ }).click();
  await expect(page.locator(".feedback-banner")).toContainText(
    "Brouillons locaux effacés.",
  );
  await page.waitForTimeout(900);
  await expect.poll(() => readDraftCount(page)).toBe(0);
});

test("la génération du PDF verrouille l'action jusqu'à son terme", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const pdfButton = page.locator(".topbar").locator(".button--primary");
  const downloadPromise = page.waitForEvent("download", { timeout: 110_000 });

  await pdfButton.click();
  await expect(pdfButton).toBeDisabled();
  await expect(pdfButton).toHaveAttribute("aria-busy", "true");

  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("demo-foyer-rennais-fictif.pdf");
  await expect(pdfButton).toBeEnabled();
  await expect(pdfButton).toHaveAttribute("aria-busy", "false");
  await expect(page.locator(".feedback-banner")).toContainText(
    "PDF téléchargé.",
  );
});
