"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { toBlob } from "html-to-image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/print-invoice";

type PrintToolbarProps = {
  targetId: string;
  fileName: string;
  autoAction?: "print" | "copy";
};

async function renderPng(targetId: string): Promise<Blob> {
  const node = document.getElementById(targetId);
  if (!node) throw new Error("Print target not found");
  await document.fonts.ready;
  // html-to-image inlines computed styles, so the on-screen `mx-auto` centering
  // would become a fixed left margin and push the invoice out of frame.
  const blob = await toBlob(node, {
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    cacheBust: true,
    width: node.offsetWidth,
    height: node.offsetHeight,
    style: { margin: "0" },
  });
  if (!blob) throw new Error("Image render returned empty");
  return blob;
}

export function PrintToolbar({ targetId, fileName, autoAction }: PrintToolbarProps) {
  const t = useTranslations("print");
  const [isCopying, setIsCopying] = useState(false);
  const autoRan = useRef(false);

  async function copyImage() {
    setIsCopying(true);
    // The blob promise is handed to ClipboardItem synchronously so the click
    // still counts as the user gesture Safari/Chrome require for clipboard writes.
    const pngPromise = renderPng(targetId);
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": pngPromise })]);
      toast.success(t("copied"));
    } catch {
      try {
        downloadBlob(await pngPromise, fileName);
        toast.info(t("copyFallbackDownloaded"));
      } catch {
        toast.error(t("copyFailed"));
      }
    } finally {
      setIsCopying(false);
    }
  }

  // Lets a parent page that loaded this route in a hidden iframe grab the document image.
  useEffect(() => {
    window.__capturePrintPng = () => renderPng(targetId);
    return () => {
      delete window.__capturePrintPng;
    };
  }, [targetId]);

  useEffect(() => {
    if (!autoAction || autoRan.current) return;
    autoRan.current = true;
    if (autoAction === "print") {
      void document.fonts.ready.then(() => window.print());
    } else {
      void copyImage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAction]);

  return (
    <div className="mx-auto mb-4 flex w-fit gap-2 px-2 print:hidden">
      <Button type="button" variant="outline" onClick={copyImage} disabled={isCopying}>
        <Copy />
        {isCopying ? t("copying") : t("copyImage")}
      </Button>
      <Button type="button" variant="primary" onClick={() => window.print()}>
        <Printer />
        {t("printAction")}
      </Button>
    </div>
  );
}
