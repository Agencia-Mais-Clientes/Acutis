"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Building2, ChevronDown, Check, Shield, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Empresa {
  owner: string;
  nome_empresa: string;
  ativo: boolean;
}

interface CompanySelectorProps {
  empresas: Empresa[];
  empresaAtual: Empresa;
  onSelect: (owner: string) => Promise<{ success: boolean; error?: string }>;
}

export function CompanySelector({ empresas, empresaAtual, onSelect }: CompanySelectorProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current || !dropdownRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownWidth = 300;
    
    let left = rect.left;
    if (left + dropdownWidth > window.innerWidth - 16) {
      left = window.innerWidth - dropdownWidth - 16;
    }
    left = Math.max(16, left);

    dropdownRef.current.style.top = `${rect.bottom + 8}px`;
    dropdownRef.current.style.left = `${left}px`;
  }, []);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        updatePosition();
        searchInputRef.current?.focus();
      });

      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);

      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    } else {
      setSearchQuery("");
    }
  }, [isOpen, updatePosition]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  async function handleSelect(owner: string) {
    if (owner === empresaAtual.owner) {
      setIsOpen(false);
      return;
    }

    startTransition(async () => {
      const result = await onSelect(owner);
      if (result.success) {
        setIsOpen(false);
        router.refresh();
      }
    });
  }

  const empresasAtivas = empresas.filter(e => e.ativo);
  const empresasFiltradas = empresasAtivas.filter(e => 
    e.nome_empresa.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const dropdown = isOpen && mounted ? createPortal(
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0"
        style={{ zIndex: 99998 }}
        onClick={() => setIsOpen(false)} 
      />
      
      {/* Menu */}
      <div 
        ref={dropdownRef}
        className="fixed w-[300px] max-h-[70vh] overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-2xl flex flex-col pointer-events-auto"
        style={{ zIndex: 99999 }}
      >
        {/* Header com busca */}
        <div className="p-3 border-b border-gray-100">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Selecionar Empresa
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar empresa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>
        </div>
        
        {/* Lista de empresas */}
        <div className="p-2 overflow-y-auto flex-1">
          <div className="space-y-0.5">
            {empresasFiltradas.map((empresa) => (
              <button
                key={empresa.owner}
                type="button"
                onClick={() => handleSelect(empresa.owner)}
                disabled={isPending}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer",
                  "text-left text-sm",
                  empresa.owner === empresaAtual.owner
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100",
                  isPending && "opacity-50 cursor-wait"
                )}
              >
                <Building2 className={cn(
                  "h-4 w-4 shrink-0",
                  empresa.owner === empresaAtual.owner ? "text-blue-500" : "text-gray-400"
                )} />
                <span className="flex-1 truncate">{empresa.nome_empresa}</span>
                {empresa.owner === empresaAtual.owner && (
                  <Check className="h-4 w-4 text-blue-500 shrink-0" />
                )}
              </button>
            ))}
            
            {empresasFiltradas.length === 0 && searchQuery && (
              <div className="px-3 py-4 text-sm text-gray-400 text-center">
                Nenhuma empresa encontrada para &quot;{searchQuery}&quot;
              </div>
            )}

            {empresasAtivas.length === 0 && (
              <div className="px-3 py-4 text-sm text-gray-400 text-center">
                Nenhuma empresa ativa
              </div>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  ) : null;

  return (
    <>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200",
          "bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm",
          "text-white font-medium text-sm",
          isPending && "opacity-50 cursor-wait"
        )}
      >
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-yellow-300" />
          <span className="text-yellow-300 text-xs font-bold uppercase tracking-wide">
            Admin
          </span>
        </div>
        <div className="w-px h-4 bg-white/30" />
        <Building2 className="h-4 w-4 text-white/70" />
        <span className="max-w-[180px] truncate">
          {empresaAtual.nome_empresa}
        </span>
        <ChevronDown className={cn(
          "h-4 w-4 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>

      {dropdown}
    </>
  );
}
