const EXT_ID = 'lorebook-trigger-tracker';

let activatedEntries = [];
let worldInfoEntries = [];
let panelOpen = false;
let initialized = false;

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    }[char]));
}

function getEntryName(entry) {
    return (
        entry?.comment ||
        entry?.name ||
        entry?.title ||
        `Entry ${entry?.uid ?? '?'}`
    );
}

function getEntryKeys(entry) {
    const keys = entry?.key ?? [];

    if (Array.isArray(keys)) {
        return keys;
    }

    return keys
        ? [String(keys)]
        : [];
}

function createButton() {
    if (document.getElementById(`${EXT_ID}-button`)) {
        return;
    }

    const button = document.createElement('button');

    button.id = `${EXT_ID}-button`;
    button.type = 'button';
    button.title = 'Lorebook Trigger Tracker';

    button.innerHTML = `
        <span>◉</span>
        <sup>0</sup>
    `;

    button.addEventListener('click', () => {
        togglePanel();
    });

    document.body.appendChild(button);

    console.log(
        '[Lorebook Trigger Tracker] Button created.'
    );
}

function createPanel() {
    if (document.getElementById(`${EXT_ID}-panel`)) {
        return;
    }

    const panel = document.createElement('div');

    panel.id = `${EXT_ID}-panel`;

    panel.innerHTML = `
        <div class="ltt-header">
            <span>WORLD INFO</span>

            <button
                type="button"
                class="ltt-close"
            >
                ×
            </button>
        </div>

        <div class="ltt-content">
            <div class="ltt-empty">
                No World Info activated yet.
            </div>
        </div>
    `;

    document.body.appendChild(panel);

    panel
        .querySelector('.ltt-close')
        .addEventListener('click', () => {
            panelOpen = false;
            panel.classList.remove('ltt-open');
        });
}

function togglePanel() {
    const panel = document.getElementById(
        `${EXT_ID}-panel`
    );

    if (!panel) {
        return;
    }

    panelOpen = !panelOpen;

    panel.classList.toggle(
        'ltt-open',
        panelOpen
    );
}

function updateCount() {
    const button = document.getElementById(
        `${EXT_ID}-button`
    );

    if (!button) {
        return;
    }

    const counter = button.querySelector('sup');

    if (!counter) {
        return;
    }

    counter.textContent =
        activatedEntries.length > 99
            ? '99+'
            : String(activatedEntries.length);
}

function renderPanel() {
    const panel = document.getElementById(
        `${EXT_ID}-panel`
    );

    if (!panel) {
        return;
    }

    const content = panel.querySelector(
        '.ltt-content'
    );

    if (!activatedEntries.length) {
        content.innerHTML = `
            <div class="ltt-empty">
                No World Info activated.
            </div>
        `;

        return;
    }

    const activatedIds = new Set(
        activatedEntries.map(
            entry => String(entry?.uid)
        )
    );

    const entriesToShow =
        worldInfoEntries.length
            ? worldInfoEntries
            : activatedEntries;

    content.innerHTML = entriesToShow
        .map(entry => {

            const uid =
                String(entry?.uid ?? '');

            const active =
                activatedIds.has(uid);

            const name =
                escapeHtml(
                    getEntryName(entry)
                );

            const keys =
                getEntryKeys(entry);

            const trigger =
                keys.length
                    ? escapeHtml(
                        keys.join('", "')
                    )
                    : 'Unknown';

            if (active) {
                return `
                    <div class="ltt-entry active">

                        <div class="ltt-entry-title">
                            ✓ ${name}
                        </div>

                        <div class="ltt-detail">
                            Trigger: "${trigger}"
                        </div>

                        <div class="ltt-detail">
                            Entry: #${escapeHtml(uid)}
                        </div>

                    </div>
                `;
            }

            return `
                <div class="ltt-entry inactive">

                    <div class="ltt-entry-title">
                        ✗ ${name}
                    </div>

                    <div class="ltt-detail">
                        No trigger
                    </div>

                </div>
            `;
        })
        .join('');
}

function handleWorldInfoActivated(data) {

    /*
     * SillyTavern currently emits:
     *
     * WORLD_INFO_ACTIVATED
     *        ↓
     * Array<WorldInfoEntry>
     */

    if (Array.isArray(data)) {
        activatedEntries = data;
    }

    else if (
        Array.isArray(
            data?.allActivatedEntries
        )
    ) {
        activatedEntries =
            data.allActivatedEntries;
    }

    else {
        activatedEntries = [];
    }

    updateCount();
    renderPanel();

    console.log(
        '[Lorebook Trigger Tracker] Activated:',
        activatedEntries
    );
}

function handleWorldInfoLoaded(data) {

    if (!data) {
        return;
    }

    const all = [];

    const sources = [
        data.globalLore,
        data.characterLore,
        data.chatLore,
        data.personaLore,
    ];

    for (const source of sources) {

        if (!Array.isArray(source)) {
            continue;
        }

        for (const entry of source) {
            if (entry) {
                all.push(entry);
            }
        }
    }

    worldInfoEntries = all;

    renderPanel();

    console.log(
        '[Lorebook Trigger Tracker] Entries loaded:',
        worldInfoEntries
    );
}

function connectEvents() {

    if (
        typeof SillyTavern === 'undefined' ||
        typeof SillyTavern.getContext !== 'function'
    ) {
        console.warn(
            '[Lorebook Trigger Tracker] SillyTavern context unavailable.'
        );

        return false;
    }

    const context =
        SillyTavern.getContext();

    if (!context) {
        return false;
    }

    const eventSource =
        context.eventSource;

    const eventTypes =
        context.event_types;

    if (
        !eventSource ||
        !eventTypes
    ) {
        console.warn(
            '[Lorebook Trigger Tracker] Event system unavailable.'
        );

        return false;
    }

    if (
        eventTypes.WORLD_INFO_ACTIVATED
    ) {

        eventSource.on(
            eventTypes.WORLD_INFO_ACTIVATED,
            handleWorldInfoActivated
        );

        console.log(
            '[Lorebook Trigger Tracker] WORLD_INFO_ACTIVATED connected.'
        );
    }

    if (
        eventTypes.WORLDINFO_ENTRIES_LOADED
    ) {

        eventSource.on(
            eventTypes.WORLDINFO_ENTRIES_LOADED,
            handleWorldInfoLoaded
        );

        console.log(
            '[Lorebook Trigger Tracker] WORLDINFO_ENTRIES_LOADED connected.'
        );
    }

    return true;
}

function init() {

    if (initialized) {
        return;
    }

    initialized = true;

    console.log(
        '[Lorebook Trigger Tracker] Initializing...'
    );

    createButton();
    createPanel();

    connectEvents();

    console.log(
        '[Lorebook Trigger Tracker] Ready.'
    );
}

function start() {

    if (
        document.readyState === 'loading'
    ) {
        document.addEventListener(
            'DOMContentLoaded',
            init,
            { once: true }
        );
    } else {
        init();
    }
}

/*
 * Start immediately.
 *
 * This deliberately does NOT depend on
 * manifest.hooks.activate so older ST
 * versions can load it too.
 */

start();
