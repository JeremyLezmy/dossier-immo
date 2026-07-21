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

async function selectStep(page: Page, step: string) {
  await page
    .getByRole("combobox", { name: "Étape du dossier" })
    .selectOption(step);
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
  await expect(
    page.getByRole("navigation", { name: "Navigation compacte des étapes" }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Étape du dossier" }),
  ).toHaveValue("help");
  await expect(page.locator(".sidebar")).toBeHidden();
  await expect(page.locator(".save-state")).toBeVisible();
  await expect(page.locator(".save-state")).toContainText(
    "Brouillon local à jour",
  );
  await expect(
    page.locator(".topbar").getByRole("button", { name: "PDF", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ouvrir l’aperçu rapide" }),
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
    page.getByRole("button", { name: "Ouvrir l’aperçu rapide" }),
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

test("le sélecteur de dossiers fictifs reste lisible à 360 px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await openDossierActions(page);
  await page.getByRole("button", { name: /^Charger l'exemple fictif/ }).click();
  const picker = page.locator("dialog.demo-picker");
  await expect(picker).toBeVisible();
  await expect(
    picker.getByRole("heading", { name: "Choisir un dossier d’exemple" }),
  ).toBeVisible();
  await expect(picker.locator(".demo-picker__card")).toHaveCount(3);
  expect(
    await picker.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  await expect(page).toHaveScreenshot("demo-picker-mobile.png", {
    animations: "disabled",
    fullPage: false,
  });
  await picker
    .getByRole("button", { name: /Première acquisition en solo/ })
    .click();
  await expect(
    picker.getByRole("heading", { name: "Confirmer le chargement" }),
  ).toBeVisible();
  expect(
    await picker.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  await expect(page).toHaveScreenshot("demo-picker-confirmation-mobile.png", {
    animations: "disabled",
    fullPage: false,
  });
  await page.keyboard.press("Escape");
  await expect(
    picker.getByRole("heading", { name: "Choisir un dossier d’exemple" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(picker).toBeHidden();
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
    page.getByRole("combobox", { name: "Étape du dossier" }),
  ).toBeVisible();
  await expect(page.locator(".sidebar")).toBeHidden();
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
  await selectStep(page, "preview");

  const themeRail = page.getByRole("complementary", {
    name: "Changer le thème",
  });
  const themeSettings = page.locator("details.preview-theme-settings");
  const themeSummary = themeSettings.locator("summary");
  const preview = page.getByTitle("Aperçu du dossier bancaire");
  await expect(themeSettings).not.toHaveAttribute("open", "");
  await expect(themeRail).toBeHidden();
  await expect(preview).toBeVisible();
  await expect(page.locator(".preview-zoom output")).toHaveText("45 %");
  await waitForDraftSaved(page);

  const collapsedPreviewBox = await preview.boundingBox();
  expect(collapsedPreviewBox).not.toBeNull();
  expect(collapsedPreviewBox!.height).toBeGreaterThan(430);
  await expect(page).toHaveScreenshot("lot1-mobile-preview-themes.png", {
    animations: "disabled",
    fullPage: false,
  });

  await themeSummary.click();
  await expect(themeSettings).toHaveAttribute("open", "");
  await expect(themeRail).toBeVisible();

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

  await page
    .getByRole("button", { name: "Afficher l’aperçu en plein écran" })
    .click();
  const fullscreenLayout = page.locator(".preview-layout--fullscreen");
  await expect(fullscreenLayout).toBeVisible();
  await expect(themeSettings).not.toHaveAttribute("open", "");
  await expect(themeRail).toBeHidden();
  const fullscreenBox = await fullscreenLayout.boundingBox();
  expect(fullscreenBox).not.toBeNull();
  expect(fullscreenBox!.x).toBe(0);
  expect(fullscreenBox!.y).toBe(0);
  expect(fullscreenBox!.width).toBe(390);
  expect(fullscreenBox!.height).toBe(844);
  await expect(page).toHaveScreenshot("lot1-mobile-preview-fullscreen.png", {
    animations: "disabled",
    fullPage: false,
  });
  await page.keyboard.press("Escape");
  await expect(fullscreenLayout).toBeHidden();
});

test("l'aperçu en direct occupe proprement l'écran mobile", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Ouvrir l’aperçu rapide" }).click();

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
    "demo-famille-revenus-mixtes.dossier-immo.json",
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

  await selectStep(page, "household");
  await page.locator(".array-card--collapsible summary").first().click();
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
  expect(download.suggestedFilename()).toBe("demo-famille-revenus-mixtes.pdf");
  await expect(pdfButton).toBeEnabled();
  await expect(pdfButton).toHaveAttribute("aria-busy", "false");
  await expect(page.locator(".feedback-banner")).toContainText(
    "PDF téléchargé.",
  );
});

test("la navigation compacte expose les libellés et reste utilisable au clavier", async ({
  page,
}) => {
  const navigation = page.getByRole("navigation", {
    name: "Navigation compacte des étapes",
  });
  const selector = page.getByRole("combobox", { name: "Étape du dossier" });
  await expect(navigation).toContainText("Étape 1 sur 12");
  await selector.focus();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await expect(selector).toHaveValue("preview");
  await expect(
    page.getByRole("button", { name: "Étape suivante" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Étape précédente" }).click();
  await expect(selector).toHaveValue("presentation");
});

test("les infobulles restent ancrées à leur bouton sur mobile", async ({
  page,
}) => {
  await selectStep(page, "household");
  const trigger = page.getByRole("button", { name: "Aide — Foyer" });
  await trigger.click();
  const tooltip = page.getByRole("tooltip");
  await expect(tooltip).toBeVisible();

  const [triggerBox, tooltipBox] = await Promise.all([
    trigger.boundingBox(),
    tooltip.boundingBox(),
  ]);
  expect(triggerBox).not.toBeNull();
  expect(tooltipBox).not.toBeNull();
  const distanceBelow = Math.abs(
    tooltipBox!.y - (triggerBox!.y + triggerBox!.height),
  );
  const distanceAbove = Math.abs(
    triggerBox!.y - (tooltipBox!.y + tooltipBox!.height),
  );
  expect(Math.min(distanceBelow, distanceAbove)).toBeLessThanOrEqual(10);
  expect(tooltipBox!.x).toBeGreaterThanOrEqual(12);
  expect(tooltipBox!.x + tooltipBox!.width).toBeLessThanOrEqual(378);
});

test("le guide détaillé reste lisible avec une rubrique ouverte sur mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  const financing = page.locator('[data-disclosure-id="guide-financing"]');
  await financing.locator("summary").click();
  await expect(
    financing.getByRole("heading", { name: "Composition multi-prêts" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(360);
  await expect(financing).toHaveScreenshot("guide-financing-card-mobile.png", {
    animations: "disabled",
  });
});

for (const viewport of [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
]) {
  test(`aucun contrôle critique ne déborde à ${viewport.width} × ${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await expect(page.locator(".save-state")).toBeVisible();
    await expect(page.locator(".topbar .button--primary")).toBeVisible();
    const quickPreview = page.getByRole("button", {
      name: "Ouvrir l’aperçu rapide",
    });
    if (viewport.width <= 760) {
      await expect(quickPreview).toBeVisible();
    } else {
      await expect(quickPreview).toBeHidden();
    }
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBe(0);
    if (viewport.width <= 1050) {
      await expect(
        page.getByRole("combobox", { name: "Étape du dossier" }),
      ).toBeVisible();
    } else {
      await expect(page.locator(".sidebar")).toBeVisible();
      await expect(
        page
          .locator(".topbar")
          .getByRole("button", { name: "Aperçu en direct", exact: true }),
      ).toBeVisible();
    }
    if (viewport.width <= 1050) {
      await page
        .getByRole("combobox", { name: "Étape du dossier" })
        .selectOption("financing");
    } else {
      await page
        .locator(".sidebar")
        .getByRole("button", { name: /Financement/ })
        .click();
    }
    const centralScenario = page.locator(
      '[data-disclosure-id="item-scenario-family-central"]',
    );
    await centralScenario.locator(":scope > summary").click();
    const complementaryLoan = centralScenario.locator(
      '[data-disclosure-id="loan-family-ptz"]',
    );
    await complementaryLoan.locator(":scope > summary").click();
    await expect(centralScenario.locator(".duration-input")).toHaveCount(3);
    expect(
      await centralScenario
        .locator(".duration-input")
        .evaluateAll((controls) =>
          controls.every((control) => {
            const bounds = control.getBoundingClientRect();
            return (
              control.scrollWidth <= control.clientWidth + 1 &&
              bounds.left >= 0 &&
              bounds.right <= window.innerWidth
            );
          }),
        ),
    ).toBe(true);
  });
}

for (const viewport of [
  { width: 360, height: 800 },
  { width: 768, height: 1024 },
]) {
  test(`le budget est empilé sans grille hors écran à ${viewport.width} px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await selectStep(page, "budgets");
    const comparison = page.locator(".budget-comparison");
    const firstItem = page.locator(".budget-comparison__item").first();
    await expect(comparison).toBeVisible();
    await expect(firstItem.getByText("Central", { exact: true })).toBeVisible();
    const [comparisonBox, itemBox] = await Promise.all([
      comparison.boundingBox(),
      firstItem.boundingBox(),
    ]);
    expect(comparisonBox).not.toBeNull();
    expect(itemBox).not.toBeNull();
    expect(itemBox!.width).toBeLessThanOrEqual(comparisonBox!.width + 1);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBe(0);
  });
}
