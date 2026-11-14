// settings.js
export const GAME_SETTINGS = {
    gameSpeed: 1.0, // Afecta al pitch de la voz (0.5 - 2.0)
    audio: { masterVolume: 0.7, sfxVolume: 0.8, voiceVolume: 0.9, enabled: true },
    graphics: { animationsEnabled: true, crtFilter: true }
};

class AudioEngine {
    constructor() {
        this.ctx = null;
        this.settings = GAME_SETTINGS;
    }

    init() {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.ctx.state === 'suspended') this.ctx.resume();
    }

    playTone(freq, type, duration, vol = 0.5) {
        if (!this.settings.audio.enabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol * this.settings.audio.sfxVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playCardSelect() { this.playTone(800, 'sine', 0.08, 0.3); }
    playCardDeselect() { this.playTone(400, 'sine', 0.06, 0.2); }
    playChipSound() { this.playTone(1200, 'triangle', 0.1, 0.4); }
    playGlitchError() { 
        this.playTone(150, 'sawtooth', 0.3, 0.6);
        setTimeout(() => this.playTone(100, 'square', 0.2, 0.5), 50);
    }
    playWin() {
        [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.playTone(f, 'sine', 0.3, 0.4), i * 100));
    }

    // 🐺 Voz de ladrido dinámica según gameSpeed
    speakTutorial(text) {
        if (!this.settings.audio.enabled) return;
        window.speechSynthesis.cancel();
        
        // Ladrido sintético previo
        const baseFreq = 600 * (0.8 + (this.settings.gameSpeed * 0.4));
        this.playTone(baseFreq, 'triangle', 0.15, this.settings.audio.voiceVolume);

        setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'es-ES';
            utterance.pitch = 1.2 + (this.settings.gameSpeed * 0.5);
            utterance.rate = 0.9 + (this.settings.gameSpeed * 0.3);
            utterance.volume = this.settings.audio.voiceVolume;
            window.speechSynthesis.speak(utterance);
        }, 180);
    }
}

export const audioEngine = new AudioEngine();
