// --- CONFIGURACIÓN DEL JUEGO ---

const suits = [
    { name: 'huesos', symbol: '🦴', class: 'suit-huesos' },
    { name: 'corazones', symbol: '❤️', class: 'suit-corazones' },
    { name: 'cascabeles', symbol: '🔔', class: 'suit-cascabeles' },
    { name: 'esmeraldas', symbol: '💎', class: 'suit-esmeraldas' },
    { name: 'gotas', symbol: '💧', class: 'suit-gotas' },
    { name: 'estrellas', symbol: '⭐', class: 'suit-estrellas' }
];

const values = Array.from({length: 13}, (_, i) => i + 2); 

// Definición de Jokers Disponibles
const JOKER_CATALOG = {
    lobito: {
        id: 'lobito',
        name: 'Lobito',
        desc: '+4 Mult',
        price: 0,
        rarity: 'common',
        iconType: 'normal',
        iconChar: '🐺',
        effect: (state, handResult) => {
            return { ...handResult, mult: handResult.mult + 4 };
        }
    },
    lobito_mal_imprimido: {
        id: 'lobito_mal_imprimido',
        name: 'Lobito Mal Imprimido',
        desc: 'Mult Aleatorio (+0 a +25)', 
        price: 20,
        rarity: 'rare',
        iconType: 'glitch',
        iconChar: '🐺',
        getBonusMult: () => Math.floor(Math.random() * 26),
        effect: (state, handResult) => {
            const randomMultBonus = JOKER_CATALOG.lobito_mal_imprimido.getBonusMult();
            let newMult = handResult.finalMult + randomMultBonus;
            
            // Marcamos que este resultado proviene de un joker inestable
            return { 
                ...handResult, 
                finalMult: newMult,
                isGlitchy: true, // FLAG IMPORTANTE PARA LA UI
                rawRandomValue: randomMultBonus 
            };
        }
    }
};

// Estado Global
let gameState = {
    targetScore: 300,
    currentScore: 0,
    handsLeft: 4,
    discardsLeft: 3,
    gold: 4,
    deck: [],
    hand: [],
    activeJokers: ['lobito'], // Empezamos solo con el básico
    shopInventory: [] 
};

// Referencias DOM
const handArea = document.getElementById('hand-area');
const playArea = document.getElementById('play-area');
const calcPanel = document.getElementById('calc-panel');
const scoreDisplay = document.getElementById('current-score');
const targetDisplay = document.getElementById('target-score');
const handsDisplay = document.getElementById('hands-left');
const goldDisplay = document.getElementById('gold-display');
const discardsDisplay = document.getElementById('discards-left');
const jokerSlotsContainer = document.getElementById('joker-slots');
const playBtn = document.getElementById('play-btn');
const discardBtn = document.getElementById('discard-btn');

// Nuevas referencias de Tienda
const shopModal = document.getElementById('shop-modal');
const shopItemsContainer = document.getElementById('shop-items');
const continueBtn = document.getElementById('continue-btn');

// --- UTILIDADES MAZO ---

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function createDeck() {
    let deck = [];
    let idCounter = 0;
    suits.forEach(suit => {
        values.forEach(val => {
            deck.push({
                id: `card-${idCounter++}`,
                suit: suit,
                value: val,
                selected: false,
                element: null
            });
        });
    });
    return shuffleArray(deck);
}

// --- RENDERIZADO ---

function renderHand() {
    handArea.innerHTML = '';
    gameState.hand.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = `card ${card.suit.class}`;
        if (card.selected) cardEl.classList.add('selected');
        
        let displayVal = card.value;
        if (card.value === 11) displayVal = 'J';
        else if (card.value === 12) displayVal = 'Q';
        else if (card.value === 13) displayVal = 'K';
        else if (card.value === 14) displayVal = 'A';

        cardEl.innerHTML = `
            <div>${displayVal}</div>
            <div style="font-size: 1.8rem; text-align: center;">${card.suit.symbol}</div>
            <div style="text-align: right;">${displayVal}</div>
        `;
        
        cardEl.addEventListener('click', () => toggleSelect(card));
        card.element = cardEl;
        handArea.appendChild(cardEl);
    });
}

function renderJokers() {
    jokerSlotsContainer.innerHTML = '';
    
    gameState.activeJokers.forEach(jId => {
        const jokerData = JOKER_CATALOG[jId];
        if (!jokerData) return;

        const slot = document.createElement('div');
        slot.className = 'joker-slot filled';
        
        let iconHtml = '';
        if (jokerData.iconType === 'glitch') {
            iconHtml = `<div class="joker-icon joker-glitch-icon" data-text="${jokerData.iconChar}">${jokerData.iconChar}</div>`;
        } else {
            iconHtml = `<div class="joker-icon">${jokerData.icon || '❓'}</div>`;
        }

        slot.innerHTML = `
            <div class="joker-card">
                ${iconHtml}
                <div class="joker-name">${jokerData.name}</div>
                <div class="joker-effect">${jokerData.desc}</div>
            </div>
        `;
        jokerSlotsContainer.appendChild(slot);
    });

    const totalSlots = 2; 
    for(let i = gameState.activeJokers.length; i < totalSlots; i++) {
        const slot = document.createElement('div');
        slot.className = 'joker-slot empty';
        slot.innerText = 'Vacío';
        jokerSlotsContainer.appendChild(slot);
    }
}

