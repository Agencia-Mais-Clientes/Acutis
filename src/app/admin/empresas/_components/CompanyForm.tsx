"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveCompany, Empresa } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Bot, Building2, Phone, Target, Key, Sparkles, Sheet } from "lucide-react";
import Link from "next/link";

interface CompanyFormProps {
  empresa?: Empresa | null;
}

export function CompanyForm({ empresa }: CompanyFormProps) {
  const router = useRouter();
  const isEditing = !!empresa;

  const [formData, setFormData] = useState({
    owner: empresa?.owner || "",
    nome_empresa: empresa?.nome_empresa || "",
    nicho: empresa?.nicho || "",
    objetivo_conversao: empresa?.objetivo_conversao || "",
    instrucoes_ia: empresa?.instrucoes_ia || "",
    instance_token: empresa?.instance_token || "",
    spreadsheet_id: empresa?.spreadsheet_id || "",
    sheet_id: empresa?.sheet_id || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await saveCompany(formData);

    if (result.success) {
      toast.success(isEditing ? "Empresa atualizada com sucesso!" : "Empresa criada com sucesso!");
      router.push("/admin/empresas");
      router.refresh();
    } else {
      setError(result.error || "Erro ao salvar empresa");
      toast.error(result.error || "Erro ao salvar empresa");
    }
    setLoading(false);
  }


  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      {/* Dados da Empresa */}
      <Card className="bg-white border border-gray-100 shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-gray-50 border-b border-gray-100 px-6 py-4">
          <CardTitle className="text-gray-900 text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5 text-violet-600" />
            Dados da Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          {/* Grid responsivo de 2 colunas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Owner (WhatsApp) */}
            <div>
              <label className="flex items-center gap-2 text-xs text-gray-500 mb-2 uppercase font-bold">
                <Phone className="h-3.5 w-3.5" />
                WhatsApp (Owner) *
              </label>
              <Input
                name="owner"
                value={formData.owner}
                onChange={handleChange}
                placeholder="5511999999999"
                className="bg-gray-50 border-gray-200 text-gray-900 focus:border-violet-500 focus:ring-violet-500"
                required
                disabled={isEditing}
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Número sem + e sem espaços (ex: 5511999999999)
              </p>
            </div>

            {/* Nome da Empresa */}
            <div>
              <label className="flex items-center gap-2 text-xs text-gray-500 mb-2 uppercase font-bold">
                <Building2 className="h-3.5 w-3.5" />
                Nome da Empresa *
              </label>
              <Input
                name="nome_empresa"
                value={formData.nome_empresa}
                onChange={handleChange}
                placeholder="Academia Xtreme Fitness"
                className="bg-gray-50 border-gray-200 text-gray-900 focus:border-violet-500 focus:ring-violet-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Nicho */}
            <div>
              <label className="flex items-center gap-2 text-xs text-gray-500 mb-2 uppercase font-bold">
                <Sparkles className="h-3.5 w-3.5" />
                Nicho
              </label>
              <Input
                name="nicho"
                value={formData.nicho}
                onChange={handleChange}
                placeholder="Academia, Clínica de Estética, ..."
                className="bg-gray-50 border-gray-200 text-gray-900 focus:border-violet-500 focus:ring-violet-500"
              />
            </div>

            {/* Objetivo de Conversão */}
            <div>
              <label className="flex items-center gap-2 text-xs text-gray-500 mb-2 uppercase font-bold">
                <Target className="h-3.5 w-3.5" />
                Objetivo de Conversão
              </label>
              <Input
                name="objetivo_conversao"
                value={formData.objetivo_conversao}
                onChange={handleChange}
                placeholder="Agendar aula experimental"
                className="bg-gray-50 border-gray-200 text-gray-900 focus:border-violet-500 focus:ring-violet-500"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                O que a IA deve considerar como &quot;sucesso&quot;
              </p>
            </div>
          </div>

          {/* Token UazAPI */}
          <div>
            <label className="flex items-center gap-2 text-xs text-gray-500 mb-2 uppercase font-bold">
              <Key className="h-3.5 w-3.5" />
              Token UazAPI (WhatsApp)
            </label>
            <Input
              name="instance_token"
              value={formData.instance_token}
              onChange={handleChange}
              placeholder="Token da instância no UazAPI"
              className="bg-gray-50 border-gray-200 text-gray-900 font-mono text-sm focus:border-violet-500 focus:ring-violet-500"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Token gerado pelo UazAPI para verificar status da conexão. Deixe vazio se não usar.
            </p>
          </div>

          {/* Planilha Google Sheets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-gray-100">
            {/* ID da Planilha */}
            <div>
              <label className="flex items-center gap-2 text-xs text-gray-500 mb-2 uppercase font-bold">
                <Sheet className="h-3.5 w-3.5" />
                ID da Planilha
              </label>
              <Input
                name="spreadsheet_id"
                value={formData.spreadsheet_id}
                onChange={handleChange}
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                className="bg-gray-50 border-gray-200 text-gray-900 font-mono text-sm focus:border-violet-500 focus:ring-violet-500"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                ID da planilha Google Sheets (parte da URL após /d/)
              </p>
            </div>

            {/* ID da Aba */}
            <div>
              <label className="flex items-center gap-2 text-xs text-gray-500 mb-2 uppercase font-bold">
                <Sheet className="h-3.5 w-3.5" />
                ID da Aba
              </label>
              <Input
                name="sheet_id"
                value={formData.sheet_id}
                onChange={handleChange}
                placeholder="0"
                className="bg-gray-50 border-gray-200 text-gray-900 font-mono text-sm focus:border-violet-500 focus:ring-violet-500"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                ID da aba (gid) na planilha. Geralmente é 0 para a primeira aba.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instruções IA */}
      <Card className="bg-white border border-gray-100 shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-violet-100 px-6 py-4">
          <CardTitle className="text-gray-900 text-lg flex items-center gap-2">
            <Bot className="h-5 w-5 text-violet-600" />
            Instruções Personalizadas para IA
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-2">
            <label htmlFor="instrucoes_ia" className="text-sm font-medium text-gray-700">
              Instruções Customizadas da IA
            </label>
            <Textarea
              id="instrucoes_ia"
              name="instrucoes_ia"
              value={formData.instrucoes_ia}
              onChange={handleChange}
              placeholder={`Ex: "Esta é uma clínica de estética. Foque sempre em agendar avaliação gratuita. Se o cliente perguntar preço, não fale, peça para agendar. Seja rigoroso com o script de vendas."`}
              className="bg-gray-50 border-gray-200 text-gray-900 min-h-[150px] focus:border-violet-500 focus:ring-violet-500"
            />
            <p className="text-xs text-gray-400 mt-2">
               Essas instruções serão injetadas no prompt da IA ao analisar as conversas desta empresa.
               Deixe em branco para usar o comportamento padrão.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Erros */}
      {error && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2">
          <span className="font-medium">Erro:</span> {error}
        </div>
      )}

      {/* Botões */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
        <Link href="/admin/empresas" className="w-full sm:w-auto">
          <Button type="button" variant="outline" className="w-full sm:w-auto text-gray-600">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <Button 
          type="submit" 
          disabled={loading} 
          className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/20"
        >
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Salvando..." : isEditing ? "Atualizar" : "Criar Empresa"}
        </Button>
      </div>
    </form>
  );
}
