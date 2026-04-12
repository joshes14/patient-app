import type { PatientReviewStatus } from "@/lib/types";

export const PATIENT_REVIEW_STATUS_META: Record<
  PatientReviewStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className: "bg-[#e4e3d9] text-[#474740]",
  },
  archived: {
    label: "Archived",
    className: "bg-[#e5e6ea] text-[#4b4f59]",
  },
};

export const getPatientReviewStatusMeta = (status: PatientReviewStatus) => {
  return PATIENT_REVIEW_STATUS_META[status] ?? PATIENT_REVIEW_STATUS_META.active;
};
