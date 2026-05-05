/* ══════════════════════════════════════════════
   PAGE: BOARD.JS — Тижнева дошка (Фінальна версія)
   ══════════════════════════════════════════════ */

/* ── КОНСТАНТИ ── */
const DAYS_UK = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const MONTHS_GEN = [
    'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
    'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня',
];

const PRI_LABELS = {high: 'Високий', med: 'Середній', low: 'Низький'};

/* ── СТАН ── */
let weekOffset = 0;
let allTasks = []; // Масив для зберігання всіх завдань з бекенду
let activeCategoryId = null; // Зберігає ID активної категорії для фільтрації

/* ── ДОПОМІЖНІ ФУНКЦІЇ ── */
function fmt(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getMonday(offset = 0) {
    const d = new Date();
    const dow = d.getDay();
    d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7);
    d.setHours(0, 0, 0, 0);
    return d;
}

function getWeekDates(offset = 0) {
    const mon = getMonday(offset);
    return Array.from({length: 7}, (_, i) => {
        const d = new Date(mon);
        d.setDate(mon.getDate() + i);
        return d;
    });
}

function escHtml(s) {
    if (!s) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/* ── ЗАГОЛОВОК ТИЖНЯ ── */
function renderWeekLabel(dates) {
    const lbl = document.getElementById('weekLabel');
    if (!lbl) return;

    const s = dates[0];
    const e = dates[6];

    lbl.textContent = s.getMonth() === e.getMonth()
        ? `${s.getDate()}–${e.getDate()} ${MONTHS_GEN[s.getMonth()]} ${s.getFullYear()}`
        : `${s.getDate()} ${MONTHS_GEN[s.getMonth()]} – ${e.getDate()} ${MONTHS_GEN[e.getMonth()]}`;
}

/* ── РЕНДЕР ДОШКИ ── */
function renderBoard() {
    const grid = document.getElementById('boardGrid');
    if (!grid) return;

    const today = fmt(new Date());
    const dates = getWeekDates(weekOffset);

    renderWeekLabel(dates);
    grid.innerHTML = '';

    dates.forEach((date, idx) => {
        const dateStr = fmt(date);
        const isToday = dateStr === today;
        const isPast = dateStr < today;
        const isWeekend = idx >= 5;

        const col = document.createElement('div');
        col.className = ['day-col', isToday ? 'is-today' : '', isWeekend ? 'is-weekend' : '']
            .filter(Boolean).join(' ');
        col.dataset.date = dateStr;

        // Рендеримо кнопки лише якщо це не минулий день
        col.innerHTML = `
            <div class="day-head">
                <div class="day-name">${DAYS_UK[date.getDay()]}</div>
                <div class="day-date">
                    ${date.getDate()}
                    ${isToday ? '<span class="today-dot"></span>' : ''}
                </div>
            </div>
            <div class="day-tasks" id="tasks-${dateStr}">
                ${!isPast
            ? '<div class="day-empty">+ додати</div>'
            : '<div class="past-empty" style="display: none;"></div>'}
            </div>
            ${!isPast ? `
            <button class="day-add-btn" data-date="${dateStr}">
                <svg viewBox="0 0 12 12"><line x1="6" y1="1" x2="6" y2="11"/><line x1="1" y1="6" x2="11" y2="6"/></svg>
                Додати
            </button>` : ''}
        `;

        grid.appendChild(col);
    });
}

/* ── РЕНДЕР ЗАДАЧ ── */
function renderTasks(tasks = []) {
    const today = fmt(new Date());

    document.querySelectorAll('.day-tasks').forEach(list => {
        const dateStr = list.id.replace('tasks-', '');
        const isPast = dateStr < today;

        list.innerHTML = !isPast
            ? '<div class="day-empty">+ додати</div>'
            : '<div class="past-empty" style="display: none;"></div>';
    });

    const tasksToRender = activeCategoryId
        ? tasks.filter(t => String(t.category_id) === String(activeCategoryId))
        : tasks;

    tasksToRender.forEach(task => {
        const list = document.getElementById(`tasks-${task.date}`);
        if (!list) return;

        list.querySelector('.day-empty')?.remove();
        list.querySelector('.past-empty')?.remove();

        let classes = 'task-card';
        if (task.is_done) classes += ' is-done';
        if (task.is_overdue) classes += ' is-overdue';

        const card = document.createElement('div');
        card.className = classes;
        card.style.setProperty('--task-color', task.category_color || '#8a8a96');
        card.dataset.id = task.id;

        card.innerHTML = `
            <div class="task-title">${escHtml(task.title)}</div>
            <div class="task-meta">
                <span class="task-priority ${task.priority}">${PRI_LABELS[task.priority] || ''}</span>
                </div>
        `;

        card.addEventListener('click', () => {
            openEditModal(task.id);
        });

        list.appendChild(card);
    });
}

/* ── ЛОГІКА ФІЛЬТРАЦІЇ ПО КАТЕГОРІЯХ ── */
function initCategoryFilter() {
    const categories = document.querySelectorAll('.sb-cat');

    categories.forEach(cat => {
        cat.addEventListener('click', function (e) {
            if (e.target.closest('.sb-cat__delete')) return;
            if (this.classList.contains('active-filter')) return;

            const categoryId = this.getAttribute('data-id');
            const isDefault = this.getAttribute('data-default') === 'true';

            categories.forEach(c => c.classList.remove('active-filter'));
            this.classList.add('active-filter');

            activeCategoryId = isDefault ? null : categoryId;
            renderTasks(allTasks);
        });
    });
}


/* ── НАВІГАЦІЯ ПО ТИЖНЯХ ── */
document.getElementById('weekPrev')?.addEventListener('click', () => {
    weekOffset--;
    renderBoard();
    renderTasks(allTasks);
});
document.getElementById('weekNext')?.addEventListener('click', () => {
    weekOffset++;
    renderBoard();
    renderTasks(allTasks);
});
document.getElementById('weekToday')?.addEventListener('click', () => {
    weekOffset = 0;
    renderBoard();
    renderTasks(allTasks);
});

/* ── ВІДКРИТТЯ МОДАЛКИ СТВОРЕННЯ (EVENT DELEGATION) ── */
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.day-add-btn, .day-empty');
    if (!btn) return;

    e.preventDefault();

    const date = btn.dataset.date || btn.closest('.day-col')?.dataset.date;
    const modalEl = document.getElementById('createModal');

    if (!modalEl) {
        console.error("❌ Помилка: Модальне вікно з id='createModal' не знайдено!");
        return;
    }

    const dateInput = modalEl.querySelector('input[name="due_date"]');
    if (dateInput && date) {
        dateInput.value = date;
    }

    try {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    } catch (err) {
        console.error("❌ Помилка Bootstrap:", err);
        modalEl.classList.add('show');
        modalEl.style.display = 'block';
    }
});

