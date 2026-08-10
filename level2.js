(() => {
  'use strict';
  const $ = s => document.querySelector(s), table = $('#table'), status = $('#status'), count = $('#count'), logEl = $('#log');
  const intentTitle = $('#intentTitle'), intentBody = $('#intentBody'), intentEta = $('#intentEta');
  const DEF = { base:['营地','🏕️','基地'], villager:['村民','🧑','工人'], forest:['树林','🌲','资源点'], quarry:['矿脉','⛰️','资源点'], wood:['木头','🪵','资源'], stone:['石头','🪨','资源'], tower:['哨塔','🗼','防御'], spear:['持矛村民','🧑‍🌾','士兵'], aiBase:['AI营地','🏰','AI基地'], aiForest:['AI树林','🌲','AI资源'], aiQuarry:['AI矿脉','⛰️','AI资源'], aiBarracks:['AI训练营','🏛️','AI建筑'], aiArmy:['AI军队','⚔️','AI军队'] };
  const STATS = { base:[0,12], tower:[2,8], spear:[3,4], aiBase:[0,12], aiBarracks:[0,6], aiArmy:[4,7] };
  let cards, step, log, drag, ai, over;
  function uid(){ return Math.random().toString(36).slice(2,8); }
  function card(type,x,y,extra={}){ const s=STATS[type]; return { id:uid(), type, x, y, ...(s?{hp:s[1]}:{}), ...extra }; }
  function fresh(){ cards=[card('base',70,80),card('villager',220,80),card('forest',380,80,{uses:8}),card('quarry',540,80,{uses:6}),card('aiBase',900,80),card('aiForest',760,260,{blocked:0}),card('aiQuarry',920,260),]; ai={wood:0,stone:0,army:0}; step=0; over=false; log=['第二关：在熟悉的卡桌上加入行动节拍与可读 AI。']; drag=null; render(); }
  function addLog(t){ log.unshift(t); log=log.slice(0,10); }
  function add(type,x,y,extra){ const c=card(type,x,y,extra); cards.push(c); return c; }
  function has(type){ return cards.some(c=>c.type===type); }
  function remove(c){ cards=cards.filter(x=>x.id!==c.id); }
  function spend(types){ for(const t of types){ const c=cards.find(x=>x.type===t); if(!c) return false; remove(c); } return true; }
  function playerStep(){ if(over) return; step++; if(step%2===0) aiAct(); checkEnd(); render(true); }
  function intent(){ if(has('aiArmy')) return ['正在向前推进','AI 军队下次行动会攻击哨塔、持矛村民或营地。']; if(!has('aiBarracks') && ai.wood>=2 && ai.stone>=1) return ['正在建设训练营','AI 资源已够，下次行动建训练营。突袭 AI 树林可延后。']; if(has('aiBarracks')) return ['正在训练军队','AI 会补矿并训练军队。趁窗口攻击 AI 营地。']; if(ai.wood<2) return ['正在采集木头','AI 需要木头建设训练营。持矛村民拖到 AI 树林可打断。']; return ['正在采集矿石','AI 还差矿石建设训练营。']; }
  function aiAct(){ const army=cards.find(c=>c.type==='aiArmy'); if(army){ const target=cards.find(c=>c.type==='tower')||cards.find(c=>c.type==='spear')||cards.find(c=>c.type==='base'); if(target){ target.hp-=4; addLog(`AI 行动：军队攻击${DEF[target.type][0]}，造成 4 伤害。`); if(target.hp<=0){ remove(target); addLog(`${DEF[target.type][0]}被击毁。`); } } return; }
    if(!has('aiBarracks') && ai.wood>=2 && ai.stone>=1){ ai.wood-=2; ai.stone--; add('aiBarracks',790,80); addLog('AI 行动：建成训练营。'); return; }
    if(has('aiBarracks')){ if(ai.stone>0){ ai.stone--; add('aiArmy',790,430); addLog('AI 行动：训练出一支军队。'); } else { ai.stone++; addLog('AI 行动：为训练军队采矿。'); } return; }
    const f=cards.find(c=>c.type==='aiForest'); if(ai.wood<2){ if(f?.blocked>0){ f.blocked--; addLog('AI 行动：树林被突袭，木头收入被打断。'); } else { ai.wood++; addLog('AI 行动：采集 1 木头。'); } } else { ai.stone++; addLog('AI 行动：采集 1 矿石。'); } }
  function gather(node){ if(node.uses<=0) return; const out=node.type==='forest'?'wood':'stone'; node.uses--; add(out,node.x+135+(node.uses%2)*40,node.y+30); addLog(`采集：点击${DEF[node.type][0]}，获得${DEF[out][0]}。`); playerStep(); }
  function combine(a,b){ if(over) return false; const types=[a.type,b.type].sort().join('+');
    if(types==='base+stone' && has('wood')){ if(spend(['wood'])){ add('tower',a.x+80,a.y+170); addLog('建设：营地 + 石头 + 木头 → 哨塔。'); playerStep(); return true; } }
    if(types==='stone+villager' && has('wood')){ if(spend(['wood'])){ remove(a.type==='stone'?a:b); add('spear',b.x+30,b.y+30); addLog('武装：村民 + 石头 + 木头 → 持矛村民。'); playerStep(); return true; } }
    const fighter=a.type==='spear'?a:b.type==='spear'?b:null, target=['aiBase','aiForest','aiBarracks','aiArmy'].includes(a.type)?a:['aiBase','aiForest','aiBarracks','aiArmy'].includes(b.type)?b:null;
    if(fighter&&target){ if(target.type==='aiForest'){ target.blocked=2; addLog('快攻：持矛村民突袭 AI 树林，打断 2 次木头收入。'); playerStep(); return true; } target.hp=(target.hp||1)-3; fighter.hp-=1; addLog(`战斗：持矛村民攻击${DEF[target.type][0]}，造成 3 伤害。`); if(target.hp<=0){ remove(target); if(target.type==='aiBase') win(); } if(fighter.hp<=0) remove(fighter); playerStep(); return true; }
    status.textContent=`${DEF[a.type][0]} + ${DEF[b.type][0]} 暂无反应。`; render(); return false; }
  function checkEnd(){ const base=cards.find(c=>c.type==='base'); if(!base){ over=true; document.body.classList.add('lost'); status.textContent='失败：玩家营地归零。'; } }
  function win(){ over=true; document.body.classList.add('won'); try{localStorage.setItem('level2Complete','yes')}catch(_){} status.textContent='胜利：AI 营地被摧毁。主界面已记录第二关完成。'; }
  function hit(x,y,id){ return cards.slice().reverse().find(c=>c.id!==id&&x>=c.x&&x<=c.x+118&&y>=c.y&&y<=c.y+156); }
  function down(e,id){ const c=cards.find(x=>x.id===id); drag={id,dx:e.offsetX,dy:e.offsetY,moved:false,sx:e.clientX,sy:e.clientY}; e.currentTarget.setPointerCapture?.(e.pointerId); }
  function move(e){ if(!drag) return; const c=cards.find(x=>x.id===drag.id); if(!c) return; if(!drag.moved&&Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy)<6) return; drag.moved=true; const r=table.getBoundingClientRect(); c.x=e.clientX-r.left-drag.dx; c.y=e.clientY-r.top-drag.dy; render(); }
  function up(){ if(!drag) return; const c=cards.find(x=>x.id===drag.id), was=drag; drag=null; if(!c) return; if(!was.moved && ['forest','quarry'].includes(c.type)){ gather(c); return; } const t=hit(c.x+59,c.y+78,c.id); if(t) combine(c,t); else render(); }
  function label(c){ const d=DEF[c.type]; const stat=STATS[c.type]?`<span class="stats">血 ${c.hp}/${STATS[c.type][1]}</span>`:''; const extra=c.type==='forest'||c.type==='quarry'?`点击采集 · 剩 ${c.uses}`:c.type==='aiForest'&&c.blocked?`被打断 ${c.blocked}`:d[2]; return `<span class="help" title="拖到相关卡牌上互动">?</span><span class="icon">${d[1]}</span><span class="name">${d[0]}</span>${stat}<span class="type">${extra}</span>`; }
  function render(){ const [it,body]=intent(); intentTitle.textContent=it; intentBody.textContent=body; intentEta.textContent=`剩余 ${2-(step%2)} 玩家行动格`; count.textContent=`行动 ${step} · AI 将在 ${2-(step%2)} 格后行动：${it.replace('正在','')}`; logEl.innerHTML=log.map(x=>`<li>${x}</li>`).join(''); table.innerHTML=''; for(const c of cards){ const el=document.createElement('button'); el.className='card '+(['base','tower'].includes(c.type)?'basecard ':'')+(c.type==='spear'?'weapon ':'')+(c.type.startsWith('ai')?'danger ':'')+(c.type==='aiForest'?'aires ':'')+(c.blocked?'blocked ':''); el.style.left=c.x+'px'; el.style.top=c.y+'px'; el.innerHTML=label(c); el.onpointerdown=e=>down(e,c.id); el.onpointermove=move; el.onpointerup=up; el.onpointercancel=up; table.append(el); } }
  function runAcceptancePath(){ fresh(); ['forest','quarry','forest'].forEach(t=>gather(cards.find(c=>c.type===t))); combine(cards.find(c=>c.type==='base'),cards.find(c=>c.type==='stone')); gather(cards.find(c=>c.type==='forest')); gather(cards.find(c=>c.type==='quarry')); combine(cards.find(c=>c.type==='villager'),cards.find(c=>c.type==='stone')); combine(cards.find(c=>c.type==='spear'),cards.find(c=>c.type==='aiForest')); for(let i=0;i<8&&!over;i++) combine(cards.find(c=>c.type==='spear'),cards.find(c=>c.type==='aiBase')); return debugState(); }
  function debugState(){ return {step,over,winner:has('aiBase')?null:'win',playerBase:cards.find(c=>c.type==='base')?.hp||0,aiBase:cards.find(c=>c.type==='aiBase')?.hp||0,cards:cards.map(c=>c.type),ai:{...ai},log:[...log]}; }
  $('#restart').onclick=fresh; window.__level2Debug={restart:fresh,getState:debugState,runAcceptancePath,apply:t=>{ if(t==='gatherWood')gather(cards.find(c=>c.type==='forest')); if(t==='gatherOre')gather(cards.find(c=>c.type==='quarry')); }}; fresh();
})();
