import type { Metadata } from "next";
import { Red_Hat_Display, Edu_QLD_Beginner } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const eduQldBeginner = Edu_QLD_Beginner({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-edu-qld",
});

const redHat = Red_Hat_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-red-hat-display",
});

export const metadata: Metadata = {
  title: "Clearup",
  description: "Your Skincare Organizer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full ${redHat.variable} ${eduQldBeginner.variable}`}
    >
      <body className="min-full antialiased">
        <main className="flex flex-col min-h-screen bg-[#F8F8F8]">
          <div className="flex flex-col flex-1 text-black">{children}</div>
        </main>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
