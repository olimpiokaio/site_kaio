// Site scripts extracted from index.html
// Menu toggle and header behavior
(function() {
  const header = document.querySelector('.main-header');
  const btn = document.querySelector('.hamburger');
  const nav = document.getElementById('primary-navigation');
  if (!btn || !header || !nav) return;

  function closeMenu() {
    header.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  function toggleMenu() {
    const open = header.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', String(open));
    // prevent body scroll when open
    document.body.style.overflow = open ? 'hidden' : '';
  }

  btn.addEventListener('click', toggleMenu);
  nav.addEventListener('click', function(e) {
    if (e.target.closest('a')) closeMenu();
  });
  window.addEventListener('resize', function(){ if (window.innerWidth > 768) closeMenu(); });
})();

// Animate On Scroll (AOS) initialization
// Keep this on window load to ensure the external AOS script has been loaded
window.addEventListener('load', function() {
  if (typeof AOS !== 'undefined' && AOS && typeof AOS.init === 'function') {
    AOS.init({
      once: true, // animate only once per element
      offset: 80,
      duration: 700,
      easing: 'ease-out-quad'
    });

    // Refresh after image loads in case of late sizing
    var heroImg = document.querySelector('.content-image img');
    if (heroImg && !heroImg.complete) {
      heroImg.addEventListener('load', function(){
        if (typeof AOS !== 'undefined' && AOS && typeof AOS.refresh === 'function') {
          AOS.refresh();
        }
      }, { once: true });
    }
  }

  // Projects Modal & Carousel
  (function(){
    const openBtn = document.querySelector('.button-projects');
    const modal = document.getElementById('projectsModal');
    if (!openBtn || !modal) return;
    const backdrop = modal.querySelector('.projects-modal__backdrop');
    const closeBtns = modal.querySelectorAll('[data-close="modal"]');
    const track = modal.querySelector('.carousel__track');
    const viewport = modal.querySelector('.carousel__viewport');
    const prev = modal.querySelector('.carousel__nav--prev');
    const next = modal.querySelector('.carousel__nav--next');

    let index = 0;

    function setAriaHidden(val){ modal.setAttribute('aria-hidden', String(val)); }
    function lockScroll(lock){ document.body.style.overflow = lock ? 'hidden' : ''; }

    function openModal(){ index = 0; setAriaHidden(false); lockScroll(true); focusClose(); requestAnimationFrame(update); }
    function closeModal(){ setAriaHidden(true); lockScroll(false); }
    function focusClose(){ const btn = modal.querySelector('.projects-modal__close'); if(btn) btn.focus({preventScroll:true}); }

    function slideWidth(){
      const first = track.children[0];
      if (!first) return viewport.clientWidth;
      const gap = parseFloat(window.getComputedStyle(track).gap || '0');
      return first.offsetWidth + gap;
    }

    function centerTransform(){
      const slides = Array.from(track.children);
      if (slides.length === 0) return 0;
      const gap = parseFloat(window.getComputedStyle(track).gap || '0');
      // distance from track start to left edge of active slide
      const firstLeft = 0; // since we position from start
      const activeLeft = slides.slice(0, index).reduce((acc, el) => acc + el.offsetWidth + gap, firstLeft);
      const activeWidth = slides[index].offsetWidth;
      const viewportCenter = viewport.clientWidth / 2;
      const activeCenter = activeLeft + activeWidth / 2;
      // We want activeCenter to align to viewportCenter -> translateX = viewportCenter - activeCenter
      return viewportCenter - activeCenter;
    }

    function clampTransform(tx){
      // compute min/max so that first and last slide can still be centered but not beyond track edges too far
      const slides = Array.from(track.children);
      const gap = parseFloat(window.getComputedStyle(track).gap || '0');
      const totalWidth = slides.reduce((acc, el, i) => acc + el.offsetWidth + (i>0?gap:0), 0);
      const viewW = viewport.clientWidth;
      // We want to limit translateX so that the track doesn't expose excessive empty space.
      // Leftmost limit when the start of track aligns close to center of first slide
      const firstWidth = slides[0] ? slides[0].offsetWidth : 0;
      const minTx = viewW/2 - (totalWidth - firstWidth/2); // when last slide center aligns, don't go further left
      const maxTx = viewW/2 - firstWidth/2; // when first slide center aligns, don't go further right
      if (isNaN(minTx) || isNaN(maxTx)) return tx;
      return Math.max(minTx, Math.min(tx, maxTx));
    }

    function update(){
      const tx = clampTransform(centerTransform());
      track.style.transform = `translateX(${tx}px)`;
    }

    function nextSlide(){ index = Math.min(index + 1, track.children.length - 1); update(); }
    function prevSlide(){ index = Math.max(index - 1, 0); update(); }

    openBtn.addEventListener('click', openModal);
    closeBtns.forEach(b=> b.addEventListener('click', closeModal));
    backdrop.addEventListener('click', closeModal);
    prev.addEventListener('click', prevSlide);
    next.addEventListener('click', nextSlide);
    window.addEventListener('resize', update);

    // Basic touch swipe for mobile
    let touchStartX = 0, touchStartY = 0, touchStartTime = 0, isSwiping = false;
    const SWIPE_THRESHOLD = 50; // px
    const SWIPE_TIME_MAX = 700; // ms

    function onTouchStart(e){
      const t = e.touches[0];
      touchStartX = t.clientX; touchStartY = t.clientY; touchStartTime = Date.now(); isSwiping = true;
    }
    function onTouchMove(e){
      if (!isSwiping) return;
      const t = e.touches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      // if vertical move dominates, cancel swipe to allow scrolling
      if (Math.abs(dy) > Math.abs(dx)) { isSwiping = false; return; }
      // prevent horizontal scroll while swiping carousel
      e.preventDefault();
    }
    function onTouchEnd(e){
      if (!isSwiping) return;
      isSwiping = false;
      const dt = Date.now() - touchStartTime;
      const changed = e.changedTouches && e.changedTouches[0];
      const dx = (changed ? changed.clientX : 0) - touchStartX;
      if (dt <= SWIPE_TIME_MAX && Math.abs(dx) > SWIPE_THRESHOLD){
        if (dx < 0) nextSlide(); else prevSlide();
      }
    }

    viewport.addEventListener('touchstart', onTouchStart, { passive: true });
    viewport.addEventListener('touchmove', onTouchMove, { passive: false });
    viewport.addEventListener('touchend', onTouchEnd);

    document.addEventListener('keydown', function(e){
      if (modal.getAttribute('aria-hidden') === 'false') {
        if (e.key === 'Escape') closeModal();
        if (e.key === 'ArrowRight') nextSlide();
        if (e.key === 'ArrowLeft') prevSlide();
      }
    });
  })();

  // Jobs Modal (Resume)
  (function(){
    const openLink = document.getElementById('jobsLink');
    const modal = document.getElementById('jobsModal');
    if (!openLink || !modal) return;
    const backdrop = modal.querySelector('.projects-modal__backdrop');
    const closeBtns = modal.querySelectorAll('[data-close="modal"]');

    function setAriaHidden(val){ modal.setAttribute('aria-hidden', String(val)); }
    function lockScroll(lock){ document.body.style.overflow = lock ? 'hidden' : ''; }

    function openModal(e){ if (e) e.preventDefault(); setAriaHidden(false); lockScroll(true); const btn = modal.querySelector('.projects-modal__close'); if(btn) btn.focus({preventScroll:true}); }
    function closeModal(){ setAriaHidden(true); lockScroll(false); }

    openLink.addEventListener('click', openModal);
    closeBtns.forEach(b=> b.addEventListener('click', closeModal));
    backdrop.addEventListener('click', closeModal);

    document.addEventListener('keydown', function(e){
      if (modal.getAttribute('aria-hidden') === 'false') {
        if (e.key === 'Escape') closeModal();
      }
    });
  })();

  // i18n toggle and translations
  (function(){
    const toggleBtns = Array.from(document.querySelectorAll('.lang-toggle'));
    const htmlEl = document.documentElement;
    const resumeEl = document.getElementById('resumeContent');

    if (!toggleBtns.length) return;

    const i18n = {
      en: {
        'nav.jobs': 'Jobs In',
        'hero.hi': 'Hi! I Am ',
        'hero.desc': 'Developing software for over <span class="kanit-bold"> 5 years</span><br/> in large projects',
        'hero.hire': 'Hire Me',
        'hero.projects': 'My Projects <i class="las la-level-up-alt"></i>',
        'hero.clientsText': 'Big clients on work',
        'hero.years': 'Years of development',
        'hero.contact': 'Contact',
        'paper.title': '<span class="kanit-extrabold">Create</span> your idea <span class="kanit-extrabold">with</span> me,<br/> I <span class="kanit-extrabold">Love</span> doing it',
        'footer.by': 'Developed by Olimpio Kaio',
        'footer.copyright': '© 2025 Olimpio, Inc. All rights reserved',
        'projects.title': 'My Projects',
        'projects.card1.desc': 'Play streetball and connect with people who live <strong>street basketball</strong>.',
        'projects.card1.button': 'View project',
        'carousel.prev': 'Previous',
        'carousel.next': 'Next',
        'modal.close': 'Close',
        'jobs.title': 'Jobs In'
      },
      pt: {
        'nav.jobs': 'Jobs In',
        'hero.hi': 'Olá! Eu sou ',
        'hero.desc': 'Desenvolvendo software há mais de <span class="kanit-bold"> 5 anos</span><br/> em grandes projetos',
        'hero.hire': 'Me Contrate',
        'hero.projects': 'Meus Projetos <i class="las la-level-up-alt"></i>',
        'hero.clientsText': 'Grandes clientes atendidos',
        'hero.years': 'Anos de desenvolvimento',
        'hero.contact': 'Contato',
        'paper.title': '<span class="kanit-extrabold">Crie</span> sua ideia <span class="kanit-extrabold">com</span>igo,<br/> Eu <span class="kanit-extrabold">Amo</span> fazer isso',
        'footer.by': 'Desenvolvido por Olimpio Kaio',
        'footer.copyright': '© 2025 Olimpio, Inc. Todos os direitos reservados',
        'projects.title': 'Meus Projetos',
        'projects.card1.desc': 'Jogue streetball e conecte-se com quem vive o <strong>basquete</strong> de rua.',
        'projects.card1.button': 'Ver projeto',
        'carousel.prev': 'Anterior',
        'carousel.next': 'Próximo',
        'modal.close': 'Fechar',
        'jobs.title': 'Jobs In'
      }
    };

    const resumeTemplates = {
      en: function(){ return `
          <section class="kanit-medium" style="margin-bottom:16px;">
            <h3 class="kanit-semibold" style="margin:0 0 6px 0; font-size:1.2rem;">Olimpio Kaio Rodrigues Silva</h3>
            <p style="opacity:.9; margin:0 0 10px 0;">Java Developer</p>
            <p style="opacity:.9; line-height:1.6;">Developer with 5+ years of experience in large-scale projects, focused on backend with Java (8/11), Spring and integrations, plus experience with front-end (Angular/React), CI/CD pipelines and relational databases.</p>
          </section>

          <section style="margin-bottom:16px;">
            <h4 class="kanit-semibold" style="margin:0 0 8px 0;">Education</h4>
            <ul style="margin:0 0 0 18px; line-height:1.6;">
              <li>2017 - 2019 Completed: Systems Analysis and Development | Brasília | DF — IESB University</li>
            </ul>
          </section>

          <section class="resume-section resume-accordion" style="margin-bottom:16px;">
            <h4 class="kanit-semibold" style="margin:0 0 8px 0;">Professional Experience</h4>

            <details open>
              <summary>
                <span class="resume-role">Engesoftware S.A (Caixa Bank) — Java Developer</span>
                <span class="resume-period">May/2025</span>
              </summary>
              <ul class="resume-list">
                <li>Development with Java 8 and Angular</li>
                <li>EJB</li>
                <li>Unit/integration tests with JUnit</li>
                <li>Azure DevOps, Sonar</li>
                <li>Oracle DB</li>
              </ul>
            </details>

            <details>
              <summary>
                <span class="resume-role">ACT digital (Sicoob) — Java Developer</span>
                <span class="resume-period">Aug/2021 - Jan/2025</span>
              </summary>
              <ul class="resume-list">
                <li>Development with Java 11</li>
                <li>JasperReports</li>
                <li>Jira, Git, Jenkins, Nexus, Sonar</li>
                <li>Spring Boot, Spring Batch, Spring Data, Spring Cloud</li>
                <li>Unit/integration tests with JUnit</li>
                <li>Oracle DB</li>
              </ul>
            </details>

            <details>
              <summary>
                <span class="resume-role">Engesoftware S.A (Banco do Brasil) — Java Developer</span>
                <span class="resume-period">Aug/2020 - Aug/2021</span>
              </summary>
              <ul class="resume-list">
                <li>Development with Java 11 and React</li>
                <li>Spring Boot, Spring Data, Spring Security</li>
                <li>Unit/integration tests with JUnit</li>
                <li>AWS</li>
              </ul>
            </details>

            <details>
              <summary>
                <span class="resume-role">Bay Area Software Factory — Analyst and Java Developer</span>
                <span class="resume-period">Aug/2017 - Jun/2019</span>
              </summary>
              <ul class="resume-list">
                <li>Systems development in Java</li>
                <li>React Native</li>
                <li>PostgreSQL</li>
              </ul>
            </details>
          </section>

          <section class="resume-section">
            <h4 class="kanit-semibold" style="margin:0 0 8px 0;">Skills</h4>
            <ul class="resume-skills">
              <li class="chip">Spring Boot</li>
              <li class="chip">Spring Data</li>
              <li class="chip">Spring Security</li>
              <li class="chip">Spring Batch</li>
              <li class="chip">Spring WebFlux</li>
              <li class="chip">R2DBC</li>
              <li class="chip">HTML</li>
              <li class="chip">CSS</li>
              <li class="chip">JavaScript</li>
              <li class="chip">TypeScript</li>
              <li class="chip">Angular 2+</li>
              <li class="chip">Angular 17+</li>
              <li class="chip">Design Patterns</li>
              <li class="chip">Jira</li>
              <li class="chip">Git</li>
              <li class="chip">Jenkins</li>
              <li class="chip">Nexus</li>
              <li class="chip">Docker</li>
              <li class="chip">Kafka</li>
              <li class="chip">JUnit (Tests)</li>
              <li class="chip">Oracle DB</li>
              <li class="chip">PostgreSQL</li>
              <li class="chip">MySQL</li>
              <li class="chip">FlywayDB</li>
            </ul>
          </section>
      `; },
      pt: function(){ return document.getElementById('resumeContent') ? document.getElementById('resumeContent').innerHTML : '' }
    };

    function applyTranslations(lang){
      const dict = i18n[lang] || i18n.en;
      htmlEl.setAttribute('lang', lang);

      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key] != null) el.textContent = dict[key].replace(/<[^>]*>?/gm, '');
      });
      document.querySelectorAll('[data-i18n-html]').forEach(el => {
        const key = el.getAttribute('data-i18n-html');
        if (dict[key] != null) el.innerHTML = dict[key];
      });
      document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
        const key = el.getAttribute('data-i18n-aria-label');
        if (dict[key] != null) el.setAttribute('aria-label', dict[key]);
      });
      document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (dict[key] != null) el.setAttribute('title', dict[key]);
      });

      // Carousel next btn may exist
      const nextBtn = document.querySelector('.carousel__nav--next');
      if (nextBtn && dict['carousel.next']) nextBtn.setAttribute('aria-label', dict['carousel.next']);

      // Resume content: if EN, build template; if PT, restore original (already in HTML)
      if (resumeEl){
        if (lang === 'en') {
          resumeEl.innerHTML = resumeTemplates.en();
        } else {
          // We re-render the Portuguese template by recreating from a cached original if not cached yet
          if (!resumeEl._originalPT) {
            resumeEl._originalPT = resumeEl.innerHTML; // cache current PT content
          }
          resumeEl.innerHTML = resumeEl._originalPT;
        }
      }

      // Button label: update all toggle buttons
      toggleBtns.forEach(btn => {
        btn.textContent = lang === 'en' ? 'PT' : 'EN';
        btn.setAttribute('aria-label', lang === 'en' ? 'Mudar idioma' : 'Toggle language');
        btn.setAttribute('title', btn.getAttribute('aria-label'));
      });

      try { localStorage.setItem('lang', lang); } catch(e) {}
    }

    function getInitialLang(){
      try {
        const saved = localStorage.getItem('lang');
        if (saved) return saved;
      } catch(e) {}
      const nav = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
      return nav.startsWith('pt') ? 'pt' : 'en';
    }

    function currentLang(){ return htmlEl.getAttribute('lang') || getInitialLang(); }

    // Attach click on all toggle buttons
    toggleBtns.forEach(btn => btn.addEventListener('click', function(){
      const lang = currentLang() === 'en' ? 'pt' : 'en';
      applyTranslations(lang);
    }));

    // Initialize on load
    applyTranslations(getInitialLang());
  })();
});