function updateUI() {
    scoreDisplay.textContent = gameState.currentScore;
    targetDisplay.textContent = gameState.targetScore;
    handsDisplay.textContent = gameState.handsLeft;
    goldDisplay.textContent = gameState.gold;
    discardsDisplay.textContent = gameState.discardsLeft;

    if(gameState.currentScore >= gameState.targetScore) {
        scoreDisplay.style.color = "#1dd1a1";
    } else {
        scoreDisplay.style.color = "#f5f6fa";
    }
    
    playBtn.disabled = gameState.handsLeft <= 0;
    discardBtn.disabled = gameState.discardsLeft <= 0 || gameState.handsLeft <= 0;
}

// --- LÓGICA DE SELECCIÓN Y MOVIMIENTO ---

function toggleSelect(card) {
    if (gameState.handsLeft <= 0) return;
    card.selected = !card.selected;
    card.element.classList.toggle('selected');
    updateCalculationPreview();
}

function getSelectedCards() {
    return gameState.hand.filter(c => c.selected);
}

// --- EVALUACIÓN DE MANOS ---

function evaluateHandLogic(cardsPlayed) {
    if (cardsPlayed.length === 0) return null;

    const sortedCards = [...cardsPlayed].sort((a, b) => b.value - a.value);
    const valuesArr = sortedCards.map(c => c.value);
    const suitsArr = sortedCards.map(c => c.suit.name);
    
    const counts = {};
    valuesArr.forEach(v => counts[v] = (counts[v] || 0) + 1);
    const countValues = Object.values(counts).sort((a,b) => b-a);
    
    const uniqueSuitsCount = new Set(suitsArr).size;
    const isFlush = uniqueSuitsCount === 1 && cardsPlayed.length >= 5;
    
    let isStraight = false;
    if (cardsPlayed.length >= 5) {
        const uniqueVals = [...new Set(valuesArr)].sort((a,b)=>a-b);
        if (uniqueVals.length >= 5) {
            isStraight = true;
            for(let i=1; i<Math.min(uniqueVals.length, 5); i++) {
                if(uniqueVals[i] !== uniqueVals[i-1] + 1) {
                    isStraight = false;
                    break;
                }
            }
        }
    }

    let isRoyalFlush = false;
    if (isFlush && isStraight && cardsPlayed.length >= 5) {
         const top5 = sortedCards.slice(0, 5).map(c => c.value);
         if (top5.includes(14) && top5.includes(13) && top5.includes(12) && top5.includes(11) && top5.includes(10)) {
             isRoyalFlush = true;
         }
    }

    let handType = "";
    let baseChips = 0;
    let multiplier = 1;
    let description = "";

    if (isRoyalFlush) {
        handType = "Reunión De Alfas";
        baseChips = 100; multiplier = 10;
        description = "Felicidades, ganaste el premio gordo.";
    } 
    else if (isStraight && isFlush) {
        handType = "Ascenso Limpio";
        baseChips = 100; multiplier = 8;
        description = "Esa sí fue una jugada seria, ahora sí.";
    }
    else if (countValues[0] === 4) {
        handType = "Cuatrillizos";
        baseChips = 60; multiplier = 7;
        description = "Que suerte que te salieron los 4... ¿te imaginas te salen los 5?";
    }
    else if (countValues[0] === 3 && countValues[1] === 2) {
        handType = "Manada Básica";
        baseChips = 40; multiplier = 4;
        description = "Trillizos y una parejita, ¿a que no parecen familia?";
    }
    else if (isFlush) {
        handType = "Colorido";
        baseChips = 35; multiplier = 4;
        description = "Todos visten el mismo collar.";
    }
    else if (isStraight) {
        handType = "Ascenso";
        baseChips = 30; multiplier = 4;
        description = "5 en un orden bastante bueno, pero podría ser mejor.";
    }
    else if (countValues[0] === 3) {
        handType = "Trillizos";
        baseChips = 30; multiplier = 3;
        description = "3 hermanos de tier idéntica, increíble.";
    }
    else if (countValues[0] === 2 && countValues[1] === 2) {
        handType = "Doble Dueto";
        baseChips = 20; multiplier = 2;
        description = "Dos parejitas a la vez, simple ¿no?";
    }
    else if (countValues[0] === 2) {
        handType = "Parejita";
        baseChips = 10; multiplier = 2;
        description = "2 cartas del mismo tier, por algo 2 es mejor que 1.";
    }
    else {
        handType = "El Más Fuerte";
        baseChips = 5; multiplier = 1;
        description = "La carta más fuerte del desorden.";
    }

    const sumCardValues = cardsPlayed.reduce((acc, curr) => acc + curr.value, 0);
    let totalChips = baseChips + sumCardValues;
    let finalMult = multiplier;

    return {
        type: handType,
        desc: description,
        baseChips: baseChips,
        sumCards: sumCardValues,
        totalChips: totalChips,
        baseMult: multiplier,
        finalMult: finalMult,
        points: totalChips * finalMult
    };
}

