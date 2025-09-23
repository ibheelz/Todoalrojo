(function(){
  // Simple PinUp theme for /public/lead-form.html driven by /public/js/lead-form.js
  const PinUpTheme = {
    apply() {
      try {
        document.body.classList.add('theme-pinup');

        const css = `
          /* PinUp gold-on-dark styling */
          body.theme-pinup { background: #0a0a0a; }

          body.theme-pinup .header h1 { color:#fdc600; }
          body.theme-pinup .header p { color: rgba(255,255,255,0.65); }

          body.theme-pinup .submit-btn {
            background: linear-gradient(135deg, rgba(253,198,0,0.95), rgba(253,198,0,0.80));
            color: #0a0a0a;
            border: 1px solid rgba(253,198,0,0.35);
            box-shadow: 0 8px 28px rgba(253,198,0,0.15), inset 0 1px 0 rgba(255,255,255,0.25);
          }
          body.theme-pinup .submit-btn:hover { filter: brightness(1.05); }

          /* Inputs: subtle gold borders on focus */
          body.theme-pinup input, body.theme-pinup select {
            border-color: rgba(255,255,255,0.18);
            background: rgba(255,255,255,0.04);
            color: #fff;
          }
          body.theme-pinup input::placeholder { color: rgba(255,255,255,0.45); }
          body.theme-pinup input:focus, body.theme-pinup select:focus {
            border-color: rgba(253,198,0,0.55);
            box-shadow: 0 0 0 3px rgba(253,198,0,0.15);
          }

          /* Success icon tint */
          body.theme-pinup .success-icon {
            background: linear-gradient(135deg, rgba(253,198,0,0.15), rgba(253,198,0,0.10));
            color:#fdc600;
          }

          /* Checkboxes */
          body.theme-pinup input[type="checkbox"]:checked {
            background: #fdc600;
            border-color: #fdc600;
          }
        `;

        const style = document.createElement('style');
        style.id = 'pinup-theme-styles';
        style.textContent = css;
        document.head.appendChild(style);
      } catch (e) {
        console.warn('[PinUpTheme] apply failed', e);
      }
    }
  };

  // Register with ThemeRegistry if present
  if (window.ThemeRegistry && typeof window.ThemeRegistry.register === 'function') {
    window.ThemeRegistry.register('pinup', PinUpTheme);
  }
  // Also expose globally for fallback
  window.PinUpTheme = PinUpTheme;
})();

