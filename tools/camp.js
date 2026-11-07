// キャンペーン通しテスト：新規セーブから、ボットが「ステージ購入→トレーニング→出撃」を繰り返し、
// 初回クリア・キャラ解放・スタンド解放までのプレイ時間を記録する（実セーブには書き込まない）
window._mc=window._mc||(()=>{const c=new MessageChannel(),q=[];c.port1.onmessage=()=>{const f=q.shift();f&&f()};return f=>{q.push(f);c.port2.postMessage(0)}})();window._tick=window._mc;
saveData=()=>{};saveSet=()=>{};SET.auto=true;SET.spd=1;
window.CP={log:[],runs:0,play:0,events:[],done:false,stuck:{}};
SAVE={unlocked:['jin'],stands:['star'],found:[],money:0,stages:['s1'],pu:{},cm:{},sd:{},cleared:[],awakened:[],zk:{},cnt:{},ach:[],synSeen:[],hardCleared:[],title:null,bossKills:0};
const tick=window._tick;
const hm=()=>(CP.play/3600).toFixed(2)+'h';
const ev=(t)=>CP.events.push(hm()+' '+t);
function shop(){
  // 1) 次のステージが買えるなら買う
  STAGES.forEach((s,i)=>{if(stageBuyable(s,i)&&SAVE.money>=s.price){SAVE.money-=s.price;SAVE.stages.push(s.id);ev('STAGE'+(i+1)+'購入')}});
  // 2) マネーで買えるキャラ
  for(const c of CHARS)if(!isUnlocked(c)&&c.unlock.money&&SAVE.money>=c.unlock.money){SAVE.money-=c.unlock.money;SAVE.unlocked.push(c.id);ev(c.name+'購入')}
  // 3) トレーニング（安い順・戦闘に効くもの）。次に買うステージ代は残す
  const nx=STAGES.find((s,i)=>!stageOwned(s)&&i>0&&SAVE.cleared.includes(STAGES[i-1].id));const keep=nx?nx.price:0;
  for(;;){const c=TRAIN.filter(t=>['pow','hp','reg','arm','cd','spd','xp','gold','rev'].includes(t.id)&&puLv(t.id)<t.max).sort((a,b)=>puCost(a)-puCost(b))[0];
    if(!c||SAVE.money-puCost(c)<keep)break;const cost=puCost(c);SAVE.money-=cost;SAVE.pu[c.id]=puLv(c.id)+1}
  // 4) トレーニングが全て最大になったら、キャラ育成 → よく使うスタンドの強化
  if(TRAIN.filter(t=>['pow','hp','reg','arm','cd','spd','xp','gold','rev'].includes(t.id)).every(t=>puLv(t.id)>=t.max)){
    for(;;){const r=SAVE.cm.jin||0;if(r>=3||SAVE.money-CM_COST[r]<keep)break;SAVE.money-=CM_COST[r];SAVE.cm.jin=r+1;ev('ジン育成'+(r+1))}
    const used=DEFS.filter(d=>standUnlocked(d.id)).sort((a,b)=>((SAVE.zk[b.id]||{}).uses||0)-((SAVE.zk[a.id]||{}).uses||0)).slice(0,8);
    for(;;){const d=used.filter(d=>sdLv(d.id)<SD_MAX).sort((a,b)=>sdCost(sdLv(a.id))-sdCost(sdLv(b.id)))[0];if(!d||SAVE.money-sdCost(sdLv(d.id))<keep)break;SAVE.money-=sdCost(sdLv(d.id));SAVE.sd[d.id]=sdLv(d.id)+1}}}
