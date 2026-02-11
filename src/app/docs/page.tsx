'use client';

import Image from "next/image";
import { useState } from "react";

// ========================================
// DADOS DOS ENDPOINTS
// ========================================
const BASE_URL = "https://www.acutisapp.com.br";

const ENDPOINTS = [
  {
    id: "cron-analyze-post",
    method: "POST",
    path: "/api/cron/analyze",
    title: "Executar Análise",
    description: "Endpoint principal de orquestração. Busca empresas ativas e analisa chats pendentes automaticamente. Suporta filtro por empresa específica e data.",
    params: [
      { name: "owner", type: "string", required: false, description: "Número do owner da empresa. Se fornecido, analisa somente essa empresa." },
      { name: "fromDate", type: "string", required: false, description: 'Data mínima ISO (ex: "2026-01-01"). Só analisa chats com mensagens a partir dessa data.' },
      { name: "maxPerCompany", type: "number", required: false, description: "Máximo de chats por empresa por fase. Default: 20" },
      { name: "maxTotal", type: "number", required: false, description: "Máximo total de chats na execução. Default: 100" },
    ],
    examples: [
      {
        title: "Todas as empresas",
        code: `curl -X POST "${BASE_URL}/api/cron/analyze" \\
  -H "Content-Type: application/json" \\
  -d '{"maxPerCompany": 20, "maxTotal": 100}'`,
      },
      {
        title: "Empresa específica",
        code: `curl -X POST "${BASE_URL}/api/cron/analyze" \\
  -H "Content-Type: application/json" \\
  -d '{"owner": "5511940820844", "maxPerCompany": 20}'`,
      },
      {
        title: "Com filtro de data",
        code: `curl -X POST "${BASE_URL}/api/cron/analyze" \\
  -H "Content-Type: application/json" \\
  -d '{"owner": "5511940820844", "fromDate": "2026-01-01"}'`,
      },
    ],
    response: `{
  "success": true,
  "companies": [
    {
      "owner": "5511940820844",
      "empresa": "Gaviões Sapopemba",
      "trafegoPago": { "processed": 5, "skipped": 0, "errors": 0 },
      "organico": { "processed": 3, "skipped": 1, "errors": 0 }
    }
  ],
  "totalProcessed": 8,
  "totalErrors": 0,
  "totalSkipped": 1,
  "companiesProcessed": 1,
  "companiesTotal": 46,
  "durationMs": 45000
}`,
  },
  {
    id: "cron-analyze-get",
    method: "GET",
    path: "/api/cron/analyze",
    title: "Health Check + Lista de Empresas",
    description: "Verifica se o sistema está rodando e lista todas as empresas ativas com seus owners. Use este endpoint para descobrir o owner de cada empresa.",
    params: [],
    examples: [
      {
        title: "Verificar status",
        code: `curl "${BASE_URL}/api/cron/analyze"`,
      },
    ],
    response: `{
  "success": true,
  "message": "Cron Analyze API is running",
  "activeCompanies": 46,
  "companiesList": [
    {
      "owner": "5511940820844",
      "empresa": "Gaviões Sapopemba",
      "ativo": true,
      "origemFilter": "trafego_pago"
    }
  ]
}`,
  },
  {
    id: "analyze-single",
    method: "POST",
    path: "/api/analyze-conversations/single",
    title: "Análise Unitária",
    description: "Analisa um único chat específico pelo chatid. Útil para re-analisar manualmente uma conversa.",
    params: [
      { name: "owner", type: "string", required: true, description: "Número do owner da empresa" },
      { name: "chatid", type: "string", required: true, description: "ID do chat no formato WhatsApp (ex: 5511999999999@s.whatsapp.net)" },
    ],
    examples: [
      {
        title: "Analisar um chat",
        code: `curl -X POST "${BASE_URL}/api/analyze-conversations/single" \\
  -H "Content-Type: application/json" \\
  -d '{"owner": "5511940820844", "chatid": "5511999999999@s.whatsapp.net"}'`,
      },
    ],
    response: `{
  "success": true,
  "status": "success",
  "message": "Chat analisado com sucesso",
  "chatid": "5511999999999@s.whatsapp.net"
}`,
  },
  {
    id: "analyze-batch",
    method: "POST",
    path: "/api/analyze-conversations",
    title: "Análise em Lote (Legado)",
    description: "Processa múltiplos chats pendentes de um owner. Endpoint legado — preferir usar /api/cron/analyze.",
    params: [
      { name: "ownerId", type: "string", required: true, description: "ID do owner da empresa" },
      { name: "limit", type: "number", required: false, description: "Máximo de chats a processar. Default: 10" },
    ],
    examples: [
      {
        title: "Processar chats pendentes",
        code: `curl -X POST "${BASE_URL}/api/analyze-conversations" \\
  -H "Content-Type: application/json" \\
  -d '{"ownerId": "5511940820844", "limit": 10}'`,
      },
    ],
    response: `{
  "success": true,
  "processed": 10,
  "errors": 0
}`,
  },
];

