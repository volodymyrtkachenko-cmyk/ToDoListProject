/* ══════════════════════════════════════════════
   PAGE: BOARD.JS — Тижнева дошка
   ══════════════════════════════════════════════ */

/* ── КОНСТАНТИ ── */
const DAYS_UK = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const MONTHS_GEN = [
    'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
    'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня',
];

const CAT_COLORS = {
    work: '#6c63ff',
    personal: '#34d399',
    health: '#fb923c',
    study: '#f472b6',
    finance: '#fbbf24',
    other: '#8a8a96',
};

const PRI_LABELS = {high: 'Високий', med: 'Середній', low: 'Низький'};

/* ── СТАН ── */
let weekOffset = 0;

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
            <div class="day-tasks" id="tasks-${dateStr}">
                <div class="day-empty">+ додати</div>
            </div>
            <button class="day-add-btn" data-date="${dateStr}">
                <svg viewBox="0 0 12 12"><line x1="6" y1="1" x2="6" y2="11"/><line x1="1" y1="6" x2="11" y2="6"/></svg>
                Додати
            </button>
        `;

        grid.appendChild(col);
    });

    /* Кнопки "Додати" → відкривають модалку створення задачі */
    grid.querySelectorAll('.day-add-btn, .day-empty').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Зупиняємо "спливання" кліку

            // 1. Отримуємо дату з колонки
            const date = btn.dataset.date || btn.closest('.day-col')?.dataset.date;

            // 2. Знаходимо модальне вікно
            const modalEl = document.getElementById('createModal');
            if (!modalEl) {
                console.error("❌ Помилка: Модальне вікно з id='createModal' не знайдено!");
                return;
            }

            // 3. Підставляємо дату в поле "Дедлайн"
            const dateInput = modalEl.querySelector('input[name="deadline"]');
            if (dateInput && date) {
                dateInput.value = date;
            }

            // 4. Відкриваємо модалку через Bootstrap
            try {
                const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
                modal.show();
            } catch (err) {
                console.error("❌ Помилка Bootstrap:", err);
            }
        });
    });
}

/* ── НАВІГАЦІЯ ПО ТИЖНЯХ ── */
document.getElementById('weekPrev')?.addEventListener('click', () => {
    weekOffset--;
    renderBoard();
});
document.getElementById('weekNext')?.addEventListener('click', () => {
    weekOffset++;
    renderBoard();
});
document.getElementById('weekToday')?.addEventListener('click', () => {
    weekOffset = 0;
    renderBoard();
});

/* ── РЕНДЕР ЗАДАЧ ── */
function renderTasks(tasks = []) {
    document.querySelectorAll('.day-tasks').forEach(list => {
        list.innerHTML = '<div class="day-empty">+ додати</div>';
    });

    tasks.forEach(task => {
        const list = document.getElementById(`tasks-${task.date}`);
        if (!list) return;

        list.querySelector('.day-empty')?.remove();

        const priCls = task.priority === 'high' ? 'high'
            : task.priority === 'low' ? 'low' : 'med';

        const card = document.createElement('div');
        card.className = `task-card${task.is_done ? ' is-done' : ''}`;
        card.style.setProperty('--task-color', CAT_COLORS[task.category] ?? CAT_COLORS.other);
        card.dataset.id = task.id;

        card.innerHTML = `
            <div class="task-title">${escHtml(task.title)}</div>
            <div class="task-meta">
                <span class="task-priority ${priCls}">${PRI_LABELS[task.priority] || ''}</span>
                <span class="task-cat">${task.category || ''}</span>
            </div>
        `;

        card.addEventListener('click', () => {
            if (typeof openEditModal === 'function') openEditModal(task.id);
        });

        list.appendChild(card);
    });
}


/* ── СТАРТ ── */
renderBoard();