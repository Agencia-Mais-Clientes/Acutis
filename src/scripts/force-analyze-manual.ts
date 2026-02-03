
import { supabaseAdmin } from "@/lib/supabase";
import { 
  getNewMessages, 
  formatTranscription, 
  analyzeConversation, 
  saveAnalysis,
  getLeadEntryDate,
  getLeadOrigin
} from "@/lib/analyze-service";
import { ConfigEmpresa } from "@/lib/analyze-types";

// TSX não lê .env.local automaticamente - variáveis carregadas via shell
// import dotenv from 'dotenv';
// dotenv.config({ path: '.env.local' });

const OWNER_ID = "5511910966475";
const LIMIT = 20;

async function run() {
  console.log(`[FORCE] Iniciando análise forçada para owner ${OWNER_ID} (Limit: ${LIMIT})`);

  // 1. Busca Config da Empresa
  const { data: configData, error: configError } = await supabaseAdmin
    .from("config_empresas")
    .select("*")
    .eq("owner", OWNER_ID)
    .single();

  if (configError || !configData) {
    console.error("Erro ao buscar config da empresa:", configError);
    return;
  }
  const config = configData as ConfigEmpresa;

  // 2. Busca últimos chats (sem filtro de já analisado)
  const { data: chats, error: chatsError } = await supabaseAdmin
    .from("mensagens_clientes")
    .select("chatid")
    .eq("owner", OWNER_ID)
    .order("recebido_em", { ascending: false }) // Mais recentes
    // Distinct on chatid is tricky in supabase simple query without RPC or correct syntax
    // Vamos pegar um range maior e filtrar distinct no código
    .limit(LIMIT * 10); 

  if (chatsError) {
    console.error("Erro ao buscar chats:", chatsError);
    return;
  }

  // Filtra IDs únicos
  const uniqueChatIds = Array.from(new Set(chats.map(c => c.chatid))).slice(0, LIMIT);
  
  console.log(`[FORCE] Encontrados ${uniqueChatIds.length} chats únicos para processar.`);

  for (const chatid of uniqueChatIds) {
    console.log(`\n-----------------------------------`);
    console.log(`[FORCE] Processando chat: ${chatid}`);
    
    try {
      // 3. Busca mensagens do zero (force re-analysis)
      const messages = await getNewMessages(chatid, 0);
      
      if (messages.length === 0) {
        console.log(`[FORCE] Sem mensagens para ${chatid}`);
        continue;
      }

      console.log(`[FORCE] ${messages.length} mensagens encontradas.`);

      // 4. Formata
      const transcription = formatTranscription(messages, config);
      if (!transcription) {
        console.log(`[FORCE] Falha ao formatar transcrição.`);
        continue;
      }

      // 5. Analisa
      console.log(`[FORCE] Analisando com IA...`);
      const resultado = await analyzeConversation(transcription, config);
      
      if (!resultado) {
        console.log(`[FORCE] Falha na análise IA.`);
        continue;
      }

      // 5.1 Enriquecimento (padronizado com processChat)
      const dataEntradaReal = await getLeadEntryDate(chatid);
      if (dataEntradaReal && resultado.metrics) {
        resultado.metrics.data_entrada_lead = dataEntradaReal;
      }
      
      // Força Vendas se tráfego pago
      const origemLead = await getLeadOrigin(chatid, OWNER_ID);
      const isTrafegoPago = ["facebook_ads", "instagram_ads", "google_ads"].includes(origemLead || "");
      if (isTrafegoPago && resultado.tipo_conversacao !== "Vendas") {
        console.log(`[FORCE] Forçando Vendas (Tráfego Pago: ${origemLead})`);
        resultado.tipo_conversacao = "Vendas";
      }

      // 6. Salva
      const saved = await saveAnalysis(
        chatid,
        OWNER_ID,
        transcription.primeiroId,
        transcription.ultimoId,
        resultado
      );

      if (saved) {
        console.log(`[FORCE] ✅ Análise salva com sucesso!`);
      } else {
        console.error(`[FORCE] ❌ Erro ao salvar análise.`);
      }

    } catch (err) {
      console.error(`[FORCE] Erro ao processar chat ${chatid}:`, err);
    }
  }

  console.log(`\n[FORCE] Processamento concluído.`);
}

run();
