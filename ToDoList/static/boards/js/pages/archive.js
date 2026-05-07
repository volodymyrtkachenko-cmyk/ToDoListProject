const PRI_LABELS = {high: 'Високий', med: 'Середній', low: 'Низький'};
const MONTHS_GEN = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
let allArchivedTasks = [];

/* ── СТАН ФІЛЬТРІВ ── */
const filters = {dateFrom: '', dateTo: '', category: '', priority: ''};

function escHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtCompleted(timestamp) {
    if (!timestamp) return '—';
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} о ${h}:${m}`;
}

function completedDate(task) {
    if (!task.completed_at) return null;
    const d = new Date(task.completed_at);
    if (isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${da}`;
}

function applyFilters() {
    return allArchivedTasks.filter(t => {
        const cd = completedDate(t);
        if (filters.dateFrom && cd && cd < filters.dateFrom) return false;
        if (filters.dateTo && cd && cd > filters.dateTo) return false;
        if (filters.priority && t.priority !== filters.priority) return false;
        if (filters.category && String(t.category_id) !== String(filters.category)) return false;
        return true;
    });
}

function groupByDate(tasks) {
    const map = new Map();
    tasks.forEach(t => {
        const key = completedDate(t) || 'unknown';
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(t);
    });
    return new Map([...map.entries()].sort((a, b) => b[0].localeCompare(a[0])));
}

function formatGroupHeader(dateStr) {
    if (dateStr === 'unknown') return 'Без дати';
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.getTime() === today.getTime()) return 'Сьогодні';
    if (d.getTime() === yesterday.getTime()) return 'Вчора';
    return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]} ${d.getFullYear()}`;
}

function renderList() {
    const container = document.getElementById('archiveList');
    const empty = document.getElementById('archiveEmpty');
    const counter = document.getElementById('archiveCounter');
    if (!container) return;

    const filtered = applyFilters();
    const grouped = groupByDate(filtered);

    if (counter) counter.textContent = `Завдань: ${filtered.length}`;

    if (filtered.length === 0) {
        container.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }
    if (empty) empty.style.display = 'none';

    container.innerHTML = '';

    let delayIndex = 0; // Лічильник для каскадної анімації

    grouped.forEach((tasks, dateKey) => {
        const header = document.createElement('div');
        header.className = 'archive-group-header';
        header.innerHTML = `
            <span class="archive-group-label">${formatGroupHeader(dateKey)}</span>
            <span class="archive-group-count">${tasks.length}</span>
        `;
        container.appendChild(header);

        tasks.forEach(task => {
            const row = document.createElement('div');
            row.className = 'archive-row';
            row.dataset.id = task.id;
            row.style.setProperty('--task-color', task.category_color || '#8a8a96');

            // Каскадна затримка для красивої появи карток
            row.style.animationDelay = `${delayIndex * 0.04}s`;
            delayIndex++;

            const priClass = escHtml(task.priority);
            const priLabel = PRI_LABELS[task.priority] || '';
            const time = fmtCompleted(task.completed_at);

            row.innerHTML = `
                <div class="archive-row-color-bar"></div>
                <div class="archive-row-body">
                    <div class="archive-row-main">
                        <div class="archive-row-title">${escHtml(task.title)}</div>
                        <div class="archive-row-info">
                            <span class="archive-row-cat">
                                <span class="archive-cat-dot" style="background:${escHtml(task.category_color)}"></span>
                                ${escHtml(task.category_name)}
                            </span>
                            <span class="archive-row-time">
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M8 0a8 8 0 1 0 8 8A8 8 0 0 0 8 0zm0 14A6 6 0 1 1 14 8a6 6 0 0 1-6 6z"/>
                                    <path d="M8 3.5a.5.5 0 0 0-.5.5v4a.5.5 0 0 0 .15.35l2.5 2.5a.5.5 0 0 0 .7-.7L8.5 7.79V4a.5.5 0 0 0-.5-.5z"/>
                                </svg>
                                ${time}
                            </span>
                        </div>
                    </div>
                    <div class="archive-row-right">
                        ${priLabel ? `<span class="task-priority ${priClass}">${priLabel}</span>` : ''}
                        <div class="archive-row-chevron">›</div>
                    </div>
                </div>
            `;
            row.addEventListener('click', () => openViewModal(task.id));
            container.appendChild(row);
        });
    });
}

function bindFilters() {
    const el = id => document.getElementById(id);

    el('filterDateFrom')?.addEventListener('input', e => {
        filters.dateFrom = e.target.value;
        renderList();
    });
    el('filterDateTo')?.addEventListener('input', e => {
        filters.dateTo = e.target.value;
        renderList();
    });
    el('filterPriority')?.addEventListener('change', e => {
        filters.priority = e.target.value;
        renderList();
    });

    // Сайдбар
    document.querySelectorAll('.sb-cat').forEach(catBtn => {
        catBtn.addEventListener('click', (e) => {
            if (e.target.closest('.sb-cat__more')) return; // Ігноруємо кнопку редагування

            const catId = catBtn.dataset.id;
            const isDefault = catBtn.dataset.default === "true";

            document.querySelectorAll('.sb-cat').forEach(c => c.style.background = 'transparent');
            catBtn.style.background = 'rgba(255, 255, 255, 0.08)';

            filters.category = isDefault ? '' : catId;
            renderList();
        });
    });

    el('filterReset')?.addEventListener('click', () => {
        filters.dateFrom = filters.dateTo = filters.category = filters.priority = '';
        ['filterDateFrom', 'filterDateTo', 'filterPriority'].forEach(id => {
            const el2 = el(id);
            if (el2) el2.value = '';
        });

        document.querySelectorAll('.sb-cat').forEach(c => {
            c.style.background = c.dataset.default === "true" ? 'rgba(255, 255, 255, 0.08)' : 'transparent';
        });

        renderList();
    });
}

function openViewModal(taskId) {
    const modalEl = document.getElementById('archiveViewModal');
    if (!modalEl) return;
    const task = allArchivedTasks.find(t => t.id === taskId);
    if (!task) return;

    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };
    set('view-task-title', task.title || '');
    set('view-task-desc', task.description || 'Опис відсутній');
    set('view-task-cat', task.category_name || '');
    set('view-task-date', fmtCompleted(task.completed_at));

    const priEl = document.getElementById('view-task-pri');
    if (priEl) {
        priEl.textContent = PRI_LABELS[task.priority] || '';
        priEl.className = `badge ${task.priority}`;
    }

    const dotEl = document.getElementById('view-preview-dot');
    if (dotEl) dotEl.style.background = task.category_color || '#8a8a96';

    try {
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
    } catch {
        modalEl.classList.add('show');
        modalEl.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const dataEl = document.getElementById('tasks-data');
    if (dataEl) {
        try {
            allArchivedTasks = JSON.parse(dataEl.textContent);
        } catch (e) {
            console.error('Помилка парсингу:', e);
        }
    }
    bindFilters();
    renderList();
});