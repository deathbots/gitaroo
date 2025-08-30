# Guitar Fretboard Learning Tool

A static web application designed to help guitar students and educators visualize, practice, and understand the guitar fretboard through interactive note placement and interval recognition.

![Application Screenshot](https://github.com/user-attachments/assets/f3b8e180-504c-4803-8a70-3ddfd382f2b3)

## 🎯 Features

### ✅ Core Functionality (Implemented)

- **Canvas-Based Design**: Print-ready workspace with standard paper dimensions (8.5" x 11")
- **Interactive Fretboard Grids**: Configurable fret range (0-24), string count (4-12), and custom tunings
- **Note Placement System**: Click to place notes with automatic chromatic note calculation
- **Visual Music Theory**: 
  - Natural notes display letters (A, B, C, D, E, F, G)
  - Accidental notes (sharps/flats) show color only
  - Chromatic color coding for each note
- **Grid Management**: Drag-and-drop positioning, orientation toggle, delete functionality
- **State Management**: Complete undo/redo system for all user actions
- **File Operations**: Save/load workspace as JSON files with drag-and-drop support

### 🚧 In Development

- **Root Note Selection**: Double-click to set root note and highlight intervals
- **Interval Highlighting**: Automatic calculation and color-coding of musical intervals
- **Note Grouping**: Color-coded groups for pattern recognition

## 🚀 Getting Started

### Prerequisites

- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Node.js 18+ (for development)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/deathbots/gitaroo.git
   cd gitaroo
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to `http://localhost:3000`

### Alternative: Direct Usage

Since this is a static web application, you can also:

1. Download the `src/` folder
2. Open `src/index.html` in your browser
3. Start using the application immediately

## 🎮 Usage

### Basic Workflow

1. **Create a Grid**: Click "➕ Create Grid" to add a new fretboard
2. **Configure Settings**: Adjust fret range, string count, and tuning as needed
3. **Place Notes**: Click on fret/string intersections to place notes
4. **Save Your Work**: Use "💾 Save" to export your workspace as a JSON file
5. **Load Previous Work**: Use "📁 Load" or drag-and-drop a JSON file

### Controls

- **Canvas Controls** (Top toolbar):
  - 📄 **Portrait/Landscape**: Toggle canvas orientation
  - 🔓 **Lock/Unlock**: Prevent/allow editing
  - ➕ **Create Grid**: Add new fretboard grid
  - 💾 **Save**: Export workspace to JSON file
  - 📁 **Load**: Import workspace from JSON file
  - ↶ **Undo**: Reverse last action
  - ↷ **Redo**: Restore undone action

- **Grid Controls** (Per grid):
  - **Start/End Frets**: Set visible fret range (0-24)
  - **String Count**: Number of strings (4-12)
  - **Tuning**: Individual string tuning selection
  - ⬇️ **Orientation**: Toggle vertical/horizontal layout
  - 🗑️ **Delete**: Remove grid from canvas

### Note Interaction

- **Single Click**: Place/cycle through note groups
- **Double Click**: Set as root note (enables interval highlighting)
- **Visual Feedback**: Hover effects and color changes

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Lint code
npm run lint
```

**Test Coverage**: 39 tests covering core functionality with 80%+ code coverage requirement.

## 🏗️ Architecture

### Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+ modules)
- **Testing**: Jest with JSDOM
- **CI/CD**: GitHub Actions
- **Deployment**: GitHub Pages

### Project Structure

```
src/
├── index.html              # Main application entry point
├── main.js                 # Application initialization
├── components/             # Core application components
│   ├── canvas.js          # Canvas system and toolbar
│   └── grid.js            # Individual fretboard grids
├── utils/                  # Utility modules
│   ├── music-theory.js    # Note calculations and intervals
│   ├── state-management.js # Undo/redo functionality
│   └── file-operations.js # Save/load operations
└── styles/                 # CSS stylesheets
    ├── main.css           # Global styles and variables
    ├── canvas.css         # Canvas-specific styles
    ├── grid.css           # Grid and note styles
    └── components.css     # UI component styles

tests/
├── unit/                   # Unit tests
└── integration/            # Integration tests (planned)
```

### Key Design Principles

- **Static-First**: No server dependencies, works offline
- **Modular Architecture**: ES6 modules with clear separation of concerns
- **Progressive Enhancement**: Core functionality works without JavaScript
- **Accessibility**: WCAG 2.1 AA compliance target
- **Print-Ready**: Designed for physical practice sheets

## 🔧 Development

### Requirements Tracking

This project uses [duvet](https://awslabs.github.io/duvet/) syntax for tracking requirements implementation:

```javascript
// duvet: REQ-NOTE-001 - Users can place notes by clicking on fret/string intersection
```

### Key Requirements Implemented

- **REQ-SYS-001-003**: Static HTML application deployable to GitHub Pages
- **REQ-TECH-001-003**: HTML5/CSS3/Vanilla JS with modern browser support
- **REQ-CAN-001-010**: Canvas system with print dimensions and toolbar
- **REQ-GRID-001-023**: Configurable fretboard grids with drag-and-drop
- **REQ-NOTE-001-015**: Note placement with chromatic color coding
- **REQ-STATE-001-009**: Complete state management and file operations

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Follow the coding standards and add tests
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📜 License

This project is licensed under the BSD 3-Clause License - see the [LICENSE](LICENSE) file for details.

## 🎵 Music Theory Background

### Chromatic Scale

The application uses the standard 12-tone chromatic scale:
C → C# → D → D# → E → F → F# → G → G# → A → A# → B → (C octave)

### Standard Guitar Tuning

Default 6-string tuning (low to high):
- String 6: E (low E)
- String 5: A
- String 4: D
- String 3: G
- String 2: B
- String 1: E (high E)

### Interval Recognition

The application calculates and highlights musical intervals:
- Minor 3rd (+3 semitones)
- Major 3rd (+4 semitones)
- Perfect 4th (+5 semitones)
- Perfect 5th (+7 semitones)
- Minor 7th (+10 semitones)
- Major 7th (+11 semitones)
- Octave (+12 semitones)

## 🔗 Links

- **Live Application**: [GitHub Pages Deployment](https://deathbots.github.io/gitaroo/)
- **Issues**: [GitHub Issues](https://github.com/deathbots/gitaroo/issues)
- **Documentation**: [Technical Requirements](trd.md) | [Product Features](pfd.md)

---

**Built with ❤️ for guitar education and music theory learning**