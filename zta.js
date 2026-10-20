// ==========================================================
// ZTA – Shared Script (every page)
// ==========================================================

// ---------- SETTINGS (edit these) ----------
const CONFIG = {
    // The email address that receives messages from the "Get in Touch" form.
    // Delivery uses the free FormSubmit service: the first message you receive
    // will contain an activation link you must click once.
    contactEmail: "",          // e.g. "you@gmail.com"
    cooldownSeconds: 30        // minimum time between messages from one visitor
};

(function () {
    'use strict';

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia('(hover: none)').matches;

    const $  = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
    const throttle = (fn, ms = 100) => { let l = 0; return function (...a) { const n = Date.now(); if (n - l >= ms) { l = n; fn.apply(this, a); } }; };
    const debounce = (fn, ms = 250) => { let t; return function (...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); }; };

    // ---------- Toasts ----------
    function toast(msg, type = 'ok', ms = 4200) {
        let wrap = $('.toast-wrap');
        if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
        const t = document.createElement('div');
        t.className = 'toast' + (type === 'error' ? ' error' : '');
        t.textContent = msg;
        wrap.appendChild(t);
        setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 450); }, ms);
    }

    // ---------- Preloader + page transitions ----------
    function initPreloader() {
        const pre = $('.preloader');
        const hide = () => pre && pre.classList.add('hide');
        window.addEventListener('load', () => setTimeout(hide, 350));
        setTimeout(hide, 3000);
        // restore page when coming back via browser history
        window.addEventListener('pageshow', e => { const w = $('.page-wipe'); if (w) w.classList.remove('on'); if (e.persisted) hide(); });
    }

    function initPageTransitions() {
        const wipe = $('.page-wipe');
        if (!wipe || reduceMotion) return;
        document.addEventListener('click', e => {
            const a = e.target.closest('a[href]');
            if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank' || a.hasAttribute('download')) return;
            const url = new URL(a.href, location.href);
            if (url.origin !== location.origin && location.protocol !== 'file:') return;
            const samePage = url.pathname === location.pathname;
            if (samePage) return;                       // anchors on the same page: smooth scroll instead
            if (!/\.html?$|\/$/.test(url.pathname)) return;
            e.preventDefault();
            wipe.classList.add('on');
            setTimeout(() => { location.href = url.href; }, 360);
        });
    }

    // ---------- Navbar ----------
    function initNavbar() {
        const navbar = $('.navbar'), burger = $('#hamburger'), menu = $('#mobileMenu');
        const close = () => { menu.classList.remove('open'); burger.classList.remove('open'); document.body.style.overflow = ''; };
        burger.addEventListener('click', () => {
            const open = menu.classList.toggle('open');
            burger.classList.toggle('open', open);
            document.body.style.overflow = open ? 'hidden' : '';
        });
        $$('a', menu).forEach(a => a.addEventListener('click', close));
        document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
        window.addEventListener('resize', debounce(() => { if (innerWidth > 992) close(); }));

        const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
        $$('.nav-links a, .mobile-menu a').forEach(a => {
            if ((a.getAttribute('href') || '').toLowerCase() === page) a.classList.add('active');
        });

        const onScroll = () => navbar.classList.toggle('shrunk', scrollY > 60);
        addEventListener('scroll', throttle(onScroll, 80), { passive: true });
        onScroll();

        // Scroll-spy: highlight "Contact" while the contact section is on screen (home page)
        const contact = $('#contact');
        if (contact && 'IntersectionObserver' in window) {
            const links = $$('.nav-links a, .mobile-menu a');
            const home = links.filter(a => a.getAttribute('href') === 'index.html');
            const cl = links.filter(a => a.getAttribute('href') === 'index.html#contact');
            new IntersectionObserver(es => es.forEach(e => {
                if (e.isIntersecting) { home.forEach(a => a.classList.remove('active')); cl.forEach(a => a.classList.add('active')); }
                else { cl.forEach(a => a.classList.remove('active')); if (scrollY < contact.offsetTop) home.forEach(a => a.classList.add('active')); }
            }), { threshold: 0.35 }).observe(contact);
        }
    }

    // ---------- Scroll UI ----------
    function initScrollUI() {
        const bar = document.createElement('div'); bar.className = 'scroll-progress'; document.body.appendChild(bar);
        const top = document.createElement('button'); top.className = 'scroll-top'; top.textContent = '↑'; top.setAttribute('aria-label', 'Scroll to top');
        document.body.appendChild(top);
        top.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
        const update = () => {
            const h = document.documentElement.scrollHeight - innerHeight;
            bar.style.width = (h > 0 ? scrollY / h * 100 : 0) + '%';
            top.classList.toggle('show', scrollY > 400);
        };
        addEventListener('scroll', throttle(update, 16), { passive: true });
        update();
    }

    function initSmoothAnchors() {
        $$('a[href*="#"]').forEach(a => {
            a.addEventListener('click', e => {
                const url = new URL(a.href, location.href);
                if (url.pathname !== location.pathname || !url.hash) return;
                const t = document.getElementById(url.hash.slice(1));
                if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); history.replaceState(null, '', url.hash); }
            });
        });
    }

    // ---------- Reveal + split-words ----------
    function initSplitWords() {
        $$('[data-split]').forEach(el => {
            const words = el.textContent.trim().split(/\s+/);
            el.textContent = '';
            words.forEach((w, i) => {
                const s = document.createElement('span');
                s.className = 'word'; s.textContent = w;
                s.style.transitionDelay = (i * 35) + 'ms';
                el.append(s, ' ');
            });
            el.classList.add('reveal-words');
        });
    }

    function initReveal() {
        const items = $$('.reveal, .reveal-words');
        if (!('IntersectionObserver' in window) || reduceMotion) {
            items.forEach(el => el.classList.add('visible', 'words-in')); return;
        }
        $$('.grid').forEach(g => $$('.reveal', g).forEach((el, i) => { el.style.transitionDelay = (i * 110) + 'ms'; }));
        const io = new IntersectionObserver((es, obs) => es.forEach(e => {
            if (!e.isIntersecting) return;
            e.target.classList.add('visible', 'words-in');
            setTimeout(() => { e.target.style.transitionDelay = ''; }, 1400);
            obs.unobserve(e.target);
        }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        items.forEach(el => io.observe(el));
    }

    // ---------- Parallax (scroll + mouse) ----------
    function initParallax() {
        if (reduceMotion) return;
        const hero = $('.hero'), inner = $('.hero-inner'), orbit = $('.orbit');
        const blobs = $$('.blob');
        addEventListener('scroll', throttle(() => {
            const y = scrollY;
            if (hero && y < innerHeight * 1.2) {
                hero.style.backgroundPositionY = `calc(50% + ${y * 0.35}px)`;
                if (inner) { inner.style.transform = `translateY(${y * 0.12}px)`; inner.style.opacity = Math.max(0, 1 - y / (innerHeight * 0.9)); }
            }
        }, 16), { passive: true });
        if (!isTouch) addEventListener('mousemove', e => {
            const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
            if (orbit) orbit.style.transform = `translate(${x * -30}px, ${y * -30}px)`;
            blobs.forEach((b, i) => { b.style.translate = `${x * (30 + i * 20)}px ${y * (30 + i * 20)}px`; });
        });
    }

    // ---------- Typing ----------
    function initTyping() {
        $$('[data-typing]').forEach(el => {
            const full = el.getAttribute('data-typing');
            if (reduceMotion) { el.textContent = full; return; }
            el.textContent = '';
            const c = document.createElement('span'); c.className = 'typing-cursor'; el.appendChild(c);
            let i = 0;
            setTimeout(function tick() {
                if (i < full.length) { c.before(document.createTextNode(full[i++])); setTimeout(tick, 70 + Math.random() * 70); }
            }, 900);
        });
    }

    // ---------- Counters ----------
    function initCounters() {
        const els = $$('[data-count]'); if (!els.length) return;
        const run = el => {
            const target = parseFloat(el.dataset.count), suffix = el.dataset.suffix || '';
            if (reduceMotion) { el.textContent = target + suffix; return; }
            const t0 = performance.now(), dur = 1800;
            (function step(now) {
                const p = Math.min((now - t0) / dur, 1);
                el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
                if (p < 1) requestAnimationFrame(step);
            })(t0);
        };
        const io = new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { run(e.target); o.unobserve(e.target); } }), { threshold: 0.6 });
        els.forEach(e => io.observe(e));
    }

    // ---------- Card spotlight + tilt ----------
    function initCards() {
        $$('.card').forEach(card => {
            card.addEventListener('mousemove', e => {
                const r = card.getBoundingClientRect();
                card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
                card.style.setProperty('--my', (e.clientY - r.top) + 'px');
            });
        });
        if (isTouch || reduceMotion) return;
        $$('.tilt').forEach(card => {
            card.addEventListener('mousemove', e => {
                const r = card.getBoundingClientRect();
                const rx = ((r.height / 2 - (e.clientY - r.top)) / (r.height / 2)) * 7;
                const ry = (((e.clientX - r.left) - r.width / 2) / (r.width / 2)) * 7;
                card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-8px) scale(1.02)`;
            });
            card.addEventListener('mouseleave', () => { card.style.transform = ''; });
        });
    }

    // ---------- Buttons: magnetic + ripple ----------
    function initButtons() {
        $$('.btn, .chip, .dl-btn').forEach(btn => {
            if (!isTouch && !reduceMotion && btn.classList.contains('btn')) {
                btn.addEventListener('mousemove', e => {
                    const r = btn.getBoundingClientRect();
                    btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.32}px)`;
                });
                btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
            }
            btn.addEventListener('click', e => {
                const r = btn.getBoundingClientRect(), size = Math.max(r.width, r.height);
                const rp = document.createElement('span');
                rp.style.cssText = `position:absolute;border-radius:50%;pointer-events:none;background:rgba(255,255,255,.45);width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px;transform:scale(0);opacity:1;transition:transform .6s,opacity .6s`;
                if (getComputedStyle(btn).position === 'static') btn.style.position = 'relative';
                btn.style.overflow = 'hidden';
                btn.appendChild(rp);
                requestAnimationFrame(() => { rp.style.transform = 'scale(2.6)'; rp.style.opacity = '0'; });
                setTimeout(() => rp.remove(), 650);
            });
        });
    }

    // ---------- Starfield ----------
    function initStars() {
        if (reduceMotion) return;
        const cv = document.createElement('canvas'); cv.className = 'star-canvas'; document.body.appendChild(cv);
        const ctx = cv.getContext('2d');
        let stars = [], shooting = [];
        const mouse = { x: -9999, y: -9999 };
        const resize = () => {
            cv.width = innerWidth; cv.height = innerHeight;
            const n = innerWidth < 768 ? 90 : 170;
            stars = Array.from({ length: n }, () => ({
                x: Math.random() * cv.width, y: Math.random() * cv.height, r: Math.random() * 1.6 + 0.4,
                vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
                a: Math.random() * 0.5 + 0.4, tw: Math.random() * 0.02 + 0.005, ph: Math.random() * 6.28
            }));
        };
        addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
        addEventListener('resize', debounce(resize)); resize();
        setInterval(() => {
            if (document.hidden || Math.random() > 0.7) return;
            shooting.push({ x: Math.random() * cv.width * 0.8, y: Math.random() * cv.height * 0.4, len: 120 + Math.random() * 80, sp: 9 + Math.random() * 6, life: 1 });
        }, 4000);
        (function draw(t) {
            ctx.clearRect(0, 0, cv.width, cv.height);
            for (const s of stars) {
                s.x += s.vx; s.y += s.vy;
                if (s.x < 0) s.x = cv.width; if (s.x > cv.width) s.x = 0;
                if (s.y < 0) s.y = cv.height; if (s.y > cv.height) s.y = 0;
                const dx = s.x - mouse.x, dy = s.y - mouse.y, d2 = dx * dx + dy * dy;
                if (d2 < 14000) { const d = Math.sqrt(d2) || 1, f = (118 - d) / 118 * 1.4; s.x += dx / d * f; s.y += dy / d * f; }
                ctx.fillStyle = `rgba(255,255,255,${s.a * (0.6 + 0.4 * Math.sin(t * s.tw + s.ph))})`;
                ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
            }
            shooting = shooting.filter(m => m.life > 0);
            for (const m of shooting) {
                const g = ctx.createLinearGradient(m.x, m.y, m.x - m.len, m.y - m.len * 0.45);
                g.addColorStop(0, `rgba(154,205,50,${m.life})`); g.addColorStop(1, 'rgba(154,205,50,0)');
                ctx.strokeStyle = g; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x - m.len, m.y - m.len * 0.45); ctx.stroke();
                m.x += m.sp; m.y += m.sp * 0.45; m.life -= 0.014;
            }
            requestAnimationFrame(draw);
        })(0);
    }

    // ---------- Cursor ----------
    function initCursor() {
        if (isTouch || reduceMotion) return;
        const glow = document.createElement('div'); glow.className = 'custom-cursor';
        const dot = document.createElement('div'); dot.className = 'cursor-dot';
        document.body.append(glow, dot);
        let mx = 0, my = 0, gx = 0, gy = 0;
        addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; dot.style.left = mx + 'px'; dot.style.top = my + 'px'; });
        (function loop() { gx += (mx - gx) * 0.15; gy += (my - gy) * 0.15; glow.style.left = gx + 'px'; glow.style.top = gy + 'px'; requestAnimationFrame(loop); })();
        document.addEventListener('mouseover', e => glow.classList.toggle('big', !!e.target.closest('a, button, .media-card, .hamburger, .chip')));
    }

    // ---------- Images ----------
    function initImages() {
        $$('img').forEach(img => {
            img.loading = 'lazy';
            img.style.opacity = '0';
            img.style.transition = 'opacity .8s ease, transform .7s cubic-bezier(.2,.7,.2,1)';
            const show = () => { img.style.opacity = '1'; };
            if (img.complete && img.naturalWidth > 0) show();
            img.addEventListener('load', show);
            img.addEventListener('error', () => {
                const fb = document.createElement('div');
                fb.className = 'img-fallback'; fb.textContent = img.dataset.fallback || '✦';
                const ov = $('.overlay', img.parentNode);
                img.replaceWith(fb);
                if (ov) fb.after(ov);
            });
        });
    }

    // ---------- Gallery: filter ----------
    function initFilter() {
        const chips = $$('.chip[data-filter]'); if (!chips.length) return;
        const cards = $$('#galleryGrid .media-card');
        chips.forEach(chip => chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.toggle('active', c === chip));
            const f = chip.dataset.filter; let i = 0;
            cards.forEach(card => {
                const match = f === 'all' || card.dataset.cat === f;
                card.style.display = match ? '' : 'none';
                card.classList.remove('pop');
                if (match) {
                    card.classList.add('visible');
                    card.style.transitionDelay = '';
                    void card.offsetWidth;
                    card.style.animationDelay = (i++ * 70) + 'ms';
                    card.classList.add('pop');
                }
            });
        }));
    }

    // ---------- Lightbox with downloads ----------
    function initLightbox() {
        const all = $$('[data-lightbox]'); if (!all.length) return;
        const lb = document.createElement('div'); lb.className = 'lightbox';
        lb.innerHTML = '<button class="lb-btn lb-close" aria-label="Close">✕</button><button class="lb-btn lb-prev" aria-label="Previous">‹</button><img alt="">' +
            '<div class="lb-meta"><div class="lightbox-caption"></div><div class="lb-count"></div>' +
            '<div class="lb-dl"><a class="dl-btn" data-o>⬇ ORIGINAL</a><a class="dl-btn k4" data-k>⬇ 4K</a></div></div>' +
            '<button class="lb-btn lb-next" aria-label="Next">›</button>';
        document.body.appendChild(lb);
        const img = $('img', lb), cap = $('.lightbox-caption', lb), cnt = $('.lb-count', lb), ob = $('[data-o]', lb), kb = $('[data-k]', lb);
        let list = all, idx = 0;
        const visible = () => all.filter(el => el.style.display !== 'none');
        const show = i => {
            idx = (i + list.length) % list.length;
            const el = list[idx];
            img.style.opacity = '0';
            setTimeout(() => { img.src = el.dataset.orig; img.style.opacity = '1'; }, 120);
            cap.textContent = el.dataset.caption;
            cnt.textContent = `${idx + 1} / ${list.length}`;
            ob.href = el.dataset.orig; ob.download = `zta-${el.dataset.name}.jpg`;
            kb.href = el.dataset['4k']; kb.download = `zta-${el.dataset.name}-4k.jpg`;
        };
        const open = el => { list = visible(); show(list.indexOf(el)); lb.classList.add('open'); document.body.style.overflow = 'hidden'; };
        const close = () => { lb.classList.remove('open'); document.body.style.overflow = ''; };
        all.forEach(el => el.addEventListener('click', e => { if (e.target.closest('.dl-btn')) return; open(el); }));
        $('.lb-close', lb).addEventListener('click', close);
        $('.lb-prev', lb).addEventListener('click', () => show(idx - 1));
        $('.lb-next', lb).addEventListener('click', () => show(idx + 1));
        lb.addEventListener('click', e => { if (e.target === lb) close(); });
        document.addEventListener('keydown', e => {
            if (!lb.classList.contains('open')) return;
            if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(idx - 1); if (e.key === 'ArrowRight') show(idx + 1);
        });
        let sx = 0;
        lb.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
        lb.addEventListener('touchend', e => { const d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 50) show(idx + (d < 0 ? 1 : -1)); });
        $$('.dl-btn', lb).forEach(b => b.addEventListener('click', () => toast('Download started ⬇')));
        $$('#galleryGrid .dl-btn').forEach(b => b.addEventListener('click', () => toast('Download started ⬇')));
    }

    // ---------- Contact form ----------
    function initContact() {
        const form = $('#contactForm'); if (!form) return;
        const email = $('#cEmail'), msg = $('#cMessage'), count = $('#cCount'), btn = $('#cSubmit'), ok = $('#cSuccess');
        const label = $('.btn-label', btn);
        msg.addEventListener('input', () => { count.textContent = `${msg.value.length} / 1000`; msg.parentNode.classList.remove('invalid'); });
        email.addEventListener('input', () => email.parentNode.classList.remove('invalid'));
        $('#cAgain').addEventListener('click', () => ok.classList.remove('show'));

        form.addEventListener('submit', async e => {
            e.preventDefault();
            const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
            const okMsg = msg.value.trim().length >= 5;
            email.parentNode.classList.toggle('invalid', !okEmail);
            msg.parentNode.classList.toggle('invalid', !okMsg);
            if (!okEmail) return toast('Please enter a valid email address.', 'error');
            if (!okMsg) return toast('Please write a short message (at least 5 characters).', 'error');
            if (form.elements._honey.value) return;                      // bot trap

            const last = parseInt(localStorage.getItem('zta_last_msg') || '0', 10);
            const wait = CONFIG.cooldownSeconds * 1000 - (Date.now() - last);
            if (wait > 0) return toast(`Please wait ${Math.ceil(wait / 1000)}s before sending another message.`, 'error');
            if (!CONFIG.contactEmail) return toast('Contact form is not set up yet (add your email in zta.js).', 'error', 6000);

            btn.classList.add('loading'); label.textContent = 'SENDING…';
            try {
                const res = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(CONFIG.contactEmail), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({
                        email: email.value.trim(), message: msg.value.trim(),
                        _subject: 'New message from your ZTA website', _template: 'table', _captcha: 'false'
                    })
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok || data.success === 'false' || data.success === false) throw new Error(data.message || 'Request failed');
                localStorage.setItem('zta_last_msg', String(Date.now()));
                form.reset(); count.textContent = '0 / 1000';
                ok.classList.add('show');
            } catch (err) {
                toast('Could not send right now. Please try again later.', 'error', 5500);
            } finally {
                btn.classList.remove('loading'); label.textContent = 'SEND MESSAGE';
            }
        });
    }

    function initYear() { $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); }); }

    // ---------- Boot ----------
    initPreloader();
    document.addEventListener('DOMContentLoaded', () => {
        initNavbar(); initScrollUI(); initSmoothAnchors(); initPageTransitions();
        initImages(); initSplitWords(); initReveal(); initParallax(); initTyping(); initCounters();
        initCards(); initButtons(); initStars(); initCursor();
        initFilter(); initLightbox(); initContact(); initYear();
        console.log('%c🌌 Welcome to ZTA – Zero To Astro 🌌', 'color:#9acd32;font-size:18px;font-weight:bold');
    });
})();
