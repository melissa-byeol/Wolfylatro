import { GAME_SETTINGS, audioEngine } from './settings.js';

// --- SVG ICONS (Reemplazo de Emojis) ---
const SUIT_SVGS = {
    huesos: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 4c-1.5 0-2.8.8-3.5 2H10.5C9.8 4.8 8.5 4 7 4 4.8 4 3 5.8 3 8c0 1.5.8 2.8 2 3.5V12.5c-1.2.7-2 2-2 3.5 0 2.2 1.8 4 4 4 1.5 0 2.8-.8 3.5-2h3c.7 1.2 2 2 3.5 2 2.2 0 4-1.8 4-4 0-1.5-.8-2.8-2-3.5V11.5c1.2-.7 2-2 2-3.5 0-2.2-1.8-4-4-4z"/></svg>',
    corazones: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
    cascabeles: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2zm0 4l6.5 13h-13L12 6z"/><circle cx="12" cy="17" r="2"/></svg>',
    esmeraldas: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 12l10 10 10-10L12 2zm0 3.5L18.5 12 12 18.5 5.5 12 12 5.5z"/></svg>',
    gotas: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-5 7-8 10-8 14 0 4.42 3.58 8 8 8s8-3.58 8-8c0-4-3-7-8-14z"/></svg>',
    estrellas: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'
};

const suits = [
    { name: 'huesos', symbol: SUIT_SVGS.huesos, class: 'suit-huesos' },
    { name: 'corazones', symbol: SUIT_SVGS.corazones, class: 'suit-corazones' },
    { name: 'cascabeles', symbol: SUIT_SVGS.cascabeles, class: 'suit-cascabeles' },
    { name: 'esmeraldas', symbol: SUIT_SVGS.esmeraldas, class: 'suit-esmeraldas' },
    { name: 'gotas', symbol: SUIT_SVGS.gotas, class: 'suit-gotas' },
    { name: 'estrellas', symbol: SUIT_SVGS.estrellas, class: 'suit-estrellas' }
];

const values = Array.from({length: 13}, (_, i) => i + 2);

