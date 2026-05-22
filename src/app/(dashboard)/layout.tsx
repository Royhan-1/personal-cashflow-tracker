import React from 'react';
import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-layout animate-fade-in">
      <Sidebar />
      <main className="app-main">
        {children}
      </main>
    </div>
  );
}