function pickStage(){const own=STAGES.filter(s=>stageOwned(s));const un=own.filter(s=>!SAVE.cleared.includes(s.id));return(un[un.length-1]||own[own.length-1])}
function oneRun(){return new Promise(done=>{
  shop();const st=pickStage(),before=new Set(SAVE.unlocked),bs=new Set(SAVE.stands),bc=new Set(SAVE.cleared);
  startGame(CHARS[0],st.id);openChest=()=>{rollChest();cntAdd('chests',1);G.state='play'};
  const step=()=>{for(let f=0;f<900;f++){
      if(G.state==='cutin'){endCutin();continue}
      if(G.state==='revive'){G.revT0=performance.now()-REV_T*1000-1;updRevive();continue}
      if(G.state==='levelup'){const c=G.choices;let i=c.findIndex(x=>x.own&&x.next);if(i<0)i=c.findIndex(x=>x.d&&!x.own);if(i<0)i=0;pick(i);continue}
      if(G.state==='over'||G.state==='win')break;
      if(G.state!=='play')G.state='play';
      let vx=0,vy=0;for(const e of inR(P.x,P.y,230)){if(e.prop)continue;const dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy)||1,w=4000/(d*d);vx+=dx/d*w;vy+=dy/d*w}
      for(const h of G.hz){const dx=P.x-h.x,dy=P.y-h.y,d=Math.hypot(dx,dy)||1;if(d<h.r+40){vx+=dx/d*3;vy+=dy/d*3}}
      let tg=null,td=1e9;for(const c of G.chests){const d=Math.hypot(c.x-P.x,c.y-P.y);if(d<td){td=d;tg=c}}
      // MAPを見てスタンド使いを探しに行く（1:00〜7:30、ボス戦中以外）
      if(!tg&&G.secrets.length&&G.t>60&&G.t<450&&!G.boss){for(const c of G.secrets){const d=Math.hypot(c.pos.x-P.x,c.pos.y-P.y);if(d<td){td=d;tg=c.pos}}}
      if(!tg){for(let k=0;k<G.gm.length;k+=3){const g=G.gm[k],d=Math.hypot(g.x-P.x,g.y-P.y);if(d<td){td=d;tg=g}}}
      const bo=G.boss&&!G.boss.dead&&!(G.boss.hide>0)&&!(G.boss.ent>0)?G.boss:null;
      if(bo){const dx=bo.x-P.x,dy=bo.y-P.y,d=Math.hypot(dx,dy)||1,want=bo.st===2?220:110;vx+=dx/d*(d-want)/60;vy+=dy/d*(d-want)/60;vx+=-dy/d*.6;vy+=dx/d*.6}
      else if(tg){vx+=(tg.x-P.x)/td*.8;vy+=(tg.y-P.y)/td*.8}
      const l=Math.hypot(vx,vy)||1;joy.on=true;joy.dx=vx/l;joy.dy=vy/l;update(1/60)}
    if(G.state==='over'||G.state==='win'){joy.on=false;document.querySelectorAll('.ov').forEach(o=>{if(o.id!=='hud')o.classList.add('hidden')});
      CP.runs++;CP.play+=G.t+20;
      const r={n:CP.runs,st:st.id,t:Math.round(G.t),res:G.state,fin:!!G.finalKilled,lv:G.lv,gold:Math.floor(G.gold),money:SAVE.money,pu:Object.values(SAVE.pu).reduce((a,b)=>a+b,0)};CP.log.push(r);
      for(const id of SAVE.cleared)if(!bc.has(id))ev('STAGE'+(STAGES.findIndex(s=>s.id===id)+1)+'初回クリア（'+CP.runs+'回目）');
      for(const id of SAVE.unlocked)if(!before.has(id))ev(CHARS.find(c=>c.id===id).name+'解放');
      for(const id of SAVE.stands)if(!bs.has(id))CP.events.push(hm()+' スタンド'+id);
      done(r);return}
    tick(step)};step()})}
window.campaign=async function(maxH){while(!CP.done){const r=await oneRun();
  if(SAVE.cleared.length>=STAGES.length){ev('全ステージクリア');CP.done=true}
  if(CP.play>maxH*3600||CP.runs>=200){CP.done=true}}};
