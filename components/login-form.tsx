"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type LoginFormProps = {
  headlineFontClassName?: string;
  bodyFontClassName?: string;
  defaultPractitionerId?: string;
};

export default function LoginForm({
  headlineFontClassName = "",
  bodyFontClassName = "",
  defaultPractitionerId = "",
}: LoginFormProps) {
  const router = useRouter();
  const [practitionerId, setPractitionerId] = useState(defaultPractitionerId);
  const [securityKey, setSecurityKey] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isPending || isNavigating) {
      return;
    }

    setError("");
    setIsPending(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ practitionerId, password: securityKey }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(payload?.error ?? "Login failed");
        return;
      }

      setIsNavigating(true);
      await new Promise((resolve) => setTimeout(resolve, 180));
      router.push("/");
      router.refresh();
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <section
      className={`w-full max-w-md transition-all duration-200 ease-out ${
        isNavigating ? "translate-y-1 opacity-0" : "translate-y-0 opacity-100"
      } ${bodyFontClassName}`}
    >
      <div className="rounded-xl border border-[#c4c7c3]/10 bg-white p-6 shadow-[0_24px_48px_-12px_rgba(26,28,25,0.06)] sm:p-10">
        <header className="mb-7 sm:mb-8">
          <h2 className={`${headlineFontClassName} mb-2 text-2xl font-medium tracking-tight text-[#181e1a]`}>
            Welcome Back
          </h2>
          <p className="text-sm text-[#444844]">Please authenticate to enter the sanctuary.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-7">
          <div className="group">
            <label
              htmlFor="practitioner-id"
              className="mb-2 ml-1 block text-[10px] uppercase tracking-[0.2em] text-[#444844] transition-colors duration-300 group-focus-within:text-[#7c847a]"
            >
              Practitioner ID
            </label>
            <div className="relative">
              <span aria-hidden className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[#444844]/40">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                  <rect x="3.5" y="4" width="17" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
                  <circle cx="9" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M6.5 16.5c.6-1.8 2.1-3 3.8-3s3.2 1.2 3.8 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </span>
              <input
                id="practitioner-id"
                name="practitionerId"
                type="text"
                required
                autoComplete="username"
                value={practitionerId}
                onChange={(event) => setPractitionerId(event.target.value)}
                className="w-full border-0 border-b border-[#c4c7c3]/30 bg-transparent py-3 pl-8 text-[#1a1c19] placeholder:text-[#444844]/20 transition-all duration-300 focus:border-[#7c847a] focus:outline-none focus:ring-0"
                placeholder="LDS-000-00"
              />
            </div>
          </div>

          <div className="group">
            <label
              htmlFor="security-key"
              className="mb-2 ml-1 block text-[10px] uppercase tracking-[0.2em] text-[#444844] transition-colors duration-300 group-focus-within:text-[#7c847a]"
            >
              Security Key
            </label>
            <div className="relative">
              <span aria-hidden className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[#444844]/40">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                  <path d="M15.5 7.2a4 4 0 10-4 4 4.1 4.1 0 001.2-.2l1.4 1.4h1.5v1.5h1.6v1.6H20v-2.6l-2-2A3.9 3.9 0 0015.5 7.2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                  <circle cx="11.5" cy="7.2" r="1.1" fill="currentColor" />
                </svg>
              </span>
              <input
                id="security-key"
                name="password"
                type="password"
                required
                autoFocus
                autoComplete="current-password"
                value={securityKey}
                onChange={(event) => setSecurityKey(event.target.value)}
                className="w-full border-0 border-b border-[#c4c7c3]/30 bg-transparent py-3 pl-8 text-[#1a1c19] placeholder:text-[#444844]/20 transition-all duration-300 focus:border-[#7c847a] focus:outline-none focus:ring-0"
                placeholder="************"
              />
            </div>
          </div>

          {error ? <p className="text-sm text-[#ba1a1a]">{error}</p> : null}

          <div className="pt-2 sm:pt-3">
            <button
              type="submit"
              disabled={isPending || isNavigating}
              className="w-full rounded-lg bg-[#2d332f] py-3.5 text-sm uppercase tracking-widest text-white shadow-sm transition-all duration-500 hover:bg-[#7c847a] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending || isNavigating ? "Entering..." : "Enter Practice"}
            </button>
          </div>
        </form>

        <footer className="mt-9 text-center sm:mt-10">
          <button
            type="button"
            className="text-xs text-[#444844] underline underline-offset-8 decoration-[#c4c7c3]/30 transition-colors duration-300 hover:text-[#7c847a] hover:decoration-[#7c847a]/30"
          >
            Forgot Security Credentials?
          </button>
        </footer>
      </div>

      <div className="mt-6 flex flex-col items-center justify-between gap-3 px-2 sm:mt-7 sm:flex-row">
        <div className="flex items-center gap-3 opacity-60">
          <span aria-hidden className="text-[#7c847a]">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
              <path d="M12 2l7 3v6c0 5-2.8 8.8-7 11-4.2-2.2-7-6-7-11V5l7-3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              <path d="M9.2 11.7l2 2 3.7-3.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-[10px] uppercase tracking-wider">Encrypted Session</span>
        </div>
      </div>
    </section>
  );
}
