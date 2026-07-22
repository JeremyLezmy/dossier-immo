import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const PERSISTENCE_MODE_STORAGE_KEY = "dossier-immo-persistence-mode-v1";
const legacyDossier = JSON.parse(
  readFileSync("config.example/dossier.json", "utf8"),
) as {
  metadata: { dossierId: string };
  household: { people: Array<{ displayName: string }> };
};

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

async function readStoredDraftExpiration(
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
          getAll.onsuccess = () => resolve(getAll.result.at(-1)?.expiresAt);
        };
      }),
  );
}

async function setStoredDraftExpiration(
  page: import("@playwright/test").Page,
  expiresAt: string,
): Promise<void> {
  await page.evaluate(
    async (nextExpiration) =>
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("dossier-immo-local-v1");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const transaction = request.result.transaction("drafts", "readwrite");
          const store = transaction.objectStore("drafts");
          const getAll = store.getAll();
          getAll.onerror = () => reject(getAll.error);
          getAll.onsuccess = () => {
            for (const record of getAll.result) {
              record.expiresAt = nextExpiration;
              store.put(record);
            }
          };
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        };
      }),
    expiresAt,
  );
}

async function hasStoredDraft(
  page: import("@playwright/test").Page,
  id: string,
): Promise<boolean> {
  return page.evaluate(
    async (draftId) =>
      await new Promise<boolean>((resolve, reject) => {
        const request = indexedDB.open("dossier-immo-local-v1");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const get = request.result
            .transaction("drafts", "readonly")
            .objectStore("drafts")
            .get(draftId);
          get.onerror = () => reject(get.error);
          get.onsuccess = () => resolve(Boolean(get.result));
        };
      }),
    id,
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
  await page.evaluate(
    (key) => localStorage.setItem(key, "local"),
    PERSISTENCE_MODE_STORAGE_KEY,
  );
  await page.reload();
});

test("propose un choix de confidentialité explicite au premier accès", async ({
  page,
}) => {
  await expect(page.locator(".save-state")).toContainText(
    "Brouillon local à jour",
  );
  await page.evaluate(
    async () =>
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("dossier-immo-local-v1");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const transaction = request.result.transaction("drafts", "readwrite");
          transaction.objectStore("drafts").clear();
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        };
      }),
  );
  await page.evaluate(
    (key) => localStorage.removeItem(key),
    PERSISTENCE_MODE_STORAGE_KEY,
  );
  await page.reload();

  const dialog = page.getByRole("dialog", {
    name: "Comment souhaitez-vous travailler ?",
  });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "Session privée" }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "Reprise locale" }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Continuer en session privée" }),
  ).toBeFocused();
  await dialog
    .getByRole("button", { name: "Continuer en session privée" })
    .click();

  await expect(page.locator(".save-state")).toContainText(
    "Session privée · non enregistrée",
  );
  await page.getByRole("button", { name: /Foyer/ }).click();
  await page.locator(".array-card--collapsible summary").first().click();
  const name = page.getByLabel("Nom affiché").first();
  const originalName = await name.inputValue();
  await name.fill("Donnée éphémère");
  await page.waitForTimeout(900);
  expect(await readStoredDraftName(page)).toBeUndefined();

  page.once("dialog", (browserDialog) => browserDialog.accept());
  await page.reload();
  await expect(page.locator(".save-state")).toContainText(
    "Session privée · non enregistrée",
  );
  await page.getByRole("button", { name: /Foyer/ }).click();
  await page.locator(".array-card--collapsible summary").first().click();
  await expect(page.getByLabel("Nom affiché").first()).toHaveValue(
    originalName,
  );
});

test("signale et conserve un brouillon existant si la reprise locale est choisie", async ({
  page,
}) => {
  await page.getByRole("button", { name: /Foyer/ }).click();
  await page.locator(".array-card--collapsible summary").first().click();
  await page.getByLabel("Nom affiché").first().fill("Brouillon à reprendre");
  await expect(page.locator(".save-state")).toContainText(
    "Brouillon local à jour",
  );
  await page.evaluate(
    (key) => localStorage.removeItem(key),
    PERSISTENCE_MODE_STORAGE_KEY,
  );
  await page.reload();

  const dialog = page.getByRole("dialog", {
    name: "Comment souhaitez-vous travailler ?",
  });
  await expect(
    dialog.getByText("Un brouillon local existant a été détecté."),
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", {
      name: "Effacer les brouillons et passer en session",
    }),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: "Activer la reprise locale 24 h" })
    .click();

  await page.getByRole("button", { name: /Foyer/ }).click();
  await page.locator(".array-card--collapsible summary").first().click();
  await expect(page.getByLabel("Nom affiché").first()).toHaveValue(
    "Brouillon à reprendre",
  );
});

