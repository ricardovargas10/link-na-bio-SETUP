import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminProvider } from "./AdminData";
import { AdminNav } from "./AdminNav";
import { ListSkeleton } from "./Skeleton";

export const metadata: Metadata = {
  title: "Painel",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
  referrer: "same-origin",
};

export default function AdminLayout({ children }: LayoutProps<"/admin-setup">) {
  return (
    <div className="min-h-dvh bg-admin-bg text-raisin">
      <AdminProvider>
        <AdminNav />
        <div className="mx-auto w-full max-w-xl px-4 pt-6 pb-16">
          <Suspense fallback={<ListSkeleton />}>{children}</Suspense>
        </div>
      </AdminProvider>
    </div>
  );
}
