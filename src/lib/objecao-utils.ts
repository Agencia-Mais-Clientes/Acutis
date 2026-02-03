import { CategoriaObjecao, ObjecaoDetectada } from "./types";

/**
 * Categoriza uma objeção do formato legado (string) para uma das categorias predefinidas.
 * Esta função é a ÚNICA fonte de verdade para categorização de objeções legadas.
 * Deve ser usada tanto no TopObjecoes (contagem) quanto na TabelaAuditoria (filtragem).
 */
export function categorizarObjecaoLegado(texto: string): CategoriaObjecao {
  const t = texto.toLowerCase();
  
  // === ADIAMENTO (verificar PRIMEIRO por ter termos que aparecem em outras categorias) ===
  // "Postergamento (tempo)" deve ser adiamento, não tempo
  // "Vácuo (Indica falta de urgência ou valor percebido)" deve ser adiamento, não preco
  if (
    t.includes("posterg") ||
    t.includes("vácuo") ||
    t.includes("vacuo") ||
    t.includes("urgência") ||
    t.includes("urgencia") ||
    t.includes("pensar") ||
    t.includes("analisar") ||
    t.includes("depois") ||
    t.includes("mês que vem") ||
    t.includes("semana que vem") ||
    t.includes("momento") ||
    t.includes("agora não") ||
    t.includes("agora nao")
  ) {
    return "adiamento";
  }
  
  // === PREÇO ===
  if (
    t.includes("preço") ||
    t.includes("preco") ||
    t.includes("caro") ||
    t.includes("barato") ||
    t.includes("valor") ||
    t.includes("taxa") ||
    t.includes("custo") ||
    t.includes("orçamento") ||
    t.includes("orcamento") ||
    t.includes("dinheiro") ||
    t.includes("investimento") ||
    t.includes("pagar")
  ) {
    return "preco";
  }
  
  // === TEMPO/HORÁRIO ===
  if (
    t.includes("horário") ||
    t.includes("horario") ||
    t.includes("agenda") ||
    t.includes("tempo") ||
    t.includes("tarde") ||
    t.includes("cedo") ||
    t.includes("trabalho") ||
    t.includes("disponibilidade")
  ) {
    return "tempo";
  }
  
  // === LOCALIZAÇÃO ===
  if (
    t.includes("local") ||
    t.includes("longe") ||
    t.includes("distância") ||
    t.includes("distancia") ||
    t.includes("perto") ||
    t.includes("endereço") ||
    t.includes("endereco") ||
    t.includes("logística") ||
    t.includes("logistica")
  ) {
    return "localizacao";
  }
  
  // === SAÚDE ===
  if (
    t.includes("saúde") ||
    t.includes("saude") ||
    t.includes("lesão") ||
    t.includes("lesao") ||
    t.includes("médico") ||
    t.includes("medico") ||
    t.includes("joelho") ||
    t.includes("coluna") ||
    t.includes("grávida") ||
    t.includes("gravida") ||
    t.includes("cirurgia") ||
    t.includes("problema físico") ||
    t.includes("problema fisico") ||
    t.includes("dor")
  ) {
    return "saude";
  }
  
  // === MEDO DE COMPROMISSO ===
  if (
    t.includes("medo") ||
    t.includes("desisto") ||
    t.includes("desistir") ||
    t.includes("conseguir") ||
    t.includes("disciplina") ||
    t.includes("preguiça") ||
    t.includes("preguica")
  ) {
    return "compromisso";
  }
  
  // === CONSULTAR TERCEIROS ===
  if (
    t.includes("marido") ||
    t.includes("esposa") ||
    t.includes("mãe") ||
    t.includes("mae") ||
    t.includes("pai") ||
    t.includes("família") ||
    t.includes("familia") ||
    t.includes("consultar") ||
    t.includes("parceiro") ||
    t.includes("namorad")
  ) {
    return "consulta_terceiros";
  }
  
  // === FIDELIDADE/CONTRATO ===
  if (
    t.includes("fidelidade") ||
    t.includes("contrato") ||
    t.includes("multa") ||
    t.includes("período") ||
    t.includes("periodo") ||
    t.includes("cancelar") ||
    t.includes("compromisso contratual")
  ) {
    return "fidelidade";
  }
  
  // === CONCORRÊNCIA ===
  if (
    t.includes("outra academia") ||
    t.includes("concorrente") ||
    t.includes("concorrência") ||
    t.includes("concorrencia") ||
    t.includes("pesquisar") ||
    t.includes("opção") ||
    t.includes("opcao") ||
    t.includes("comparar") ||
    t.includes("alternativa")
  ) {
    return "concorrencia";
  }
  
  // === INTERESSE BAIXO ===
  // CUIDADO: "informação", "produto", "curso" NÃO indicam baixo interesse!
  // Quem pede informação sobre produto TEM interesse, só está perguntando.
  // Interesse baixo é quando a pessoa demonstra que não tem real intenção de comprar.
  if (
    t.includes("curiosidade") ||
    t.includes("só saber") ||
    t.includes("so saber") ||
    t.includes("talvez") ||
    t.includes("não sei se quero") ||
    t.includes("nao sei se quero") ||
    t.includes("só queria saber") ||
    t.includes("so queria saber") ||
    t.includes("não tenho certeza") ||
    t.includes("nao tenho certeza") ||
    t.includes("ainda não decidi") ||
    t.includes("ainda nao decidi")
  ) {
    return "interesse_baixo";
  }
  
  // === FALLBACK ===
  // Se contém "não posso", "não consigo", etc - ainda é adiamento
  if (t.includes("não") && (t.includes("posso") || t.includes("consigo") || t.includes("dá"))) {
    return "adiamento";
  }
  
  // Default: "outros" para não poluir categorias reais
  // "Informação de Produto", etc, caem aqui e não serão contados no ranking
  return "outros";
}

/**
 * Extrai a categoria de uma objeção, seja ela no formato novo (objeto) ou legado (string).
 */
export function getCategoriaObjecao(obj: string | ObjecaoDetectada): CategoriaObjecao {
  if (typeof obj === "object" && "categoria" in obj) {
    return obj.categoria;
  }
  return categorizarObjecaoLegado(obj);
}

/**
 * Verifica se uma objeção corresponde a uma categoria específica.
 */
export function objecaoMatchCategoria(obj: string | ObjecaoDetectada, categoria: CategoriaObjecao): boolean {
  return getCategoriaObjecao(obj) === categoria;
}