test("migre un ancien brouillon en lui accordant 24 h sans perdre ses données", async ({
  page,
}) => {
  await page.goto("/brand-mark.svg");
  await page.evaluate(
    async ({ dossier, preferenceKey }) => {
      localStorage.setItem(preferenceKey, "local");
      await new Promise<void>((resolve, reject) => {
        const deletion = indexedDB.deleteDatabase("dossier-immo-local-v1");
        deletion.onsuccess = () => resolve();
        deletion.onerror = () => reject(deletion.error);
        deletion.onblocked = () =>
          reject(new Error("La base précédente est encore ouverte."));
      });
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("dossier-immo-local-v1", 1);
        request.onerror = () => reject(request.error);
        request.onupgradeneeded = () => {
          const store = request.result.createObjectStore("drafts", {
            keyPath: "id",
          });
          store.createIndex("updatedAt", "updatedAt");
        };
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction("drafts", "readwrite");
          transaction.objectStore("drafts").put({
            id: dossier.metadata.dossierId,
            dossier,
            updatedAt: "2025-01-01T00:00:00.000Z",
          });
          transaction.oncomplete = () => {
            database.close();
            resolve();
          };
          transaction.onerror = () => reject(transaction.error);
        };
      });
    },
    {
      dossier: legacyDossier,
      preferenceKey: PERSISTENCE_MODE_STORAGE_KEY,
    },
  );
  const migrationStartedAt = Date.now();
  await page.goto("/");

  await expect(page.getByText("Brouillon local repris.")).toBeVisible();
  expect(await readStoredDraftName(page)).toBe(
    legacyDossier.household.people[0]?.displayName,
  );
  const expiration = await readStoredDraftExpiration(page);
  expect(Date.parse(expiration ?? "") - migrationStartedAt).toBeGreaterThan(
    23 * 60 * 60 * 1_000,
  );
});

test("active une reprise locale de 24 h et permet de la prolonger", async ({
  page,
}) => {
  await page.evaluate(
    (key) => localStorage.removeItem(key),
    PERSISTENCE_MODE_STORAGE_KEY,
  );
  await page.reload();
  const dialog = page.getByRole("dialog", {
    name: "Comment souhaitez-vous travailler ?",
  });
  await dialog
    .getByRole("button", { name: "Activer la reprise locale 24 h" })
    .click();
  await expect(page.locator(".save-state")).toContainText(
    "Brouillon local à jour",
  );

  const firstExpiration = await readStoredDraftExpiration(page);
  expect(firstExpiration).toBeDefined();
  expect(Date.parse(firstExpiration) - Date.now()).toBeGreaterThan(
    23 * 60 * 60 * 1_000,
  );

  await page.waitForTimeout(50);
  await page.getByRole("button", { name: "Prolonger de 24 h" }).click();
  await expect(page.getByText(/prolongée de 24 h/)).toBeVisible();
  const renewedExpiration = await readStoredDraftExpiration(page);
  expect(Date.parse(renewedExpiration ?? "")).toBeGreaterThan(
    Date.parse(firstExpiration),
  );
});

test("avertit une heure avant l’échéance et permet d’ignorer ou prolonger", async ({
  page,
}) => {
  await expect(page.locator(".save-state")).toContainText(
    "Brouillon local à jour",
  );
  const imminentExpiration = new Date(
    Date.now() + 30 * 60 * 1_000,
  ).toISOString();
  await setStoredDraftExpiration(page, imminentExpiration);
  await page.reload();

  const warning = page
    .locator(".feedback-banner--warning")
    .filter({ hasText: "expire dans moins d’une heure" });
  await expect(warning).toBeVisible();
  await expect(
    warning.getByRole("button", { name: "Prolonger de 24 h" }),
  ).toBeVisible();
  await expect(
    warning.getByRole("button", { name: "Exporter le JSON" }),
  ).toBeVisible();
  await warning.getByRole("button", { name: "Ignorer" }).click();
  await expect(warning).toBeHidden();
  expect(await readStoredDraftExpiration(page)).toBe(imminentExpiration);

  await page.reload();
  await expect(warning).toBeVisible();
  await warning.getByRole("button", { name: "Prolonger de 24 h" }).click();
  await expect(warning).toBeHidden();
  expect(
    Date.parse((await readStoredDraftExpiration(page)) ?? "") - Date.now(),
  ).toBeGreaterThan(23 * 60 * 60 * 1_000);
});

