"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Phone, Loader2 } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 shadow-lg shadow-green-900/30 transition-all duration-150 hover:-translate-y-0.5"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Entrando...
        </>
      ) : (
        "ENTRAR AGORA"
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
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117] p-4">
      <Card className="w-full max-w-md bg-[#161b22] border-gray-800 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(22,163,74,0.4)] mx-auto">
            <Lock className="h-7 w-7 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white tracking-tight">
              Acutis
            </CardTitle>
            <CardDescription className="text-gray-500 mt-2">
              Acesse o painel de performance da sua empresa
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="owner"
                className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1"
              >
                ID da Empresa / Telefone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  name="owner"
                  id="owner"
                  required
                  placeholder="Ex: 5511999999999"
                  className="pl-10 py-3 bg-[#0d1117] border-gray-700 text-white placeholder-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg text-center">
                {error}
              </div>
            )}

            <SubmitButton />
          </form>

          <p className="text-center text-[11px] text-gray-600 mt-6">
            Ambiente Seguro © 2025
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
