// ===== SCROLL REVEAL ANIMATION =====
const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
});

revealElements.forEach(el => revealObserver.observe(el));

// ===== ANIMATED STAT COUNTERS =====
const statNumbers = document.querySelectorAll('.stat-number[data-target]');
let countersStarted = false;

function animateCounter(el) {
    const target = parseInt(el.dataset.target);
    const duration = 2000;
    const start = performance.now();

    function easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
    }

    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutQuart(progress);
        const current = Math.round(easedProgress * target);

        el.textContent = current + '+';

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !countersStarted) {
            countersStarted = true;
            statNumbers.forEach((el, i) => {
                // Stagger each counter by 150ms
                setTimeout(() => animateCounter(el), i * 150);
            });
        }
    });
}, {
    threshold: 0.3
});

const statsContainer = document.querySelector('.stats-container');
if (statsContainer) {
    statsObserver.observe(statsContainer);
}

// ===== ACTIVE NAV LINK ON SCROLL =====
const sections = document.querySelectorAll('section[id], main[id]');
const navLinks = document.querySelectorAll('.nav-icon[data-section]');

function updateActiveNav() {
    let current = 'home';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 200;
        if (window.scrollY >= sectionTop) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.section === current) {
            link.classList.add('active');
        }
    });
}

window.addEventListener('scroll', updateActiveNav);

// ===== SMOOTH SCROLL FOR NAV LINKS =====
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});



// ===== THEME TOGGLE =====
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = themeToggle.querySelector('i');

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('portfolio-theme', theme);

    // Update icon
    themeIcon.className = theme === 'light' ? 'fas fa-sun' : 'fas fa-moon';

    // Spin animation
    themeIcon.style.transform = 'rotate(360deg)';
    setTimeout(() => {
        themeIcon.style.transform = '';
    }, 400);
}

// Load saved theme or default to dark
const savedTheme = localStorage.getItem('portfolio-theme') || 'dark';
setTheme(savedTheme);

themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'light' ? 'dark' : 'light');
});

// ===== FLOATING NAV BACKGROUND ON SCROLL =====
const floatingNav = document.getElementById('floating-nav');
window.addEventListener('scroll', () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (window.scrollY > 100) {
        floatingNav.style.background = isLight
            ? 'rgba(255, 255, 255, 0.96)'
            : 'rgba(10, 10, 10, 0.96)';
        floatingNav.style.boxShadow = isLight
            ? '0 4px 30px rgba(0,0,0,0.08)'
            : '0 4px 30px rgba(0,0,0,0.4)';
    } else {
        floatingNav.style.background = isLight
            ? 'rgba(255, 255, 255, 0.85)'
            : 'rgba(20, 20, 20, 0.92)';
        floatingNav.style.boxShadow = 'none';
    }
});

// ===== SCROLL INDICATOR CLICK =====
const scrollIndicator = document.querySelector('.scroll-indicator');
if (scrollIndicator) {
    scrollIndicator.addEventListener('click', () => {
        const projectsSection = document.getElementById('projects');
        if (projectsSection) {
            projectsSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
    scrollIndicator.style.cursor = 'pointer';
}

// ===== CUSTOM CURSOR + MAGNETIC HOVER =====
(function () {
    // Only activate on devices with a fine pointer (no touch)
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;

    let mouseX = -100, mouseY = -100;
    let ringX = -100, ringY = -100;
    let isVisible = false;

    // Track mouse position
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        if (!isVisible) {
            isVisible = true;
            dot.classList.add('visible');
            ring.classList.add('visible');
        }
    });

    // Hide when mouse leaves the viewport
    document.addEventListener('mouseleave', () => {
        isVisible = false;
        dot.classList.remove('visible');
        ring.classList.remove('visible');
    });

    document.addEventListener('mouseenter', () => {
        isVisible = true;
        dot.classList.add('visible');
        ring.classList.add('visible');
    });

    // Click effects
    document.addEventListener('mousedown', () => {
        dot.classList.add('clicking');
        ring.classList.add('clicking');
    });

    document.addEventListener('mouseup', () => {
        dot.classList.remove('clicking');
        ring.classList.remove('clicking');
    });

    // Smooth animation loop — dot follows instantly, ring trails with lerp
    function animateCursor() {
        // Dot follows mouse directly
        dot.style.left = mouseX + 'px';
        dot.style.top = mouseY + 'px';

        // Ring follows with smooth easing (lerp)
        ringX += (mouseX - ringX) * 0.15;
        ringY += (mouseY - ringY) * 0.15;
        ring.style.left = ringX + 'px';
        ring.style.top = ringY + 'px';

        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // ===== CURSOR HOVER STATE ON INTERACTIVE ELEMENTS =====
    const hoverElements = document.querySelectorAll(
        '.nav-icon, .social-links a, .highlight-card, .highlight-arrow, ' +
        '.project-item, .tool-card, .cert-item, .experience-item'
    );

    hoverElements.forEach((el) => {
        el.addEventListener('mouseenter', () => {
            dot.classList.add('hovering');
            ring.classList.add('hovering');
        });

        el.addEventListener('mouseleave', () => {
            dot.classList.remove('hovering');
            ring.classList.remove('hovering');
        });
    });
})();
