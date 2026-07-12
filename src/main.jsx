import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, Check, Code2, Copy, Heart, LockKeyhole, Sparkles } from 'lucide-react';
import './styles.css';

const links = [
  { label: 'YouTube', handle: '@Hell_PaQ', href: 'https://www.youtube.com/@Hell_PaQ', icon: <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQp2B3GcNPfSo1SepwHJIcOV0ROrH5S3uZxSCMipcA8JQ&s=10" alt="" /> },
];

const avatarImage = 'https://i.pinimg.com/736x/d7/a1/83/d7a183a14b9911d4022ce27a178c1af3.jpg';
const trackImage = 'https://i.pinimg.com/736x/e2/c5/19/e2c519cdd0f9d1668a3c3239b7d99001.jpg';
const trackId = '9s4u7Jg3WCw';
const trackDuration = 217;

const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

function ScrambleWordmark() {
  const original = 'HellPaQ';
  const symbols = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$%&*';
  const [display, setDisplay] = useState(original);

  useEffect(() => {
    let restoreTimer;
    const scramble = window.setInterval(() => {
      const next = original.split('');
      const first = Math.floor(Math.random() * next.length);
      next[first] = symbols[Math.floor(Math.random() * symbols.length)];
      if (Math.random() > 0.7) {
        const second = (first + 1 + Math.floor(Math.random() * (next.length - 1))) % next.length;
        next[second] = symbols[Math.floor(Math.random() * symbols.length)];
      }
      setDisplay(next.join(''));
      window.clearTimeout(restoreTimer);
      restoreTimer = window.setTimeout(() => setDisplay(original), 170);
    }, 520);

    return () => {
      window.clearInterval(scramble);
      window.clearTimeout(restoreTimer);
    };
  }, []);

  return <span aria-label={original}>{display.split('').map((letter, index) => <span key={index} aria-hidden="true" className={letter !== original[index] ? 'is-scrambled' : ''}>{letter}</span>)}</span>;
}

function App() {
  const playerRef = useRef(null);
  const sceneRef = useRef(null);
  const soundRef = useRef(null);
  const frameRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const originalTitle = 'HellPaQ';
    const symbols = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$%&*';
    let restoreTimer;
    const titleScramble = window.setInterval(() => {
      const next = originalTitle.split('');
      for (let count = 0; count < 3; count += 1) {
        const index = Math.floor(Math.random() * next.length);
        if (next[index] !== ' ' && next[index] !== '—') next[index] = symbols[Math.floor(Math.random() * symbols.length)];
      }
      document.title = next.join('');
      window.clearTimeout(restoreTimer);
      restoreTimer = window.setTimeout(() => { document.title = originalTitle; }, 75);
    }, 190);
    const stopScramble = window.setTimeout(() => {
      window.clearInterval(titleScramble);
      window.clearTimeout(restoreTimer);
      document.title = originalTitle;
    }, 2200);

    return () => {
      window.clearInterval(titleScramble);
      window.clearTimeout(stopScramble);
      window.clearTimeout(restoreTimer);
      document.title = originalTitle;
    };
  }, []);

  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin !== 'https://www.youtube.com') return;
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'onStateChange') setIsPlaying(data.info === 1);
      } catch { /* ignore non-YouTube messages */ }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    if (!isPlaying) return undefined;
    const timer = window.setInterval(() => setCurrentTime((time) => time >= trackDuration ? 0 : time + 1), 1000);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const toggleTrack = () => {
    const command = isPlaying ? 'pauseVideo' : 'playVideo';
    playerRef.current?.contentWindow.postMessage(JSON.stringify({ event: 'command', func: command, args: [] }), '*');
    setIsPlaying(!isPlaying);
  };

  const handleCardMove = (event) => {
    if (window.matchMedia('(max-width: 620px)').matches || !sceneRef.current) return;
    const rect = sceneRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const rotateY = (x - 0.5) * 12;
    const rotateX = (0.5 - y) * 10;
    const soundRect = soundRef.current?.getBoundingClientRect();
    const soundX = soundRect ? Math.max(0, Math.min(100, ((event.clientX - soundRect.left) / soundRect.width) * 100)) : 50;
    const soundY = soundRect ? Math.max(0, Math.min(100, ((event.clientY - soundRect.top) / soundRect.height) * 100)) : 50;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      sceneRef.current?.style.setProperty('--rotate-x', `${rotateX}deg`);
      sceneRef.current?.style.setProperty('--rotate-y', `${rotateY}deg`);
      sceneRef.current?.style.setProperty('--glow-x', `${x * 100}%`);
      sceneRef.current?.style.setProperty('--glow-y', `${y * 100}%`);
      sceneRef.current?.style.setProperty('--sound-x', `${soundX}%`);
      sceneRef.current?.style.setProperty('--sound-y', `${soundY}%`);
    });
  };

  const resetCard = () => {
    cancelAnimationFrame(frameRef.current);
    if (!sceneRef.current) return;
    sceneRef.current.style.setProperty('--rotate-x', '0deg');
    sceneRef.current.style.setProperty('--rotate-y', '0deg');
    sceneRef.current.style.setProperty('--glow-x', '50%');
    sceneRef.current.style.setProperty('--glow-y', '0%');
    sceneRef.current.style.setProperty('--sound-x', '50%');
    sceneRef.current.style.setProperty('--sound-y', '50%');
  };

  const enterSite = (event) => {
    if (event.button !== 0) return;
    const playMessage = JSON.stringify({ event: 'command', func: 'playVideo', args: [] });
    playerRef.current?.contentWindow.postMessage(playMessage, '*');
    window.setTimeout(() => playerRef.current?.contentWindow.postMessage(playMessage, '*'), 500);
    setIsPlaying(true);
    setHasEntered(true);
  };

  const handleSeek = (event) => {
    const nextTime = Number(event.target.value);
    setCurrentTime(nextTime);
    playerRef.current?.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [nextTime, true] }), '*');
  };

  const copyHandle = async () => {
    await navigator.clipboard.writeText('.hellpaq');
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main className="page-shell" onMouseMove={handleCardMove} onMouseLeave={resetCard}>
      <div className="noise" aria-hidden="true" />
      <div className="orb orb-one" aria-hidden="true" />
      <div className="orb orb-two" aria-hidden="true" />

      <nav className="topbar">
        <a className="wordmark" href="/"><ScrambleWordmark /></a>
        <div className="topbar-right">
          <span className="live-dot"><i /> work 24/7</span>
        </div>
      </nav>

      <div ref={sceneRef} className="tilt-scene">
      <section className="bio-card">
        <div className="card-glow" aria-hidden="true" />
        <div className="card-topline"><span><Code2 size={13} /> digital profile</span><span className="card-number">HP / 01</span></div>
        <div className="profile-row">
          <div className="avatar" aria-label="Profile avatar"><img src={avatarImage} alt="HellPaQ avatar" /><span>✦</span></div>
          <div className="profile-copy">
            <div className="eyebrow"><Sparkles size={13} /> independent creator</div>
            <h1>HellPaQ</h1>
            <p className="role">вайбкодер</p>
          </div>
        </div>

        <div className="intro">
          <p>Занимаюсь вайб кодингом</p>
          <p className="muted">vibecoding / web design / creative development</p>
        </div>

        <div className="skill-row"><span className="vibe-tag">#vibecoding</span></div>

        <div className="action-row">
          <div className="discord-action">discord: <strong>.hellpaq</strong></div>
          <button className={`copy-action ${copied ? 'copied' : ''}`} onClick={copyHandle}>{copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Скопировано' : 'Скопировать .hellpaq'}</button>
        </div>

        <div className="divider" />

        <div className="links-list">
          {links.map((link) => (
            <a className="link-card" href={link.href} key={link.label} target="_blank" rel="noreferrer">
              <span className="link-icon">{link.icon}</span>
              <span className="link-text"><strong>{link.label}</strong><small>{link.handle}</small></span>
              <ArrowUpRight className="arrow" size={17} />
            </a>
          ))}
        </div>

        <div className="footer-row"><div className="stats"><span><b>∞</b> ideas</span><span><b>24/7</b> creating</span></div><span className="updated">Site update beta 0.1</span></div>
      </section>

      <section ref={soundRef} className={`sound-panel ${isPlaying ? 'is-playing' : ''}`}>
        <button className="sound-cover" onClick={toggleTrack} aria-label={isPlaying ? 'Pause track' : 'Play track'}><img src={trackImage} alt="Track cover" /><span>{isPlaying ? 'Ⅱ' : '▶'}</span></button>
        <div className="sound-details"><div className="sound-heading"><span><b>{isPlaying ? 'now playing' : 'play track'}</b><small>9s4u7Jg3WCw · youtube</small></span><span className="sound-time">{formatTime(currentTime)} / {formatTime(trackDuration)}</span></div><div className="progress-wrap"><span className="wave" aria-hidden="true">{Array.from({ length: 52 }, (_, index) => <i key={index} style={{ '--i': index, height: `${7 + (index % 8) * 3}px` }} />)}</span><input className="progress" style={{ '--progress': `${(currentTime / trackDuration) * 100}%` }} type="range" min="0" max={trackDuration} value={currentTime} onChange={handleSeek} aria-label="Track progress" /></div></div>
      </section>
      </div>

      <iframe ref={playerRef} className="youtube-player" title="Background track" src={`https://www.youtube.com/embed/${trackId}?enablejsapi=1&playsinline=1&loop=1&playlist=${trackId}`} allow="autoplay; encrypted-media" />

      {!hasEntered && <button className="entry-screen" onMouseDown={enterSite} aria-label="Enter website">
        <span className="entry-kicker">welcome to my space</span>
        <span className="entry-title">нажми на меня</span>
        <span className="entry-hint">left click to continue</span>
      </button>}

      <aside className="codex-badge"><span className="badge-heart"><Heart size={13} fill="currentColor" /></span><span>Made by <b>Codex</b></span></aside>

      <footer><span className="footer-secret"><LockKeyhole size={12} /> Secret by HellPak</span></footer>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
