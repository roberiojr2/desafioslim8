// ============================================================================
// 🎛️ PAINEL DE CONTROLE - QUIZ + VSL DIÁSTASE (Priscilla Céo / Desafio Slim8)
// ============================================================================
// Clonado da arquitetura validada Natália (quizz6). URLs calculadas em runtime.
// Config COMPLETO pro go-live em 2026-07-14. Pixel é DEDICADO da Priscilla.
// ============================================================================

export const CONFIG = {
  version: "v1_priscilla_diastase",

  // --- 1. TRACKING ---
  // Webhooks DESATIVADOS por decisão de 2026-07-14 (sem n8n no momento).
  // Pra reativar, descomente e preencha:
  // capiWebhook: "https://n8n.SEU-DOMINIO.com.br/webhook/slim8-capi",
  // analyticsWebhook: "https://n8n.SEU-DOMINIO.com.br/webhook/slim8-analytics",
  // Meta Pixel DEDICADO da Priscilla (confirmado 2026-07-14).
  pixelId: "2252771808220128",

  // --- 2. REDIRECT QUIZ → VSL (relativo, resolve em runtime) ---
  redirectPath: "resultado/",

  // --- 3. CHECKOUT (VSL → plataforma de pagamento) ---
  checkout: {
    n8nGo: null,
    finalDest: "https://pay.hotmart.com/R106625824G?off=qqftzr3o",
    productValue: 47.00,        // preço à vista
    currency: "BRL",
    contentName: "Desafio Cintura Slim8",
    contentCategory: "Health",
    contentIds: ["slim8-vsl"],
    contentType: "product"
  },

  // --- 4. VTURB ---
  vtb: {
    playerSelector: "vturb-smartplayer",
    playerId: "6a54d178d592bb4e7238da52"
  },

  // --- 5. UI ---
  ui: {
    timePerQuestion: 5,
    scrollDelay: 600,
    showProgress: true
  }
};
