/**
 * Unified State Management System
 * Handles all application state persistence, validation, and synchronization
 */
class StateManager {
  // Schema version for state migration
  static STATE_VERSION = '1.0.0';

  // Storage keys configuration
  static STORAGE_KEYS = {
    appState: 'js-console-app-state',
  };

  // Default state schema
  static DEFAULT_STATE = {
    version: StateManager.STATE_VERSION,
    preferences: {
      theme: 'dark',
      language: 'javascript',
      fontSize: 14,
      minimap: false,
    },
    codeContent: {
      javascript: `// Welcome to JS Formatter Console!
// Press Ctrl+Enter (Cmd+Enter on Mac) to run.

// --- Logging ---
console.log("Hello from JS Console!");
console.info("Supports info, warn, and error too.");
console.warn("This is a warning.");
console.error("This is an error.");

// --- Objects & Arrays ---
const user = { name: "Finny", role: "developer", active: true };
console.log("User:", user);

const nums = [1, 2, 3, 4, 5];
const doubled = nums.map(n => n * 2);
console.log("Doubled:", doubled);

// --- Async ---
const result = await Promise.resolve("Async works too!");
console.log(result);`,
      html: `<!-- Switch to the Output tab to preview this -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Preview</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="card">
    <div class="badge">Live Preview</div>
    <h1>JS Formatter Console</h1>
    <p>Edit the <strong>HTML</strong> and <strong>CSS</strong> tabs, then check the <strong>Output</strong> tab to see your page rendered live.</p>
    <div class="features">
      <div class="feature">⚡ JavaScript</div>
      <div class="feature">🎨 CSS</div>
      <div class="feature">📄 HTML</div>
    </div>
    <button onclick="this.textContent = '🎉 It works!'" class="btn">Click me</button>
  </div>
</body>
</html>`,
      css: `/* Switch to the Output tab to preview styles */
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: system-ui, sans-serif;
  background: #0d1117;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.card {
  background: #161b22;
  border: 1px solid #21262d;
  border-radius: 16px;
  padding: 2.5rem;
  max-width: 480px;
  width: 100%;
  text-align: center;
}

.badge {
  display: inline-block;
  background: rgba(8,145,178,0.15);
  color: #22d3ee;
  border: 1px solid rgba(8,145,178,0.3);
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 4px 12px;
  margin-bottom: 1.25rem;
}

h1 {
  color: #e6edf3;
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

p {
  color: #7d8590;
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 1.75rem;
}

.features {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-bottom: 1.75rem;
}

.feature {
  background: #21262d;
  color: #e6edf3;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 0.85rem;
  font-weight: 500;
}

.btn {
  background: #0891b2;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 28px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn:hover {
  background: #0e7490;
}`,
    },
    session: {
      currentLanguage: 'javascript',
      lastSaved: null,
      autoSaveEnabled: true,
    },
  };

  constructor() {
    this.state = this.loadState();
    this.subscribers = new Map();
    this.autoSaveTimeout = null;
    this.autoSaveDelay = 1000; // Auto-save after 1 second of inactivity

    // Setup auto-save
    this.setupAutoSave();
  }

  /**
   * Load and validate state from localStorage
   */
  loadState() {
    try {
      const storedState = localStorage.getItem(
        StateManager.STORAGE_KEYS.appState,
      );

      if (!storedState) {
        return this.createDefaultState();
      }

      const parsedState = JSON.parse(storedState);

      // Validate state schema
      if (!this.validateState(parsedState)) {
        return this.createDefaultState();
      }

      // Check version compatibility
      if (parsedState.version !== StateManager.STATE_VERSION) {
        return this.migrateState(parsedState);
      }
      return parsedState;
    } catch (error) {
      console.error('Failed to load state:', error);
      return this.createDefaultState();
    }
  }

  /**
   * Create default state structure
   */
  createDefaultState() {
    return JSON.parse(JSON.stringify(StateManager.DEFAULT_STATE));
  }

  /**
   * Validate state schema
   */
  validateState(state) {
    if (!state || typeof state !== 'object') return false;
    if (!state.preferences || !state.codeContent || !state.session)
      return false;

    // Validate required preference keys
    const requiredPrefs = ['theme', 'autoRun', 'language'];
    for (const key of requiredPrefs) {
      if (!(key in state.preferences)) return false;
    }

    // Validate required code content keys
    const requiredCode = ['javascript', 'html', 'css'];
    for (const key of requiredCode) {
      if (!(key in state.codeContent)) return false;
    }

    return true;
  }

