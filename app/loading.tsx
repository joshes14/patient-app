import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4 text-[#444844]/60">
        <Loader2 className="h-8 w-8 animate-spin" strokeWidth={1.5} />
        <p className="text-sm font-medium uppercase tracking-widest">Loading...</p>
      </div>
    </div>
  );
}