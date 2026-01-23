// Script temporário para limpar análises e rodar novas
// Execute com: npx tsx scripts/test-business-hours.ts

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Carrega variáveis de ambiente manualmente para não precisar instalar dotenv
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const [key, value] = line.split("=");
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const OWNER = "553125286404";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log(`\n🔧 Testando horário de funcionamento para owner: ${OWNER}\n`);

  // 1. Verificar quantas análises existem
  const { count: before } = await supabase
    .from("analises_conversas")
    .select("*", { count: "exact", head: true })
    .eq("owner", OWNER);

  console.log(`📊 Análises existentes: ${before || 0}`);

  // 2. Deletar análises existentes
  const { error: deleteError } = await supabase
    .from("analises_conversas")
    .delete()
    .eq("owner", OWNER);

  if (deleteError) {
    console.error("❌ Erro ao deletar:", deleteError);
    return;
  }

  console.log(`🗑️  Análises deletadas com sucesso!`);

  // 3. Verificar configuração de horário da empresa
  const { data: empresa } = await supabase
    .from("config_empresas")
    .select("nome_empresa, horario_funcionamento, timezone")
    .eq("owner", OWNER)
    .single();

  if (empresa) {
    console.log(`\n🏢 Empresa: ${empresa.nome_empresa}`);
    console.log(`🕐 Timezone: ${empresa.timezone || "America/Sao_Paulo (default)"}`);
    console.log(`📅 Horário configurado:`);
    
    if (empresa.horario_funcionamento) {
      Object.entries(empresa.horario_funcionamento).forEach(([dia, config]) => {
        const c = config as any;
        if (c.ativo) {
          console.log(`   ${dia}: ${c.inicio} - ${c.fim}`);
        } else {
          console.log(`   ${dia}: Fechado`);
        }
      });
    } else {
      console.log("   (usando horário padrão)");
    }
  }

  // 4. Contar chats elegíveis para análise
  const { count: chatsElegiveis } = await supabase
    .from("mensagens_clientes")
    .select("chatid", { count: "exact", head: true })
    .eq("owner", OWNER)
    .gte("recebido_em", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  console.log(`\n💬 Chats com mensagens nos últimos 30 dias: ${chatsElegiveis}`);

  console.log(`\n✅ Pronto para rodar análises!`);
  console.log(`\n📝 Para rodar análises, faça uma requisição POST para:`);
  console.log(`   http://localhost:3000/api/analyze-conversations`);
  console.log(`   Body: { "ownerId": "${OWNER}", "batchSize": 5 }`);
}

main().catch(console.error);
