import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shapers Church",
  description: "Shapers Church member app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, -apple-system, sans-serif",
          backgroundColor: "#050506",
        }}
      >
        {children}
      </body>
    </html>
  );
}
