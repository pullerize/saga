import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
// import localFont from "next/font/local";
import { Providers } from "@/components/shared/Providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// TODO: Uncomment when Atyp Display font files are in public/fonts/
// const atypDisplay = localFont({
//   src: [
//     { path: "../../public/fonts/AtypDisplay-Regular.woff2", weight: "400", style: "normal" },
//     { path: "../../public/fonts/AtypDisplay-Medium.woff2", weight: "500", style: "normal" },
//     { path: "../../public/fonts/AtypDisplay-Semibold.woff2", weight: "600", style: "normal" },
//     { path: "../../public/fonts/AtypDisplay-Bold.woff2", weight: "700", style: "normal" },
//   ],
//   variable: "--font-atyp",
//   display: "swap",
//   fallback: ["Inter", "system-ui", "sans-serif"],
// });

export const metadata: Metadata = {
  title: "SAGA | Раздвижные и межкомнатные двери",
  description:
    "Премиальные раздвижные и межкомнатные дверные системы SAGA. Индивидуальный расчёт, профессиональный монтаж, гарантия качества.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${montserrat.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
