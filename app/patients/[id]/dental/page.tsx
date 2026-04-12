import { notFound } from "next/navigation";
import DentalHistoryForm from "@/components/dental-history-form";
import PatientPageHeader from "@/components/patient-page-header";
import StudioPageCanvas from "@/components/studio-page-canvas";
import { requirePageAuth } from "@/lib/auth";
import { getDentalHistory, getPatientById } from "@/lib/repository";

type PatientDentalPageProps = {
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

export default function PatientDentalPage({ params, searchParams }: PatientDentalPageProps) {
  requirePageAuth();

  const patient = getPatientById(params.id);
  if (!patient) {
    notFound();
  }

  const dentalHistory = getDentalHistory(patient.id);
  const editMode = toSingleValue(searchParams?.edit) === "1";

  return (
    <StudioPageCanvas>
      <PatientPageHeader
        patient={patient}
        title="Dental History"
        description="Use the summary above for context, then document previous dental visits, procedures, anesthesia exposure, and complications."
        isEditing={editMode}
        editHref={`/patients/${patient.id}/dental?edit=1`}
        cancelHref={`/patients/${patient.id}/dental`}
        saveFormId="dental-history-form"
        showDeleteButton
      />
      <DentalHistoryForm
        formId="dental-history-form"
        patientId={patient.id}
        initialData={dentalHistory}
        hideIntroCard
        isEditable={editMode}
        showSubmitButton={false}
        onSavedHref={`/patients/${patient.id}/dental`}
      />
    </StudioPageCanvas>
  );
}
