"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { selectFirstActiveCompany } from "../../actions";
import { toast } from "sonner";

export function AutoSelector() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shouldSelect = searchParams.get("selectFirst") === "true";

  useEffect(() => {
    if (shouldSelect) {
      const select = async () => {
        const result = await selectFirstActiveCompany();
        if (result.success) {
          toast.success("Empresa selecionada automaticamente");
          router.push("/dashboard");
        } else {
          toast.error(result.error || "Falha ao selecionar empresa");
          // Remove o query param para evitar loop infinito de tentativas
          router.replace("/admin/empresas");
        }
      };
      select();
    }
  }, [shouldSelect, router]);

  return null;
}
