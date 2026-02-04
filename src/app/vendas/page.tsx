'use client';

export default function VendasPage() {
  return (
    <>
      <style jsx global>{`
        :root {
          --primary: #6366f1;
          --primary-dark: #4f46e5;
          --primary-light: #818cf8;
          --secondary: #0ea5e9;
          --success: #22c55e;
          --warning: #f59e0b;
          --danger: #ef4444;
          --dark: #0f172a;
          --dark-light: #1e293b;
          --gray: #64748b;
          --light: #f1f5f9;
          --white: #ffffff;
          --gradient-primary: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
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

        .bg-grid {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image:
            linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          pointer-events: none;
          z-index: 0;
        }

        .floating-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.4;
          pointer-events: none;
          z-index: 0;
        }

        .orb-1 {
          width: 500px;
          height: 500px;
          background: var(--primary);
          top: -150px;
          right: -150px;
          animation: float 8s ease-in-out infinite;
        }

        .orb-2 {
          width: 400px;
          height: 400px;
          background: var(--secondary);
          bottom: 5%;
          left: -100px;
          animation: float 10s ease-in-out infinite reverse;
        }

        .orb-3 {
          width: 300px;
          height: 300px;
          background: #a855f7;
          top: 50%;
          right: 10%;
          animation: float 12s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -30px) scale(1.05); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.6; }
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          position: relative;
          z-index: 1;
        }

        header {
          padding: 20px 0;
          position: fixed;
          width: 100%;
          top: 0;
          z-index: 100;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          font-size: 32px;
          font-weight: 800;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -1px;
        }

        .cta-header {
          background: var(--gradient-primary);
          color: white;
          padding: 14px 32px;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
        }

        .cta-header:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 8px 30px rgba(99, 102, 241, 0.5);
        }

        .hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          padding: 140px 0 100px;
          position: relative;
        }

        .hero-content {
          max-width: 750px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.3);
          padding: 10px 20px;
          border-radius: 50px;
          font-size: 14px;
          font-weight: 600;
          color: var(--primary-light);
          margin-bottom: 28px;
          animation: pulse 3s ease-in-out infinite;
        }

        .hero h1 {
          font-size: clamp(44px, 7vw, 72px);
          font-weight: 800;
          line-height: 1.05;
          margin-bottom: 28px;
          letter-spacing: -2px;
        }

        .hero h1 span {
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: 22px;
          color: var(--gray);
          margin-bottom: 44px;
          max-width: 580px;
          line-height: 1.7;
        }

        .hero-ctas {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }

        .btn-primary {
          background: var(--gradient-primary);
          color: white;
          padding: 18px 40px;
          border-radius: 14px;
          text-decoration: none;
          font-weight: 700;
          font-size: 17px;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 25px rgba(99, 102, 241, 0.4);
        }

        .btn-primary:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 12px 40px rgba(99, 102, 241, 0.5);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.15);
          color: white;
          padding: 18px 40px;
          border-radius: 14px;
          text-decoration: none;
          font-weight: 600;
          font-size: 17px;
          transition: all 0.3s ease;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        .hero-stats {
          display: flex;
          gap: 56px;
          margin-top: 70px;
          padding-top: 50px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stat {
          text-align: left;
        }

        .stat-value {
          font-size: 42px;
          font-weight: 800;
          color: var(--white);
          display: flex;
          align-items: center;
        }

        .stat-value span {
          color: var(--success);
        }

        .stat-label {
          font-size: 15px;
          color: var(--gray);
          margin-top: 6px;
        }

        .section {
          padding: 120px 0;
        }

        .section-dark {
          background: rgba(0, 0, 0, 0.4);
        }

        .section-header {
          text-align: center;
          max-width: 750px;
          margin: 0 auto 70px;
        }

        .section-badge {
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 3px;
          margin-bottom: 20px;
        }

        .section-title {
          font-size: clamp(36px, 5vw, 54px);
          font-weight: 800;
          margin-bottom: 24px;
          letter-spacing: -1px;
        }

        .section-subtitle {
          font-size: 19px;
          color: var(--gray);
          line-height: 1.7;
        }

        .pain-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 28px;
        }

        .pain-card {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(239, 68, 68, 0.02) 100%);
          border: 1px solid rgba(239, 68, 68, 0.25);
          border-radius: 24px;
          padding: 36px;
          transition: all 0.4s ease;
        }

        .pain-card:hover {
          transform: translateY(-8px);
          border-color: rgba(239, 68, 68, 0.5);
          box-shadow: 0 20px 40px rgba(239, 68, 68, 0.1);
        }

        .pain-icon {
          width: 60px;
          height: 60px;
          background: rgba(239, 68, 68, 0.2);
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          margin-bottom: 24px;
        }

        .pain-card h3 {
          font-size: 21px;
          font-weight: 700;
          margin-bottom: 14px;
        }

        .pain-card p {
          color: var(--gray);
          font-size: 16px;
          line-height: 1.6;
        }

        .solution-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
          gap: 36px;
        }

        .solution-card {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.05) 100%);
          border: 1px solid rgba(99, 102, 241, 0.25);
          border-radius: 28px;
          padding: 44px;
          transition: all 0.4s ease;
          position: relative;
          overflow: hidden;
        }

        .solution-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: var(--gradient-primary);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .solution-card:hover {
          transform: translateY(-10px);
          border-color: rgba(99, 102, 241, 0.5);
          box-shadow: 0 25px 50px rgba(99, 102, 241, 0.2);
        }

        .solution-card:hover::before {
          opacity: 1;
        }

        .solution-icon {
          width: 72px;
          height: 72px;
          background: var(--gradient-primary);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          margin-bottom: 28px;
          box-shadow: 0 10px 25px rgba(99, 102, 241, 0.35);
        }

        .solution-card h3 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 18px;
        }

        .solution-card > p {
          color: var(--gray);
          font-size: 16px;
          margin-bottom: 24px;
          line-height: 1.6;
        }

        .solution-features {
          list-style: none;
        }

        .solution-features li {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          font-size: 15px;
          color: rgba(255, 255, 255, 0.85);
        }

        .check-icon {
          color: var(--success);
          font-weight: bold;
          font-size: 16px;
        }

        .steps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 48px;
          margin-top: 70px;
        }

        .step {
          text-align: center;
          position: relative;
        }

        .step-number {
          width: 90px;
          height: 90px;
          background: var(--gradient-primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          font-weight: 800;
          margin: 0 auto 28px;
          box-shadow: 0 15px 40px rgba(99, 102, 241, 0.45);
        }

        .step h3 {
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 14px;
        }

        .step p {
          color: var(--gray);
          font-size: 16px;
          line-height: 1.6;
        }

        .diff-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 28px;
        }

        .diff-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 32px;
          display: flex;
          align-items: flex-start;
          gap: 24px;
          transition: all 0.3s ease;
        }

        .diff-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(99, 102, 241, 0.4);
          transform: translateX(8px);
        }

        .diff-icon {
          width: 54px;
          height: 54px;
          background: var(--gradient-primary);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          flex-shrink: 0;
        }

        .diff-content h4 {
          font-size: 19px;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .diff-content p {
          color: var(--gray);
          font-size: 15px;
          line-height: 1.5;
        }

        .scripts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(520px, 1fr));
          gap: 36px;
        }

        .script-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          overflow: hidden;
        }

        .script-header {
          background: var(--gradient-primary);
          padding: 24px 32px;
        }

        .script-header h4 {
          font-size: 20px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .script-body {
          padding: 32px;
        }

        .objection {
          background: rgba(239, 68, 68, 0.12);
          border-left: 4px solid var(--danger);
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 20px;
        }

        .objection strong {
          color: var(--danger);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .objection p {
          margin-top: 10px;
          font-style: italic;
          color: rgba(255, 255, 255, 0.85);
          font-size: 16px;
        }

        .response {
          background: rgba(34, 197, 94, 0.12);
          border-left: 4px solid var(--success);
          padding: 20px;
          border-radius: 12px;
        }

        .response strong {
          color: var(--success);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .response p {
          margin-top: 10px;
          color: rgba(255, 255, 255, 0.95);
          font-size: 15px;
          line-height: 1.7;
        }

        .pricing-card {
          max-width: 650px;
          margin: 0 auto;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(168, 85, 247, 0.12) 100%);
          border: 2px solid rgba(99, 102, 241, 0.35);
          border-radius: 36px;
          padding: 70px 56px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .pricing-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 250px;
          height: 4px;
          background: var(--gradient-primary);
        }

        .pricing-badge {
          display: inline-block;
          background: var(--success);
          color: var(--dark);
          padding: 10px 24px;
          border-radius: 50px;
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 28px;
        }

        .pricing-title {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 18px;
        }

        .pricing-subtitle {
          color: var(--gray);
          font-size: 18px;
          margin-bottom: 36px;
          line-height: 1.6;
        }

        .pricing-cta {
          background: var(--gradient-primary);
          color: white;
          padding: 20px 56px;
          border-radius: 16px;
          text-decoration: none;
          font-weight: 700;
          font-size: 19px;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          transition: all 0.3s ease;
          box-shadow: 0 10px 35px rgba(99, 102, 241, 0.45);
        }

        .pricing-cta:hover {
          transform: scale(1.06);
          box-shadow: 0 15px 50px rgba(99, 102, 241, 0.55);
        }

        footer {
          padding: 50px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          text-align: center;
        }

        footer p {
          color: var(--gray);
          font-size: 15px;
        }

        @media (max-width: 768px) {
          .hero-stats {
            flex-direction: column;
            gap: 28px;
          }

          .diff-grid {
            grid-template-columns: 1fr;
          }

          .scripts-grid {
            grid-template-columns: 1fr;
          }

          .solution-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="bg-grid" />
      <div className="floating-orb orb-1" />
      <div className="floating-orb orb-2" />
      <div className="floating-orb orb-3" />

      {/* Header */}
      <header>
        <div className="container header-content">
          <div className="logo">Acutis</div>
          <a href="#contato" className="cta-header">Agendar Demo</a>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="badge">📊 Análise Inteligente de Atendimentos</div>
            <h1>
              Sua equipe está<br />
              <span>perdendo vendas</span><br />
              sem você saber
            </h1>
            <p className="hero-subtitle">
              A Acutis analisa todas as conversas do seu WhatsApp e mostra 
              exatamente onde suas vendas estão escapando — e como recuperá-las.
            </p>
            <div className="hero-ctas">
              <a href="#contato" className="btn-primary">
                Quero Ver na Prática
                <span>→</span>
              </a>
              <a href="#como-funciona" className="btn-secondary">
                Como Funciona
              </a>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <div className="stat-value">+<span>30%</span></div>
                <div className="stat-label">Aumento em conversões</div>
              </div>
              <div className="stat">
                <div className="stat-value"><span>100%</span></div>
                <div className="stat-label">Atendimentos analisados</div>
              </div>
              <div className="stat">
                <div className="stat-value"><span>📱</span></div>
                <div className="stat-label">Relatórios semanais no WhatsApp</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="section section-dark">
        <div className="container">
          <div className="section-header">
            <div className="section-badge" style={{ color: 'var(--danger)' }}>⚠️ O Problema</div>
            <h2 className="section-title">Você sabe o que sua equipe responde para seus leads?</h2>
            <p className="section-subtitle">
              A maioria dos gestores só descobre que perdeu uma venda quando já é tarde demais
            </p>
          </div>
          <div className="pain-grid">
            <div className="pain-card">
              <div className="pain-icon">🕳️</div>
              <h3>Leads no Vácuo</h3>
              <p>Vendedores demoram horas para responder e o lead esfria. Você só descobre depois que já perdeu.</p>
            </div>
            <div className="pain-card">
              <div className="pain-icon">🎭</div>
              <h3>Atendimento Inconsistente</h3>
              <p>Cada vendedor atende de um jeito. Sem padrão, sem script, sem controle de qualidade.</p>
            </div>
            <div className="pain-card">
              <div className="pain-icon">📊</div>
              <h3>Zero Visibilidade</h3>
              <p>Você não sabe quantos leads entraram, quantos foram atendidos, ou por que foram perdidos.</p>
            </div>
            <div className="pain-card">
              <div className="pain-icon">🔥</div>
              <h3>Objeções Não Tratadas</h3>
              <p>"Tá caro", "Vou pensar"... Seu vendedor não sabe contornar e você perde a venda.</p>
            </div>
            <div className="pain-card">
              <div className="pain-icon">⏰</div>
              <h3>Tempo Perdido</h3>
              <p>Você gasta horas lendo conversas manualmente para tentar entender o que está acontecendo.</p>
            </div>
            <div className="pain-card">
              <div className="pain-icon">💸</div>
              <h3>Dinheiro Jogado Fora</h3>
              <p>Você investe em tráfego pago, mas não sabe se os leads estão sendo bem atendidos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="section" id="solucao">
        <div className="container">
          <div className="section-header">
            <div className="section-badge" style={{ color: 'var(--success)' }}>✨ A Solução</div>
            <h2 className="section-title">Acutis: Sua Central de Auditoria de Vendas</h2>
            <p className="section-subtitle">
              Análise automática de todas as conversas com diagnóstico preciso e ações claras
            </p>
          </div>
          <div className="solution-grid">
            <div className="solution-card">
              <div className="solution-icon">🧠</div>
              <h3>Análise Inteligente Avançada</h3>
              <p>Cada conversa do WhatsApp é analisada automaticamente em 4 pilares de qualidade</p>
              <ul className="solution-features">
                <li><span className="check-icon">✓</span> Engajamento e interesse do cliente</li>
                <li><span className="check-icon">✓</span> Tempo e qualidade de resposta</li>
                <li><span className="check-icon">✓</span> Condução e técnica de vendas</li>
                <li><span className="check-icon">✓</span> Profissionalismo e tom</li>
              </ul>
            </div>
            <div className="solution-card">
              <div className="solution-icon">📊</div>
              <h3>Dashboard Inteligente</h3>
              <p>Visão completa do seu funil de vendas com métricas que realmente importam</p>
              <ul className="solution-features">
                <li><span className="check-icon">✓</span> Funil personalizado por fase</li>
                <li><span className="check-icon">✓</span> Taxa de conversão em tempo real</li>
                <li><span className="check-icon">✓</span> Ranking de vendedores por nota</li>
                <li><span className="check-icon">✓</span> Top objeções mapeadas</li>
              </ul>
            </div>
            <div className="solution-card">
              <div className="solution-icon">📱</div>
              <h3>Relatórios no WhatsApp</h3>
              <p>Relatórios proativos enviados direto no seu WhatsApp — sem precisar abrir painéis</p>
              <ul className="solution-features">
                <li><span className="check-icon">✓</span> Resumo semanal automático</li>
                <li><span className="check-icon">✓</span> Principais erros e acertos</li>
                <li><span className="check-icon">✓</span> Insights acionáveis</li>
                <li><span className="check-icon">✓</span> Gráficos de performance</li>
              </ul>
            </div>
            <div className="solution-card">
              <div className="solution-icon">🔍</div>
              <h3>Auditoria Completa</h3>
              <p>Veja cada conversa analisada com diagnóstico e nota de qualidade detalhada</p>
              <ul className="solution-features">
                <li><span className="check-icon">✓</span> Nota de atendimento 0-100</li>
                <li><span className="check-icon">✓</span> Diagnóstico do que pode melhorar</li>
                <li><span className="check-icon">✓</span> Histórico completo de conversas</li>
                <li><span className="check-icon">✓</span> Filtros por vendedor e período</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section section-dark" id="como-funciona">
        <div className="container">
          <div className="section-header">
            <div className="section-badge" style={{ color: 'var(--secondary)' }}>⚙️ Como Funciona</div>
            <h2 className="section-title">Simples de Implementar, Poderoso de Usar</h2>
            <p className="section-subtitle">
              Em menos de 30 minutos você tem a Acutis funcionando na sua empresa
            </p>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Conecte seu WhatsApp</h3>
              <p>Integração simples via QR Code com seu WhatsApp Business. Nenhuma mudança na sua operação.</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Configure seu Perfil</h3>
              <p>Defina seu nicho, objetivos e horário de funcionamento. A análise se adapta ao seu negócio.</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Acutis Analisa Tudo</h3>
              <p>Cada conversa é analisada automaticamente com diagnóstico de qualidade e sugestões de melhoria.</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Receba Insights</h3>
              <p>Dashboard em tempo real + relatórios no WhatsApp. Você sabe exatamente onde agir.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Differentials */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div className="section-badge" style={{ color: 'var(--warning)' }}>🏆 Diferenciais</div>
            <h2 className="section-title">Por que escolher a Acutis?</h2>
          </div>
          <div className="diff-grid">
            <div className="diff-card">
              <div className="diff-icon">🎯</div>
              <div className="diff-content">
                <h4>Análise Justa por Horário</h4>
                <p>Se o lead mandou mensagem às 23h, não penalizamos o vendedor que respondeu às 8h. Medição inteligente.</p>
              </div>
            </div>
            <div className="diff-card">
              <div className="diff-icon">📝</div>
              <div className="diff-content">
                <h4>Templates por Nicho</h4>
                <p>Instruções pré-configuradas para Academias, Clínicas, Imobiliárias, Odonto e mais. Pronto para usar.</p>
              </div>
            </div>
            <div className="diff-card">
              <div className="diff-icon">🔄</div>
              <div className="diff-content">
                <h4>Funil Personalizável</h4>
                <p>Defina suas próprias fases de venda: Interesse, Agendado, Negociação, Fechado. Você decide.</p>
              </div>
            </div>
            <div className="diff-card">
              <div className="diff-icon">💬</div>
              <div className="diff-content">
                <h4>Chat Integrado</h4>
                <p>Veja a conversa completa e a análise lado a lado. Contexto total para tomar decisões.</p>
              </div>
            </div>
            <div className="diff-card">
              <div className="diff-icon">🔎</div>
              <div className="diff-content">
                <h4>Assistente Inteligente</h4>
                <p>Pergunte qualquer coisa sobre seus atendimentos e receba respostas em segundos.</p>
              </div>
            </div>
            <div className="diff-card">
              <div className="diff-icon">📈</div>
              <div className="diff-content">
                <h4>Identificação de Gargalos</h4>
                <p>Saiba exatamente onde seus leads estão travando no funil e quantos estão em cada fase.</p>
              </div>
            </div>
            <div className="diff-card">
              <div className="diff-icon">🏢</div>
              <div className="diff-content">
                <h4>Multi-empresa</h4>
                <p>Gerencie múltiplas empresas/clientes de um único painel administrativo.</p>
              </div>
            </div>
            <div className="diff-card">
              <div className="diff-icon">⚡</div>
              <div className="diff-content">
                <h4>Sem Alterar sua Operação</h4>
                <p>Funciona como "espelho" do seu WhatsApp. Seus vendedores continuam trabalhando normalmente.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scripts */}
      <section className="section section-dark" id="scripts">
        <div className="container">
          <div className="section-header">
            <div className="section-badge" style={{ color: 'var(--primary-light)' }}>📋 Para o Vendedor</div>
            <h2 className="section-title">Contornando Objeções Comuns</h2>
            <p className="section-subtitle">
              Use esses argumentos para converter mais clientes
            </p>
          </div>
          <div className="scripts-grid">
            <div className="script-card">
              <div className="script-header">
                <h4>💰 Objeção de Preço</h4>
              </div>
              <div className="script-body">
                <div className="objection">
                  <strong>Cliente diz:</strong>
                  <p>"Parece interessante, mas não sei se cabe no orçamento agora..."</p>
                </div>
                <div className="response">
                  <strong>Responda:</strong>
                  <p>"Entendo perfeitamente. Deixa eu te fazer uma pergunta: quanto você investe hoje em tráfego pago por mês? [aguarda resposta] E desses leads que entram, você sabe exatamente quantos estão sendo bem atendidos? A Acutis não é um custo — é a garantia de que cada real investido em mídia vai ser bem aproveitado. Muitos clientes recuperam o investimento logo no primeiro mês só identificando leads que estavam sendo perdidos."</p>
                </div>
              </div>
            </div>
            <div className="script-card">
              <div className="script-header">
                <h4>🤔 Objeção de Tempo</h4>
              </div>
              <div className="script-body">
                <div className="objection">
                  <strong>Cliente diz:</strong>
                  <p>"Gostei, mas estou muito ocupado agora. Podemos conversar mês que vem?"</p>
                </div>
                <div className="response">
                  <strong>Responda:</strong>
                  <p>"Claro, respeito totalmente seu tempo. Só uma reflexão rápida: quantos leads estão entrando esse mês que você não sabe se estão sendo bem atendidos? A Acutis não te dá mais trabalho — ela te dá menos. Em vez de você ler conversas manualmente, ela te entrega tudo pronto. A implementação leva 30 minutos e você já começa a ver resultados. Que tal agendarmos uma demo rápida de 15 minutos só para você ver na prática?"</p>
                </div>
              </div>
            </div>
            <div className="script-card">
              <div className="script-header">
                <h4>🔒 Objeção de Confiança</h4>
              </div>
              <div className="script-body">
                <div className="objection">
                  <strong>Cliente diz:</strong>
                  <p>"Vocês têm acesso às minhas conversas? Isso é seguro?"</p>
                </div>
                <div className="response">
                  <strong>Responda:</strong>
                  <p>"Pergunta muito válida! A Acutis funciona conectada ao seu WhatsApp via API. Não armazenamos dados sensíveis e você tem controle total. Funciona como um 'espelho' — só lemos as mensagens para analisar a qualidade do atendimento. Seus vendedores nem percebem que a ferramenta está rodando. E você pode desconectar a qualquer momento."</p>
                </div>
              </div>
            </div>
            <div className="script-card">
              <div className="script-header">
                <h4>😕 Objeção de Necessidade</h4>
              </div>
              <div className="script-body">
                <div className="objection">
                  <strong>Cliente diz:</strong>
                  <p>"Minha equipe é pequena, acho que consigo acompanhar tudo..."</p>
                </div>
                <div className="response">
                  <strong>Responda:</strong>
                  <p>"Justamente por ser pequena é que cada lead conta mais, concorda? Uma única venda perdida por atendimento ruim já faz diferença no mês. A Acutis te ajuda a garantir que 100% dos leads sejam bem atendidos — sem você precisar ficar monitorando manualmente. E quando sua equipe crescer, você já vai ter os processos estruturados."</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="section" id="contato">
        <div className="container">
          <div className="pricing-card">
            <div className="pricing-badge">🚀 Oferta Especial</div>
            <h3 className="pricing-title">Pronto para parar de perder vendas?</h3>
            <p className="pricing-subtitle">
              Agende uma demonstração gratuita e veja a Acutis analisando seus atendimentos em tempo real
            </p>
            <a
              href="https://wa.me/5511982967814?text=Olá!%20Quero%20conhecer%20a%20Acutis"
              className="pricing-cta"
              target="_blank"
              rel="noopener noreferrer"
            >
              Agendar Demonstração
              <span>→</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="container">
          <p>© 2026 Acutis - Análise Inteligente de Atendimentos. Todos os direitos reservados.</p>
        </div>
      </footer>
    </>
  );
}
