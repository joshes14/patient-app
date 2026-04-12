import Link from "next/link";
import AddPatientModalTrigger from "@/components/add-patient-modal-trigger";
import { getAppSettings } from "@/lib/repository";

type TopNavProps = {
  subtitle?: string;
};

export default function TopNav({ subtitle }: TopNavProps) {
  const appSettings = getAppSettings();

  return (
    <header className="font-body mb-6 rounded-3xl border border-[#c4c7c3]/30 bg-white/85 p-4 shadow-[0_20px_40px_-28px_rgba(26,28,25,0.45)] backdrop-blur-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <Link href="/" className="font-heading text-2xl font-light tracking-[0.16em] text-[#181e1a]">
            {appSettings.clinic_name}
          </Link>
          {subtitle ? <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#65655d]">{subtitle}</p> : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="rounded-full border border-[#c4c7c3]/50 bg-[#f4f4ef] px-4 py-2 text-xs uppercase tracking-[0.14em] text-[#2f312e] transition-colors hover:bg-[#eeeee9]"
          >
            Dashboard
          </Link>
          <AddPatientModalTrigger
            label={appSettings.add_patient_label}
            className="inline-flex items-center gap-2 rounded-full bg-[#2d332f] px-4 py-2 text-xs uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#424844]"
          />
        </div>
      </div>
    </header>
  );
}
