import { Settings as SettingsIcon } from "lucide-react";
import SettingsForm from "@/components/settings-form";
import StudioPageCanvas from "@/components/studio-page-canvas";
import { requirePageAuth } from "@/lib/auth";
import { getAppSettings, listPractitioners } from "@/lib/repository";

export default function SettingsPage() {
  requirePageAuth();

  const appSettings = getAppSettings();
  const practitioners = listPractitioners();

  return (
    <StudioPageCanvas>
      <section className="space-y-6">
        <header className="rounded-3xl border border-[#c4c7c3]/30 bg-white/85 p-6 shadow-[0_20px_40px_-28px_rgba(26,28,25,0.45)] backdrop-blur-sm sm:p-8">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#c4c7c3]/40 bg-[#f4f4ef] text-[#2d332f]">
              <SettingsIcon className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <div>
              <h1 className="font-heading text-3xl font-light text-[#181e1a] sm:text-4xl">Settings</h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#444844]">
                Update clinic branding text and manage practitioner logins.
              </p>
            </div>
          </div>
        </header>

        <SettingsForm initialSettings={appSettings} initialPractitioners={practitioners} />
      </section>
    </StudioPageCanvas>
  );
}
