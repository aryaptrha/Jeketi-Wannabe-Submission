'use strict';

/* ==========================================================================
   Jeketoy — comic motion layer (GSAP + ScrollTrigger from CDN).
   Everything degrades: without GSAP, or with reduced motion, the page is
   fully readable and every control still works without animation.
   ========================================================================== */

const root = document.documentElement;
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const hasGsap = Boolean(gsap && ScrollTrigger);
if (hasGsap) gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const animate = () => hasGsap && !reduceMotion.matches;

const OSHI_KEY = 'jeketoy:oshi';

const store = {
    get() {
        try {
            return localStorage.getItem(OSHI_KEY) || sessionStorage.getItem('inputValue') || '';
        } catch {
            return '';
        }
    },
    set(value) {
        try {
            localStorage.setItem(OSHI_KEY, value);
        } catch {
            /* storage blocked: the prompt simply shows again next load */
        }
    },
};

/* ---------- burst shapes ---------- */

// Deterministic jagged star so each burst looks hand-drawn but stable across loads.
function burstPoints(spikes) {
    const points = [];
    let seed = spikes * 9301;
    const rand = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };
    for (let i = 0; i < spikes * 2; i += 1) {
        const angle = (Math.PI * i) / spikes - Math.PI / 2;
        const radius = i % 2 === 0 ? 86 + rand() * 8 : 58 + rand() * 10;
        points.push(`${(100 + Math.cos(angle) * radius).toFixed(1)},${(100 + Math.sin(angle) * radius).toFixed(1)}`);
    }
    return points.join(' ');
}

document.querySelectorAll('polygon[data-burst]').forEach((poly) => {
    poly.setAttribute('points', burstPoints(Number(poly.dataset.burst) || 12));
});

/* ---------- pop-up SFX burst (non-blocking) ---------- */

const toast = document.getElementById('burstToast');

function showBurst(text) {
    toast.querySelector('.burst-text').textContent = text;
    toast.hidden = false;
    if (!animate()) {
        setTimeout(() => { toast.hidden = true; }, 2200);
        return;
    }
    gsap.timeline({ onComplete: () => { toast.hidden = true; } })
        .fromTo(toast, { scale: 0, rotation: -25 }, { scale: 1, rotation: 0, duration: 0.45, ease: 'back.out(2.2)' })
        .to(toast, { rotation: 3, duration: 0.08, repeat: 5, yoyo: true, ease: 'none' })
        .to(toast, { scale: 0, rotation: 20, duration: 0.3, ease: 'back.in(2)' }, '+=1.1');
}

/* ---------- speech-bubble oshi prompt ---------- */

const dialog = document.getElementById('oshiDialog');
const oshiInput = document.getElementById('oshiInput');

function askOshi() {
    if (typeof dialog.showModal !== 'function') return;
    dialog.returnValue = '';
    dialog.showModal();
    oshiInput.focus();
    // Animate the bubble's contents, never the <dialog> itself: tweening the
    // dialog element knocks it out of the top layer in Chromium.
    if (animate()) {
        gsap.fromTo(dialog.querySelector('.bubble-form'),
            { scale: 0.3, rotation: -8, opacity: 0 },
            { scale: 1, rotation: 0, opacity: 1, duration: 0.45, ease: 'back.out(1.8)', clearProps: 'all' });
    }
}

dialog.addEventListener('close', () => {
    const name = oshiInput.value.trim();
    if (dialog.returnValue === 'save' && name) {
        store.set(name);
        showBurst(`${name} oshi ku juga!!!`);
    }
});

/* ---------- scroll-to-top: "Up, up & away!" ---------- */

const upBtn = document.getElementById('scrollToTopBtn');

window.addEventListener('scroll', () => {
    upBtn.classList.toggle('is-visible', window.scrollY > 400);
}, { passive: true });

