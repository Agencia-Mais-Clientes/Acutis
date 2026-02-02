"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateMyProfile, changeMyPassword, Gestor } from "../../gestores/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Phone, Lock, Save, Loader2, Eye, EyeOff, KeyRound } from "lucide-react";

interface ProfileFormProps {
  gestor: Gestor;
  forcePasswordChange?: boolean;
}

export function ProfileForm({ gestor, forcePasswordChange = false }: ProfileFormProps) {
  const router = useRouter();

  // Estado do perfil
  const [profileData, setProfileData] = useState({
    nome: gestor.nome,
    telefone: gestor.telefone || "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Estado da senha
  const [passwordData, setPasswordData] = useState({
    novaSenha: "",
    confirmarSenha: "",
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);

    const result = await updateMyProfile({
      nome: profileData.nome,
      telefone: profileData.telefone || null,
    });

    if (result.success) {
      toast.success("Perfil atualizado com sucesso!");
      router.refresh();
    } else {
      toast.error(result.error || "Erro ao atualizar perfil");
    }

    setSavingProfile(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setSavingPassword(true);

    const result = await changeMyPassword({
      novaSenha: passwordData.novaSenha,
      confirmarSenha: passwordData.confirmarSenha,
    });

    if (result.success) {
      toast.success("Senha alterada com sucesso!");
      setPasswordData({ novaSenha: "", confirmarSenha: "" });
      
      // Se era primeiro acesso, redireciona para o dashboard
      if (forcePasswordChange) {
        router.push("/admin/empresas");
        router.refresh();
      } else {
        router.refresh();
      }
    } else {
      toast.error(result.error || "Erro ao alterar senha");
    }

    setSavingPassword(false);
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Aviso de primeiro acesso */}
      {forcePasswordChange && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <KeyRound className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-amber-800">Bem-vindo ao Acutis!</p>
            <p className="text-sm text-amber-700 mt-1">
              Por segurança, você precisa definir uma nova senha antes de continuar.
            </p>
          </div>
        </div>
      )}

      {/* Card de Senha - aparece primeiro se for primeiro acesso */}
      <Card className={`bg-white border shadow-lg rounded-2xl overflow-hidden ${forcePasswordChange ? 'border-amber-300 ring-2 ring-amber-200' : 'border-gray-100'}`}>
        <CardHeader className={`border-b px-6 py-4 ${forcePasswordChange ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
          <CardTitle className="text-gray-900 text-lg flex items-center gap-2">
            <Lock className={`h-5 w-5 ${forcePasswordChange ? 'text-amber-600' : 'text-violet-600'}`} />
            {forcePasswordChange ? "Defina sua Nova Senha" : "Alterar Senha"}
          </CardTitle>
          <CardDescription>
            {forcePasswordChange 
              ? "Crie uma senha forte que só você saiba"
              : "Atualize sua senha de acesso"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Nova Senha */}
            <div>
              <label className="flex items-center gap-2 text-xs text-gray-500 mb-2 uppercase font-bold">
                <Lock className="h-3.5 w-3.5" />
                Nova Senha *
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={passwordData.novaSenha}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, novaSenha: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                  className="bg-gray-50 border-gray-200 text-gray-900 focus:border-violet-500 focus:ring-violet-500 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirmar Senha */}
            <div>
              <label className="flex items-center gap-2 text-xs text-gray-500 mb-2 uppercase font-bold">
                <Lock className="h-3.5 w-3.5" />
                Confirmar Senha *
              </label>
              <Input
                type={showPassword ? "text" : "password"}
                value={passwordData.confirmarSenha}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmarSenha: e.target.value }))}
                placeholder="Digite a senha novamente"
                className="bg-gray-50 border-gray-200 text-gray-900 focus:border-violet-500 focus:ring-violet-500"
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              disabled={savingPassword || !passwordData.novaSenha || !passwordData.confirmarSenha}
              className={`w-full ${forcePasswordChange 
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700'
              } shadow-lg`}
            >
              {savingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  {forcePasswordChange ? "Definir Senha e Continuar" : "Alterar Senha"}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Card do Perfil - só mostra se não for primeiro acesso */}
      {!forcePasswordChange && (
        <Card className="bg-white border border-gray-100 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="bg-gray-50 border-b border-gray-100 px-6 py-4">
            <CardTitle className="text-gray-900 text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-600" />
              Meus Dados
            </CardTitle>
            <CardDescription>Atualize suas informações pessoais</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Email (readonly) */}
              <div>
                <label className="flex items-center gap-2 text-xs text-gray-500 mb-2 uppercase font-bold">
                  Email
                </label>
                <Input
                  value={gestor.email}
                  disabled
                  className="bg-gray-100 border-gray-200 text-gray-500"
                />
                <p className="text-xs text-gray-400 mt-1">O email não pode ser alterado</p>
              </div>

              {/* Nome */}
              <div>
                <label className="flex items-center gap-2 text-xs text-gray-500 mb-2 uppercase font-bold">
                  <User className="h-3.5 w-3.5" />
                  Nome Completo *
                </label>
                <Input
                  value={profileData.nome}
                  onChange={(e) => setProfileData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Seu nome"
                  className="bg-gray-50 border-gray-200 text-gray-900 focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="flex items-center gap-2 text-xs text-gray-500 mb-2 uppercase font-bold">
                  <Phone className="h-3.5 w-3.5" />
                  Telefone (WhatsApp)
                </label>
                <Input
                  value={profileData.telefone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, telefone: e.target.value }))}
                  placeholder="5511999999999"
                  className="bg-gray-50 border-gray-200 text-gray-900 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <Button
                type="submit"
                disabled={savingProfile}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg"
              >
                {savingProfile ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
