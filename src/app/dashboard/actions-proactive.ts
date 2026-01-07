"use server";

import { getKPIs, getGargalos, getTopObjecoes } from "./actions";

export interface AnaliseProativa {
  temAlerta: boolean;
  nivel: "info" | "warning" | "critical";
  titulo: string;
  mensagem: string;
  sugestao: string;
}

export async function analisarSaudeNegocio(ownerId: string): Promise<AnaliseProativa[]> {
  const alerts: AnaliseProativa[] = [];
  
  // 1. Pega os dados atuais
  const kpis = await getKPIs(ownerId);
  const gargalos = await getGargalos(ownerId);
  const objecoes = await getTopObjecoes(ownerId);

  // 2. Lógica de Alerta: Taxa de Sucesso Baixa
  if (kpis.totalLeads > 5 && kpis.taxaSucesso < 10) {
    alerts.push({
      temAlerta: true,
      nivel: "critical",
      titulo: "Conversão Crítica",
      mensagem: `Gestor, a taxa de sucesso está em apenas ${kpis.taxaSucesso}%. De ${kpis.totalLeads} leads, poucos converteram.`,
      sugestao: "Revise urgentemente os scripts de abordagem dos vendedores."
    });
  }

  // 3. Lógica de Alerta: Muitos Leads no Vácuo (Gargalos)
  const leadsVacuo = gargalos.find(g => g.tipo === "perdido")?.quantidade || 0;
  if (leadsVacuo > 3) {
    alerts.push({
      temAlerta: true,
      nivel: "warning",
      titulo: "Leads Esquecidos",
      mensagem: `Você tem ${leadsVacuo} leads marcados como 'Perdidos ou em Vácuo'.`,
      sugestao: "Aplique um 'dead lead script' ou mude o vendedor responsável por esses contatos."
    });
  }

  // 4. Lógica de Alerta: Nota de Atendimento Baixa
  if (kpis.notaMedia > 0 && kpis.notaMedia < 60) {
    alerts.push({
      temAlerta: true,
      nivel: "warning",
      titulo: "Nota Média Insuficiente",
      mensagem: `A qualidade do atendimento caiu. A nota média atual é ${kpis.notaMedia}/100.`,
      sugestao: "Ouça as gravações ou leia as transcrições para identificar falta de empatia ou técnica."
    });
  }

  // 5. Lógica de Alerta: Pico de Objeção de Preço
  const objPreco = objecoes.find(o => o.nome === "Preço");
  if (objPreco && objPreco.percentual > 40) {
    alerts.push({
      temAlerta: true,
      nivel: "info",
      titulo: "Objeção de Preço Elevada",
      mensagem: `${objPreco.percentual}% das suas objeções hoje são sobre Preço.`,
      sugestao: "Talvez seja a hora de treinar a equipe em 'Ancoragem de Valor' antes de falar o preço."
    });
  }

  return alerts;
}
