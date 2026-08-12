/* ═══════════════════════════════════════════════
   HELLPAK — main.js
   YouTube IFrame API + UI logic
   ═══════════════════════════════════════════════ */

'use strict';

/* ── конфиг трека ── */
const TRACK = {
    videoId: '8nhLPwilFSQ',
    title:   'PHARAOH — Caramel',
    artist:  'PHARAOH',
    cover:   'https://i.ytimg.com/vi/8nhLPwilFSQ/maxresdefault.jpg',
};

/* ── состояние плеера ── */
let ytPlayer   = null;
let ytReady    = false;
let isPlaying  = false;
let isMuted    = false;
let isDragging = false;
let rafId      = null;
let volume     = 70;

/* ── DOM-ссылки ── */
const btnPlay    = document.getElementById('btn-play');
const btnMute    = document.getElementById('btn-mute');
const volSlider  = document.getElementById('vol-slider');
const trackbar   = document.getElementById('trackbar');
const tbFill     = document.getElementById('trackbar-fill');
const tbThumb    = document.getElementById('trackbar-thumb');
const timeCur    = document.getElementById('time-current');
const timeTotal  = document.getElementById('time-total');
const coverEl    = document.getElementById('cover');
const coverSpin  = document.getElementById('cover-spin');
const trackTitle = document.getElementById('track-title');
const trackArtst = document.getElementById('track-artist');
const copyBtn    = document.getElementById('copy-btn');
const discordVal = document.getElementById('discord-val');
const toast      = document.getElementById('toast');
const toastText  = document.getElementById('toast-text');
const hint       = document.querySelector('.hint');

/* ════════════════════════════
   YouTube API
   ════════════════════════════ */

/* Загружаем скрипт YouTube IFrame API */
(function loadYT() {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
})();

/* YouTube вызывает этот колбэк, когда API готово */
window.onYouTubeIframeAPIReady = function () {
    ytPlayer = new YT.Player('yt-host', {
        height: '1',
        width:  '1',
        videoId: TRACK.videoId,
        playerVars: {
            autoplay:    0,
            controls:    0,
            disablekb:   1,
            fs:          0,
            modestbranding: 1,
            rel:         0,
            origin:      location.origin,
        },
        events: {
            onReady:       onPlayerReady,
            onStateChange: onPlayerStateChange,
            onError:       onPlayerError,
        },
    });
};

function onPlayerReady(e) {
    ytReady = true;
    ytPlayer.setVolume(volume);

    const dur = ytPlayer.getDuration();
    if (dur) timeTotal.textContent = fmtTime(dur);

    /* обновляем метаданные */
    trackTitle.textContent = TRACK.title;
    trackArtst.textContent = TRACK.artist;
}

function onPlayerStateChange(e) {
    const S = YT.PlayerState;
    if (e.data === S.PLAYING) {
        setPlayState(true);
        rafLoop();
    } else if (e.data === S.PAUSED || e.data === S.ENDED) {
        setPlayState(false);
        cancelAnimationFrame(rafId);
        if (e.data === S.ENDED) resetBar();
    }
}

function onPlayerError() {
    showToast('Ошибка плеера :(');
    setPlayState(false);
}

/* ════════════════════════════
   Управление воспроизведением
   ════════════════════════════ */

btnPlay.addEventListener('click', () => {
    if (!ytReady) { showToast('Загрузка...'); return; }
    if (isPlaying) {
        ytPlayer.pauseVideo();
    } else {
        ytPlayer.playVideo();
        playClickSound();
    }
});

btnMute.addEventListener('click', () => {
    if (!ytReady) return;
    isMuted = !isMuted;
    if (isMuted) {
        ytPlayer.mute();
        btnMute.classList.add('muted');
    } else {
        ytPlayer.unMute();
        ytPlayer.setVolume(volume);
        btnMute.classList.remove('muted');
    }
    playClickSound();
});

volSlider.addEventListener('input', () => {
    volume = parseInt(volSlider.value, 10);
    if (!ytReady) return;
    if (isMuted) {
        ytPlayer.unMute();
        btnMute.classList.remove('muted');
        isMuted = false;
    }
    ytPlayer.setVolume(volume);
});

