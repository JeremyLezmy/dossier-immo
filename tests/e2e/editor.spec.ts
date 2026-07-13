import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

async function readStoredDraftName(
  page: import("@playwright/test").Page,
): Promise<string | undefined> {
  return page.evaluate(
    async () =>
      await new Promise<string | undefined>((resolve, reject) => {
        const request = indexedDB.open("dossier-immo-local-v1");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const getAll = request.result
            .transaction("drafts", "readonly")
            .objectStore("drafts")
            .getAll();
          getAll.onerror = () => reject(getAll.error);
          getAll.onsuccess = () =>
            resolve(
              getAll.result.at(-1)?.dossier?.household?.people?.[0]
                ?.displayName,
            );
        };
      }),
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
        const request = indexedDB.deleteDatabase("dossier-immo-local");
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
        request.onblocked = () => resolve();
      }),
  );
  await page.reload();
});

test("charge l'exemple complet et expose la confidentialité locale", async ({
  page,
}) => {
  await expect(
    page.getByRole("heading", { name: "Guide complet" }),
  ).toBeVisible();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: /Synthèse/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Votre dossier immobilier" }),
  ).toBeVisible();
  await expect(page.getByText("Prêt pour la prévisualisation")).toBeVisible();
  await expect(page.getByText("Aucune donnée envoyée")).toBeVisible();
  await expect(page.locator(".metric-card")).toHaveCount(4);
  await expect(page).toHaveScreenshot("overview-complete.png", {
    animations: "disabled",
    fullPage: true,
  });
});

test("permet de modifier le foyer puis prévisualise treize pages", async ({
  page,
}) => {
  await page.getByRole("button", { name: /Foyer/ }).click();
  const names = page.getByLabel("Nom affiché");
  await names.first().fill("Alex Exemple");
  await page
    .locator(".sidebar")
    .getByRole("button", { name: /Aperçu/ })
    .click();
  const preview = page.frameLocator(
    "iframe[title='Aperçu du dossier bancaire']",
  );
  await expect(preview.locator("section.page")).toHaveCount(13);
  await expect(
    preview.getByText("Alex Exemple", { exact: false }).first(),
  ).toBeVisible();
});

test("télécharge directement le PDF local", async ({ page }) => {
  test.setTimeout(120_000);
  const downloadPromise = page.waitForEvent("download", { timeout: 110_000 });
  await page.getByRole("button", { name: "Télécharger le PDF" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(
    "demo-foyer-rennais-fictif.pdf",
  );
  expect(await download.path()).toBeTruthy();
});

test("un dossier vierge reste éditable mais bloque l'export", async ({
  page,
}) => {
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: /Nouveau/ }).click();
  await expect(page.getByText(/points? à corriger/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Télécharger le PDF" }),
  ).toBeDisabled();
});

test("sauvegarde et réimporte le fichier canonique", async ({ page }) => {
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exporter la config" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(
    "demo-foyer-rennais-fictif.dossier-immo.json",
  );
  const path = await download.path();
  expect(path).toBeTruthy();
  await page
    .getByLabel("Importer un fichier Dossier Immo")
    .setInputFiles(path!);
  await expect(page.getByText("Dossier ouvert.")).toBeVisible();
});

test("importe un dossier courant sans créer d'erreurs sur les champs optionnels absents", async ({
  page,
}) => {
  await page
    .getByLabel("Importer un fichier Dossier Immo")
    .setInputFiles("config.example/dossier.json");
  await expect(page.getByText("Dossier ouvert.")).toBeVisible();
  await expect(page.getByText("Prêt pour la prévisualisation")).toBeVisible();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: /Aperçu/ })
    .click();
  await expect(
    page
      .frameLocator("iframe[title='Aperçu du dossier bancaire']")
      .locator("section.page"),
  ).toHaveCount(13);
});