function applyJokerEffects(handResult) {
    if (!handResult) return null;
    
    let result = { ...handResult };
    result.isGlitchy = false; 
    
    gameState.activeJokers.forEach(jId => {
        const joker = JOKER_CATALOG[jId];
        if (joker && joker.effect) {
            result = joker.effect(gameState, result);
        }
    });

    result.points = result.totalChips * result.finalMult;
    
    return result;
}

// --- FUNCIÓN DE ANIMACIÓN DE GLITCH ---
function animateGlitchText(element, finalValue, callback) {
    if (!element) return;
    
    const junkChars = ['@', '&', '%', '#', '$', '!', '?', '~'];
    let iterations = 0;
    const maxIterations = 15; 
    
    element.classList.add('erroring');
    element.classList.remove('stable');
    
    const interval = setInterval(() => {
        iterations++;
        
        if (iterations < maxIterations) {
            const char1 = junkChars[Math.floor(Math.random() * junkChars.length)];
            const char2 = junkChars[Math.floor(Math.random() * junkChars.length)];
            element.innerHTML = `+${char1}${char2}`;
        } else {
            clearInterval(interval);
            element.classList.remove('erroring');
            element.classList.add('stable');
            element.innerHTML = `+${finalValue}`;
            
            if (callback) callback();
        }
    }, 50); 
}

