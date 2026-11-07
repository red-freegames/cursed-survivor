// テスト用ボット：自動で動き・レベルアップを選び、覚醒完了時刻などを記録する（セーブには書き込まない）
window._mc=window._mc||(()=>{const c=new MessageChannel(),q=[];c.port1.onmessage=()=>{const f=q.shift();f&&f()};return f=>{q.push(f);c.port2.postMessage(0)}})();window._tick=window._mc;
saveData=()=>{};saveSet=()=>{};
window._res=window._res||[];
window.botRun=function(cfg){return new Promise(done=>{
  const ch=CHARS.find(c=>c.id===cfg.ch);
  SAVE.stands=DEFS.map(d=>d.id);SAVE.pu=cfg.pu||{};SAVE.cm=cfg.cm||{};SET.auto=true;SET.spd=1;
  SAVE.sd=cfg.sd||{};startGame(ch,cfg.st,false,cfg.endless);
  const R0={ch:cfg.ch,st:cfg.st,deaths:0,allMax:null,allAw:null,firstAw:null,full:null,lv:0,aw:[]};
  R0.cageHit=0;R0.hurt=0;const odp=damageP;damageP=d=>{const h=P.hp;odp(d);if(P.hp<h)R0.hurt+=h-P.hp;if(G.cage&&P.hp<h)R0.cageHit+=h-P.hp};
  R0.fd='-';gameOver=()=>{if(!R0.deaths)R0.fd=(G.t/60).toFixed(1)+'分';R0.deaths++;(R0.dts=R0.dts||[]).push(Math.round(G.t/6)/10);P.hp=P.max;P.inv=2;G.state='play'};
  win=()=>{G.state='done'};
  const BS=[];const osb=spawnBoss;spawnBoss=k=>{osb(k);G.boss.t0=G.t;BS.push(G.boss)};R0.chests=0;openChest=()=>{R0.chests++;rollChest();G.state='play'};
  if(cfg.allChars)SAVE.unlocked=CHARS.map(c=>c.id);
  const step=()=>{
    for(let f=0;f<900;f++){
      if(G.state==='cutin'){endCutin();continue}
      if(G.state==="levelup"){const c=G.choices;let i=c.findIndex(x=>x.k==="sp");if(i<0)i=c.findIndex(x=>x.k==="sk"&&(x.sk.ch||!x.sk.passive||x.sk.id==="kokusen"));if(i<0)i=c.findIndex(x=>x.k==="up"&&x.u==="lv");if(i<0)i=c.findIndex(x=>x.k==="up"&&x.u==="pow");if(i<0)i=c.findIndex(x=>x.k==="up");if(i<0)i=0;pick(i);continue}
      if(G.state==='chest'){G.state='play'}
      if(G.state!=="play"){if(G.state==="done"||G.t>=(cfg.maxT||600))break;G.state="play"}
      // 操縦：敵から離れ、近くの経験値・矢尻へ寄る
      let vx=0,vy=0;for(const e of inR(P.x,P.y,230)){if(e.prop)continue;const dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy)||1,w=(e.type==='boss'?1:1)/(d*d)*4000;vx+=dx/d*w;vy+=dy/d*w}
      for(const h of G.hz){const dx=P.x-h.x,dy=P.y-h.y,d=Math.hypot(dx,dy)||1;if(d<h.r+40){vx+=dx/d*3;vy+=dy/d*3}}
      let tg=null,td=1e9;for(const c of G.chests){const d=Math.hypot(c.x-P.x,c.y-P.y);if(d<td){td=d;tg=c}}
      if(!tg){for(let k=0;k<G.gm.length;k+=3){const g=G.gm[k],d=Math.hypot(g.x-P.x,g.y-P.y);if(d<td){td=d;tg=g}}}
      const bo=G.boss&&!G.boss.dead&&!(G.boss.hide>0)&&!(G.boss.ent>0)?G.boss:null;
      if(bo){const dx=bo.x-P.x,dy=bo.y-P.y,d=Math.hypot(dx,dy)||1,want=bo.st===2?220:110;vx+=dx/d*(d-want)/60;vy+=dy/d*(d-want)/60;vx+=-dy/d*.6;vy+=dx/d*.6}
      else if(tg&&(td<900||G.chests.includes(tg))){vx+=(tg.x-P.x)/td*.8;vy+=(tg.y-P.y)/td*.8}else{vx+=Math.cos(G.t*.3)*.5;vy+=Math.sin(G.t*.3)*.5}
      const l=Math.hypot(vx,vy)||1;joy.on=true;joy.dx=vx/l;joy.dy=vy/l;
      update(1/60);for(const b of BS)if(b.dead&&b.dt===undefined)b.dt=G.t-b.t0;
      const st=G.st;if(st.length>=2&&R0.full===null)R0.full=G.t;
      if(st.length>=2&&st.every(s=>s.lv>=MAXLV)&&R0.allMax===null)R0.allMax=G.t;
      if(st.some(s=>s.aw)&&R0.firstAw===null)R0.firstAw=G.t;
      if(st.length>=2&&st.every(s=>s.aw)&&R0.allAw===null)R0.allAw=G.t;
      if(G.t>=(cfg.maxT||600))break}
    if(G.t>=(cfg.maxT||600)||G.state==="done"){joy.on=false;R0.lv=G.lv;R0.kills=G.kills;R0.gold=Math.floor(G.gold);R0.fin=!!G.finalKilled;spawnBoss=osb;damageP=odp;R0.cageHit=Math.round(R0.cageHit);R0.hurt=Math.round(R0.hurt);R0.boss=BS.map(b=>b.dt!==undefined?Math.round(b.dt)+'秒':'残'+Math.round(b.hp/b.max*100)+'%').join(' ');R0.firstDeath=R0.fd;R0.left=G.chests.length;R0.aw=G.st.filter(s=>s.aw).length;R0.max=G.st.filter(s=>s.lv>=MAXLV).length;R0.sk=G.st.map(s=>s.who.name.split(" ")[1]+":"+s.lv+"/"+s.skills.length).join(" ");
      for(const k of['full','allMax','firstAw','allAw'])R0[k]=R0[k]===null?'-':(R0[k]/60).toFixed(1)+'分';_res.push(R0);done(R0);return}
    window._tick(step)};
  step()})};
window.botQueue=async function(list){window._busy=true;for(const c of list)await botRun(c);window._busy=false};
