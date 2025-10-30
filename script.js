function scrollSlider(id, distance) {
    const el = document.getElementById(id);
    if (el) el.scrollBy({ left: distance, behavior: 'smooth' });
}

document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const h = a.getAttribute('href');
        if (h.startsWith('#') && h !== '#') {
            e.preventDefault();
            document.querySelector(h).scrollIntoView({ behavior: 'smooth' });
            const c = document.getElementById('navbarMenu');
            if (c && bootstrap.Collapse.getInstance(c)) bootstrap.Collapse.getInstance(c).hide();
        }
    });
});

const polaroid = document.getElementById('polaroid-slider');
if (polaroid) {
    let down = false, x, left;
    polaroid.addEventListener('mousedown', e => { down = true; polaroid.style.cursor = 'grabbing'; x = e.pageX - polaroid.offsetLeft; left = polaroid.scrollLeft; });
    polaroid.addEventListener('mouseleave', () => { down = false; polaroid.style.cursor = 'grab'; });
    polaroid.addEventListener('mouseup', () => { down = false; polaroid.style.cursor = 'grab'; });
    polaroid.addEventListener('mousemove', e => {
        if (!down) return;
        e.preventDefault();
        const walk = (e.pageX - polaroid.offsetLeft - x) * 2;
        polaroid.scrollLeft = left - walk;
    });
}

const darkToggle = document.querySelector('#darkModeToggle a');
if (darkToggle) {
    darkToggle.addEventListener('click', e => {
        e.preventDefault();
        document.body.classList.toggle('dark-mode');
        const i = darkToggle.querySelector('i');
        i.classList.toggle('bi-moon-stars-fill');
        i.classList.toggle('bi-sun-fill');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    });
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        darkToggle.querySelector('i').classList.replace('bi-moon-stars-fill', 'bi-sun-fill');
    }
}

