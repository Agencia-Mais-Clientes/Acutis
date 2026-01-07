"use server";

import { redirect } from "next/navigation";
import { setOwnerId, validateOwner } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const owner = formData.get("owner") as string;

  if (!owner || owner.trim() === "") {
    return { error: "Por favor, informe o ID da empresa" };
  }

  // Remove caracteres não numéricos
  const cleanOwner = owner.replace(/\D/g, "");

  // Valida se o owner existe no banco
  const isValid = await validateOwner(cleanOwner);

  if (!isValid) {
    return { error: "Empresa não encontrada. Verifique o ID informado." };
  }

  // Salva o owner no cookie
  await setOwnerId(cleanOwner);

  // Redireciona para o dashboard
  redirect("/dashboard");
}
