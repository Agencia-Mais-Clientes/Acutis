"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Settings,
  Activity,
  Users,
  BarChart3
} from "lucide-react";
// We'll need a way to handle logout if it's a server action, typically passed down or imported if possible.
// For now, I'll assume we can trigger the form submission or redirect. 
// Ideally logout is in a separate client component or handled via actions.
// Based on page.tsx, handleLogout is a server action. 
// I will just place the visual 'Sair' button here and maybe make it a client component that form submits if possible, 
// or simpler: keep the Logout in the top-right user menu if I add a Header, 
// OR make this sidebar accept a logout action prop? 
// Let's stick to a simple client sidebar for navigation first.

const routes = [
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
    label: "Configurações",
    icon: Settings,
    href: "/dashboard/settings",
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="px-6 py-4 border-b border-sidebar-border/50">
        <Link href="/dashboard" className="flex items-center gap-3 cursor-pointer group">
           <div className="w-10 h-10 bg-gradient-to-br from-[#8537E7] to-[#278BCD] rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/20 group-hover:scale-105 transition-transform duration-300">
              <Activity className="h-5 w-5 text-white" />
           </div>
           <div>
             <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent tracking-tight">
               Acutis
             </h1>
             <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold ml-0.5">
               Painel de Gestão
             </p>
           </div>
        </Link>
      </div>
      <div className="px-4 py-6 flex-1">
        <div className="space-y-1.5">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer rounded-xl transition-all duration-200 ease-in-out",
                pathname === route.href || pathname?.startsWith(route.href + "/")
                  ? "bg-gradient-to-r from-[#8537E7]/10 to-[#278BCD]/10 text-primary shadow-sm" 
                  : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3 transition-colors", 
                  pathname === route.href || pathname?.startsWith(route.href + "/") 
                    ? "text-primary" 
                    : "text-muted-foreground/70 group-hover:text-primary")} 
                />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="px-3 py-2">
         {/* Logout placeholder */}
      </div>
    </div>
  );
}
