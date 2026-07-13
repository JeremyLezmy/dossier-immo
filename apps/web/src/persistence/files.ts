import { validateDossier, type Dossier } from "@dossier-immo/schema";

declare global {
  interface Window {
    showSaveFilePicker?: (options?: {
      suggestedName?: string;
      types?: Array<{ description: string; accept: Record<string, string[]> }>;
    }) => Promise<FileSystemFileHandle>;
  }
}

export interface ImportedDossier {
  readonly dossier: Dossier;
}

export async function importDossierFile(file: File): Promise<ImportedDossier> {
  if (file.size > 10 * 1024 * 1024)
    throw new Error("Le fichier dépasse la taille maximale de 10 Mo.");
  let input: unknown;
  try {
    input = JSON.parse(await file.text());
  } catch {
    throw new Error("Le fichier n'est pas un JSON valide.");
  }
  const validation = validateDossier(input);
  if (!validation.success) {
    const firstIssue = validation.issues[0];
    throw new Error(`Le dossier n'est pas conforme${firstIssue ? ` (${firstIssue.path}) : ${firstIssue.message}` : "."}`);
  }
  return { dossier: validation.dossier };
}

export function serializeDossier(dossier: Dossier): string {
  const validation = validateDossier(dossier);
  if (!validation.success) {
    throw new Error(
      `Le dossier ne peut pas être sauvegardé : ${validation.issues[0]?.message ?? "validation impossible"}`,
    );
  }
  return `${JSON.stringify(validation.dossier, null, 2)}\n`;
}

export async function saveDossierFile(
  dossier: Dossier,
): Promise<"picker" | "download"> {
  const contents = serializeDossier(dossier);
  const filename = `${dossier.metadata.dossierId}.dossier-immo.json`;
  if (window.showSaveFilePicker) {
    const handle = await window.showSaveFilePicker({
      suggestedName: filename,
      types: [
        {
          description: "Dossier Immo",
          accept: { "application/json": [".json"] },
        },
      ],
    });
    const writable = await handle.createWritable();
    await writable.write(contents);
    await writable.close();
    return "picker";
  }
  const url = URL.createObjectURL(
    new Blob([contents], { type: "application/json;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
  return "download";
}

const PRINT_LOAD_TIMEOUT_MS = 15_000;
const PRINT_CLEANUP_TIMEOUT_MS = 120_000;

function waitForFrameLoad(frame: HTMLIFrameElement): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(
        new Error(
          "Le document d'impression n'a pas pu être chargé dans le délai imparti.",
        ),
      );
    }, PRINT_LOAD_TIMEOUT_MS);

    frame.addEventListener(
      "load",
      () => {
        window.clearTimeout(timeout);
        resolve();
      },
      { once: true },
    );
    frame.addEventListener(
      "error",
      () => {
        window.clearTimeout(timeout);
        reject(new Error("Le document d'impression n'a pas pu être chargé."));
      },
      { once: true },
    );
  });
}

async function waitForPrintAssets(document: Document): Promise<void> {
  let timeout: number | undefined;
  const readiness = (async () => {
    await document.fonts?.ready;
    await Promise.all(
      Array.from(document.images, (image) => {
        if (image.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        });
      }),
    );
  })();
  const deadline = new Promise<never>((_resolve, reject) => {
    timeout = window.setTimeout(() => {
      reject(
        new Error(
          "Les ressources du document d'impression n'ont pas été chargées dans le délai imparti.",
        ),
      );
    }, PRINT_LOAD_TIMEOUT_MS);
  });

  try {
    await Promise.race([readiness, deadline]);
  } finally {
    if (timeout !== undefined) window.clearTimeout(timeout);
  }
}

export async function printDocument(html: string): Promise<void> {
  const frame = document.createElement("iframe");
  frame.dataset.dossierImmoPrintTarget = "true";
  frame.title = "Document à imprimer";
  frame.setAttribute("aria-hidden", "true");
  Object.assign(frame.style, {
    position: "fixed",
    right: "100%",
    bottom: "0",
    width: "210mm",
    height: "297mm",
    border: "0",
  });

  const loaded = waitForFrameLoad(frame);
  frame.srcdoc = html;
  document.body.append(frame);

  let cleanupTimeout: number | undefined;
  const cleanup = () => {
    if (cleanupTimeout !== undefined) window.clearTimeout(cleanupTimeout);
    frame.remove();
  };
  try {
    await loaded;
    const printWindow = frame.contentWindow;
    const printDocument = frame.contentDocument;
    if (!printWindow || !printDocument) {
      throw new Error(
        "Le navigateur n'a pas créé de cible d'impression accessible.",
      );
    }

    await waitForPrintAssets(printDocument);
    printWindow.addEventListener("afterprint", cleanup, { once: true });
    cleanupTimeout = window.setTimeout(cleanup, PRINT_CLEANUP_TIMEOUT_MS);
    printWindow.focus();
    printWindow.print();
  } catch (error) {
    cleanup();
    throw error instanceof Error ? error : new Error("L'impression a échoué.");
  }
}

export async function downloadPdfDocument(
  html: string,
  filename: string,
): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const frame = document.createElement("iframe");
  frame.title = "Génération du PDF";
  frame.setAttribute("aria-hidden", "true");
  Object.assign(frame.style, {
    position: "fixed",
    left: "-200vw",
    top: "0",
    width: "1123px",
    height: "1123px",
    border: "0",
  });
  const loaded = waitForFrameLoad(frame);
  frame.srcdoc = html;
  document.body.append(frame);
  try {
    await loaded;
    const target = frame.contentDocument;
    if (!target) throw new Error("Le document PDF n'a pas pu être préparé.");
    await waitForPrintAssets(target);
    const pages = Array.from(
      target.querySelectorAll<HTMLElement>("section.page"),
    );
    if (pages.length === 0) throw new Error("Aucune page à télécharger.");
    let pdf: InstanceType<typeof jsPDF> | undefined;
    for (const [index, page] of pages.entries()) {
      const landscape = page.classList.contains("landscape");
      const orientation = landscape ? "landscape" : "portrait";
      const width = landscape ? 297 : 210;
      const height = landscape ? 210 : 297;
      const canvas = await html2canvas(page, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
      });
      if (!pdf)
        pdf = new jsPDF({
          orientation,
          unit: "mm",
          format: "a4",
          compress: true,
        });
      else pdf.addPage("a4", orientation);
      pdf.addImage(
        canvas.toDataURL("image/jpeg", 0.94),
        "JPEG",
        0,
        0,
        width,
        height,
        undefined,
        "FAST",
      );
      if (index % 3 === 2)
        await new Promise((resolve) => window.setTimeout(resolve, 0));
    }
    pdf?.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
  } finally {
    frame.remove();
  }
}