// JUEGO COMPLETO - CORREGIDO: PAUSA FUNCIONA 100%
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('gameContainer');
    const inner = document.getElementById('gameInner');
    const basket = document.getElementById('basket');
    const pauseBtn = document.getElementById('pauseButton');
    const specialDisp = document.getElementById('specialPhotoDisplay');
    const specialImg = document.getElementById('specialPhotoImg');
    const prize = document.getElementById('prizeNotification');
    const pausedOv = document.getElementById('gamePausedOverlay');

    const IMAGES = ['capt_web/fotojuego1.png','capt_web/fotojuego2.png','capt_web/fotojuego3.png','capt_web/fotojuego4.png'];
    const imgs = IMAGES.map(s => { const i = new Image(); i.src = s; return i; });

    let active = false, items = [], paused = false, special = '', caught = 0, interval = null;
    const NEED = 5;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ease = reduced ? 'none' : 'power1.out';

    // === ANUNCIADOR ACCESIBLE ===
    function announce(message) {
        const announcer = document.createElement('div');
        announcer.setAttribute('aria-live', 'assertive');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.className = 'sr-only';
        announcer.textContent = message;
        document.body.appendChild(announcer);
        setTimeout(() => announcer.remove(), 1000);
    }

    function start() {
        caught = 0;
        special = IMAGES[Math.floor(Math.random() * IMAGES.length)];
        specialImg.src = special;
        specialImg.alt = 'Foto especial a atrapar';
        specialDisp.classList.remove('d-none');
        announce('Foto especial mostrada. Atrápala 5 veces para ganar.');

        setTimeout(() => {
            specialDisp.classList.add('d-none');
            active = true; 
            paused = false;
            pauseBtn.style.display = 'block';
            pausedOv.style.display = 'none';
            pauseBtn.textContent = 'PAUSA';
            announce('Juego iniciado. Mueve la cesta para atrapar las fotos.');

            // === INTERVAL CORREGIDO: SE PUEDE PAUSAR ===
            if (interval) clearInterval(interval);
            interval = setInterval(() => {
                if (active && !paused) spawn();
            }, 1500);

        }, 3000);
    }

    function spawn() {
        if (!active || paused) return;
        const img = imgs[Math.floor(Math.random() * imgs.length)];
        const el = document.createElement('img');
        el.src = img.src; 
        el.className = 'falling-item';
        el.alt = 'Prenda cayendo';
        el.style.left = Math.random() * (container.offsetWidth - 100) + 50 + 'px';
        el.style.top = '-120px';
        inner.appendChild(el);

        const isSpecial = el.src.includes(special.split('/').pop());
        const dur = 4 + Math.random() * 2;
        const rot = Math.random() * 180 - 90;

        gsap.to(el, {
            y: container.offsetHeight + 100,
            rotation: rot,
            ease,
            duration: dur,
            onComplete: () => el.remove()
        });
        items.push({ el, isSpecial });
    }

    // === MOVIMIENTO DE CESTA ===
    container.addEventListener('mousemove', e => {
        if (!active || paused) return;
        const r = container.getBoundingClientRect();
        const x = e.clientX - r.left;
        const w = basket.offsetWidth;
        let t = x - w / 2;
        t = Math.max(0, Math.min(t, container.offsetWidth - w));
        basket.style.left = t + 'px';
    });

    container.addEventListener('touchmove', e => {
    if (!active || paused) return;
    e.preventDefault(); // ← Ahora SÍ funciona en iOS
    const t = e.touches[0];
    const r = container.getBoundingClientRect();
    const x = t.clientX - r.left;
    const w = basket.offsetWidth;
    let target = x - w / 2;
    target = Math.max(0, Math.min(target, container.offsetWidth - w));
    basket.style.left = target + 'px';
    }, { passive: false });
 
    // === PAUSA CON BOTÓN ===
    pauseBtn.addEventListener('click', () => {
        if (!active) return;
        paused = !paused;
        pauseBtn.textContent = paused ? 'REANUDAR' : 'PAUSA';
        pausedOv.style.display = paused ? 'flex' : 'none';
        announce(paused ? 'Juego pausado.' : 'Juego reanudado.');
    });

    // === PAUSA CON DOBLE CLIC ===
    container.addEventListener('dblclick', e => {
        e.preventDefault();
        if (!active) return;
        paused = !paused;
        pauseBtn.textContent = paused ? 'REANUDAR' : 'PAUSA';
        pausedOv.style.display = paused ? 'flex' : 'none';
        announce(paused ? 'Juego pausado por doble clic.' : 'Juego reanudado por doble clic.');
    });

    // === COLISIÓN Y TICKER ===
    gsap.ticker.add(() => {
        if (!active || paused) return;
        items = items.filter(i => {
            if (collide(i.el)) {
                if (i.isSpecial) {
                    caught++;
                    gsap.to(i.el, { scale: 1.8, opacity: 0, duration: 0.4, ease: 'back.in', onComplete: () => i.el.remove() });
                    announce(`¡Foto especial atrapada! Quedan ${NEED - caught}.`);
                    if (caught >= NEED) {
                        setTimeout(win, 500);
                    }
                } else {
                    gsap.to(i.el, { scale: 1.5, opacity: 0, duration: 0.3, ease: 'back.in', onComplete: () => i.el.remove() });
                }
                return false;
            }
            return true;
        });
    });

    function collide(el) {
        const a = el.getBoundingClientRect();
        const b = basket.getBoundingClientRect();
        return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
    }

    function win() {
        active = false; 
        paused = true;
        clearInterval(interval);
        interval = null;
        pauseBtn.style.display = 'none';
        pausedOv.style.display = 'none';
        prize.classList.remove('d-none');
        announce('¡Premio desbloqueado! Has atrapado la Polaroid especial 5 veces.');
        setTimeout(() => {
            prize.classList.add('d-none');
            items.forEach(i => i.el.remove());
            items = [];
            start();
        }, 4000);
    }

    // === INICIO ===
    start();
});

// TICKER
document.addEventListener('DOMContentLoaded', () => {
    const w = document.querySelector('.ticker-wrapper');
    const c = document.querySelector('.ticker-content');
    if (!w || !c) return;
    const clone = c.cloneNode(true);
    w.appendChild(clone);
    const width = c.offsetWidth;
    gsap.set(w, { x: 0 });
    gsap.timeline({ repeat: -1 }).to(w, { x: -width, duration: 15, ease: "none" }).to(w, { x: 0, duration: 0 });
});

// FORMULARIOS
document.querySelectorAll('form[novalidate]').forEach(f => {
    f.addEventListener('submit', e => {
        e.preventDefault();
        let ok = true;
        f.querySelectorAll('[required]').forEach(i => {
            if (!i.value.trim() || (i.type === 'email' && !i.validity.valid)) {
                i.classList.add('is-invalid');
                ok = false;
            } else i.classList.remove('is-invalid');
        });
        if (ok) {
            alert('¡Enviado!');
            f.reset();
        }
    });
});