"use client";

import { useState, useTransition, useRef, useEffect } from "react";
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
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const left = Math.max(16, rect.left);
      
      setMenuPosition({
        top: rect.bottom + 8,
        left: left,
      });
      
      // Foca no campo de busca quando abrir
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      // Limpa a busca quando fechar
      setSearchQuery("");
    }
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

  // Filtra empresas ativas E pela busca
  const empresasAtivas = empresas.filter(e => e.ativo);
  const empresasFiltradas = empresasAtivas.filter(e => 
    e.nome_empresa.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
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

      {/* Dropdown - TEMA LIGHT com z-index muito alto */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0" 
            style={{ zIndex: 99998 }}
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Menu Light */}
          <div 
            className="fixed w-[300px] max-h-[70vh] overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-2xl flex flex-col"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              zIndex: 99999,
            }}
          >
            {/* Header com busca */}
            <div className="p-3 border-b border-gray-100">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Selecionar Empresa
              </div>
              
              {/* Campo de busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar empresa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
                />
              </div>
            </div>
            
            {/* Lista de empresas */}
            <div className="p-2 overflow-auto flex-1">
              <div className="space-y-0.5">
                {empresasFiltradas.map((empresa) => (
                  <button
                    key={empresa.owner}
                    onClick={() => handleSelect(empresa.owner)}
                    disabled={isPending}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150",
                      "text-left text-sm",
                      empresa.owner === empresaAtual.owner
                        ? "bg-violet-100 text-violet-700 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <Building2 className={cn(
                      "h-4 w-4 shrink-0",
                      empresa.owner === empresaAtual.owner ? "text-violet-500" : "text-gray-400"
                    )} />
                    <span className="flex-1 truncate">{empresa.nome_empresa}</span>
                    {empresa.owner === empresaAtual.owner && (
                      <Check className="h-4 w-4 text-violet-500 shrink-0" />
                    )}
                  </button>
                ))}
                
                {empresasFiltradas.length === 0 && searchQuery && (
                  <div className="px-3 py-4 text-sm text-gray-400 text-center">
                    Nenhuma empresa encontrada para "{searchQuery}"
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
        </>
      )}
    </>
  );
}
