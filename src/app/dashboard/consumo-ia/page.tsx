import { redirect } from "next/navigation";
import { getOwnerId, isAdminSession } from "@/lib/auth";
import { getTokenStats } from "../actions-tokens";
import { FadeIn } from "@/components/ui/motion";
import { Cpu, ArrowLeft, Zap, BarChart3, Database, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export default async function ConsumoIAPage() {
  const isAdmin = await isAdminSession();

  if (!isAdmin) {
    redirect("/dashboard");
  }

  const ownerId = await getOwnerId();

  if (!ownerId) {
    redirect("/login");
  }

  const stats = await getTokenStats(ownerId);

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <FadeIn duration={0.6}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-6 md:p-8 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl -ml-24 -mb-24" />

          <div className="relative z-10">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Dashboard
            </Link>

            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                <Cpu className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  Consumo IA
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  Monitoramento de tokens consumidos por analise (Gemini 2.5 Flash)
                </p>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden border-none shadow-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20">
            <Database className="h-24 w-24" />
          </div>
          <div className="p-6 relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Database className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-medium text-white/90">Total Analises</span>
            </div>
            <h3 className="text-4xl font-bold tracking-tight">
              {stats.totalAnalises.toLocaleString("pt-BR")}
            </h3>
            <p className="text-sm text-white/70 mt-2">
              {stats.analisesComToken} com tracking de tokens
            </p>
          </div>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20">
            <Zap className="h-24 w-24" />
          </div>
          <div className="p-6 relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-medium text-white/90">Total Tokens</span>
            </div>
            <h3 className="text-4xl font-bold tracking-tight">
              {formatTokens(stats.totalTokens)}
            </h3>
            <p className="text-sm text-white/70 mt-2">
              {formatTokens(stats.totalInput)} input + {formatTokens(stats.totalOutput)} output
            </p>
          </div>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-xl bg-gradient-to-br from-cyan-600 to-blue-600 text-white group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20">
            <BarChart3 className="h-24 w-24" />
          </div>
          <div className="p-6 relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-medium text-white/90">Media por Analise</span>
            </div>
            <h3 className="text-4xl font-bold tracking-tight">
              {stats.mediaTokensPorAnalise.toLocaleString("pt-BR")}
            </h3>
            <p className="text-sm text-white/70 mt-2">
              {stats.mediaInput.toLocaleString("pt-BR")} in / {stats.mediaOutput.toLocaleString("pt-BR")} out
            </p>
          </div>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20">
            <TrendingUp className="h-24 w-24" />
          </div>
          <div className="p-6 relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-medium text-white/90">Cobertura Tracking</span>
            </div>
            <h3 className="text-4xl font-bold tracking-tight">
              {stats.totalAnalises > 0
                ? Math.round((stats.analisesComToken / stats.totalAnalises) * 100)
                : 0}%
            </h3>
            <p className="text-sm text-white/70 mt-2">
              {stats.analisesSemToken} analises sem dados de token
            </p>
          </div>
        </Card>
      </div>

      {/* Grid: Tabela por empresa + Historico diario */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Consumo por Empresa */}
        {stats.porEmpresa.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Database className="h-5 w-5 text-violet-600" />
              Consumo por Empresa
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Empresa</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">Analises</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">Tokens</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">Media</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.porEmpresa.map((empresa) => (
                    <tr
                      key={empresa.owner}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-2 font-medium text-gray-900">
                        {empresa.empresa}
                      </td>
                      <td className="py-3 px-2 text-right text-gray-600">
                        {empresa.totalAnalises.toLocaleString("pt-BR")}
                      </td>
                      <td className="py-3 px-2 text-right text-gray-600">
                        {formatTokens(empresa.totalTokens)}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-violet-100 text-violet-700">
                          {empresa.mediaTokens.toLocaleString("pt-BR")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Historico Diario */}
        {stats.historicoDiario.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-cyan-600" />
              Historico Diario (ultimos 30 dias)
            </h2>

            {/* Mini bar chart */}
            <div className="flex items-end gap-1 h-40 mb-4">
              {stats.historicoDiario.map((dia) => {
                const maxTokens = Math.max(
                  ...stats.historicoDiario.map((d) => d.totalTokens)
                );
                const heightPct = maxTokens > 0 ? (dia.totalTokens / maxTokens) * 100 : 0;
                return (
                  <div
                    key={dia.data}
                    className="flex-1 group relative"
                    title={`${dia.data}: ${dia.totalTokens.toLocaleString("pt-BR")} tokens (${dia.totalAnalises} analises)`}
                  >
                    <div
                      className="bg-gradient-to-t from-cyan-600 to-blue-500 rounded-t-sm transition-all duration-200 group-hover:from-cyan-500 group-hover:to-blue-400 min-h-[2px]"
                      style={{ height: `${Math.max(heightPct, 2)}%` }}
                    />
                    {/* Tooltip on hover */}
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10">
                      {formatDate(dia.data)}: {dia.totalTokens.toLocaleString("pt-BR")} tokens
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tabela resumida */}
            <div className="overflow-x-auto max-h-48 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-2 text-gray-500 font-medium">Data</th>
                    <th className="text-right py-2 px-2 text-gray-500 font-medium">Analises</th>
                    <th className="text-right py-2 px-2 text-gray-500 font-medium">Input</th>
                    <th className="text-right py-2 px-2 text-gray-500 font-medium">Output</th>
                    <th className="text-right py-2 px-2 text-gray-500 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {[...stats.historicoDiario].reverse().map((dia) => (
                    <tr
                      key={dia.data}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-2 px-2 font-medium text-gray-900">
                        {formatDate(dia.data)}
                      </td>
                      <td className="py-2 px-2 text-right text-gray-600">
                        {dia.totalAnalises}
                      </td>
                      <td className="py-2 px-2 text-right text-gray-600">
                        {formatTokens(dia.totalInput)}
                      </td>
                      <td className="py-2 px-2 text-right text-gray-600">
                        {formatTokens(dia.totalOutput)}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-cyan-100 text-cyan-700">
                          {formatTokens(dia.totalTokens)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Info box */}
      {stats.analisesSemToken > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
          <Zap className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
              Dados parciais
            </p>
            <p className="text-sm text-amber-800">
              {stats.analisesSemToken} analises foram feitas antes do tracking de tokens ser ativado.
              As medias consideram apenas as {stats.analisesComToken} analises com dados de consumo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Formata numero grande de tokens (ex: 1.2M, 45.3K) */
function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return (tokens / 1_000_000).toFixed(1).replace(".", ",") + "M";
  }
  if (tokens >= 1_000) {
    return (tokens / 1_000).toFixed(1).replace(".", ",") + "K";
  }
  return tokens.toLocaleString("pt-BR");
}

/** Formata data YYYY-MM-DD para DD/MM */
function formatDate(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  return `${day}/${month}`;
}
