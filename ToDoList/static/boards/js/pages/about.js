/* ══════════════════════════════════════════════
   PAGE: ABOUT.JS
   ══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    const observer = new IntersectionObserver(
        entries => entries.forEach(e => {
            if (e.isIntersecting) e.target.classList.add('visible');
        }),
        {threshold: 0.15}
    );

    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
});