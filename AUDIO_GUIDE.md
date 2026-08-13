# 🔊 Audio System Guide

## Overview

The Phone Tycoon game now features a dynamic audio system with carefully selected sound effects for various in-game actions. All sounds are stored in `assets/sounds/` directory.

## Sound Manager (`audio.js`)

The `AudioManager` class handles all sound effects:

### Features
- **Volume Control**: Set custom volume (0.0 to 1.0)
- **Toggle Sounds**: Enable/disable all sounds via UI button
- **Persistent Settings**: Sound preferences saved to localStorage
- **Safe Playback**: Graceful handling of browser audio restrictions

### Sound Effects Map

| Sound Name | File | Trigger |
|-----------|------|---------|
| **UI Navigation** |
| `tabSwitch` | guichangemode.wav | Tab/panel switching |
| `panelOpen` | guimodulepanelopen.wav | Opening inventory/shop/sales |
| `panelClose` | guipanelclose.wav | Closing modal dialogs |
| `buttonClick` | guicheckopen.wav | General button clicks |
| **Item Interactions** |
| `selectItem` | targetselect.wav | Selecting listing from market |
| `purchase` | timertickcharge.wav | Completing purchase |
| `success` | enable.wav | Successful actions |
| `error` | disable.wav | Error/denial |
| **Economics** |
| `moneyGain` | guisavemusonenable.wav | Receiving money (bot purchase) |
| `moneyLoss` | guisavemusondisable.wav | Spending money (part purchase) |
| **Other** |
| `notification` | guicheckclose.wav | Chat notifications |
| `deny` | viapanelselectmiss.wav | Negotiation failure |
| `scroll` | guiscrolldev.wav | Page navigation (reserved) |

## Action Sound Mapping

### Market & Listings
- **Browse listing** → `selectItem` (targetselect.wav)
- **Close modal** → `panelClose` (guipanelclose.wav)
- **Buy phone** → `purchase` + `success` (timertickcharge.wav + enable.wav)
- **Refresh market** → `buttonClick` (guicheckopen.wav)
- **Negotiate failure** → `deny` (viapanelselectmiss.wav)
- **Negotiate success** → `success` (enable.wav)

### Inventory & Sales
- **Open tab** → `panelOpen` (guimodulepanelopen.wav)
- **List phone for sale** → `success` (enable.wav)
- **Unlist phone** → `buttonClick` (guicheckopen.wav)
- **Switch tabs** → `tabSwitch` (guichangemode.wav)

### Shop & Parts
- **Buy part (success)** → `moneyLoss` + `success`
- **Insufficient funds** → `error` (disable.wav)

### Bot System
- **Bot purchases your listing** → `moneyGain` (guisavemusonenable.wav)
  - Only plays if player is currently playing and audio is enabled

### Logout
- **Exit game** → `error` (disable.wav)
  - Used for "goodbye" effect

### Sound Control
- **Toggle sounds ON** → `success` (enable.wav)
- **Toggle sounds OFF** → Silent (no sound played)

## Audio Manager API

```javascript
// Play specific sound
audioManager.play('soundName');

// Convenience methods
audioManager.playTabSwitch();
audioManager.playPanelOpen();
audioManager.playPanelClose();
audioManager.playButtonClick();
audioManager.playSelectItem();
audioManager.playPurchase();
audioManager.playSuccess();
audioManager.playError();
audioManager.playMoneyGain();
audioManager.playMoneyLoss();
audioManager.playNotification();
audioManager.playDeny();

// Volume control (0.0 to 1.0)
audioManager.setVolume(0.5);

// Toggle sounds
const enabled = audioManager.toggleSounds();

// Check status
const soundsOn = audioManager.getSoundsEnabled();
```

## Storage

Audio settings are persisted in localStorage:
- `soundsEnabled`: Boolean (default: true)
- `soundVolume`: Float 0.0-1.0 (default: 0.3)

## Browser Compatibility

- **Desktop**: Full support (Chrome, Firefox, Safari, Edge)
- **Mobile**: Works but may be restricted by browser autoplay policies
- **Silent Fallback**: Game functions normally if audio fails to load

## Performance Notes

- Sounds are played asynchronously and don't block game logic
- Audio files are loaded on-demand (no preloading delay)
- Volume set to 0.3 by default to avoid startling users
- All errors are caught and logged to console for debugging

## Customization

To modify sounds, edit `audio.js`:

```javascript
preloadSounds() {
  this.sounds = {
    soundName: 'assets/sounds/file.wav',
    // ...
  };
}
```

## Future Enhancements

- [ ] Volume slider UI
- [ ] Sound effects categories (UI sounds, game sounds)
- [ ] Ambient background music
- [ ] Mobile audio permissions handling
- [ ] Sound effect library expansion
