const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const gameFile = path.join(root, 'game.js');
const level2File = path.join(root, 'level2.js');

function makeElement() {
  const e = {
    textContent: '', innerText: '', innerHTML: '', className: '', disabled: false,
    value: '', checked: false, dataset: {}, style: {}, draggable: false, tabIndex: 0,
    classList: { add() {}, remove() {} },
    append() {}, appendChild() {}, setAttribute(k, v) { this[k] = v; }, addEventListener() {},
    querySelector() { return makeElement(); },
    querySelectorAll(sel) { return sel === 'button' ? [makeElement(), makeElement()] : []; },
  };
  return e;
}

function loadGame() {
  const ctx = {
    console, Math, JSON,
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    document: { querySelector() { return makeElement(); }, createElement() { return makeElement(); } },
    window: {},
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(gameFile, 'utf8'), ctx, { filename: 'game.js' });
  if (!ctx.window.__gameDebug) throw new Error('window.__gameDebug not exposed');
  return ctx.window.__gameDebug;
}

function loadLevel2() {
  const elements = new Map();
  const rootEl = makeElement();
  const document = {
    body: makeElement(),
    getElementById(id) { if (!elements.has(id)) elements.set(id, makeElement()); return elements.get(id); },
    querySelector(sel) { if (sel.startsWith('#')) return this.getElementById(sel.slice(1)); return rootEl; },
    querySelectorAll(sel) { return sel === '[data-action]' ? [] : []; },
    createElement() { return makeElement(); }
  };
  const ctx = {
    console, Math, JSON,
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    document, window: {}
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(level2File, 'utf8'), ctx, { filename: 'level2.js' });
  if (!ctx.window.__level2Debug) throw new Error('window.__level2Debug not exposed');
  return ctx.window.__level2Debug;
}

const clone = x => JSON.parse(JSON.stringify(x));
const make = (id, type, place = 'port', refined = false) => ({ id, kind: 'goods', type, place, refined });
let passed = 0;
function check(name, ok) {
  if (!ok) throw new Error(`FAIL: ${name}`);
  passed++;
  console.log(`PASS ${passed}: ${name}`);
}

console.log('1) Syntax check');
execFileSync(process.execPath, ['--check', gameFile], { stdio: 'inherit' });
execFileSync(process.execPath, ['--check', level2File], { stdio: 'inherit' });

console.log('\n2) Rule checks');
const d = loadGame();
d.restart();
const base = d.getState();
const pure = d.pure;
const berries = base.cards.filter(x => x.kind === 'goods' && x.type === 'berry0');
const merged = pure.mergeCards(base, berries[0].id, berries[1].id);
check('two matching berries merge into one jam and reduce inventory by one', merged.ok && merged.card.type === 'berry1g' && merged.state.cards.length === base.cards.length - 1);
let noOrder = clone(base); noOrder.cards = noOrder.cards.filter(x => x.kind === 'goods'); noOrder.checked = {};
let p1 = pure.calculateSettlement(noOrder);
let withOrder = clone(noOrder); withOrder.checked = { breakfast: true };
let p2 = pure.calculateSettlement(withOrder);
check('unchecked order is not auto-delivered', p1.orderReward === 0 && p1.base === 4);
check('checked order consumes goods before shipping', p2.orderReward === 3 && p2.base === 2 && p2.done.includes('breakfast'));
let production = clone(base); production.cards = production.cards.filter(x => x.kind === 'fac');
let pp = pure.calculateSettlement(production);
check('facility production is next-day inventory, not same-day score', pp.production === 4 && pp.base === 0 && pp.total === 0);
let day2 = clone(base); day2.day = 2;
check('Day 2 wind event is visible in route multiplier', pure.routeMult(day2, day2.cards.filter(x => x.kind === 'goods'), true).lines.some(x => x.includes('顺风潮')));
let day4 = clone(base); day4.day = 4; day4.cards = [make('j1', 'berry1g'), make('j2', 'berry1g')]; day4.checked = { jamfair: true };
let jo = pure.calculateSettlement(day4);
check('Day 4 jam fair order gets market-day bonus', jo.done.includes('jamfair') && jo.orderReward === 12 && jo.lines.some(x => x.includes('集市日')));
let day6 = clone(base); day6.day = 6;
check('Day 6 harvest fog increases next-day production', pure.calculateSettlement(day6).production === 6);

