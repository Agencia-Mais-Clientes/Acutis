"use client";

import { AppSidebar, SidebarProvider, MobileMenuButton, useSidebar } from "@/components/app-sidebar";
import { cn } from "@/lib/utils";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  
  return (
    <main 
      className={cn(
        "min-h-screen bg-background transition-all duration-300",
        // Mobile: no margin (sidebar overlays)
        // Desktop: margin based on sidebar state
        "ml-0 md:ml-72",
        collapsed && "md:ml-20"
      )}
    >
      <MobileMenuButton />
      {children}
    </main>
  );
}

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  isAdmin: boolean;
}

export function DashboardLayoutClient({ children, isAdmin }: DashboardLayoutClientProps) {
  return (
    <SidebarProvider isAdmin={isAdmin}>
      <div className="min-h-screen relative">
        <AppSidebar />
        <DashboardContent>{children}</DashboardContent>
      </div>
    </SidebarProvider>
  );
}
