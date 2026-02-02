"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createGestor, updateGestor, GestorComEmpresas, UserRole } from "../actions";
import { getCompanies, Empresa } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, User, Mail, Lock, Shield, Building2, Loader2, Phone } from "lucide-react";
import Link from "next/link";

interface GestorFormProps {
  gestor?: GestorComEmpresas | null;
  empresas?: Empresa[];
}

export function GestorForm({ gestor, empresas: initialEmpresas }: GestorFormProps) {
  const router = useRouter();
  const isEditing = !!gestor;

  const [empresas, setEmpresas] = useState<Empresa[]>(initialEmpresas || []);
  const [loadingEmpresas, setLoadingEmpresas] = useState(!initialEmpresas);

  const [formData, setFormData] = useState({
    nome: gestor?.nome || "",
    email: gestor?.email || "",
    telefone: gestor?.telefone || "",
    senha: "",
    role: (gestor?.role || "gestor") as UserRole,
  });

  const [empresasSelecionadas, setEmpresasSelecionadas] = useState<string[]>(
    gestor?.empresas.map(e => e.owner) || []
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Carrega empresas se não foram passadas
  useEffect(() => {
    if (!initialEmpresas) {
      getCompanies().then(data => {
        setEmpresas(data);
        setLoadingEmpresas(false);
      });
    }
  }, [initialEmpresas]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  function handleEmpresaToggle(owner: string) {
    setEmpresasSelecionadas(prev => 
      prev.includes(owner) 
        ? prev.filter(o => o !== owner)
        : [...prev, owner]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isEditing) {
        const result = await updateGestor(gestor.id, {
          nome: formData.nome,
          telefone: formData.telefone || null,
          role: formData.role,
          empresas: empresasSelecionadas,
        });

        if (result.success) {
          toast.success("Gestor atualizado com sucesso!");
          router.push("/admin/gestores");
          router.refresh();
        } else {
          setError(result.error || "Erro ao atualizar gestor");
          toast.error(result.error || "Erro ao atualizar gestor");
        }
      } else {
        if (!formData.senha || formData.senha.length < 6) {
          setError("A senha deve ter pelo menos 6 caracteres");
          setLoading(false);
          return;
        }

        const result = await createGestor({
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone || undefined,
          senha: formData.senha,
          role: formData.role,
          empresas: empresasSelecionadas,
        });

        if (result.success) {
          toast.success("Gestor criado com sucesso!");
          router.push("/admin/gestores");
          router.refresh();
        } else {
          setError(result.error || "Erro ao criar gestor");
          toast.error(result.error || "Erro ao criar gestor");
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro inesperado";
      setError(message);
      toast.error(message);
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto pb-24">
      {/* Dados do Gestor */}
      <Card className="bg-white border border-gray-100 shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-gray-50 border-b border-gray-100 px-6 py-4">
          <CardTitle className="text-gray-900 text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-emerald-600" />
            Dados do Gestor
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          {/* Nome */}
          <div>
            <label className="flex items-center gap-2 text-xs text-gray-500 mb-2 uppercase font-bold">
              <User className="h-3.5 w-3.5" />
              Nome Completo *
            </label>
            <Input
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              placeholder="João da Silva"
              className="bg-gray-50 border-gray-200 text-gray-900 focus:border-emerald-500 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center gap-2 text-xs text-gray-500 mb-2 uppercase font-bold">
              <Mail className="h-3.5 w-3.5" />
              Email *
            </label>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="gestor@empresa.com"
              className="bg-gray-50 border-gray-200 text-gray-900 focus:border-emerald-500 focus:ring-emerald-500"
              required
              disabled={isEditing}
            />
            {isEditing && (
              <p className="text-xs text-gray-400 mt-1.5">
                O email não pode ser alterado após a criação
              </p>
            )}
          </div>

          {/* Telefone */}
          <div>
            <label className="flex items-center gap-2 text-xs text-gray-500 mb-2 uppercase font-bold">
              <Phone className="h-3.5 w-3.5" />
              Telefone (WhatsApp)
            </label>
            <Input
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              placeholder="5511999999999"
              className="bg-gray-50 border-gray-200 text-gray-900 focus:border-emerald-500 focus:ring-emerald-500"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Formato: código do país + DDD + número (ex: 5511999999999)
            </p>
          </div>

          {/* Senha (apenas na criação) */}
          {!isEditing && (
            <div>
              <label className="flex items-center gap-2 text-xs text-gray-500 mb-2 uppercase font-bold">
                <Lock className="h-3.5 w-3.5" />
                Senha *
              </label>
              <Input
                name="senha"
                type="password"
                value={formData.senha}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
                className="bg-gray-50 border-gray-200 text-gray-900 focus:border-emerald-500 focus:ring-emerald-500"
                required
                minLength={6}
              />
            </div>
          )}

          {/* Role */}
          <div>
            <label className="flex items-center gap-2 text-xs text-gray-500 mb-2 uppercase font-bold">
              <Shield className="h-3.5 w-3.5" />
              Permissão *
            </label>
            <Select 
              value={formData.role} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as UserRole }))}
            >
              <SelectTrigger className="bg-gray-50 border-gray-200 text-gray-900 focus:ring-emerald-500">
                <SelectValue placeholder="Selecione a permissão..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gestor">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-emerald-600" />
                    <span>Gestor</span>
                    <span className="text-xs text-gray-400 ml-2">Acesso restrito às empresas vinculadas</span>
                  </div>
                </SelectItem>
                <SelectItem value="super_admin">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-violet-600" />
                    <span>Super Admin</span>
                    <span className="text-xs text-gray-400 ml-2">Acesso total ao sistema</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Empresas Vinculadas (apenas para gestores) */}
      {formData.role === "gestor" && (
        <Card className="bg-white border border-gray-100 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 px-6 py-4">
            <CardTitle className="text-gray-900 text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" />
              Empresas Vinculadas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loadingEmpresas ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : empresas.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Nenhuma empresa cadastrada ainda. 
                <Link href="/admin/empresas/nova" className="text-emerald-600 hover:underline ml-1">
                  Criar primeira empresa
                </Link>
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 mb-4">
                  Selecione as empresas que este gestor poderá gerenciar:
                </p>
                <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2">
                  {empresas.map(empresa => (
                    <label 
                      key={empresa.owner}
                      className={`
                        flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                        ${empresasSelecionadas.includes(empresa.owner)
                          ? "bg-emerald-50 border-emerald-300"
                          : "bg-gray-50 border-gray-200 hover:border-gray-300"
                        }
                      `}
                    >
                      <Checkbox
                        checked={empresasSelecionadas.includes(empresa.owner)}
                        onCheckedChange={() => handleEmpresaToggle(empresa.owner)}
                        className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {empresa.nome_empresa}
                        </p>
                        <p className="text-xs text-gray-500">
                          {empresa.nicho || "Sem nicho"} • {empresa.owner}
                        </p>
                      </div>
                      {!empresa.ativo && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                          Inativo
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {empresasSelecionadas.length} empresa{empresasSelecionadas.length !== 1 ? 's' : ''} selecionada{empresasSelecionadas.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Erros */}
      {error && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2">
          <span className="font-medium">Erro:</span> {error}
        </div>
      )}

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg z-40">
        <div className="container mx-auto px-4 sm:px-6 py-4 max-w-2xl">
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
            <Link href="/admin/gestores" className="w-full sm:w-auto">
              <Button type="button" variant="outline" className="w-full sm:w-auto text-gray-600">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? "Atualizar" : "Criar Gestor"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
