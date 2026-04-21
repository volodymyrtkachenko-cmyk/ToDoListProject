/* ══ Calendar ══ */
const MONTHS_UA = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
    'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
const DAYS_UA = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
const TASKS = new Set([7, 12, 14, 19, 20, 21, 22]);

let calYear = 2025;
let calMonth = 2; // 0-based, 2 = March

function buildCal() {
    const grid = document.getElementById('calGrid');
    const title = document.getElementById('calTitle');
    grid.innerHTML = '';

    title.textContent = MONTHS_UA[calMonth] + ' ' + calYear;

    // day-of-week headers
    DAYS_UA.forEach(d => {
        const el = document.createElement('div');
        el.className = 'cal-dn';
        el.textContent = d;
        grid.appendChild(el);
    });

    const today = new Date();
    const isThisM = (today.getFullYear() === calYear && today.getMonth() === calMonth);
    const todayD = today.getDate();

    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const off = firstDay === 0 ? 6 : firstDay - 1;
    const prevTotal = new Date(calYear, calMonth, 0).getDate();
    const total = new Date(calYear, calMonth + 1, 0).getDate();

    for (let i = 0; i < off; i++) {
        const el = document.createElement('div');
        el.className = 'cal-d other';
        el.textContent = prevTotal - off + 1 + i;
        grid.appendChild(el);
    }
    for (let d = 1; d <= total; d++) {
        const el = document.createElement('div');
        let cls = 'cal-d';
        if (isThisM && d === todayD) cls += ' today';
        el.className = cls;
        el.textContent = d;
        grid.appendChild(el);
    }
    const rest = 42 - off - total;
    for (let i = 1; i <= rest; i++) {
        const el = document.createElement('div');
        el.className = 'cal-d other';
        el.textContent = i;
        grid.appendChild(el);
    }
}

buildCal();

document.getElementById('calPrev').addEventListener('click', () => {
    calMonth--;
    if (calMonth < 0) {
        calMonth = 11;
        calYear--;
    }
    buildCal();
});
document.getElementById('calNext').addEventListener('click', () => {
    calMonth++;
    if (calMonth > 11) {
        calMonth = 0;
        calYear++;
    }
    buildCal();
});

/* ══ Desktop sidebar collapse ══ */
const sbToggleBtn = document.getElementById('sbToggleBtn');
const COLLAPSED_KEY = 'flw_sb_col';

function isMobile() {
    return window.innerWidth < 768;
}

// restore state — only apply on desktop
if (!isMobile() && localStorage.getItem(COLLAPSED_KEY) === '1') {
    document.body.classList.add('sb-col');
}

sbToggleBtn.addEventListener('click', () => {
    if (isMobile()) return; // safety guard
    const isCol = document.body.classList.toggle('sb-col');
    localStorage.setItem(COLLAPSED_KEY, isCol ? '1' : '0');
});

// when resizing back to desktop, restore saved collapse state
window.addEventListener('resize', () => {
    if (!isMobile()) {
        if (localStorage.getItem(COLLAPSED_KEY) === '1') {
            document.body.classList.add('sb-col');
        } else {
            document.body.classList.remove('sb-col');
        }
    } else {
        // on mobile, never have sb-col active
        document.body.classList.remove('sb-col');
    }
});

/* ══ Mobile sidebar toggle ══ */
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const burgerBtn = document.getElementById('burgerBtn');

function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('show');
}

function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
}

burgerBtn.addEventListener('click', () =>
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar()
);
overlay.addEventListener('click', closeSidebar);

/* ══ Settings dropdown ══ */
const setBtn = document.getElementById('setBtn');
const setMenu = document.getElementById('setMenu');
setBtn.addEventListener('click', e => {
    e.stopPropagation();
    setMenu.classList.toggle('show');
});
document.addEventListener('click', () => {
    setMenu.classList.remove('show');
});

