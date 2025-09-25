// File: /themes/rushbet.js
// Rushbet Giveaway Theme - Based on PIN-UP structure with Rushbet branding
// Usage: add ?campaign=rushbet or ?theme=rushbet

(function () {
  const RADIUS = 20; // consistent roundness

  const RushbetTheme = {
    config: {
      name: 'rushbet',
      logo: '/assets/rushbet-logo.png',
      bgImage: '/assets/Rushbet-BG.png',
      colors: {
        primary: '#265f92', // Rushbet blue
        primaryDark: '#0b2e4c', // Darker blue
        darkGradientTop: '#0b2e4c', // Rushbet dark blue
        darkGradientBottom: '#081a29', // Even darker blue
        inputBg: '#1a3b5c', // Blue-tinted input background
        gold: '#FDB61C', // Rushbet gold/yellow
      },
      green: '#4ec65a', // Rushbet green
      greenDark: '#3ba347', // darker green
      buttonTop: '#265f92', // Rushbet blue
      buttonBottom: '#0b2e4c', // Rushbet darker blue
    },

    apply() {
      // Font
      if (!document.querySelector('link[href*="fonts.googleapis.com"][href*="Montserrat"]')) {
        const font = document.createElement('link');
        font.rel = 'stylesheet';
        font.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap';
        document.head.appendChild(font);
      }

      // Tailwind config BEFORE CDN script
      const cfgId = 'rushbet-tailwind-config';
      if (!document.getElementById(cfgId)) {
        const cfg = document.createElement('script');
        cfg.id = cfgId;
        cfg.textContent = `
          window.tailwind = window.tailwind || {};
          window.tailwind.config = {
            theme: { extend: { colors: {
              'rushbet-orange': '${this.config.colors.primary}',
              'rushbet-orange-dark': '${this.config.colors.primaryDark}',
              'rushbet-green': '${this.config.green}',
              'rushbet-green-dark': '${this.config.greenDark}',
              'rushbet-dark-top': '${this.config.colors.darkGradientTop}',
              'rushbet-dark-bottom': '${this.config.colors.darkGradientBottom}',
              'rushbet-input': '${this.config.colors.inputBg}'
            }, fontFamily: { montserrat: ['Montserrat','sans-serif'] } } }
          };
        `;
        document.head.appendChild(cfg);
      }

      const hasTW = !!document.querySelector('script[src*="cdn.tailwindcss.com"]');
      const go = () => requestAnimationFrame(() => this.applyStyles());
      if (!hasTW) {
        const tw = document.createElement('script');
        tw.src = 'https://cdn.tailwindcss.com';
        tw.onload = go; tw.onerror = go; document.head.appendChild(tw);
      } else { setTimeout(go, 60); }
    },

    applyStyles() {
      // Body
      document.body.classList.add('font-montserrat','min-h-screen','flex','items-center','justify-center','p-5');
      document.body.style.background = `url('${this.config.bgImage}') no-repeat center center fixed`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.fontFamily = 'Montserrat, sans-serif';

      // Glass edge styles
      if (!document.getElementById('rushbet-glass-styles')) {
        const s = document.createElement('style');
        s.id = 'rushbet-glass-styles';
        s.textContent = `
          .glass-edge { position:absolute; inset:0; border-radius:${RADIUS}px; pointer-events:none; }
          .glass-edge::before { content:''; position:absolute; inset:0; padding:2px; border-radius:${RADIUS}px;
            background: linear-gradient(135deg, rgba(255,255,255,.35), rgba(255,255,255,.14), rgba(255,255,255,.08), rgba(255,255,255,.18));
            -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
            -webkit-mask-composite: xor; mask-composite: exclude; }
          .glass-edge::after { content:''; position:absolute; inset:1px; border-radius:${RADIUS-1}px;
            box-shadow: inset 0 1px 0 rgba(255,255,255,.18), inset 0 -1px 0 rgba(0,0,0,.25); }
          .rushbet-skin { padding: 24px; }
          @media (min-width: 640px) { .rushbet-skin { padding-left: 32px; padding-right: 32px; } }
          @media (min-width: 768px) { .rushbet-skin { padding-left: 40px; padding-right: 40px; } }

          /* Upload area specific styles */
          .upload-area {
            border-color: rgba(255,102,0,0.3) !important;
          }
          .upload-area:hover,
          .upload-area.dragover {
            border-color: ${this.config.colors.primary} !important;
            background: rgba(255,102,0,0.1) !important;
          }

          .file-preview {
            background: rgba(255,102,0,0.1) !important;
            border-color: rgba(255,102,0,0.3) !important;
          }
        `;
        document.head.appendChild(s);
      }

      // Container → Card (fixed width 480px)
      const container = document.querySelector('.container');
      if (container && !container.dataset.rushbetApplied) {
        container.dataset.rushbetApplied = 'true';
        container.className = 'relative z-10 w-full mx-auto';
        container.style.maxWidth = '480px';
        container.style.width = '100%';

        const formCard = document.createElement('div');
        formCard.className = 'rushbet-skin';
        formCard.style.position = 'relative';
        formCard.style.overflow = 'hidden';
        // Glassmorphism background
        formCard.style.background = 'linear-gradient(to bottom, rgba(42,48,60,0.65), rgba(11,12,16,0.65))';
        formCard.style.backdropFilter = 'blur(16px) saturate(140%)';
        formCard.style.webkitBackdropFilter = 'blur(16px) saturate(140%)';
        formCard.style.border = '1px solid rgba(255,255,255,0.08)';
        formCard.style.borderRadius = RADIUS + 'px';
        formCard.style.boxShadow = '0 10px 30px rgba(0,0,0,0.35)';

        // Top gloss highlight
        const gloss = document.createElement('div');
        gloss.style.position = 'absolute'; gloss.style.top = '0'; gloss.style.left = '0'; gloss.style.right = '0'; gloss.style.height = '64px';
        gloss.style.background = 'linear-gradient(to bottom, rgba(255,255,255,0.18), rgba(255,255,255,0))';
        gloss.style.pointerEvents = 'none';
        gloss.style.borderTopLeftRadius = gloss.style.borderTopRightRadius = (RADIUS - 1) + 'px';
        formCard.appendChild(gloss);

        // Glass edge effect
        const edge = document.createElement('div');
        edge.className = 'glass-edge';
        formCard.appendChild(edge);

        while (container.firstChild) formCard.appendChild(container.firstChild);
        container.appendChild(formCard);
      }

      // Logo
      const logoContainer = document.querySelector('.logo');
      if (logoContainer) {
        logoContainer.className = 'w-40 h-16 mx-auto mb-3';
        logoContainer.style.marginTop = '0px';
        logoContainer.innerHTML = `<img src="${this.config.logo}" alt="RUSHBET" class="w-full h-full object-contain" />`;
      }

      // Header
      const h1 = document.querySelector('.header h1');
      if (h1) {
        h1.className = 'text-2xl font-bold mb-2 tracking-tight';
        h1.style.color = '#4A90C2'; // Lighter Rushbet blue for better visibility
      }
      const headerP = document.querySelector('.header p');
      if (headerP) headerP.className = 'text-gray-400 text-sm mb-4';

      // Labels & asterisks
      document.querySelectorAll('label').forEach((label) => {
        label.className = 'block text-white font-semibold mb-2 text-sm';
      });
      document.querySelectorAll('.required').forEach((req) => {
        req.style.color = this.config.colors.primary;
        req.classList.add('ml-1');
      });

      // Inputs (2px edges with Rushbet blue)
      document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]').forEach((input) => {
        input.className = 'w-full px-4 py-3 text-white placeholder-gray-400 transition-all';
        input.style.backgroundColor = 'rgba(31,41,55,0.55)';
        input.style.backdropFilter = 'blur(6px)';
        input.style.border = `2px solid ${this.config.colors.primary}`;
        input.style.borderRadius = RADIUS + 'px';
      });

      // Hide input icons & adjust padding (same as PinUp)
      document.querySelectorAll('.input-icon').forEach((icon) => (icon.style.display = 'none'));
      document.querySelectorAll('input').forEach((input) => { if (input.style.paddingLeft) input.style.paddingLeft = '1rem'; });

      // Selects (2px edges with Rushbet orange)
      document.querySelectorAll('select').forEach((select) => {
        select.className = 'w-full px-4 py-3 text-white transition-all appearance-none cursor-pointer';
        select.style.backgroundColor = 'rgba(31,41,55,0.55)';
        select.style.backdropFilter = 'blur(6px)';
        select.style.border = `2px solid ${this.config.colors.primary}`;
        select.style.borderRadius = RADIUS + 'px';
        select.style.backgroundImage = "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")";
        select.style.backgroundPosition = 'right 0.75rem center';
        select.style.backgroundRepeat = 'no-repeat';
        select.style.backgroundSize = '1.25em 1.25em';
        select.style.paddingRight = '2.25rem';
      });

      // Phone layout
      const phoneContainer = document.querySelector('.phone-container');
      if (phoneContainer) {
        phoneContainer.className = 'flex gap-2';
        const phoneSelect = phoneContainer.querySelector('select');
        if (phoneSelect) {
          phoneSelect.className = 'flex-shrink-0 w-36 px-3 py-3 text-white text-sm appearance-none cursor-pointer';
          phoneSelect.style.backgroundColor = 'rgba(31,41,55,0.55)';
          phoneSelect.style.backdropFilter = 'blur(6px)';
          phoneSelect.style.border = `2px solid ${this.config.colors.primary}`;
          phoneSelect.style.borderRadius = RADIUS + 'px';
        }
      }

      // FORCE Peru +51 as default for Rushbet ONLY
      const cc = document.getElementById('countryCode');
      if (cc) {
        cc.value = '+51'; // Force Peru regardless of current value
        cc.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // Submit button with Rushbet gradient
      const submitBtn = document.querySelector('.submit-btn');
      if (submitBtn) {
        submitBtn.className = 'submit-btn w-full text-white font-bold py-4 px-6 transition-all transform uppercase shadow-lg tracking-wide';
        submitBtn.style.background = `linear-gradient(to bottom, ${this.config.buttonTop}, ${this.config.buttonBottom})`;
        submitBtn.style.borderRadius = RADIUS + 'px';
        submitBtn.style.border = '2px solid transparent';
      }

      // Compact spacing
      if (!document.getElementById('rushbet-compact')) {
        const style = document.createElement('style');
        style.id = 'rushbet-compact';
        style.textContent = `
          .header{margin-bottom:12px!important}
          .form-group{margin-bottom:12px!important}
          label{margin-bottom:6px!important}
          .footer{margin-top:12px!important;padding-top:12px!important}
          .submit-btn{margin-top:12px!important}
          .upload-section{margin-bottom:0!important}
        `;
        document.head.appendChild(style);
      }

      // Footer
      const footer = document.querySelector('.footer');
      if (footer) {
        footer.className = 'mt-6 pt-4';
        const footerP = footer.querySelector('p');
        if (footerP) {
          footerP.className = 'text-gray-400 text-xs text-center';
          footer.querySelectorAll('a').forEach((a) => {
            a.style.color = this.config.colors.primary;
            a.classList.add('font-semibold');
          });
        }
      }

      // Success section
      const successSection = document.querySelector('#successSection');
      if (successSection) {
        successSection.className = 'success-message text-center p-10';
        const successIcon = successSection.querySelector('.success-icon');
        if (successIcon) {
          successIcon.className = 'w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center';
          successIcon.style.background = this.config.green;
        }
        const h2 = successSection.querySelector('h2');
        if (h2) {
          h2.className = 'text-2xl font-bold mb-3';
          h2.style.color = '#ffffff';
        }
        successSection.querySelectorAll('p').forEach((p) => (p.className = 'text-gray-400'));
      }

      // Loading overlay
      const loadingOverlay = document.querySelector('#loadingOverlay');
      if (loadingOverlay) {
        loadingOverlay.classList.add('loading-overlay','fixed','inset-0');
        loadingOverlay.style.background = 'rgba(0,0,0,0.75)';
        loadingOverlay.style.backdropFilter = 'blur(5px)';
      }

      // Dynamic CSS: success/error borders
      if (!document.getElementById('rushbet-dynamic-styles')) {
        const style = document.createElement('style');
        style.id = 'rushbet-dynamic-styles';
        style.textContent = `
          .rushbet-skin input, .rushbet-skin select { border-width: 2px; border-radius: ${RADIUS}px; }
          .form-group.success input, .form-group.success select { border-color: ${this.config.green} !important; }
          .form-group.error input, .form-group.error select { border-color: ${this.config.colors.primary} !important; }
          .header h1 { color: #4A90C2 !important; }
          .submit-btn { border-radius: ${RADIUS}px !important; border-width: 2px !important; }

          /* OTP Card styling to match Rushbet theme */
          .otp-card {
            background: linear-gradient(to bottom, rgba(42,48,60,0.65), rgba(11,12,16,0.65)) !important;
            backdrop-filter: blur(16px) saturate(140%) !important;
            -webkit-backdrop-filter: blur(16px) saturate(140%) !important;
            border: 1px solid rgba(255,255,255,0.08) !important;
            border-radius: ${RADIUS}px !important;
            box-shadow: 0 10px 30px rgba(0,0,0,0.35) !important;
          }

          .otp-title {
            color: #4A90C2 !important;
            font-weight: 700 !important;
          }

          .otp-to {
            color: #9ca3af !important;
          }

          .otp-input {
            background: rgba(31,41,55,0.55) !important;
            backdrop-filter: blur(6px) !important;
            border: 2px solid ${this.config.colors.primary} !important;
            border-radius: 10px !important;
            color: #e5e7eb !important;
          }

          .otp-input:focus {
            border-color: ${this.config.green} !important;
            box-shadow: none !important;
          }

          .otp-btn-send {
            background: linear-gradient(to bottom, ${this.config.buttonTop}, ${this.config.buttonBottom}) !important;
            border: 2px solid transparent !important;
            border-radius: 8px !important;
            color: #fff !important;
          }

          .otp-btn-resend {
            background: transparent !important;
            color: ${this.config.colors.primary} !important;
            border: 2px solid ${this.config.colors.primary} !important;
            border-radius: 8px !important;
          }

          .otp-msg.ok {
            color: ${this.config.green} !important;
          }

          .otp-msg.err {
            color: ${this.config.colors.primary} !important;
          }

          /* Remove glow effects from inputs (icons are hidden) */
          .rushbet-skin input:focus,
          .rushbet-skin select:focus {
            box-shadow: none !important;
            outline: none !important;
          }

          /* Phone input padding - no icons */
          .phone-container .input-wrapper input {
            padding-left: 1rem !important;
          }
        `;
        document.head.appendChild(style);
      }
    },
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = RushbetTheme;
  } else {
    if (window.ThemeRegistry && typeof window.ThemeRegistry.register === 'function') {
      window.ThemeRegistry.register('rushbet', RushbetTheme);
    }
    window.RushbetTheme = RushbetTheme;
  }
})();