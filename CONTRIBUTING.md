# Contributing to JS Formatter Console

Thank you for your interest in contributing! This guide will help you get started.

## How to Contribute

### Reporting Bugs

1. Check the [existing issues](https://github.com/finnyfound/js-console/issues) to avoid duplicates
2. Open a new issue using the **Bug Report** template
3. Include steps to reproduce, expected behavior, and screenshots if applicable

### Suggesting Features

1. Open a new issue using the **Feature Request** template
2. Describe the feature, its use case, and any implementation ideas

### Submitting Code

1. **Fork** the repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/your-username/js-console.git
   cd js-console
   ```
3. **Install** dependencies:
   ```bash
   npm install
   ```
4. **Create** a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
5. **Make** your changes and test thoroughly
6. **Commit** with clear, descriptive messages:
   ```bash
   git commit -m "Add: description of your change"
   ```
7. **Push** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
8. **Open** a Pull Request against `main`

## Development Setup

### Prerequisites

- Node.js 16+
- npm

### Running Locally

```bash
npm install       # Install dependencies
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Production build
npm run preview   # Preview production build
```

### Project Structure

```
src/
├── index.html           # Main HTML file
├── css/
│   └── styles.css       # Styles with theme support
└── js/
    ├── main.js          # Application entry point
    ├── app.js           # Core application logic
    ├── state-manager.js # State management
    ├── console-engine.js# JavaScript execution engine
    ├── html-renderer.js # HTML/CSS rendering
    └── autocomplete.js  # IntelliSense and autocomplete
```

## Code Guidelines

- Follow the conventions in `.github/instructions/clean-code-rules.instructions.md`
- Use meaningful variable and function names
- Keep functions small and focused
- Remove dead code and debug statements
- Favor readability and maintainability

## Commit Message Convention

Use prefixes to categorize commits:

- `Add:` — New feature or file
- `Fix:` — Bug fix
- `Update:` — Improvement to existing feature
- `Remove:` — Removing code or files
- `Refactor:` — Code restructuring without behavior change
- `Docs:` — Documentation changes

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
