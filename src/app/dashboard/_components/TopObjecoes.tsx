import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ObjecaoRanking } from "@/lib/types";
import { MessageSquareWarning, Trophy } from "lucide-react";

interface TopObjecoesProps {
  objecoes: ObjecaoRanking[];
}

export function TopObjecoes({ objecoes }: TopObjecoesProps) {
  if (objecoes.length === 0) {
    return (
      <Card className="shadow-lg border-none bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
            <div className="p-1.5 bg-rose-100 rounded-lg">
              <MessageSquareWarning className="h-4 w-4 text-rose-600" />
            </div>
            Top Objeções
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground/80">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-50 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-emerald-700">Nenhuma objeção detectada</p>
            <p className="text-xs text-muted-foreground mt-1">Ótimo trabalho! 🎉</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxQuantidade = Math.max(...objecoes.map(o => o.quantidade), 1);
  
  // Colors for ranking
  const rankColors = [
    { bg: "bg-rose-500", text: "text-rose-700", light: "bg-rose-50", border: "border-rose-200" },
    { bg: "bg-orange-500", text: "text-orange-700", light: "bg-orange-50", border: "border-orange-200" },
    { bg: "bg-amber-500", text: "text-amber-700", light: "bg-amber-50", border: "border-amber-200" },
    { bg: "bg-yellow-500", text: "text-yellow-700", light: "bg-yellow-50", border: "border-yellow-200" },
    { bg: "bg-lime-500", text: "text-lime-700", light: "bg-lime-50", border: "border-lime-200" },
  ];

  return (
    <Card className="shadow-lg border-none bg-white overflow-hidden">
      <CardHeader className="pb-4 bg-gradient-to-r from-rose-50 to-pink-50 border-b border-rose-100">
        <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
          <div className="p-1.5 bg-rose-100 rounded-lg">
            <MessageSquareWarning className="h-4 w-4 text-rose-600" />
          </div>
          Top Objeções
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        {objecoes.map((objecao, index) => {
          const width = Math.max((objecao.quantidade / maxQuantidade) * 100, 10);
          const colors = rankColors[index] || rankColors[4];
          
          return (
            <div key={objecao.nome} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {/* Rank number */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${colors.bg}`}>
                    {index + 1}
                  </div>
                  <span className="text-lg mr-1">{objecao.icone}</span>
                  <span className={`text-xs font-semibold ${index === 0 ? "text-foreground" : "text-muted-foreground"}`}>
                    {objecao.nome}
                  </span>
                </div>
                <span className={`text-sm font-bold tabular-nums ${colors.text}`}>
                  {objecao.quantidade}
                </span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden ml-9">
                <div
                  className={`${colors.bg} h-2 rounded-full transition-all duration-700`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
