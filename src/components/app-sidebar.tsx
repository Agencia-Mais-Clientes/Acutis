"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, createContext, useContext } from "react";
import {
  LayoutDashboard,
  Settings,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  Shield,
  Cpu,
} from "lucide-react";
import Image from "next/image";

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
  isAdmin: boolean;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  setCollapsed: () => {},
  mobileOpen: false,
  setMobileOpen: () => {},
  isAdmin: false,
});

export function useSidebar() {
  return useContext(SidebarContext);
}

interface RouteItem {
  label: string;
  icon: typeof LayoutDashboard;
  href: string;
  adminOnly?: boolean;
}

const routes: RouteItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Análises",
    icon: BarChart3,
    href: "/dashboard/analises",
  },
  {
    label: "Insights Agência",
    icon: Sparkles,
    href: "/dashboard/insights",
    adminOnly: true,
  },
  {
    label: "Consumo IA",
    icon: Cpu,
    href: "/dashboard/consumo-ia",
    adminOnly: true,
  },
  {
    label: "Configurações",
    icon: Settings,
    href: "/dashboard/settings",
  },
];

interface SidebarProviderProps {
  children: React.ReactNode;
  isAdmin?: boolean;
}

export function SidebarProvider({ children, isAdmin = false }: SidebarProviderProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, mobileOpen, setMobileOpen, isAdmin }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function MobileMenuButton() {
  const { setMobileOpen } = useSidebar();
  
  return (
    <button
      onClick={() => setMobileOpen(true)}
      className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
    >
      <Menu className="h-5 w-5 text-gray-700" />
    </button>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen, isAdmin } = useSidebar();

  // Filtra rotas baseado em permissão admin
  const visibleRoutes = routes.filter(route => !route.adminOnly || isAdmin);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-[90]"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={cn(
          "h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out",
          // Always fixed position
          "fixed inset-y-0 left-0 z-[100]",
          // Mobile: slide in/out
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          // Desktop: collapsed or expanded
          collapsed ? "w-20" : "w-72"
        )}
      >
        <div className="px-4 py-4 border-b border-sidebar-border/50 flex items-center justify-between shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3 cursor-pointer group">
            <Image
              src="/logos/logo_acutis_black.png"
              alt="Acutis"
              width={collapsed ? 40 : 120}
              height={35}
              className={cn(
                "transition-all duration-300",
                collapsed ? "h-8 w-auto" : "h-9 w-auto"
              )}
            />
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                  Painel de Gestão
                </p>
              </div>
            )}
          </Link>
          
          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <div className="px-3 py-6 flex-1">
          <div className="space-y-1.5">
            {visibleRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer rounded-xl transition-all duration-200 ease-in-out",
                  pathname === route.href || pathname?.startsWith(route.href + "/")
                    ? "bg-gradient-to-r from-[#8537E7]/10 to-[#278BCD]/10 text-primary shadow-sm" 
                    : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
                  collapsed && "justify-center"
                )}
                title={collapsed ? route.label : undefined}
              >
                <div className={cn("flex items-center", collapsed ? "justify-center" : "flex-1")}>
                  <route.icon 
                    className={cn(
                      "h-5 w-5 transition-colors", 
                      collapsed ? "" : "mr-3",
                      pathname === route.href || pathname?.startsWith(route.href + "/") 
                        ? "text-primary" 
                        : "text-muted-foreground/70 group-hover:text-primary"
                    )} 
                  />
                  {!collapsed && route.label}
                </div>
              </Link>
            ))}
          </div>

          {/* Admin Back Link */}
          {isAdmin && (
            <div className="mt-2 pt-2 border-t border-sidebar-border/50 space-y-1.5">
              <Link
                href="/admin/empresas"
                className={cn(
                  "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer rounded-xl transition-all duration-200 ease-in-out",
                  "text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
                  collapsed && "justify-center"
                )}
                title={collapsed ? "Voltar para Admin" : undefined}
              >
                <div className={cn("flex items-center", collapsed ? "justify-center" : "flex-1")}>
                  <Shield 
                    className={cn(
                      "h-5 w-5 transition-colors text-muted-foreground/70 group-hover:text-primary", 
                      collapsed ? "" : "mr-3"
                    )} 
                  />
                  {!collapsed && "Voltar para Admin"}
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Collapse button (desktop only) */}
        <div className="hidden md:block p-3 border-t border-sidebar-border/50 shrink-0 mt-auto">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span>Recolher</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
