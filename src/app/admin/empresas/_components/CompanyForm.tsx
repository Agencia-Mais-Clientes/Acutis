"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveCompany, Empresa } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Bot, Building2, Phone, Target, Key, Sparkles, Sheet, Megaphone, Users, Calendar, UserCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { BusinessHoursEditor } from "./BusinessHoursEditor";
import type { HorarioFuncionamento } from "@/lib/analyze-types";
import { HORARIO_FUNCIONAMENTO_DEFAULT } from "@/lib/analyze-types";

// Templates pré-definidos de instruções por nicho
const TEMPLATES = {
  academia: `# FOCO DE ANÁLISE - ACADEMIA

## Critérios de Avaliação Rigorosos
- Vendedor DEVE perguntar o objetivo do treino (emagrecimento, hipertrofia, qualidade de vida)
- Vendedor DEVE oferecer aula experimental antes de falar preço
- Se cliente perguntar preço, vendedor deve gerar valor ANTES de revelar valores
- Vendedor DEVE apresentar pelo menos 2 opções de plano

## Objeções Importantes
- "Não tenho tempo" - CRÍTICO, sempre sinalizar se não tratada
- "É caro" - Deve oferecer parcelamento ou planos alternativos
- "Vou pensar" - Deve criar urgência (vagas limitadas, promoção)

## Sinais de Lead Quente
- Menciona que já treinou antes
- Pergunta sobre horários específicos
- Menciona evento próximo (casamento, viagem)`,

  clinica: `# FOCO DE ANÁLISE - CLÍNICA DE ESTÉTICA

## Critérios de Avaliação
- SEMPRE agendar avaliação gratuita antes de falar preço
- Nunca dar valores por WhatsApp - objetivo é trazer para a clínica
- Perguntar qual procedimento tem interesse e o que espera resolver
- Usar técnica de escassez (poucas vagas, agenda lotada)

## Objeções Importantes
- Preço - NUNCA revelar, apenas na avaliação
- "Preciso consultar alguém" - Oferecer avaliação para a pessoa também
- "Vou pesquisar" - Destacar diferenciais e garantia de resultado

## Cliente Quente
- Menciona evento próximo
- Já fez procedimentos antes
- Indica urgência no problema`,

  imobiliaria: `# FOCO DE ANÁLISE - IMOBILIÁRIA

## Critérios de Avaliação
- Qualificar o lead: tipo de imóvel, região, faixa de valor, prazo
- Agendar visita presencial como objetivo principal
- Apresentar opções compatíveis com o perfil
- Entender situação atual (aluguel, casa própria, financiamento)

## Objeções Importantes
- "Está caro" - Apresentar opções na faixa, falar de valorização
- "Só estou pesquisando" - Entender prazo real e manter contato
- Financiamento - Encaminhar para simulação gratuita

## Lead Quente
- Tem urgência definida (casamento, mudança de cidade)
- Já tem entrada/FGTS
- Sabe exatamente o que quer`,

  odonto: `# FOCO DE ANÁLISE - CLÍNICA ODONTOLÓGICA

## Critérios de Avaliação
- Entender a queixa/dor principal do paciente
- Agendar avaliação como objetivo principal
- Destacar tecnologia e estrutura da clínica
- Mencionar formas de pagamento flexíveis

## Objeções Importantes
- Medo de dentista - Tranquilizar, falar de sedação e ambiente acolhedor
- Preço - Só na avaliação, parcelamento disponível
- "Não tenho tempo" - Horários flexíveis, urgência do tratamento

## Paciente Quente
- Dor ou desconforto atual
- Indicação de amigo/familiar
- Evento próximo (casamento, entrevista)`
};

interface CompanyFormProps {
  empresa?: Empresa | null;
  managers?: { id: string; email: string; name?: string }[];
}

