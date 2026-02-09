'use client';

import Image from "next/image";

// ========================================
// CONFIGURAÇÃO FÁCIL DE EDITAR
// ========================================
const WHATSAPP_VENDAS = "5511945739724";
const WHATSAPP_MESSAGE = encodeURIComponent("Olá! Quero conhecer a Acutis");
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_VENDAS}?text=${WHATSAPP_MESSAGE}`;

export default function VendasPage() {
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        :root {
          --primary: #0ea5e9;
          --primary-dark: #0284c7;
          --accent: #22c55e;
          --accent-dark: #16a34a;
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

        .container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* Header */
        header {
          padding: 16px 0;
          position: fixed;
          width: 100%;
          top: 0;
          z-index: 100;
          background: rgba(10, 15, 26, 0.95);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .header-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .cta-header {
          background: var(--accent);
          color: white;
          padding: 12px 28px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s;
        }

        .cta-header:hover {
          background: var(--accent-dark);
          transform: translateY(-1px);
        }

        /* Hero */
        .hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          padding: 120px 0 80px;
          background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(14, 165, 233, 0.15), transparent);
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }

        .hero-tag {
          display: inline-block;
          background: rgba(34, 197, 94, 0.15);
          color: var(--accent);
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .hero h1 {
          font-size: 52px;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 24px;
          letter-spacing: -1px;
        }

        .hero h1 .highlight {
          color: var(--accent);
        }

        .hero-desc {
          font-size: 18px;
          color: var(--gray-light);
          margin-bottom: 32px;
          line-height: 1.7;
        }

        .hero-ctas {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .btn-primary {
          background: var(--accent);
          color: white;
          padding: 16px 32px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 700;
          font-size: 16px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          background: var(--accent-dark);
          transform: translateY(-2px);
        }

        .btn-secondary {
          background: transparent;
          border: 2px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 14px 28px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          border-color: rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.05);
        }

        .hero-visual {
          background: var(--dark-card);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .dashboard-preview {
          background: linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(34, 197, 94, 0.05));
          border-radius: 12px;
          padding: 32px;
          text-align: center;
        }

        .preview-stat {
          margin-bottom: 24px;
        }

        .preview-stat-value {
          font-size: 64px;
          font-weight: 800;
          color: var(--accent);
        }

        .preview-stat-label {
          font-size: 14px;
          color: var(--gray-light);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .preview-metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .preview-metric {
          background: rgba(255, 255, 255, 0.03);
          padding: 16px;
          border-radius: 8px;
        }

        .preview-metric-value {
          font-size: 24px;
          font-weight: 700;
          color: white;
        }

        .preview-metric-label {
          font-size: 11px;
          color: var(--gray);
          margin-top: 4px;
        }

        /* Section */
        .section {
          padding: 100px 0;
        }

        .section-header {
          text-align: center;
          max-width: 700px;
          margin: 0 auto 60px;
        }

        .section-tag {
          display: inline-block;
          color: var(--primary);
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 16px;
        }

        .section-title {
          font-size: 42px;
          font-weight: 800;
          margin-bottom: 20px;
          letter-spacing: -1px;
        }

        .section-desc {
          font-size: 18px;
          color: var(--gray-light);
        }

        /* Pain Section */
        .pain-section {
          background: rgba(239, 68, 68, 0.03);
          border-top: 1px solid rgba(239, 68, 68, 0.1);
          border-bottom: 1px solid rgba(239, 68, 68, 0.1);
        }

        .pain-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .pain-card {
          background: var(--dark-card);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          padding: 28px;
        }

        .pain-icon {
          font-size: 32px;
          margin-bottom: 16px;
        }

        .pain-card h3 {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 10px;
          color: #f87171;
        }

        .pain-card p {
          font-size: 15px;
          color: var(--gray-light);
          line-height: 1.6;
        }

        /* Solution Section */
        .solution-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .solution-card {
          background: var(--dark-card);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 32px;
          transition: all 0.3s;
        }

        .solution-card:hover {
          border-color: var(--primary);
          transform: translateY(-4px);
        }

        .solution-icon {
          width: 56px;
          height: 56px;
          background: rgba(14, 165, 233, 0.15);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          margin-bottom: 20px;
        }

        .solution-card h3 {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .solution-card p {
          font-size: 15px;
          color: var(--gray-light);
          line-height: 1.6;
        }

        /* How it works */
        .steps-container {
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        .step {
          display: grid;
          grid-template-columns: 80px 1fr;
          gap: 32px;
          align-items: start;
        }

        .step-number {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 800;
        }

        .step-content h3 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .step-content p {
          font-size: 16px;
          color: var(--gray-light);
          line-height: 1.7;
        }

        /* Results */
        .results-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        .result-card {
          background: var(--dark-card);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 32px;
          text-align: center;
        }

        .result-value {
          font-size: 48px;
          font-weight: 800;
          color: var(--accent);
          margin-bottom: 8px;
        }

        .result-label {
          font-size: 14px;
          color: var(--gray-light);
        }

        /* CTA Final */
        .cta-section {
          background: linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(34, 197, 94, 0.1));
          border-radius: 24px;
          padding: 80px;
          text-align: center;
          margin: 0 24px;
        }

        .cta-section h2 {
          font-size: 42px;
          font-weight: 800;
          margin-bottom: 20px;
        }

        .cta-section p {
          font-size: 18px;
          color: var(--gray-light);
          margin-bottom: 36px;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .cta-button {
          background: var(--accent);
          color: white;
          padding: 20px 48px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 700;
          font-size: 18px;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s;
          box-shadow: 0 8px 32px rgba(34, 197, 94, 0.3);
        }

        .cta-button:hover {
          background: var(--accent-dark);
          transform: scale(1.02);
        }

        /* Footer */
        footer {
          padding: 40px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          text-align: center;
        }

        footer p {
          font-size: 14px;
          color: var(--gray);
        }

        /* Responsive */
        @media (max-width: 900px) {
          .hero-grid {
            grid-template-columns: 1fr;
          }

          .hero h1 {
            font-size: 36px;
          }

          .hero-visual {
            display: none;
          }

          .pain-grid {
            grid-template-columns: 1fr;
          }

          .solution-grid {
            grid-template-columns: 1fr;
          }

          .results-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .cta-section {
            padding: 48px 24px;
            margin: 0;
            border-radius: 0;
          }

          .cta-section h2 {
            font-size: 28px;
          }
        }
      `}</style>

      {/* Header */}
      <header>
        <div className="container header-inner">
          <Image
            src="/logos/logo_acutis_White.png"
            alt="Acutis"
            width={110}
            height={32}
            style={{ height: 'auto' }}
          />
          <a href={WHATSAPP_URL} className="cta-header" target="_blank" rel="noopener noreferrer">
            Falar com Especialista
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-grid">
            <div>
              <div className="hero-tag">Para Donos de Academia</div>
              <h1>
                Você está <span className="highlight">perdendo vendas</span> pelo WhatsApp sem saber
              </h1>
              <p className="hero-desc">
                A Acutis analisa todas as conversas da sua equipe e mostra exatamente onde os leads estão escapando. Sem achismo. Com dados reais.
              </p>
              <div className="hero-ctas">
                <a href={WHATSAPP_URL} className="btn-primary" target="_blank" rel="noopener noreferrer">
                  Quero Ver na Prática
                  <span>→</span>
                </a>
                <a href="#como-funciona" className="btn-secondary">
                  Como Funciona
                </a>
              </div>
            </div>
            <div className="hero-visual">
              <div className="dashboard-preview">
                <div className="preview-stat">
                  <div className="preview-stat-value">+32%</div>
                  <div className="preview-stat-label">Aumento em conversões</div>
                </div>
                <div className="preview-metrics">
                  <div className="preview-metric">
                    <div className="preview-metric-value">147</div>
                    <div className="preview-metric-label">Leads analisados</div>
                  </div>
                  <div className="preview-metric">
                    <div className="preview-metric-value">23</div>
                    <div className="preview-metric-label">Oportunidades</div>
                  </div>
                  <div className="preview-metric">
                    <div className="preview-metric-value">8</div>
                    <div className="preview-metric-label">Gargalos</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="section pain-section">
        <div className="container">
          <div className="section-header">
            <div className="section-tag" style={{ color: '#f87171' }}>O Problema</div>
            <h2 className="section-title">Você sabe o que sua equipe responde aos leads?</h2>
            <p className="section-desc">
              A maioria dos gestores só descobre que perdeu uma venda quando já é tarde demais
            </p>
          </div>
          <div className="pain-grid">
            <div className="pain-card">
              <div className="pain-icon">🕳️</div>
              <h3>Leads no Vácuo</h3>
              <p>Vendedores demoram horas para responder. Quando vão falar, o lead já fechou com a concorrência.</p>
            </div>
            <div className="pain-card">
              <div className="pain-icon">🎭</div>
              <h3>Atendimento Inconsistente</h3>
              <p>Cada um atende de um jeito. Sem padrão, sem script. Você nunca sabe se foi bem ou mal.</p>
            </div>
            <div className="pain-card">
              <div className="pain-icon">📊</div>
              <h3>Zero Visibilidade</h3>
              <p>Quantos leads entraram essa semana? Quantos foram atendidos? Por que perdemos tantos? Mistério.</p>
            </div>
            <div className="pain-card">
              <div className="pain-icon">💸</div>
              <h3>Dinheiro no Lixo</h3>
              <p>Você investe pesado em tráfego pago mas não sabe se os leads estão sendo bem atendidos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="section" id="solucao">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">A Solução</div>
            <h2 className="section-title">Acutis: Raio-X do seu Atendimento</h2>
            <p className="section-desc">
              Análise automática de todas as conversas. Você vê tudo que acontece no WhatsApp da sua equipe.
            </p>
          </div>
          <div className="solution-grid">
            <div className="solution-card">
              <div className="solution-icon">📊</div>
              <h3>Funil Completo</h3>
              <p>Veja quantos leads entraram, quantos avançaram e em qual etapa cada um está. Em tempo real.</p>
            </div>
            <div className="solution-card">
              <div className="solution-icon">🔍</div>
              <h3>Gargalos Claros</h3>
              <p>Descubra exatamente onde sua equipe está perdendo vendas. Leads esquecidos, objeções não tratadas, follow-up atrasado.</p>
            </div>
            <div className="solution-card">
              <div className="solution-icon">⭐</div>
              <h3>Nota de Atendimento</h3>
              <p>Cada conversa recebe uma nota de 0 a 100. Você sabe quem está mandando bem e quem precisa melhorar.</p>
            </div>
            <div className="solution-card">
              <div className="solution-icon">🎯</div>
              <h3>Top Objeções</h3>
              <p>Saiba quais são as objeções mais comuns: preço, horário, localização. E prepare sua equipe para contornar.</p>
            </div>
            <div className="solution-card">
              <div className="solution-icon">📱</div>
              <h3>Relatório Semanal</h3>
              <p>Todo domingo você recebe um resumo no WhatsApp: vendas, oportunidades perdidas, alertas importantes.</p>
            </div>
            <div className="solution-card">
              <div className="solution-icon">🚨</div>
              <h3>Alertas Proativos</h3>
              <p>A Acutis te avisa quando um lead quente está esfriando. Você age antes de perder a venda.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section" id="como-funciona" style={{ background: 'rgba(14, 165, 233, 0.03)' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-tag">Como Funciona</div>
            <h2 className="section-title">Simples de Começar</h2>
            <p className="section-desc">
              Em menos de 24 horas você já está monitorando seu time
            </p>
          </div>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Conectamos ao seu WhatsApp</h3>
                <p>Integramos de forma segura com o WhatsApp da sua equipe. Seus vendedores nem percebem que a ferramenta está rodando. Sem mudar a rotina de ninguém.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>A Acutis lê e analisa tudo</h3>
                <p>Cada conversa é analisada automaticamente. Tempo de resposta, qualidade do atendimento, objeções detectadas, próximo passo sugerido.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Você toma decisões com dados</h3>
                <p>Acesse o dashboard e veja o panorama completo. Quem está vendendo, quem está deixando escapar, quais leads precisam de atenção agora.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div className="section-tag" style={{ color: 'var(--accent)' }}>Resultados</div>
            <h2 className="section-title">O que Nossos Clientes Estão Vendo</h2>
          </div>
          <div className="results-grid">
            <div className="result-card">
              <div className="result-value">+30%</div>
              <div className="result-label">Aumento em conversões</div>
            </div>
            <div className="result-card">
              <div className="result-value">100%</div>
              <div className="result-label">Conversas analisadas</div>
            </div>
            <div className="result-card">
              <div className="result-value">-50%</div>
              <div className="result-label">Tempo monitorando</div>
            </div>
            <div className="result-card">
              <div className="result-value">24h</div>
              <div className="result-label">Para começar a usar</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="section">
        <div className="cta-section">
          <h2>Pronto para parar de perder vendas?</h2>
          <p>
            Agende uma demonstração gratuita. Vamos analisar algumas conversas reais da sua equipe e te mostrar onde estão as oportunidades.
          </p>
          <a href={WHATSAPP_URL} className="cta-button" target="_blank" rel="noopener noreferrer">
            Agendar Demonstração Gratuita
            <span>→</span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="container">
          <p>© 2026 Acutis. Análise Inteligente de Atendimentos.</p>
        </div>
      </footer>
    </>
  );
}
