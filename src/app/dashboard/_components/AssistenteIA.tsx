"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles, AlertTriangle } from "lucide-react";
import { analisarSaudeNegocio, AnaliseProativa } from "../actions-proactive";

interface AssistenteIAProps {
  ownerId: string;
  nomeEmpresa: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function AssistenteIA({ ownerId, nomeEmpresa }: AssistenteIAProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Olá! 👋 Sou o assistente de vendas da **${nomeEmpresa}** via **Acutis**.\n\nPosso te ajudar com:\n- Análise de desempenho\n- Ranking de vendedores\n- Objeções mais comuns\n- Leads travados\n\nComo posso ajudar?`,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [alerts, setAlerts] = useState<AnaliseProativa[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Análise Proativa ao carregar
  useEffect(() => {
    async function runProactiveAnalysis() {
      try {
        const result = await analisarSaudeNegocio(ownerId);
        setAlerts(result);
        
        // Se houver alerta crítico, adiciona uma mensagem do bot avisando
        const critical = result.find(a => a.nivel === "critical");
        if (critical) {
          const alertMessage: Message = {
            id: "proactive-alert",
            role: "assistant",
            content: `🚨 **ALERTA CRÍTICO: ${critical.titulo}**\n\n${critical.mensagem}\n\n**Sugestão da Acutis:** ${critical.sugestao}`,
          };
          setMessages(prev => {
            // Verifica se já não tem o alerta (para não duplicar em re-renders)
            if (prev.some(m => m.id === "proactive-alert")) return prev;
            return [...prev, alertMessage];
          });
        }
      } catch (error) {
        console.error("Erro na análise proativa:", error);
      }
    }
    runProactiveAnalysis();
  }, [ownerId]);

  const hasCriticalAlert = alerts.some(a => a.nivel === "critical" || a.nivel === "warning");

  // Auto scroll para última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          ownerId,
          nomeEmpresa,
        }),
      });

      if (!response.ok) throw new Error("Erro na resposta");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          assistantContent += chunk;
          
          setMessages((prev) => 
            prev.map((m) => 
              m.id === assistantMessage.id 
                ? { ...m, content: assistantContent }
                : m
            )
          );
        }
      }
    } catch (error) {
      console.error("Erro no chat:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Desculpe, ocorreu um erro. Tente novamente.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center z-50 ${
          isOpen
            ? "bg-gray-800 hover:bg-gray-700"
            : hasCriticalAlert 
              ? "bg-red-600 hover:bg-red-700 animate-pulse shadow-red-900/40"
              : "bg-green-600 hover:bg-green-700 shadow-green-900/40"
        }`}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <div className="relative">
            {hasCriticalAlert ? (
              <AlertTriangle className="h-6 w-6 text-white" />
            ) : (
              <MessageCircle className="h-6 w-6 text-white" />
            )}
            <Sparkles className="h-3 w-3 text-yellow-300 absolute -top-1 -right-1" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -left-1 w-4 h-4 bg-yellow-400 text-black text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#050505]">
                {alerts.length}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-[#0b0d11] border border-gray-800 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-[#0e1116] border-b border-gray-800 p-4 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-900/30">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white">Acutis IA</h3>
              <p className="text-[10px] text-gray-500">Powered by Gemini</p>
            </div>
          </div>

          {/* Messages */}
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-800" 
            ref={scrollRef}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <Avatar className="w-7 h-7 shrink-0">
                  <AvatarFallback
                    className={
                      message.role === "user"
                        ? "bg-blue-600 text-white text-xs"
                        : "bg-green-600 text-white text-xs"
                    }
                  >
                    {message.role === "user" ? (
                      <User className="h-3.5 w-3.5" />
                    ) : (
                      <Bot className="h-3.5 w-3.5" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    message.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-sm"
                      : "bg-[#1c2128] text-gray-300 rounded-tl-sm border border-gray-800"
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {formatMessage(message.content)}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-3">
                <Avatar className="w-7 h-7 shrink-0">
                  <AvatarFallback className="bg-green-600 text-white text-xs">
                    <Bot className="h-3.5 w-3.5" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-[#1c2128] rounded-2xl rounded-tl-sm px-4 py-2.5 border border-gray-800">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-gray-800 p-3 flex gap-2 bg-[#0e1116] shrink-0"
          >
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Pergunte algo..."
              className="flex-1 bg-[#050505] border-gray-700 text-white text-sm focus:border-green-500"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="bg-green-600 hover:bg-green-700"
              disabled={isLoading || !inputValue.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>

          {/* Sugestões rápidas */}
          <div className="border-t border-gray-800 px-3 py-2 bg-[#0a0c0f] flex gap-2 overflow-x-auto shrink-0">
            {[
              "📊 Resumo de hoje",
              "🏆 Ranking vendedores",
              "❌ Top objeções",
            ].map((sugestao) => (
              <button
                key={sugestao}
                onClick={() => setInputValue(sugestao)}
                className="px-3 py-1 text-[10px] bg-[#1c2128] hover:bg-[#252b36] text-gray-400 hover:text-white rounded-full border border-gray-800 whitespace-nowrap transition-colors"
              >
                {sugestao}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function formatMessage(content: string): React.ReactNode {
  // Formata markdown básico (bold)
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
