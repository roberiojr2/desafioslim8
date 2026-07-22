import { CONFIG } from './config.js?v=8';
import { Tracker, getUrlParams } from './tracking.js?v=8';

// ============================================================================
// 🎬 VSL - Página /resultado/ (Desafio Cintura Slim8)
// ============================================================================
// Botões têm href estático pro checkout. No click disparamos InitiateCheckout
// (fbq browser + CAPI). O esconder (reveal 180s) é inline no resultado/index.html.
// ============================================================================

const VSL = {
    state: {
        sessionId: null,
        pageViewFired: false,
        viewContentFired: false,
        icFired: false
    },

    init() {
        const params = getUrlParams();
        this.state.sessionId = params.quiz_session
            || 'sess_vsl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

        Tracker.init();
        this._firePageView();
        setTimeout(() => this._fireViewContent(), 500);
        this._fireLeadOnce();
        this._setupCtaClickTracking();
        this._applyQuizContext();

        console.log(`🎬 VSL Slim8 iniciada | session=${this.state.sessionId}`);
    },

    _applyQuizContext() {
        const params = getUrlParams();
        const signs = parseInt(params.signs || '0', 10);
        const total = 28;

        if (signs <= 0) return;

        const headline = document.querySelector('.hero-headline');
        if (!headline) return;

        const pill = document.createElement('div');
        pill.style.cssText = 'text-align:center;margin:8px 0 16px';
        pill.innerHTML = `
            <span style="
                display:inline-block;
                background:rgba(181,101,118,.10);
                border:1px solid #ecd4cf;
                border-radius:999px;
                padding:7px 18px;
                font-size:13px;
                font-weight:600;
                color:#8a4a59;
                letter-spacing:-0.01em;
            ">Você apresentou <strong style="color:#b56576">${signs} de ${total}</strong> sinais de diástase</span>`;
        headline.appendChild(pill);
    },

    _firePageView() {
        if (this.state.pageViewFired) return;
        this.state.pageViewFired = true;
        Tracker.sendEvent('PageView', {
            title: document.title,
            url: window.location.href,
            content_name: 'VSL Slim8 - Resultado'
        }, this.state);
    },

    _fireViewContent() {
        if (this.state.viewContentFired) return;
        this.state.viewContentFired = true;
        Tracker.sendEvent('ViewContent', {
            content_name: 'VSL Slim8 - Resultado',
            content_category: 'Health'
        }, this.state);
    },

    // Lead oficial do funil: chegada na página de resultado vinda do quiz.
    // Dispara UMA vez por quiz_session (guard em localStorage; refresh não duplica).
    _fireLeadOnce() {
        const params = getUrlParams();
        if (!params.quiz_session) return;
        const key = 'slim8_lead_' + params.quiz_session;
        try { if (localStorage.getItem(key)) return; } catch (e) {}
        Tracker.sendEvent('Lead', {
            content_name: 'Quiz Diástase - Resultado',
            content_category: 'Health',
            signs: parseInt(params.signs || '0', 10),
            main_issue: params.main_issue || null
        }, this.state);
        try { localStorage.setItem(key, '1'); } catch (e) {}
    },

    _setupCtaClickTracking() {
        const selector = '.cta-btn, a[href*="hotmart.com"], a[href*="pay.hotmart"], a[href*="kiwify"]';

        const fireIC = () => {
            if (this.state.icFired) return;
            this.state.icFired = true;
            Tracker.sendEvent('InitiateCheckout', {
                value: CONFIG.checkout.productValue,
                currency: CONFIG.checkout.currency,
                content_name: CONFIG.checkout.contentName,
                content_category: CONFIG.checkout.contentCategory,
                content_ids: CONFIG.checkout.contentIds,
                content_type: CONFIG.checkout.contentType
            }, this.state);
        };

        const handler = (e) => {
            const t = e.target;
            if (t && t.closest && t.closest(selector)) fireIC();
        };

        // mousedown/touchstart em capture: dispara ANTES da navegação (keepalive garante envio)
        document.addEventListener('mousedown', handler, { capture: true, passive: true });
        document.addEventListener('touchstart', handler, { capture: true, passive: true });

        // Click dentro do player VTurb (shadow DOM) bolha pro host
        const attachVturb = () => {
            const player = document.querySelector(CONFIG.vtb.playerSelector);
            if (!player) return false;
            player.addEventListener('click', (e) => {
                const path = (e.composedPath && e.composedPath()) || [];
                const checkoutRegex = /hotmart\.com|pay\.hotmart|kiwify/i;
                const hit = path.some(el => {
                    if (!el || !el.tagName) return false;
                    if (el.tagName === 'A' && el.href && checkoutRegex.test(el.href)) return true;
                    if (el.className && typeof el.className === 'string') {
                        const c = el.className.toLowerCase();
                        if (c.includes('call-action') || c.includes('cta') || c.includes('smartplayer-call')) return true;
                    }
                    return false;
                });
                if (hit) fireIC();
            }, { capture: true, passive: true });
            return true;
        };
        if (!attachVturb()) document.addEventListener('player:ready', attachVturb);
    }
};

document.addEventListener('DOMContentLoaded', () => VSL.init());