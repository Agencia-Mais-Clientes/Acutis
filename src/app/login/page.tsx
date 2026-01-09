"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Loader2, Activity } from "lucide-react";
import { ScaleIn } from "@/components/ui/motion";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="w-full font-bold py-6 text-lg transition-all duration-150 hover:-translate-y-0.5"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Conectando...
        </>
      ) : (
        "ACESSAR SISTEMA"
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50 to-transparent -z-10" />
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-50 -z-10" />
      
      <ScaleIn className="w-full max-w-md">
        <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-6 pt-10">
            <div className="w-20 h-20 bg-gradient-to-br from-[#8537E7] to-[#278BCD] rounded-2xl flex items-center justify-center shadow-lg shadow-purple-900/20 mx-auto rotate-3 hover:rotate-6 transition-transform">
              <Activity className="h-10 w-10 text-white" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Acutis
              </CardTitle>
              <CardDescription className="text-gray-500 mt-2 text-base">
                Plataforma de Vendas
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pb-10 px-8">
            <form action={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="owner"
                  className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1"
                >
                  ID da Empresa / Telefone
                </label>
                <div className="relative group">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <Input
                    type="text"
                    name="owner"
                    id="owner"
                    required
                    placeholder="Ex: 5511999999999"
                    className="pl-10 py-6 bg-gray-50 border-gray-200 focus:bg-white transition-all text-lg"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg text-center font-medium animate-pulse">
                  {error}
                </div>
              )}

              <SubmitButton />
            </form>

            <p className="text-center text-[11px] text-gray-400 mt-8">
              Ambiente Seguro • Acutis 2026
            </p>
          </CardContent>
        </Card>
      </ScaleIn>
    </div>
  );
}
