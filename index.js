import { eventSource, event_types } from '../../../../script.js';

const EXT_ID = 'lorebook-trigger-tracker';

let lastActivated = [];
let panelOpen = false;

function getEntryName(entry) {
    return entry?.comment
        || entry?.name
        || entry?.title
        || `Entry ${entry?.uid ?? '?'}`;
}

function getEntryTrigger(entry) {
    const keys = entry?.key ?? entry?.keys ?? '';

    if (Array.isArray(keys)) {
        return keys.join(', ');
    }

    return String(keys || '');
}

function createUI() {
    if (document.getElementById(`${EXT_ID}-button`)) {
        return;
    }

    const button = document.createElement('button');

    button.id = `${EXT_ID}-button`;
    button.type = 'button';
    button.title = 'Lorebook Trigger Tracker';

    button.innerHTML = `
        <span class="ltt-icon">◉</span>
        <sup class="ltt-count">0</sup>
    `;

    const panel = document.createElement('div');

    panel.id = `${EXT_ID}-panel`;

    panel.innerHTML = `
        <div class="ltt-header">
            <span>WORLD INFO</span>
            <button type="button" class="ltt-close">×</button>
        </div>

        <div class="ltt-content">
            <div class="ltt-empty">
                No World Info activated yet.
            </div>
        </div>
    `;

    document.body.appendChild(panel);
    document.body.appendChild(button);

    button.addEventListener('click', () => {
        panelOpen = !panelOpen;
        panel.classList.toggle('ltt-open', panelOpen);
    });

    panel.querySelector('.ltt-close').addEventListener('click', () => {
        panelOpen = false;
        panel.classList.remove('ltt-open');
    });
}

function renderEntries(entries) {
    const panel = document.getElementById(`${EXT_ID}-panel`);
    const button = document.getElementById(`${EXT_ID}-button`);

    if (!panel || !button) {
        return;
    }

    const count = button.querySelector('.ltt-count');

    count.textContent = String(entries.length);

    const content = panel.querySelector('.ltt-content');

    if (!entries.length) {
        content.innerHTML = `
            <div class="ltt-empty">
                No World Info activated.
            </div>
        `;

        return;
    }

    content.innerHTML = entries.map((entry) => {
        const name = escapeHtml(getEntryName(entry));

        const trigger = escapeHtml(
            getEntryTrigger(entry) || 'Unknown'
        );

        const uid = escapeHtml(
            String(entry?.uid ?? '?')
        );

        return `
            <div class="ltt-entry">

                <div class="ltt-entry-title">
                    ✓ ${name}
                </div>

                <div class="ltt-detail">
                    Trigger: "${trigger}"
                </div>

                <div class="ltt-detail">
                    Entry: #${uid}
                </div>

            </div>
        `;
    }).join('');
}

function escapeHtml(value) {
    return value.replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[char]));
}

function onWorldInfoActivated(data) {
    const entries =
        Array.isArray(data?.allActivatedEntries)
            ? data.allActivatedEntries
            : Array.isArray(data)
                ? data
                : [];

    lastActivated = entries;

    renderEntries(lastActivated);
}

function init() {
    createUI();

    if (
        eventSource &&
        event_types?.WORLD_INFO_ACTIVATED
    ) {
        eventSource.on(
            event_types.WORLD_INFO_ACTIVATED,
            onWorldInfoActivated
        );
    }
}

if (document.readyState === 'loading') {

    document.addEventListener(
        'DOMContentLoaded',
        init,
        { once: true }
    );

} else {

    init();

}
