"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveCompany, Empresa } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Bot } from "lucide-react";
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
      router.push("/admin/empresas");
      router.refresh();
    } else {
      setError(result.error || "Erro ao salvar empresa");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <Card className="bg-[#0b0d11] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">Dados da Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Owner (WhatsApp) */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 uppercase font-bold">
              WhatsApp (Owner) *
            </label>
            <Input
              name="owner"
              value={formData.owner}
              onChange={handleChange}
              placeholder="5511999999999"
              className="bg-[#161b22] border-gray-700 text-white"
              required
              disabled={isEditing}
            />
            <p className="text-xs text-gray-600 mt-1">
              Número sem + e sem espaços (ex: 5511999999999)
            </p>
          </div>

          {/* Nome da Empresa */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 uppercase font-bold">
              Nome da Empresa *
            </label>
            <Input
              name="nome_empresa"
              value={formData.nome_empresa}
              onChange={handleChange}
              placeholder="Academia Xtreme Fitness"
              className="bg-[#161b22] border-gray-700 text-white"
              required
            />
          </div>

          {/* Nicho */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 uppercase font-bold">
              Nicho
            </label>
            <Input
              name="nicho"
              value={formData.nicho}
              onChange={handleChange}
              placeholder="Academia, Clínica de Estética, ..."
              className="bg-[#161b22] border-gray-700 text-white"
            />
          </div>

          {/* Objetivo de Conversão */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 uppercase font-bold">
              Objetivo de Conversão
            </label>
            <Input
              name="objetivo_conversao"
              value={formData.objetivo_conversao}
              onChange={handleChange}
              placeholder="Agendar aula experimental"
              className="bg-[#161b22] border-gray-700 text-white"
            />
            <p className="text-xs text-gray-600 mt-1">
              O que a IA deve considerar como &quot;sucesso&quot;
            </p>
          </div>

          {/* Token UazAPI */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 uppercase font-bold">
              Token UazAPI (WhatsApp)
            </label>
            <Input
              name="instance_token"
              value={formData.instance_token}
              onChange={handleChange}
              placeholder="Token da instância no UazAPI"
              className="bg-[#161b22] border-gray-700 text-white font-mono text-sm"
            />
            <p className="text-xs text-gray-600 mt-1">
              Token gerado pelo UazAPI para verificar status da conexão. Deixe vazio se não usar.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Instruções IA */}
      <Card className="bg-[#0b0d11] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Bot className="h-5 w-5 text-purple-400" />
            Instruções Personalizadas para IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label htmlFor="instrucoes_ia" className="text-white">
              Instruções Customizadas da IA
            </label>
            <Textarea
              id="instrucoes_ia"
              name="instrucoes_ia"
              value={formData.instrucoes_ia}
              onChange={handleChange}
              placeholder={`Ex: "Esta é uma clínica de estética. Foque sempre em agendar avaliação gratuita. Se o cliente perguntar preço, não fale, peça para agendar. Seja rigoroso com o script de vendas."`}
              className="bg-[#161b22] border-gray-700 text-white min-h-[150px]"
            />
            <p className="text-xs text-gray-600 mt-2">
               Essas instruções serão injetadas no prompt da IA ao analisar as conversas desta empresa.
               Deixe em branco para usar o comportamento padrão.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Erros */}
      {error && (
        <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Botões */}
      <div className="flex items-center justify-between">
        <Link href="/admin/empresas">
          <Button type="button" variant="ghost" className="text-gray-400">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Salvando..." : isEditing ? "Atualizar" : "Criar Empresa"}
        </Button>
      </div>
    </form>
  );
}
