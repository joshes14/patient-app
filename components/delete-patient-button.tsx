"use client";

import { AlertTriangle, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type DeletePatientButtonProps = {
  patientId: string;
  patientName: string;
};

export default function DeletePatientButton({ patientId, patientName }: DeletePatientButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [confirmText, setConfirmText] = useState("");

  const canDelete = confirmText.trim().toUpperCase() === "DELETE";

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
      if (event.key === "Escape" && !isPending) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, isPending]);

  const closeModal = () => {
    if (isPending) {
      return;
    }

    setIsOpen(false);
    setError("");
    setConfirmText("");
  };

  const handleDelete = async () => {
    if (isPending || !canDelete) {
      return;
    }

    setError("");

    setIsPending(true);

    try {
      const response = await fetch(`/api/patients/${encodeURIComponent(patientId)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(payload?.error ?? "Unable to delete patient.");
        setIsPending(false);
        return;
      }

      setIsOpen(false);
      router.replace("/patients");
      router.refresh();
    } catch {
      setError("Unable to delete patient.");
      setIsPending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#f0c8c8] bg-[#fff8f8] px-5 py-2.5 text-xs uppercase tracking-[0.14em] text-[#7a2f2f] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#ffeaea]"
      >
        <Trash2 className="h-4 w-4" strokeWidth={1.8} />
        Delete Patient
      </button>

      {isOpen && isMounted
        ? createPortal(
            <div
              className="fixed inset-0 z-[95] flex items-end justify-center bg-[#121510]/60 p-2 backdrop-blur-[4px] sm:items-center sm:p-6"
              onClick={closeModal}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-label="Delete patient record"
                onClick={(event) => event.stopPropagation()}
                className="route-enter relative w-full max-w-xl overflow-hidden rounded-[30px] border border-[#e7c7c7]/45 bg-[#fffaf9] shadow-[0_44px_120px_-28px_rgba(17,20,15,0.55)]"
              >
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute right-[-8%] top-[-24%] h-[45%] w-[44%] rounded-full bg-[#f3d9d9]/45 blur-[90px]" />
                  <div className="absolute bottom-[-25%] left-[-12%] h-[55%] w-[40%] rounded-full bg-[#efc8c8]/28 blur-[110px]" />
                </div>

                <header className="relative z-10 flex items-center justify-between border-b border-[#e7c7c7]/40 bg-white/80 px-4 py-4 backdrop-blur-sm sm:px-6 sm:py-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#7a3a3a]">Danger Zone</p>
                    <h3 className="mt-1 text-lg font-semibold text-[#2d1a1a]">Delete Patient Record</h3>
                  </div>

                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isPending}
                    className="rounded-full border border-[#e4cccc]/65 bg-[#fff4f4] p-2 text-[#7a2f2f] transition-colors hover:bg-[#ffe9e9] disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="Close delete dialog"
                  >
                    <X className="h-4 w-4" strokeWidth={2} />
                  </button>
                </header>

                <div className="relative z-10 space-y-4 px-4 py-4 sm:px-6 sm:py-6">
                  <div className="rounded-2xl border border-[#f0d2d2]/65 bg-white/85 p-4">
                    <p className="text-sm leading-relaxed text-[#4b2525]">
                      You are about to permanently remove <span className="font-semibold">{patientName}</span>.
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-[#6b3c3c]">
                      This will delete the patient profile and all linked medical history, dental history, intraoral exam,
                      treatment plans, and treatment records.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#f0d2d2]/65 bg-white/85 p-4">
                    <label className="mb-1.5 block text-[10px] uppercase tracking-[0.16em] text-[#7a3a3a]">
                      Type DELETE to confirm
                    </label>
                    <input
                      value={confirmText}
                      onChange={(event) => setConfirmText(event.target.value)}
                      disabled={isPending}
                      className="w-full rounded-xl border border-[#e9cfcf]/80 bg-[#fffdfd] px-3 py-2.5 text-sm text-[#3d2020] transition-all duration-300 focus:border-[#b87878] focus:outline-none focus:ring-0"
                      placeholder="DELETE"
                    />
                  </div>

                  {error ? (
                    <div className="flex items-start gap-2 rounded-2xl border border-[#e3b8b8]/65 bg-[#fff0f0] px-3 py-2.5 text-sm text-[#7a2f2f]">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.8} />
                      <p>{error}</p>
                    </div>
                  ) : null}

                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={isPending}
                      className="rounded-full border border-[#d8d0d0]/60 bg-[#f7f4f4] px-5 py-2.5 text-xs uppercase tracking-[0.14em] text-[#4d4343] transition-colors hover:bg-[#efeaea] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={!canDelete || isPending}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#7a2f2f] px-5 py-2.5 text-xs uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#8b3a3a] disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                      {isPending ? "Deleting..." : "Delete Permanently"}
                    </button>
                  </div>
                </div>
              </section>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