test("purge un brouillon local expiré à la prochaine ouverture", async ({
  page,
}) => {
  await page.getByRole("button", { name: /Foyer/ }).click();
  await page.locator(".array-card--collapsible summary").first().click();
  await page.getByLabel("Nom affiché").first().fill("Brouillon expiré");
  await expect(page.locator(".save-state")).toContainText(
    "Brouillon local à jour",
  );
  await page.evaluate(
    async () =>
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("dossier-immo-local-v1");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const transaction = request.result.transaction("drafts", "readwrite");
          const store = transaction.objectStore("drafts");
          const getAll = store.getAll();
          getAll.onerror = () => reject(getAll.error);
          getAll.onsuccess = () => {
            for (const record of getAll.result) {
              record.expiresAt = "2020-01-01T00:00:00.000Z";
              store.put(record);
            }
          };
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        };
      }),
  );

  await page.reload();
  expect(await readStoredDraftName(page)).not.toBe("Brouillon expiré");
  await expect(page.locator(".save-state")).toContainText(
    "Brouillon local à jour",
  );
});

test("purge aussi l’échéance d’un brouillon non affiché pendant que l’application reste ouverte", async ({
  page,
}) => {
  await expect(page.locator(".save-state")).toContainText(
    "Brouillon local à jour",
  );
  const hiddenDraftId = "brouillon-secondaire-expirable";
  await page.evaluate(
    async ({ expiresAt, id }) =>
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("dossier-immo-local-v1");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const transaction = request.result.transaction("drafts", "readwrite");
          const store = transaction.objectStore("drafts");
          const getAll = store.getAll();
          getAll.onerror = () => reject(getAll.error);
          getAll.onsuccess = () => {
            const source = structuredClone(getAll.result.at(-1));
            source.id = id;
            source.dossier.metadata.dossierId = id;
            source.updatedAt = new Date().toISOString();
            source.expiresAt = expiresAt;
            store.put(source);
          };
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        };
      }),
    {
      expiresAt: new Date(Date.now() + 2_000).toISOString(),
      id: hiddenDraftId,
    },
  );
  expect(await hasStoredDraft(page, hiddenDraftId)).toBe(true);

  await page.getByRole("button", { name: /Foyer/ }).click();
  await page.locator(".array-card--collapsible summary").first().click();
  await page
    .getByLabel("Nom affiché")
    .first()
    .fill("Déclenche la planification");
  await expect(page.locator(".save-state")).toContainText(
    "Brouillon local à jour",
  );
  await expect.poll(() => hasStoredDraft(page, hiddenDraftId)).toBe(false);
});

test("charge l'exemple complet et expose la confidentialité locale", async ({
  page,
}) => {
  await expect(page.locator(".brand__mark")).toHaveAttribute(
    "src",
    /brand-mark\.svg$/,
  );
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
  await expect(page.locator(".save-state")).toContainText(
    "Brouillon local à jour",
  );
  await expect(page).toHaveScreenshot("overview-complete.png", {
    animations: "disabled",
    fullPage: true,
  });
});

