import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.handout.link"),
  title: "Handout — Build one pagers that close prospects",
  description: "Bundle client-facing content into one sleek, trackable site.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    type: "website",
    title: "Handout — Build one pagers that close prospects",
    description: "Bundle client-facing content into one sleek, trackable site.",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "Handout — Build one pagers that close prospects." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Handout — Build one pagers that close prospects",
    description: "Bundle client-facing content into one sleek, trackable site.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
