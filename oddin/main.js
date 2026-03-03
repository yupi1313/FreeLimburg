/* ═══════════════════════════════════
   ODDIN.GG PRESENTATION — Logic
   ═══════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.slide');
    const navDots = document.querySelectorAll('.nav-dot');
    const progressFill = document.getElementById('progressFill');
    const currentSlideEl = document.getElementById('currentSlide');
    const keyboardHint = document.getElementById('keyboardHint');
    const totalSlides = slides.length;

    let activeIndex = 0;
    let isScrolling = false;

    // ── Initialize ──
    function init() {
        slides[0].classList.add('slide-active');
        updateUI(0);
        createParticles();
        setupIntersectionObserver();
        hideHintAfterDelay();
    }

    // ── Intersection Observer for scroll-snap detection ──
    function setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                    const index = Array.from(slides).indexOf(entry.target);
                    if (index !== -1 && index !== activeIndex) {
                        activeIndex = index;
                        updateUI(index);
                    }
                    entry.target.classList.add('slide-active');
                } else {
                    entry.target.classList.remove('slide-active');
                }
            });
        }, {
            threshold: 0.5,
            root: null
        });

        slides.forEach(slide => observer.observe(slide));
    }

    // ── Update UI Elements ──
    function updateUI(index) {
        // Update nav dots
        navDots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });

        // Update progress bar
        const progress = ((index + 1) / totalSlides) * 100;
        progressFill.style.width = `${progress}%`;

        // Update counter
        currentSlideEl.textContent = String(index + 1).padStart(2, '0');

        // Animate stat number if on risk slide
        if (index === 3) {
            animateStatNumber();
        }
    }

    // ── Navigate to slide ──
    function goToSlide(index) {
        if (index < 0 || index >= totalSlides || isScrolling) return;
        isScrolling = true;
        activeIndex = index;
        slides[index].scrollIntoView({ behavior: 'smooth' });
        updateUI(index);
        setTimeout(() => { isScrolling = false; }, 800);
    }

    // ── Nav dot clicks ──
    navDots.forEach(dot => {
        dot.addEventListener('click', () => {
            const index = parseInt(dot.dataset.slide);
            goToSlide(index);
        });
    });

    // ── Keyboard Navigation ──
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
            e.preventDefault();
            goToSlide(activeIndex + 1);
        } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
            e.preventDefault();
            goToSlide(activeIndex - 1);
        } else if (e.key === 'Home') {
            e.preventDefault();
            goToSlide(0);
        } else if (e.key === 'End') {
            e.preventDefault();
            goToSlide(totalSlides - 1);
        }
    });

    // ── Animate Stat Number ──
    let statAnimated = false;
    function animateStatNumber() {
        if (statAnimated) return;
        statAnimated = true;

        const el = document.querySelector('.stat-number');
        if (!el) return;

        const target = parseInt(el.dataset.target);
        const duration = 2000;
        const start = performance.now();

        function tick(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(eased * target);
            if (progress < 1) {
                requestAnimationFrame(tick);
            }
        }
        requestAnimationFrame(tick);
    }

    // ── Create Hero Particles ──
    function createParticles() {
        const container = document.getElementById('particles');
        if (!container) return;

        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 3 + 1}px;
                height: ${Math.random() * 3 + 1}px;
                background: rgba(0, 229, 160, ${Math.random() * 0.3 + 0.1});
                border-radius: 50%;
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
                animation: particleFloat ${Math.random() * 10 + 10}s linear infinite;
                animation-delay: ${Math.random() * 10}s;
            `;
            container.appendChild(particle);
        }

        // Inject particle animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes particleFloat {
                0% { transform: translateY(0) translateX(0); opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { transform: translateY(-100vh) translateX(${Math.random() > 0.5 ? '' : '-'}${Math.random() * 100}px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    // ── Hide keyboard hint after first navigation ──
    function hideHintAfterDelay() {
        setTimeout(() => {
            if (keyboardHint) keyboardHint.classList.add('hidden');
        }, 5000);
    }

    // ── Start ──
    init();
});
