// --- CONFIGURACIÓN DEL JUEGO ---

const suits = [
    { name: 'huesos', symbol: '🦴', class: 'suit-huesos' },
    { name: 'corazones', symbol: '❤️', class: 'suit-corazones' },
    { name: 'cascabeles', symbol: '🔔', class: 'suit-cascabeles' },
    { name: 'esmeraldas', symbol: '💎', class: 'suit-esmeraldas' },
    { name: 'gotas', symbol: '💧', class: 'suit-gotas' },
    { name: 'estrellas', symbol: '⭐', class: 'suit-estrellas' }
];

// Valores: 2 a 14 (11=J, 12=Q, 13=K, 14=A)
const values = Array.from({length: 13}, (_, i) => i + 2); 

// Definición de Jokers Disponibles (Catálogo)
const JOKER_CATALOG = {
    lobito: {
        id: 'lobito',
        name: 'Lobito',
        desc: '+4 Mult',
        icon: '🐺',
        effect: (state, handResult) => {
            // Aplica siempre +4 al multiplicador final
            return { ...handResult, mult: handResult.mult + 4 };
        }
    }
    // Aquí podrás añadir más jokers fácilmente en el futuro
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
    activeJokers: ['lobito'] // Empezamos con el Lobito equipado
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
        
        // Mostrar valor numérico o letra (J,Q,K,A)
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
    // Renderizar slots activos
    gameState.activeJokers.forEach(jId => {
        const jokerData = JOKER_CATALOG[jId];
        if (!jokerData) return;

        const slot = document.createElement('div');
        slot.className = 'joker-slot filled';
        slot.innerHTML = `
            <div class="joker-card">
                <div class="joker-icon">${jokerData.icon}</div>
                <div class="joker-name">${jokerData.name}</div>
                <div class="joker-effect">${jokerData.desc}</div>
            </div>
        `;
        jokerSlotsContainer.appendChild(slot);
    });

    // Rellenar slots vacíos si hay menos de 2 jokers (visualmente)
    const totalSlots = 2; // Máximo inicial
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
    
    // Deshabilitar botones si no quedan acciones
    playBtn.disabled = gameState.handsLeft <= 0;
    discardBtn.disabled = gameState.discardsLeft <= 0 || gameState.handsLeft <= 0;
}

// --- LÓGICA DE SELECCIÓN Y MOVIMIENTO ---

function toggleSelect(card) {
    if (gameState.handsLeft <= 0) return;
    card.selected = !card.selected;
    card.element.classList.toggle('selected');
    updateCalculationPreview(); // Actualizar preview en tiempo real
}

function getSelectedCards() {
    return gameState.hand.filter(c => c.selected);
}

// --- EVALUACIÓN DE MANOS (TU DISEÑO ESPECÍFICO) ---

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
    
    // Straight Logic
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

    // Royal Flush Check (10, J, Q, K, A same suit)
    let isRoyalFlush = false;
    if (isFlush && isStraight && cardsPlayed.length >= 5) {
         const top5 = sortedCards.slice(0, 5).map(c => c.value);
         // Must contain exactly 10, 11, 12, 13, 14
         if (top5.includes(14) && top5.includes(13) && top5.includes(12) && top5.includes(11) && top5.includes(10)) {
             isRoyalFlush = true;
         }
    }

    let handType = "";
    let baseChips = 0;
    let multiplier = 1;
    let description = "";

    // Jerarquía de detección
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

    // Suma de valores de las cartas jugadas
    const sumCardValues = cardsPlayed.reduce((acc, curr) => acc + curr.value, 0);
    
    // Fórmula Balatro: (Base Chips + Sum Card Values) * Multiplier
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

// Aplicar efectos de Jokers
function applyJokerEffects(handResult) {
    if (!handResult) return null;
    
    let result = { ...handResult };
    
    gameState.activeJokers.forEach(jId => {
        const joker = JOKER_CATALOG[jId];
        if (joker && joker.effect) {
            result = joker.effect(gameState, result);
        }
    });

    // Recalcular puntos finales después de modificadores
    result.points = result.totalChips * result.finalMult;
    
    return result;
}

// --- PREVIEW EN TIEMPO REAL ---

