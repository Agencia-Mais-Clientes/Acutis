"use client";

import { useState } from "react";
import { GestorComEmpresas, toggleGestorStatus, deleteGestor } from "../actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Power, 
  Shield, 
  User,
  Building2,
  Mail
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface GestorListProps {
  gestores: GestorComEmpresas[];
}

export function GestorList({ gestores }: GestorListProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGestor, setSelectedGestor] = useState<GestorComEmpresas | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleToggleStatus(gestor: GestorComEmpresas) {
    setLoading(gestor.id);
    const result = await toggleGestorStatus(gestor.id);
    if (result.success) {
      toast.success(gestor.ativo ? "Gestor desativado" : "Gestor ativado");
      router.refresh();
    } else {
      toast.error("Erro ao alterar status");
    }
    setLoading(null);
  }

  async function handleDelete() {
    if (!selectedGestor) return;
    
    setLoading(selectedGestor.id);
    const result = await deleteGestor(selectedGestor.id);
    if (result.success) {
      toast.success("Gestor removido com sucesso");
      router.refresh();
    } else {
      toast.error(result.error || "Erro ao remover gestor");
    }
    setLoading(null);
    setDeleteDialogOpen(false);
    setSelectedGestor(null);
  }

  if (gestores.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Nenhum gestor cadastrado
        </h3>
        <p className="text-gray-500 mb-6">
          Adicione gestores para gerenciar as empresas do sistema.
        </p>
        <Link href="/admin/gestores/novo">
          <Button>Adicionar Primeiro Gestor</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">Gestor</TableHead>
              <TableHead className="font-semibold">Role</TableHead>
              <TableHead className="font-semibold">Empresas</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gestores.map((gestor) => (
              <TableRow key={gestor.id} className="hover:bg-gray-50/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${gestor.role === "super_admin" 
                        ? "bg-gradient-to-br from-violet-500 to-indigo-600" 
                        : "bg-gradient-to-br from-emerald-500 to-teal-600"
                      }
                    `}>
                      {gestor.role === "super_admin" ? (
                        <Shield className="h-5 w-5 text-white" />
                      ) : (
                        <User className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{gestor.nome}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {gestor.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={gestor.role === "super_admin" ? "default" : "secondary"}
                    className={
                      gestor.role === "super_admin" 
                        ? "bg-violet-100 text-violet-700 hover:bg-violet-200" 
                        : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    }
                  >
                    {gestor.role === "super_admin" ? "Super Admin" : "Gestor"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {gestor.empresas.length > 0 ? (
                    <div className="flex items-center gap-1 flex-wrap max-w-[200px]">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {gestor.empresas.length} empresa{gestor.empresas.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">
                      {gestor.role === "super_admin" ? "Acesso total" : "Nenhuma"}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={gestor.ativo ? "default" : "secondary"}>
                    {gestor.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        disabled={loading === gestor.id}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/gestores/${gestor.id}`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStatus(gestor)}>
                        <Power className="mr-2 h-4 w-4" />
                        {gestor.ativo ? "Desativar" : "Ativar"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600 focus:text-red-600"
                        onClick={() => {
                          setSelectedGestor(gestor);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Gestor</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o gestor <strong>{selectedGestor?.nome}</strong>? 
              Esta ação não pode ser desfeita e irá remover o acesso ao sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
