class HTMLRenderer {
  constructor() {
    this.renderFrame = document.getElementById('render-frame');
    this.htmlContent = '';
    this.cssContent = '';
    this.jsContent = '';
    this.customStyles = [];
    this.customScripts = [];
    this.lastRenderedContent = ''; // Track last rendered content to prevent unnecessary updates

    this.setupRenderFrame();
  }

  setupRenderFrame() {
    // Set initial background to match theme
    const isDarkTheme = document.body.classList.contains('dark-theme');
    this.renderFrame.style.backgroundColor = isDarkTheme
      ? '#161b22'
      : '#ffffff';
    this.updateFrame();
  }

  buildCompleteDocument() {
    // Get current theme for proper background color
    const isDarkTheme = document.body.classList.contains('dark-theme');
    const bgColor = isDarkTheme ? '#161b22' : '#ffffff';
    const textColor = isDarkTheme ? '#e6edf3' : '#333333';

    // Combine all CSS (built-in + custom + user CSS)
    const allStyles = `
            /* Base styles for better rendering */
           body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 20px;
                padding: 0px;
       
                line-height: 1.6;
                color: ${textColor};
                background-color: ${bgColor};
               
            }
            * {
                box-sizing: border-box;
            }
            ${this.customStyles.join('\n')}
            ${this.cssContent}
        `;

    // Combine all JavaScript with console overrides
    const allScripts = `
            // Inject console overrides to capture output from iframe
            (function() {
                if (window.parent && window.parent.consoleEngine) {
                    const engine = window.parent.consoleEngine;
                    
                    // Override console methods to send output to parent console
                    console.log = (...args) => {
                        engine.addOutput('log', args);
                        engine.originalConsole.log(...args);
                    };
                    
                    console.error = (...args) => {
                        engine.addOutput('error', args);
                        engine.originalConsole.error(...args);
                    };
                    
                    console.warn = (...args) => {
                        engine.addOutput('warn', args);
                        engine.originalConsole.warn(...args);
                    };
                    
                    console.info = (...args) => {
                        engine.addOutput('info', args);
                        engine.originalConsole.info(...args);
                    };
                }
            })();
            
            ${this.customScripts.join('\n')}
            ${this.jsContent}
        `;

    // Build complete HTML document
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rendered Page</title>
    <style>
        ${allStyles}
    </style>
</head>
<body>
    ${
      this.htmlContent ||
      '<p><em>No HTML content yet. Switch to HTML mode and add some content!</em></p>'
    }
    <script>
        try {
            ${allScripts}
        } catch (error) {
            console.error('Script execution error:', error);
            // Escape the error message to prevent XSS
            const escapedMessage = error.message
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
            document.body.insertAdjacentHTML('beforeend', 
                '<div style="background: #ffe6e6; border: 1px solid #ff6b6b; padding: 10px; margin: 10px 0; border-radius: 4px;">' +
                '<strong>JavaScript Error:</strong> ' + escapedMessage + 
                '</div>'
            );
        }
    </script>
</body>
</html>`;
  }

  updateFrame() {
    const completeDocument = this.buildCompleteDocument();

    // Only update if content has actually changed to prevent flashing
    if (completeDocument !== this.lastRenderedContent) {
      // Use data URL to prevent white flash that occurs with srcdoc
      const dataUrl =
        'data:text/html;charset=utf-8,' + encodeURIComponent(completeDocument);

      // Use requestAnimationFrame for smoother updates
      requestAnimationFrame(() => {
        this.renderFrame.src = dataUrl;
        this.lastRenderedContent = completeDocument;
      });
    }
  }

  setHTML(html) {
    this.htmlContent = html;
    this.updateFrame();
  }

  addHTML(html) {
    this.htmlContent += html;
    this.updateFrame();
  }

  setCSS(css) {
    this.cssContent = css;
    this.updateFrame();
  }

  addCSS(css) {
    this.cssContent += '\n' + css;
    this.updateFrame();
  }

  setJS(js) {
    this.jsContent = js;
    this.updateFrame();
  }

  addJS(js) {
    this.jsContent += '\n' + js;
    this.updateFrame();
  }

  // Legacy methods for backward compatibility
  renderHTML(html) {
    this.setHTML(html);
  }

  applyCSS(css) {
    this.setCSS(css);
  }

  clear() {
    // Clear all content silently
    this.htmlContent = '';
    this.cssContent = '';
    this.jsContent = '';
    this.customStyles = [];
    this.customScripts = [];
    this.lastRenderedContent = ''; // Reset tracked content
    this.updateFrame();
  }

  // Methods to add persistent styles/scripts that persist across language switches
  addPersistentStyle(css) {
    this.customStyles.push(css);
    this.updateFrame();
  }

  addPersistentScript(js) {
    this.customScripts.push(js);
    this.updateFrame();
  }

  // Helper methods for common HTML operations
  createElement(tag, content = '', attributes = {}) {
    let html = `<${tag}`;

    // Add attributes
    for (const [key, value] of Object.entries(attributes)) {
      html += ` ${key}="${value}"`;
    }

    html += `>${content}</${tag}>`;
    return html;
  }

  createTable(data, headers = null) {
    let html =
      '<table border="1" style="border-collapse: collapse; width: 100%;">';

    // Add headers if provided
    if (headers) {
      html += '<thead><tr>';
      headers.forEach((header) => {
        html += `<th style="padding: 8px; background-color: #f5f5f5;">${header}</th>`;
      });
      html += '</tr></thead>';
    }

    // Add data rows
    html += '<tbody>';
    data.forEach((row) => {
      html += '<tr>';
      if (Array.isArray(row)) {
        row.forEach((cell) => {
          html += `<td style="padding: 8px; border: 1px solid #ddd;">${cell}</td>`;
        });
      } else if (typeof row === 'object') {
        Object.values(row).forEach((cell) => {
          html += `<td style="padding: 8px; border: 1px solid #ddd;">${cell}</td>`;
        });
      }
      html += '</tr>';
    });
    html += '</tbody></table>';

    return html;
  }

  createList(items, ordered = false) {
    const tag = ordered ? 'ol' : 'ul';
    let html = `<${tag}>`;

    items.forEach((item) => {
      html += `<li>${item}</li>`;
    });

    html += `</${tag}>`;
    return html;
  }

  // Method to handle special render commands from console
  handleRenderCommand(command, data) {
    switch (command) {
      case 'html':
        this.setHTML(data);
        break;
      case 'text':
        this.setHTML(`<p>${data}</p>`);
        break;
      case 'table':
        if (Array.isArray(data)) {
          const tableHTML = this.createTable(data);
          this.setHTML(tableHTML);
        }
        break;
      case 'list':
        if (Array.isArray(data)) {
          const listHTML = this.createList(data);
          this.setHTML(listHTML);
        }
        break;
      case 'clear':
        this.clear();
        break;
      default:
        console.warn('Unknown render command:', command);
    }
  }
}

// Global instance
window.htmlRenderer = new HTMLRenderer();

// Add render function to global context for console use
window.render = {
  html: (html) => window.htmlRenderer.setHTML(html),
  text: (text) => window.htmlRenderer.setHTML(`<p>${text}</p>`),
  table: (data, headers) => {
    const tableHTML = window.htmlRenderer.createTable(data, headers);
    window.htmlRenderer.setHTML(tableHTML);
  },
  list: (items, ordered = false) => {
    const listHTML = window.htmlRenderer.createList(items, ordered);
    window.htmlRenderer.setHTML(listHTML);
  },
  clear: () => window.htmlRenderer.clear(),
  css: (css) => window.htmlRenderer.setCSS(css),
  js: (js) => window.htmlRenderer.setJS(js),
};

// Global instance - Initialize the HTML renderer
window.htmlRenderer = new HTMLRenderer();
