"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Activity, LogIn, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await adminLogin(email, password);

    if (result.success) {
      router.push("/admin/empresas");
    } else {
      setError(result.error || "Erro ao fazer login");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center shadow-lg shadow-green-900/30">
            <Activity className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight uppercase">
              Acutis
            </h1>
            <p className="text-xs text-gray-500 font-medium">Painel Administrativo</p>
          </div>
        </div>

        {/* Card de Login */}
        <div className="bg-[#0b0d11] border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-6 text-center">
            Acesso Restrito
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 uppercase font-bold">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@empresa.com"
                className="bg-[#161b22] border-gray-700 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5 uppercase font-bold">
                Senha
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-[#161b22] border-gray-700 text-white"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
            >
              {loading ? (
                "Entrando..."
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Entrar
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Acesso restrito a administradores
        </p>
      </div>
    </div>
  );
}
