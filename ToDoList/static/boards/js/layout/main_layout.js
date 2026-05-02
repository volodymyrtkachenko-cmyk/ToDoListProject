/* ══════════════════════════════════════════════
   MAIN.JS — Sidebar, Calendar, Settings dropdown
   ══════════════════════════════════════════════ */


/* ══ МІНІ-КАЛЕНДАР ══ */

const MONTHS_UA = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
    'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
const DAYS_UA = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

const _now = new Date();
let calYear = _now.getFullYear();
let calMonth = _now.getMonth();

function buildCal() {
    const grid = document.getElementById('calGrid');
    const title = document.getElementById('calTitle');
    grid.innerHTML = '';

    title.textContent = MONTHS_UA[calMonth] + ' ' + calYear;

    /* Заголовки днів тижня */
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
    const off = firstDay === 0 ? 6 : firstDay - 1;   /* зсув до Пн */
    const prevTotal = new Date(calYear, calMonth, 0).getDate();
    const total = new Date(calYear, calMonth + 1, 0).getDate();

    /* Дні з попереднього місяця */
    for (let i = 0; i < off; i++) {
        const el = document.createElement('div');
        el.className = 'cal-d other';
        el.textContent = prevTotal - off + 1 + i;
        grid.appendChild(el);
    }

    /* Дні поточного місяця */
    for (let d = 1; d <= total; d++) {
        const el = document.createElement('div');
        el.className = (isThisM && d === todayD) ? 'cal-d today' : 'cal-d';
        el.textContent = d;
        grid.appendChild(el);
    }

    /* Дні наступного місяця (до 42 комірок) */
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
    if (--calMonth < 0) {
        calMonth = 11;
        calYear--;
    }
    buildCal();
});

document.getElementById('calNext').addEventListener('click', () => {
    if (++calMonth > 11) {
        calMonth = 0;
        calYear++;
    }
    buildCal();
});


/* ══ SIDEBAR — DESKTOP COLLAPSE ══ */

const sbToggleBtn = document.getElementById('sbToggleBtn');
const COLLAPSED_KEY = 'flw_sb_col';

function isMobile() {
    return window.innerWidth < 768;
}

/* Відновлюємо стан тільки на desktop */
if (!isMobile() && localStorage.getItem(COLLAPSED_KEY) === '1') {
    document.body.classList.add('sb-col');
}

sbToggleBtn.addEventListener('click', () => {
    if (isMobile()) return;
    const isCol = document.body.classList.toggle('sb-col');
    localStorage.setItem(COLLAPSED_KEY, isCol ? '1' : '0');
});

/* При зміні розміру вікна синхронізуємо стан */
window.addEventListener('resize', () => {
    if (!isMobile()) {
        document.body.classList.toggle('sb-col', localStorage.getItem(COLLAPSED_KEY) === '1');
    } else {
        document.body.classList.remove('sb-col');
    }
});


/* ══ SIDEBAR — МОБІЛЬНЕ МЕНЮ ══ */

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


/* ══ SETTINGS DROPDOWN ══ */

const setBtn = document.getElementById('setBtn');
const setMenu = document.getElementById('setMenu');

setBtn.addEventListener('click', e => {
    e.stopPropagation();
    setMenu.classList.toggle('show');
});

document.addEventListener('click', () => {
    setMenu.classList.remove('show');
});

const sbScroll = document.querySelector('.sb-scroll');

Sortable.create(sbScroll, {
    animation: 150,
    draggable: '.sb-cat',
    ghostClass: 'sb-cat--ghost',
    filter: '[data-default="true"]',         // заборонити тягати дефолтну
    onMove(evt) {
        // заборонити ставити інші категорії ПЕРЕД дефолтною
        if (evt.related.dataset.default === 'true') return false;
    },
    onEnd() {
        const order = [...sbScroll.querySelectorAll('.sb-cat[data-id]')]
            .map((el, index) => ({id: el.dataset.id, order: index}));

        fetch("{% url 'reorder_categories' %}", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.cookie.match(/csrftoken=([\w-]+)/)[1],
            },
            body: JSON.stringify({order}),
        });
    }
});