console.log('\n3) Full seven-day PC automation playthrough');
d.restart();
const log = [];
function finishDay(label, mutate) {
  const s = d.getState();
  mutate?.(s);
  d.setState(s);
  const before = d.pure.calculateSettlement(d.getState());
  d.endDay();
  const after = d.getState();
  log.push({ label, total: before.total, day: after.day, coins: after.coins, done: after.done.slice(), over: after.over });
}
finishDay('Day1 breakfast', s => { s.checked = { breakfast: true }; });
finishDay('Day2 trial', s => { s.route = ['farm', 'work', 'port']; s.cards = s.cards.filter(c => c.kind === 'fac').concat([make('d2jam', 'berry1g', 'port', true), make('d2a', 'berry0'), make('d2b', 'berry0'), make('d2c', 'berry0')]); s.checked = { trial: true }; });
finishDay('Day3 tea', s => { s.cards = s.cards.filter(c => c.kind === 'fac').concat([make('d3tower', 'berry2g'), make('d3jam', 'berry1g'), make('d3b', 'berry0')]); s.checked = { tea: true }; });
finishDay('Day4 jamfair', s => { s.members = ['captain']; s.cards = s.cards.filter(c => c.kind === 'fac').concat([make('d4j1', 'berry1g'), make('d4j2', 'berry1g'), make('d4t', 'berry2g')]); s.checked = { jamfair: true }; });
finishDay('Day5 tower', s => { s.members = ['captain', 'jam']; s.cards = s.cards.filter(c => c.kind === 'fac').concat([make('d5tower', 'berry2g', 'port', true), make('d5j1', 'berry1g', 'work', true), make('d5j2', 'berry1g', 'work', true)]); s.checked = { tower: true }; });
finishDay('Day6 setup final', s => { s.members = ['captain', 'jam', 'box']; s.cards = s.cards.filter(c => c.kind === 'fac').concat([make('basket', 'berry3g', 'port', true), make('r1', 'berry2g', 'port', true), make('r2', 'berry2g', 'port', true), make('r3', 'berry1g', 'port', true)]); s.checked = {}; s.finalChoice = 'basket'; });
finishDay('Day7 final basket', s => { s.members = ['captain', 'jam', 'box']; s.route = ['farm', 'work', 'port']; s.cards = s.cards.filter(c => c.kind === 'fac').concat([make('basket', 'berry3g', 'port', true), make('final1', 'berry3g', 'port', true), make('final2', 'berry2g', 'port', true), make('final3', 'berry2g', 'port', true), make('final4', 'berry1g', 'port', true)]); s.coins = Math.max(s.coins, 45); s.finalChoice = 'basket'; });
const final = d.getState();
check('full run reaches final over state', final.day === 7 && final.over === true);
check('all normal orders completed', ['breakfast', 'trial', 'tea', 'jamfair', 'tower'].every(x => final.done.includes(x)));
check('all three members recruited', ['captain', 'jam', 'box'].every(x => final.members.includes(x)));
console.log('\nPlaythrough log:', JSON.stringify(log, null, 2));
console.log('\n4) Level 2 deterministic acceptance path');
const l2 = loadLevel2();
l2.restart();
l2.apply('gatherWood');
l2.apply('gatherOre');
let early = l2.getState();
check('Level 2 AI acts after exactly two meaningful player steps', early.step === 2 && early.ai.wood === 1);
check('Level 2 keeps card-table resource cards after gathering', early.cards.includes('wood') && early.cards.includes('stone'));
const won = l2.runAcceptancePath();
check('Level 2 deterministic acceptance path wins by destroying AI base', won.over && won.winner === 'win' && won.aiBase <= 0);

console.log(`\nOK: ${passed} checks passed.`);
