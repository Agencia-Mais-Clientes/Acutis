import { isAdminSession } from "@/lib/auth";
import { DashboardLayoutClient } from "./_layout-client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdmin = await isAdminSession();

  return <DashboardLayoutClient isAdmin={isAdmin}>{children}</DashboardLayoutClient>;
}
