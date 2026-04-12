"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getPatientReviewStatusMeta } from "@/lib/patient-review-status";
import type { PatientReviewStatus } from "@/lib/types";

type PatientReviewStatusControlsProps = {
  patientId: string;
  reviewStatus: PatientReviewStatus;
  compact?: boolean;
};

export default function PatientReviewStatusControls({
  patientId,
  reviewStatus,
  compact = false,
}: PatientReviewStatusControlsProps) {
  const router = useRouter();
  const statusMeta = getPatientReviewStatusMeta(reviewStatus);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  const setStatus = async (nextStatus: PatientReviewStatus) => {
    if (isPending || nextStatus === reviewStatus) {
      return;
    }

    setError("");
    setIsPending(true);

    try {
      const response = await fetch(`/api/patients/${encodeURIComponent(patientId)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ review_status: nextStatus }),
      });

      if (!response.ok) {
        setError("Unable to update");
        setIsPending(false);
        return;
      }

      router.refresh();
    } catch {
      setError("Unable to update");
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span
        className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusMeta.className}`}
      >
        {statusMeta.label}
      </span>

      {reviewStatus !== "archived" ? (
        <button
          type="button"
          onClick={() => void setStatus("archived")}
          disabled={isPending}
          className="rounded-full border border-[#ccd0d8] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[#4b4f59] transition-colors hover:bg-[#e5e6ea] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Archive
        </button>
      ) : null}

      {reviewStatus !== "active" ? (
        <button
          type="button"
          onClick={() => void setStatus("active")}
          disabled={isPending}
          className="rounded-full border border-[#c9cdc5] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[#3f463f] transition-colors hover:bg-[#e4e3d9] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Restore
        </button>
      ) : null}

      {!compact && error ? <span className="text-[10px] text-[#ba1a1a]">{error}</span> : null}
      {compact && error ? <span className="text-[9px] text-[#ba1a1a]">{error}</span> : null}
    </div>
  );
}
