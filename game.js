// Configuración de las 6 pintas de Wolfylatro
const suits = [
    { name: 'huesos', symbol: '🦴', class: 'suit-huesos' },
    { name: 'corazones', symbol: '❤️', class: 'suit-corazones' },
    { name: 'cascabeles', symbol: '🔔', class: 'suit-cascabeles' },
    { name: 'esmeraldas', symbol: '💎', class: 'suit-esmeraldas' },
    { name: 'gotas', symbol: '💧', class: 'suit-gotas' },
    { name: 'estrellas', symbol: '⭐', class: 'suit-estrellas' }
];

const handArea = document.getElementById('hand-area');
const playBtn = document.getElementById('play-btn');
const discardBtn = document.getElementById('discard-btn');

function createSampleHand() {
    handArea.innerHTML = '';
    for (let i = 0; i < 8; i++) {
        const suit = suits[Math.floor(Math.random() * suits.length)];
        const value = Math.floor(Math.random() * 10) + 2;
        
        const card = document.createElement('div');
        card.className = `card ${suit.class}`;
        card.innerHTML = `
            <div>${value}</div>
            <div style="font-size: 1.8rem; text-align: center;">${suit.symbol}</div>
            <div style="text-align: right;">${value}</div>
        `;
        
        card.addEventListener('click', () => {
            card.classList.toggle('selected');
        });

        handArea.appendChild(card);
    }
}

playBtn.addEventListener('click', () => {
    alert("¡Mano jugada! (Pronto calcularemos los puntos estilo Balatro).");
    createSampleHand();
});

discardBtn.addEventListener('click', () => {
    createSampleHand();
});

// Inicializar la primera mano
createSampleHand();