// --- JOKER CATALOG (Iconos SVG simplificados para brevedad) ---
const JOKER_CATALOG = {
    lobito: { id: 'lobito', name: 'Lobito', desc: '+4 Mult', price: 0, rarity: 'common', iconChar: '🐺', effect: (s, r) => ({...r, finalMult: r.finalMult + 4}) },
    lobito_timido: { id: 'lobito_timido', name: 'Lobito Tímido', desc: '+5 Chips por Corazón', price: 4, rarity: 'common', iconChar: '😳', effect: (s, r) => ({...r, totalChips: r.totalChips + s.hand.filter(c=>c.selected&&c.suit.name==='corazones').length*5}) },
    lobito_mordelon: { id: 'lobito_mordelon', name: 'Lobito Mordelón', desc: '+5 Chips por Hueso', price: 4, rarity: 'common', iconChar: '🦴', effect: (s, r) => ({...r, totalChips: r.totalChips + s.hand.filter(c=>c.selected&&c.suit.name==='huesos').length*5}) },
    lobito_triste: { id: 'lobito_triste', name: 'Lobito Triste', desc: '+5 Chips por Gota', price: 4, rarity: 'common', iconChar: '😢', effect: (s, r) => ({...r, totalChips: r.totalChips + s.hand.filter(c=>c.selected&&c.suit.name==='gotas').length*5}) },
    lobito_curioso: { id: 'lobito_curioso', name: 'Lobito Curioso', desc: '+5 Chips por Esmeralda', price: 4, rarity: 'common', iconChar: '🧐', effect: (s, r) => ({...r, totalChips: r.totalChips + s.hand.filter(c=>c.selected&&c.suit.name==='esmeraldas').length*5}) },
    lobito_jugueton: { id: 'lobito_jugueton', name: 'Lobito Juguetón', desc: '+5 Chips por Cascabel', price: 4, rarity: 'common', iconChar: '🔔', effect: (s, r) => ({...r, totalChips: r.totalChips + s.hand.filter(c=>c.selected&&c.suit.name==='cascabeles').length*5}) },
    lobito_sonador: { id: 'lobito_sonador', name: 'Lobito Soñador', desc: '+5 Chips por Estrella', price: 4, rarity: 'common', iconChar: '💤', effect: (s, r) => ({...r, totalChips: r.totalChips + s.hand.filter(c=>c.selected&&c.suit.name==='estrellas').length*5}) },
    lobito_amoroso: { id: 'lobito_amoroso', name: 'Lobito Amoroso', desc: '+3 Mult si hay Corazones', price: 5, rarity: 'common', iconChar: '❤️', effect: (s, r) => ({...r, finalMult: r.finalMult + (s.hand.some(c=>c.selected&&c.suit.name==='corazones')?3:0)}) },
    lobito_calavera: { id: 'lobito_calavera', name: 'Lobito Calavera', desc: '+3 Mult si hay Huesos', price: 5, rarity: 'common', iconChar: '💀', effect: (s, r) => ({...r, finalMult: r.finalMult + (s.hand.some(c=>c.selected&&c.suit.name==='huesos')?3:0)}) },
    lobito_paraguas: { id: 'lobito_paraguas', name: 'Lobito Paraguas', desc: '+3 Mult si hay Gotas', price: 5, rarity: 'common', iconChar: '☂️', effect: (s, r) => ({...r, finalMult: r.finalMult + (s.hand.some(c=>c.selected&&c.suit.name==='gotas')?3:0)}) },
    lobito_ricachon: { id: 'lobito_ricachon', name: 'Lobito Ricachón', desc: '+3 Mult si hay Esmeraldas', price: 5, rarity: 'common', iconChar: '🕶️', effect: (s, r) => ({...r, finalMult: r.finalMult + (s.hand.some(c=>c.selected&&c.suit.name==='esmeraldas')?3:0)}) },
    lobito_inquieto: { id: 'lobito_inquieto', name: 'Lobito Inquieto', desc: '+3 Mult si hay Cascabeles', price: 5, rarity: 'common', iconChar: '⚡', effect: (s, r) => ({...r, finalMult: r.finalMult + (s.hand.some(c=>c.selected&&c.suit.name==='cascabeles')?3:0)}) },
    lobito_astronauta: { id: 'lobito_astronauta', name: 'Lobito Astronauta', desc: '+3 Mult si hay Estrellas', price: 5, rarity: 'common', iconChar: '👨‍🚀', effect: (s, r) => ({...r, finalMult: r.finalMult + (s.hand.some(c=>c.selected&&c.suit.name==='estrellas')?3:0)}) },
    lobito_mal_imprimido: { id: 'lobito_mal_imprimido', name: 'Mal Imprimido', desc: 'Mult Aleatorio (+0 a +25)', price: 20, rarity: 'rare', iconType: 'glitch', iconChar: '🐺', getBonusMult: () => Math.floor(Math.random()*26), effect: (s, r) => { const b = JOKER_CATALOG.lobito_mal_imprimido.getBonusMult(); return {...r, finalMult: r.finalMult+b, isGlitchy:true, rawRandomValue:b}; } }
};

// --- ESTADO GLOBAL ---
let gameState = { targetScore: 300, currentScore: 0, handsLeft: 4, discardsLeft: 3, gold: 4, deck: [], hand: [], activeJokers: ['lobito'], shopInventory: [] };

// --- REFERENCIAS DOM ---
const $ = id => document.getElementById(id);
const handArea = $('hand-area'), playArea = $('play-area'), calcPanel = $('calc-panel');
const scoreDisplay = $('current-score'), targetDisplay = $('target-score');
const handsDisplay = $('hands-left'), goldDisplay = $('gold-display'), discardsDisplay = $('discards-left');
const jokerSlotsContainer = $('joker-slots'), playBtn = $('play-btn'), discardBtn = $('discard-btn');
const shopModal = $('shop-modal'), shopItemsContainer = $('shop-items'), continueBtn = $('continue-btn');
const titleScreen = $('title-screen'), gameScreen = $('game-screen');
const tutorialOverlay = $('tutorial-overlay'), tutorialText = $('tutorial-text'), tutorialNextBtn = $('tutorial-next');