/* ── ВІДКРИТТЯ МОДАЛКИ РЕДАГУВАННЯ ── */
function openEditModal(taskId) {
    const modalEl = document.getElementById('taskModal');
    if (!modalEl) {
        console.warn("Модальне вікно з id='taskModal' ще не створено!");
        return;
    }

    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;

    // 1. Заповнюємо базові поля
    document.getElementById('edit-task-id').value = task.id;
    document.getElementById('delete-task-id').value = task.id; 
    document.getElementById('edit-task-title').value = task.title;
    document.getElementById('edit-task-desc').value = task.description || '';

    const dateInput = document.getElementById('edit-task-date');
    if (dateInput) dateInput.value = task.date || '';

    const previewDot = document.getElementById('edit-preview-dot');
    const previewCat = document.getElementById('edit-preview-cat');
    const previewPri = document.getElementById('edit-preview-pri');

    if (previewDot) previewDot.style.background = task.category_color;
    if (previewCat) previewCat.textContent = task.category_name;

    if (previewPri) {
        previewPri.textContent = PRI_LABELS[task.priority] || '';
        // Важливо: очищаємо старі класи і додаємо лише актуальний пріоритет
        previewPri.className = `badge ${task.priority}`;
    }

    if (previewDot) previewDot.style.background = task.category_color;
    if (previewCat) previewCat.textContent = task.category_name;
    if (previewPri) {
        previewPri.textContent = PRI_LABELS[task.priority] || '';
        // Очищаємо попередні класи пріоритету і додаємо новий
        previewPri.className = `badge ${task.priority}`;
    }

    // 3. Відмічаємо радіокнопку категорії
    const catRadios = document.querySelectorAll('.edit-category-radio');
    catRadios.forEach(radio => {
        radio.checked = String(radio.value) === String(task.category_id);
    });

    // 4. Відмічаємо радіокнопку пріоритету
    const priRadios = document.querySelectorAll('.edit-priority-radio');
    const priMapReverse = {'low': '1', 'med': '2', 'high': '3'};
    priRadios.forEach(radio => {
        radio.checked = radio.value === priMapReverse[task.priority];
    });

    // 5. Відкриваємо вікно
    try {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    } catch (err) {
        modalEl.classList.add('show');
        modalEl.style.display = 'block';
    }
}

/* ── СТАРТ ДОДАТКУ ── */
document.addEventListener('DOMContentLoaded', () => {
    const tasksDataElement = document.getElementById('tasks-data');
    if (tasksDataElement) {
        try {
            allTasks = JSON.parse(tasksDataElement.textContent);
        } catch (e) {
            console.error("❌ Помилка парсингу завдань:", e);
        }
    }

    initCategoryFilter();
    renderBoard();
    renderTasks(allTasks);
});
