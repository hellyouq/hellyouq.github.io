// ========================
// SOUND MANAGER
// ========================

class AudioManager {
  constructor() {
    this.soundsEnabled = localStorage.getItem('soundsEnabled') !== 'false';
    this.volume = parseFloat(localStorage.getItem('soundVolume')) || 0.3;
    this.preloadSounds();
  }

  preloadSounds() {
    // Кэш для звуков
    this.sounds = {
      // UI навигация
      tabSwitch: 'assets/sounds/guichangemode.wav',
      panelOpen: 'assets/sounds/guimodulepanelopen.wav',
      panelClose: 'assets/sounds/guipanelclose.wav',
      buttonClick: 'assets/sounds/guicheckopen.wav',
      
      // Действия с товарами
      selectItem: 'assets/sounds/targetselect.wav',
      purchase: 'assets/sounds/timertickcharge.wav',
      success: 'assets/sounds/enable.wav',
      error: 'assets/sounds/disable.wav',
      
      // Деньги
      moneyGain: 'assets/sounds/guisavemusonenable.wav',
      moneyLoss: 'assets/sounds/guisavemusondisable.wav',
      
      // Другое
      notification: 'assets/sounds/guicheckclose.wav',
      deny: 'assets/sounds/viapanelselectmiss.wav',
      scroll: 'assets/sounds/guiscrolldev.wav'
    };
  }

  play(soundName) {
    if (!this.soundsEnabled) return;

    const soundPath = this.sounds[soundName];
    if (!soundPath) {
      console.warn(`Sound "${soundName}" not found`);
      return;
    }

    try {
      const audio = new Audio(soundPath);
      audio.volume = this.volume;
      audio.play().catch(err => {
        // Браузер может блокировать автоплей - это нормально
        console.debug(`Audio playback prevented: ${err}`);
      });
    } catch (err) {
      console.debug(`Could not play sound: ${err}`);
    }
  }

  // Звуки для конкретных действий
  playTabSwitch() { this.play('tabSwitch'); }
  playPanelOpen() { this.play('panelOpen'); }
  playPanelClose() { this.play('panelClose'); }
  playButtonClick() { this.play('buttonClick'); }
  playSelectItem() { this.play('selectItem'); }
  playPurchase() { this.play('purchase'); }
  playSuccess() { this.play('success'); }
  playError() { this.play('error'); }
  playMoneyGain() { this.play('moneyGain'); }
  playMoneyLoss() { this.play('moneyLoss'); }
  playNotification() { this.play('notification'); }
  playDeny() { this.play('deny'); }
  playScroll() { this.play('scroll'); }

  // Управление громкостью
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('soundVolume', this.volume);
  }

  // Включение/выключение звуков
  toggleSounds() {
    this.soundsEnabled = !this.soundsEnabled;
    localStorage.setItem('soundsEnabled', this.soundsEnabled);
    return this.soundsEnabled;
  }

  getSoundsEnabled() {
    return this.soundsEnabled;
  }
}

// Глобальный экземпляр звукового менеджера
const audioManager = new AudioManager();
