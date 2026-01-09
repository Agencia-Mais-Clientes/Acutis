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
  Clock,
  Building2,
  Plus
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
      <Card className="bg-white border border-gray-100 shadow-lg p-12 text-center rounded-2xl">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
          <Building2 className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-500 mb-4">Nenhuma empresa cadastrada ainda.</p>
        <Link href="/admin/empresas/nova">
          <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            Cadastrar primeira empresa
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-lg">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-wider border-b border-gray-100 font-bold">
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
              className="border-b border-gray-50 hover:bg-gradient-to-r hover:from-violet-50/50 hover:to-blue-50/50 transition-all duration-200"
            >
              {/* Empresa + WhatsApp Profile */}
              <td className="p-4">
                <div className="flex items-center gap-3">
                  {/* Avatar with connection dot */}
                  <div className="relative">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                      <AvatarImage src={empresa.whatsapp_profile_pic || ""} />
                      <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-bold">
                        {empresa.nome_empresa.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ${empresa.whatsapp_conectado ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  </div>
                  
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{empresa.nome_empresa}</p>
                    {empresa.whatsapp_profile_name ? (
                      <div className="flex items-center gap-1 text-[11px] text-emerald-600">
                        <Smartphone className="h-3 w-3" />
                        <span>{empresa.whatsapp_profile_name}</span>
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-400 italic">Sem perfil identificado</p>
                    )}
                  </div>
                </div>
              </td>

              {/* WhatsApp Number & Status Info */}
              <td className="p-4">
                <div className="flex flex-col gap-1">
                  <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-md w-fit font-medium">
                    {empresa.owner}
                  </code>
                  {!empresa.whatsapp_conectado && empresa.whatsapp_last_disconnect && (
                    <div className="flex items-center gap-1 text-[10px] text-rose-500" title="Última desconexão">
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
                <span className="text-sm text-gray-600">
                  {empresa.nicho || "—"}
                </span>
              </td>

              {/* Conexão WhatsApp */}
              <td className="p-4 text-center">
                {empresa.whatsapp_conectado ? (
                  <Badge className="bg-emerald-100 text-emerald-700 border-0 hover:bg-emerald-200 font-semibold">
                    <Wifi className="h-3 w-3 mr-1" />
                    Online
                  </Badge>
                ) : (
                  <Badge className="bg-rose-100 text-rose-700 border-0 hover:bg-rose-200 font-semibold">
                    <WifiOff className="h-3 w-3 mr-1" />
                    Offline
                  </Badge>
                )}
              </td>

              {/* Status Ativo */}
              <td className="p-4 text-center">
                {empresa.ativo ? (
                  <Badge className="bg-violet-100 text-violet-700 border-0 hover:bg-violet-200 font-semibold">
                    <Power className="h-3 w-3 mr-1" />
                    Ativo
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-500 border-0 hover:bg-gray-200 font-semibold">
                    <PowerOff className="h-3 w-3 mr-1" />
                    Inativo
                  </Badge>
                )}
              </td>

              {/* IA Config */}
              <td className="p-4 text-center">
                {empresa.instrucoes_ia ? (
                  <Badge className="bg-indigo-100 text-indigo-700 border-0 hover:bg-indigo-200 font-semibold">
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
                      className="h-8 w-8 p-0 rounded-full hover:bg-violet-100"
                      disabled={loadingOwner === empresa.owner}
                    >
                      <MoreVertical className="h-4 w-4 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white border-gray-200 shadow-xl rounded-xl">
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
                    <DropdownMenuSeparator className="bg-gray-100" />
                    <DropdownMenuItem
                      className="cursor-pointer text-red-500 focus:text-red-500"
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