test("neutralise le HTML actif d'un dossier importé avant de l'afficher", async ({ page }) => {
  const dossier = JSON.parse(readFileSync("config.example/dossier.json", "utf8"));
  dossier.editorial.presentationLetter = '<img src="invalid" onerror="document.body.dataset.xss=\'yes\'"><strong>Texte sûr</strong>';
  await page.getByLabel("Importer un fichier Dossier Immo").setInputFiles({
    name: "dossier-non-fiable.dossier-immo.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(dossier)),
  });
  await page.getByRole("button", { name: /Textes/ }).click();
  await page
    .locator("details.editor-subsection")
    .filter({ hasText: "Lettre de présentation" })
    .locator("summary")
    .click();

  const letter = page.getByRole("textbox", { name: "Corps de la lettre" });
  await expect(letter).toContainText("Texte sûr");
  await expect(letter.locator("img")).toHaveCount(0);
  await expect(page.locator("body")).not.toHaveAttribute("data-xss", "yes");
});

test("reprend automatiquement le brouillon après rechargement", async ({
  page,
}) => {
  await page.getByRole("button", { name: /Foyer/ }).click();
  await page.getByLabel("Nom affiché").first().fill("Alex Brouillon");
  await page.waitForTimeout(900);
  expect(await readStoredDraftName(page)).toBe("Alex Brouillon");
  await page.reload();
  expect(await readStoredDraftName(page)).toBe("Alex Brouillon");
  await page.getByRole("button", { name: /Foyer/ }).click();
  await expect(page.getByLabel("Nom affiché").first()).toHaveValue(
    "Alex Brouillon",
  );
});

test("reste disponible hors ligne après installation de la PWA", async ({
  page,
  context,
}) => {
  await page.goto("/?test-pwa=1");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await context.setOffline(true);
  try {
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Guide complet" }),
    ).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});

test("les contrôles interactifs exposent tous un nom accessible", async ({
  page,
}) => {
  const unnamed = await page
    .locator("button, input, select, textarea")
    .evaluateAll(
      (elements) =>
        elements.filter((element) => {
          if (element instanceof HTMLInputElement && element.type === "hidden")
            return false;
          const labelled =
            element.getAttribute("aria-label") ||
            element.getAttribute("aria-labelledby") ||
            element.closest("label")?.textContent?.trim();
          return (
            !labelled &&
            !(
              element instanceof HTMLButtonElement &&
              element.textContent?.trim()
            )
          );
        }).length,
    );
  expect(unnamed).toBe(0);
});

test("les nouveaux parcours guidés restent utilisables", async ({ page }) => {
  await page.getByRole("button", { name: /Revenus/ }).click();
  await expect(page.locator("details.editor-subsection")).toHaveCount(3);
  await page.getByRole("button", { name: /Patrimoine/ }).click();
  await expect(page.locator("details.editor-subsection")).toHaveCount(2);
  await page.getByRole("button", { name: /Projet/ }).click();
  await expect(page.locator("details.editor-subsection")).toHaveCount(4);

  await page.getByRole("button", { name: /Passifs/ }).click();
  await expect(
    page.getByRole("checkbox", { name: "Nora Leclerc" }),
  ).toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: "Samir Diallo" }),
  ).toBeChecked();

  await page.getByRole("button", { name: /Budgets/ }).click();
  const budgetItem = page.locator("details.budget-comparison__item").first();
  await expect(budgetItem).toContainText("Taxe foncière mensualisée");
  await budgetItem.locator("summary").click();
  await expect(
    budgetItem.getByRole("textbox", { name: "Libellé court du Sankey" }),
  ).toBeVisible();

  await page.getByRole("button", { name: /Textes/ }).click();
  await page
    .locator("details.editor-subsection")
    .filter({ hasText: "Thème visuel" })
    .locator("summary")
    .click();
  await expect(page.getByRole("radio")).toHaveCount(7);
  await page.getByRole("radio", { name: /Sauge/ }).click();
  await expect(page.getByRole("radio", { name: /Sauge/ })).toHaveAttribute(
    "aria-checked",
    "true",
  );

  await page
    .locator(".sidebar")
    .getByRole("button", { name: /Aperçu/ })
    .click();
  await expect(
    page.getByRole("button", { name: "Zoomer", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".document-preview")).toHaveCSS(
    "border-top-width",
    "0px",
  );
  await page.getByRole("button", { name: "Aperçu en direct" }).click();
  await expect(
    page.getByRole("button", { name: "Zoomer l'aperçu", exact: true }),
  ).toBeVisible();

  await page.locator(".topbar").getByRole("button", { name: "Guide" }).click();
  await expect(
    page.getByRole("heading", { name: "Guide complet" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Patrimoine et historique mensuel" }),
  ).toBeVisible();
});