function updateCalculationPreview() {
    const selected = getSelectedCards();
    
    if (selected.length === 0) {
        calcPanel.innerHTML = '<span class="placeholder-text">Selecciona cartas para ver el cálculo...</span>';
        playArea.innerHTML = '<span class="placeholder-text">Juega tus cartas aquí</span>';
        return;
    }

    // Mover visualmente las cartas seleccionadas al área de juego (preview)
    playArea.innerHTML = '';
    selected.forEach(card => {
        const clone = card.element.cloneNode(true);
        clone.classList.remove('selected'); // Quita el borde naranja para que se vea "jugado"
        playArea.appendChild(clone);
    });

    // Calcular resultado preliminar
    const rawResult = evaluateHandLogic(selected);
    const finalResult = applyJokerEffects(rawResult);

    if (finalResult) {
        // Formato HTML para el panel de cálculo
        calcPanel.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; gap:5px;">
                <strong style="color:#fff;">${finalResult.type}</strong>
                <div style="font-size:0.85rem; color:#ccc;">(${finalResult.desc})</div>
                <div style="margin-top:5px; font-size:1.1rem;">
                    <span class="calc-highlight-chips">[${finalResult.baseChips}]</span> 
                    + 
                    <span class="calc-highlight-chips">[${finalResult.sumCards}]</span> 
                    = 
                    <span class="calc-highlight-chips">[${finalResult.totalChips}]</span>
                    
                    <span style="margin:0 10px; font-weight:bold;">x</span>
                    
                    <span class="calc-highlight-mult">[${finalResult.finalMult}]</span>
                    
                    <span style="margin:0 10px; font-weight:bold;">=</span>
                    
                    <span class="calc-highlight-total">${finalResult.points}</span>
                </div>
            </div>
        `;
    }
}

// --- ACCIONES PRINCIPALES ---

function drawNewHand() {
    // Limpiar selección anterior
    gameState.hand.forEach(c => c.selected = false);
    
    // Robar hasta tener 8 cartas (si hay mazo)
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
        // Actualizar estado
        gameState.currentScore += finalResult.points;
        gameState.handsLeft--;
        
        // Eliminar cartas jugadas de la mano
        gameState.hand = gameState.hand.filter(c => !c.selected);
        
        // Resetear selección
        gameState.hand.forEach(c => c.selected = false);

        // Feedback visual rápido
        playArea.innerHTML = `<div style="color:#1dd1a1; font-weight:bold; font-size:1.5rem;">+${finalResult.points} PTS!</div>`;
        
        setTimeout(() => {
            drawNewHand(); // Robar nuevas cartas para rellenar
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

    // Coste de recurso (opcional, en Balatro cuesta dinero o es gratis pero limitado)
    // Aquí asumimos que es gratis pero consume el turno de descarte
    
    gameState.discardsLeft--;
    
    // Eliminar cartas descartadas
    gameState.hand = gameState.hand.filter(c => !c.selected);
    
    // Dibujar reemplazos
    while (gameState.hand.length < 8 && gameState.deck.length > 0) {
        gameState.hand.push(gameState.deck.pop());
    }
    
    renderHand();
    updateCalculationPreview();
    updateUI();
});

function checkWinCondition() {
    if (gameState.currentScore >= gameState.targetScore) {
        setTimeout(() => {
            alert(`¡RONDA SUPERADA!\nPuntaje Final: ${gameState.currentScore}\nOro Ganado: ${(gameState.handsLeft * 2) + 1}$`);
            
            // Lógica de siguiente ronda (simple reseteo para demo)
            gameState.targetScore *= 2; // Subir dificultad
            gameState.currentScore = 0;
            gameState.handsLeft = 4;
            gameState.discardsLeft = 3;
            gameState.gold += (gameState.handsLeft * 2) + 1; // Bonus por sobras
            
            // Reiniciar mazo
            gameState.deck = createDeck();
            gameState.hand = [];
            
            drawNewHand();
            updateUI();
            renderJokers();
        }, 100);
    } else if (gameState.handsLeft === 0) {
        setTimeout(() => {
            alert("Has perdido la ronda. Game Over.");
            location.reload(); // Reinicio brutal para la demo
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
