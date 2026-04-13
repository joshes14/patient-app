import Link from "next/link";
import AddPatientModalTrigger from "@/components/add-patient-modal-trigger";
import PatientReviewStatusControls from "@/components/patient-review-status-controls";
import StudioPageCanvas from "@/components/studio-page-canvas";
import { requirePageAuth } from "@/lib/auth";
import { getAppSettings, listPatients } from "@/lib/repository";
import type { PatientReviewStatus } from "@/lib/types";

type PatientsIndexPageProps = {
  searchParams?: {
    q?: string | string[];
    sex?: string | string[];
    review_status?: string | string[];
  };
};

const toSingleValue = (value?: string | string[]): string => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
};

const fullName = (first: string, last: string, middle?: string | null): string => {
  return [last, ", ", first, middle ? ` ${middle}` : ""].join("");
};

export default async function PatientsIndexPage({ searchParams }: PatientsIndexPageProps) {
  requirePageAuth();

  const q = toSingleValue(searchParams?.q);
  const sex = toSingleValue(searchParams?.sex);
  const reviewStatusRaw = toSingleValue(searchParams?.review_status);
  const reviewStatus: PatientReviewStatus | "all" =
    reviewStatusRaw === "active" ||
    reviewStatusRaw === "archived"
      ? reviewStatusRaw
      : "all";
  const appSettings = await getAppSettings();
  const patients = await listPatients({ q, sex, review_status: reviewStatus });

  return (
    <StudioPageCanvas>
      <section className="space-y-6">
        <div className="flex items-center justify-between gap-3 border-b border-[#c4c7c3]/30 pb-6">
          <h2 className="font-heading text-3xl font-light text-[#181e1a]">Patient Records</h2>
          <AddPatientModalTrigger label={appSettings.add_patient_label} />
        </div>

        <form className="grid gap-3 sm:grid-cols-[1fr_180px_210px_auto]" action="/patients" method="get">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by ID or name"
            className="rounded-full border border-[#c4c7c3]/45 bg-white px-4 py-2.5 text-sm text-[#1a1c19] transition-all duration-300 focus:border-[#7c847a] focus:outline-none focus:ring-0"
          />
          <select
            name="sex"
            defaultValue={sex}
            className="rounded-full border border-[#c4c7c3]/45 bg-white px-4 py-2.5 text-sm text-[#1a1c19] transition-all duration-300 focus:border-[#7c847a] focus:outline-none focus:ring-0"
          >
            <option value="">All sexes</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
          <select
            name="review_status"
            defaultValue={reviewStatus}
            className="rounded-full border border-[#c4c7c3]/45 bg-white px-4 py-2.5 text-sm text-[#1a1c19] transition-all duration-300 focus:border-[#7c847a] focus:outline-none focus:ring-0"
          >
            <option value="all">All record states</option>
            <option value="active">All Records</option>
            <option value="archived">Archived</option>
          </select>
          <button
            type="submit"
            className="rounded-full bg-[#2d332f] px-5 py-2.5 text-xs font-medium tracking-wide text-white transition-all duration-300 hover:-translate-y-0.5 hover:opacity-90"
          >
            Search
          </button>
        </form>

        <div className="overflow-x-auto border-y border-[#c4c7c3]/30">
          <table className="w-full min-w-[760px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-left text-[#181e1a]">
                <th className="border-b border-[#c4c7c3]/40 px-3 py-2">Patient ID</th>
                <th className="border-b border-[#c4c7c3]/40 px-3 py-2">Name</th>
                <th className="border-b border-[#c4c7c3]/40 px-3 py-2">Sex</th>
                <th className="border-b border-[#c4c7c3]/40 px-3 py-2">Status</th>
                <th className="border-b border-[#c4c7c3]/40 px-3 py-2">Contact</th>
                <th className="border-b border-[#c4c7c3]/40 px-3 py-2">Address</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id} className="transition-colors hover:bg-[#f4f4ef]">
                  <td className="border-b border-[#e3e3de] px-3 py-2">
                    <Link
                      href={`/patients/${patient.id}`}
                      scroll={false}
                      prefetch={false}
                      className="text-[#2d332f] underline-offset-2 transition-colors hover:text-[#181e1a] hover:underline"
                    >
                      {patient.id}
                    </Link>
                  </td>
                  <td className="border-b border-[#e3e3de] px-3 py-2 text-[#1a1c19]">
                    {fullName(patient.first_name, patient.last_name, patient.middle_name)}
                  </td>
                  <td className="border-b border-[#e3e3de] px-3 py-2 text-[#444844]">{patient.sex ?? "-"}</td>
                  <td className="border-b border-[#e3e3de] px-3 py-2">
                    <PatientReviewStatusControls patientId={patient.id} reviewStatus={patient.review_status} compact />
                  </td>
                  <td className="border-b border-[#e3e3de] px-3 py-2 text-[#444844]">
                    {patient.cellphone ?? patient.home_telephone ?? "No contact"}
                  </td>
                  <td className="border-b border-[#e3e3de] px-3 py-2 text-[#444844]">{patient.home_address ?? "No address"}</td>
                </tr>
              ))}

              {patients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-[#444844]">
                    No patients found for the current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </StudioPageCanvas>
  );
}