function setPlayState(playing) {
    isPlaying = playing;
    btnPlay.classList.toggle('playing', playing);
    coverSpin.classList.toggle('active', playing);
    if (hint) hint.style.opacity = playing ? '0' : '1';
}

/* ════════════════════════════
   Прогресс-бар
   ════════════════════════════ */

function rafLoop() {
    if (!ytReady || !isPlaying) return;
    updateBar();
    rafId = requestAnimationFrame(rafLoop);
}

function updateBar() {
    const cur = ytPlayer.getCurrentTime() || 0;
    const dur = ytPlayer.getDuration()    || 1;
    const pct = (cur / dur) * 100;

    if (!isDragging) {
        tbFill.style.width = pct + '%';
        tbThumb.style.left  = pct + '%';
        trackbar.setAttribute('aria-valuenow', Math.round(pct));
        timeCur.textContent  = fmtTime(cur);
        timeTotal.textContent = fmtTime(dur);
    }
}

function resetBar() {
    tbFill.style.width = '0%';
    tbThumb.style.left  = '0%';
    timeCur.textContent  = '0:00';
}

/* Перемотка по клику / перетаскиванию */
function seekTo(e) {
    const rect = trackbar.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const dur  = ytReady ? (ytPlayer.getDuration() || 0) : 0;
    tbFill.style.width = (pct * 100) + '%';
    tbThumb.style.left  = (pct * 100) + '%';
    timeCur.textContent  = fmtTime(pct * dur);
    if (ytReady) ytPlayer.seekTo(pct * dur, true);
}

trackbar.addEventListener('mousedown', e => {
    isDragging = true;
    seekTo(e);
});

document.addEventListener('mousemove', e => {
    if (isDragging) seekTo(e);
});

document.addEventListener('mouseup', () => { isDragging = false; });

/* Touch */
trackbar.addEventListener('touchstart', e => {
    isDragging = true;
    seekTo(e.touches[0]);
}, { passive: true });

document.addEventListener('touchmove', e => {
    if (isDragging) seekTo(e.touches[0]);
}, { passive: true });

document.addEventListener('touchend', () => { isDragging = false; });

/* Клавиатура для trackbar */
trackbar.addEventListener('keydown', e => {
    if (!ytReady) return;
    const dur = ytPlayer.getDuration() || 0;
    const cur = ytPlayer.getCurrentTime() || 0;
    let delta = 0;
    if (e.key === 'ArrowRight') delta =  5;
    if (e.key === 'ArrowLeft')  delta = -5;
    if (delta) {
        e.preventDefault();
        ytPlayer.seekTo(Math.max(0, Math.min(dur, cur + delta)), true);
    }
});

/* ════════════════════════════
   Discord: копирование
   ════════════════════════════ */

copyBtn.addEventListener('click', () => {
    const tag = discordVal.textContent.trim();
    navigator.clipboard.writeText(tag)
        .then(() => {
            copyBtn.classList.add('copied');
            copyBtn.textContent = 'ok!';
            showToast('Скопировано!');
            playNotifSound();
            setTimeout(() => {
                copyBtn.classList.remove('copied');
                copyBtn.textContent = 'copy';
            }, 2200);
        })
        .catch(() => {
            showToast('Нет доступа к буферу');
        });
});

/* ════════════════════════════
   Toast
   ════════════════════════════ */

let toastTimer = null;

function showToast(msg) {
    toastText.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

/* ════════════════════════════
   Звуки
   ════════════════════════════ */

function playSound(src, vol = 0.45) {
    try {
        const a = new Audio(src);
        a.volume = vol;
        a.play().catch(() => {});
    } catch (_) {}
}

function playClickSound() {
    playSound('assets/sounds/guimodulepanelopen.wav', 0.35);
}

function playNotifSound() {
    playSound('assets/sounds/notifications/notification.ogg', 0.5);
}

/* ════════════════════════════
   Утилиты
   ════════════════════════════ */

function fmtTime(sec) {
    sec = Math.floor(sec || 0);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}
