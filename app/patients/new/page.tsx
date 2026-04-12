import Link from "next/link";
import PatientForm from "@/components/patient-form";
import StudioPageCanvas from "@/components/studio-page-canvas";
import { requirePageAuth } from "@/lib/auth";

export default function NewPatientPage() {
  requirePageAuth();

  return (
    <StudioPageCanvas>
      <div className="mb-4">
        <Link href="/" className="text-xs uppercase tracking-[0.14em] text-[#444844] underline-offset-2 transition hover:underline">
          Back to dashboard
        </Link>
      </div>
      <PatientForm mode="create" />
    </StudioPageCanvas>
  );
}
