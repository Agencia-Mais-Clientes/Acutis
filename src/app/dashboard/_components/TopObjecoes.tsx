import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ObjecaoRanking } from "@/lib/types";

interface TopObjecoesProps {
  objecoes: ObjecaoRanking[];
}

export function TopObjecoes({ objecoes }: TopObjecoesProps) {
  if (objecoes.length === 0) {
    return (
      <Card className="bg-[#0b0d11] border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-1 h-4 bg-red-500 rounded" />
            Top Objeções
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-600">
            <p className="text-xs">Nenhuma objeção detectada</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxQuantidade = Math.max(...objecoes.map(o => o.quantidade), 1);

  return (
    <Card className="bg-[#0b0d11] border-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
          <span className="w-1 h-4 bg-red-500 rounded" />
          Top Objeções
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {objecoes.map((objecao, index) => {
          const width = Math.max((objecao.quantidade / maxQuantidade) * 100, 10);
          
          return (
            <div key={objecao.nome} className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 flex items-center gap-2">
                  <span className="text-sm">{objecao.icone}</span>
                  <span className={index === 0 ? "text-white font-medium" : ""}>
                    {objecao.nome}
                  </span>
                </span>
                <span className="text-xs text-white font-mono">{objecao.quantidade}</span>
              </div>
              <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-red-500/60 h-1 rounded-full transition-all duration-700"
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
