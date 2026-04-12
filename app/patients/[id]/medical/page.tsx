import { notFound } from "next/navigation";
import MedicalHistoryForm from "@/components/medical-history-form";
import PatientPageHeader from "@/components/patient-page-header";
import StudioPageCanvas from "@/components/studio-page-canvas";
import { requirePageAuth } from "@/lib/auth";
import { getMedicalHistory, getPatientById } from "@/lib/repository";

type PatientMedicalPageProps = {
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

export default function PatientMedicalPage({ params, searchParams }: PatientMedicalPageProps) {
  requirePageAuth();

  const patient = getPatientById(params.id);
  if (!patient) {
    notFound();
  }

  const medicalHistory = getMedicalHistory(patient.id);
  const editMode = toSingleValue(searchParams?.edit) === "1";

  return (
    <StudioPageCanvas>
      <PatientPageHeader
        patient={patient}
        title="Medical History"
        description="Start with the patient snapshot above, then complete this medical questionnaire to support safe dental treatment planning."
        isEditing={editMode}
        editHref={`/patients/${patient.id}/medical?edit=1`}
        cancelHref={`/patients/${patient.id}/medical`}
        saveFormId="medical-history-form"
        showDeleteButton
      />
      <MedicalHistoryForm
        formId="medical-history-form"
        patientId={patient.id}
        initialData={medicalHistory}
        hideIntroCard
        isEditable={editMode}
        showSubmitButton={false}
        onSavedHref={`/patients/${patient.id}/medical`}
      />
    </StudioPageCanvas>
  );
}
