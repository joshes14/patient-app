"use client";

import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import type { Patient } from "../lib/types";

const PatientForm = dynamic(() => import("./patient-form"), {
  ssr: false,
  loading: () => <div className="p-8 text-center text-sm text-[#444844]">Loading form...</div>
});

type AddPatientModalTriggerProps = {
  label?: string;
  className?: string;
  disabled?: boolean;
};

const defaultButtonClassName =
  "inline-flex items-center gap-2 rounded-full bg-[#2d332f] px-5 py-2.5 text-xs font-medium tracking-[0.14em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#424844]";

export default function AddPatientModalTrigger({
  label = "Add Patient",
  className,
  disabled = false,
}: AddPatientModalTriggerProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const closeModal = () => {
    setIsOpen(false);
  };

  const handleSuccess = (patient: Patient) => {
    void router.prefetch(`/patients/${patient.id}`);
    setIsOpen(false);
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        className={`${className ?? defaultButtonClassName} ${
          disabled ? "cursor-not-allowed opacity-60 hover:translate-y-0 hover:bg-[#2d332f]" : ""
        }`}
      >
        <Plus className="h-4 w-4" strokeWidth={2} />
        <span>{label}</span>
      </button>

      {isOpen && isMounted
        ? createPortal(
            <div
              className="fixed inset-0 z-[90] flex items-end justify-center bg-[#121510]/55 p-2 backdrop-blur-[3px] sm:items-center sm:p-6"
              onClick={closeModal}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-label="Create patient profile"
                onClick={(event) => event.stopPropagation()}
                className="route-enter relative w-full max-w-5xl overflow-hidden rounded-[30px] border border-[#c4c7c3]/35 bg-[#fcfcf8] shadow-[0_44px_120px_-28px_rgba(17,20,15,0.5)]"
              >
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute right-[-8%] top-[-24%] h-[45%] w-[40%] rounded-full bg-[#d8ded2]/32 blur-[90px]" />
                  <div className="absolute bottom-[-20%] left-[-12%] h-[55%] w-[42%] rounded-full bg-[#b7c0b4]/20 blur-[110px]" />
                </div>

                <header className="relative z-10 flex items-center justify-between border-b border-[#c4c7c3]/30 bg-white/76 px-4 py-4 backdrop-blur-sm sm:px-6 sm:py-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#5a6258]">Patient Intake</p>
                    <h3 className="mt-1 text-lg font-semibold text-[#181e1a]">Create New Patient Record</h3>
                  </div>

                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-full border border-[#c4c7c3]/45 bg-[#f4f4ef] p-2 text-[#2d332f] transition-colors hover:bg-[#e9e9e1]"
                    aria-label="Close patient form"
                  >
                    <X className="h-4 w-4" strokeWidth={2} />
                  </button>
                </header>

                <div className="relative z-10 max-h-[calc(100vh-8rem)] overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
                  <PatientForm mode="create" variant="modal" onCancel={closeModal} onSuccess={handleSuccess} />
                </div>
              </section>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
