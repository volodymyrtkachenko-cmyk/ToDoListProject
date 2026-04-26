/* ══════════════════════════════════════════════
   PAGE: PROFILE.JS
   ══════════════════════════════════════════════ */

function previewAvatar(input) {
    if (!input.files?.length) return;
    document.getElementById('avatarForm').submit();
}

function checkStrength(val) {
    const segs = ['s1', 's2', 's3', 's4'].map(id => document.getElementById(id));
    const label = document.getElementById('strengthLabel');
    segs.forEach(s => (s.className = 'strength-seg'));

    if (!val) {
        label.textContent = '';
        return;
    }

    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    const cls = score <= 1 ? 'active-weak' : score <= 2 ? 'active-medium' : 'active-strong';
    const labels = ['', 'Слабкий', 'Слабкий', 'Середній', 'Надійний'];

    for (let i = 0; i < score; i++) segs[i].classList.add(cls);

    label.textContent = labels[score];
    label.style.color = score <= 1 ? '#e05252' : score <= 2 ? '#f59e0b' : '#22c55e';
}

function checkMatch() {
    const np = document.getElementById('newPass').value;
    const cp = document.getElementById('confirmPass').value;
    const lbl = document.getElementById('matchLabel');

    if (!cp) {
        lbl.textContent = '';
        return;
    }

    if (np === cp) {
        lbl.textContent = 'Паролі збігаються ✓';
        lbl.style.color = '#22c55e';
    } else {
        lbl.textContent = 'Паролі не збігаються';
        lbl.style.color = '#e05252';
    }
}

