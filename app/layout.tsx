import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif, DM_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: ["400"],
  subsets: ["latin"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  weight: ["300", "400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Buildstory",
    template: "%s | Buildstory",
  },
  description:
    "The community platform for AI builders. Show what you've built, earn credibility, and connect with builders who ship.",
  metadataBase: new URL("https://buildstory.com"),
  icons: {
    icon: "/favicon.jpg",
  },
  openGraph: {
    type: "website",
    siteName: "Buildstory",
    title: "Buildstory — Show, don't tell.",
    description:
      "The community platform for AI builders. Show what you've built, earn credibility, and connect with builders who ship.",
    images: [
      {
        url: "/cover.png",
        width: 1200,
        height: 630,
        alt: "Buildstory — Show, don't tell.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Buildstory — Show, don't tell.",
    description:
      "The community platform for AI builders. Show what you've built, earn credibility, and connect with builders who ship.",
    images: ["/cover.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`dark ${dmSans.variable} ${instrumentSerif.variable} ${dmMono.variable}`}>
        <body className="antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
