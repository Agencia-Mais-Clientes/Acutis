"use client";

import { useState } from "react";
import { EmpresaComStatus, toggleCompanyStatus, deleteCompany } from "../../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Wifi, 
  WifiOff, 
  Edit, 
  Trash2, 
  MoreVertical,
  Power,
  PowerOff,
  Bot,
  Smartphone,
  Clock
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CompanyListProps {
  empresas: EmpresaComStatus[];
}

export function CompanyList({ empresas }: CompanyListProps) {
  const router = useRouter();
  const [loadingOwner, setLoadingOwner] = useState<string | null>(null);

  async function handleToggleStatus(owner: string) {
    setLoadingOwner(owner);
    await toggleCompanyStatus(owner);
    router.refresh();
    setLoadingOwner(null);
  }

  async function handleDelete(owner: string) {
    if (!confirm("Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita.")) {
      return;
    }
    setLoadingOwner(owner);
    await deleteCompany(owner);
    router.refresh();
    setLoadingOwner(null);
  }

  if (empresas.length === 0) {
    return (
      <Card className="bg-[#0b0d11] border-gray-800 p-12 text-center">
        <p className="text-gray-500">Nenhuma empresa cadastrada ainda.</p>
        <Link href="/admin/empresas/nova">
          <Button className="mt-4 bg-green-600 hover:bg-green-700">
            Cadastrar primeira empresa
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="bg-[#0b0d11] border border-gray-800 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-[#13161c] text-gray-500 text-[10px] uppercase tracking-wider border-b border-gray-800 font-bold">
            <th className="p-4 text-left">Empresa</th>
            <th className="p-4 text-left">WhatsApp</th>
            <th className="p-4 text-left">Nicho</th>
            <th className="p-4 text-center">Conexão</th>
            <th className="p-4 text-center">Status</th>
            <th className="p-4 text-center">IA Config</th>
            <th className="p-4 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {empresas.map((empresa) => (
            <tr
              key={empresa.owner}
              className="border-b border-gray-800 hover:bg-[#13161c] transition-colors"
            >
              {/* Empresa + WhatsApp Profile */}
              <td className="p-4">
                <div className="flex items-center gap-3">
                  {/* Foto do WhatsApp (Avatar) */}
                  <div className="relative">
                    <Avatar className="h-10 w-10 border border-gray-700">
                      <AvatarImage src={empresa.whatsapp_profile_pic || ""} />
                      <AvatarFallback className="bg-[#1c2128] text-gray-400 font-bold">
                        {empresa.nome_empresa.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0b0d11] ${empresa.whatsapp_conectado ? 'bg-green-500' : 'bg-red-500'}`} />
                  </div>
                  
                  <div>
                    <p className="font-bold text-white text-sm">{empresa.nome_empresa}</p>
                    {/* Nome do perfil WhatsApp */}
                    {empresa.whatsapp_profile_name ? (
                      <div className="flex items-center gap-1 text-[11px] text-green-400/80">
                        <Smartphone className="h-3 w-3" />
                        <span>{empresa.whatsapp_profile_name}</span>
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-600 italic">Sem perfil identificado</p>
                    )}
                  </div>
                </div>
              </td>

              {/* WhatsApp Number & Status Info */}
              <td className="p-4">
                <div className="flex flex-col gap-1">
                  <code className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded w-fit">
                    {empresa.owner}
                  </code>
                  {!empresa.whatsapp_conectado && empresa.whatsapp_last_disconnect && (
                    <div className="flex items-center gap-1 text-[10px] text-red-400/70" title="Última desconexão">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(empresa.whatsapp_last_disconnect).toLocaleDateString()} {new Date(empresa.whatsapp_last_disconnect).toLocaleTimeString().slice(0, 5)}
                      </span>
                    </div>
                  )}
                </div>
              </td>

              {/* Nicho */}
              <td className="p-4">
                <span className="text-sm text-gray-400">
                  {empresa.nicho || "—"}
                </span>
              </td>

              {/* Conexão WhatsApp */}
              <td className="p-4 text-center">
                {empresa.whatsapp_conectado ? (
                  <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200">
                    <Wifi className="h-3 w-3 mr-1" />
                    Online
                  </Badge>
                ) : (
                  <Badge className="bg-rose-100 text-rose-700 border border-rose-200 hover:bg-rose-200">
                    <WifiOff className="h-3 w-3 mr-1" />
                    Offline
                  </Badge>
                )}
              </td>

              {/* Status Ativo */}
              <td className="p-4 text-center">
                {empresa.ativo ? (
                  <Badge className="bg-indigo-100 text-indigo-700 border border-indigo-200 hover:bg-indigo-200">
                    <Power className="h-3 w-3 mr-1" />
                    Ativo
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200">
                    <PowerOff className="h-3 w-3 mr-1" />
                    Inativo
                  </Badge>
                )}
              </td>

              {/* IA Config */}
              <td className="p-4 text-center">
                {empresa.instrucoes_ia ? (
                  <Badge className="bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200">
                    <Bot className="h-3 w-3 mr-1" />
                    Configurado
                  </Badge>
                ) : (
                  <span className="text-xs text-gray-400">Padrão</span>
                )}
              </td>

              {/* Ações */}
              <td className="p-4 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      disabled={loadingOwner === empresa.owner}
                    >
                      <MoreVertical className="h-4 w-4 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#1c2128] border-gray-700">
                    <Link href={`/admin/empresas/${empresa.owner}`}>
                      <DropdownMenuItem className="cursor-pointer">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => handleToggleStatus(empresa.owner)}
                    >
                      {empresa.ativo ? (
                        <>
                          <PowerOff className="h-4 w-4 mr-2" />
                          Desativar
                        </>
                      ) : (
                        <>
                          <Power className="h-4 w-4 mr-2" />
                          Ativar
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-700" />
                    <DropdownMenuItem
                      className="cursor-pointer text-red-400 focus:text-red-400"
                      onClick={() => handleDelete(empresa.owner)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
