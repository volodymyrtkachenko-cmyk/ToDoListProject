/* ══════════════════════════════════════════════
   LAYOUT: PROFILE_LAYOUT.JS
   ══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

    /* 1. АКТИВНИЙ ПУНКТ SIDEBAR */
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-link-custom').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });

    /* 2. АВТОЗАКРИТТЯ ПОВІДОМЛЕНЬ */
    const messages = document.querySelector('.contact-messages');
    if (messages) {
        setTimeout(() => {
            messages.style.transition = 'opacity 0.5s ease';
            messages.style.opacity = '0';
            setTimeout(() => messages.remove(), 500);
        }, 5000);
    }
});