upBtn.addEventListener('click', () => {
    if (!animate()) {
        window.scrollTo({ top: 0, behavior: 'auto' });
        return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    gsap.timeline()
        .to(upBtn, { y: 10, scale: 0.85, duration: 0.12, ease: 'power1.out' })
        .to(upBtn, { y: () => -window.innerHeight - 200, rotation: -25, scale: 1.1, duration: 0.65, ease: 'power3.in' })
        .set(upBtn, { clearProps: 'transform' });
});

/* ---------- "Meanwhile..." caption wipe on nav jumps ---------- */

const wipe = document.querySelector('.wipe');
const wipePlace = wipe.querySelector('.wipe-place');
let wiping = false;

function jumpTo(target, hash) {
    target.scrollIntoView({ behavior: 'auto', block: 'start' });
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    history.pushState(null, '', hash);
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
        const hash = link.getAttribute('href');
        const target = document.querySelector(hash);
        if (!target) return;
        event.preventDefault();

        if (!animate() || !link.dataset.wipe) {
            jumpTo(target, hash);
            return;
        }
        if (wiping) return;
        wiping = true;
        wipePlace.textContent = link.dataset.wipe;

        gsap.timeline({ onComplete: () => { wiping = false; } })
            .set(wipe, { visibility: 'visible', xPercent: -105, skewX: -8 })
            .to(wipe, { xPercent: 0, skewX: 0, duration: 0.38, ease: 'power3.out' })
            .from(wipe.children, { scale: 0.4, rotation: -8, opacity: 0, stagger: 0.08, duration: 0.3, ease: 'back.out(2)' }, '-=0.15')
            .call(() => jumpTo(target, hash))
            .to(wipe, { xPercent: 105, skewX: 8, duration: 0.38, ease: 'power3.in' }, '+=0.45')
            .set(wipe, { visibility: 'hidden', clearProps: 'transform' });
    });
});

/* ---------- scroll reveals + parallax (after the intro) ---------- */

function initMotion() {
    if (!animate()) return;

    const mm = gsap.matchMedia();

    mm.add({ desktop: '(min-width: 769px)', mobile: '(max-width: 768px)' }, (ctx) => {
        const { desktop } = ctx.conditions;

        // Panels slam into place with a little overshoot; captions stamp on after.
        gsap.utils.toArray('.panel').forEach((panel, i) => {
            const tilt = i % 2 === 0 ? -3 : 3;
            const caption = panel.querySelector('.caption');
            gsap.timeline({ scrollTrigger: { trigger: panel, start: 'top 85%', once: true } })
                .from(panel, {
                    scale: desktop ? 1.18 : 1.08,
                    rotation: desktop ? tilt : 0,
                    opacity: 0,
                    duration: 0.45,
                    ease: 'back.out(1.4)',
                })
                .from(caption, { scale: 0, rotation: -25, duration: 0.4, ease: 'back.out(2.5)' }, '-=0.15');
        });

        gsap.utils.toArray('.panel .caption-sub').forEach((cap) => {
            gsap.from(cap, {
                scale: 0, rotation: 20, duration: 0.4, ease: 'back.out(2.5)',
                scrollTrigger: { trigger: cap, start: 'top 85%', once: true },
            });
        });

        gsap.from('.oshi-card', {
            y: 80, rotation: (i) => [-8, 6, -4][i % 3], opacity: 0,
            duration: 0.55, stagger: 0.12, ease: 'back.out(1.6)',
            scrollTrigger: { trigger: '.oshi-card-container', start: 'top 80%', once: true },
        });

        gsap.from('.speech', {
            scale: 0, transformOrigin: '50% 0%', duration: 0.35, stagger: 0.12, delay: 0.35, ease: 'back.out(3)',
            scrollTrigger: { trigger: '.oshi-card-container', start: 'top 80%', once: true },
        });

        gsap.from('#setlist', {
            scale: 0, rotation: 15, duration: 0.45, ease: 'back.out(2.5)',
            scrollTrigger: { trigger: '#setlist', start: 'top 90%', once: true },
        });

        // Setlist cards: the sidebar is sticky on desktop, which makes scroll-trigger
        // positions unreliable, so deal them in like a hand of cards right away.
        // On mobile the sidebar is in normal flow, so reveal them as they scroll in.
        const cards = gsap.utils.toArray('.setlist-card');
        const cardFrom = { opacity: 0, y: 50, rotation: (i) => (i % 2 ? 6 : -6) };
        const cardTo = { opacity: 1, y: 0, rotation: 0, duration: 0.45, stagger: 0.07, ease: 'back.out(1.8)' };
        if (desktop) {
            gsap.fromTo(cards, cardFrom, { ...cardTo, delay: 0.2 });
        } else {
            gsap.set(cards, cardFrom);
            const reveal = (batch) => gsap.to(batch, cardTo);
            ScrollTrigger.batch(cards, { start: 'top 92%', once: true, onEnter: reveal, onLeave: reveal });
        }

        // Parallax background layers — desktop only.
        if (desktop) {
            gsap.to('.fx-dots', {
                yPercent: -25, ease: 'none',
                scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.6 },
            });
            gsap.to('.fx-lines', {
                yPercent: -12, ease: 'none',
                scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 1 },
            });
        }
    });
}

