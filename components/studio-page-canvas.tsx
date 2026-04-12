import type { ReactNode } from "react";

type StudioPageCanvasProps = {
  children: ReactNode;
};

export default function StudioPageCanvas({ children }: StudioPageCanvasProps) {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-8%] top-[-16%] h-[45%] w-[36%] rounded-full bg-[#f4f4ef] blur-[120px]" />
        <div className="absolute bottom-[-12%] left-[-7%] h-[40%] w-[28%] rounded-full bg-[#b6bdb4]/10 blur-[100px]" />
      </div>

      <section className="relative z-10 mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-8 sm:py-10">{children}</section>
    </main>
  );
}
