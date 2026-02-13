// Helper para comunicação com UazAPI v2
// Documentação: https://docs.uazapi.com/

const UAZAPI_BASE_URL = process.env.UAZAPI_BASE_URL || "https://free.uazapi.com";
const UAZAPI_ADMIN_TOKEN = process.env.UAZAPI_ADMIN_TOKEN || "";

interface InstanceStatus {
  connected: boolean;
  state: string;
  phoneNumber: string | null;
  profileName: string | null;
  profilePicUrl: string | null;
}

interface InstanceInfo {
  id: string;
  name: string;
  token: string;
  phone: string | null;
  status: string;
  profileName: string | null;

  profilePicUrl: string | null;
  lastDisconnect: string | null;
  lastDisconnectReason: string | null;
}

export interface CreateInstanceResponse {
  instance: {
    instanceId: string;
    token: string;
    status: string;
  };
  hash: {
    apikey: string;
  };
}

export interface ConnectInstanceResponse {
  base64: string; // QR Code em base64
  code: string;   // Pareamento por código
}

/**
 * Lista TODAS as instâncias usando o admintoken
 * Endpoint: GET /instance/all
 */
export async function getAllInstances(): Promise<InstanceInfo[]> {
  if (!UAZAPI_ADMIN_TOKEN) {
    console.warn("[UAZAPI] UAZAPI_ADMIN_TOKEN não configurado");
    return [];
  }

  try {
    const response = await fetch(`${UAZAPI_BASE_URL}/instance/all`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "admintoken": UAZAPI_ADMIN_TOKEN,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`[UAZAPI] Erro ao listar instâncias: ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    // Log para debug dos campos exatos que estão chegando
    if (Array.isArray(data) && data.length > 0) {
      const first = data[0];
      console.log("[UAZAPI DEBUG] Campos da primeira instância:", {
        id: first.id,
        owner: first.owner,
        phone: first.phone,
        profilePicUrl_raw: first.profilePicUrl,
        profileName_raw: first.profileName,
        pushName: first.pushName,
        lastDisconnect: first.lastDisconnect,
      });
    }
    
    // Mapeia resposta para nosso formato
    if (Array.isArray(data)) {
      return data.map((inst: Record<string, unknown>) => ({
        id: String(inst.id || inst.instanceId || ""),
        name: String(inst.name || inst.instanceName || ""),
        token: String(inst.token || ""),
        // Tenta vários campos possíveis para o telefone
        phone: inst.owner ? String(inst.owner).replace(/\D/g, "") : 
               inst.phone ? String(inst.phone).replace(/\D/g, "") : 
               inst.number ? String(inst.number).replace(/\D/g, "") : null,
        status: String(inst.state || inst.status || "unknown"),
        profileName: inst.profileName ? String(inst.profileName) : inst.pushName ? String(inst.pushName) : null,
        profilePicUrl: inst.profilePicUrl ? String(inst.profilePicUrl) : null,
        lastDisconnect: inst.lastDisconnect ? String(inst.lastDisconnect) : null,
        lastDisconnectReason: inst.lastDisconnectReason ? String(inst.lastDisconnectReason) : null,
      }));
    }
    
    return [];
  } catch (error) {
    console.error("[UAZAPI] Erro em getAllInstances:", error);
    return [];
  }
}

/**
 * Verifica o status de uma instância do WhatsApp
 * @param instanceToken Token único da instância
 */
/**
 * Envia mensagem de texto via WhatsApp usando o token da instância
 * @param phoneNumber - Número do destinatário (ex: "5511999999999")
 * @param text - Texto da mensagem
 * @param instanceToken - Token da instância UazAPI da empresa
 */
export async function sendWhatsAppMessage(
  phoneNumber: string,
  text: string,
  instanceToken: string
): Promise<boolean> {
  try {
    const response = await fetch(`${UAZAPI_BASE_URL}/message/text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "token": instanceToken,
      },
      body: JSON.stringify({
        number: phoneNumber,
        text,
      }),
    });

    if (!response.ok) {
      console.error(`[UAZAPI] Erro ao enviar mensagem: ${response.status}`);
      return false;
    }

    console.log(`[UAZAPI] Mensagem enviada para ${phoneNumber}`);
    return true;
  } catch (error) {
    console.error("[UAZAPI] Erro ao enviar mensagem:", error);
    return false;
  }
}

/**
 * Verifica o status de uma instância do WhatsApp
 * @param instanceToken Token único da instância
 */
export async function getInstanceStatus(instanceToken: string | null): Promise<InstanceStatus> {
  // Se não tem token, retorna como desconhecido
  if (!instanceToken) {
    return {
      connected: false,
      state: "NO_TOKEN",
      phoneNumber: null,
      profileName: null,
      profilePicUrl: null,
    };
  }

  try {
    const response = await fetch(`${UAZAPI_BASE_URL}/instance/status`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "token": instanceToken,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`[UAZAPI] Erro ao buscar status: ${response.status}`);
      return {
        connected: false,
        state: response.status === 401 ? "INVALID_TOKEN" : "ERROR",
        phoneNumber: null,
        profileName: null,
        profilePicUrl: null,
      };
    }

    const data = await response.json();
    const inst = data; // Alias para facilitar
    
    // Lógica robusta para extrair telefone
    const phone = inst.owner ? String(inst.owner).replace(/\D/g, "") : 
                  inst.phone ? String(inst.phone).replace(/\D/g, "") : 
                  inst.number ? String(inst.number).replace(/\D/g, "") : null;

    // Estados possíveis: disconnected, connecting, connected
    const connected = (inst.state === "connected" || inst.status === "connected" || inst.state === "open");

    return {
      connected: connected,
      state: String(inst.state || inst.status || "UNKNOWN").toUpperCase(),
      phoneNumber: phone,
      profileName: inst.profileName || inst.pushName || inst.name || null,
      profilePicUrl: inst.profilePicUrl || null,
    };
  } catch (error) {
    console.error(`[UAZAPI] Erro de conexão com a API:`, error);
    return {
      connected: false,
      state: "CONNECTION_ERROR",
      phoneNumber: null,
      profileName: null,
      profilePicUrl: null,
    };
  }
}
