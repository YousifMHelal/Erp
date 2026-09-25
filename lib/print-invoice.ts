export type PrintSize = "A4" | "A5" | "80mm";

declare global {
  interface Window {
    /** Registered by a print route's toolbar; renders the document on that page to a PNG. */
    __capturePrintPng?: () => Promise<Blob>;
  }
}

const PRINT_FRAME_ID = "invoice-print-frame";
const CAPTURE_TIMEOUT_MS = 15_000;

function invoicePrintUrl(invoiceId: string, size: PrintSize): string {
  return `/print/${invoiceId}?size=${encodeURIComponent(size)}`;
}

/**
 * Loads a print route in an off-screen iframe. It keeps a real viewport size so the document lays out
 * exactly as on screen (a display:none or 0×0 frame can print blank or capture a collapsed layout).
 */
function loadPrintFrame(id: string, url: string): Promise<HTMLIFrameElement> {
  document.getElementById(id)?.remove();
  const frame = document.createElement("iframe");
  frame.id = id;
  frame.setAttribute("aria-hidden", "true");
  frame.tabIndex = -1;
  frame.style.cssText =
    "position:fixed;top:0;left:-10000px;width:1200px;height:1700px;border:0;opacity:0;pointer-events:none;";
  frame.src = url;
  const loaded = new Promise<HTMLIFrameElement>((resolve) => {
    frame.addEventListener("load", () => resolve(frame), { once: true });
  });
  document.body.appendChild(frame);
  return loaded;
}

/** Opens the browser print dialog for a same-origin print route without leaving the current page. */
export async function printUrl(url: string): Promise<void> {
  const frame = await loadPrintFrame(PRINT_FRAME_ID, url);
  const win = frame.contentWindow;
  if (!win) return;
  await win.document.fonts.ready;
  win.addEventListener("afterprint", () => frame.remove(), { once: true });
  win.focus();
  win.print();
}

/** Opens the browser print dialog for an invoice without leaving the current page. */
export function printInvoice(invoiceId: string, size: PrintSize = "A4"): Promise<void> {
  return printUrl(invoicePrintUrl(invoiceId, size));
}

/** Renders the document on a same-origin print route to a PNG, off-screen. */
export async function captureUrlPng(url: string): Promise<Blob> {
  const frame = await loadPrintFrame(`print-capture-frame-${encodeURIComponent(url)}`, url);
  try {
    const win = frame.contentWindow;
    if (!win) throw new Error("Capture frame has no window");
    // `load` fires before React hydrates the toolbar that registers the capture hook.
    const started = Date.now();
    while (!win.__capturePrintPng) {
      if (Date.now() - started > CAPTURE_TIMEOUT_MS) throw new Error("Print capture timed out");
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return await win.__capturePrintPng();
  } finally {
    frame.remove();
  }
}

/** Renders the printed invoice to a PNG, off-screen. */
export function captureInvoicePng(invoiceId: string, size: PrintSize = "A4"): Promise<Blob> {
  return captureUrlPng(invoicePrintUrl(invoiceId, size));
}

/** Copies the image of a print route's document to the clipboard. Must be called directly from a click handler. */
export function copyUrlImage(url: string): Promise<void> {
  // The PNG promise goes into ClipboardItem synchronously so the click still counts as the user gesture.
  return navigator.clipboard.write([new ClipboardItem({ "image/png": captureUrlPng(url) })]);
}

/** Copies the invoice image to the clipboard. Must be called directly from a click handler. */
export function copyInvoiceImage(invoiceId: string, size: PrintSize = "A4"): Promise<void> {
  return copyUrlImage(invoicePrintUrl(invoiceId, size));
}

/** Egyptian local numbers (01xxxxxxxxx) → international form wa.me expects (201xxxxxxxxx). */
export function toWhatsAppNumber(phone: string | undefined): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) return `20${digits.slice(1)}`;
  return digits;
}

export function isTouchDevice(): boolean {
  return window.matchMedia("(pointer: coarse)").matches;
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
