import Link from "next/link";
import { Eye, MoreHorizontal, Search, Settings } from "lucide-react";
import AddPatientModalTrigger from "@/components/add-patient-modal-trigger";
import StudioPageCanvas from "@/components/studio-page-canvas";
import { requirePageAuth } from "@/lib/auth";
import { getAppSettings, listPatients } from "@/lib/repository";
import type { PatientReviewStatus } from "@/lib/types";

type HomePageProps = {
  searchParams?: {
    q?: string | string[];
    sex?: string | string[];
  };
};

const toSingleValue = (value?: string | string[]): string => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
};

const formatDisplayName = (first: string, last: string, middle?: string | null): string => {
  return [first, middle ?? "", last].filter((part) => part.trim().length > 0).join(" ");
};

const toDateLabel = (value?: string | null): string => {
  if (!value) {
    return "No recorded date";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "No recorded date";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const toStatus = (
  reviewStatus: PatientReviewStatus,
): {
  label: string;
  className: string;
} => {
  if (reviewStatus === "archived") {
    return {
      label: "ARCHIVED",
      className: "bg-[#e5e6ea] text-[#4b4f59]",
    };
  }

  return {
    label: "ACTIVE CARE",
    className: "bg-[#e4e3d9] text-[#474740]",
  };
};

export default function HomePage({ searchParams }: HomePageProps) {
  requirePageAuth();

  const q = toSingleValue(searchParams?.q);
  const sex = toSingleValue(searchParams?.sex);
  const appSettings = getAppSettings();
  const patients = listPatients({ q, sex });

  const totalPatients = patients.length;
  const now = Date.now();
  const newToday = patients.filter((patient) => {
    const created = new Date(patient.created_at).getTime();
    if (Number.isNaN(created)) {
      return false;
    }

    return now - created <= 24 * 60 * 60 * 1000;
  }).length;

  return (
    <StudioPageCanvas>
      <header
        className="dashboard-reveal mx-auto flex w-full flex-wrap items-center justify-between gap-6 pb-6"
        style={{ animationDelay: "40ms" }}
      >
        <div className="flex items-center gap-8">
          <div className="font-heading text-2xl font-light tracking-widest text-[#181e1a]">{appSettings.clinic_name}</div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:gap-4">
          <form className="relative min-w-[220px] flex-1 sm:w-64 sm:flex-none" action="/" method="get">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#444844]/40" strokeWidth={1.8} />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search patients..."
              className="w-full rounded-full border-none bg-[#f4f4ef] py-2 pl-10 pr-4 text-xs placeholder:text-[#444844]/50 focus:ring-1 focus:ring-[#181e1a]"
            />
            <input type="hidden" name="sex" value={sex} />
          </form>

          <Link
            href="/settings"
            className="rounded-full p-2 transition-colors duration-300 hover:bg-[#f4f4ef]"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" strokeWidth={1.8} />
          </Link>

          <AddPatientModalTrigger label={appSettings.add_patient_label} />
        </div>
      </header>

      <section className="space-y-10">
        <div
          className="dashboard-reveal flex flex-col justify-between gap-6 border-b border-[#c4c7c3]/20 pb-10 md:flex-row md:items-end"
          style={{ animationDelay: "130ms" }}
        >
          <div className="max-w-2xl">
            <h2 className="font-heading mb-4 text-4xl font-light leading-tight tracking-tight text-[#181e1a] sm:text-5xl">
              {appSettings.dashboard_title}
            </h2>
            <p className="text-base font-light leading-relaxed text-[#444844] sm:text-lg">
              {appSettings.dashboard_description}
            </p>
          </div>

          <div className="flex gap-4">
            <div className="min-w-[120px] rounded-xl bg-[#f4f4ef] px-6 py-4 text-center">
              <span className="font-heading block text-2xl text-[#181e1a]">{totalPatients.toLocaleString()}</span>
              <span className="mt-1 block text-[10px] uppercase tracking-widest text-[#444844]">Total Patients</span>
            </div>
            <div className="min-w-[120px] rounded-xl bg-[#f4f4ef] px-6 py-4 text-center">
              <span className="font-heading block text-2xl text-[#181e1a]">{newToday}</span>
              <span className="mt-1 block text-[10px] uppercase tracking-widest text-[#444844]">New Today</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-12 xl:gap-12">
          <section className="dashboard-reveal space-y-6 xl:col-span-8" style={{ animationDelay: "220ms" }}>
            <h3 className="font-heading text-2xl font-light italic">{appSettings.dashboard_ledger_title}</h3>

            <div className="space-y-4">
              {patients.slice(0, 8).map((patient, index) => {
                const status = toStatus(patient.review_status);

                return (
                  <Link
                    key={patient.id}
                    href={`/patients/${patient.id}`}
                    scroll={false}
                    prefetch={false}
                    className={`dashboard-item-reveal group flex flex-col gap-5 rounded-xl p-5 transition-all duration-500 hover:shadow-[0_24px_40px_-12px_rgba(26,28,25,0.06)] sm:flex-row sm:items-center sm:gap-8 sm:p-6 ${
                      index % 2 === 0 ? "bg-[#fafaf5] hover:bg-white" : "bg-[#f4f4ef] hover:bg-white"
                    }`}
                    style={{ animationDelay: `${300 + index * 75}ms` }}
                  >
                    <div className="h-14 w-14 shrink-0 rounded-full bg-[#e3e3de] sm:h-16 sm:w-16" />

                    <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <h4 className="font-heading text-xl text-[#181e1a]">
                          {formatDisplayName(patient.first_name, patient.last_name, patient.middle_name)}
                        </h4>
                        <p className="mt-1 text-xs text-[#444844]">Ref: #{patient.id}</p>
                      </div>

                      <div>
                        <span className="mb-1 block text-[10px] uppercase tracking-widest text-[#444844]">Last Visit</span>
                        <p className="text-sm font-medium">{toDateLabel(patient.updated_at)}</p>
                      </div>

                      <div>
                        <span className="mb-1 block text-[10px] uppercase tracking-widest text-[#444844]">Plan Status</span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.className}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                      <span className="rounded-full p-2 text-[#444844] hover:bg-[#e8e8e3]">
                        <Eye className="h-4 w-4" strokeWidth={1.8} />
                      </span>
                      <span className="rounded-full p-2 text-[#444844] hover:bg-[#e8e8e3]">
                        <MoreHorizontal className="h-4 w-4" strokeWidth={1.8} />
                      </span>
                    </div>
                  </Link>
                );
              })}

              {patients.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#c4c7c3] bg-[#f4f4ef] p-6 text-sm text-[#444844]">
                  No patients found for the current filters.
                </div>
              ) : null}
            </div>
          </section>

          <aside className="space-y-8 xl:col-span-4" />
        </div>
      </section>
    </StudioPageCanvas>
  );
}
