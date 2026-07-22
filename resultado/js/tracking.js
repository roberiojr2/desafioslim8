import { CONFIG } from './config.js?v=8';

// ============================================================================
// 🎯 TRACKER UNIFICADO - Quiz + VSL + InitiateCheckout
// ============================================================================
// Clonado do padrão ouro Natália: eventID compartilhado browser + CAPI (dedup).
// ============================================================================

const getCookie = (name) => {
    try {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    } catch (e) {}
    return null;
};

const getUrlParams = () => {
    let params = {};
    try {
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.forEach((value, key) => params[key] = value);

        const commonKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'src', 'sck', 'fbclid', 'gclid', 'ttclid'];
        commonKeys.forEach(key => {
            if (!params[key]) {
                const stored = localStorage.getItem(key);
                if (stored) params[key] = stored;
            }
        });
    } catch (e) {}
    return params;
};

const postToN8N = (url, payload) => {
    if (!url) return;
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
        keepalive: true,
        credentials: 'omit',
        mode: 'no-cors'
    }).catch((err) => console.error(`Erro N8N:`, err));
};

const persistUtms = () => {
    try {
        const current = new URLSearchParams(window.location.search);
        const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'src', 'sck', 'fbclid', 'gclid', 'ttclid'];
        keys.forEach(k => {
            const v = current.get(k);
            if (v) localStorage.setItem(k, v);
        });
    } catch (e) {}
};

export const Tracker = {
    init() {
        persistUtms();

        let attempts = 0;
        const maxAttempts = 25; // 2.5s

        const doInit = () => {
            // Utmify injeta fbq async. Se já existe, não duplica init.
            if (typeof fbq !== 'undefined' && fbq.callMethod) {
                console.log(`✅ Pixel detectado (Utmify), Tracker coordenando eventos`);
                return;
            }
            attempts++;
            if (attempts < maxAttempts) {
                setTimeout(doInit, 100);
                return;
            }
            // Fallback: fbq não ficou pronto em 2.5s.
            // Se o stub já existe (snippet base no head), o fbevents.js só está lento:
            // os eventos estão enfileirados, NÃO reinicializa (evita init duplicado).
            if (typeof fbq !== 'undefined') {
                console.log('ℹ️ fbq enfileirando (fbevents.js ainda carregando)');
                return;
            }
            // Guarda: sem Meta Pixel real configurado, não inicializa fbq com ID inválido.
            if (!CONFIG.pixelId || CONFIG.pixelId.indexOf('TODO') === 0) {
                console.warn('⚠️ Meta Pixel não configurado (CONFIG.pixelId). Eventos fbq desativados.');
                return;
            }
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
            document,'script','https://connect.facebook.net/en_US/fbevents.js');

            const fbpCookie = getCookie('_fbp');
            const initData = fbpCookie ? { external_id: fbpCookie } : {};
            fbq('init', CONFIG.pixelId, initData);
            console.log(`✅ Pixel inicializado pelo Tracker (fallback)`);
        };

        doInit();
    },

    async sendEvent(eventName, customData, state) {
        // ID ÚNICO compartilhado browser + servidor (dedup Meta).
        const eventID = `ev_${state.sessionId}_${eventName}_${Math.floor(Date.now() / 1000)}`;

        const eventData = {
            content_name: customData.content_name || 'Quiz Diástase',
            user_data: {
                fbp: getCookie('_fbp'),
                fbc: getCookie('_fbc')
            },
            ...customData
        };

        // A. BROWSER (fbq): SÓ eventos padrão, SÓ parâmetros de comércio.
        // Nicho saúde + restrições da Meta: nada de trackCustom, nada de dados de sintoma
        // (signs, main_issue, respostas) indo pro pixel. Detalhe rico fica nos webhooks.
        if (typeof fbq !== 'undefined') {
            let fbEventName = eventName;
            if (eventName === 'quiz_complete') fbEventName = 'Lead';
            if (eventName === 'quiz_start') fbEventName = 'ViewContent';

            const FB_STANDARD = ['PageView', 'ViewContent', 'Lead', 'InitiateCheckout'];
            if (FB_STANDARD.includes(fbEventName)) {
                const fbData = {};
                ['content_name', 'content_category', 'content_ids', 'content_type', 'value', 'currency']
                    .forEach(k => { if (eventData[k] !== undefined) fbData[k] = eventData[k]; });
                fbq('track', fbEventName, fbData, { eventID: eventID });
            }
        }

        // A2. GA4 (se ativo): funil fora da Meta, nomes recomendados do GA4.
        if (window.gtag && window.GA4_ID) {
            if (eventName === 'Lead') gtag('event', 'generate_lead', { currency: 'BRL' });
            else if (eventName === 'InitiateCheckout') gtag('event', 'begin_checkout', { currency: eventData.currency, value: eventData.value });
            else if (eventName === 'ViewContent') gtag('event', 'view_item', { items: [{ item_id: 'slim8-vsl', item_name: eventData.content_name }] });
        }

        // B. PAYLOAD SERVIDOR
        const payload = {
            event_name: eventName,
            event_id: eventID,
            event_time: Math.floor(Date.now() / 1000),
            event_source_url: window.location.href,
            session_id: state.sessionId,
            url_params: getUrlParams(),
            user_data: {
                fbp: getCookie('_fbp'),
                fbc: getCookie('_fbc'),
                user_agent: navigator.userAgent
            },
            custom_data: {
                ...eventData,
                quiz_version: CONFIG.version
            }
        };

        if (CONFIG.analyticsWebhook) {
             postToN8N(CONFIG.analyticsWebhook, { ...payload, type: 'analytics_full' });
        }

        const capiEvents = ['PageView', 'ViewContent', 'Lead', 'quiz_complete', 'quiz_start', 'InitiateCheckout'];
        if (CONFIG.capiWebhook && capiEvents.includes(eventName)) {
             let capiName = eventName;
             if (eventName === 'quiz_complete') capiName = 'Lead';
             if (eventName === 'quiz_start') capiName = 'ViewContent';
             postToN8N(CONFIG.capiWebhook, { ...payload, event_name: capiName, type: 'capi_conversion' });
        }

        return eventID;
    }
};

export { getCookie, getUrlParams };
