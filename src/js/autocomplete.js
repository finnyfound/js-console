class AutocompleteManager {
  constructor(inputElement, engine) {
    this.input = inputElement;
    this.engine = engine;
    this.dropdown = document.getElementById('autocomplete-dropdown');
    this.isVisible = false;
    this.selectedIndex = -1;
    this.items = [];
    this.currentLanguage = 'javascript'; // Default language

    // JavaScript suggestions
    this.jsKeywords = [
      'break',
      'case',
      'catch',
      'class',
      'const',
      'continue',
      'debugger',
      'default',
      'delete',
      'do',
      'else',
      'enum',
      'export',
      'extends',
      'false',
      'finally',
      'for',
      'function',
      'if',
      'import',
      'in',
      'instanceof',
      'new',
      'null',
      'return',
      'super',
      'switch',
      'this',
      'throw',
      'true',
      'try',
      'typeof',
      'undefined',
      'var',
      'void',
      'while',
      'with',
      'yield',
      'let',
      'async',
      'await',
    ];

    this.jsMethods = [
      'forEach',
      'map',
      'filter',
      'reduce',
      'find',
      'findIndex',
      'indexOf',
      'includes',
      'slice',
      'splice',
      'push',
      'pop',
      'shift',
      'unshift',
      'join',
      'split',
      'replace',
      'match',
      'search',
      'toLowerCase',
      'toUpperCase',
      'trim',
      'substring',
      'charAt',
      'charCodeAt',
      'toString',
      'valueOf',
      'hasOwnProperty',
      'keys',
      'values',
      'entries',
      'assign',
      'create',
      'defineProperty',
    ];

    // HTML suggestions
    this.htmlTags = [
      'div',
      'span',
      'p',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'a',
      'img',
      'ul',
      'ol',
      'li',
      'table',
      'tr',
      'td',
      'th',
      'form',
      'input',
      'button',
      'textarea',
      'select',
      'option',
      'header',
      'footer',
      'nav',
      'main',
      'section',
      'article',
      'aside',
      'figure',
      'figcaption',
      'blockquote',
      'pre',
      'code',
    ];

    this.htmlAttributes = [
      'id',
      'class',
      'style',
      'src',
      'href',
      'alt',
      'title',
      'type',
      'name',
      'value',
      'placeholder',
      'disabled',
      'readonly',
      'required',
      'checked',
      'selected',
      'multiple',
      'data-*',
    ];

    // CSS suggestions
    this.cssProperties = [
      'color',
      'background-color',
      'font-size',
      'font-family',
      'font-weight',
      'text-align',
      'text-decoration',
      'line-height',
      'letter-spacing',
      'margin',
      'margin-top',
      'margin-right',
      'margin-bottom',
      'margin-left',
      'padding',
      'padding-top',
      'padding-right',
      'padding-bottom',
      'padding-left',
      'border',
      'border-width',
      'border-style',
      'border-color',
      'border-radius',
      'width',
      'height',
      'min-width',
      'max-width',
      'min-height',
      'max-height',
      'display',
      'position',
      'top',
      'right',
      'bottom',
      'left',
      'z-index',
      'float',
      'clear',
      'overflow',
      'visibility',
      'opacity',
      'cursor',
    ];

    this.cssValues = [
      'auto',
      'inherit',
      'initial',
      'none',
      'block',
      'inline',
      'inline-block',
      'flex',
      'grid',
      'absolute',
      'relative',
      'fixed',
      'static',
      'sticky',
      'left',
      'right',
      'center',
      'justify',
      'bold',
      'normal',
      'italic',
    ];

    this.setupEventListeners();
  }

  setLanguage(language) {
    this.currentLanguage = language;
  }

  setupEventListeners() {
    this.input.addEventListener('input', (e) => {
      this.handleInput(e);
    });

    this.input.addEventListener('keydown', (e) => {
      this.handleKeydown(e);
    });

    this.input.addEventListener('blur', () => {
      // Hide dropdown after a short delay to allow clicking
      setTimeout(() => this.hide(), 150);
    });

    document.addEventListener('click', (e) => {
      if (!this.dropdown.contains(e.target) && e.target !== this.input) {
        this.hide();
      }
    });
  }

  handleInput(e) {
    const value = this.input.value;
    const cursorPos = this.input.selectionStart;

    // Find the word being typed
    const beforeCursor = value.substring(0, cursorPos);
    const wordMatch = beforeCursor.match(/[\w$]+$/);

    if (!wordMatch || wordMatch[0].length < 1) {
      this.hide();
      return;
    }

    const currentWord = wordMatch[0];
    this.showSuggestions(currentWord, cursorPos - currentWord.length);
  }

  handleKeydown(e) {
    if (!this.isVisible) {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        // Show history navigation or autocomplete
        return;
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectedIndex = Math.min(
          this.selectedIndex + 1,
          this.items.length - 1
        );
        this.updateSelection();
        break;

      case 'ArrowUp':
        e.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        this.updateSelection();
        break;

      case 'Tab':
      case 'Enter':
        e.preventDefault();
        if (this.selectedIndex >= 0) {
          this.selectItem(this.items[this.selectedIndex]);
        }
        break;

      case 'Escape':
        this.hide();
        break;
    }
  }

  showSuggestions(query, startPos) {
    const suggestions = this.getSuggestions(query);

    if (suggestions.length === 0) {
      this.hide();
      return;
    }

    this.items = suggestions;
    this.selectedIndex = -1;
    this.render(suggestions);
    this.show();
    this.wordStart = startPos;
  }

  getSuggestions(query) {
    const suggestions = [];
    const lowerQuery = query.toLowerCase();

    // Get language-specific suggestions
    if (this.currentLanguage === 'javascript') {
      this.getJavaScriptSuggestions(suggestions, lowerQuery, query);
    } else if (this.currentLanguage === 'html') {
      this.getHTMLSuggestions(suggestions, lowerQuery, query);
    } else if (this.currentLanguage === 'css') {
      this.getCSSSuggestions(suggestions, lowerQuery, query);
    }

    // Sort by relevance score
    return suggestions.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  getJavaScriptSuggestions(suggestions, lowerQuery, query) {
    // Get suggestions from engine (variables, functions, etc.)
    const engineItems = this.engine.getAutocompleteItems();
    engineItems.forEach((item) => {
      if (item.label.toLowerCase().startsWith(lowerQuery)) {
        suggestions.push({
          label: item.label,
          kind: item.kind,
          detail: item.detail,
          score: this.calculateScore(item.label, query),
        });
      }
    });

    // Add JavaScript keywords
    this.jsKeywords.forEach((keyword) => {
      if (keyword.toLowerCase().startsWith(lowerQuery)) {
        suggestions.push({
          label: keyword,
          kind: 'keyword',
          detail: 'JS Keyword',
          score: this.calculateScore(keyword, query),
        });
      }
    });

    // Add common methods
    this.jsMethods.forEach((method) => {
      if (method.toLowerCase().startsWith(lowerQuery)) {
        suggestions.push({
          label: method,
          kind: 'method',
          detail: 'JS Method',
          score: this.calculateScore(method, query),
        });
      }
    });
  }

  getHTMLSuggestions(suggestions, lowerQuery, query) {
    // HTML tags
    this.htmlTags.forEach((tag) => {
      if (tag.toLowerCase().startsWith(lowerQuery)) {
        suggestions.push({
          label: tag,
          kind: 'tag',
          detail: 'HTML Tag',
          score: this.calculateScore(tag, query),
        });
      }
    });

    // HTML attributes
    this.htmlAttributes.forEach((attr) => {
      if (attr.toLowerCase().startsWith(lowerQuery)) {
        suggestions.push({
          label: attr,
          kind: 'attribute',
          detail: 'HTML Attribute',
          score: this.calculateScore(attr, query),
        });
      }
    });
  }

  getCSSSuggestions(suggestions, lowerQuery, query) {
    // CSS properties
    this.cssProperties.forEach((prop) => {
      if (prop.toLowerCase().startsWith(lowerQuery)) {
        suggestions.push({
          label: prop,
          kind: 'property',
          detail: 'CSS Property',
          score: this.calculateScore(prop, query),
        });
      }
    });

    // CSS values
    this.cssValues.forEach((value) => {
      if (value.toLowerCase().startsWith(lowerQuery)) {
        suggestions.push({
          label: value,
          kind: 'value',
          detail: 'CSS Value',
          score: this.calculateScore(value, query),
        });
      }
    });
  }

  calculateScore(suggestion, query) {
    const suggestionLower = suggestion.toLowerCase();
    const queryLower = query.toLowerCase();

    // Exact match gets highest score
    if (suggestionLower === queryLower) return 100;

    // Starts with gets high score
    if (suggestionLower.startsWith(queryLower)) {
      return 90 - (suggestion.length - query.length);
    }

    // Contains gets lower score
    if (suggestionLower.includes(queryLower)) {
      return 50 - (suggestion.length - query.length);
    }

    return 0;
  }

  render(suggestions) {
    this.dropdown.innerHTML = '';

    suggestions.forEach((suggestion, index) => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.dataset.index = index;

      const label = document.createElement('span');
      label.className = 'autocomplete-label';
      label.textContent = suggestion.label;

      const detail = document.createElement('span');
      detail.className = `autocomplete-detail autocomplete-${suggestion.kind}`;
      detail.textContent = suggestion.detail;

      item.appendChild(label);
      item.appendChild(detail);

      item.addEventListener('click', () => {
        this.selectItem(suggestion);
      });

      this.dropdown.appendChild(item);
    });
  }

  selectItem(item) {
    const value = this.input.value;
    const cursorPos = this.input.selectionStart;

    // Calculate word boundaries
    const beforeCursor = value.substring(0, cursorPos);
    const afterCursor = value.substring(cursorPos);
    const wordMatch = beforeCursor.match(/[\w$]+$/);

    if (wordMatch) {
      const wordStart = cursorPos - wordMatch[0].length;
      const newValue = value.substring(0, wordStart) + item.label + afterCursor;
      const newCursorPos = wordStart + item.label.length;

      this.input.value = newValue;
      this.input.setSelectionRange(newCursorPos, newCursorPos);
    }

    this.hide();
    this.input.focus();
  }

  updateSelection() {
    const items = this.dropdown.querySelectorAll('.autocomplete-item');
    items.forEach((item, index) => {
      item.classList.toggle('selected', index === this.selectedIndex);
    });
  }

  show() {
    this.dropdown.style.display = 'block';
    this.isVisible = true;
    this.positionDropdown();
  }

  hide() {
    this.dropdown.style.display = 'none';
    this.isVisible = false;
    this.selectedIndex = -1;
  }

  positionDropdown() {
    const inputRect = this.input.getBoundingClientRect();
    this.dropdown.style.top = inputRect.bottom + window.scrollY + 'px';
    this.dropdown.style.left = inputRect.left + 'px';
    this.dropdown.style.minWidth = inputRect.width + 'px';
  }
}

// Export for use in main app
window.AutocompleteManager = AutocompleteManager;
