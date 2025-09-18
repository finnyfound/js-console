# JS Console

An interactive JavaScript console with multi-language support, live preview, and modern web development features. Built with Monaco Editor, Vite, and modern web standards.

## Features

- **🎯 Multi-Language Support**: JavaScript, HTML, and CSS with file-like tabs (main.js, index.html, style.css)
- **📝 Monaco Editor**: Professional code editor with syntax highlighting, IntelliSense, and autocomplete
- **⚡ Live Execution**: Real-time code execution with auto-run capabilities
- **🖼️ HTML Renderer**: Live preview for HTML/CSS output with iframe sandboxing
- **🎨 Modern UI**: Clean interface with Lucide icons and Urbanist font
- **🌙 Theme Support**: Light and dark themes with persistent settings
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices
- **🔒 Security**: XSS protection and safe code execution environment
- **📊 State Management**: Variable tracking and command history
- **⚙️ Auto-Run**: Optional automatic code execution on changes

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/finnyfound/js-console.git
   cd js-console
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Production Build

```bash
npm run build     # Build for production
npm run preview   # Preview production build
```

## Usage

### Code Editor Tabs

- **main.js**: JavaScript code execution
- **index.html**: HTML markup with live preview
- **style.css**: CSS styling for HTML content

### Controls

- **Play Button**: Execute code manually (Ctrl+Enter)
- **Auto-Run Toggle**: Enable/disable automatic execution
- **Clear Button**: Clear console output
- **Format Button**: Auto-format code
- **Theme Toggle**: Switch between light/dark themes

### Console Features

- **Interactive Console**: Terminal-style console with `>` prompts
- **Command History**: Navigate through previous commands with arrow keys
- **Autocomplete**: IntelliSense-powered suggestions as you type
- **Variable Tracking**: Automatic detection of declared variables and functions

### HTML Rendering

- Use the `render` object to output content to the preview tab:
  ```javascript
  render.html("<h1>Hello World</h1>");
  render.text("Plain text output");
  render.table([
    ["Name", "Age"],
    ["John", 25],
    ["Jane", 30],
  ]);
  render.list(["Item 1", "Item 2", "Item 3"]);
  render.clear(); // Clear the preview
  ```

### Built-in Functions

- `help()` - Show available commands and features
- `clear()` - Clear console output
- `vars()` - Show all declared variables
- `funcs()` - Show all declared functions
- `history()` - Show command history
- `$()` - jQuery-like element selector
- `$$()` - Select all matching elements

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES Modules), HTML5, CSS3
- **Editor**: Monaco Editor (VS Code editor)
- **Build Tool**: Vite with Terser minification
- **Icons**: Lucide Icons
- **Fonts**: Urbanist (Google Fonts)
- **Deployment**: Vercel-optimized

## Development

### Project Structure

```
src/
├── index.html              # Main HTML file with enhanced metadata
├── css/
│   └── styles.css         # Modern CSS with theme support
└── js/
    ├── main.js            # Application entry point
    ├── app.js             # Core application logic and UI
    ├── state-manager.js   # State management and persistence
    ├── console-engine.js  # JavaScript execution engine
    ├── html-renderer.js   # HTML/CSS rendering system
    └── autocomplete.js    # IntelliSense and autocomplete
```

### Build System

- **Development**: `npm run dev` - Vite dev server with hot reload
- **Production**: `npm run build` - Optimized build with minification
- **Preview**: `npm run preview` - Preview production build locally

### Key Features Implementation

- **Security**: XSS prevention, iframe sandboxing, safe eval context
- **Performance**: Code splitting, tree shaking, optimized bundling
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **PWA Ready**: Optimized for mobile and offline capabilities

## Browser Compatibility

| Browser         | Support              |
| --------------- | -------------------- |
| Chrome/Edge 88+ | ✅ Full support      |
| Firefox 85+     | ✅ Full support      |
| Safari 14+      | ✅ Full support      |
| Mobile browsers | ✅ Responsive design |

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit with clear messages: `git commit -m "Add feature"`
5. Push to your fork: `git push origin feature-name`
6. Submit a pull request

## License

MIT License - see LICENSE file for details

## Author

**Finny Kochummen** - [GitHub](https://github.com/finnyfound)

---

**Live Demo**: [https://console.jsformatter.net](https://console.jsformatter.net)
