import type { Metadata } from "next";
import StudioShell from "@/components/studio-shell";
import { getAppSettings } from "@/lib/repository";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dental Clinic Records",
  description: "Offline-first patient records for a single dental clinic",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const appSettings = getAppSettings();

  return (
    <html lang="en">
      <body className="font-body">
        <StudioShell
          settings={{
            shellTitle: appSettings.shell_title,
            shellSubtitle: appSettings.shell_subtitle,
          }}
        >
          {children}
        </StudioShell>
      </body>
    </html>
  );
}