// --- UTILIDADES ---
function shuffleArray(a) { for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
function createDeck() { let d=[],id=0; suits.forEach(s=>values.forEach(v=>d.push({id:`c-${id++}`,suit:s,value:v,selected:false,element:null}))); return shuffleArray(d); }

// --- RENDERIZADO ---
function renderHand() {
    handArea.innerHTML = '';
    gameState.hand.forEach(card => {
        const el = document.createElement('div');
        el.className = `card ${card.suit.class}${card.selected?' selected':''}`;
        let dv = card.value; if(dv===11)dv='J'; else if(dv===12)dv='Q'; else if(dv===13)dv='K'; else if(dv===14)dv='A';
        el.innerHTML = `<div class="card-corner">${dv}</div><div class="card-center">${card.suit.symbol}</div><div class="card-corner bottom">${dv}</div>`;
        el.addEventListener('click', () => toggleSelect(card));
        card.element = el;
        handArea.appendChild(el);
    });
}

function renderJokers() {
    jokerSlotsContainer.innerHTML = '';
    gameState.activeJokers.forEach(jId => {
        const j = JOKER_CATALOG[jId]; if(!j) return;
        const slot = document.createElement('div'); slot.className = 'joker-slot filled';
        slot.innerHTML = `<div class="joker-icon">${j.iconChar}</div><div class="joker-name">${j.name}</div><div class="joker-effect">${j.desc}</div>`;
        jokerSlotsContainer.appendChild(slot);
    });
    for(let i=gameState.activeJokers.length;i<2;i++) { const s=document.createElement('div'); s.className='joker-slot empty'; s.innerText='Vacío'; jokerSlotsContainer.appendChild(s); }
}

function updateUI() {
    scoreDisplay.textContent = gameState.currentScore; targetDisplay.textContent = Math.floor(gameState.targetScore);
    handsDisplay.textContent = gameState.handsLeft; goldDisplay.textContent = gameState.gold; discardsDisplay.textContent = gameState.discardsLeft;
    scoreDisplay.style.color = gameState.currentScore >= gameState.targetScore ? "#1dd1a1" : "#f5f6fa";
    playBtn.disabled = gameState.handsLeft <= 0; discardBtn.disabled = gameState.discardsLeft <= 0 || gameState.handsLeft <= 0;
}

// --- SELECCIÓN Y AUDIO ---
function toggleSelect(card) {
    if(gameState.handsLeft<=0) return;
    card.selected = !card.selected;
    card.selected ? audioEngine.playCardSelect() : audioEngine.playCardDeselect();
    card.element.classList.toggle('selected');
    updateCalculationPreview();
}
function getSelectedCards() { return gameState.hand.filter(c=>c.selected); }

// --- EVALUACIÓN DE MANOS ---
function evaluateHandLogic(cards) {
    if(!cards.length) return null;
    const sorted=[...cards].sort((a,b)=>b.value-a.value), vals=sorted.map(c=>c.value), sts=sorted.map(c=>c.suit.name);
    const counts={}; vals.forEach(v=>counts[v]=(counts[v]||0)+1); const cv=Object.values(counts).sort((a,b)=>b-a);
    const uniqueSuits=new Set(sts).size, isFlush=uniqueSuits===1&&cards.length>=5;
    let isStraight=false; if(cards.length>=5){const uv=[...new Set(vals)].sort((a,b)=>a-b);if(uv.length>=5){isStraight=true;for(let i=1;i<5;i++)if(uv[i]!==uv[i-1]+1)isStraight=false;}}
    let isRoyal=isFlush&&isStraight&&sorted.slice(0,5).map(c=>c.value).every((v,i)=>[14,13,12,11,10][i]===v);
    
    let type="",bc=0,mult=1,desc="";
    if(isRoyal){type="Reunión De Alfas";bc=100;mult=10;desc="¡Premio gordo!";}
    else if(isStraight&&isFlush){type="Ascenso Limpio";bc=100;mult=8;desc="Jugada seria.";}
    else if(cv[0]===4){type="Cuatrillizos";bc=60;mult=7;desc="¡Qué suerte!";}
    else if(cv[0]===3&&cv[1]===2){type="Manada Básica";bc=40;mult=4;desc="Familia completa.";}
    else if(isFlush){type="Colorido";bc=35;mult=4;desc="Mismo collar.";}
    else if(isStraight){type="Ascenso";bc=30;mult=4;desc="Buen orden.";}
    else if(cv[0]===3){type="Trillizos";bc=30;mult=3;desc="Tres hermanos.";}
    else if(cv[0]===2&&cv[1]===2){type="Doble Dueto";bc=20;mult=2;desc="Dos parejitas.";}
    else if(cv[0]===2){type="Parejita";bc=10;mult=2;desc="Mejor que nada.";}
    else{type="El Más Fuerte";bc=5;mult=1;desc="Desorden puro.";}
    
    const sum=cards.reduce((a,c)=>a+c.value,0);
    return {type,desc,baseChips:bc,sumCards:sum,totalChips:bc+sum,baseMult:mult,finalMult:mult,points:(bc+sum)*mult};
}

function applyJokerEffects(r) {
    if(!r) return null; let res={...r,isGlitchy:false};
    gameState.activeJokers.forEach(jId=>{const j=JOKER_CATALOG[jId];if(j?.effect)res=j.effect(gameState,res);});
    res.points=res.totalChips*res.finalMult; return res;
}

function animateGlitchText(el,val,cb) {
    if(!el)return; const junk='@&#%$!?~'; let it=0; el.classList.add('erroring'); el.classList.remove('stable');
    const iv=setInterval(()=>{it++;if(it<15){el.innerHTML=`+${junk[Math.floor(Math.random()*junk.length)]}${junk[Math.floor(Math.random()*junk.length)]}`;}else{clearInterval(iv);el.classList.remove('erroring');el.classList.add('stable');el.innerHTML=`+${val}`;if(cb)cb();}},50);
}

function updateCalculationPreview() {
    const sel=getSelectedCards();
    if(!sel.length){calcPanel.innerHTML='<span class="placeholder-text">Selecciona cartas para ver el cálculo...</span>';playArea.innerHTML='<span class="placeholder-text">Juega tus cartas aquí</span>';return;}
    playArea.innerHTML=''; sel.forEach(c=>{const cl=c.element.cloneNode(true);cl.classList.remove('selected');playArea.appendChild(cl);});
    const raw=evaluateHandLogic(sel), fin=applyJokerEffects(raw);
    if(fin){
        const mid='dyn-mult';
        calcPanel.innerHTML=`<div style="display:flex;flex-direction:column;align-items:center;gap:5px;"><strong>${fin.type}</strong><div style="font-size:0.8rem;color:#ccc;">(${fin.desc})</div><div style="margin-top:5px;font-size:1.1rem;display:flex;align-items:center;gap:5px;"><span class="calc-highlight-chips">[${fin.baseChips}]</span>+<span class="calc-highlight-chips">[${fin.sumCards}]</span>=<span class="calc-highlight-chips">[${fin.totalChips}]</span><b>x</b><span id="${mid}" class="glitch-text stable">+${fin.finalMult}</span><b>=</b><span class="calc-highlight-total">${fin.points}</span></div></div>`;
        if(fin.isGlitchy){const t=$(mid);t.innerHTML="+??";setTimeout(()=>animateGlitchText(t,fin.finalMult),100);}
    }
}

// --- ACCIONES ---
function drawNewHand() { gameState.hand.forEach(c=>c.selected=false); while(gameState.hand.length<8&&gameState.deck.length>0)gameState.hand.push(gameState.deck.pop()); renderHand(); updateCalculationPreview(); }

playBtn.addEventListener('click',()=>{
    if(gameState.handsLeft<=0)return; const sel=getSelectedCards(); if(!sel.length){audioEngine.playGlitchError();return;}
    const fin=applyJokerEffects(evaluateHandLogic(sel));
    if(fin){
        audioEngine.playChipSound(); gameState.currentScore+=fin.points; gameState.handsLeft--;
        gameState.hand=gameState.hand.filter(c=>!c.selected); gameState.hand.forEach(c=>c.selected=false);
        playArea.innerHTML=`<div style="color:#1dd1a1;font-weight:bold;font-size:1.5rem;">+${fin.points} PTS!</div>`;
        setTimeout(()=>{drawNewHand();updateUI();checkWinCondition();},800);
    }
});

discardBtn.addEventListener('click',()=>{
    if(gameState.discardsLeft<=0||gameState.handsLeft<=0)return; const sel=getSelectedCards(); if(!sel.length)return;
    audioEngine.playCardDeselect(); gameState.discardsLeft--; gameState.hand=gameState.hand.filter(c=>!c.selected);
    while(gameState.hand.length<8&&gameState.deck.length>0)gameState.hand.push(gameState.deck.pop());
    renderHand(); updateCalculationPreview(); updateUI();
});

// --- TIENDA ---
function generateShopInventory(){const av=Object.keys(JOKER_CATALOG).filter(id=>!gameState.activeJokers.includes(id));gameState.shopInventory=shuffleArray([...av]).slice(0,3);}
function renderShop(){
    shopItemsContainer.innerHTML=''; if(!gameState.shopInventory.length){shopItemsContainer.innerHTML='<p>Sin mascotas disponibles.</p>';return;}
    gameState.shopInventory.forEach(jId=>{
        const j=JOKER_CATALOG[jId],can=gameState.gold>=j.price,d=document.createElement('div');
        d.className=`shop-item${can?'':' disabled'}`;
        d.innerHTML=`<div style="font-size:2rem;margin-bottom:8px;">${j.iconChar}</div><div style="font-weight:bold;color:#fff;">${j.name}</div><div style="font-size:0.75rem;color:#aaa;margin:5px 0;">${j.desc}</div><div class="price-tag">${j.price}$</div>`;
        if(can)d.addEventListener('click',()=>buyJoker(jId)); shopItemsContainer.appendChild(d);
    });
}
function buyJoker(jId){const j=JOKER_CATALOG[jId];if(gameState.gold>=j.price){audioEngine.playChipSound();gameState.gold-=j.price;gameState.activeJokers.push(jId);gameState.shopInventory=gameState.shopInventory.filter(id=>id!==jId);renderJokers();renderShop();updateUI();}}
continueBtn.addEventListener('click',()=>{audioEngine.playCardSelect();shopModal.classList.add('hidden');gameState.targetScore*=1.5;gameState.currentScore=0;gameState.handsLeft=4;gameState.discardsLeft=3;gameState.deck=createDeck();gameState.hand=[];drawNewHand();updateUI();});

function checkWinCondition(){
    if(gameState.currentScore>=gameState.targetScore){audioEngine.playWin();const eg=(gameState.handsLeft*2)+1;gameState.gold+=eg;setTimeout(()=>{generateShopInventory();renderShop();shopModal.classList.remove('hidden');},500);}
    else if(gameState.handsLeft===0){setTimeout(()=>{audioEngine.playGlitchError();alert("Game Over. Recarga para reintentar.");location.reload();},100);}
}

// --- TUTORIAL ---
const TUTORIAL_STEPS = [
    "¡Bienvenido a la manada! Selecciona cartas haciendo clic sobre ellas.",
    "Forma manos de póker: Parejas, Tríos, Escaleras, Colores...",
    "Cada mano tiene Chips base + valor de cartas. Eso se multiplica por el Mult.",
    "Tus compañeros (Jokers) modifican los Chips o el Mult automáticamente.",
    "Algunos Jokers tienen efectos glitch... ¡cuidado con el Mal Imprimido!",
    "¡Ve a la tienda entre rondas para fortalecer tu manada! ¡Auuu!"
];
let tutorialStep = 0;
function startTutorial() {
    tutorialStep = 0; tutorialOverlay.classList.remove('hidden'); showTutorialStep();
}
function showTutorialStep() {
    if(tutorialStep >= TUTORIAL_STEPS.length) { tutorialOverlay.classList.add('hidden'); return; }
    tutorialText.textContent = TUTORIAL_STEPS[tutorialStep];
    audioEngine.speakTutorial(TUTORIAL_STEPS[tutorialStep]);
}
tutorialNextBtn.addEventListener('click', () => { audioEngine.playCardSelect(); tutorialStep++; showTutorialStep(); });

// --- MENÚ Y SETTINGS ---
$('btn-start').addEventListener('click', () => {
    audioEngine.init(); audioEngine.playCardSelect();
    titleScreen.classList.remove('active'); gameScreen.classList.remove('hidden'); gameScreen.classList.add('active');
    initGame();
});
$('btn-tutorial').addEventListener('click', () => { audioEngine.init(); audioEngine.playCardSelect(); startTutorial(); });
$('speed-slider').addEventListener('input', e => { GAME_SETTINGS.gameSpeed = parseFloat(e.target.value); });
$('audio-toggle').addEventListener('change', e => { GAME_SETTINGS.audio.enabled = e.target.checked; });

// --- INIT ---
function initGame() { gameState.deck=createDeck(); gameState.hand=[]; drawNewHand(); renderJokers(); updateUI(); }
