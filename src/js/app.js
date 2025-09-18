class JSConsoleApp {
  // Constants for font families - single source of truth
  static FONT_FAMILIES = {
    ui: "'Urbanist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    mono: "'Source Code Pro', 'Consolas', 'Monaco', 'Courier New', monospace",
  };

  // Constants for placeholder templates - single source of truth
  static PLACEHOLDERS = {
    javascript:
      '// Enter JavaScript code here...\nconsole.log("Hello, World!");',
    html: '<!-- Enter HTML code here... -->\n<div>\n  <h1>Hello, World!</h1>\n  <p>This is HTML content.</p>\n</div>',
    css: `/* Enter CSS code here... */\nbody {\n  font-family: ${JSConsoleApp.FONT_FAMILIES.ui};\n  background-color: #f0f0f0;\n}`,
  };

  // Constants for localStorage keys - now handled by StateManager
  static STORAGE_KEYS = {
    theme: 'js-console-theme',
    autoRun: 'js-console-autorun',
    language: 'jsConsole_language',
  };

  // Constants for common status messages
  static MESSAGES = {
    runningCode: 'Running code...',
    ready: 'Ready',
    autoRunOn: 'Auto-Run: ON - Click to disable',
    autoRunOff: 'Auto-Run: OFF - Click to enable',
  };

  constructor() {
    this.editor = null;
    this.consoleEngine = window.consoleEngine;
    this.htmlRenderer = window.htmlRenderer;

    // Initialize unified state management
    this.stateManager = new StateManager();
    this.setupStateSubscriptions();

    // Load state from StateManager
    this.isDarkTheme =
      this.stateManager.getState('preferences.theme') === 'dark';
    this.isAutoRunEnabled = this.stateManager.getState('preferences.autoRun');
    this.currentLanguage = this.stateManager.getState(
      'session.currentLanguage'
    );
    this.autoRunTimeout = null;
    this.isSwitchingTabs = false; // Flag to prevent auto-run during tab switches

    // Track last rendered content to prevent unnecessary updates
    this.lastRenderedContent = {
      html: '',
      css: '',
      javascript: '',
    };

    // Code context management - load from state
    this.codeContexts = {
      javascript: this.stateManager.getState('codeContent.javascript'),
      html: this.stateManager.getState('codeContent.html'),
      css: this.stateManager.getState('codeContent.css'),
    };

    this.initializeApp();
  }

  setupStateSubscriptions() {
    // Subscribe to state changes for automatic UI updates
    this.stateManager.subscribe('state:changed:preferences.theme', (data) => {
      this.isDarkTheme = data.value === 'dark';
      this.applyTheme();
    });

    this.stateManager.subscribe('state:changed:preferences.autoRun', (data) => {
      this.isAutoRunEnabled = data.value;
      this.updateAutoRunButtonUI();
    });

    this.stateManager.subscribe(
      'state:changed:session.currentLanguage',
      (data) => {
        this.currentLanguage = data.value;
      }
    );

    this.stateManager.subscribe('state:changed:codeContent', (data) => {
      // Update code contexts when state changes
      const language = data.path.split('.')[1];
      if (language && this.codeContexts[language] !== undefined) {
        this.codeContexts[language] = data.value;
      }
    });

    this.stateManager.subscribe('state:saved', () => {
      // Silent auto-save - no need to notify user constantly
    });
  }

  async initializeApp() {
    // Apply basic UI state before initializing editor (but not Monaco theme yet)
    this.applyUITheme(); // New method for non-Monaco UI elements
    this.updateAutoRunButtonUI();
    this.initializeLanguageTabUI(); // Set initial language tab state

    await this.initializeMonacoEditor();

    // Apply complete theme including Monaco editor after editor is ready
    this.applyTheme();

    this.setupEventListeners();
    this.setupTabSwitching();
    this.showWelcomeMessage();

    // Ensure theme icon is correct before creating icons
    this.updateThemeToggleIcon();

    // Re-initialize Lucide icons to ensure all icons display correctly
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }

    // Dispatch event to signal app is fully initialized
    document.dispatchEvent(new CustomEvent('appInitialized'));

    // Initial render for HTML/CSS content only if there's actual saved content
    const hasHtmlContent =
      this.codeContexts.html &&
      this.codeContexts.html.trim() &&
      !this.codeContexts.html.includes(
        JSConsoleApp.PLACEHOLDERS.html.split('\n')[0]
      );
    const hasCssContent =
      this.codeContexts.css &&
      this.codeContexts.css.trim() &&
      !this.codeContexts.css.includes(
        JSConsoleApp.PLACEHOLDERS.css.split('\n')[0]
      );

    if (hasHtmlContent || hasCssContent) {
      this.render();
    }
  }

  async initializeMonacoEditor() {
    return new Promise((resolve) => {
      require(['vs/editor/editor.main'], () => {
        // Store monaco reference for later use
        this.monaco = monaco;

        // Get initial content for the current language
        const initialContent =
          this.codeContexts[this.currentLanguage] ||
          JSConsoleApp.PLACEHOLDERS[this.currentLanguage] ||
          '';

        this.editor = monaco.editor.create(
          document.getElementById('monaco-editor'),
          {
            value: initialContent,
            language: this.currentLanguage,
            theme: this.isDarkTheme ? 'custom-dark' : 'custom-light',
            fontSize: 14,
            fontFamily: "'Consolas', monospace", // Use only reliable system font
            fontLigatures: false,
            fontWeight: 'normal',
            letterSpacing: 0,
            lineHeight: 1.4,
            minimap: { enabled: false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            lineNumbers: 'on',
            folding: true,
            contextmenu: true,
            selectOnLineNumbers: true,
            disableLayerHinting: true,
            roundedSelection: false,
            smoothScrolling: false,
            cursorBlinking: 'solid',
            cursorSmoothCaretAnimation: false,
          }
        );

        // Define custom themes that match our color scheme
        this.monaco.editor.defineTheme('custom-dark', {
          base: 'vs-dark',
          inherit: true,
          rules: [
            { token: 'comment', foreground: '7d8590' },
            { token: 'keyword', foreground: 'ff7b72' },
            { token: 'string', foreground: 'a5d6ff' },
            { token: 'number', foreground: '79c0ff' },
            { token: 'variable', foreground: 'e6edf3' },
            { token: 'function', foreground: 'd2a8ff' },
          ],
          colors: {
            'editor.background': '#0d1117',
            'editor.foreground': '#e6edf3',
            'editorLineNumber.foreground': '#7d8590',
            'editorLineNumber.activeForeground': '#e6edf3',
            'editor.selectionBackground': '#264f78',
            'editor.selectionHighlightBackground': '#3d4147',
            'editorCursor.foreground': '#e6edf3',
            'editorWhitespace.foreground': '#7d8590',
          },
        });

        this.monaco.editor.defineTheme('custom-light', {
          base: 'vs',
          inherit: true,
          rules: [
            { token: 'comment', foreground: '6a737d' },
            { token: 'keyword', foreground: 'd73a49' },
            { token: 'string', foreground: '032f62' },
            { token: 'number', foreground: '005cc5' },
            { token: 'variable', foreground: '24292e' },
            { token: 'function', foreground: '6f42c1' },
          ],
          colors: {
            'editor.background': '#ffffff',
            'editor.foreground': '#24292e',
            'editorLineNumber.foreground': '#959da5',
            'editorLineNumber.activeForeground': '#24292e',
            'editor.selectionBackground': '#c8e1ff',
            'editor.selectionHighlightBackground': '#f1f8ff',
            'editorCursor.foreground': '#24292e',
            'editorWhitespace.foreground': '#d1d5da',
          },
        });

        // Apply Monaco editor theme immediately after creation
        this.monaco.editor.setTheme(
          this.isDarkTheme ? 'custom-dark' : 'custom-light'
        );

        // Ensure theme sticks with a small delay (Monaco sometimes resets themes)
        setTimeout(() => {
          if (this.monaco && this.editor) {
            this.monaco.editor.setTheme(
              this.isDarkTheme ? 'custom-dark' : 'custom-light'
            );
          }
        }, 100);

        // Setup editor shortcuts
        this.editor.addCommand(
          monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
          () => {
            this.runEditorCode();
          }
        );

        this.editor.addCommand(
          monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
          () => {
            this.formatEditorCode();
          }
        );

        // Setup auto-run on content change
        this.editor.onDidChangeModelContent(() => {
          this.handleEditorChange();
        });

        resolve();
      });
    });
  }

  setupEventListeners() {
    // Auto-run toggle
    document.getElementById('toggle-autorun').addEventListener('click', () => {
      this.toggleAutoRun();
    });

    // Emergency stop
    document.getElementById('emergency-stop').addEventListener('click', () => {
      this.emergencyStop();
    });

    // Run button
    document.getElementById('run-code').addEventListener('click', () => {
      this.runEditorCode();
    });

    // Format button
    document.getElementById('format-code').addEventListener('click', () => {
      this.formatEditorCode();
    });

    // Language tabs
    document.querySelectorAll('.language-tab').forEach((tab) => {
      tab.addEventListener('click', (e) => {
        const language = e.currentTarget.dataset.language;
        this.switchToLanguageTab(language);
      });
    });

    // Clear console
    document.getElementById('clear-console').addEventListener('click', () => {
      this.consoleEngine.clearOutput();
    });

    // Clear render
    document.getElementById('clear-render').addEventListener('click', () => {
      this.htmlRenderer.clear();
    });

    // Theme toggle
    document.getElementById('toggle-theme').addEventListener('click', () => {
      this.toggleTheme();
    });

    // Window resize
    window.addEventListener('resize', () => {
      if (this.editor) {
        this.editor.layout();
      }
    });
  }

  setupTabSwitching() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const outputPanels = document.querySelectorAll('.output-panel');
    const clearButtons = document.querySelectorAll('.tab-clear-btn');

    tabButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const targetTab = button.dataset.tab;

        // Update active tab
        tabButtons.forEach((btn) => btn.classList.remove('active'));
        button.classList.add('active');

        // Update clear button visibility based on active tab
        clearButtons.forEach((clearBtn) => {
          const buttonTarget = clearBtn.dataset.tabTarget;
          if (buttonTarget === targetTab) {
            clearBtn.style.display = 'inline-flex';
          } else {
            clearBtn.style.display = 'none';
          }
        });

        // Update active panel - only show the correct panel
        outputPanels.forEach((panel) => {
          panel.classList.remove('active');

          // Show console-output panel for console tab
          if (targetTab === 'console' && panel.id === 'console-output') {
            panel.classList.add('active');
          }
          // Show html-render panel for render tab
          else if (targetTab === 'render' && panel.id === 'html-render') {
            panel.classList.add('active');
            // Auto-render when switching to Output tab
            this.render();
          }
        });
      });
    });
  }

  runEditorCode(isAutomatic = false) {
    // Prevent manual run if auto-run is enabled (but allow automatic execution)
    if (!isAutomatic && this.isAutoRunEnabled) {
      this.updateStatus('Auto-run is enabled - disable it to use manual run');
      return;
    }

    const code = this.editor.getValue();
    if (code.trim()) {
      this.updateStatus(JSConsoleApp.MESSAGES.runningCode);

      try {
        this.consoleEngine.execute(code, false, this.currentLanguage); // Pass current language
      } catch (error) {
        this.consoleEngine.addOutput('error', [
          'Execution failed: ' + error.message,
        ]);
      } finally {
        this.updateStatus(JSConsoleApp.MESSAGES.ready);
      }
    }
  }

  formatEditorCode() {
    if (this.editor) {
      this.editor.getAction('editor.action.formatDocument').run();
    }
  }

  switchToLanguageTab(language) {
    if (!this.editor) return;

    // Set flag to prevent auto-run during tab switch
    this.isSwitchingTabs = true;

    // Save current code content before switching
    if (this.currentLanguage) {
      const currentCode = this.editor.getValue();
      this.codeContexts[this.currentLanguage] = currentCode;
      this.lastRenderedContent[this.currentLanguage] = currentCode;

      // Save to state manager
      this.stateManager.setState(
        `codeContent.${this.currentLanguage}`,
        currentCode
      );
    }

    // Update UI - remove active class from all tabs
    document.querySelectorAll('.language-tab').forEach((tab) => {
      tab.classList.remove('active');
    });

    // Add active class to selected tab
    const selectedTab = document.querySelector(`[data-language="${language}"]`);
    if (selectedTab) {
      selectedTab.classList.add('active');
    }

    // Update Monaco editor language
    const model = this.editor.getModel();
    if (this.monaco) {
      this.monaco.editor.setModelLanguage(model, language);
    }

    // Load saved code for this language or set placeholder
    const savedCode = this.codeContexts[language];
    if (savedCode && savedCode.trim() !== '') {
      this.editor.setValue(savedCode);
      this.lastRenderedContent[language] = savedCode;
    } else {
      // No saved code, set appropriate placeholder
      this.editor.setValue(JSConsoleApp.PLACEHOLDERS[language] || '');
    }

    // Update current language
    this.currentLanguage = language;

    // Save language preference to state manager
    this.stateManager.setState('session.currentLanguage', language);

    // Always ensure auto-run button UI is synchronized
    this.updateAutoRunButtonUI();

    // Clear the flag after a short delay to allow setValue to complete
    setTimeout(() => {
      this.isSwitchingTabs = false;
    }, 100);

    // Don't automatically render when switching tabs - only render when content changes
    // The handleEditorChange method will handle auto-run logic properly
  }

  render() {
    // Consolidated rendering method - single source of truth
    const htmlCode = this.codeContexts.html || '';
    const cssCode = this.codeContexts.css || '';
    const jsCode = this.codeContexts.javascript || '';

    if (window.htmlRenderer) {
      window.htmlRenderer.setHTML(htmlCode);
      if (cssCode.trim()) window.htmlRenderer.setCSS(cssCode);
      // Don't automatically render JavaScript in iframe - only execute in main console
      // JavaScript should be executed via the console engine, not the iframe
      // if (jsCode.trim()) window.htmlRenderer.setJS(jsCode);
    } else {
      console.error('HTML renderer not available');
    }
  }

  changeEditorLanguage(language) {
    // This method is now handled by switchToLanguageTab
    this.switchToLanguageTab(language);
  }

  updateEditorPlaceholder(language) {
    if (this.editor.getValue().trim() === '') {
      this.editor.setValue(JSConsoleApp.PLACEHOLDERS[language] || '');
    }
  }

  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;

    // Save theme preference to state manager
    this.stateManager.setState(
      'preferences.theme',
      this.isDarkTheme ? 'dark' : 'light'
    );

    this.applyTheme();

    this.updateStatus(
      `Switched to ${this.isDarkTheme ? 'dark' : 'light'} theme`
    );
  }

  applyUITheme() {
    // Apply theme to UI elements only (not Monaco editor)
    if (this.isDarkTheme) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }

    // Update theme toggle button icon with improved timing
    this.updateThemeToggleIcon();
  }

  updateThemeToggleIcon() {
    const themeButton = document.getElementById('toggle-theme');
    if (themeButton) {
      // Look for either <i> or <svg> element (Lucide replaces <i> with <svg>)
      let iconElement =
        themeButton.querySelector('i') || themeButton.querySelector('svg');

      if (iconElement) {
        // Determine the correct icon name
        const iconName = this.isDarkTheme ? 'sun' : 'moon';

        // Remove the existing icon element (whether it's <i> or <svg>)
        iconElement.remove();

        // Create new <i> element with the correct data-lucide attribute
        const newIcon = document.createElement('i');
        newIcon.setAttribute('data-lucide', iconName);
        themeButton.appendChild(newIcon);

        // Re-create icons immediately to convert <i> to <svg>
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
          lucide.createIcons();
        }
      }
    }
  }

  applyTheme() {
    // Apply complete theme including Monaco editor
    this.applyUITheme();

    // Update Monaco editor theme if editor exists
    if (this.editor && this.monaco) {
      try {
        this.monaco.editor.setTheme(
          this.isDarkTheme ? 'custom-dark' : 'custom-light'
        );
      } catch (error) {
        console.warn('Failed to update Monaco editor theme:', error);
      }
    }

    // Update HTML renderer iframe background to match theme
    if (this.htmlRenderer && this.htmlRenderer.renderFrame) {
      this.htmlRenderer.renderFrame.style.backgroundColor = this.isDarkTheme
        ? '#161b22'
        : '#ffffff';
      // Also trigger a re-render to update the document background
      this.htmlRenderer.updateFrame();
    }
  }

  initializeLanguageTabUI() {
    // Set the active language tab based on current language state
    document.querySelectorAll('.language-tab').forEach((tab) => {
      tab.classList.remove('active');
      if (tab.dataset.language === this.currentLanguage) {
        tab.classList.add('active');
      }
    });
  }

  updateAutoRunButtonUI() {
    // Single source of truth for auto-run button UI state
    const toggleButton = document.getElementById('toggle-autorun');
    if (toggleButton) {
      if (this.isAutoRunEnabled) {
        toggleButton.className = 'icon-btn primary';
        toggleButton.setAttribute('data-state', 'on');
        toggleButton.title = JSConsoleApp.MESSAGES.autoRunOn;
      } else {
        toggleButton.className = 'icon-btn';
        toggleButton.setAttribute('data-state', 'off');
        toggleButton.title = JSConsoleApp.MESSAGES.autoRunOff;
      }
    }

    // Update run button state based on auto-run status
    this.updateRunButtonUI();
  }

  updateRunButtonUI() {
    const runButton = document.getElementById('run-code');
    if (runButton) {
      if (this.isAutoRunEnabled) {
        runButton.disabled = true;
        runButton.classList.add('disabled');
        runButton.title = 'Run button disabled while Auto-Run is active';
      } else {
        runButton.disabled = false;
        runButton.classList.remove('disabled');
        runButton.title = 'Run code (Ctrl+Enter)';
      }
    }
  }

  toggleAutoRun() {
    this.isAutoRunEnabled = !this.isAutoRunEnabled;

    // Update UI state
    this.updateAutoRunButtonUI();

    // Clear any pending auto-run if disabled
    if (!this.isAutoRunEnabled && this.autoRunTimeout) {
      clearTimeout(this.autoRunTimeout);
      this.autoRunTimeout = null;
    }

    // Save preference to state manager
    this.stateManager.setState('preferences.autoRun', this.isAutoRunEnabled);

    this.updateStatus(
      `Auto-run ${this.isAutoRunEnabled ? 'enabled' : 'disabled'}`
    );

    // Add console message about the status change
    const autoRunIcon = this.isAutoRunEnabled ? '✅' : '⚡';
    const statusMessage = this.isAutoRunEnabled
      ? 'Live updates are now active - code will execute as you type'
      : 'Live updates disabled - click Run or enable Auto-Run for live updates';

    this.consoleEngine.addOutput('info', [
      `${autoRunIcon} Auto-Run ${
        this.isAutoRunEnabled ? 'enabled' : 'disabled'
      }: ${statusMessage}`,
    ]);
  }

  showEmergencyStop() {
    const stopButton = document.getElementById('emergency-stop');
    if (stopButton) {
      stopButton.style.display = 'inline-block';
    }
  }

  hideEmergencyStop() {
    const stopButton = document.getElementById('emergency-stop');
    if (stopButton) {
      stopButton.style.display = 'none';
    }
  }

  handleEditorChange() {
    // Don't auto-run if we're currently switching tabs
    if (this.isSwitchingTabs) {
      return;
    }

    // Clear existing timeout
    if (this.autoRunTimeout) {
      clearTimeout(this.autoRunTimeout);
    }

    // Simplified auto-render logic
    this.autoRunTimeout = setTimeout(() => {
      const currentCode = this.editor.getValue();

      // Always update code context and save to state
      this.codeContexts[this.currentLanguage] = currentCode;
      this.stateManager.setState(
        `codeContent.${this.currentLanguage}`,
        currentCode
      );

      // HTML/CSS always auto-render
      if (this.currentLanguage === 'html' || this.currentLanguage === 'css') {
        this.render();
        return;
      }

      // JavaScript: check for HTML context or auto-run
      if (this.currentLanguage === 'javascript') {
        const hasHtmlContent =
          this.codeContexts.html.trim() &&
          !this.codeContexts.html.includes(
            JSConsoleApp.PLACEHOLDERS.html.split('\n')[0]
          );

        if (hasHtmlContent) {
          // Render unified view when HTML context exists
          this.render();
        } else if (this.isAutoRunEnabled && currentCode.trim()) {
          // Execute JS only if auto-run is enabled (pass true for automatic execution)
          this.runEditorCode(true);
        }
      }
    }, 500);
  }

  emergencyStop() {
    // Immediately stop auto-run
    if (this.autoRunTimeout) {
      clearTimeout(this.autoRunTimeout);
    }

    // Clear any running timeouts
    const highestTimeoutId = setTimeout(() => {}, 0);
    for (let i = 0; i <= highestTimeoutId; i++) {
      clearTimeout(i);
    }

    // Show immediate feedback
    this.updateStatus('🛑 Emergency stop activated!');
    this.hideEmergencyStop();

    // Clear console and add stop message
    this.consoleEngine.addOutput('warn', [
      '🛑 Emergency stop activated - Execution halted',
    ]);

    // Disable auto-run temporarily
    if (this.isAutoRunEnabled) {
      this.toggleAutoRun();
      setTimeout(() => {
        this.updateStatus(
          'Emergency stop complete - Auto-run disabled for safety'
        );
      }, 1000);
    }
  }

  updateStatus(message) {
    const statusText = document.getElementById('status-text');
    if (statusText) {
      statusText.textContent = message;
    }
  }

  showWelcomeMessage() {
    // Add welcome message to console
    this.consoleEngine.addOutput('info', [
      '🎨 Welcome to Multi-Language Web Console!',
    ]);
    this.consoleEngine.addOutput('info', [
      '📝 JavaScript → Console | HTML/CSS/JS → Output tab',
    ]);
    this.consoleEngine.addOutput('info', [
      '🔄 Switch tabs freely - HTML+CSS+JS work together seamlessly',
    ]);

    // Dynamic auto-run status message
    const autoRunStatus = this.isAutoRunEnabled ? 'enabled' : 'disabled';
    const autoRunIcon = this.isAutoRunEnabled ? '✅' : '⚡';
    this.consoleEngine.addOutput('info', [
      `${autoRunIcon} Auto-Run is ${autoRunStatus} - ${
        this.isAutoRunEnabled
          ? 'Live updates active'
          : 'Click the refresh icon to enable live updates'
      }`,
    ]);

    this.consoleEngine.addOutput('info', [
      "🖼️ View complete web pages in the 'Output' tab",
    ]);
    this.consoleEngine.addOutput('info', [
      "🧹 Use 'Clear Render' to start fresh, 'Clear Console' for JS output",
    ]);
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.jsConsoleApp = new JSConsoleApp();
});
