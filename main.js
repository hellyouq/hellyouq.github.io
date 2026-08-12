/* ══════════════════════════════════════════════════
   HELLPAK — main.js
   Material You · YouTube IFrame API · Canvas wave
   ══════════════════════════════════════════════════ */

'use strict';

/* ── Трек ── */
const TRACK = {
    videoId: '8nhLPwilFSQ',
    title:   'Caramel',
    artist:  'PHARAOH',
    album:   'ГОРГОРОД (2016)',
};

/* ── Состояние ── */
let yt         = null;
let ytReady    = false;
let playing    = false;
let muted      = false;
let dragging   = false;
let rafId      = null;
let volume     = 70;
let snackTimer = null;

/* ── DOM ── */
const btnPlay    = document.getElementById('btn-play');
const btnMute    = document.getElementById('btn-mute');
const volSlider  = document.getElementById('vol-slider');
const trackbar   = document.getElementById('trackbar');
const progFill   = document.getElementById('prog-fill');
const progThumb  = document.getElementById('prog-thumb');
const timeCur    = document.getElementById('time-cur');
const timeTotal  = document.getElementById('time-total');
const vinylRing  = document.getElementById('vinyl-ring');
const copyBtn    = document.getElementById('copy-btn');
const discordVal = document.getElementById('discord-val');
const snackbar   = document.getElementById('snackbar');
const snackText  = document.getElementById('snack-text');
const ringCanvas = document.getElementById('avatar-ring-canvas');

/* ══════════════════════════
   YouTube IFrame API
   ══════════════════════════ */

(function loadYT() {
    const s = document.createElement('script');
    s.src   = 'https://www.youtube.com/iframe_api';
    s.async = true;
    document.head.appendChild(s);
})();

window.onYouTubeIframeAPIReady = function () {
    yt = new YT.Player('yt-host', {
        height:  '1',
        width:   '1',
        videoId: TRACK.videoId,
        playerVars: {
            autoplay: 0, controls: 0, disablekb: 1,
            fs: 0, modestbranding: 1, rel: 0,
            origin: location.origin,
        },
        events: {
            onReady:       onReady,
            onStateChange: onStateChange,
            onError:       () => showSnack('Ошибка плеера'),
        },
    });
};

function onReady() {
    ytReady = true;
    yt.setVolume(volume);
    const dur = yt.getDuration();
    if (dur) timeTotal.textContent = fmt(dur);
}

function onStateChange(e) {
    const S = YT.PlayerState;
    if (e.data === S.PLAYING) {
        setPlaying(true);
        mainLoop();
    } else if (e.data === S.PAUSED || e.data === S.ENDED) {
        setPlaying(false);
        cancelAnimationFrame(rafId);
        if (e.data === S.ENDED) resetProgress();
    }
}

/* ══════════════════════════
   Play / Pause / Mute / Vol
   ══════════════════════════ */

btnPlay.addEventListener('click', e => {
    ripple(e, btnPlay);
    if (!ytReady) { showSnack('Загрузка...'); return; }
    playing ? yt.pauseVideo() : yt.playVideo();
    playSound('assets/sounds/guimodulepanelopen.wav', 0.3);
});

btnMute.addEventListener('click', e => {
    ripple(e, btnMute);
    if (!ytReady) return;
    muted = !muted;
    muted ? yt.mute() : (yt.unMute(), yt.setVolume(volume));
    btnMute.classList.toggle('muted', muted);
});

volSlider.addEventListener('input', () => {
    volume = +volSlider.value;
    if (!ytReady) return;
    if (muted) { yt.unMute(); btnMute.classList.remove('muted'); muted = false; }
    yt.setVolume(volume);
});

function setPlaying(val) {
    playing = val;
    btnPlay.classList.toggle('playing', val);
    vinylRing.classList.toggle('active', val);
}

/* ══════════════════════════
   Главный loop (rAF)
   ══════════════════════════ */

function mainLoop() {
    if (!ytReady || !playing) return;
    if (!dragging) updateProgress();
    drawAvatarRing();
    rafId = requestAnimationFrame(mainLoop);
}

/* Идём тоже в idle когда не играет — кольцо в покое */
(function idleLoop() {
    if (!playing) {
        drawAvatarRing();
    }
    requestAnimationFrame(idleLoop);
})();

/* ══════════════════════════
   Прогресс-бар
   ══════════════════════════ */

function updateProgress() {
    const cur = yt.getCurrentTime() || 0;
    const dur = yt.getDuration()    || 1;
    const pct = (cur / dur) * 100;
    setBar(pct);
    timeCur.textContent   = fmt(cur);
    timeTotal.textContent = fmt(dur);
    trackbar.setAttribute('aria-valuenow', Math.round(pct));
}

function setBar(pct) {
    pct = Math.max(0, Math.min(100, pct));
    progFill.style.width = pct + '%';
    progThumb.style.left = pct + '%';
}

function resetProgress() {
    setBar(0);
    timeCur.textContent = '0:00';
}

