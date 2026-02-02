"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { seedCurrentUserAsSuperAdmin } from "../actions";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function SeedSuperAdminButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSeed() {
    setLoading(true);
    
    const result = await seedCurrentUserAsSuperAdmin();
    
    if (result.success) {
      toast.success("Você foi registrado como Super Admin!");
      router.refresh();
    } else {
      toast.error(result.error || "Erro ao registrar");
    }
    
    setLoading(false);
  }

  return (
    <Button
      onClick={handleSeed}
      disabled={loading}
      className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/30"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Registrando...
        </>
      ) : (
        <>
          <ShieldCheck className="mr-2 h-4 w-4" />
          Registrar como Super Admin
        </>
      )}
    </Button>
  );
}
