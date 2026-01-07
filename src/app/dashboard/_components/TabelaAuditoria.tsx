"use client";

import { useState } from "react";
import { AnaliseConversa } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DetalheLead } from "./DetalheLead";
import { ChevronDown, Search } from "lucide-react";

interface TabelaAuditoriaProps {
  analises: AnaliseConversa[];
}

export function TabelaAuditoria({ analises }: TabelaAuditoriaProps) {
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("ALL");
  const [filtroFunil, setFiltroFunil] = useState<string>("ALL");
  const [analiseSelecionada, setAnaliseSelecionada] = useState<AnaliseConversa | null>(null);

  // Filtro das análises
  const analisesFiltradas = analises.filter((a) => {
    const nome = a.resultado_ia?.dados_cadastrais?.nome_lead?.toLowerCase() || "";
    const chatid = a.chatid?.toLowerCase() || "";
    const matchBusca =
      busca === "" || nome.includes(busca.toLowerCase()) || chatid.includes(busca.toLowerCase());

    const tipo = a.resultado_ia?.tipo_conversacao || "";
    const matchTipo = filtroTipo === "ALL" || tipo === filtroTipo;

    const funil = a.resultado_ia?.funil_fase?.toLowerCase() || "";
    let matchFunil = filtroFunil === "ALL";
    if (filtroFunil === "SUCESSO") {
      matchFunil = funil.includes("vendido") || funil.includes("agendado") || funil.includes("matriculado");
    } else if (filtroFunil === "NEGOCIACAO") {
      matchFunil = funil.includes("negociação") || funil.includes("negociacao");
    } else if (filtroFunil === "PERDIDO") {
      matchFunil = funil.includes("perdido");
    }

    return matchBusca && matchTipo && matchFunil;
  });

  return (
    <>
      <Card className="bg-[#0b0d11] border-gray-800">
        <CardHeader className="border-b border-gray-800 bg-[#0e1116] pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-sm font-bold text-white">
              Registros de Atendimento
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="bg-[#1c2128] text-xs text-gray-300 border border-gray-700 rounded px-3 py-1.5 focus:border-green-600 focus:outline-none cursor-pointer hover:bg-[#252b36]"
              >
                <option value="ALL">Todos Tipos</option>
                <option value="Vendas">Vendas</option>
                <option value="Suporte">Suporte</option>
              </select>
              <select
                value={filtroFunil}
                onChange={(e) => setFiltroFunil(e.target.value)}
                className="bg-[#1c2128] text-xs text-gray-300 border border-gray-700 rounded px-3 py-1.5 focus:border-green-600 focus:outline-none cursor-pointer hover:bg-[#252b36]"
              >
                <option value="ALL">Todas Fases</option>
                <option value="SUCESSO">Sucesso</option>
                <option value="NEGOCIACAO">Negociação</option>
                <option value="PERDIDO">Perdidos</option>
              </select>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500" />
                <Input
                  placeholder="Buscar..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="bg-[#050505] border-gray-700 text-gray-300 pl-8 w-48 h-8 text-xs"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#13161c] text-gray-500 text-[10px] uppercase tracking-wider border-b border-gray-800 font-bold">
                  <th className="p-4">Lead / Origem</th>
                  <th className="p-4">Data</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Temp.</th>
                  <th className="p-4">Score</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {analisesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-600 text-xs">
                      Nenhum registro encontrado
                    </td>
                  </tr>
                ) : (
                  analisesFiltradas.map((analise) => (
                    <LinhaTabela
                      key={analise.id}
                      analise={analise}
                      onClick={() => setAnaliseSelecionada(analise)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {analiseSelecionada && (
        <DetalheLead
          analise={analiseSelecionada}
          open={!!analiseSelecionada}
          onClose={() => setAnaliseSelecionada(null)}
        />
      )}
    </>
  );
}

function LinhaTabela({
  analise,
  onClick,
}: {
  analise: AnaliseConversa;
  onClick: () => void;
}) {
  const resultado = analise.resultado_ia;
  const nome = resultado?.dados_cadastrais?.nome_lead || "Não identificado";
  const origem = resultado?.dados_cadastrais?.origem_detectada || "Orgânico";
  const tipo = resultado?.tipo_conversacao || "Vendas";
  const funil = resultado?.funil_fase || "Pendente";
  const temp = resultado?.temperatura || "Frio";
  const score = resultado?.nota_atendimento_0_100 || 0;

  const data = new Date(analise.created_at).toLocaleDateString("pt-BR");
  const iniciais = nome.substring(0, 2).toUpperCase();

  // Formata telefone
  const formatPhone = (chatid: string) => {
    const nums = chatid.replace(/\D/g, "").replace(/^55/, "");
    if (nums.length === 11) {
      return `(${nums.substring(0, 2)}) ${nums.substring(2, 7)}-${nums.substring(7)}`;
    }
    return nums;
  };

  return (
    <tr
      className="group border-b border-gray-800 hover:bg-[#13161c] transition-colors cursor-pointer"
      onClick={onClick}
    >
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1c2128] border border-gray-700 flex items-center justify-center text-xs font-bold text-gray-400 group-hover:border-green-600/50 group-hover:text-white transition">
            {iniciais}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-200 text-sm group-hover:text-white transition">
                {nome}
              </span>
              <TipoBadge tipo={tipo} />
            </div>
            <div className="text-xs text-gray-500 font-mono mt-0.5 flex items-center gap-2">
              <span>{formatPhone(analise.chatid)}</span>
              <span>•</span>
              <OrigemBadge origem={origem} />
            </div>
          </div>
        </div>
      </td>
      <td className="p-4 text-gray-500 text-xs font-mono">{data}</td>
      <td className="p-4">
        <StatusBadge funil={funil} tipo={tipo} />
      </td>
      <td className="p-4">
        <TemperaturaWidget temp={temp} />
      </td>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <Progress
            value={score}
            className="w-16 h-1"
          />
          <span className="font-bold text-sm text-white">{score}</span>
        </div>
      </td>
      <td className="p-4 text-right">
        <ChevronDown className="h-4 w-4 text-gray-600 group-hover:text-white transition" />
      </td>
    </tr>
  );
}

function TipoBadge({ tipo }: { tipo: string }) {
  if (tipo === "Suporte") {
    return (
      <Badge variant="outline" className="text-[9px] bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
        🛠 SUPORTE
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[9px] bg-emerald-500/20 text-emerald-400 border-emerald-800">
      💲 VENDAS
    </Badge>
  );
}

function OrigemBadge({ origem }: { origem: string }) {
  const o = origem.toLowerCase();
  if (o.includes("meta") || o.includes("insta") || o.includes("face")) {
    return <span className="text-[9px] font-bold text-blue-400 border border-blue-900 bg-blue-900/20 px-1.5 rounded">META</span>;
  }
  if (o.includes("google")) {
    return <span className="text-[9px] font-bold text-orange-400 border border-orange-900 bg-orange-900/20 px-1.5 rounded">GOOGLE</span>;
  }
  if (o.includes("indica")) {
    return <span className="text-[9px] font-bold text-purple-400 border border-purple-900 bg-purple-900/20 px-1.5 rounded">INDICAÇÃO</span>;
  }
  return <span className="text-[9px] font-bold text-gray-500 border border-gray-700 bg-gray-800 px-1.5 rounded">ORGÂNICO</span>;
}

function StatusBadge({ funil, tipo }: { funil: string; tipo: string }) {
  const f = funil.toLowerCase();
  const t = tipo.toLowerCase();

  if (t.includes("suporte")) {
    if (f.includes("resolvido")) {
      return <Badge className="bg-blue-900/40 text-blue-300 border-blue-800">RESOLVIDO</Badge>;
    }
    return <Badge className="bg-gray-700 text-gray-300 border-gray-600">EM ABERTO</Badge>;
  }

  if (f.includes("vendido") || f.includes("matriculado")) {
    return <Badge className="bg-green-600 text-white shadow-lg shadow-green-900/50">MATRICULADO</Badge>;
  }
  if (f.includes("agendado")) {
    return <Badge className="bg-blue-500 text-white shadow-lg shadow-blue-900/50">AGENDADO</Badge>;
  }
  if (f.includes("negociação") || f.includes("negociacao")) {
    return <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30">NEGOCIAÇÃO</Badge>;
  }
  if (f.includes("perdido")) {
    return <Badge className="bg-red-600/20 text-red-400 border-red-600/30">PERDIDO</Badge>;
  }
  return <Badge className="bg-gray-800 text-gray-400 border-gray-700">PENDENTE</Badge>;
}

function TemperaturaWidget({ temp }: { temp: string }) {
  const t = temp.toLowerCase();
  if (t.includes("quente")) {
    return (
      <div className="flex gap-0.5 items-end h-3">
        <div className="w-1 h-1.5 bg-red-500 rounded-sm" />
        <div className="w-1 h-2 bg-red-500 rounded-sm" />
        <div className="w-1 h-3 bg-red-500 rounded-sm" />
        <span className="ml-1 text-[9px] font-bold text-red-400">ALTA</span>
      </div>
    );
  }
  if (t.includes("morno")) {
    return (
      <div className="flex gap-0.5 items-end h-3">
        <div className="w-1 h-1.5 bg-yellow-500 rounded-sm" />
        <div className="w-1 h-2 bg-yellow-500 rounded-sm" />
        <div className="w-1 h-3 bg-gray-700 rounded-sm" />
        <span className="ml-1 text-[9px] font-bold text-yellow-400">MÉDIA</span>
      </div>
    );
  }
  return (
    <div className="flex gap-0.5 items-end h-3">
      <div className="w-1 h-1.5 bg-blue-500 rounded-sm" />
      <div className="w-1 h-2 bg-gray-700 rounded-sm" />
      <div className="w-1 h-3 bg-gray-700 rounded-sm" />
      <span className="ml-1 text-[9px] font-bold text-blue-400">BAIXA</span>
    </div>
  );
}
