import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import RootLayoutClient from "./RootLayoutClient";

// Optimize font loading
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Improve font loading performance
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap", // Improve font loading performance
});

export const metadata = {
  title: "Social App",
  description: "A social media application built with Next.js",
  // Add additional metadata for better SEO and performance
};

export const viewport = {
  themeColor: "#ffffff",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};


// Add performance optimization headers
export const headers = () => {
  return [
    {
      key: 'Cache-Control',
      value: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
    },
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    },
  ];
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="light">
      <head>
        {/* Preconnect to important domains */}
        <link rel="preconnect" href="https://images.unsplash.com" />
      </head>
      <body className={`${geistSans.className} ${geistMono.className} antialiased`}>
        <RootLayoutClient>
          {children}
        </RootLayoutClient>
      </body>
    </html>
  );
}