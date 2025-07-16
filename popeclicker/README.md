# Pope Clicker

A fun Cookie Clicker-style game themed around your friend Pope! Click to earn Pope Points and buy upgrades to increase your passive income.

## Features

- 🖱️ **Click Mechanics**: Click on Pope's image to earn points
- 🎵 **Sound Effects**: Click sound plays on each click (requires `click.ogg` file)
- 📈 **Passive Income**: Buy upgrades to earn points automatically
- 💾 **Auto-Save**: Game progress is automatically saved to localStorage
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Upgrade Themes

### Jeans Theme (Early Game)
- 👖 **Jean Pocket**: Basic storage for extra Pope points
- 🧥 **Denim Jacket**: Stylish jacket that attracts more points
- 🏭 **Jean Factory**: Mass produces jeans for Pope points

### Horse Theme (Mid Game)
- 🐴 **Pony**: Cute pony that generates points
- 🏇 **Horse Stable**: Stable full of working horses
- 🐎 **Horse Ranch**: Massive ranch with hundreds of horses
- 🦄 **Unicorn**: Magical unicorn with special Pope powers

### Science Lab Theme (Late Game)
- 🧪 **Test Tube**: Basic science equipment
- 🔬 **Microscope**: Advanced research tools
- 🧬 **Science Lab**: Full laboratory for experiments
- 🏢 **Research Facility**: Massive research complex
- ⚛️ **Pope Collider**: Particle accelerator creating Pope particles
- 🌌 **Dimensional Lab**: Interdimensional Pope access

## Setup Instructions

1. **Image File**: Add a `pope.png` file in the same directory as the game files (a photo of your friend Pope)
2. **Sound File**: Add a `click.ogg` file for the click sound effect
3. **Run the Game**: Open `index.html` in any modern web browser

## Files Included

- `index.html` - Main game page
- `style.css` - Game styling and animations
- `script.js` - Game logic and mechanics
- `README.md` - This file

## Required Assets (Not Included)

You'll need to add these files to make the game complete:

### pope.png
A square image of your friend Pope (recommended size: 200x200px or larger). This will be displayed as the clickable image in the center of the game.

### click.ogg
A short sound effect that plays when clicking. You can:
- Record a custom sound
- Use any short audio clip (convert to .ogg format)
- Find free click sounds online

## How to Play

1. Click on Pope's image to earn Pope Points
2. Use points to buy upgrades from the panel on the right
3. Upgrades generate points automatically over time
4. Progress through different upgrade tiers (jeans → horses → science labs)
5. The game auto-saves your progress

## Technical Details

- Built with vanilla HTML, CSS, and JavaScript
- Uses CSS animations for visual feedback
- Implements exponential cost scaling for upgrades
- Number formatting for large values (K, M, B, T, Q)
- localStorage for persistent game saves

## Customization

You can easily customize the game by:
- Changing upgrade names, costs, and production values in `script.js`
- Modifying the visual theme in `style.css`
- Adding new upgrade tiers or special effects
- Changing the color scheme or fonts

Enjoy the game! 🎮
