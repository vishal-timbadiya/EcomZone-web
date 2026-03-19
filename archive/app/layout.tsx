import type { Metadata } from "next";
import "./globals.css";
import ContactBar from "./components/ContactBar";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";


export const metadata: Metadata = {
  title: {
    default: "EcomZone - Wholesale Products Online",
    template: "%s | EcomZone",
  },
  description:
    "Buy wholesale products online. Order single units or full cartons with transparent GST pricing. B2B ecommerce made simple.",
  keywords: [
    "wholesale products",
    "B2B ecommerce India",
    "bulk purchase online",
    "carton products",
    "GST billing products",
    "buy in bulk India",
  ],
  metadataBase: new URL("https://ecomzone.in"),
  openGraph: {
    title: "EcomZone - Wholesale Products",
    description:
      "Order single units or full cartons at wholesale prices with GST billing.",
    url: "https://ecomzone.in",
    siteName: "EcomZone",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EcomZone - Wholesale Products",
    description:
      "Buy wholesale products online with transparent pricing.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased">
        <ContactBar />
        <Navbar />
        <main>{children}</main>
        <Footer />

      </body>
    </html>
  );
}
