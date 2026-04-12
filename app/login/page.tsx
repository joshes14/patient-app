import { redirect } from "next/navigation";
import LoginForm from "@/components/login-form";
import { getPractitionerId, isAuthenticated } from "@/lib/auth";

export default function LoginPage() {
  if (isAuthenticated()) {
    redirect("/");
  }

  const practitionerId = getPractitionerId();

  return (
    <main
      className="font-body relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#fafaf5] p-4 text-[#1a1c19] animate-[route-content-enter_320ms_ease-out] sm:p-8"
    >
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute bottom-[-10%] left-[-5%] h-[50%] w-[30%] rounded-full bg-[#b6bdb4]/10 blur-[100px]" />
      </div>

      <div className="relative z-10 flex w-full flex-col items-center">
        <LoginForm
          headlineFontClassName="font-heading"
          bodyFontClassName="font-body"
          defaultPractitionerId={practitionerId}
        />

        <div className="mt-10 w-full max-w-4xl opacity-40 sm:mt-12">
          <div className="grid h-1 w-full grid-cols-3 gap-6">
            <div className="rounded-full bg-[#c4c7c3]/20" />
            <div className="rounded-full bg-[#7c847a]/20" />
            <div className="rounded-full bg-[#c4c7c3]/20" />
          </div>
        </div>
      </div>
    </main>
  );
}