/* ---------- cover intro (every load) ---------- */

const intro = document.getElementById('intro');
const pageRegions = document.querySelectorAll('header, main, footer');

function afterIntro(storedName) {
    intro.remove();
    root.classList.remove('intro-active');
    pageRegions.forEach((el) => { el.inert = false; });
    initMotion();
    if (!storedName) askOshi();
}

function splitChars(el) {
    const text = el.textContent;
    el.setAttribute('aria-label', text);
    el.textContent = '';
    [...text].forEach((ch) => {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = ch;
        el.appendChild(span);
    });
    return el.children;
}

function playIntro() {
    const storedName = store.get();

    if (!animate()) {
        afterIntro(storedName);
        return;
    }

    root.classList.add('intro-active');
    pageRegions.forEach((el) => { el.inert = true; });

    const chars = splitChars(intro.querySelector('.intro-title'));
    const cover = intro.querySelector('.intro-cover');
    const boom = intro.querySelector('.intro-boom');
    const welcome = intro.querySelector('.intro-welcome');
    const skipBtn = intro.querySelector('.intro-skip');
    if (storedName) welcome.querySelector('[data-oshi]').textContent = storedName;

    gsap.set(intro, { clipPath: 'circle(150% at 50% 50%)' });

    const tl = gsap.timeline({ paused: true, onComplete: () => afterIntro(storedName) });

    tl.from(chars, {
        scale: 3.2,
        opacity: 0,
        y: () => gsap.utils.random(-120, 120),
        rotation: () => gsap.utils.random(-40, 40),
        duration: 0.5,
        stagger: 0.09,
        ease: 'back.out(2)',
    })
        .from('.intro-sub', { scale: 0, rotation: -15, duration: 0.35, ease: 'back.out(2.5)' }, '-=0.15')
        .from(boom, { scale: 0, rotation: -90, duration: 0.45, ease: 'back.out(2.2)' }, '-=0.05')
        .to(cover, { x: 8, duration: 0.05, repeat: 7, yoyo: true, ease: 'none' }, '<0.1')
        .to(chars, { y: -14, duration: 0.18, stagger: { each: 0.05, yoyo: true, repeat: 1 }, ease: 'power1.out' }, '<');

    if (storedName) {
        tl.to(cover, { scale: 0.7, opacity: 0, duration: 0.35, ease: 'power2.in' }, '+=0.35')
            .fromTo(welcome,
                { autoAlpha: 0, scale: 0, rotation: -30 },
                { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(2)' }, '-=0.1')
            .to(welcome, { rotation: 3, duration: 0.08, repeat: 5, yoyo: true, ease: 'none' })
            .to(welcome, { scale: 1.6, autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, '+=0.35');
    } else {
        tl.to(cover, { scale: 1.6, opacity: 0, duration: 0.45, ease: 'power2.in' }, '+=0.45');
    }

    tl.to(intro, { clipPath: 'circle(0% at 50% 50%)', duration: 0.55, ease: 'power3.inOut' }, '-=0.25');

    // Skip from the first frame: click anywhere, or Esc / Enter / Space.
    const skip = () => {
        if (tl.progress() < 1) tl.progress(1);
    };
    intro.addEventListener('click', skip);
    document.addEventListener('keydown', function onKey(event) {
        if (!document.body.contains(intro)) {
            document.removeEventListener('keydown', onKey);
            return;
        }
        if (['Escape', 'Enter', ' '].includes(event.key)) {
            event.preventDefault();
            skip();
        }
    });
    skipBtn.focus();

    // Wait briefly for Bangers so the letters don't swap fonts mid-animation.
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    Promise.race([fontsReady, new Promise((r) => setTimeout(r, 900))]).then(() => tl.play());
}

playIntro();