// --- RENDERIZADO DEL PANEL DE CÁLCULO ACTUALIZADO ---
function updateCalculationPreview() {
    const selected = getSelectedCards();
    
    if (selected.length === 0) {
        calcPanel.innerHTML = '<span class="placeholder-text">Selecciona cartas para ver el cálculo...</span>';
        playArea.innerHTML = '<span class="placeholder-text">Juega tus cartas aquí</span>';
        return;
    }

    playArea.innerHTML = '';
    selected.forEach(card => {
        const clone = card.element.cloneNode(true);
        clone.classList.remove('selected');
        playArea.appendChild(clone);
    });

    const rawResult = evaluateHandLogic(selected);
    const finalResult = applyJokerEffects(rawResult);

    if (finalResult) {
        const multSpanId = 'dynamic-mult-span';
        
        calcPanel.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; gap:5px;">
                <strong style="color:#fff;">${finalResult.type}</strong>
                <div style="font-size:0.85rem; color:#ccc;">(${finalResult.desc})</div>
                <div style="margin-top:5px; font-size:1.1rem; display:flex; align-items:center; gap:5px;">
                    <span class="calc-highlight-chips">[${finalResult.baseChips}]</span> 
                    <span>+</span>
                    <span class="calc-highlight-chips">[${finalResult.sumCards}]</span> 
                    <span>=</span>
                    <span class="calc-highlight-chips">[${finalResult.totalChips}]</span>
                    
                    <span style="margin:0 5px; font-weight:bold;">x</span>
                    
                    <span id="${multSpanId}" class="glitch-text stable">+${finalResult.finalMult}</span>
                    
                    <span style="margin:0 5px; font-weight:bold;">=</span>
                    
                    <span class="calc-highlight-total">${finalResult.points}</span>
                </div>
            </div>
        `;

        if (finalResult.isGlitchy) {
            const targetElement = document.getElementById(multSpanId);
            targetElement.innerHTML = "+??"; 
            
            setTimeout(() => {
                animateGlitchText(targetElement, finalResult.finalMult);
            }, 100); 
        }
    }
}

// --- ACCIONES PRINCIPALES ---

function drawNewHand() {
    gameState.hand.forEach(c => c.selected = false);
    while (gameState.hand.length < 8 && gameState.deck.length > 0) {
        gameState.hand.push(gameState.deck.pop());
    }
    renderHand();
    updateCalculationPreview();
}

playBtn.addEventListener('click', () => {
    if (gameState.handsLeft <= 0) return;

    const selected = getSelectedCards();
    if (selected.length === 0) {
        alert("Selecciona al menos una carta.");
        return;
    }

    const rawResult = evaluateHandLogic(selected);
    const finalResult = applyJokerEffects(rawResult);

    if (finalResult) {
        gameState.currentScore += finalResult.points;
        gameState.handsLeft--;
        
        gameState.hand = gameState.hand.filter(c => !c.selected);
        gameState.hand.forEach(c => c.selected = false);

        playArea.innerHTML = `<div style="color:#1dd1a1; font-weight:bold; font-size:1.5rem;">+${finalResult.points} PTS!</div>`;
        
        setTimeout(() => {
            drawNewHand();
            updateUI();
            checkWinCondition();
        }, 800);
    }
});

discardBtn.addEventListener('click', () => {
    if (gameState.discardsLeft <= 0 || gameState.handsLeft <= 0) return;

    const selected = getSelectedCards();
    if (selected.length === 0) {
        alert("Selecciona cartas para descartar.");
        return;
    }

    gameState.discardsLeft--;
    gameState.hand = gameState.hand.filter(c => !c.selected);
    
    while (gameState.hand.length < 8 && gameState.deck.length > 0) {
        gameState.hand.push(gameState.deck.pop());
    }
    
    renderHand();
    updateCalculationPreview();
    updateUI();
});

// --- LÓGICA DE TIENDA ---

function generateShopInventory() {
    const availableIds = Object.keys(JOKER_CATALOG).filter(id => !gameState.activeJokers.includes(id));
    const shuffled = shuffleArray([...availableIds]);
    gameState.shopInventory = shuffled.slice(0, 3);
}

function renderShop() {
    shopItemsContainer.innerHTML = '';
    
    if (gameState.shopInventory.length === 0) {
        shopItemsContainer.innerHTML = '<p>No hay más mascotas disponibles por ahora.</p>';
        return;
    }

    gameState.shopInventory.forEach(jId => {
        const joker = JOKER_CATALOG[jId];
        const canAfford = gameState.gold >= joker.price;
        
        const itemDiv = document.createElement('div');
        itemDiv.className = `shop-item ${canAfford ? '' : 'disabled'}`;
        
        let iconHtml = '';
        if (joker.iconType === 'glitch') {
            iconHtml = `<div class="joker-icon joker-glitch-icon" data-text="${joker.iconChar}" style="font-size:2rem; margin-bottom:10px;">${joker.iconChar}</div>`;
        } else {
            iconHtml = `<div class="joker-icon" style="font-size:2rem; margin-bottom:10px;">${joker.icon || '❓'}</div>`;
        }

        itemDiv.innerHTML = `
            ${iconHtml}
            <div style="font-weight:bold; color:white;">${joker.name}</div>
            <div style="font-size:0.8rem; color:#aaa; margin:5px 0;">${joker.desc}</div>
            <div class="price-tag">${joker.price}$</div>
        `;

        if (canAfford) {
            itemDiv.addEventListener('click', () => buyJoker(jId));
        }

        shopItemsContainer.appendChild(itemDiv);
    });
}

function buyJoker(jId) {
    const joker = JOKER_CATALOG[jId];
    if (gameState.gold >= joker.price) {
        gameState.gold -= joker.price;
        gameState.activeJokers.push(jId);
        
        gameState.shopInventory = gameState.shopInventory.filter(id => id !== jId);
        
        renderJokers();
        renderShop(); 
        updateUI();
        
        const slots = document.querySelectorAll('.joker-slot.filled');
        if(slots.length > 0) {
            slots[slots.length-1].style.transform = "scale(1.1)";
            setTimeout(() => slots[slots.length-1].style.transform = "scale(1)", 200);
        }
    } else {
        alert("No tienes suficiente oro.");
    }
}

continueBtn.addEventListener('click', () => {
    shopModal.classList.add('hidden');
    
    gameState.targetScore *= 1.5; 
    gameState.currentScore = 0;
    gameState.handsLeft = 4;
    gameState.discardsLeft = 3;
    
    gameState.deck = createDeck();
    gameState.hand = [];
    
    drawNewHand();
    updateUI();
});

function checkWinCondition() {
    if (gameState.currentScore >= gameState.targetScore) {
        const earnedGold = (gameState.handsLeft * 2) + 1;
        gameState.gold += earnedGold;
        
        setTimeout(() => {
            generateShopInventory();
            renderShop();
            shopModal.classList.remove('hidden');
        }, 500);

    } else if (gameState.handsLeft === 0) {
        setTimeout(() => {
            alert("Has perdido la ronda. Game Over.\nRecarga la página para intentar de nuevo.");
            location.reload();
        }, 100);
    }
}

// --- INICIALIZACIÓN ---

function initGame() {
    gameState.deck = createDeck();
    gameState.hand = [];
    drawNewHand();
    renderJokers();
    updateUI();
}

initGame();
