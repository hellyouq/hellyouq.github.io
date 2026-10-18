/* ============================================================================
 *  extras.js — контент для офлайн-режима: пулы заданий, фактов, цитат,
 *  наборы игр и три рукописные мини-игры для «сюрприза» без ИИ.
 *  Все персонажи и цитаты выдуманы.
 * ==========================================================================*/
(function (global) {
  'use strict';
  const APP = (global.APP = global.APP || {});

  const facts = [
    [
      { title: 'Почему пузырь круглый', body: 'Плёнка мыльной воды натягивается равномерно во все стороны, а из всех форм наименьшая площадь поверхности у сферы. Поэтому пузырь всегда стремится стать шаром.' },
      { title: 'Стекло — это жидкость', body: 'Строго говоря, стекло — аморфное твёрдое тело: его атомы не выстроились в кристалл, а застыли в беспорядке, как в очень вязкой жидкости.' },
      { title: 'Радуга на мыле', body: 'Цветные разводы на пузыре — интерференция: свет отражается от внешней и внутренней поверхности плёнки и складывается по-разному для разных длин волн.' }
    ],
    [
      { title: 'Пузырь в вакууме', body: 'В вакууме мыльный пузырь не лопается от давления изнутри, а закипает: вода испаряется почти мгновенно. В 2015 году это сняли на камеру — зрелище завораживающее.' },
      { title: 'Самое старое стекло', body: 'Бусины из стекла возрастом около 5000 лет находили в Египте и Месопотамии: стекло начали варить примерно за 2500 лет до нашей эры.' },
      { title: 'Сколько пузырей сразу', body: 'Рекорд устойчивой конструкции из мыльных плёнок — сотни сфер, собранных в лабиринт. Держится за счёт того, что все плёнки тянутся с одинаковой силой.' }
    ],
    [
      { title: 'Стекло и звук', body: 'Стеклянная гармоника звучит потому, что мокрый палец тормозит и снова отпускает край бокала десятки раз в секунду — получается чистая высокая нота.' },
      { title: 'Плавленый песок', body: 'Обычный песок плавится при 1700 °C — и превращается в стекло, если остудить его достаточно быстро, не давая атомам выстроиться в кристалл.' },
      { title: 'Мягкое стекло', body: 'Тонкое оптическое волокно гнётся, как леска: 125 микрометров в диаметре — примерно как два волоса. Именно поэтому интернет приходит к нам по стеклу.' }
    ]
  ];

  const quotes = [
    [
      { text: 'Стекло не спорит со светом — оно его пропускает. Вот и весь секрет.', author: 'Марта Пузырькова, стеклодув' },
      { text: 'Если что-то кажется хрупким, возможно, оно просто честное.', author: 'музейный смотритель Вениамин' },
      { text: 'Мыльный пузырь живёт восемь секунд и не тратит их на сомнения.', author: 'из тетради наблюдений' }
    ],
    [
      { text: 'Размытие — это не нечёткость, это нежность к деталям.', author: 'дизайнер со второго этажа' },
      { text: 'Прозрачность требует честности: за ней всё видно.', author: 'Аркадий Светлый, витражист' },
      { text: 'Медленная анимация — это форма вежливости к глазу.', author: 'из конспекта по интерфейсам' }
    ],
    [
      { text: 'Прибирая, ты находишь не вещи, а решения, отложенные на потом.', author: 'бабушка Люба' },
      { text: 'Лучший план — тот, который можно начать за две минуты.', author: 'плакат в мастерской' },
      { text: 'Пузырь лопается не от удара, а от того, что стал слишком тонким.', author: 'инструкция к мыльной воде' }
    ]
  ];

  const quests = [
    [
      { title: 'Пять минут тишины', desc: 'Никаких экранов: только окно и дыхание.', reward: 30, difficulty: 'легко' },
      { title: 'Стакан воды', desc: 'Выпить медленно, не отвлекаясь ни на что.', reward: 20, difficulty: 'легко' },
      { title: 'Разобрать один стол', desc: 'Не весь дом — только одну поверхность.', reward: 50, difficulty: 'средне' },
      { title: 'Написать одному человеку', desc: 'Просто «как ты?» — этого достаточно.', reward: 40, difficulty: 'легко' },
      { title: 'Пройти 2000 шагов', desc: 'Любая погода считается подходящей.', reward: 70, difficulty: 'средне' }
    ],
    [
      { title: 'Сделать 10 выдохов', desc: 'Дольше обычного, спокойнее обычного.', reward: 25, difficulty: 'легко' },
      { title: 'Погладить питомца', desc: 'Если под рукой есть хоть один шерстяной друг.', reward: 20, difficulty: 'легко' },
      { title: 'Выключить лишний свет', desc: 'Один неиспользуемый источник — в отставку.', reward: 35, difficulty: 'легко' },
      { title: 'Собрать плейлист на вечер', desc: 'Ровно три песни, не больше.', reward: 60, difficulty: 'средне' },
      { title: 'Нарисовать что-нибудь в разделе рисования', desc: 'Хоть одну линию — уже считается.', reward: 45, difficulty: 'легко' }
    ]
  ];

  const gameSets = [
    ['snake', 'memory', 'stack'],
    ['n2048', 'flappy', 'aim'],
    ['breakout', 'simon', 'typing'],
    ['reaction', 'tictactoe', 'lightsout'],
    ['mines', 'stroop', 'snake'],
    ['memory', 'n2048', 'wheel']
  ];

  /* --------------------- рукописные мини-игры для сюрприза ------------------ */

  const bubblePop = `<!doctype html><html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;margin:0;padding:0;user-select:none;-webkit-user-select:none}
body{height:100vh;overflow:hidden;font:600 15px/1.4 -apple-system,"Segoe UI",system-ui,sans-serif;
 color:#eaf2ff;background:radial-gradient(120% 90% at 20% 10%,#2b2350,#0b0d1a 70%)}
canvas{position:absolute;inset:0;width:100%;height:100%;touch-action:none}
.hud{position:absolute;left:14px;right:14px;top:14px;display:flex;justify-content:space-between;gap:10px;z-index:3}
.pill{padding:9px 16px;border-radius:20px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.22);
 backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:0 10px 30px rgba(0,0,0,.35)}
.btn{cursor:pointer;transition:transform .25s cubic-bezier(.22,1,.36,1),background .25s}
.btn:hover{background:rgba(255,255,255,.18)}.btn:active{transform:scale(.94)}
.msg{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:24px;z-index:4;
 background:rgba(6,8,20,.55);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.msg[hidden]{display:none}
.msg h2{font-size:22px;margin-bottom:8px;font-weight:700}
.msg p{opacity:.8;font-weight:500;max-width:300px;margin:0 auto 16px}
.msg button{padding:12px 26px;border-radius:18px;border:1px solid rgba(255,255,255,.3);cursor:pointer;
 background:linear-gradient(135deg,var(--accent,#7c5cff),rgba(255,255,255,.25));color:#fff;font:inherit;font-weight:700;
 transition:transform .25s cubic-bezier(.22,1,.36,1)}.msg button:active{transform:scale(.95)}
</style></head><body>
<canvas id="cv"></canvas>
<div class="hud"><div class="pill">Очки: <span id="sc">0</span></div><div class="pill btn" id="reset">Заново</div></div>
<div class="msg" id="msg" hidden><div><h2 id="mt">Лопнул</h2><p id="mp"></p><button id="again">Ещё раз</button></div></div>
<script>
(function(){
 var cv=document.getElementById('cv'),ctx=cv.getContext('2d'),sc=document.getElementById('sc'),
 msg=document.getElementById('msg'),mt=document.getElementById('mt'),mp=document.getElementById('mp');
 var W=0,H=0,dpr=1,bubbles=[],score=0,lives=3,acc=0,run=true;
 function fit(){dpr=Math.min(2,window.devicePixelRatio||1);W=cv.clientWidth;H=cv.clientHeight;
  cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
 window.addEventListener('resize',fit);fit();
 function spawn(){var r=16+Math.random()*20;var bad=Math.random()<0.22;
  bubbles.push({x:r+Math.random()*(W-2*r),y:H+r,r:r,v:0.35+Math.random()*0.7,bad:bad,ph:Math.random()*6});}
 function reset(){bubbles=[];score=0;lives=3;acc=0;run=true;msg.hidden=true;sc.textContent='0';}
 document.getElementById('reset').onclick=reset;document.getElementById('again').onclick=reset;
 cv.addEventListener('pointerdown',function(e){
  var x=e.clientX-cv.getBoundingClientRect().left,y=e.clientY-cv.getBoundingClientRect().top;
  if(!run)return;
  for(var i=bubbles.length-1;i>=0;i--){var b=bubbles[i];
   if(Math.hypot(b.x-x,b.y-y)<b.r+14){
    if(b.bad){lives=0;}else{score+=Math.round(30-b.r);}
    bubbles.splice(i,1);break;
   }}
  acc=0;sc.textContent=score;
 });
 function frame(){
  if(!run){requestAnimationFrame(frame);return;}
  acc++;if(acc%26===0&&bubbles.length<16)spawn();
  ctx.clearRect(0,0,W,H);
  for(var i=bubbles.length-1;i>=0;i--){
   var b=bubbles[i];b.y-=b.v;b.x+=Math.sin((b.y+b.ph)*0.01)*0.5;
   if(b.y<-b.r){bubbles.splice(i,1);lives--;continue;}
   var g=ctx.createRadialGradient(b.x-b.r*.35,b.y-b.r*.35,b.r*.1,b.x,b.y,b.r);
   if(b.bad){g.addColorStop(0,'rgba(255,180,180,.95)');g.addColorStop(.6,'rgba(255,80,120,.45)');g.addColorStop(1,'rgba(180,20,60,.1)');}
   else{g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(.55,'rgba(140,220,255,.42)');g.addColorStop(1,'rgba(90,150,255,.08)');}
   ctx.fillStyle=g;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,6.2832);ctx.fill();
   ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=1.5;ctx.stroke();
   ctx.fillStyle='rgba(255,255,255,.75)';ctx.beginPath();
   ctx.arc(b.x-b.r*.35,b.y-b.r*.35,b.r*.2,0,6.2832);ctx.fill();
  }
  if(lives<=0){run=false;mt.textContent='Пузырь лопнул';mp.textContent='Не трогай красные — они лопаются вместе с настроением. Очки: '+score;msg.hidden=false;}
  requestAnimationFrame(frame);
 }
 frame();
})();
</script></body></html>`;

  const catchDrop = `<!doctype html><html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;margin:0;padding:0;user-select:none;-webkit-user-select:none}
body{height:100vh;overflow:hidden;font:600 15px/1.4 -apple-system,"Segoe UI",system-ui,sans-serif;color:#08131a;
 background:radial-gradient(120% 90% at 80% 0%,#d9f4ff,#f6fbff 60%,#e7f0ff)}
canvas{position:absolute;inset:0;width:100%;height:100%;touch-action:none}
.hud{position:absolute;left:14px;right:14px;top:14px;display:flex;justify-content:space-between;gap:10px;z-index:3;color:#0b1a24}
.pill{padding:9px 16px;border-radius:20px;background:rgba(255,255,255,.55);border:1px solid rgba(255,255,255,.8);
 backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:0 12px 30px rgba(30,70,110,.18)}
.btn{cursor:pointer;transition:transform .25s cubic-bezier(.22,1,.36,1)}.btn:active{transform:scale(.94)}
.msg{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:24px;z-index:4;
 background:rgba(255,255,255,.4);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
.msg[hidden]{display:none}.msg h2{font-size:22px;margin-bottom:8px;font-weight:800}
.msg p{opacity:.7;font-weight:500;max-width:300px;margin:0 auto 16px}
.msg button{padding:12px 26px;border-radius:18px;border:1px solid rgba(255,255,255,.9);cursor:pointer;
 background:linear-gradient(135deg,var(--accent,#0ea5e9),rgba(255,255,255,.6));color:#fff;font:inherit;font-weight:700}
</style></head><body>
<canvas id="cv"></canvas>
<div class="hud"><div class="pill">Капли: <span id="sc">0</span></div><div class="pill btn" id="reset">Заново</div></div>
<div class="msg" id="msg" hidden><div><h2>Стакан переполнен ощущениями</h2><p id="mp"></p><button id="again">Ещё раз</button></div></div>
<script>
(function(){
 var cv=document.getElementById('cv'),ctx=cv.getContext('2d'),sc=document.getElementById('sc'),
 msg=document.getElementById('msg'),mp=document.getElementById('mp');
 var W=0,H=0,dpr=1,cupX=0,cupW=110,drops=[],score=0,miss=0,run=true,t=0;
 function fit(){dpr=Math.min(2,window.devicePixelRatio||1);W=cv.clientWidth;H=cv.clientHeight;
  cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
  cupW=Math.max(84,Math.min(150,W*0.28));cupX=Math.min(Math.max(cupX,cupW/2),W-cupW/2);}
 window.addEventListener('resize',fit);cupX=window.innerWidth/2;fit();
 cv.addEventListener('pointermove',function(e){cupX=e.clientX-cv.getBoundingClientRect().left;});
 cv.addEventListener('pointerdown',function(e){cupX=e.clientX-cv.getBoundingClientRect().left;});
 function reset(){drops=[];score=0;miss=0;run=true;msg.hidden=true;sc.textContent='0';}
 document.getElementById('reset').onclick=reset;document.getElementById('again').onclick=reset;
 function frame(){
  t++;
  if(run&&t%34===0)drops.push({x:30+Math.random()*(W-60),y:-20,v:1.6+Math.random()*1.8,good:Math.random()>0.24,r:7+Math.random()*6});
  ctx.clearRect(0,0,W,H);
  var cupY=H-64;
  for(var i=drops.length-1;i>=0;i--){var d=drops[i];d.y+=d.v;
   var g=ctx.createRadialGradient(d.x-2,d.y-2,1,d.x,d.y,d.r);
   if(d.good){g.addColorStop(0,'#ffffff');g.addColorStop(1,'#38bdf8');}else{g.addColorStop(0,'#ffe3e3');g.addColorStop(1,'#f43f5e');}
   ctx.fillStyle=g;ctx.beginPath();ctx.arc(d.x,d.y,d.r,0,6.2832);ctx.fill();
   if(d.y>cupY-6&&d.y<cupY+40&&Math.abs(d.x-cupX)<cupW/2){drops.splice(i,1);if(d.good){score+=10;sc.textContent=score;}else{miss++;}}
   else if(d.y>H+20){drops.splice(i,1);if(d.good)miss++;}
  }
  if(miss>=3){run=false;mp.textContent='Пропущено три капли. Собрано: '+score;msg.hidden=false;}
  ctx.save();
  ctx.beginPath();ctx.moveTo(cupX-cupW/2,cupY);ctx.lineTo(cupX+cupW/2,cupY);
  ctx.lineTo(cupX+cupW/2-14,cupY+68);ctx.lineTo(cupX-cupW/2+14,cupY+68);ctx.closePath();
  var cg=ctx.createLinearGradient(0,cupY,0,cupY+68);cg.addColorStop(0,'rgba(255,255,255,.75)');cg.addColorStop(1,'rgba(120,200,255,.35)');
  ctx.fillStyle=cg;ctx.fill();ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=2;ctx.stroke();
  ctx.restore();
  requestAnimationFrame(frame);
 }
 frame();
})();
</script></body></html>`;

  const shrinkTarget = `<!doctype html><html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;margin:0;padding:0;user-select:none;-webkit-user-select:none}
body{height:100vh;overflow:hidden;font:600 15px/1.4 -apple-system,"Segoe UI",system-ui,sans-serif;color:#f4f0ff;
 background:radial-gradient(120% 90% at 50% 110%,#3b2a63,#100c1c 70%)}
canvas{position:absolute;inset:0;width:100%;height:100%;touch-action:none}
.hud{position:absolute;left:14px;right:14px;top:14px;display:flex;justify-content:space-between;gap:10px;z-index:3}
.pill{padding:9px 16px;border-radius:20px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);
 backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:0 10px 30px rgba(0,0,0,.4)}
.btn{cursor:pointer;transition:transform .25s cubic-bezier(.22,1,.36,1)}.btn:active{transform:scale(.94)}
.msg{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:24px;z-index:4;
 background:rgba(10,8,22,.5);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.msg[hidden]{display:none}.msg h2{font-size:22px;margin-bottom:8px;font-weight:800}
.msg p{opacity:.8;font-weight:500;max-width:320px;margin:0 auto 16px}
.msg button{padding:12px 26px;border-radius:18px;border:1px solid rgba(255,255,255,.28);cursor:pointer;
 background:linear-gradient(135deg,var(--accent,#a78bfa),rgba(255,255,255,.22));color:#fff;font:inherit;font-weight:700}
</style></head><body>
<canvas id="cv"></canvas>
<div class="hud"><div class="pill">Очки: <span id="sc">0</span></div><div class="pill btn" id="reset">Заново</div></div>
<div class="msg" id="msg" hidden><div><h2>Время вышло</h2><p id="mp"></p><button id="again">Ещё раз</button></div></div>
<script>
(function(){
 var cv=document.getElementById('cv'),ctx=cv.getContext('2d'),sc=document.getElementById('sc'),
 msg=document.getElementById('msg'),mp=document.getElementById('mp');
 var W=0,H=0,dpr=1,target=null,score=0,left=25,run=true,acc=0,last=performance.now();
 function fit(){dpr=Math.min(2,window.devicePixelRatio||1);W=cv.clientWidth;H=cv.clientHeight;
  cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
 window.addEventListener('resize',fit);fit();
 function next(){var maxR=Math.min(64,W*0.16),r0=maxR*(0.7+Math.random()*0.3);
  target={x:r0+Math.random()*(W-2*r0),y:r0+40+Math.random()*(H-2*r0-80),r0:r0,r:r0,born:performance.now()};}
 function reset(){score=0;left=25;run=true;acc=0;msg.hidden=true;sc.textContent='0';next();}
 document.getElementById('reset').onclick=reset;document.getElementById('again').onclick=reset;
 cv.addEventListener('pointerdown',function(e){
  if(!run||!target)return;
  var rect=cv.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;
  var d=Math.hypot(target.x-x,target.y-y);
  if(d<target.r){score+=Math.max(5,Math.round(60*(1-d/target.r)+10));sc.textContent=score;next();}
  else{score=Math.max(0,score-5);sc.textContent=score;}
 });
 function frame(now){
  var dt=Math.min(50,now-last);last=now;
  if(run){left-=dt/1000;acc+=dt;
   if(target){target.r=target.r0*Math.max(0.12,1-(now-target.born)/2600);}
   if(!target||target.r<=target.r0*0.13)next();
   if(left<=0){run=false;mp.textContent='Точность тренируется. Итог: '+score+' очков.';msg.hidden=false;}
  }
  ctx.clearRect(0,0,W,H);
  if(target){
   var g=ctx.createRadialGradient(target.x,target.y,1,target.x,target.y,target.r);
   g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(.7,'rgba(167,139,250,.5)');g.addColorStop(1,'rgba(167,139,250,.05)');
   ctx.fillStyle=g;ctx.beginPath();ctx.arc(target.x,target.y,target.r,0,6.2832);ctx.fill();
   ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=2;ctx.stroke();
   ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=1.5;ctx.beginPath();
   ctx.arc(target.x,target.y,Math.max(2,target.r*0.32),0,6.2832);ctx.stroke();
  }
  requestAnimationFrame(frame);
 }
 requestAnimationFrame(function(t){last=t;frame(t);});
})();
</script></body></html>`;

  APP.EXTRAS = {
    facts, quotes, quests, gameSets,
    miniGames: [
      { name: 'Мыльные пузыри', emoji: '🫧', blurb: 'Лопай прозрачные и не трогай красные.', html: bubblePop },
      { name: 'Поймай каплю', emoji: '💧', blurb: 'Двигай стеклянный стакан и собирай капли.', html: catchDrop },
      { name: 'Точный клик', emoji: '🎯', blurb: 'Цель сжимается — успей щёлкнуть в центр.', html: shrinkTarget }
    ]
  };
})(typeof window !== 'undefined' ? window : globalThis);
