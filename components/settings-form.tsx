"use client";

import { FormEvent, useState } from "react";
import { Lock, Plus, Save, UserMinus, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import AddPatientModalTrigger from "@/components/add-patient-modal-trigger";
import type { AppSettings, Practitioner } from "@/lib/types";

type SettingsFormProps = {
  initialSettings: AppSettings;
  initialPractitioners: Practitioner[];
};

type AppSettingsState = {
  shell_title: string;
  shell_subtitle: string;
  clinic_name: string;
  add_patient_label: string;
  dashboard_title: string;
  dashboard_ledger_title: string;
  dashboard_description: string;
};

const inputClassName =
  "w-full rounded-xl border border-[#c4c7c3]/45 bg-white px-3 py-2.5 text-sm text-[#1a1c19] transition-all duration-300 focus:border-[#7c847a] focus:outline-none focus:ring-0";

const sectionClassName =
  "rounded-3xl border border-[#c4c7c3]/30 bg-white/85 p-5 shadow-[0_20px_40px_-28px_rgba(26,28,25,0.45)] backdrop-blur-sm sm:p-6";

export default function SettingsForm({ initialSettings, initialPractitioners }: SettingsFormProps) {
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettingsState>({
    shell_title: initialSettings.shell_title,
    shell_subtitle: initialSettings.shell_subtitle,
    clinic_name: initialSettings.clinic_name,
    add_patient_label: initialSettings.add_patient_label,
    dashboard_title: initialSettings.dashboard_title,
    dashboard_ledger_title: initialSettings.dashboard_ledger_title,
    dashboard_description: initialSettings.dashboard_description,
  });
  const [practitioners, setPractitioners] = useState<Practitioner[]>(initialPractitioners);
  const [newPractitioner, setNewPractitioner] = useState({
    id: "",
    display_name: "",
    password: "",
  });
  const [settingsMessage, setSettingsMessage] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [practitionerMessage, setPractitionerMessage] = useState("");
  const [practitionerError, setPractitionerError] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingPractitioner, setIsSavingPractitioner] = useState(false);
  const [passwordDrafts, setPasswordDrafts] = useState<Record<string, string>>({});
  const [isUpdatingPasswordId, setIsUpdatingPasswordId] = useState<string | null>(null);
  const [isDeactivatingId, setIsDeactivatingId] = useState<string | null>(null);

  const activePractitionerCount = practitioners.filter((entry) => entry.is_active === 1).length;

  const onSaveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSavingSettings) {
      return;
    }

    setSettingsError("");
    setSettingsMessage("");
    setIsSavingSettings(true);

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setSettingsError(payload?.error ?? "Unable to save settings.");
        return;
      }

      const payload = (await response.json()) as { settings: AppSettings };
      setSettings({
        shell_title: payload.settings.shell_title,
        shell_subtitle: payload.settings.shell_subtitle,
        clinic_name: payload.settings.clinic_name,
        add_patient_label: payload.settings.add_patient_label,
        dashboard_title: payload.settings.dashboard_title,
        dashboard_ledger_title: payload.settings.dashboard_ledger_title,
        dashboard_description: payload.settings.dashboard_description,
      });
      setSettingsMessage("Branding settings updated.");
      router.refresh();
    } catch {
      setSettingsError("Unable to save settings.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const onAddPractitioner = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSavingPractitioner) {
      return;
    }

    setPractitionerError("");
    setPractitionerMessage("");
    setIsSavingPractitioner(true);

    try {
      const response = await fetch("/api/settings/practitioners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPractitioner),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setPractitionerError(payload?.error ?? "Unable to add practitioner.");
        return;
      }

      const payload = (await response.json()) as { practitioner: Practitioner };
      setPractitioners((prev) => [...prev, payload.practitioner]);
      setNewPractitioner({ id: "", display_name: "", password: "" });
      setPractitionerMessage("Practitioner added.");
    } catch {
      setPractitionerError("Unable to add practitioner.");
    } finally {
      setIsSavingPractitioner(false);
    }
  };

  const onUpdatePassword = async (practitionerId: string) => {
    if (isUpdatingPasswordId) {
      return;
    }

    const password = passwordDrafts[practitionerId] ?? "";
    if (password.length < 4) {
      setPractitionerError("Password must be at least 4 characters.");
      setPractitionerMessage("");
      return;
    }

    setPractitionerError("");
    setPractitionerMessage("");
    setIsUpdatingPasswordId(practitionerId);

    try {
      const response = await fetch(`/api/settings/practitioners/${encodeURIComponent(practitionerId)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setPractitionerError(payload?.error ?? "Unable to update practitioner password.");
        return;
      }

      const payload = (await response.json()) as { practitioner: Practitioner };
      setPractitioners((prev) => prev.map((entry) => (entry.id === payload.practitioner.id ? payload.practitioner : entry)));
      setPasswordDrafts((prev) => ({ ...prev, [practitionerId]: "" }));
      setPractitionerMessage(`Password updated for ${payload.practitioner.display_name}.`);
    } catch {
      setPractitionerError("Unable to update practitioner password.");
    } finally {
      setIsUpdatingPasswordId(null);
    }
  };

  const onDeactivatePractitioner = async (practitionerId: string) => {
    if (isDeactivatingId) {
      return;
    }

    const confirmed = window.confirm("Deactivate this practitioner? They will no longer be able to log in.");
    if (!confirmed) {
      return;
    }

    setPractitionerError("");
    setPractitionerMessage("");
    setIsDeactivatingId(practitionerId);

    try {
      const response = await fetch(`/api/settings/practitioners/${encodeURIComponent(practitionerId)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setPractitionerError(payload?.error ?? "Unable to deactivate practitioner.");
        return;
      }

      const payload = (await response.json()) as { practitioner: Practitioner };
      setPractitioners((prev) => prev.map((entry) => (entry.id === payload.practitioner.id ? payload.practitioner : entry)));
      setPractitionerMessage(`${payload.practitioner.display_name} has been deactivated.`);
    } catch {
      setPractitionerError("Unable to deactivate practitioner.");
    } finally {
      setIsDeactivatingId(null);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className={sectionClassName}>
        <h2 className="font-heading text-2xl font-light text-[#181e1a]">Branding</h2>
        <p className="mt-2 text-sm text-[#444844]">Change the app labels your friend asked for.</p>

        <form onSubmit={onSaveSettings} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-[0.16em] text-[#4f564f]">Sidebar Title</label>
            <input
              className={inputClassName}
              value={settings.shell_title}
              onChange={(event) => setSettings((prev) => ({ ...prev, shell_title: event.target.value }))}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-[0.16em] text-[#4f564f]">Sidebar Subtitle</label>
            <input
              className={inputClassName}
              value={settings.shell_subtitle}
              onChange={(event) => setSettings((prev) => ({ ...prev, shell_subtitle: event.target.value }))}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-[0.16em] text-[#4f564f]">Clinic Name</label>
            <input
              className={inputClassName}
              value={settings.clinic_name}
              onChange={(event) => setSettings((prev) => ({ ...prev, clinic_name: event.target.value }))}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-[0.16em] text-[#4f564f]">Add Patient Button Label</label>
            <input
              className={inputClassName}
              value={settings.add_patient_label}
              onChange={(event) => setSettings((prev) => ({ ...prev, add_patient_label: event.target.value }))}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-[0.16em] text-[#4f564f]">Dashboard Title</label>
            <input
              className={inputClassName}
              value={settings.dashboard_title}
              onChange={(event) => setSettings((prev) => ({ ...prev, dashboard_title: event.target.value }))}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-[0.16em] text-[#4f564f]">Ledger Section Title</label>
            <input
              className={inputClassName}
              value={settings.dashboard_ledger_title}
              onChange={(event) => setSettings((prev) => ({ ...prev, dashboard_ledger_title: event.target.value }))}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-[0.16em] text-[#4f564f]">Dashboard Description</label>
            <textarea
              rows={3}
              className={`${inputClassName} resize-y`}
              value={settings.dashboard_description}
              onChange={(event) => setSettings((prev) => ({ ...prev, dashboard_description: event.target.value }))}
            />
          </div>

          <div className="rounded-2xl border border-[#c4c7c3]/35 bg-[#f8f8f4] p-4">
            <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-[#4f564f]">Preview Add Patient</p>
            <AddPatientModalTrigger label={settings.add_patient_label} disabled />
          </div>

          {settingsError ? <p className="text-sm text-[#ba1a1a]">{settingsError}</p> : null}
          {settingsMessage ? <p className="text-sm text-[#2f4b35]">{settingsMessage}</p> : null}

          <button
            type="submit"
            disabled={isSavingSettings}
            className="inline-flex items-center gap-2 rounded-full bg-[#2d332f] px-5 py-2.5 text-xs uppercase tracking-[0.14em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#424844] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Save className="h-4 w-4" strokeWidth={1.8} />
            <span>{isSavingSettings ? "Saving..." : "Save Branding"}</span>
          </button>
        </form>
      </section>

      <section className={sectionClassName}>
        <h2 className="font-heading text-2xl font-light text-[#181e1a]">Practitioners</h2>
        <p className="mt-2 text-sm text-[#444844]">Add practitioner login access, rotate passwords, and deactivate accounts.</p>

        <div className="mt-5 space-y-3 rounded-2xl border border-[#c4c7c3]/30 bg-[#fafaf5] p-4">
          {activePractitionerCount <= 1 ? (
            <p className="rounded-xl border border-[#f0d9a8]/40 bg-[#fffaf0] px-3 py-2 text-xs text-[#715b2f]">
              Keep at least one active practitioner. Deactivate is disabled when only one active account remains.
            </p>
          ) : null}

          {practitioners.map((practitioner) => (
            <div
              key={practitioner.id}
              className="rounded-xl border border-[#c4c7c3]/25 bg-white p-3"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-[#1a1c19]">
                  <UserRound className="h-4 w-4" strokeWidth={1.8} />
                  <div>
                    <span className="block text-sm font-medium">{practitioner.display_name}</span>
                    <span className="text-xs uppercase tracking-[0.14em] text-[#5a6159]">{practitioner.id}</span>
                  </div>
                </div>

                <span
                  className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] ${
                    practitioner.is_active === 1
                      ? "bg-[#e6efe7] text-[#2f4b35]"
                      : "bg-[#ececeb] text-[#646763]"
                  }`}
                >
                  {practitioner.is_active === 1 ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                <div>
                  <label className="mb-1.5 block text-[10px] uppercase tracking-[0.16em] text-[#4f564f]">New Password</label>
                  <input
                    type="password"
                    className={inputClassName}
                    value={passwordDrafts[practitioner.id] ?? ""}
                    onChange={(event) =>
                      setPasswordDrafts((prev) => ({
                        ...prev,
                        [practitioner.id]: event.target.value,
                      }))
                    }
                    placeholder="at least 4 characters"
                    disabled={practitioner.is_active !== 1}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => onUpdatePassword(practitioner.id)}
                  disabled={practitioner.is_active !== 1 || isUpdatingPasswordId === practitioner.id}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#c4c7c3]/45 bg-white px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-[#2d332f] transition-colors hover:bg-[#f2f4ef] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Lock className="h-3.5 w-3.5" strokeWidth={1.8} />
                  <span>{isUpdatingPasswordId === practitioner.id ? "Saving..." : "Save Password"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDeactivatePractitioner(practitioner.id)}
                  disabled={
                    practitioner.is_active !== 1 ||
                    activePractitionerCount <= 1 ||
                    isDeactivatingId === practitioner.id
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#f0c8c8] bg-[#fff8f8] px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-[#7a2f2f] transition-colors hover:bg-[#ffeaea] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <UserMinus className="h-3.5 w-3.5" strokeWidth={1.8} />
                  <span>{isDeactivatingId === practitioner.id ? "Deactivating..." : "Deactivate"}</span>
                </button>
              </div>
            </div>
          ))}
          {practitioners.length === 0 ? (
            <p className="text-sm text-[#5a6159]">No practitioners yet.</p>
          ) : null}
        </div>

        <form onSubmit={onAddPractitioner} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-[0.16em] text-[#4f564f]">Practitioner ID</label>
            <input
              className={inputClassName}
              value={newPractitioner.id}
              onChange={(event) => setNewPractitioner((prev) => ({ ...prev, id: event.target.value }))}
              placeholder="LDS-123-45"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-[0.16em] text-[#4f564f]">Display Name</label>
            <input
              className={inputClassName}
              value={newPractitioner.display_name}
              onChange={(event) => setNewPractitioner((prev) => ({ ...prev, display_name: event.target.value }))}
              placeholder="Dr. Jane Doe"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-[0.16em] text-[#4f564f]">Password</label>
            <input
              type="password"
              className={inputClassName}
              value={newPractitioner.password}
              onChange={(event) => setNewPractitioner((prev) => ({ ...prev, password: event.target.value }))}
              placeholder="at least 4 characters"
            />
          </div>

          {practitionerError ? <p className="text-sm text-[#ba1a1a]">{practitionerError}</p> : null}
          {practitionerMessage ? <p className="text-sm text-[#2f4b35]">{practitionerMessage}</p> : null}

          <button
            type="submit"
            disabled={isSavingPractitioner}
            className="inline-flex items-center gap-2 rounded-full bg-[#2d332f] px-5 py-2.5 text-xs uppercase tracking-[0.14em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#424844] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Plus className="h-4 w-4" strokeWidth={1.8} />
            <span>{isSavingPractitioner ? "Adding..." : "Add Practitioner"}</span>
          </button>
        </form>
      </section>
    </div>
  );
}
