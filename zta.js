// ==========================================================
// ZTA – Shared Script (loaded on every page)
// Navbar • Preloader • Reveal • Parallax • Stars • Tilt •
// Counters • Typing • Lightbox • Cursor • Ripple • Countdown
// ==========================================================

(function () {
    'use strict';

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia('(hover: none)').matches;

    // ---------- Utilities ----------
    const $  = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

    function throttle(fn, limit = 100) {
        let last = 0;
        return function (...args) {
            const now = Date.now();
            if (now - last >= limit) { last = now; fn.apply(this, args); }
        };
    }

    function debounce(fn, delay = 250) {
        let t;
        return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), delay); };
    }

    // ---------- 1. Preloader ----------
    function initPreloader() {
        const pre = $('.preloader');
        if (!pre) return;
        const hide = () => pre.classList.add('hide');
        window.addEventListener('load', () => setTimeout(hide, 350));
        setTimeout(hide, 3000); // safety net
    }

    // ---------- 2. Navbar: mobile menu, active link, shrink ----------
    function initNavbar() {
        const navbar = $('.navbar');
        const burger = $('#hamburger');
        const menu   = $('#mobileMenu');

        const close = () => {
            if (!menu) return;
            menu.classList.remove('open');
            burger && burger.classList.remove('open');
            document.body.style.overflow = '';
        };

        if (burger && menu) {
            burger.addEventListener('click', () => {
                const open = menu.classList.toggle('open');
                burger.classList.toggle('open', open);
                document.body.style.overflow = open ? 'hidden' : '';
            });
            $$('a', menu).forEach(a => a.addEventListener('click', close));
            document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
            window.addEventListener('resize', debounce(() => { if (window.innerWidth > 992) close(); }));
        }

        // Highlight current page
        const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
        $$('.nav-links a, .mobile-menu a').forEach(a => {
            const href = (a.getAttribute('href') || '').toLowerCase();
            if (href === page) a.classList.add('active');
        });

        // Shrink on scroll
        if (navbar) {
            const onScroll = () => navbar.classList.toggle('shrunk', window.scrollY > 60);
            window.addEventListener('scroll', throttle(onScroll, 80), { passive: true });
            onScroll();
        }
    }

    // ---------- 3. Scroll progress bar + scroll-to-top ----------
    function initScrollUI() {
        const bar = document.createElement('div');
        bar.className = 'scroll-progress';
        document.body.appendChild(bar);

        const topBtn = document.createElement('button');
        topBtn.className = 'scroll-top';
        topBtn.setAttribute('aria-label', 'Scroll to top');
        topBtn.textContent = '↑';
        document.body.appendChild(topBtn);
        topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

        const update = () => {
            const h = document.documentElement.scrollHeight - window.innerHeight;
            const y = window.scrollY;
            bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
            topBtn.classList.toggle('show', y > 400);
        };
        window.addEventListener('scroll', throttle(update, 16), { passive: true });
        update();
    }

    // ---------- 4. Smooth anchor scrolling ----------
    function initSmoothAnchors() {
        $$('a[href^="#"]').forEach(a => {
            a.addEventListener('click', e => {
                const id = a.getAttribute('href').slice(1);
                if (!id) { e.preventDefault(); return; }
                const target = document.getElementById(id);
                if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
            });
        });
    }

    // ---------- 5. Reveal on scroll (with stagger) ----------
    function initReveal() {
        const items = $$('.reveal');
        if (!items.length) return;

        if (!('IntersectionObserver' in window) || reduceMotion) {
            items.forEach(el => el.classList.add('visible'));
            return;
        }

        // Stagger siblings inside grids
        $$('.grid').forEach(grid => {
            $$('.reveal', grid).forEach((el, i) => { el.style.transitionDelay = (i * 120) + 'ms'; });
        });

        const io = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Drop the delay after the entrance so hover/tilt stays snappy
                    setTimeout(() => { entry.target.style.transitionDelay = ''; }, 1400);
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        items.forEach(el => io.observe(el));
    }

    // ---------- 6. Hero parallax ----------
    function initParallax() {
        const hero = $('.hero');
        const inner = $('.hero-inner');
        if (!hero || reduceMotion) return;
        const onScroll = () => {
            const y = window.scrollY;
            if (y > window.innerHeight * 1.2) return;
            hero.style.backgroundPositionY = `calc(50% + ${y * 0.35}px)`;
            if (inner) {
                inner.style.transform = `translateY(${y * 0.12}px)`;
                inner.style.opacity = Math.max(0, 1 - y / (window.innerHeight * 0.9));
            }
        };
        window.addEventListener('scroll', throttle(onScroll, 16), { passive: true });
    }

    // ---------- 7. Typing effect ----------
    function initTyping() {
        $$('[data-typing]').forEach(el => {
            const full = el.getAttribute('data-typing');
            if (reduceMotion) { el.textContent = full; return; }
            el.textContent = '';
            const cursor = document.createElement('span');
            cursor.className = 'typing-cursor';
            el.appendChild(cursor);
            let i = 0;
            const delay = parseInt(el.getAttribute('data-typing-delay') || '900', 10);
            setTimeout(function tick() {
                if (i < full.length) {
                    cursor.before(document.createTextNode(full.charAt(i++)));
                    setTimeout(tick, 55 + Math.random() * 60);
                }
            }, delay);
        });
    }

    // ---------- 8. Animated counters ----------
    function initCounters() {
        const counters = $$('[data-count]');
        if (!counters.length) return;

        const run = el => {
            const target = parseFloat(el.getAttribute('data-count'));
            const suffix = el.getAttribute('data-suffix') || '';
            if (reduceMotion) { el.textContent = target + suffix; return; }
            const dur = 1800;
            const start = performance.now();
            (function step(now) {
                const p = Math.min((now - start) / dur, 1);
                const eased = 1 - Math.pow(1 - p, 3);
                el.textContent = Math.round(target * eased) + suffix;
                if (p < 1) requestAnimationFrame(step);
            })(start);
        };

        if (!('IntersectionObserver' in window)) { counters.forEach(run); return; }
        const io = new IntersectionObserver((entries, obs) => {
            entries.forEach(e => { if (e.isIntersecting) { run(e.target); obs.unobserve(e.target); } });
        }, { threshold: 0.6 });
        counters.forEach(c => io.observe(c));
    }

    // ---------- 9. 3D tilt on cards ----------
    function initTilt() {
        if (isTouch || reduceMotion) return;
        $$('.tilt').forEach(card => {
            card.addEventListener('mousemove', e => {
                const r = card.getBoundingClientRect();
                const x = e.clientX - r.left;
                const y = e.clientY - r.top;
                const rotY = ((x - r.width / 2) / (r.width / 2)) * 8;
                const rotX = ((r.height / 2 - y) / (r.height / 2)) * 8;
                card.style.transform =
                    `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-8px) scale(1.02)`;
            });
            card.addEventListener('mouseleave', () => { card.style.transform = ''; });
        });
    }

    // ---------- 10. Magnetic buttons + ripple ----------
    function initButtons() {
        $$('.btn').forEach(btn => {
            if (!isTouch && !reduceMotion) {
                btn.addEventListener('mousemove', e => {
                    const r = btn.getBoundingClientRect();
                    const x = (e.clientX - r.left - r.width / 2) * 0.25;
                    const y = (e.clientY - r.top - r.height / 2) * 0.35;
                    btn.style.transform = `translate(${x}px, ${y}px)`;
                });
                btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
            }
            btn.addEventListener('click', e => {
                const r = btn.getBoundingClientRect();
                const ripple = document.createElement('span');
                const size = Math.max(r.width, r.height);
                ripple.style.cssText =
                    `position:absolute;border-radius:50%;pointer-events:none;background:rgba(255,255,255,.45);` +
                    `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;` +
                    `top:${e.clientY - r.top - size / 2}px;transform:scale(0);opacity:1;` +
                    `transition:transform .6s ease, opacity .6s ease;`;
                btn.appendChild(ripple);
                requestAnimationFrame(() => { ripple.style.transform = 'scale(2.5)'; ripple.style.opacity = '0'; });
                setTimeout(() => ripple.remove(), 650);
            });
        });
    }

    // ---------- 11. Star field (mouse repel + shooting stars) ----------
    function initStars() {
        if (reduceMotion) return;
        const canvas = document.createElement('canvas');
        canvas.className = 'star-canvas';
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        let stars = [];
        let shooting = [];
        const mouse = { x: -9999, y: -9999 };
        const COUNT = window.innerWidth < 768 ? 90 : 170;

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            stars = Array.from({ length: COUNT }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: Math.random() * 1.6 + 0.4,
                vx: (Math.random() - 0.5) * 0.25,
                vy: (Math.random() - 0.5) * 0.25,
                a: Math.random() * 0.5 + 0.4,
                tw: Math.random() * 0.02 + 0.005,
                phase: Math.random() * Math.PI * 2
            }));
        }

        window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
        window.addEventListener('resize', debounce(resize));
        resize();

        function spawnShooting() {
            shooting.push({
                x: Math.random() * canvas.width * 0.8,
                y: Math.random() * canvas.height * 0.4,
                len: 120 + Math.random() * 80,
                speed: 9 + Math.random() * 6,
                life: 1
            });
        }
        setInterval(() => { if (!document.hidden && Math.random() < 0.7) spawnShooting(); }, 4500);

        (function draw(t) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const s of stars) {
                s.x += s.vx; s.y += s.vy;
                if (s.x < 0) s.x = canvas.width;
                if (s.x > canvas.width) s.x = 0;
                if (s.y < 0) s.y = canvas.height;
                if (s.y > canvas.height) s.y = 0;

                // Gentle repel from mouse
                const dx = s.x - mouse.x, dy = s.y - mouse.y;
                const d2 = dx * dx + dy * dy;
                if (d2 < 14000) {
                    const d = Math.sqrt(d2) || 1;
                    const f = (118 - d) / 118 * 1.4;
                    s.x += (dx / d) * f;
                    s.y += (dy / d) * f;
                }

                const alpha = s.a * (0.6 + 0.4 * Math.sin(t * s.tw + s.phase));
                ctx.fillStyle = `rgba(255,255,255,${alpha})`;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fill();
            }

            shooting = shooting.filter(m => m.life > 0);
            for (const m of shooting) {
                const grad = ctx.createLinearGradient(m.x, m.y, m.x - m.len, m.y - m.len * 0.45);
                grad.addColorStop(0, `rgba(154,205,50,${m.life})`);
                grad.addColorStop(1, 'rgba(154,205,50,0)');
                ctx.strokeStyle = grad;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(m.x, m.y);
                ctx.lineTo(m.x - m.len, m.y - m.len * 0.45);
                ctx.stroke();
                m.x += m.speed; m.y += m.speed * 0.45; m.life -= 0.014;
            }

            requestAnimationFrame(draw);
        })(0);
    }

    // ---------- 12. Custom cursor ----------
    function initCursor() {
        if (isTouch || reduceMotion) return;
        const glow = document.createElement('div');
        glow.className = 'custom-cursor';
        const dot = document.createElement('div');
        dot.className = 'cursor-dot';
        document.body.append(glow, dot);

        let mx = 0, my = 0, gx = 0, gy = 0;
        document.addEventListener('mousemove', e => {
            mx = e.clientX; my = e.clientY;
            dot.style.left = mx + 'px'; dot.style.top = my + 'px';
        });
        (function loop() {
            gx += (mx - gx) * 0.15;
            gy += (my - gy) * 0.15;
            glow.style.left = gx + 'px'; glow.style.top = gy + 'px';
            requestAnimationFrame(loop);
        })();

        document.addEventListener('mouseover', e => {
            glow.classList.toggle('big', !!e.target.closest('a, button, .media-card, .hamburger'));
        });
    }

    // ---------- 13. Images: lazy fade-in + graceful fallback ----------
    function initImages() {
        $$('img').forEach(img => {
            img.loading = 'lazy';
            img.style.opacity = '0';
            img.style.transition = 'opacity .7s ease, transform .6s ease';
            const show = () => { img.style.opacity = '1'; };
            if (img.complete && img.naturalWidth > 0) show();
            img.addEventListener('load', show);
            img.addEventListener('error', () => {
                const fb = document.createElement('div');
                fb.className = 'img-fallback';
                fb.textContent = img.getAttribute('data-fallback') || '✦';
                if (img.parentNode) img.replaceWith(fb);
            });
        });
    }

    // ---------- 14. Lightbox (for [data-lightbox] cards) ----------
    function initLightbox() {
        const items = $$('[data-lightbox]');
        if (!items.length) return;

        const lb = document.createElement('div');
        lb.className = 'lightbox';
        lb.innerHTML =
            '<button class="lb-close" aria-label="Close">✕</button>' +
            '<button class="lb-prev" aria-label="Previous">‹</button>' +
            '<img alt="">' +
            '<div class="lightbox-caption"></div>' +
            '<button class="lb-next" aria-label="Next">›</button>';
        document.body.appendChild(lb);

        const lbImg = $('img', lb);
        const lbCap = $('.lightbox-caption', lb);
        let index = 0;

        const show = i => {
            index = (i + items.length) % items.length;
            const el = items[index];
            const img = $('img', el);
            if (!img) return;
            lbImg.src = img.src;
            lbCap.textContent = el.getAttribute('data-caption') || '';
        };
        const open = i => { show(i); lb.classList.add('open'); document.body.style.overflow = 'hidden'; };
        const close = () => { lb.classList.remove('open'); document.body.style.overflow = ''; };

        items.forEach((el, i) => el.addEventListener('click', () => open(i)));
        $('.lb-close', lb).addEventListener('click', close);
        $('.lb-prev', lb).addEventListener('click', e => { e.stopPropagation(); show(index - 1); });
        $('.lb-next', lb).addEventListener('click', e => { e.stopPropagation(); show(index + 1); });
        lb.addEventListener('click', e => { if (e.target === lb) close(); });
        document.addEventListener('keydown', e => {
            if (!lb.classList.contains('open')) return;
            if (e.key === 'Escape') close();
            if (e.key === 'ArrowLeft') show(index - 1);
            if (e.key === 'ArrowRight') show(index + 1);
        });
    }

    // ---------- 15. Countdown (contact page) ----------
    function initCountdown() {
        const wrap = $('[data-countdown]');
        if (!wrap) return;
        const target = new Date(wrap.getAttribute('data-countdown')).getTime();
        const parts = {
            days: $('#days'), hours: $('#hours'), minutes: $('#minutes'), seconds: $('#seconds')
        };
        const pad = n => String(n).padStart(2, '0');

        function tick() {
            const d = target - Date.now();
            if (d <= 0) { wrap.innerHTML = '<h2 style="color:#9acd32">🚀 LAUNCHED!</h2>'; return false; }
            parts.days.textContent    = pad(Math.floor(d / 86400000));
            parts.hours.textContent   = pad(Math.floor(d % 86400000 / 3600000));
            parts.minutes.textContent = pad(Math.floor(d % 3600000 / 60000));
            parts.seconds.textContent = pad(Math.floor(d % 60000 / 1000));
            return true;
        }
        if (tick()) {
            const id = setInterval(() => { if (!tick()) clearInterval(id); }, 1000);
        }
    }

    // ---------- 16. Footer year ----------
    function initYear() {
        $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
    }

    // ---------- Boot ----------
    initPreloader();
    document.addEventListener('DOMContentLoaded', () => {
        initNavbar();
        initScrollUI();
        initSmoothAnchors();
        initImages();
        initReveal();
        initParallax();
        initTyping();
        initCounters();
        initTilt();
        initButtons();
        initStars();
        initCursor();
        initLightbox();
        initCountdown();
        initYear();
        console.log('%c🌌 Welcome to ZTA – Zero To Astro 🌌', 'color:#9acd32;font-size:18px;font-weight:bold;');
    });
})();