function seekFromEvent(e) {
    const rect = trackbar.querySelector('.progress-track').getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setBar(pct * 100);
    timeCur.textContent = fmt(pct * (ytReady ? yt.getDuration() : 0));
    if (ytReady) yt.seekTo(pct * yt.getDuration(), true);
}

trackbar.addEventListener('mousedown', e => { dragging = true; seekFromEvent(e); });
document.addEventListener('mousemove',  e => { if (dragging) seekFromEvent(e); });
document.addEventListener('mouseup',    ()  => { dragging = false; });
trackbar.addEventListener('touchstart', e => { dragging = true; seekFromEvent(e.touches[0]); }, { passive: true });
document.addEventListener('touchmove',  e => { if (dragging) seekFromEvent(e.touches[0]); },   { passive: true });
document.addEventListener('touchend',   ()  => { dragging = false; });
trackbar.addEventListener('keydown', e => {
    if (!ytReady) return;
    const d = { ArrowRight: 5, ArrowLeft: -5 }[e.key];
    if (d) { e.preventDefault(); yt.seekTo(Math.max(0, yt.getCurrentTime() + d), true); }
});

/* ══════════════════════════
   WAVEFORM — Android 14/15 style
   Имитация: несколько синусоид с разными фазами,
   амплитуда растёт во время воспроизведения,
   цвет — primary accent с градиентом
   ══════════════════════════ */

const rCtx  = ringCanvas.getContext('2d');
let rAngle  = 0;
const RW    = 120;
const RH    = 120;
const CX    = RW / 2;
const CY    = RH / 2;
const OUTER = 59;
const INNER = 51;

ringCanvas.width  = RW * devicePixelRatio;
ringCanvas.height = RH * devicePixelRatio;
rCtx.scale(devicePixelRatio, devicePixelRatio);

/* Цвета дуги — Material You primary palette */
const RING_COLORS = [
    '#a8c7fa',  /* primary */
    '#9b72cb',  /* tertiary purple */
    '#7fc8f8',  /* secondary blue */
    '#a8c7fa',
];

function drawAvatarRing() {
    rCtx.clearRect(0, 0, RW, RH);

    rAngle += playing ? 0.012 : 0.004;

    /* Рисуем arc по сегментам, каждый своим цветом */
    const segs = RING_COLORS.length;
    const step = (Math.PI * 2) / segs;

    RING_COLORS.forEach((color, i) => {
        const start = rAngle + i * step;
        const end   = start  + step + 0.02; /* +0.02 чтобы не было щелей */

        rCtx.beginPath();
        rCtx.arc(CX, CY, (OUTER + INNER) / 2, start, end);
        rCtx.lineWidth   = OUTER - INNER;
        rCtx.strokeStyle = color;
        rCtx.globalAlpha = playing ? 0.9 : 0.45;
        rCtx.stroke();
    });

    rCtx.globalAlpha = 1;

    /* Мягкое свечение поверх */
    const glow = rCtx.createRadialGradient(CX, CY, INNER, CX, CY, OUTER + 4);
    glow.addColorStop(0,   'rgba(168,199,250,0)');
    glow.addColorStop(0.6, `rgba(168,199,250,${playing ? 0.18 : 0.06})`);
    glow.addColorStop(1,   'rgba(168,199,250,0)');

    rCtx.beginPath();
    rCtx.arc(CX, CY, (OUTER + INNER) / 2, 0, Math.PI * 2);
    rCtx.lineWidth   = OUTER - INNER + 6;
    rCtx.strokeStyle = glow;
    rCtx.stroke();
}

/* ══════════════════════════
   Discord копирование
   ══════════════════════════ */

copyBtn.addEventListener('click', e => {
    ripple(e, copyBtn);
    const tag = discordVal.textContent.trim();
    navigator.clipboard.writeText(tag).then(() => {
        copyBtn.classList.add('copied');
        showSnack('Скопировано');
        playSound('assets/sounds/notifications/notification.ogg', 0.5);
        setTimeout(() => copyBtn.classList.remove('copied'), 2000);
    }).catch(() => showSnack('Нет доступа к буферу'));
});

/* ══════════════════════════
   Snackbar
   ══════════════════════════ */

function showSnack(msg) {
    snackText.textContent = msg;
    snackbar.classList.add('show');
    clearTimeout(snackTimer);
    snackTimer = setTimeout(() => snackbar.classList.remove('show'), 2600);
}

/* ══════════════════════════
   Ripple
   ══════════════════════════ */

function ripple(e, el) {
    const r    = document.createElement('span');
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    r.className     = 'ripple';
    r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
    el.style.position = 'relative';
    el.style.overflow = 'hidden';
    el.appendChild(r);
    r.addEventListener('animationend', () => r.remove());
}

/* ══════════════════════════
   Утилиты
   ══════════════════════════ */

function fmt(s) {
    s = Math.floor(s || 0);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function playSound(src, vol = 0.4) {
    try { const a = new Audio(src); a.volume = vol; a.play().catch(() => {}); } catch (_) {}
}
