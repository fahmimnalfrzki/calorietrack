"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/scan",
    label: "Scan",
    icon: (active: boolean) => (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
        <rect
          x="3" y="3" width="7" height="7" rx="1.5"
          stroke={active ? "#111" : "#9CA3AF"} strokeWidth="1.8"
        />
        <rect
          x="14" y="3" width="7" height="7" rx="1.5"
          stroke={active ? "#111" : "#9CA3AF"} strokeWidth="1.8"
        />
        <rect
          x="3" y="14" width="7" height="7" rx="1.5"
          stroke={active ? "#111" : "#9CA3AF"} strokeWidth="1.8"
        />
        <path
          d="M14 14h2m4 0h-2m0 0v-2m0 4v2m-4 0h2m2 0h2"
          stroke={active ? "#111" : "#9CA3AF"} strokeWidth="1.8" strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (active: boolean) => (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
        <rect
          x="3" y="12" width="4" height="9" rx="1"
          fill={active ? "#111" : "#9CA3AF"}
        />
        <rect
          x="10" y="7" width="4" height="14" rx="1"
          fill={active ? "#111" : "#9CA3AF"}
        />
        <rect
          x="17" y="3" width="4" height="18" rx="1"
          fill={active ? "#111" : "#9CA3AF"}
        />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: (active: boolean) => (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" stroke={active ? "#111" : "#9CA3AF"} strokeWidth="1.8" />
        <path
          d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
          stroke={active ? "#111" : "#9CA3AF"} strokeWidth="1.8" strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] gap-0.5"
            >
              {tab.icon(active)}
              <span
                className={`text-[10px] font-medium ${active ? "text-gray-900" : "text-gray-400"}`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