const STATUS_CODES = [
  { code: 200, label: "OK", description: "Requisição processada com sucesso", color: "#22c55e" },
  { code: 401, label: "Unauthorized", description: "Token de autenticação inválido ou ausente", color: "#f59e0b" },
  { code: 404, label: "Not Found", description: "Owner não encontrado ou empresa inativa", color: "#f59e0b" },
  { code: 500, label: "Server Error", description: "Erro interno do servidor", color: "#ef4444" },
];

// ========================================
// COMPONENTES
// ========================================

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    GET: { bg: "rgba(34, 197, 94, 0.15)", text: "#22c55e" },
    POST: { bg: "rgba(14, 165, 233, 0.15)", text: "#0ea5e9" },
    PUT: { bg: "rgba(245, 158, 11, 0.15)", text: "#f59e0b" },
    DELETE: { bg: "rgba(239, 68, 68, 0.15)", text: "#ef4444" },
  };
  const c = colors[method] || colors.GET;
  return (
    <span style={{
      background: c.bg,
      color: c.text,
      padding: "4px 10px",
      borderRadius: "6px",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: "12px",
      fontWeight: 700,
      letterSpacing: "0.5px",
    }}>
      {method}
    </span>
  );
}

function CodeBlock({ code, title }: { code: string; title?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      background: "#0d1117",
      borderRadius: "10px",
      border: "1px solid rgba(255,255,255,0.08)",
      overflow: "hidden",
      marginBottom: "12px",
    }}>
      {title && (
        <div style={{
          padding: "10px 16px",
          background: "rgba(255,255,255,0.03)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span style={{ fontSize: "12px", color: "#9ca3af", fontWeight: 500 }}>{title}</span>
          <button
            onClick={handleCopy}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: copied ? "#22c55e" : "#9ca3af",
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "11px",
              cursor: "pointer",
              transition: "all 0.2s",
              fontFamily: "inherit",
            }}
          >
            {copied ? "✓ Copiado" : "Copiar"}
          </button>
        </div>
      )}
      <pre style={{
        padding: "16px",
        margin: 0,
        overflow: "auto",
        fontSize: "13px",
        lineHeight: 1.6,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        color: "#e6edf3",
      }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function EndpointCard({ endpoint }: { endpoint: typeof ENDPOINTS[number] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      id={endpoint.id}
      style={{
        background: "#111827",
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.08)",
        overflow: "hidden",
        transition: "all 0.3s",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%",
          padding: "24px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          color: "white",
          textAlign: "left",
        }}
      >
        <MethodBadge method={endpoint.method} />
        <code style={{
          color: "#e6edf3",
          fontSize: "14px",
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          flex: 1,
        }}>
          {endpoint.path}
        </code>
        <span style={{
          color: "#6b7280",
          fontSize: "14px",
          marginRight: "8px",
          display: "none",
        }}>
          {endpoint.title}
        </span>
        <span style={{
          color: "#6b7280",
          transition: "transform 0.3s",
          transform: expanded ? "rotate(180deg)" : "rotate(0)",
          fontSize: "18px",
        }}>
          ▾
        </span>
      </button>

      {/* Description line */}
      <div style={{
        padding: "0 24px 16px",
        borderBottom: expanded ? "1px solid rgba(255,255,255,0.06)" : "none",
      }}>
        <p style={{ color: "#9ca3af", fontSize: "14px", margin: 0 }}>
          {endpoint.title} — {endpoint.description}
        </p>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div style={{ padding: "24px" }}>
          {/* Parameters */}
          {endpoint.params.length > 0 && (
            <div style={{ marginBottom: "28px" }}>
              <h4 style={{ fontSize: "13px", color: "#0ea5e9", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px" }}>
                Parâmetros
              </h4>
              <div style={{
                background: "#0d1117",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.06)",
                overflow: "hidden",
              }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Campo</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Tipo</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Obrigatório</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Descrição</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endpoint.params.map((p, i) => (
                      <tr key={i} style={{ borderBottom: i < endpoint.params.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                        <td style={{ padding: "12px 16px" }}>
                          <code style={{ color: "#22c55e", fontFamily: "'JetBrains Mono', monospace", fontSize: "13px" }}>{p.name}</code>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ color: "#f59e0b", fontSize: "12px", fontFamily: "monospace" }}>{p.type}</span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {p.required ? (
                            <span style={{ color: "#ef4444", fontSize: "12px", fontWeight: 600 }}>Sim</span>
                          ) : (
                            <span style={{ color: "#6b7280", fontSize: "12px" }}>Não</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#9ca3af", fontSize: "13px" }}>{p.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Examples */}
          <div style={{ marginBottom: "28px" }}>
            <h4 style={{ fontSize: "13px", color: "#0ea5e9", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px" }}>
              Exemplos
            </h4>
            {endpoint.examples.map((ex, i) => (
              <CodeBlock key={i} code={ex.code} title={ex.title} />
            ))}
          </div>

          {/* Response */}
          <div>
            <h4 style={{ fontSize: "13px", color: "#0ea5e9", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px" }}>
              Resposta (200 OK)
            </h4>
            <CodeBlock code={endpoint.response} title="application/json" />
          </div>
        </div>
      )}
    </div>
  );
}

// ========================================
// PAGE
// ========================================
export default function DocsPage() {
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        
        :root {
          --primary: #0ea5e9;
          --primary-dark: #0284c7;
          --accent: #22c55e;
          --dark: #0a0f1a;
          --dark-card: #111827;
          --gray: #6b7280;
          --gray-light: #9ca3af;
          --white: #ffffff;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', system-ui, sans-serif;
          background: var(--dark);
          color: var(--white);
          line-height: 1.6;
          overflow-x: hidden;
        }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: var(--dark); }
        ::-webkit-scrollbar-thumb { background: #374151; border-radius: 3px; }

        html { scroll-behavior: smooth; }
      `}</style>

      {/* Header */}
      <header style={{
        padding: "16px 0",
        position: "fixed",
        width: "100%",
        top: 0,
        zIndex: 100,
        background: "rgba(10, 15, 26, 0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
      }}>
        <div style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Image
              src="/logos/logo_acutis_White.png"
              alt="Acutis"
              width={110}
              height={32}
              style={{ height: "auto" }}
            />
            <span style={{
              background: "rgba(14, 165, 233, 0.15)",
              color: "#0ea5e9",
              padding: "4px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
            }}>
              DOCS
            </span>
          </div>

          <nav style={{ display: "flex", gap: "24px", alignItems: "center" }}>
            <a href="#endpoints" style={{ color: "#9ca3af", textDecoration: "none", fontSize: "14px", fontWeight: 500, transition: "color 0.2s" }}>
              Endpoints
            </a>
            <a href="#autenticacao" style={{ color: "#9ca3af", textDecoration: "none", fontSize: "14px", fontWeight: 500 }}>
              Auth
            </a>
            <a href="#n8n" style={{ color: "#9ca3af", textDecoration: "none", fontSize: "14px", fontWeight: 500 }}>
              N8N
            </a>
            <a href="#funcionamento" style={{ color: "#9ca3af", textDecoration: "none", fontSize: "14px", fontWeight: 500 }}>
              Como Funciona
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section style={{
        paddingTop: "140px",
        paddingBottom: "80px",
        background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(14, 165, 233, 0.12), transparent)",
      }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{
            display: "inline-block",
            background: "rgba(14, 165, 233, 0.1)",
            color: "#0ea5e9",
            padding: "6px 14px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            marginBottom: "20px",
          }}>
            Documentação da API
          </div>
          <h1 style={{
            fontSize: "48px",
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: "20px",
            letterSpacing: "-1px",
          }}>
            API de Análise <span style={{ color: "#0ea5e9" }}>Acutis</span>
          </h1>
          <p style={{
            fontSize: "18px",
            color: "#9ca3af",
            maxWidth: "600px",
            lineHeight: 1.7,
            marginBottom: "32px",
          }}>
            Documentação completa dos endpoints de análise automática de conversas via WhatsApp. Inclui exemplos de uso, configuração N8N e troubleshooting.
          </p>

          {/* Quick Info Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", maxWidth: "800px" }}>
            <div style={{
              background: "#111827",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              padding: "20px",
            }}>
              <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Base URL</div>
              <code style={{ color: "#22c55e", fontSize: "13px", fontFamily: "'JetBrains Mono', monospace" }}>{BASE_URL}</code>
            </div>
            <div style={{
              background: "#111827",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              padding: "20px",
            }}>
              <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Content-Type</div>
              <code style={{ color: "#f59e0b", fontSize: "13px", fontFamily: "'JetBrains Mono', monospace" }}>application/json</code>
            </div>
            <div style={{
              background: "#111827",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              padding: "20px",
            }}>
              <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Autenticação</div>
              <code style={{ color: "#0ea5e9", fontSize: "13px", fontFamily: "'JetBrains Mono', monospace" }}>Bearer Token</code>
            </div>
          </div>
        </div>
      </section>

      {/* Autenticação */}
      <section id="autenticacao" style={{ padding: "60px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "24px" }}>🔐</span> Autenticação
          </h2>
          <p style={{ color: "#9ca3af", fontSize: "15px", marginBottom: "24px", maxWidth: "700px" }}>
            A autenticação é feita via <strong style={{ color: "white" }}>Bearer Token</strong> no header Authorization. Se a variável <code style={{ color: "#22c55e", background: "rgba(34,197,94,0.1)", padding: "2px 6px", borderRadius: "4px" }}>ANALYZE_API_TOKEN</code> não estiver configurada na Vercel, os endpoints funcionam sem autenticação.
          </p>
          <CodeBlock
            code={`# Header obrigatório (quando token configurado)
Authorization: Bearer seu_token_secreto

# Exemplo com curl
curl -X POST "${BASE_URL}/api/cron/analyze" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer seu_token_secreto" \\
  -d '{"maxPerCompany": 20}'`}
            title="Exemplo de autenticação"
          />

          {/* Status Codes */}
          <h3 style={{ fontSize: "16px", fontWeight: 600, marginTop: "32px", marginBottom: "16px", color: "#9ca3af" }}>Códigos de Status</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
            {STATUS_CODES.map((s) => (
              <div key={s.code} style={{
                background: "#111827",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "10px",
                padding: "16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}>
                <span style={{
                  background: `${s.color}20`,
                  color: s.color,
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontFamily: "monospace",
                  fontSize: "13px",
                  fontWeight: 700,
                }}>
                  {s.code}
                </span>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600 }}>{s.label}</div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>{s.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Endpoints */}
      <section id="endpoints" style={{ padding: "60px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "24px" }}>⚡</span> Endpoints
          </h2>
          <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "32px" }}>
            Clique em um endpoint para expandir os detalhes, parâmetros e exemplos.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {ENDPOINTS.map((ep) => (
              <EndpointCard key={ep.id} endpoint={ep} />
            ))}
          </div>
        </div>
      </section>

      {/* N8N Setup */}
      <section id="n8n" style={{
        padding: "60px 0",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(14, 165, 233, 0.03)",
      }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "24px" }}>🔄</span> Configuração N8N
          </h2>
          <p style={{ color: "#9ca3af", fontSize: "15px", marginBottom: "32px", maxWidth: "700px" }}>
            O workflow do N8N precisa de apenas 2 nós: um Schedule Trigger e um HTTP Request.
          </p>

          {/* Flow Diagram */}
          <div style={{
            background: "#111827",
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.08)",
            padding: "40px",
            marginBottom: "32px",
            textAlign: "center",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "24px",
              flexWrap: "wrap",
            }}>
              <div style={{
                background: "rgba(14, 165, 233, 0.1)",
                border: "2px solid rgba(14, 165, 233, 0.3)",
                borderRadius: "12px",
                padding: "20px 28px",
              }}>
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>⏰</div>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>Schedule Trigger</div>
                <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>A cada 2h (08-20h)</div>
              </div>
              <div style={{ color: "#0ea5e9", fontSize: "24px" }}>→</div>
              <div style={{
                background: "rgba(34, 197, 94, 0.1)",
                border: "2px solid rgba(34, 197, 94, 0.3)",
                borderRadius: "12px",
                padding: "20px 28px",
              }}>
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>🌐</div>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>HTTP Request</div>
                <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>POST /api/cron/analyze</div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "white" }}>Nó 1: Schedule Trigger</h3>
              <CodeBlock
                code={`Tipo: Cron
Expressão: 0 8,10,12,14,16,18,20 * * *
Timezone: America/Sao_Paulo

// Roda a cada 2h entre 08h e 20h`}
                title="Configuração"
              />
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "white" }}>Nó 2: HTTP Request</h3>
              <CodeBlock
                code={`Method: POST
URL: ${BASE_URL}/api/cron/analyze
Content-Type: application/json
Timeout: 60000 (60s)

Body:
{
  "maxPerCompany": 20,
  "maxTotal": 100,
  "fromDate": "2026-01-01"
}`}
                title="Configuração"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Funcionamento Interno */}
      <section id="funcionamento" style={{ padding: "60px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "32px", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "24px" }}>🧠</span> Funcionamento Interno
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
            {/* Prioridade */}
            <div style={{
              background: "#111827",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.08)",
              padding: "28px",
            }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>🎯</span> Prioridade de Análise
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  background: "rgba(14, 165, 233, 0.08)",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "1px solid rgba(14, 165, 233, 0.15)",
                }}>
                  <span style={{ color: "#0ea5e9", fontWeight: 700, fontSize: "18px" }}>1º</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "14px" }}>Tráfego Pago</div>
                    <div style={{ color: "#6b7280", fontSize: "12px" }}>Facebook Ads, Instagram Ads, Google Ads</div>
                  </div>
                </div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  background: "rgba(255,255,255,0.03)",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <span style={{ color: "#6b7280", fontWeight: 700, fontSize: "18px" }}>2º</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "14px" }}>Orgânico</div>
                    <div style={{ color: "#6b7280", fontSize: "12px" }}>Leads sem rastreamento de campanha</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lógica Mensagens */}
            <div style={{
              background: "#111827",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.08)",
              padding: "28px",
            }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>📬</span> Quando um Chat é Analisado?
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}>
                  <span style={{ color: "#22c55e", fontSize: "16px" }}>✓</span>
                  <span style={{ color: "#9ca3af" }}>Chat <strong style={{ color: "white" }}>nunca analisado</strong> → Entra na fila</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}>
                  <span style={{ color: "#22c55e", fontSize: "16px" }}>✓</span>
                  <span style={{ color: "#9ca3af" }}>Chat analisado + <strong style={{ color: "white" }}>mensagens novas</strong> → Entra na fila</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}>
                  <span style={{ color: "#ef4444", fontSize: "16px" }}>✗</span>
                  <span style={{ color: "#9ca3af" }}>Chat analisado + <strong style={{ color: "white" }}>sem novidades</strong> → Ignorado</span>
                </div>
              </div>
              <div style={{
                marginTop: "16px",
                padding: "12px",
                background: "rgba(14, 165, 233, 0.08)",
                borderRadius: "8px",
                border: "1px solid rgba(14, 165, 233, 0.12)",
                fontSize: "12px",
                color: "#9ca3af",
              }}>
                💡 A verificação usa o <code style={{ color: "#0ea5e9" }}>msg_fim_id</code> da última análise como cursor.
              </div>
            </div>
          </div>

          {/* Limites */}
          <div style={{
            background: "#111827",
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.08)",
            padding: "28px",
            marginBottom: "32px",
          }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>🛡️</span> Limites de Segurança
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
              {[
                { label: "maxPerCompany", value: "20", desc: "Chats por empresa por fase" },
                { label: "maxTotal", value: "100", desc: "Chats totais por execução" },
                { label: "Time Budget", value: "250s", desc: "Para 50s antes do timeout" },
                { label: "Rate Limit", value: "5s", desc: "Delay entre cada análise" },
              ].map((l) => (
                <div key={l.label} style={{
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "10px",
                  padding: "16px",
                  border: "1px solid rgba(255,255,255,0.04)",
                }}>
                  <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>{l.label}</div>
                  <div style={{ fontSize: "20px", fontWeight: 700 }}>{l.value}</div>
                  <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>{l.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabelas */}
          <div style={{
            background: "#111827",
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.08)",
            padding: "28px",
          }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>🗄️</span> Tabelas Envolvidas
            </h3>
            <div style={{
              background: "#0d1117",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.06)",
              overflow: "hidden",
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>Tabela</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>Uso</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { table: "config_empresas", desc: "Lista de empresas ativas e suas configurações" },
                    { table: "mensagens_clientes", desc: "Mensagens recebidas do WhatsApp" },
                    { table: "analises_conversas", desc: "Análises geradas pela IA" },
                    { table: "lead_tracking", desc: "Rastreamento de origem dos leads (pago/orgânico)" },
                  ].map((t, i) => (
                    <tr key={i} style={{ borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <code style={{ color: "#22c55e", fontFamily: "'JetBrains Mono', monospace", fontSize: "13px" }}>{t.table}</code>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#9ca3af", fontSize: "13px" }}>{t.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Env Vars */}
      <section style={{ padding: "60px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "24px" }}>🔧</span> Variáveis de Ambiente
          </h2>
          <div style={{
            background: "#111827",
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}>
            <div style={{
              background: "#0d1117",
              borderRadius: "10px",
              overflow: "hidden",
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>Variável</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>Obrigatória</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "GOOGLE_GENERATIVE_AI_API_KEY", required: true, desc: "Chave da API do Google Gemini" },
                    { name: "NEXT_PUBLIC_SUPABASE_URL", required: true, desc: "URL do projeto Supabase" },
                    { name: "SUPABASE_SERVICE_ROLE_KEY", required: true, desc: "Chave de serviço do Supabase (admin)" },
                    { name: "ANALYZE_API_TOKEN", required: false, desc: "Token de autenticação dos endpoints" },
                  ].map((v, i) => (
                    <tr key={i} style={{ borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <code style={{ color: "#f59e0b", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" }}>{v.name}</code>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {v.required ? (
                          <span style={{ color: "#22c55e", fontSize: "12px", fontWeight: 600 }}>✓ Sim</span>
                        ) : (
                          <span style={{ color: "#6b7280", fontSize: "12px" }}>Opcional</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", color: "#9ca3af", fontSize: "13px" }}>{v.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: "32px 0",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px" }}>
          <p style={{ fontSize: "13px", color: "#6b7280" }}>
            © 2026 Acutis — Documentação da API v1.0
          </p>
        </div>
      </footer>
    </>
  );
}
