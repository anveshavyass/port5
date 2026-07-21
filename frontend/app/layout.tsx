import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PulseAI — EatSure Feedback Intelligence",
  description: "AI-powered customer feedback categorisation, sentiment, and weekly insight summaries for EatSure.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
