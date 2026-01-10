"use client";

import { AppSidebar, SidebarProvider, MobileMenuButton, useSidebar } from "@/components/app-sidebar";
import { cn } from "@/lib/utils";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  
  return (
    <main 
      className={cn(
        "h-full bg-background transition-all duration-300",
        // Mobile: no padding (sidebar overlays)
        // Desktop: padding based on sidebar state
        "pl-0 md:pl-72",
        collapsed && "md:pl-20"
      )}
    >
      <MobileMenuButton />
      {children}
    </main>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="h-full relative flex">
        <AppSidebar />
        <DashboardContent>{children}</DashboardContent>
      </div>
    </SidebarProvider>
  );
}
