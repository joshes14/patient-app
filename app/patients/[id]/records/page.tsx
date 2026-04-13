import { notFound } from "next/navigation";
import PatientPageHeader from "@/components/patient-page-header";
import StudioPageCanvas from "@/components/studio-page-canvas";
import TreatmentRecordManager from "@/components/treatment-record-manager";
import { requirePageAuth } from "@/lib/auth";
import { getPatientById, listTreatmentRecords } from "@/lib/repository";

type PatientRecordsPageProps = {
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

export default async function PatientRecordsPage({ params, searchParams }: PatientRecordsPageProps) {
  requirePageAuth();

  const patient = await getPatientById(params.id);
  if (!patient) {
    notFound();
  }

  const records = await listTreatmentRecords(patient.id);
  const editMode = toSingleValue(searchParams?.edit) === "1";

  return (
    <StudioPageCanvas>
      <PatientPageHeader
        patient={patient}
        title="Treatment Records"
        description="See essential patient details first, then log dated procedures with tooth references and attending clinicians."
        isEditing={editMode}
        editHref={`/patients/${patient.id}/records?edit=1`}
        cancelHref={`/patients/${patient.id}/records`}
        saveFormId="treatment-record-form"
        showDeleteButton
      />
      <TreatmentRecordManager
        formId="treatment-record-form"
        patientId={patient.id}
        initialRecords={records}
        hideIntroCard
        isEditable={editMode}
        showSubmitButton={false}
        onSavedHref={`/patients/${patient.id}/records`}
      />
    </StudioPageCanvas>
  );
}
