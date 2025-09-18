class ConsoleEngine {
  constructor() {
    this.context = {};
    this.history = [];
    this.variables = new Map();
    this.functions = new Map();
    this.commandHistory = [];
    this.historyIndex = -1;
    this.output = [];
    this.updateThrottleTimeout = null;

    // Capture console methods
    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      clear: console.clear,
    };

    this.setupConsoleCapture();
    this.setupBuiltinFunctions();
  }

  setupConsoleCapture() {
    const engine = this;

    // Override console methods to capture output
    console.log = (...args) => {
      engine.addOutput("log", args);
      engine.originalConsole.log(...args);
    };

    console.error = (...args) => {
      engine.addOutput("error", args);
      engine.originalConsole.error(...args);
    };

    console.warn = (...args) => {
      engine.addOutput("warn", args);
      engine.originalConsole.warn(...args);
    };

    console.info = (...args) => {
      engine.addOutput("info", args);
      engine.originalConsole.info(...args);
    };
  }

  setupBuiltinFunctions() {
    // Add helpful utility functions
    this.context.help = () => {
      console.log(`
JS Console Commands:
- help(): Show this help
- clear(): Clear console output
- vars(): Show all variables
- funcs(): Show all functions
- history(): Show command history
- document: Access to DOM
- $(): jQuery-like selector (returns first match)
- $$(): jQuery-like selector (returns all matches)
            `);
    };

    this.context.clear = () => {
      this.clearOutput();
    };

    this.context.vars = () => {
      console.log("Variables:", Object.fromEntries(this.variables));
    };

    this.context.funcs = () => {
      console.log("Functions:", Array.from(this.functions.keys()));
    };

    this.context.history = () => {
      console.log("Command History:", this.commandHistory);
    };

    // Simple jQuery-like selector
    this.context.$ = (selector) => {
      return document.querySelector(selector);
    };

    this.context.$$ = (selector) => {
      return document.querySelectorAll(selector);
    };
  }

  addOutput(type, args) {
    const formattedArgs = args.map((arg) => this.formatValue(arg));
    const newOutput = {
      type,
      content: formattedArgs,
      timestamp: new Date().toLocaleTimeString(),
    };

    // Always add output - allow duplicates (user wants to see all console.log calls)
    this.output.push(newOutput);

    // Limit output history to prevent memory issues
    const maxOutputLines = 1000;
    if (this.output.length > maxOutputLines) {
      this.output = this.output.slice(-maxOutputLines);
    }

    this.throttledUpdateConsoleDisplay();
  }

  throttledUpdateConsoleDisplay() {
    // Throttle console updates for better performance
    if (this.updateThrottleTimeout) {
      clearTimeout(this.updateThrottleTimeout);
    }

    this.updateThrottleTimeout = setTimeout(() => {
      this.updateConsoleDisplay();
    }, 16); // ~60fps throttling
  }

  formatValue(value) {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value === "string") return value;
    if (typeof value === "function") return value.toString();
    if (typeof value === "object") {
      try {
        return JSON.stringify(value, null, 2);
      } catch (e) {
        return "[Object with circular reference]";
      }
    }
    return String(value);
  }

  execute(code, showCommand = true, language = "javascript") {
    if (!code.trim()) return;

    this.commandHistory.push(code);
    this.historyIndex = this.commandHistory.length;

    // Only add command to output if showCommand is true (for console input)
    if (showCommand) {
      this.addOutput("command", [code]);
    }

    try {
      const startTime = performance.now();

      // Handle different languages
      if (language === "html") {
        this.executeHTML(code);
      } else if (language === "css") {
        this.executeCSS(code);
      } else {
        // JavaScript execution (original logic)
        this.executeJavaScript(code);
      }

      const endTime = performance.now();
      const executionTime = (endTime - startTime).toFixed(2);

      // Update execution time in status
      this.updateExecutionTime(executionTime);
    } catch (error) {
      this.addOutput("error", [error.message]);
    }
  }

  // New method to clear the rendered page and start fresh
  clearRenderedPage() {
    if (window.htmlRenderer) {
      window.htmlRenderer.clear();
      // No console message needed - just clear silently
    }
  }

  // New method to build a complete page with HTML, CSS, and JS
  buildPage(htmlContent, cssContent, jsContent) {
    if (window.htmlRenderer) {
      if (htmlContent) window.htmlRenderer.setHTML(htmlContent);
      if (cssContent) window.htmlRenderer.setCSS(cssContent);
      if (jsContent) window.htmlRenderer.setJS(jsContent);
      // No console message needed - just update the renderer silently
    }
  }

  executeJavaScript(code) {
    // Check for potential infinite loops and add safety
    if (this.hasInfiniteLoopRisk(code)) {
      this.addOutput("warn", [
        "⚠️ Potential infinite loops detected. Adding safety measures...",
      ]);
      code = this.addLoopSafety(code);
    }

    // Make sure document is available in context
    this.context.document = document;
    this.context.window = window;

    try {
      // Simple synchronous execution with basic safety
      const func = new Function(...Object.keys(this.context), code);
      const result = func(...Object.values(this.context));

      // Extract variables and functions from executed code
      this.extractDefinitions(code);

      // Show result if it's not undefined
      if (result !== undefined) {
        this.addOutput("result", [result]);
      }
    } catch (error) {
      this.addOutput("error", [error.message]);
      throw error; // Re-throw so caller can handle
    }
  }

  executeHTML(code) {
    // Render HTML to the HTML output panel
    if (window.htmlRenderer) {
      window.htmlRenderer.setHTML(code);
      // HTML/CSS should only update the renderer, not console
    } else {
      this.addOutput("error", ["HTML renderer not available"]);
    }
  }

  executeCSS(code) {
    // Apply CSS styles to the HTML output
    if (window.htmlRenderer) {
      window.htmlRenderer.setCSS(code);
      // HTML/CSS should only update the renderer, not console
    } else {
      // Fallback: create a style element
      this.applyCSSToPage(code);
      this.addOutput("info", ["CSS applied to page"]);
    }
  }

  applyCSSToPage(css) {
    // Remove any existing dynamic CSS
    const existingStyle = document.getElementById("dynamic-css");
    if (existingStyle) {
      existingStyle.remove();
    }

    // Create new style element
    const styleElement = document.createElement("style");
    styleElement.id = "dynamic-css";
    styleElement.textContent = css;
    document.head.appendChild(styleElement);
  }

  extractDefinitions(code) {
    // Simple regex patterns to extract variable and function definitions
    const varPattern = /(?:var|let|const)\s+(\w+)/g;
    const funcPattern = /function\s+(\w+)/g;
    const arrowFuncPattern =
      /(?:var|let|const)\s+(\w+)\s*=\s*(?:\([^)]*\)|[^=])\s*=>/g;

    let match;

    // Extract variable declarations
    while ((match = varPattern.exec(code)) !== null) {
      this.variables.set(match[1], "variable");
    }

    // Extract function declarations
    while ((match = funcPattern.exec(code)) !== null) {
      this.functions.set(match[1], "function");
    }

    // Extract arrow function assignments
    while ((match = arrowFuncPattern.exec(code)) !== null) {
      this.functions.set(match[1], "arrow function");
    }
  }

  getAutocompleteItems() {
    const items = [];

    // JavaScript built-ins
    const builtins = [
      "console",
      "document",
      "window",
      "Array",
      "Object",
      "String",
      "Number",
      "Boolean",
      "Date",
      "Math",
      "JSON",
      "Promise",
      "setTimeout",
      "setInterval",
      "clearTimeout",
      "clearInterval",
      "parseInt",
      "parseFloat",
      "isNaN",
      "isFinite",
    ];

    builtins.forEach((item) => {
      items.push({ label: item, kind: "builtin", detail: "Built-in" });
    });

    // User-defined variables
    this.variables.forEach((type, name) => {
      items.push({ label: name, kind: "variable", detail: "Variable" });
    });

    // User-defined functions
    this.functions.forEach((type, name) => {
      items.push({ label: name, kind: "function", detail: "Function" });
    });

    // Context functions
    Object.keys(this.context).forEach((key) => {
      if (typeof this.context[key] === "function") {
        items.push({ label: key, kind: "method", detail: "Method" });
      }
    });

    return items;
  }

  clearOutput() {
    this.output = [];
    this.updateConsoleDisplay();
  }

  updateConsoleDisplay() {
    const consoleLog = document.getElementById("console-log");
    if (!consoleLog) return;

    consoleLog.innerHTML = "";

    this.output.forEach((item) => {
      const logEntry = document.createElement("div");
      logEntry.className = `console-entry console-${item.type}`;

      // Create prompt element
      const prompt = document.createElement("span");
      prompt.className = "console-prompt";
      prompt.textContent = "> ";

      const content = document.createElement("div");
      content.className = "console-content";

      // Handle multiple arguments properly - each on its own line if needed
      if (item.content.length === 1) {
        content.textContent = item.content[0];
      } else {
        // Multiple arguments - display them separated by spaces but preserve structure
        content.innerHTML = item.content
          .map((arg) => {
            const span = document.createElement("span");
            span.textContent = arg;
            return span.outerHTML;
          })
          .join(" ");
      }

      const entryContainer = document.createElement("div");
      entryContainer.className = "console-entry-container";
      entryContainer.appendChild(prompt);
      entryContainer.appendChild(content);

      logEntry.appendChild(entryContainer);
      consoleLog.appendChild(logEntry);
    });

    // Auto-scroll to bottom
    consoleLog.scrollTop = consoleLog.scrollHeight;
  }

  updateExecutionTime(time) {
    const executionTimeEl = document.getElementById("execution-time");
    if (executionTimeEl) {
      executionTimeEl.textContent = `Executed in ${time}ms`;
      setTimeout(() => {
        executionTimeEl.textContent = "";
      }, 3000);
    }
  }

  getCommandHistory() {
    return this.commandHistory;
  }

  navigateHistory(direction) {
    if (direction === "up" && this.historyIndex > 0) {
      this.historyIndex--;
      return this.commandHistory[this.historyIndex];
    } else if (
      direction === "down" &&
      this.historyIndex < this.commandHistory.length - 1
    ) {
      this.historyIndex++;
      return this.commandHistory[this.historyIndex];
    } else if (
      direction === "down" &&
      this.historyIndex === this.commandHistory.length - 1
    ) {
      this.historyIndex = this.commandHistory.length;
      return "";
    }
    return null;
  }

  hasInfiniteLoopRisk(code) {
    // Check for common infinite loop patterns
    const dangerousPatterns = [
      /while\s*\(\s*true\s*\)/i, // while(true)
      /while\s*\(\s*1\s*\)/i, // while(1)
      /for\s*\(\s*;[^;]*;[^)]*\)\s*\{/i, // for(;;) or for(;condition;)
      /while\s*\(\s*[^)]*\)\s*\{(?![^}]*break)[^}]*\}/i, // while without break
    ];

    return dangerousPatterns.some((pattern) => pattern.test(code));
  }

  addLoopSafety(code) {
    const maxIterations = 5000; // Reduced for better safety

    // Add safety wrapper
    const safeCode = `
      (() => {
        let __globalCounter = 0;
        const __maxIterations = ${maxIterations};
        const __checkLoop = () => {
          if (++__globalCounter > __maxIterations) {
            console.warn("🛑 Loop safety activated: Breaking after " + __maxIterations + " iterations");
            throw new Error("Loop safety: Maximum iterations exceeded");
          }
        };
        
        // Replace the original code with safety checks
        ${code
          .replace(/(while\s*\([^)]+\)\s*\{)/gi, "$1 __checkLoop();")
          .replace(/(for\s*\([^)]*\)\s*\{)/gi, "$1 __checkLoop();")}
      })();
    `;

    return safeCode;
  }
}

// Global instance
window.consoleEngine = new ConsoleEngine();