test("permet de modifier le foyer puis prévisualise treize pages", async ({
  page,
}) => {
  await page.getByRole("button", { name: /Foyer/ }).click();
  await page.locator(".array-card--collapsible summary").first().click();
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
  expect(download.suggestedFilename()).toBe("demo-famille-revenus-mixtes.pdf");
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

test("le guide détaillé est replié par défaut et mémorise la rubrique ouverte", async ({
  page,
}) => {
  const cards = page.locator(".guide-card");
  await expect(cards).toHaveCount(13);
  expect(
    await cards.evaluateAll((items) =>
      items.every((item) => !(item as HTMLDetailsElement).open),
    ),
  ).toBe(true);

  const financing = page.locator('[data-disclosure-id="guide-financing"]');
  await financing.locator("summary").click();
  await expect(financing).toHaveAttribute("open", "");
  await expect(
    financing.getByRole("heading", { name: "Composition multi-prêts" }),
  ).toBeVisible();
  await expect(financing).toContainText("Différé avant amortissement");
  await expect(page).toHaveScreenshot("guide-detailed-financing.png", {
    animations: "disabled",
    fullPage: true,
  });

  await page.getByRole("button", { name: /Foyer/ }).click();
  await page.locator(".sidebar").getByRole("button", { name: /Guide/ }).click();
  await expect(financing).toHaveAttribute("open", "");
});

test("un point de validation ouvre son étape et place le focus sur le champ", async ({
  page,
}) => {
  await page
    .locator(".sidebar")
    .getByRole("button", { name: /Projet/ })
    .click();
  await page
    .locator('[data-disclosure-id="project-financing-frame"] summary')
    .click();
  await page
    .getByRole("spinbutton", { name: "Plafond exceptionnel" })
    .fill("1");
  await page
    .locator(".sidebar")
    .getByRole("button", { name: /Synthèse/ })
    .click();

  const issue = page
    .locator(".validation-summary li")
    .filter({ hasText: "project.maximumPriceCents" });
  await issue.getByRole("button").click();

  const maximumPrice = page.getByRole("spinbutton", {
    name: "Plafond exceptionnel",
  });
  await expect(
    page.getByRole("heading", { name: "Projet immobilier" }),
  ).toBeVisible();
  await expect(maximumPrice).toBeFocused();
  await expect(maximumPrice).toHaveAttribute("aria-invalid", "true");
  await expect(maximumPrice).toHaveAttribute(
    "aria-describedby",
    "field-project-maximumPriceCents-description",
  );
  await expect(
    page.locator("#field-project-maximumPriceCents-description"),
  ).toBeVisible();
  await expect(
    page.locator('[data-disclosure-id="project-financing-frame"]'),
  ).toHaveAttribute("open", "");
});

test("les cartes sont repliées par défaut et mémorisent leur état entre les étapes", async ({
  page,
}) => {
  await page
    .locator(".sidebar")
    .getByRole("button", { name: /Revenus/ })
    .click();
  const activities = page.locator('[data-disclosure-id="income-activities"]');
  await expect(activities).not.toHaveAttribute("open", "");
  await activities.locator("summary").first().click();
  await expect(activities).toHaveAttribute("open", "");

  await page.locator(".sidebar").getByRole("button", { name: /Foyer/ }).click();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: /Revenus/ })
    .click();
  await expect(activities).toHaveAttribute("open", "");

  await page.locator(".sidebar").getByRole("button", { name: /Foyer/ }).click();
  const firstPerson = page.locator(".array-card--collapsible").first();
  await expect(firstPerson).not.toHaveAttribute("open", "");
  await firstPerson.locator("summary").click();
  await expect(firstPerson).toHaveAttribute("open", "");
  await page
    .locator(".sidebar")
    .getByRole("button", { name: /Revenus/ })
    .click();
  await page.locator(".sidebar").getByRole("button", { name: /Foyer/ }).click();
  await expect(firstPerson).toHaveAttribute("open", "");
});

test("l'historique documenté identifie la personne associée au flux de revenu", async ({
  page,
}) => {
  await page
    .locator(".sidebar")
    .getByRole("button", { name: /Revenus/ })
    .click();
  const history = page.locator('[data-disclosure-id="income-history"]');
  await history.locator("summary").first().click();

  const firstHistory = history.locator(".array-card--collapsible").first();
  await expect(firstHistory.locator("summary")).toContainText(
    "Historique 2023 — Élodie Garnier",
  );
  await firstHistory.locator("summary").click();
  await expect(
    firstHistory.getByLabel("Flux de revenu").locator("option:checked"),
  ).toHaveText("Bénéfice libéral retenu — Élodie Garnier");
});

