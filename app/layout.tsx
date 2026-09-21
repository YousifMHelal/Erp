import type { Metadata } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Providers } from "@/components/providers";
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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app");
  return { title: t("name"), description: t("description") };
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const messages = await getMessages();

  return (
    <html lang="ar" dir="rtl" className={ibmPlexSansArabic.variable} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider locale="ar" messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
