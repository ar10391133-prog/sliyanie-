
/* ==========================================================================
   СЛИЯНИЕ — main.js
   Навигация, hero-слайдер, параллакс, reveal-анимации, горизонтальный скролл,
   галерея-лайтбокс (клавиатура / свайп), демо-форма бронирования
   ========================================================================== */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Navbar: состояние при скролле ---------- */
  var nav = document.querySelector('.nav');
  function onNavScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 40 && !nav.classList.contains('menu-open'));
  }
  window.addEventListener('scroll', onNavScroll, { passive: true });
  onNavScroll();

  /* ---------- 2. Мобильное меню ---------- */
  var burger = document.querySelector('.burger');
  var mmenu = document.querySelector('.mmenu');
  function toggleMenu(force) {
    var open = typeof force === 'boolean' ? force : !mmenu.classList.contains('open');
    mmenu.classList.toggle('open', open);
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    nav.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    onNavScroll();
  }
  burger.addEventListener('click', function () { toggleMenu(); });
  mmenu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { toggleMenu(false); });
  });
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mmenu.classList.contains('open')) toggleMenu(false);
  });

  /* ---------- 3. Hero: слайдер + параллакс + затухание контента ---------- */
  var slides = Array.prototype.slice.call(document.querySelectorAll('.hero__slide'));
  var heroMedia = document.querySelector('.hero__media');
  var heroContent = document.querySelector('.hero__content');
  var current = 0;

  function goTo(n) {
    slides[current].classList.remove('active');
    current = (n + slides.length) % slides.length;
    var s = slides[current];
    s.classList.remove('active');
    void s.offsetWidth; /* перезапуск анимации Ken Burns */
    s.classList.add('active');
  }
  if (slides.length > 1 && !prefersReduced) {
    setInterval(function () { goTo(current + 1); }, 7000);
  }

  var ticking = false;
  function heroParallax() {
    var y = window.scrollY;
    if (y < window.innerHeight * 1.2) {
      heroMedia.style.transform = 'translate3d(0,' + y * 0.32 + 'px,0)';
      heroContent.style.transform = 'translate3d(0,' + y * 0.18 + 'px,0)';
      heroContent.style.opacity = Math.max(0, 1 - y / (window.innerHeight * 0.72));
    }
    ticking = false;
  }
  if (!prefersReduced) {
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(heroParallax); ticking = true; }
    }, { passive: true });
  }

  /* ---------- 4. Reveal-анимации ---------- */
  var revealEls = document.querySelectorAll('.reveal, .clip-reveal');
  if ('IntersectionObserver' in window && !prefersReduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- 5. Параллакс фона блока «Туда, где нет шума» ---------- */
  var silenceBg = document.querySelector('.silence__bg');
  var silence = document.querySelector('.silence');
  if (silenceBg && !prefersReduced) {
    window.addEventListener('scroll', function () {
      var r = silence.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) {
        var p = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight; /* -0.5..0.5 */
        silenceBg.style.transform = 'translate3d(0,' + (p * 12) + '%,0)';
      }
    }, { passive: true });
  }

  /* ---------- 6. Впечатления: drag-to-scroll, стрелки, прогресс ---------- */
  var track = document.querySelector('.exp__track');
  if (track) {
    var prevBtn = document.querySelector('[data-exp-prev]');
    var nextBtn = document.querySelector('[data-exp-next]');
    var progress = document.querySelector('.exp__progress i');

    function cardStep() {
      var card = track.querySelector('.exp-card');
      return card ? card.getBoundingClientRect().width + 24 : 360;
    }
    function updateExpUI() {
      var max = track.scrollWidth - track.clientWidth;
      prevBtn.disabled = track.scrollLeft <= 4;
      nextBtn.disabled = track.scrollLeft >= max - 4;
      var ratio = max > 0 ? track.scrollLeft / max : 0;
      progress.style.width = (20 + ratio * 80) + '%';
    }
    prevBtn.addEventListener('click', function () { track.scrollBy({ left: -cardStep(), behavior: 'smooth' }); });
    nextBtn.addEventListener('click', function () { track.scrollBy({ left: cardStep(), behavior: 'smooth' }); });
    track.addEventListener('scroll', updateExpUI, { passive: true });
    window.addEventListener('resize', updateExpUI);
    updateExpUI();

    /* drag-to-scroll (мышь / тач) */
    var isDown = false, startX = 0, startScroll = 0, moved = false;
    track.addEventListener('pointerdown', function (e) {
      isDown = true; moved = false;
      startX = e.clientX;
      startScroll = track.scrollLeft;
      track.classList.add('dragging');
    });
    window.addEventListener('pointermove', function (e) {
      if (!isDown) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      track.scrollLeft = startScroll - dx;
    });
    window.addEventListener('pointerup', function () {
      isDown = false;
      track.classList.remove('dragging');
    });
    /* клик по карточке после драга не должен срабатывать */
    track.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function (e) { if (moved) e.preventDefault(); });
    });
  }

  /* ---------- 7. Галерея + лайтбокс ---------- */
  var galleryItems = Array.prototype.slice.call(document.querySelectorAll('.gallery__item'));
  var lb = document.querySelector('.lightbox');
  if (galleryItems.length && lb) {
    var lbImg = lb.querySelector('.lightbox__stage img');
    var lbCounter = lb.querySelector('.lightbox__counter');
    var lbCaption = lb.querySelector('.lightbox__caption');
    var lbIndex = 0;

    function preload(src) { var i = new Image(); i.src = src; }

    function showLb(n) {
      lbIndex = (n + galleryItems.length) % galleryItems.length;
      var item = galleryItems[lbIndex];
      var img = item.querySelector('img');
      lbImg.classList.remove('loaded');
      lbImg.src = img.dataset.full || img.src;
      lbImg.alt = img.alt;
      if (lbImg.complete) lbImg.classList.add('loaded');
      lbCounter.textContent = (lbIndex + 1) + ' / ' + galleryItems.length;
      lbCaption.textContent = item.querySelector('figcaption')
        ? item.querySelector('figcaption').textContent : '';
      /* предзагрузка соседних */
      preload(galleryItems[(lbIndex + 1) % galleryItems.length].querySelector('img').dataset.full);
      preload(galleryItems[(lbIndex - 1 + galleryItems.length) % galleryItems.length].querySelector('img').dataset.full);
    }
    lbImg.addEventListener('load', function () { lbImg.classList.add('loaded'); });

    function openLb(n) {
      showLb(n);
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeLb() {
      lb.classList.remove('open');
      document.body.style.overflow = '';
    }

    galleryItems.forEach(function (item, i) {
      item.addEventListener('click', function () { openLb(i); });
      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(i); }
      });
    });

    lb.querySelector('.lightbox__close').addEventListener('click', closeLb);
    lb.querySelector('.lightbox__btn--prev').addEventListener('click', function () { showLb(lbIndex - 1); });
    lb.querySelector('.lightbox__btn--next').addEventListener('click', function () { showLb(lbIndex + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });

    window.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowLeft') showLb(lbIndex - 1);
      if (e.key === 'ArrowRight') showLb(lbIndex + 1);
    });

    /* свайп на мобильном */
    var touchX = 0;
    lbImg.addEventListener('touchstart', function (e) {
      touchX = e.changedTouches[0].clientX;
    }, { passive: true });
    lbImg.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 48) showLb(lbIndex + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  /* ---------- 8. Демо-форма бронирования ---------- */
  var form = document.getElementById('booking-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      form.style.display = 'none';
      document.getElementById('booking-success').classList.add('show');
    });
    /* минимальные даты — сегодня */
    var today = new Date().toISOString().split('T')[0];
    var dIn = form.querySelector('#b-date-in');
    var dOut = form.querySelector('#b-date-out');
    dIn.min = today;
    dOut.min = today;
    dIn.addEventListener('change', function () { dOut.min = dIn.value || today; });
  }

  /* ---------- 9. Текущий год в футере ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
