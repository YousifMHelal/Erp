import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Providers } from "@/components/providers";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { auth } from "@/lib/auth";
import type { RootLayoutProps } from "@/types";
import "./globals.css";

const ibmPlexSansArabic = localFont({
  src: [
    { path: "../public/fonts/IBMPlexSansArabic-Regular.woff2", weight: "400" },
    { path: "../public/fonts/IBMPlexSansArabic-Medium.woff2", weight: "500" },
    { path: "../public/fonts/IBMPlexSansArabic-SemiBold.woff2", weight: "600" },
    { path: "../public/fonts/IBMPlexSansArabic-Bold.woff2", weight: "700" },
  ],
  variable: "--font-ibm-plex-sans-arabic",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#2A2F6B",
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app");
  return {
    title: t("name"),
    description: t("description"),
    applicationName: t("name"),
    appleWebApp: { capable: true, title: t("name"), statusBarStyle: "default" },
    icons: {
      icon: [
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: "/apple-touch-icon.png",
    },
  };
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const messages = await getMessages();
  const session = await auth();

  return (
    <html lang="ar" dir="rtl" className={ibmPlexSansArabic.variable} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider locale="ar" messages={messages}>
          <Providers session={session}>{children}</Providers>
          <ServiceWorkerRegister />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
