// ============================================================================
// ⏰ COUNTDOWN VSL - 15 minutos persistidos em localStorage
// ============================================================================
// Clonado do funil Natália. Reset condicional após 24h.
// ============================================================================

(function(){
    const KEY = 'slim8_countdown_n';
    const DURATION_MS = 900000; // 15 minutos
    const STALE_AFTER_MS = 86400000; // 24h: se 'expirado' há mais de 24h, reseta

    const now = Date.now();
    let end = parseInt(localStorage.getItem(KEY) || '0', 10);

    if (!end || end < now - STALE_AFTER_MS) {
        end = now + DURATION_MS;
        localStorage.setItem(KEY, end);
    }

    const el = document.getElementById('timer');
    if (!el) return;

    function tick() {
        const d = Math.max(0, end - Date.now());
        if (d <= 0) {
            const bar = document.getElementById('countdownBar');
            if (bar) bar.style.display = 'none';
            return;
        }
        const h = Math.floor(d / 3600000);
        const m = Math.floor((d % 3600000) / 60000);
        const s = Math.floor((d % 60000) / 1000);
        el.textContent = (h < 10 ? '0' : '') + h + ':' +
                         (m < 10 ? '0' : '') + m + ':' +
                         (s < 10 ? '0' : '') + s;
        requestAnimationFrame(tick);
    }
    tick();
})();