export function CompanyForm({ empresa, managers = [] }: CompanyFormProps) {
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
    meta_ads_id: empresa?.meta_ads_id || "",
    google_ads_id: empresa?.google_ads_id || "",
    whatsapp_group_id: empresa?.whatsapp_group_id || "",
    dia_relatorio: empresa?.dia_relatorio?.toString() || "",
    gestor_responsavel: empresa?.gestor_responsavel || "",
  });

  // Estado para horário de funcionamento (separado para facilitar tipagem)
  const [horarioFuncionamento, setHorarioFuncionamento] = useState<HorarioFuncionamento>(
    (empresa?.horario_funcionamento as HorarioFuncionamento) || HORARIO_FUNCIONAMENTO_DEFAULT
  );
  const [timezone, setTimezone] = useState(empresa?.timezone || "America/Sao_Paulo");

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

    const result = await saveCompany({
      ...formData,
      horario_funcionamento: horarioFuncionamento,
      timezone,
      dia_relatorio: formData.dia_relatorio ? parseInt(formData.dia_relatorio) : null,
      gestor_responsavel: formData.gestor_responsavel === "none" ? null : formData.gestor_responsavel,
    });

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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto pb-24">
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

          {/* Configurações de Gestão */}
          <div className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Dia de Relatório */}
            <div>
              <label className="flex items-center gap-2 text-xs text-gray-500 mb-2 uppercase font-bold">
                <Calendar className="h-3.5 w-3.5" />
                Dia de Envio do Relatório
              </label>
              <Select 
                value={formData.dia_relatorio} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, dia_relatorio: value }))}
              >
                <SelectTrigger className="bg-gray-50 border-gray-200 text-gray-900 focus:ring-violet-500">
                  <SelectValue placeholder="Selecione o dia..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Segunda-feira</SelectItem>
                  <SelectItem value="2">Terça-feira</SelectItem>
                  <SelectItem value="3">Quarta-feira</SelectItem>
                  <SelectItem value="4">Quinta-feira</SelectItem>
                  <SelectItem value="5">Sexta-feira</SelectItem>
                  <SelectItem value="6">Sábado</SelectItem>
                  <SelectItem value="7">Domingo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Gestor Responsável */}
            <div>
              <label className="flex items-center gap-2 text-xs text-gray-500 mb-2 uppercase font-bold">
                <UserCircle className="h-3.5 w-3.5" />
                Gestor Responsável
              </label>
              <Select 
                value={formData.gestor_responsavel} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, gestor_responsavel: value }))}
              >
                <SelectTrigger className="bg-gray-50 border-gray-200 text-gray-900 focus:ring-violet-500">
                  <SelectValue placeholder="Selecione o gestor..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem gestor</SelectItem>
                  {managers.map(manager => (
                    <SelectItem key={manager.id} value={manager.name || manager.email}>
                      {manager.name || manager.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-gray-100">
            {/* Gestor Responsável */}
            <div>
              <label className="flex items-center gap-2 text-xs text-gray-500 mb-2 uppercase font-bold">
                <UserCircle className="h-3.5 w-3.5" />
                Gestor Responsável
              </label>
              <Input
                name="gestor_responsavel"
                value={formData.gestor_responsavel}
                onChange={handleChange}
                placeholder="Nome do gestor da conta"
                className="bg-gray-50 border-gray-200 text-gray-900 focus:border-violet-500 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Ads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-gray-100">
            {/* ID Meta Ads */}
            <div>
              <label className="flex items-center gap-2 text-xs text-gray-500 mb-2 uppercase font-bold">
                <Megaphone className="h-3.5 w-3.5" />
                ID Meta Ads
              </label>
              <Input
                name="meta_ads_id"
                value={formData.meta_ads_id}
                onChange={handleChange}
                placeholder="act_123456789"
                className="bg-gray-50 border-gray-200 text-gray-900 font-mono text-sm focus:border-violet-500 focus:ring-violet-500"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                ID da conta de anúncios do Meta (Facebook/Instagram)
              </p>
            </div>

            {/* ID Google Ads */}
            <div>
              <label className="flex items-center gap-2 text-xs text-gray-500 mb-2 uppercase font-bold">
                <Megaphone className="h-3.5 w-3.5" />
                ID Google Ads
              </label>
              <Input
                name="google_ads_id"
                value={formData.google_ads_id}
                onChange={handleChange}
                placeholder="123-456-7890"
                className="bg-gray-50 border-gray-200 text-gray-900 font-mono text-sm focus:border-violet-500 focus:ring-violet-500"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                ID da conta de anúncios do Google Ads
              </p>
            </div>
          </div>

          {/* Grupo WhatsApp */}
          <div className="pt-4 border-t border-gray-100">
            <label className="flex items-center gap-2 text-xs text-gray-500 mb-2 uppercase font-bold">
              <Users className="h-3.5 w-3.5" />
              ID do Grupo WhatsApp
            </label>
            <Input
              name="whatsapp_group_id"
              value={formData.whatsapp_group_id}
              onChange={handleChange}
              placeholder="120363123456789012@g.us"
              className="bg-gray-50 border-gray-200 text-gray-900 font-mono text-sm focus:border-violet-500 focus:ring-violet-500"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              ID do grupo do WhatsApp para notificações (formato: 120363...@g.us)
            </p>
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
        <CardContent className="p-6 space-y-4">
          {/* Templates Pré-definidos */}
          <div>
            <label className="block text-xs text-gray-500 mb-2 uppercase font-bold">
              📋 Templates por Nicho (clique para aplicar)
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                onClick={() => setFormData(prev => ({ ...prev, instrucoes_ia: TEMPLATES.academia }))}
              >
                💪 Academia
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100"
                onClick={() => setFormData(prev => ({ ...prev, instrucoes_ia: TEMPLATES.clinica }))}
              >
                💆 Clínica Estética
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                onClick={() => setFormData(prev => ({ ...prev, instrucoes_ia: TEMPLATES.imobiliaria }))}
              >
                🏠 Imobiliária
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                onClick={() => setFormData(prev => ({ ...prev, instrucoes_ia: TEMPLATES.odonto }))}
              >
                🦷 Odontologia
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-gray-500 hover:text-red-600"
                onClick={() => setFormData(prev => ({ ...prev, instrucoes_ia: "" }))}
              >
                🗑️ Limpar
              </Button>
            </div>
          </div>

          {/* Textarea */}
          <div className="space-y-2">
            <label htmlFor="instrucoes_ia" className="text-sm font-medium text-gray-700">
              Instruções Customizadas
            </label>
            <Textarea
              id="instrucoes_ia"
              name="instrucoes_ia"
              value={formData.instrucoes_ia}
              onChange={handleChange}
              placeholder="Escreva instruções específicas para a IA analisar as conversas desta empresa..."
              className="bg-gray-50 border-gray-200 text-gray-900 min-h-[180px] focus:border-violet-500 focus:ring-violet-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-400">
              💡 Estas instruções são injetadas no prompt da IA. Use para definir critérios específicos de avaliação,
              scripts de venda esperados, objeções importantes no seu nicho, etc.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Horário de Funcionamento */}
      <BusinessHoursEditor
        value={horarioFuncionamento}
        onChange={setHorarioFuncionamento}
        timezone={timezone}
        onTimezoneChange={setTimezone}
      />

      {/* Erros */}
      {error && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2">
          <span className="font-medium">Erro:</span> {error}
        </div>
      )}

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg z-40">
        <div className="container mx-auto px-4 sm:px-6 py-4 max-w-4xl">
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
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
        </div>
      </div>
    </form>
  );
}
