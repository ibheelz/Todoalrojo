// File: /themes/roobet.js
// ROOBET Theme (glassmorphism + 2px edges, radius=20, fixed width 480px, glass edge ring)

(function () {
  const RADIUS = 20; // consistent roundness everywhere

  const RoobetTheme = {
    config: {
      name: 'roobet',
      logo: '/assets/roobet-logo.svg',
      bgImage: '/assets/roobet-bg.png',
      colors: {
        primary: '#a78bfa', // light purple (for inputs default)
        darkGradientTop: '#2a303c', // lighter top
        darkGradientBottom: '#0b0c10', // darker bottom
        inputBg: '#1F2937',
      },
      purple: '#8b5cf6', // roobet purple for button
      purpleDark: '#7c3aed', // darker purple for gradient
      red: '#ff2400', // red for errors
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
      const cfgId = 'roobet-tailwind-config';
      if (!document.getElementById(cfgId)) {
        const cfg = document.createElement('script');
        cfg.id = cfgId;
        cfg.textContent = `
          window.tailwind = window.tailwind || {};
          window.tailwind.config = {
            theme: { extend: { colors: {
              'roobet-light-purple': '${this.config.colors.primary}',
              'roobet-purple': '${this.config.purple}',
              'roobet-purple-dark': '${this.config.purpleDark}',
              'roobet-red': '${this.config.red}',
              'roobet-dark-top': '${this.config.colors.darkGradientTop}',
              'roobet-dark-bottom': '${this.config.colors.darkGradientBottom}',
              'roobet-input': '${this.config.colors.inputBg}'
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

      // Hide decorations & progress bar
      document.querySelectorAll('.bg-decoration').forEach((el) => (el.style.display = 'none'));
      const progressBar = document.querySelector('.progress-bar');
      if (progressBar) progressBar.style.display = 'none';

      // One-off style blocks (glass edge ring + responsive padding)
      if (!document.getElementById('roobet-glass-styles')) {
        const s = document.createElement('style');
        s.id = 'roobet-glass-styles';
        s.textContent = `
          .glass-edge { position:absolute; inset:0; border-radius:${RADIUS}px; pointer-events:none; }
          .glass-edge::before { content:''; position:absolute; inset:0; padding:2px; border-radius:${RADIUS}px;
            background: linear-gradient(135deg, rgba(255,255,255,.35), rgba(255,255,255,.14), rgba(255,255,255,.08), rgba(255,255,255,.18));
            -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
            -webkit-mask-composite: xor; mask-composite: exclude; }
          /* extra inner soft edge */
          .glass-edge::after { content:''; position:absolute; inset:1px; border-radius:${RADIUS-1}px;
            box-shadow: inset 0 1px 0 rgba(255,255,255,.18), inset 0 -1px 0 rgba(0,0,0,.25); }
          /* wider x-padding on larger screens */
          .roobet-skin { padding: 24px; }
          @media (min-width: 640px) { .roobet-skin { padding-left: 32px; padding-right: 32px; } }
          @media (min-width: 768px) { .roobet-skin { padding-left: 40px; padding-right: 40px; } }
        `;
        document.head.appendChild(s);
      }

      // Container → Card (fixed width 480px)
      const container = document.querySelector('.container');
      if (container && !container.dataset.roobetApplied) {
        container.dataset.roobetApplied = 'true';
        container.className = 'relative z-10 w-full mx-auto';
        container.style.maxWidth = '480px';
        container.style.width = '100%';

        const formCard = document.createElement('div');
        formCard.className = 'roobet-skin';
        formCard.style.position = 'relative';
        formCard.style.overflow = 'hidden';
        // liquid glass: frosted, saturated, subtle inner highlight + gradient (top lighter → bottom darker)
        formCard.style.background = 'linear-gradient(to bottom, rgba(42,48,60,0.65), rgba(11,12,16,0.65))';
        formCard.style.backdropFilter = 'blur(16px) saturate(140%)';
        formCard.style.webkitBackdropFilter = 'blur(16px) saturate(140%)';
        // base micro-strokes (no red border)
        formCard.style.border = '1px solid rgba(255,255,255,0.08)';
        formCard.style.borderRadius = RADIUS + 'px';
        formCard.style.boxShadow = '0 10px 30px rgba(0,0,0,0.35)';

        // top gloss highlight
        const gloss = document.createElement('div');
        gloss.style.position = 'absolute'; gloss.style.top = '0'; gloss.style.left = '0'; gloss.style.right = '0'; gloss.style.height = '64px';
        gloss.style.background = 'linear-gradient(to bottom, rgba(255,255,255,0.18), rgba(255,255,255,0))';
        gloss.style.pointerEvents = 'none';
        gloss.style.borderTopLeftRadius = gloss.style.borderTopRightRadius = (RADIUS - 1) + 'px';
        formCard.appendChild(gloss);

        // gradient ring edge (2px) – glass edge effect
        const edge = document.createElement('div');
        edge.className = 'glass-edge';
        formCard.appendChild(edge);

        while (container.firstChild) formCard.appendChild(container.firstChild);
        container.appendChild(formCard);
      }

      // Logo larger
      const logoContainer = document.querySelector('.logo');
      if (logoContainer) {
        logoContainer.className = 'w-48 h-16 mx-auto mb-6';
        logoContainer.innerHTML = `<img src="${this.config.logo}" alt="ROOBET" class="w-full h-full object-contain" />`;
      }

      // Header
      const h1 = document.querySelector('.header h1');
      if (h1) { h1.className = 'text-2xl font-bold mb-2 tracking-tight'; h1.style.color = '#ffffff'; }
      const headerP = document.querySelector('.header p');
      if (headerP) headerP.className = 'text-gray-400 text-sm mb-4';

      // Labels & asterisks
      document.querySelectorAll('label').forEach((label) => { label.className = 'block text-white font-semibold mb-2 text-sm'; });
      document.querySelectorAll('.required').forEach((req) => { req.style.color = this.config.red; req.classList.add('ml-1'); });

      // Inputs (2px edges)
      document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]').forEach((input) => {
        input.className = 'w-full px-4 py-3 text-white placeholder-gray-400 transition-all';
        input.style.backgroundColor = 'rgba(31,41,55,0.55)';
        input.style.backdropFilter = 'blur(6px)';
        input.style.border = `2px solid ${this.config.colors.primary}`; // light purple default
        input.style.borderRadius = RADIUS + 'px';
      });

      // Selects (2px edges)
      document.querySelectorAll('select').forEach((select) => {
        select.className = 'w-full px-4 py-3 text-white transition-all appearance-none cursor-pointer';
        select.style.backgroundColor = 'rgba(31,41,55,0.55)';
        select.style.backdropFilter = 'blur(6px)';
        select.style.border = `2px solid ${this.config.colors.primary}`; // light purple default
        select.style.borderRadius = RADIUS + 'px';
        select.style.backgroundImage = "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")";
        select.style.backgroundPosition = 'right 0.75rem center';
        select.style.backgroundRepeat = 'no-repeat';
        select.style.backgroundSize = '1.25em 1.25em';
        select.style.paddingRight = '2.25rem';
      });

      // Hide input icons & adjust padding
      document.querySelectorAll('.input-icon').forEach((icon) => (icon.style.display = 'none'));
      document.querySelectorAll('input').forEach((input) => { if (input.style.paddingLeft) input.style.paddingLeft = '1rem'; });

      // Phone layout
      const phoneContainer = document.querySelector('.phone-container');
      if (phoneContainer) {
        phoneContainer.className = 'flex gap-2';
        const phoneSelect = phoneContainer.querySelector('select');
        const phoneInputWrapper = phoneContainer.querySelector('.input-wrapper');
        if (phoneSelect) {
          phoneSelect.className = 'flex-shrink-0 w-36 px-3 py-3 text-white text-sm appearance-none cursor-pointer';
          phoneSelect.style.backgroundColor = 'rgba(31,41,55,0.55)';
          phoneSelect.style.backdropFilter = 'blur(6px)';
          phoneSelect.style.border = `2px solid ${this.config.colors.primary}`; // light purple
          phoneSelect.style.borderRadius = RADIUS + 'px';
        }
        if (phoneInputWrapper) phoneInputWrapper.className = 'flex-1';
      }

      // Default phone country: Chile +56 (for Roobet)
      const cc = document.getElementById('countryCode');
      if (cc && !cc.value) {
        cc.value = '+56';
        cc.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // Submit button (gradient, consistent 2px border)
      const submitBtn = document.querySelector('.submit-btn');
      if (submitBtn) {
        submitBtn.className = 'submit-btn w-full text-white font-bold py-4 px-6 transition-all transform uppercase shadow-lg tracking-wide';
        submitBtn.style.background = `linear-gradient(to bottom, ${this.config.purple}, ${this.config.purpleDark})`;
        submitBtn.style.borderRadius = RADIUS + 'px';
        submitBtn.style.border = '2px solid transparent'; // preserve thickness w/o visible stroke
      }

      // Compact spacing
      if (!document.getElementById('roobet-compact')) {
        const style = document.createElement('style');
        style.id = 'roobet-compact';
        style.textContent = `
          .header{margin-bottom:12px!important}
          .form-group{margin-bottom:12px!important}
          label{margin-bottom:6px!important}
          .footer{margin-top:12px!important;padding-top:12px!important}
          .submit-btn{margin-top:12px!important}
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
          const links = footer.querySelectorAll('a');
          if (links.length >= 2) {
            const span = document.createElement('span');
            span.style.whiteSpace = 'nowrap';
            const a1 = links[0];
            const a2 = links[1];
            const sep = document.createTextNode(' y ');
            a1.replaceWith(span);
            span.appendChild(a1); span.appendChild(sep); span.appendChild(a2);
          }
          footer.querySelectorAll('a').forEach((a) => { a.style.color = this.config.purple; a.classList.add('font-semibold'); });
        }
      }

      // Success section
      const successSection = document.querySelector('#successSection');
      if (successSection) {
        successSection.className = 'success-message text-center p-10';
        const successIcon = successSection.querySelector('.success-icon');
        if (successIcon) {
          successIcon.className = 'w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center';
          successIcon.style.background = this.config.purple;
        }
        const h2 = successSection.querySelector('h2');
        if (h2) { h2.className = 'text-2xl font-bold mb-3'; h2.style.color = '#ffffff'; }
        successSection.querySelectorAll('p').forEach((p) => (p.className = 'text-gray-400'));
      }

      // Loading overlay
      const loadingOverlay = document.querySelector('#loadingOverlay');
      if (loadingOverlay) {
        loadingOverlay.classList.add('loading-overlay','fixed','inset-0');
        loadingOverlay.style.background = 'rgba(0,0,0,0.75)';
        loadingOverlay.style.backdropFilter = 'blur(5px)';
      }

      // Dynamic CSS: success/error borders & header color + OTP styling
      if (!document.getElementById('roobet-dynamic-styles')) {
        const style = document.createElement('style');
        style.id = 'roobet-dynamic-styles';
        style.textContent = `
          .roobet-skin input, .roobet-skin select { border-width: 2px; border-radius: ${RADIUS}px; }
          .form-group.success input, .form-group.success select { border-color: ${this.config.purple} !important; }
          .form-group.error input, .form-group.error select { border-color: ${this.config.red} !important; }
          .header h1 { color: #fff !important; }
          .submit-btn { border-radius: ${RADIUS}px !important; border-width: 2px !important; }

          /* OTP UI - Roobet Theme */
          .otp-card {
            background: rgba(42,48,60,0.4) !important;
            border: 1px solid ${this.config.colors.primary} !important;
            backdrop-filter: blur(12px) !important;
          }

          .otp-input {
            background: rgba(0,0,0,.35) !important;
            border: 2px solid ${this.config.colors.primary} !important;
          }

          .otp-input:focus {
            border-color: ${this.config.purple} !important;
            box-shadow: 0 0 0 2px rgba(139,92,246,.25) !important;
          }

          .otp-btn-send {
            background: linear-gradient(to bottom, ${this.config.purple}, ${this.config.purpleDark}) !important;
            color: #fff !important;
            border: none !important;
          }

          .otp-btn-resend {
            background: transparent !important;
            color: ${this.config.purple} !important;
            border: 1px solid ${this.config.purple} !important;
          }

          .otp-msg.ok {
            color: ${this.config.purple} !important;
          }

          .otp-msg.err {
            color: ${this.config.red} !important;
          }
        `;
        document.head.appendChild(style);
      }
    },
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = RoobetTheme;
  } else {
    window.RoobetTheme = RoobetTheme;
  }
})();
