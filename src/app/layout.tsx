import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Entrepreneur Workspace | Divisi Entrepreneur HIMA",
    template: "%s | Entrepreneur Workspace",
  },
  description: "Workspace terintegrasi untuk mengelola operasional Divisi Entrepreneur HIMA",
  keywords: ["entrepreneur", "workspace", "HIMA", "divisi", "manajemen"],
  authors: [{ name: "Divisi Entrepreneur HIMA" }],
  creator: "Divisi Entrepreneur HIMA",
  publisher: "Divisi Entrepreneur HIMA",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Entrepreneur Workspace",
    title: "Entrepreneur Workspace | Divisi Entrepreneur HIMA",
    description: "Workspace terintegrasi untuk mengelola operasional Divisi Entrepreneur HIMA",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
