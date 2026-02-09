"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Loader2, Activity, Sparkles, Building2 } from "lucide-react";
import Image from "next/image";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="w-full font-bold py-6 text-lg bg-gradient-to-r from-violet-500 via-purple-500 to-cyan-500 hover:from-violet-600 hover:via-purple-600 hover:to-cyan-600 shadow-lg shadow-violet-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-violet-500/40"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Conectando...
        </>
      ) : (
        <>
          <Building2 className="mr-2 h-5 w-5" />
          ACESSAR SISTEMA
        </>
      )}
    </Button>
  );
}

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await loginAction(formData);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-violet-500/10 to-cyan-500/10 rounded-full blur-3xl" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Logo Acutis no topo */}
      <div className="relative z-10 mb-8">
        <Image
          src="/logos/logo_acutis_White.png"
          alt="Acutis"
          width={200}
          height={60}
          className="drop-shadow-2xl"
          priority
        />
      </div>

      {/* Card de Login com glassmorphism */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          {/* Subtítulo */}
          <p className="text-center text-white/60 text-sm mb-6 font-medium">
            Plataforma de Vendas
          </p>

          <form action={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="owner"
                className="block text-xs font-bold text-white/60 uppercase tracking-wider ml-1"
              >
                ID da Empresa / Telefone
              </label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 group-focus-within:text-violet-400 transition-colors" />
                <Input
                  type="text"
                  name="owner"
                  id="owner"
                  required
                  placeholder="Ex: 5511999999999"
                  className="pl-12 py-6 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-violet-400 focus:ring-violet-400/50 backdrop-blur-sm text-lg"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-300 text-sm bg-red-500/20 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
                <span className="font-medium">{error}</span>
              </div>
            )}

            <SubmitButton />
          </form>
        </div>



        <p className="text-center text-[11px] text-white/30 mt-4">
          Ambiente Seguro • Acutis 2026
        </p>
      </div>
    </div>
  );
}
