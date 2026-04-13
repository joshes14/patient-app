import { notFound } from "next/navigation";
import IntraoralForm from "@/components/intraoral-form";
import PatientPageHeader from "@/components/patient-page-header";
import StudioPageCanvas from "@/components/studio-page-canvas";
import { requirePageAuth } from "@/lib/auth";
import { getLatestIntraoralExam, getPatientById } from "@/lib/repository";

type PatientIntraoralPageProps = {
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

export default async function PatientIntraoralPage({ params, searchParams }: PatientIntraoralPageProps) {
  requirePageAuth();

  const patient = await getPatientById(params.id);
  if (!patient) {
    notFound();
  }

  const intraoralExam = await getLatestIntraoralExam(patient.id);
  const editMode = toSingleValue(searchParams?.edit) === "1";

  return (
    <StudioPageCanvas>
      <PatientPageHeader
        patient={patient}
        title="Intraoral Examination"
        description="Reference the patient overview first, then record intraoral findings on tissue, occlusion, hygiene, and charting notes."
        isEditing={editMode}
        editHref={`/patients/${patient.id}/intraoral?edit=1`}
        cancelHref={`/patients/${patient.id}/intraoral`}
        saveFormId="intraoral-form"
        showDeleteButton
      />
      <IntraoralForm
        formId="intraoral-form"
        patientId={patient.id}
        initialData={intraoralExam}
        hideIntroCard
        isEditable={editMode}
        showSubmitButton={false}
        onSavedHref={`/patients/${patient.id}/intraoral`}
      />
    </StudioPageCanvas>
  );
}
