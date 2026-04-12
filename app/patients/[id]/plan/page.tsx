import { notFound } from "next/navigation";
import PatientPageHeader from "@/components/patient-page-header";
import StudioPageCanvas from "@/components/studio-page-canvas";
import TreatmentPlanManager from "@/components/treatment-plan-manager";
import { requirePageAuth } from "@/lib/auth";
import { getPatientById, listTreatmentPlans } from "@/lib/repository";

type PatientPlanPageProps = {
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

export default function PatientPlanPage({ params, searchParams }: PatientPlanPageProps) {
  requirePageAuth();

  const patient = getPatientById(params.id);
  if (!patient) {
    notFound();
  }

  const plans = listTreatmentPlans(patient.id);
  const editMode = toSingleValue(searchParams?.edit) === "1";

  return (
    <StudioPageCanvas>
      <PatientPageHeader
        patient={patient}
        title="Treatment Plan"
        description="Review patient context first, then draft and approve treatment plans with clinician and supervisor sign-off."
        isEditing={editMode}
        editHref={`/patients/${patient.id}/plan?edit=1`}
        cancelHref={`/patients/${patient.id}/plan`}
        saveFormId="treatment-plan-form"
        showDeleteButton
      />
      <TreatmentPlanManager
        formId="treatment-plan-form"
        patientId={patient.id}
        initialPlans={plans}
        hideIntroCard
        isEditable={editMode}
        showSubmitButton={false}
        onSavedHref={`/patients/${patient.id}/plan`}
      />
    </StudioPageCanvas>
  );
}
