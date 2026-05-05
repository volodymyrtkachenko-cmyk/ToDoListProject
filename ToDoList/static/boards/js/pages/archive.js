/* ══════════════════════════════════════════════
   PAGE: ARCHIVE.JS — Архів завдань (Read-only)
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
let allArchivedTasks = [];
let activeCategoryId = null;

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

// Форматування часу. Якщо передано час із буквою Z в кінці (UTC),
// браузер автоматично переведе його в локальний час пристрою.
function formatTime(timestamp) {
    if (!timestamp) return '';
    const d = new Date(timestamp);

    // Перевіряємо, чи це валідна дата
    if (isNaN(d.getTime())) {
        const match = timestamp.match(/^(\d{2}:\d{2})/);
        return match ? match[1] : '';
    }

    // getHours() та getMinutes() автоматично повертають локальний час користувача
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
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

/* ── РЕНДЕР СІТКИ ── */
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
        const isWeekend = idx >= 5;

        const col = document.createElement('div');
        col.className = ['day-col', isToday ? 'is-today' : '', isWeekend ? 'is-weekend' : '']
            .filter(Boolean).join(' ');
        col.dataset.date = dateStr;

        col.innerHTML = `
            <div class="day-head">
                <div class="day-name">${DAYS_UK[date.getDay()]}</div>
                <div class="day-date">
                    ${date.getDate()}
                    ${isToday ? '<span class="today-dot"></span>' : ''}
                </div>
            </div>
            <div class="day-tasks" id="tasks-${dateStr}"></div>
        `;

        grid.appendChild(col);
    });
}

/* ── РЕНДЕР ЗАВДАНЬ ── */
function renderTasks(tasks = []) {
    document.querySelectorAll('.day-tasks').forEach(list => {
        list.innerHTML = '';
    });

    const tasksToRender = activeCategoryId
        ? tasks.filter(t => String(t.category_id) === String(activeCategoryId))
        : tasks;

    tasksToRender.forEach(task => {
        const list = document.getElementById(`tasks-${task.date}`);
        if (!list) return;

        const card = document.createElement('div');
        card.className = 'task-card is-archived';
        card.style.setProperty('--task-color', task.category_color || '#8a8a96');
        card.dataset.id = task.id;

        const exactTime = formatTime(task.completed_at);
        const timeBadge = exactTime ? `<span class="task-time" style="margin-right: 8px; font-size: 0.85em; opacity: 0.8;">⏱ ${exactTime}</span>` : '';

        card.innerHTML = `
            <div class="task-title">${escHtml(task.title)}</div>
            <div class="task-meta">
                ${timeBadge}
                <span class="task-priority ${escHtml(task.priority)}">${PRI_LABELS[task.priority] || ''}</span>
            </div>
        `;

        card.addEventListener('click', () => openViewModal(task.id));
        list.appendChild(card);
    });
}

/* ── ФІЛЬТРАЦІЯ ПО КАТЕГОРІЯХ ── */
function initCategoryFilter() {
    const categories = document.querySelectorAll('.sb-cat');

    categories.forEach(cat => {
        cat.addEventListener('click', function () {
            if (this.classList.contains('active-filter')) return;

            const categoryId = this.getAttribute('data-id');
            const isDefault = this.getAttribute('data-default') === 'true';

            categories.forEach(c => c.classList.remove('active-filter'));
            this.classList.add('active-filter');

            activeCategoryId = isDefault ? null : categoryId;
            renderTasks(allArchivedTasks);
        });
    });
}

/* ── НАВІГАЦІЯ ПО ТИЖНЯХ ── */
document.getElementById('weekPrev')?.addEventListener('click', () => {
    weekOffset--;
    renderBoard();
    renderTasks(allArchivedTasks);
});
document.getElementById('weekNext')?.addEventListener('click', () => {
    weekOffset++;
    renderBoard();
    renderTasks(allArchivedTasks);
});
document.getElementById('weekToday')?.addEventListener('click', () => {
    weekOffset = 0;
    renderBoard();
    renderTasks(allArchivedTasks);
});

/* ── МОДАЛКА ПЕРЕГЛЯДУ (Read-only) ── */
function openViewModal(taskId) {
    const modalEl = document.getElementById('archiveViewModal');
    if (!modalEl) {
        console.warn("Модальне вікно з id='archiveViewModal' не знайдено!");
        return;
    }

    const task = allArchivedTasks.find(t => t.id === taskId);
    if (!task) return;

    const titleEl = document.getElementById('view-task-title');
    const descEl = document.getElementById('view-task-desc');
    const dateEl = document.getElementById('view-task-date');
    const catEl = document.getElementById('view-task-cat');
    const priEl = document.getElementById('view-task-pri');
    const dotEl = document.getElementById('view-preview-dot');

    if (titleEl) titleEl.textContent = task.title || '';
    if (descEl) descEl.textContent = task.description || 'Опис відсутній';

    if (dateEl) {
        const justDate = task.date || '';
        const exactTime = formatTime(task.completed_at);
        dateEl.textContent = exactTime ? `${justDate} о ${exactTime}` : justDate;
    }

    if (catEl) catEl.textContent = task.category_name || '';
    if (dotEl) dotEl.style.background = task.category_color || '#8a8a96';

    if (priEl) {
        priEl.textContent = PRI_LABELS[task.priority] || '';
        priEl.className = `badge ${task.priority}`;
    }

    try {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    } catch (err) {
        console.error('❌ Помилка Bootstrap:', err);
        modalEl.classList.add('show');
        modalEl.style.display = 'block';
    }
}

/* ── СТАРТ ── */
document.addEventListener('DOMContentLoaded', () => {
    const dataEl = document.getElementById('tasks-data');
    if (dataEl) {
        try {
            allArchivedTasks = JSON.parse(dataEl.textContent);
        } catch (e) {
            console.error('❌ Помилка парсингу архівних завдань:', e);
        }
    }

    initCategoryFilter();
    renderBoard();
    renderTasks(allArchivedTasks);
});