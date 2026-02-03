"use client";

import { useState, useMemo } from "react";
import { AnaliseConversa } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DetalheLead } from "./DetalheLead";
import { ChevronDown, Search, X } from "lucide-react";

import { categorizarObjecaoLegado } from "@/lib/objecao-utils";

export interface FiltrosIniciais {
  fase?: string;
  gargalo?: string;
  objecao?: string;
  tipo?: string;
}

interface TabelaAuditoriaProps {
  analises: AnaliseConversa[];
  filtroInicial?: FiltrosIniciais;
}

export function TabelaAuditoria({ analises, filtroInicial }: TabelaAuditoriaProps) {
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>(filtroInicial?.tipo?.toUpperCase() || "ALL");
  const [filtroFunil, setFiltroFunil] = useState<string>(filtroInicial?.fase?.toUpperCase() || "ALL");
  const [filtroGargalo, setFiltroGargalo] = useState<string>(filtroInicial?.gargalo || "ALL");
  const [filtroObjecao, setFiltroObjecao] = useState<string>(filtroInicial?.objecao || "ALL");
  const [filtroOrigem, setFiltroOrigem] = useState<string>("ALL");
  const [filtroTemp, setFiltroTemp] = useState<string>("ALL");
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>("ALL");
  const [analiseSelecionada, setAnaliseSelecionada] = useState<AnaliseConversa | null>(null);

  // Check if any filter is active
  const hasActiveFilters = filtroTipo !== "ALL" || filtroFunil !== "ALL" || filtroGargalo !== "ALL" || filtroObjecao !== "ALL" || filtroOrigem !== "ALL" || filtroTemp !== "ALL" || filtroPeriodo !== "ALL" || busca !== "";

  // Clear all filters
  const clearFilters = () => {
    setBusca("");
    setFiltroTipo("ALL");
    setFiltroFunil("ALL");
    setFiltroGargalo("ALL");
    setFiltroObjecao("ALL");
    setFiltroOrigem("ALL");
    setFiltroTemp("ALL");
    setFiltroPeriodo("ALL");
  };

  // Filtro das análises
  const analisesFiltradas = useMemo(() => {
    return analises.filter((a) => {
      const nome = a.resultado_ia?.dados_cadastrais?.nome_lead?.toLowerCase() || "";
      const chatid = a.chatid?.toLowerCase() || "";
      const matchBusca =
        busca === "" || nome.includes(busca.toLowerCase()) || chatid.includes(busca.toLowerCase());

      const tipo = a.resultado_ia?.tipo_conversacao || "";
      const matchTipo = filtroTipo === "ALL" || tipo === filtroTipo;

      const funil = a.resultado_ia?.funil_fase?.toLowerCase() || "";
      let matchFunil = filtroFunil === "ALL";
      if (filtroFunil === "SUCESSO" || filtroFunil === "CONVERTIDO") {
        matchFunil = funil.includes("vendido") || funil.includes("agendado") || funil.includes("matriculado") || funil.includes("resolvido") || funil.includes("convertido");
      } else if (filtroFunil === "AGENDADO") {
        matchFunil = funil.includes("agendado");
      } else if (filtroFunil === "QUALIFICADO") {
        matchFunil = funil.includes("qualificado") || funil.includes("negociação") || funil.includes("negociacao") || funil.includes("interessado");
      } else if (filtroFunil === "NEGOCIACAO") {
        matchFunil = funil.includes("negociação") || funil.includes("negociacao");
      } else if (filtroFunil === "PERDIDO") {
        matchFunil = funil.includes("perdido") || funil.includes("desistiu") || funil.includes("vácuo") || funil.includes("vacuo");
      }

      // Filtro Gargalo
      let matchGargalo = filtroGargalo === "ALL";
      if (filtroGargalo !== "ALL") {
        const gargalo = filtroGargalo.toLowerCase();
        if (gargalo === "negociacao") {
          matchGargalo = funil.includes("negociação") || funil.includes("negociacao");
        } else if (gargalo === "sem_resposta") {
          matchGargalo = funil.includes("vácuo") || funil.includes("vacuo") || funil.includes("sem resposta");
        } else if (gargalo === "perdido") {
          matchGargalo = funil.includes("perdido");
        } else if (gargalo === "travado") {
          matchGargalo = true; // Todo lead não convertido é tecnicamente travado em algum lugar se não for perdido recente
        }
      }

      // Filtro Objeção - busca pela chave da categoria (ex: "preco", "tempo")
      let matchObjecao = filtroObjecao === "ALL";
      if (filtroObjecao !== "ALL") {
        const objecoes = a.resultado_ia?.objecoes_detectadas || [];
        const termoCategoria = filtroObjecao.toLowerCase();
        
        matchObjecao = objecoes.some(obj => {
          if (!obj) return false;
          // Verifica se é o novo formato (objeto) ou legado (string)
          if (typeof obj === "object" && "categoria" in obj) {
            // Novo formato: match exato pela categoria
            const categoria = (obj.categoria as string).toLowerCase();
            return categoria === termoCategoria;
          } else if (typeof obj === "string") {
            // Formato legado: categoriza o texto usando função centralizada
            const categoriaInferida = categorizarObjecaoLegado(obj);
            return categoriaInferida === termoCategoria;
          }
          return false;
        });
      }

      // Origem filter (usa origem_tracking real, não inferência da IA)
      const origemTracking = a.origem_tracking?.toLowerCase() || null;
      let matchOrigem = filtroOrigem === "ALL";
      if (filtroOrigem === "META") {
        // Meta = Facebook ou Instagram Ads
        matchOrigem = origemTracking === "facebook_ads" || origemTracking === "instagram_ads";
      } else if (filtroOrigem === "GOOGLE") {
        matchOrigem = origemTracking === "google_ads";
      } else if (filtroOrigem === "INDICACAO") {
        // Indicação não é detectada pelo webhook - usa inferência da IA
        const origemIA = a.resultado_ia?.dados_cadastrais?.origem_detectada?.toLowerCase() || "";
        matchOrigem = origemIA.includes("indica");
      } else if (filtroOrigem === "ORGANICO") {
        // Orgânico = não tem tracking OU origem_tracking é 'organico'
        matchOrigem = origemTracking === "organico" || origemTracking === null;
      }

      // Temperatura filter
      const temp = a.resultado_ia?.temperatura?.toLowerCase() || "frio";
      let matchTemp = filtroTemp === "ALL";
      if (filtroTemp === "QUENTE") {
        matchTemp = temp.includes("quente");
      } else if (filtroTemp === "MORNO") {
        matchTemp = temp.includes("morno");
      } else if (filtroTemp === "FRIO") {
        matchTemp = temp.includes("frio");
      }

      // Período filter
      const dataAnalise = new Date(a.created_at);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      let matchPeriodo = filtroPeriodo === "ALL";
      if (filtroPeriodo === "HOJE") {
        matchPeriodo = dataAnalise >= hoje;
      } else if (filtroPeriodo === "7D") {
        const seteDiasAtras = new Date(hoje);
        seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
        matchPeriodo = dataAnalise >= seteDiasAtras;
      } else if (filtroPeriodo === "30D") {
        const trintaDiasAtras = new Date(hoje);
        trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
        matchPeriodo = dataAnalise >= trintaDiasAtras;
      }

      return matchBusca && matchTipo && matchFunil && matchGargalo && matchObjecao && matchOrigem && matchTemp && matchPeriodo;
    });
  }, [analises, busca, filtroTipo, filtroFunil, filtroGargalo, filtroObjecao, filtroOrigem, filtroTemp, filtroPeriodo]);

  return (
    <>
      <Card className="border shadow-none rounded-lg overflow-hidden">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <div className="flex flex-col gap-4">
            {/* Title Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-sm font-semibold text-foreground tracking-tight">
                  Registros de Atendimento
                </CardTitle>
                <Badge variant="outline" className="text-[10px] bg-white border-border font-medium">
                  {analisesFiltradas.length} de {analises.length}
                </Badge>
              </div>
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="text-xs text-muted-foreground hover:text-destructive h-7 px-2"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpar Filtros
                </Button>
              )}
            </div>
            
            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Tipo */}
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="bg-white text-xs border rounded-md px-3 py-1.5 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer hover:bg-muted/50 transition-colors shadow-sm"
              >
                <option value="ALL">Todos Tipos</option>
                <option value="Vendas">💲 Vendas</option>
                <option value="Suporte">🛠 Suporte</option>
              </select>

              {/* Funil */}
              <select
                value={filtroFunil}
                onChange={(e) => setFiltroFunil(e.target.value)}
                className="bg-white text-xs border rounded-md px-3 py-1.5 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer hover:bg-muted/50 transition-colors shadow-sm"
              >
                <option value="ALL">Todas Fases</option>
                <option value="SUCESSO">✅ Sucesso</option>
                <option value="NEGOCIACAO">🔄 Negociação</option>
                <option value="PERDIDO">❌ Perdidos</option>
              </select>

              {/* Origem (Tráfego Pago) */}
              <select
                value={filtroOrigem}
                onChange={(e) => setFiltroOrigem(e.target.value)}
                className={`text-xs border rounded-md px-3 py-1.5 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer transition-colors shadow-sm ${
                  filtroOrigem !== "ALL" 
                    ? "bg-blue-50 border-blue-200 text-blue-700 font-medium" 
                    : "bg-white hover:bg-muted/50"
                }`}
              >
                <option value="ALL">📢 Todas Origens</option>
                <option value="META">📘 Meta Ads</option>
                <option value="GOOGLE">🔍 Google Ads</option>
                <option value="INDICACAO">👥 Indicação</option>
                <option value="ORGANICO">🌱 Orgânico</option>
              </select>

              {/* Temperatura */}
              <select
                value={filtroTemp}
                onChange={(e) => setFiltroTemp(e.target.value)}
                className={`text-xs border rounded-md px-3 py-1.5 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer transition-colors shadow-sm ${
                  filtroTemp !== "ALL" 
                    ? filtroTemp === "QUENTE" ? "bg-red-50 border-red-200 text-red-700 font-medium"
                    : filtroTemp === "MORNO" ? "bg-amber-50 border-amber-200 text-amber-700 font-medium"
                    : "bg-blue-50 border-blue-200 text-blue-700 font-medium"
                    : "bg-white hover:bg-muted/50"
                }`}
              >
                <option value="ALL">🌡️ Temperatura</option>
                <option value="QUENTE">🔥 Quente</option>
                <option value="MORNO">🟡 Morno</option>
                <option value="FRIO">❄️ Frio</option>
              </select>

              {/* Período */}
              <select
                value={filtroPeriodo}
                onChange={(e) => setFiltroPeriodo(e.target.value)}
                className={`text-xs border rounded-md px-3 py-1.5 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer transition-colors shadow-sm ${
                  filtroPeriodo !== "ALL" 
                    ? "bg-purple-50 border-purple-200 text-purple-700 font-medium" 
                    : "bg-white hover:bg-muted/50"
                }`}
              >
                <option value="ALL">📅 Todo Período</option>
                <option value="HOJE">Hoje</option>
                <option value="7D">Últimos 7 dias</option>
                <option value="30D">Últimos 30 dias</option>
              </select>

              {/* Busca */}
              <div className="relative ml-auto">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/70" />
                <Input
                  placeholder="Buscar lead..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9 w-52 h-8 text-xs bg-white border-muted shadow-sm focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left bg-white">
              <thead>
                <tr className="border-b border-border bg-white text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
                  <th className="p-4 pl-6">Lead</th>
                  <th className="p-4">Canal</th>
                  <th className="p-4">Data</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Temp.</th>
                  <th className="p-4">Score</th>
                  <th className="p-4 pr-6"></th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-border/50">
                {analisesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-16 text-center text-muted-foreground text-xs bg-muted/5">
                      Nenhum registro encontrado com os filtros selecionados
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
  // Usa origem_tracking (real) ou fallback para inferência IA
  const origemTracking = analise.origem_tracking;
  const origem = origemTracking ? mapOrigemTracking(origemTracking) : (resultado?.dados_cadastrais?.origem_detectada || "Orgânico");
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

  // Avatar color by tipo
  const getAvatarStyle = () => {
    if (tipo === "Suporte") {
      return "bg-gradient-to-br from-indigo-400 to-purple-500 text-white border-indigo-300";
    }
    return "bg-gradient-to-br from-emerald-400 to-teal-500 text-white border-emerald-300";
  };

  return (
    <tr
      className="group hover:bg-gradient-to-r hover:from-violet-50/50 hover:to-blue-50/50 transition-all duration-200 cursor-pointer border-b border-gray-100 last:border-0"
      onClick={onClick}
    >
      <td className="p-4 pl-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shadow-md transition-transform group-hover:scale-105 ${getAvatarStyle()}`}>
            {iniciais}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-sm group-hover:text-violet-700 transition-colors">
                {nome}
              </span>
              <TipoBadge tipo={tipo} />
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              <span className="font-medium">{formatPhone(analise.chatid)}</span>
            </div>
          </div>
        </div>
      </td>
      <td className="p-4">
        <OrigemBadge origem={origem} />
      </td>
      <td className="p-4">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Entrada</span>
          <span className="text-sm font-medium text-foreground tabular-nums">
            {resultado?.metrics?.data_entrada_lead || data}
          </span>
          <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wide">Análise</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {data} {new Date(analise.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </td>
      <td className="p-4">
        <StatusBadge funil={funil} tipo={tipo} />
      </td>
      <td className="p-4">
        <TemperaturaWidget temp={temp} />
      </td>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                score >= 80 ? "bg-gradient-to-r from-emerald-400 to-green-500" :
                score >= 50 ? "bg-gradient-to-r from-amber-400 to-orange-400" :
                "bg-gradient-to-r from-red-400 to-rose-500"
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
          <span className={`font-bold text-xs tabular-nums ${
            score >= 80 ? "text-emerald-600" :
            score >= 50 ? "text-amber-600" :
            "text-red-600"
          }`}>{score}</span>
        </div>
      </td>
      <td className="p-4 pr-6 text-right">
        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-violet-600 transition-colors" />
        </div>
      </td>
    </tr>
  );
}

function TipoBadge({ tipo }: { tipo: string }) {
  if (tipo === "Suporte") {
    return (
      <Badge variant="outline" className="text-[9px] bg-indigo-50 text-indigo-700 border-indigo-200">
        🛠 SUPORTE
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200">
      💲 VENDAS
    </Badge>
  );
}

// Mapeia origem do tracking para texto de exibição
function mapOrigemTracking(origem: string): string {
  switch (origem) {
    case "facebook_ads": return "Facebook";
    case "instagram_ads": return "Instagram";
    case "google_ads": return "Google";
    case "organico": return "Orgânico";
    default: return origem;
  }
}

function OrigemBadge({ origem }: { origem: string }) {
  const o = origem.toLowerCase();
  // Facebook ou Instagram (Meta)
  if (o === "facebook" || o === "facebook_ads" || o.includes("insta")) {
    const label = o.includes("insta") ? "INSTAGRAM" : "FACEBOOK";
    return <span className="text-[9px] font-bold text-blue-700 border border-blue-200 bg-blue-50 px-1.5 rounded">{label}</span>;
  }
  // Google Ads
  if (o === "google" || o === "google_ads") {
    return <span className="text-[9px] font-bold text-orange-700 border border-orange-200 bg-orange-50 px-1.5 rounded">GOOGLE</span>;
  }
  // Meta (genérico)
  if (o.includes("meta") || o.includes("face")) {
    return <span className="text-[9px] font-bold text-blue-700 border border-blue-200 bg-blue-50 px-1.5 rounded">META</span>;
  }
  // Indicação (IA)
  if (o.includes("indica")) {
    return <span className="text-[9px] font-bold text-purple-700 border border-purple-200 bg-purple-50 px-1.5 rounded">INDICAÇÃO</span>;
  }
  // Orgânico (padrão)
  return <span className="text-[9px] font-bold text-gray-600 border border-gray-200 bg-gray-50 px-1.5 rounded">ORGÂNICO</span>;
}

function StatusBadge({ funil, tipo }: { funil: string; tipo: string }) {
  const f = funil.toLowerCase();
  const t = tipo.toLowerCase();

  if (t.includes("suporte")) {
    if (f.includes("resolvido")) {
      return <Badge className="bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200">RESOLVIDO</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200">EM ABERTO</Badge>;
  }

  if (f.includes("vendido") || f.includes("matriculado")) {
    return <Badge className="bg-green-100 text-green-700 border border-green-200 hover:bg-green-200">MATRICULADO</Badge>;
  }
  if (f.includes("agendado")) {
    return <Badge className="bg-sky-100 text-sky-700 border border-sky-200 hover:bg-sky-200">AGENDADO</Badge>;
  }
  if (f.includes("negociação") || f.includes("negociacao")) {
    return <Badge className="bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200">NEGOCIAÇÃO</Badge>;
  }
  if (f.includes("perdido")) {
    return <Badge className="bg-red-100 text-red-700 border border-red-200 hover:bg-red-200">PERDIDO</Badge>;
  }
  return <Badge className="bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200">PENDENTE</Badge>;
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