  /**
   * Migrate state from older versions
   */
  migrateState(oldState) {
    const newState = this.createDefaultState();

    // Preserve valid data from old state
    try {
      if (oldState.preferences) {
        Object.assign(newState.preferences, oldState.preferences);
      }
      if (oldState.codeContent) {
        Object.assign(newState.codeContent, oldState.codeContent);
      }
      if (oldState.session) {
        Object.assign(newState.session, oldState.session);
      }
    } catch (error) {
      // Migration failed, use defaults
    }

    return newState;
  }

  /**
   * Save state to localStorage
   */
  saveState(immediate = false) {
    if (!immediate && this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    const save = () => {
      try {
        this.state.session.lastSaved = new Date().toISOString();
        localStorage.setItem(
          StateManager.STORAGE_KEYS.appState,
          JSON.stringify(this.state),
        );
        this.notifySubscribers('state:saved', {
          timestamp: this.state.session.lastSaved,
        });
      } catch (error) {
        console.error('Failed to save state:', error);
        this.notifySubscribers('state:error', { error: error.message });
      }
    };

    if (immediate) {
      save();
    } else {
      this.autoSaveTimeout = setTimeout(save, this.autoSaveDelay);
    }
  }

  /**
   * Setup auto-save functionality
   */
  setupAutoSave() {
    // Save state when page is about to unload
    window.addEventListener('beforeunload', () => {
      this.saveState(true);
    });

    // Save state periodically
    setInterval(() => {
      if (this.state.session.autoSaveEnabled) {
        this.saveState(true);
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Get current state or specific path
   */
  getState(path = null) {
    if (!path) return this.state;

    return path.split('.').reduce((obj, key) => obj?.[key], this.state);
  }

  /**
   * Update state and trigger save
   */
  setState(path, value, options = {}) {
    const { immediate = false, notify = true } = options;

    try {
      // Update nested state
      const keys = path.split('.');
      const lastKey = keys.pop();
      const target = keys.reduce((obj, key) => {
        if (!obj[key]) obj[key] = {};
        return obj[key];
      }, this.state);

      const oldValue = target[lastKey];
      target[lastKey] = value;

      // Trigger save
      this.saveState(immediate);

      // Notify subscribers
      if (notify) {
        this.notifySubscribers(`state:changed:${path}`, {
          path,
          value,
          oldValue,
        });
        this.notifySubscribers('state:changed', {
          path,
          value,
          oldValue,
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to update state:', error);
      return false;
    }
  }

  /**
   * Update multiple state values at once
   */
  batchUpdate(updates, options = {}) {
    const { immediate = false } = options;

    try {
      const changes = [];

      for (const [path, value] of Object.entries(updates)) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, key) => {
          if (!obj[key]) obj[key] = {};
          return obj[key];
        }, this.state);

        const oldValue = target[lastKey];
        target[lastKey] = value;

        changes.push({ path, value, oldValue });
      }

      // Trigger save
      this.saveState(immediate);

      // Notify subscribers
      this.notifySubscribers('state:batch-changed', { changes });

      return true;
    } catch (error) {
      console.error('Failed to batch update state:', error);
      return false;
    }
  }

  /**
   * Subscribe to state changes
   */
  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      const eventSubscribers = this.subscribers.get(event);
      if (eventSubscribers) {
        eventSubscribers.delete(callback);
      }
    };
  }

  /**
   * Notify all subscribers of an event
   */
  notifySubscribers(event, data) {
    const eventSubscribers = this.subscribers.get(event);
    if (eventSubscribers) {
      eventSubscribers.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Subscriber error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Reset state to defaults
   */
  resetState() {
    this.state = this.createDefaultState();
    this.saveState(true);
    this.notifySubscribers('state:reset', {});
  }

  /**
   * Export state for backup
   */
  exportState() {
    return JSON.stringify(this.state, null, 2);
  }

  /**
   * Import state from backup
   */
  importState(stateJson) {
    try {
      const importedState = JSON.parse(stateJson);

      if (!this.validateState(importedState)) {
        throw new Error('Invalid state format');
      }

      this.state = importedState;
      this.saveState(true);
      this.notifySubscribers('state:imported', {});

      return true;
    } catch (error) {
      console.error('Failed to import state:', error);
      return false;
    }
  }

  /**
   * Get state debugging information
   */
  getDebugInfo() {
    return {
      version: this.state.version,
      lastSaved: this.state.session.lastSaved,
      autoSaveEnabled: this.state.session.autoSaveEnabled,
      stateSize: JSON.stringify(this.state).length,
      subscriberCount: Array.from(this.subscribers.values()).reduce(
        (total, set) => total + set.size,
        0,
      ),
    };
  }
}

// Export for use in other modules
window.StateManager = StateManager;
