"use client";

import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ClipboardList,
  FileText,
  FileUp,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Settings,
  Stethoscope,
} from "lucide-react";

type StudioShellProps = {
  children: ReactNode;
  settings?: {
    shellTitle?: string;
    shellSubtitle?: string;
  };
};

const navigationItems = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/patients",
    label: "Patient Records",
    icon: FolderOpen,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

const patientSectionItems = [
  { suffix: "", label: "Overview", icon: ClipboardList },
  { suffix: "/medical", label: "Medical", icon: Stethoscope },
  { suffix: "/dental", label: "Dental", icon: FileText },
  { suffix: "/intraoral", label: "Intraoral", icon: FileText },
  { suffix: "/plan", label: "Treatment Plan", icon: FileUp },
  { suffix: "/records", label: "Treatment Records", icon: FolderOpen },
];

const getContentTransitionClass = (previousPath: string, nextPath: string): string => {
  const prevPatientMatch = previousPath.match(/^\/patients\/([^/]+)(\/.*)?$/);
  const nextPatientMatch = nextPath.match(/^\/patients\/([^/]+)(\/.*)?$/);

  const samePatientSectionSwitch =
    Boolean(prevPatientMatch) &&
    Boolean(nextPatientMatch) &&
    prevPatientMatch?.[1] === nextPatientMatch?.[1] &&
    previousPath !== nextPath;

  if (samePatientSectionSwitch) {
    return "patient-section-enter";
  }

  return "route-enter";
};

const isNavItemActive = (pathname: string, href: string): boolean => {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

export default function StudioShell({ children, settings }: StudioShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const previousPathnameRef = useRef(pathname);
  const navContainerRef = useRef<HTMLElement | null>(null);
  const navItemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeIndicator, setActiveIndicator] = useState({ top: 0, height: 0, visible: false });
  const isLoginRoute = pathname === "/login";
  const patientPathMatch = pathname.match(/^\/patients\/([^/]+)(\/.*)?$/);
  const activePatientId = patientPathMatch?.[1] ?? null;
  const activePatientSuffix = patientPathMatch?.[2] ?? "";
  const contentTransitionClass = getContentTransitionClass(previousPathnameRef.current, pathname);

  useLayoutEffect(() => {
    previousPathnameRef.current = pathname;
  }, [pathname]);

  const syncActiveIndicator = useCallback(() => {
    const activeNavItem = navigationItems.find((item) => isNavItemActive(pathname, item.href));

    if (!activeNavItem) {
      setActiveIndicator((prev) => ({ ...prev, visible: false }));
      return;
    }

    const container = navContainerRef.current;
    const activeNode = navItemRefs.current[activeNavItem.href];

    if (!container || !activeNode) {
      return;
    }

    setActiveIndicator({
      top: activeNode.offsetTop,
      height: activeNode.offsetHeight,
      visible: true,
    });
  }, [pathname]);

  useLayoutEffect(() => {
    syncActiveIndicator();
  }, [syncActiveIndicator]);

  useEffect(() => {
    window.addEventListener("resize", syncActiveIndicator);

    return () => {
      window.removeEventListener("resize", syncActiveIndicator);
    };
  }, [syncActiveIndicator]);

  const handleLogout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
      setIsLoggingOut(false);
    }
  };

  if (isLoginRoute) {
    return <div className="route-enter min-h-screen">{children}</div>;
  }

  return (
    <div className="font-body min-h-screen bg-[#fafaf5] text-[#1a1c19]">
      <div className="grid min-h-screen md:grid-cols-[18rem_1fr]">
        <aside className="hidden h-screen border-r border-[#c4c7c3]/30 bg-[#f4f4ef] py-10 pl-6 pr-0 md:flex md:flex-col md:sticky md:top-0">
          <div className="mb-12 px-6">
            <h1 className="font-heading text-xl italic text-[#2d332f]">{settings?.shellTitle ?? "The Sanctuary"}</h1>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] opacity-50">{settings?.shellSubtitle ?? "Premium Dental Care"}</p>
          </div>

          <nav ref={navContainerRef} className="relative mr-6 flex-1 space-y-2">
            <div
              aria-hidden
              className={`pointer-events-none absolute left-0 right-0 rounded-2xl border border-[#c4c7c3]/35 bg-white shadow-[0_16px_24px_-18px_rgba(24,30,26,0.5)] transition-[top,height,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                activeIndicator.visible ? "opacity-100" : "opacity-0"
              }`}
              style={{ top: activeIndicator.top, height: activeIndicator.height }}
            />

            {navigationItems.map((item) => {
              const active = isNavItemActive(pathname, item.href);
              const Icon = item.icon;

              return (
                <div key={item.label}>
                  <Link
                    href={item.href}
                    ref={(node) => {
                      navItemRefs.current[item.href] = node;
                    }}
                    aria-current={active ? "page" : undefined}
                    className={`relative z-10 flex h-14 items-center gap-4 rounded-2xl px-6 transition-colors duration-300 ${
                      active
                        ? "text-[#181e1a]"
                        : "text-[#444844] opacity-75 hover:text-[#181e1a]"
                    }`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                    <span>{item.label}</span>
                  </Link>

                  {item.href === "/patients" ? (
                    <div
                      className={`overflow-hidden transition-[max-height,opacity,transform,margin] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        activePatientId
                          ? "mt-2 max-h-[36rem] translate-y-0 opacity-100"
                          : "mt-0 max-h-0 -translate-y-1 opacity-0 pointer-events-none"
                      }`}
                    >
                      <div className="rounded-2xl border border-[#c4c7c3]/35 bg-white/70 p-2">
                        <div className="px-2 pb-2 pt-1 text-[10px] uppercase tracking-[0.16em] text-[#5a6159]">Record Sections</div>

                        {activePatientId ? (
                          <div className="space-y-1">
                            {patientSectionItems.map((section) => {
                              const href = `/patients/${activePatientId}${section.suffix}`;
                              const normalizedSuffix = activePatientSuffix === "/" ? "" : activePatientSuffix;
                              const sectionActive = normalizedSuffix === section.suffix;
                              const SectionIcon = section.icon;

                              return (
                                <Link
                                  key={section.label}
                                  href={href}
                                  scroll={false}
                                  prefetch={false}
                                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] transition-all duration-300 ${
                                    sectionActive
                                      ? "bg-[#181e1a] text-white"
                                      : "text-[#4f564f] hover:bg-[#f1f1ea] hover:text-[#1a1c19]"
                                  }`}
                                >
                                  <SectionIcon className="h-3.5 w-3.5" strokeWidth={1.8} />
                                  <span>{section.label}</span>
                                </Link>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>

          <div className="mr-6 mt-auto border-t border-[#c4c7c3]/20 pt-10">
            <form onSubmit={handleLogout}>
              <button
                type="submit"
                disabled={isLoggingOut}
                className="flex w-full items-center gap-4 px-6 py-3 text-[#444844] opacity-70 transition-all duration-300 hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LogOut className="h-5 w-5" strokeWidth={1.8} />
                <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
              </button>
            </form>
          </div>
        </aside>

        <div className="min-w-0" data-page-content="true">
          <div key={pathname} className={`${contentTransitionClass} min-h-screen motion-reduce:animate-none`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
