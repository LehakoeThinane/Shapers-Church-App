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
          // Can't import theme.color.background/text from @shapers/ui here
          // (tried it — RootLayout is a Server Component, and the package's
          // barrel index.ts also exports client-only components like
          // TextField, which use useState and fail Next's server/client
          // boundary check on import). Keep these in sync with
          // packages/ui/src/theme.ts `background`/`text` by hand.
          backgroundColor: "#050506",
          // Text elements that don't set their own `color` (e.g. headings
          // using only fontSize/fontWeight) otherwise fall back to the
          // browser's default black — invisible against this dark
          // background. CSS `color` is inherited, so this covers every
          // such element in one place instead of one-by-one.
          color: "#F5F5F7",
        }}
      >
        {children}
      </body>
    </html>
  );
}
