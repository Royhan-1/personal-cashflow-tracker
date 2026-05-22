import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import ToastContainer from "@/components/ui/ToastContainer";

export const metadata: Metadata = {
  title: "CashFlow Tracker — Personal Finance",
  description: "Track your personal cashflow, manage income and expenses, and visualize your financial health with beautiful charts.",
  keywords: "cashflow, finance, tracker, personal finance, budget",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" data-theme="dark" suppressHydrationWarning>
      <body>
        <AppProvider>
          {children}
          <ToastContainer />
        </AppProvider>
      </body>
    </html>
  );
}
