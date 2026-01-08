"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { syncInstanceTokens } from "../../actions";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

export function SyncTokensButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ updated: number; notFound: string[] } | null>(null);

  async function handleSync() {
    setLoading(true);
    setResult(null);

    try {
      const res = await syncInstanceTokens();
      setResult(res);
      router.refresh();
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
    }

    setLoading(false);
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={handleSync}
        disabled={loading}
        variant="outline"
        size="sm"
        className="text-xs border-gray-700 text-gray-400 hover:bg-gray-800"
      >
        <RefreshCw className={`mr-2 h-3 w-3 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Sincronizando..." : "Sincronizar Tokens"}
      </Button>

      {result && (
        <span className="text-xs flex items-center gap-1">
          {result.updated > 0 ? (
            <span className="text-green-400 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              {result.updated} atualizado(s)
            </span>
          ) : (
            <span className="text-gray-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Nenhuma atualização
            </span>
          )}
        </span>
      )}
    </div>
  );
}