test("le sélecteur charge l'un des trois dossiers entièrement fictifs", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Charger l’exemple fictif" }).click();
  const picker = page.locator("dialog.demo-picker");
  await expect(picker).toBeVisible();
  await expect(
    picker.getByRole("heading", { name: "Choisir un dossier d’exemple" }),
  ).toBeVisible();
  await expect(
    picker.getByRole("button", { name: /Première acquisition en solo/ }),
  ).toBeVisible();
  await expect(
    picker.getByRole("button", { name: /Famille à revenus mixtes/ }),
  ).toBeVisible();
  await expect(
    picker.getByRole("button", { name: /Retraités investisseurs locatifs/ }),
  ).toBeVisible();

  await picker
    .getByRole("button", { name: /Retraités investisseurs locatifs/ })
    .click();
  await expect(
    picker.getByRole("heading", { name: "Confirmer le chargement" }),
  ).toBeVisible();
  await expect(picker).toContainText(
    "Les valeurs actuellement affichées dans le formulaire seront remplacées",
  );
  await expect(picker).toHaveScreenshot(
    "demo-picker-confirmation-desktop.png",
    {
      animations: "disabled",
    },
  );
  await picker.getByRole("button", { name: "Retour aux profils" }).click();
  await expect(
    picker.getByRole("heading", { name: "Choisir un dossier d’exemple" }),
  ).toBeVisible();
  await picker
    .getByRole("button", { name: /Retraités investisseurs locatifs/ })
    .click();
  await picker.getByRole("button", { name: "Charger ce dossier" }).click();
  await expect(picker).toBeHidden();
  await expect(page.locator(".feedback-banner")).toContainText(
    "Retraités investisseurs locatifs",
  );
  await expect(
    page.getByRole("heading", { name: "Retraités — investissement locatif" }),
  ).toBeVisible();
});

test("duplique un scénario sans créer un second scénario principal", async ({
  page,
}) => {
  await page
    .locator(".sidebar")
    .getByRole("button", { name: /Financement/ })
    .click();
  await expect(page.locator(".save-state")).toContainText(
    "Brouillon local à jour",
  );
  await expect(page).toHaveScreenshot("financing-collapsible-scenarios.png", {
    animations: "disabled",
    fullPage: true,
  });
  const cards = page.locator(".array-card--collapsible");
  const initialCount = await cards.count();
  const source = cards.first();
  await expect(source).not.toHaveAttribute("open", "");
  await source.locator("summary").click();
  await source.getByRole("button", { name: "Dupliquer ce scénario" }).click();

  await expect(cards).toHaveCount(initialCount + 1);
  const copy = cards.last();
  await expect(copy).not.toHaveAttribute("open", "");
  await copy.locator("summary").click();
  await expect(copy.getByRole("textbox", { name: "Libellé" })).toHaveValue(
    /— copie$/,
  );
  await expect(
    copy.getByRole("radio", { name: "Scénario principal" }),
  ).not.toBeChecked();
  await expect(
    page.getByRole("button", { name: "Télécharger le PDF" }),
  ).toBeEnabled();
});

test("saisit les durées de financement en années ou en mois sans changer le contrat", async ({
  page,
}) => {
  await page
    .locator(".sidebar")
    .getByRole("button", { name: /Financement/ })
    .click();
  const scenarios = page.locator(".array-card--collapsible");
  const firstScenario = scenarios.first();
  await firstScenario.locator("summary").click();
  const duration = firstScenario.getByRole("spinbutton", {
    name: "Durée d’amortissement",
  });
  const durationUnit = firstScenario.getByRole("combobox", {
    name: "Unité — Durée d’amortissement",
  });
  await expect(duration).toHaveValue("25");
  await expect(durationUnit).toHaveValue("years");
  await duration.fill("20");
  await durationUnit.selectOption("months");
  await expect(duration).toHaveValue("240");

  const centralScenario = scenarios.nth(1);
  await centralScenario.locator(":scope > summary").click();
  const complementaryLoan = centralScenario
    .locator(".nested-card--collapsible")
    .first();
  await complementaryLoan.locator("summary").click();
  await expect(
    complementaryLoan.getByRole("spinbutton", {
      name: "Durée d’amortissement",
    }),
  ).toHaveValue("20");
  await expect(
    complementaryLoan.getByRole("spinbutton", {
      name: "Différé avant amortissement",
    }),
  ).toHaveValue("5");
  const defermentUnit = complementaryLoan.getByRole("combobox", {
    name: "Unité — Différé avant amortissement",
  });
  await defermentUnit.selectOption("months");
  await expect(
    complementaryLoan.getByRole("spinbutton", {
      name: "Différé avant amortissement",
    }),
  ).toHaveValue("60");
});

