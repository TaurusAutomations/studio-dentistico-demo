/* ============================================================
   STUDIO DEL SORRISO — interazioni & motion
   Vanilla + GSAP/ScrollTrigger + Lenis (progressive enhancement)
   ============================================================ */
(function () {
  "use strict";

  const html = document.documentElement;
  html.classList.add("js");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";
  const hasLenis = typeof window.Lenis !== "undefined";

  /* -------- Preloader -------- */
  const preloader = document.querySelector("[data-preloader]");
  window.addEventListener("load", () => {
    setTimeout(() => preloader && preloader.classList.add("is-done"), reduceMotion ? 0 : 900);
  });
  // Sicurezza: nascondi comunque dopo 2.2s
  setTimeout(() => preloader && preloader.classList.add("is-done"), 2200);

  /* -------- Anno footer -------- */
  const yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* -------- Smooth scroll (Lenis) -------- */
  let lenis = null;
  if (hasLenis && !reduceMotion) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.6 });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    if (hasGSAP && window.ScrollTrigger) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  /* -------- Anchor smooth scroll (con o senza Lenis) -------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id === "#" || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      if (lenis) lenis.scrollTo(target, { offset: -10, duration: 1.2 });
      else target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    });
  });

  /* ============================================================
     NAV: scrolled state + hide on scroll down
     ============================================================ */
  const nav = document.querySelector("[data-nav]");
  let lastY = 0;
  function onScroll() {
    const y = window.scrollY;
    if (nav) {
      nav.classList.toggle("is-scrolled", y > 40);
      if (!document.body.classList.contains("menu-open")) {
        nav.classList.toggle("is-hidden", y > lastY && y > 400);
      }
    }
    lastY = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ============================================================
     FOCUS TRAP (accessibilità modali)
     ============================================================ */
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  let lastFocused = null;
  let releaseTrap = null;
  function trapFocus(container) {
    function handler(e) {
      if (e.key !== "Tab") return;
      const nodes = Array.prototype.slice.call(container.querySelectorAll(FOCUSABLE))
        .filter((n) => n.offsetWidth > 0 || n.offsetHeight > 0 || n === document.activeElement);
      if (!nodes.length) return;
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    container.addEventListener("keydown", handler);
    return function () { container.removeEventListener("keydown", handler); };
  }

  /* ============================================================
     MENU MOBILE
     ============================================================ */
  const burger = document.querySelector("[data-burger]");
  const menu = document.querySelector("[data-menu]");
  function openMenu() {
    lastFocused = document.activeElement;
    document.body.classList.add("menu-open");
    burger && burger.setAttribute("aria-expanded", "true");
    menu && menu.setAttribute("aria-hidden", "false");
    if (lenis) lenis.stop();
    if (menu) {
      releaseTrap = trapFocus(menu);
      const firstLink = menu.querySelector("a");
      if (firstLink) firstLink.focus();
    }
  }
  function closeMenu() {
    if (!document.body.classList.contains("menu-open")) return;
    document.body.classList.remove("menu-open");
    burger && burger.setAttribute("aria-expanded", "false");
    menu && menu.setAttribute("aria-hidden", "true");
    if (lenis) lenis.start();
    if (releaseTrap) { releaseTrap(); releaseTrap = null; }
    if (burger) burger.focus();
  }
  burger && burger.addEventListener("click", () => {
    document.body.classList.contains("menu-open") ? closeMenu() : openMenu();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

  /* ============================================================
     REVEAL — IntersectionObserver (robusto, no dipendenze)
     ============================================================ */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.transitionDelay = (entry.target.dataset.delay || "0") + "ms";
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-in"));
  }

  /* -------- Hero title: reveal a righe -------- */
  const heroLines = document.querySelectorAll(".hero__title .line");
  heroLines.forEach((line, i) => {
    line.style.opacity = "0";
    line.style.transform = "translateY(105%)";
    if (reduceMotion) { line.style.opacity = "1"; line.style.transform = "none"; return; }
    setTimeout(() => {
      line.style.transition = "transform 1s cubic-bezier(0.16,1,0.3,1), opacity 1s cubic-bezier(0.16,1,0.3,1)";
      line.style.opacity = "1";
      line.style.transform = "none";
    }, 1000 + i * 130);
  });

  /* ============================================================
     COUNTERS
     ============================================================ */
  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const dur = 1600;
    const start = performance.now();
    const fmt = (n) => {
      if (target >= 1000) return Math.floor(n).toLocaleString("it-IT");
      return Math.floor(n).toString();
    };
    function step(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = fmt(target) + suffix;
    }
    requestAnimationFrame(step);
  }
  const counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (reduceMotion) {
            const t = parseFloat(entry.target.dataset.count);
            entry.target.textContent = (t >= 1000 ? t.toLocaleString("it-IT") : t) + (entry.target.dataset.suffix || "");
          } else animateCount(entry.target);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => cio.observe(c));
  }

  /* ============================================================
     SERVIZI — anteprima immagine al hover
     ============================================================ */
  const services = document.querySelectorAll("[data-service]");
  const preview = document.querySelector("[data-services-preview]");
  const previewImg = document.querySelector("[data-services-img]");
  if (services.length && previewImg && canHover) {
    services.forEach((s) => {
      s.addEventListener("mouseenter", () => {
        services.forEach((x) => x.classList.remove("is-active"));
        s.classList.add("is-active");
        const src = s.dataset.img;
        if (src && previewImg.getAttribute("src") !== src) {
          preview.classList.add("is-changing");
          setTimeout(() => {
            previewImg.setAttribute("src", src);
            preview.classList.remove("is-changing");
          }, 260);
        }
      });
    });
    const firstActive = services[0];
    firstActive.classList.add("is-active");
  }

  /* ============================================================
     MAGNETISMO SOTTILE sui pulsanti [data-magnetic]
     (micro-interazione discreta; nessun cursore custom)
     ============================================================ */
  if (canHover && !reduceMotion) {
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      const strength = 0.22;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
  }

  /* ============================================================
     HERO CANVAS — particelle di luce dorata alla deriva
     ============================================================ */
  const canvas = document.querySelector("[data-hero-canvas]");
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    let W, H, particles = [], raf;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = W * DPR; canvas.height = H * DPR;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const count = Math.min(32, Math.floor(W / 48));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.5 + 0.3,
        vx: (Math.random() - 0.5) * 0.14,
        vy: (Math.random() - 0.5) * 0.14,
        a: Math.random() * 0.28 + 0.05,
      }));
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201,162,75,${p.a})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }
    resize();
    draw();
    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 200); });
    // pausa quando fuori schermo
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((es) => {
        es.forEach((e) => {
          if (e.isIntersecting) { if (!raf) draw(); }
          else { cancelAnimationFrame(raf); raf = null; }
        });
      }, { threshold: 0 }).observe(canvas);
    }
  }

  /* ============================================================
     GSAP — parallax immagini + marquee
     ============================================================ */
  if (hasGSAP && window.ScrollTrigger && !reduceMotion) {
    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray("[data-parallax]").forEach((el) => {
      const speed = parseFloat(el.dataset.parallaxSpeed || "0.1");
      gsap.to(el, {
        yPercent: -speed * 100,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
      });
    });

    // Marquee loop
    const track = document.querySelector("[data-marquee]");
    if (track) {
      const w = track.scrollWidth / 2;
      gsap.to(track, { x: -w, duration: 26, ease: "none", repeat: -1 });
    }
  } else {
    // Fallback marquee via CSS animation
    const track = document.querySelector("[data-marquee]");
    if (track && !reduceMotion) {
      track.style.animation = "marqueeMove 26s linear infinite";
      const style = document.createElement("style");
      style.textContent = "@keyframes marqueeMove{from{transform:translateX(0)}to{transform:translateX(-50%)}}";
      document.head.appendChild(style);
    }
  }

  /* ============================================================
     LIGHTBOX GALLERIA
     ============================================================ */
  const items = Array.from(document.querySelectorAll("[data-lightbox]"));
  const modal = document.querySelector("[data-lightbox-modal]");
  const modalImg = document.querySelector("[data-lightbox-img]");
  const btnClose = document.querySelector("[data-lightbox-close]");
  const btnPrev = document.querySelector("[data-lightbox-prev]");
  const btnNext = document.querySelector("[data-lightbox-next]");
  let current = 0;

  function openLightbox(i) {
    current = i;
    const img = items[i].querySelector("img");
    modalImg.setAttribute("src", img.getAttribute("src"));
    modalImg.setAttribute("alt", img.getAttribute("alt") || "");
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    if (lenis) lenis.stop();
    lastFocused = items[i];
    releaseTrap = trapFocus(modal);
    if (btnClose) requestAnimationFrame(function () { btnClose.focus(); });
  }
  function closeLightbox() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    if (lenis) lenis.start();
    if (releaseTrap) { releaseTrap(); releaseTrap = null; }
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }
  function step(dir) {
    current = (current + dir + items.length) % items.length;
    const img = items[current].querySelector("img");
    modalImg.style.opacity = "0";
    setTimeout(() => {
      modalImg.setAttribute("src", img.getAttribute("src"));
      modalImg.setAttribute("alt", img.getAttribute("alt") || "");
      modalImg.style.opacity = "1";
    }, 180);
  }
  items.forEach((it, i) => it.addEventListener("click", () => openLightbox(i)));
  btnClose && btnClose.addEventListener("click", closeLightbox);
  btnPrev && btnPrev.addEventListener("click", () => step(-1));
  btnNext && btnNext.addEventListener("click", () => step(1));
  modal && modal.addEventListener("click", (e) => { if (e.target === modal) closeLightbox(); });
  document.addEventListener("keydown", (e) => {
    if (!modal || !modal.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });
  if (modalImg) modalImg.style.transition = "opacity .18s ease";

  /* ============================================================
     PRIMA/DOPO — comparatore accessibile (range → clip-path)
     ============================================================ */
  const compare = document.querySelector("[data-compare]");
  if (compare) {
    const after = compare.querySelector("[data-compare-after]");
    const handle = compare.querySelector("[data-compare-handle]");
    const range = compare.querySelector("[data-compare-range]");
    function setCompare(v) {
      after.style.clipPath = "inset(0 0 0 " + v + "%)";
      handle.style.left = v + "%";
    }
    range.addEventListener("input", () => setCompare(range.value));
    setCompare(range.value);
  }

  /* ============================================================
     FORM — invio via WhatsApp (nessun backend, nessun dato salvato)
     Compone un messaggio precompilato e apre wa.me verso lo studio.
     ============================================================ */
  const form = document.querySelector("[data-form]");
  if (form) {
    const note = document.querySelector("[data-form-note]");
    // PLACEHOLDER: cellulare dello studio in formato internazionale, solo cifre (es. 39 + numero, senza + né spazi)
    const WHATSAPP_NUMBER = "393400000000";
    const val = (name) => {
      const el = form.elements[name];
      return el ? el.value.trim() : "";
    };
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const nome = val("nome"), tel = val("tel"), email = val("email"),
            motivo = val("motivo"), noteVal = val("note");
      const msg =
        "Nuova richiesta di appuntamento — Studio del Sorriso\n\n" +
        "Nome: " + nome + "\n" +
        "Telefono: " + tel + "\n" +
        (email ? "Email: " + email + "\n" : "") +
        "Motivo: " + motivo + "\n" +
        (noteVal ? "Note: " + noteVal + "\n" : "");
      const url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(msg);
      window.open(url, "_blank", "noopener");
      if (note) note.hidden = false;
    });
  }
})();
