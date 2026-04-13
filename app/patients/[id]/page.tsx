import { notFound } from "next/navigation";
import PatientPageHeader from "@/components/patient-page-header";
import PatientOverviewGrid from "@/components/patient-overview-grid";
import StudioPageCanvas from "@/components/studio-page-canvas";
import { requirePageAuth } from "@/lib/auth";
import { getPatientBundle } from "@/lib/repository";

type PatientOverviewPageProps = {
  params: {
    id: string;
  };
  searchParams?: {
    edit?: string | string[];
  };
};

const toSingleValue = (value?: string | string[]): string => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
};

export default async function PatientOverviewPage({ params, searchParams }: PatientOverviewPageProps) {
  requirePageAuth();

  const bundle = await getPatientBundle(params.id);
  if (!bundle) {
    notFound();
  }

  const { patient, medicalHistory, dentalHistory, intraoralExam, treatmentPlans, treatmentRecords } = bundle;
  const editMode = toSingleValue(searchParams?.edit) === "1";
  const chartProgress = [
    { label: "Medical History", complete: Boolean(medicalHistory) },
    { label: "Dental History", complete: Boolean(dentalHistory) },
    { label: "Intraoral Exam", complete: Boolean(intraoralExam) },
    { label: "Treatment Plans", complete: treatmentPlans.length > 0 },
    { label: "Treatment Records", complete: treatmentRecords.length > 0 },
  ];

  return (
    <StudioPageCanvas>
      <PatientPageHeader
        patient={patient}
        title="Overview"
        description="Review key patient details first, then use the section tabs below to continue charting or update this profile."
        isEditing={editMode}
        editHref={`/patients/${patient.id}?edit=1`}
        cancelHref={`/patients/${patient.id}`}
        saveFormId="patient-overview-form"
        showDeleteButton
      />

      <PatientOverviewGrid
        formId="patient-overview-form"
        patient={patient}
        isEditing={editMode}
        chartProgress={chartProgress}
        treatmentPlansCount={treatmentPlans.length}
        treatmentRecordsCount={treatmentRecords.length}
        onSavedHref={`/patients/${patient.id}`}
      />
    </StudioPageCanvas>
  );
}
