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

    DAYS_UA.forEach(d => {
        const el = document.createElement('div');
        el.className = 'cal-dn';
        el.textContent = d;
        grid.appendChild(el);
    });

    const today = new Date();
    const isThisM = today.getFullYear() === calYear && today.getMonth() === calMonth;
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
        el.className = (isThisM && d === todayD) ? 'cal-d today' : 'cal-d';
        el.textContent = d;
        el.style.cursor = 'pointer';

        el.addEventListener('click', () => {
            const clicked = new Date(calYear, calMonth, d);
            clicked.setHours(0, 0, 0, 0);
            document.dispatchEvent(new CustomEvent('calDateSelected', {detail: {date: clicked}}));
        });

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

const sbToggleBtn = document.getElementById('sbToggleBtn');
const COLLAPSED_KEY = 'flw_sb_col';

function isMobile() {
    return window.innerWidth < 768;
}

if (!isMobile() && localStorage.getItem(COLLAPSED_KEY) === '1') {
    document.body.classList.add('sb-col');
}

sbToggleBtn.addEventListener('click', () => {
    if (isMobile()) return;
    const isCol = document.body.classList.toggle('sb-col');
    localStorage.setItem(COLLAPSED_KEY, isCol ? '1' : '0');
});

window.addEventListener('resize', () => {
    if (!isMobile()) {
        document.body.classList.toggle('sb-col', localStorage.getItem(COLLAPSED_KEY) === '1');
    } else {
        document.body.classList.remove('sb-col');
    }
});

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
    filter: '[data-default="true"]',
    onMove(evt) {
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

// --- 1. ВІДКРИТТЯ МОДАЛКИ ТА ПІДСТАНОВКА ДАНИХ ---
document.addEventListener('click', e => {
    const btn = e.target.closest('.sb-cat__more');
    if (!btn) return;
    e.stopPropagation();

    const id = btn.dataset.catId;
    const name = btn.dataset.catName;
    const color = btn.dataset.catColor;

    // Заповнюємо базові поля
    document.getElementById('editCategoryName').value = name;
    document.getElementById('editSelectedColor').value = color;
    document.getElementById('editPreviewName').textContent = name;
    document.getElementById('editPreviewDot').style.backgroundColor = color;
    document.getElementById('editCategoryForm').action = btn.dataset.catUrl;
    document.getElementById('deleteCategoryForm').action = `/boards/delete_category/${id}/`;

    // Видаляємо всі "тимчасові" кольори з попередніх відкриттів (щоб не дублювалися)
    document.querySelectorAll('#editCategoryModal .temp-color').forEach(el => el.remove());

    const colorPicker = document.querySelector('#editCategoryModal .color-picker');
    let existingDot = colorPicker.querySelector(`[data-color="${color}"]`);

    // Якщо поточного кольору категорії немає у списку "вільних", додаємо його візуально
    if (!existingDot) {
        existingDot = document.createElement('button');
        existingDot.type = 'button';
        existingDot.className = 'color-dot temp-color'; // temp-color дозволить видалити його потім
        existingDot.dataset.color = color;
        existingDot.style.backgroundColor = color;
        colorPicker.prepend(existingDot);
    }

    // Прибираємо виділення з усіх і виділяємо поточний
    document.querySelectorAll('#editCategoryModal .color-dot').forEach(dot => {
        dot.classList.remove('active');
    });
    existingDot.classList.add('active');

    // Кнопка видалення
    document.getElementById('deleteCatBtn').onclick = (event) => {
        if (!confirm(`Видалити категорію «${name}»?`)) {
            event.preventDefault();
        }
    };

    bootstrap.Modal.getOrCreateInstance(document.getElementById('editCategoryModal')).show();
});

// --- 2. ПЕРЕКЛЮЧЕННЯ КОЛЬОРІВ В МОДАЛЦІ (Замість onclick в HTML) ---
document.addEventListener('click', e => {
    // Шукаємо, чи клікнули саме по крапці кольору в модалці редагування
    const dot = e.target.closest('#editCategoryModal .color-dot');
    if (!dot) return;

    // Прибираємо клас 'active' у всіх інших крапок
    document.querySelectorAll('#editCategoryModal .color-dot').forEach(d => d.classList.remove('active'));

    // Додаємо клас тій, по якій клікнули
    dot.classList.add('active');

    // Оновлюємо прихований input та крапку прев'ю
    const color = dot.dataset.color;
    document.getElementById('editSelectedColor').value = color;
    document.getElementById('editPreviewDot').style.backgroundColor = color;
});