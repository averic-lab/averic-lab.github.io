/* Averic Lab — shared front-end behaviour
   Used by every locale page. Kept dependency-free. */
(function () {
  // ----- Header scroll state -----
  var header = document.getElementById('siteHeader');
  function syncHeader() {
    if (!header) return;
    if (window.scrollY > 24) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }
  window.addEventListener('scroll', syncHeader, { passive: true });
  syncHeader();

  // ----- Language toggle dropdown -----
  var langToggle = document.getElementById('langToggle');
  var langMenu   = document.getElementById('langMenu');
  function closeLangMenu() {
    if (!langMenu) return;
    langMenu.setAttribute('data-open', 'false');
    langMenu.setAttribute('aria-hidden', 'true');
    if (langToggle) langToggle.setAttribute('aria-expanded', 'false');
  }
  function openLangMenu() {
    if (!langMenu) return;
    langMenu.setAttribute('data-open', 'true');
    langMenu.setAttribute('aria-hidden', 'false');
    if (langToggle) langToggle.setAttribute('aria-expanded', 'true');
  }
  if (langToggle && langMenu) {
    langToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = langMenu.getAttribute('data-open') === 'true';
      if (open) closeLangMenu(); else openLangMenu();
    });
    document.addEventListener('click', function (e) {
      if (langMenu.getAttribute('data-open') !== 'true') return;
      if (langMenu.contains(e.target) || langToggle.contains(e.target)) return;
      closeLangMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeLangMenu();
    });
  }

  // ----- Remember user's language choice -----
  document.querySelectorAll('.lang-option').forEach(function (opt) {
    opt.addEventListener('click', function () {
      var code = opt.getAttribute('data-lang');
      if (!code) return;
      // 루트 index.html 의 라우터와 같은 형식이어야 한다 — 시각이 없으면
      // 만료 판정이 안 돼 그 브라우저에서 영원히 이 언어로 열린다.
      try {
        localStorage.setItem('anbu.lang', JSON.stringify({ code: code, t: Date.now() }));
      } catch (e) {}
    });
  });

  // ----- Stars (hero only) -----
  var sky = document.getElementById('stars');
  if (sky) {
    var STAR_COUNT = window.innerWidth < 600 ? 60 : 110;
    for (var i = 0; i < STAR_COUNT; i++) {
      var s = document.createElement('span');
      s.className = 'star';
      s.style.left = (Math.random() * 100) + '%';
      s.style.top  = (Math.random() * 100) + '%';
      s.style.animationDelay    = (Math.random() * 5) + 's';
      s.style.animationDuration = (3 + Math.random() * 4) + 's';
      var size = 0.4 + Math.random() * 0.9;
      s.style.transform = 'scale(' + size + ')';
      s.style.opacity = (0.25 + Math.random() * 0.65).toString();
      sky.appendChild(s);
    }
  }

  // ----- Fireflies (hero only) -----
  var ff = document.getElementById('fireflies');
  if (ff) {
    var FF_COUNT = window.innerWidth < 600 ? 10 : 18;
    for (var j = 0; j < FF_COUNT; j++) {
      var f = document.createElement('span');
      f.className = 'firefly';
      f.style.left = (Math.random() * 100) + '%';
      f.style.animationDelay    = (Math.random() * 18) + 's';
      f.style.animationDuration = (14 + Math.random() * 12) + 's';
      ff.appendChild(f);
    }
  }

  // ----- Contact form (Web3Forms) -----
  var contactForm = document.getElementById('contactForm');
  var formStatus  = document.getElementById('formStatus');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Honeypot guard (Web3Forms uses 'botcheck' — if filled, drop)
      var honeypot = contactForm.querySelector('input[name="botcheck"]');
      if (honeypot && honeypot.checked) return;

      var submitBtn = contactForm.querySelector('.submit-btn');
      var origText  = submitBtn.textContent;
      submitBtn.disabled    = true;
      submitBtn.textContent = submitBtn.getAttribute('data-sending') || 'Sending...';
      if (formStatus) {
        formStatus.className = 'form-status';
        formStatus.textContent = '';
      }

      var data = new FormData(contactForm);

      fetch(contactForm.action, { method: 'POST', body: data })
        .then(function (res) { return res.json().catch(function () { return { success: false, message: 'Invalid response' }; }); })
        .then(function (out) {
          if (out && out.success) {
            if (formStatus) {
              formStatus.className = 'form-status show success';
              formStatus.textContent = formStatus.getAttribute('data-success') || 'Message sent.';
            }
            contactForm.reset();
          } else {
            if (formStatus) {
              formStatus.className = 'form-status show error';
              var base = formStatus.getAttribute('data-error') || 'Could not send.';
              formStatus.textContent = base + ((out && out.message) ? ' (' + out.message + ')' : '');
            }
          }
        })
        .catch(function (err) {
          if (formStatus) {
            formStatus.className = 'form-status show error';
            var base = formStatus.getAttribute('data-error') || 'Could not send.';
            formStatus.textContent = base + ' (' + err.message + ')';
          }
        })
        .then(function () {
          submitBtn.disabled    = false;
          submitBtn.textContent = origText;
        });
    });
  }

  // ----- Scroll reveal -----
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in-view'); });
  }
})();