test("sauvegarde et réimporte le fichier canonique", async ({ page }) => {
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exporter la config" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(
    "demo-famille-revenus-mixtes.dossier-immo.json",
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

test("neutralise le HTML actif d'un dossier importé avant de l'afficher", async ({
  page,
}) => {
  const dossier = JSON.parse(
    readFileSync("config.example/dossier.json", "utf8"),
  );
  dossier.editorial.presentationLetter =
    '<img src="invalid" onerror="document.body.dataset.xss=\'yes\'"><strong>Texte sûr</strong>';
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
  await page.locator(".array-card--collapsible summary").first().click();
  await page.getByLabel("Nom affiché").first().fill("Alex Brouillon");
  await page.waitForTimeout(900);
  expect(await readStoredDraftName(page)).toBe("Alex Brouillon");
  await page.reload();
  expect(await readStoredDraftName(page)).toBe("Alex Brouillon");
  await page.getByRole("button", { name: /Foyer/ }).click();
  await page.locator(".array-card--collapsible summary").first().click();
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

test("la page Textes conserve des identifiants et des résumés HTML valides", async ({
  page,
}) => {
  await page
    .locator(".sidebar")
    .getByRole("button", { name: /Textes/ })
    .click();

  const diagnostics = await page.evaluate(() => {
    const allIds = Array.from(document.querySelectorAll<HTMLElement>("[id]"))
      .map((element) => element.id)
      .filter(Boolean);
    const duplicateIds = [
      ...new Set(allIds.filter((id, index) => allIds.indexOf(id) !== index)),
    ];
    const invalidLabels = Array.from(
      document.querySelectorAll<HTMLLabelElement>("label[for]"),
    )
      .filter((label) => {
        const target = document.getElementById(label.htmlFor);
        return (
          !target ||
          !target.matches(
            "button, input, meter, output, progress, select, textarea",
          )
        );
      })
      .map((label) => label.htmlFor);
    const interactiveSummaries = Array.from(
      document.querySelectorAll("summary"),
    ).filter((summary) =>
      summary.querySelector(
        "a, button, input, select, textarea, [contenteditable='true'], [tabindex]:not([tabindex='-1'])",
      ),
    ).length;
    const unidentifiedRichTextControls = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".rich-text__toolbar button, .rich-text__toolbar select, .rich-text__editor",
      ),
    ).filter((element) => !element.id && !element.getAttribute("name")).length;

    return {
      duplicateIds,
      invalidLabels,
      interactiveSummaries,
      unidentifiedRichTextControls,
    };
  });

  expect(diagnostics).toEqual({
    duplicateIds: [],
    invalidLabels: [],
    interactiveSummaries: 0,
    unidentifiedRichTextControls: 0,
  });
});

test("les nouveaux parcours guidés restent utilisables", async ({ page }) => {
  await page.getByRole("button", { name: /Revenus/ }).click();
  await expect(page.locator("details.editor-subsection")).toHaveCount(3);
  await page.getByRole("button", { name: /Patrimoine/ }).click();
  await expect(page.locator("details.editor-subsection")).toHaveCount(2);
  await page.getByRole("button", { name: /Projet/ }).click();
  await expect(page.locator("details.editor-subsection")).toHaveCount(4);

  await page.getByRole("button", { name: /Passifs/ }).click();
  await page.locator(".array-card--collapsible summary").first().click();
  await expect(
    page.getByRole("checkbox", { name: "Élodie Garnier" }),
  ).toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: "Mathieu Roux" }),
  ).toBeChecked();

  await page.getByRole("button", { name: /Budgets/ }).click();
  const budgetItem = page
    .locator("details.budget-comparison__item")
    .filter({ hasText: "Fiscalité" });
  await expect(budgetItem).toContainText(
    "Fiscalité et charges non mensualisées",
  );
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
  const assetsGuide = page.locator('[data-disclosure-id="guide-assets"]');
  await expect(assetsGuide.locator("summary")).toContainText("Patrimoine");
  await assetsGuide.locator("summary").click();
  await expect(
    assetsGuide.getByRole("heading", { name: "Situation actuelle" }),
  ).toBeVisible();
});
