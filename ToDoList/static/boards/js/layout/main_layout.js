const MONTHS_UA = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
const DAYS_UA = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

const _now = new Date();
let calYear = _now.getFullYear();
let calMonth = _now.getMonth();

function buildCal() {
    const grid = document.getElementById('calGrid');
    const title = document.getElementById('calTitle');

    // БЕЗПЕКА: Якщо календаря немає на сторінці, просто виходимо
    if (!grid || !title) return;

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

// БЕЗПЕКА: Використовуємо ?. (optional chaining), щоб не викликати помилку, якщо кнопки немає
document.getElementById('calPrev')?.addEventListener('click', () => {
    if (--calMonth < 0) {
        calMonth = 11;
        calYear--;
    }
    buildCal();
});

document.getElementById('calNext')?.addEventListener('click', () => {
    if (++calMonth > 11) {
        calMonth = 0;
        calYear++;
    }
    buildCal();
});

const COLLAPSED_KEY = 'flw_sb_col';

function isMobile() {
    return window.innerWidth < 768;
}

if (!isMobile() && localStorage.getItem(COLLAPSED_KEY) === '1') {
    document.body.classList.add('sb-col');
}

document.getElementById('sbToggleBtn')?.addEventListener('click', () => {
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

function openSidebar() {
    sidebar?.classList.add('open');
    overlay?.classList.add('show');
}

function closeSidebar() {
    sidebar?.classList.remove('open');
    overlay?.classList.remove('show');
}

document.getElementById('burgerBtn')?.addEventListener('click', () => {
    sidebar?.classList.contains('open') ? closeSidebar() : openSidebar();
});
overlay?.addEventListener('click', closeSidebar);

const setMenu = document.getElementById('setMenu');
document.getElementById('setBtn')?.addEventListener('click', e => {
    e.stopPropagation();
    setMenu?.classList.toggle('show');
});

document.addEventListener('click', () => {
    setMenu?.classList.remove('show');
});

// БЕЗПЕКА: Перевіряємо чи є контейнер для Sortable і чи завантажена сама бібліотека
const sbScroll = document.querySelector('.sb-scroll');
if (sbScroll && typeof Sortable !== 'undefined') {
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

            // БЕЗПЕКА: Надійна перевірка CSRF токена
            const csrfMatch = document.cookie.match(/csrftoken=([\w-]+)/);
            const csrfToken = csrfMatch ? csrfMatch[1] : '';

            // БЕЗПЕКА: Django теги не працюють у зовнішніх JS файлах. Прописуємо шлях жорстко.
            fetch("/boards/reorder_categories/", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                },
                body: JSON.stringify({order}),
            }).catch(err => console.error("Помилка сортування:", err));
        }
    });
}

// --- 1. ВІДКРИТТЯ МОДАЛКИ ТА ПІДСТАНОВКА ДАНИХ ---
document.addEventListener('click', e => {
    const btn = e.target.closest('.sb-cat__more');
    if (!btn) return;
    e.stopPropagation();

    const id = btn.dataset.catId;
    const name = btn.dataset.catName;
    const color = btn.dataset.catColor;

    // БЕЗПЕКА: Перевіряємо наявність інпутів перед їх заповненням
    const inputName = document.getElementById('editCategoryName');
    const inputColor = document.getElementById('editSelectedColor');
    const previewName = document.getElementById('editPreviewName');
    const previewDot = document.getElementById('editPreviewDot');
    const formEdit = document.getElementById('editCategoryForm');
    const formDelete = document.getElementById('deleteCategoryForm');

    if (inputName) inputName.value = name;
    if (inputColor) inputColor.value = color;
    if (previewName) previewName.textContent = name;
    if (previewDot) previewDot.style.backgroundColor = color;
    if (formEdit) formEdit.action = btn.dataset.catUrl;
    if (formDelete) formDelete.action = `/boards/delete_category/${id}/`;

    document.querySelectorAll('#editCategoryModal .temp-color').forEach(el => el.remove());

    const colorPicker = document.querySelector('#editCategoryModal .color-picker');
    if (colorPicker) {
        let existingDot = colorPicker.querySelector(`[data-color="${color}"]`);

        if (!existingDot) {
            existingDot = document.createElement('button');
            existingDot.type = 'button';
            existingDot.className = 'color-dot temp-color';
            existingDot.dataset.color = color;
            existingDot.style.backgroundColor = color;
            colorPicker.prepend(existingDot);
        }

        document.querySelectorAll('#editCategoryModal .color-dot').forEach(dot => {
            dot.classList.remove('active');
        });
        existingDot.classList.add('active');
    }

    const deleteBtn = document.getElementById('deleteCatBtn');
    if (deleteBtn) {
        deleteBtn.onclick = (event) => {
            if (!confirm(`Видалити категорію «${name}»?`)) {
                event.preventDefault();
            }
        };
    }

    const modalEl = document.getElementById('editCategoryModal');
    if (modalEl && typeof bootstrap !== 'undefined') {
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
    }
});

// --- 2. ПЕРЕКЛЮЧЕННЯ КОЛЬОРІВ В МОДАЛЦІ ---
document.addEventListener('click', e => {
    const dot = e.target.closest('#editCategoryModal .color-dot');
    if (!dot) return;

    document.querySelectorAll('#editCategoryModal .color-dot').forEach(d => d.classList.remove('active'));
    dot.classList.add('active');

    const color = dot.dataset.color;
    const inputColor = document.getElementById('editSelectedColor');
    const previewDot = document.getElementById('editPreviewDot');

    if (inputColor) inputColor.value = color;
    if (previewDot) previewDot.style.backgroundColor = color;
});