const EXT_ID = 'lorebook-trigger-tracker';

let activatedEntries = [];

/* =========================
   Utility
========================= */

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    }[c]));
}

function getName(entry) {
    return (
        entry?.comment ||
        entry?.name ||
        entry?.title ||
        `Entry ${entry?.uid ?? '?'}`
    );
}

function getKeys(entry) {
    const key = entry?.key;

    if (Array.isArray(key)) {
        return key;
    }

    if (key) {
        return [String(key)];
    }

    return [];
}


/* =========================
   Create UI
========================= */

function createUI() {

    // ป้องกันสร้างซ้ำ
    if (document.getElementById(`${EXT_ID}-bookmark`)) {
        return;
    }

    /* ---------- Bookmark ---------- */

    const bookmark = document.createElement('button');

    bookmark.id = `${EXT_ID}-bookmark`;
    bookmark.type = 'button';
    bookmark.title = 'Lorebook Tools';
    bookmark.setAttribute('aria-label', 'Lorebook Tools');

    // ใส่สัญลักษณ์ให้เห็นแน่นอน
    bookmark.innerHTML = `
        <span class="ltt-bookmark-icon">🔖</span>
    `;

    document.body.appendChild(bookmark);


    /* ---------- Tool Menu ---------- */

    const menu = document.createElement('div');

    menu.id = `${EXT_ID}-menu`;

    menu.innerHTML = `
        <div class="ltt-menu-title">
            TOOLS
        </div>

        <button
            type="button"
            class="ltt-tool"
            id="${EXT_ID}-lorebook"
        >
            <span class="ltt-tool-symbol">
                ◉<sup>0</sup>
            </span>

            <span class="ltt-tool-text">
                <strong>LOREBOOK</strong>
                <small>Trigger Tracker</small>
            </span>

            <span class="ltt-arrow">
                ›
            </span>
        </button>
    `;

    document.body.appendChild(menu);


    /* ---------- Lorebook Panel ---------- */

    const panel = document.createElement('div');

    panel.id = `${EXT_ID}-panel`;

    panel.innerHTML = `
        <div class="ltt-panel-header">

            <span>
                WORLD INFO
            </span>

            <button
                type="button"
                class="ltt-close"
                aria-label="Close"
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


    /* =========================
       Events
    ========================= */

    bookmark.addEventListener('click', (event) => {

        event.stopPropagation();

        panel.classList.remove('ltt-open');

        menu.classList.toggle('ltt-open');

    });


    const lorebookButton =
        document.getElementById(`${EXT_ID}-lorebook`);

    if (lorebookButton) {

        lorebookButton.addEventListener('click', (event) => {

            event.stopPropagation();

            menu.classList.remove('ltt-open');

            panel.classList.add('ltt-open');

            renderPanel();

        });

    }


    const closeButton =
        panel.querySelector('.ltt-close');

    if (closeButton) {

        closeButton.addEventListener('click', () => {

            panel.classList.remove('ltt-open');

        });

    }


    /* ---------- Click outside ---------- */

    document.addEventListener('click', (event) => {

        if (
            !menu.contains(event.target) &&
            !bookmark.contains(event.target)
        ) {
            menu.classList.remove('ltt-open');
        }

    });

}


/* =========================
   Counter
========================= */

function updateCount() {

    const counter = document.querySelector(
        `#${EXT_ID}-lorebook sup`
    );

    if (!counter) {
        return;
    }

    counter.textContent =
        activatedEntries.length > 99
            ? '99+'
            : String(activatedEntries.length);
}


/* =========================
   Render Panel
========================= */

function renderPanel() {

    const content = document.querySelector(
        `#${EXT_ID}-panel .ltt-content`
    );

    if (!content) {
        return;
    }


    if (!activatedEntries.length) {

        content.innerHTML = `
            <div class="ltt-empty">
                No World Info activated.
            </div>
        `;

        return;
    }


    content.innerHTML =
        activatedEntries
            .map(entry => {

                const name =
                    escapeHtml(
                        getName(entry)
                    );

                const keys =
                    getKeys(entry);

                const trigger =
                    escapeHtml(
                        keys.join('", "')
                    );

                const uid =
                    escapeHtml(
                        entry?.uid ?? '?'
                    );

                return `
                    <div class="ltt-entry">

                        <div class="ltt-entry-title">
                            ✓ ${name}
                        </div>

                        <div class="ltt-detail">
                            Trigger:
                            "${trigger || 'Unknown'}"
                        </div>

                        <div class="ltt-detail">
                            Entry: #${uid}
                        </div>

                    </div>
                `;

            })
            .join('');
}


/* =========================
   World Info Event
========================= */

function onActivated(data) {

    console.log(
        '[Lorebook Trigger Tracker] WORLD_INFO_ACTIVATED:',
        data
    );


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

}


/* =========================
   Connect SillyTavern Events
========================= */

function connectEvents() {

    try {

        if (
            typeof SillyTavern === 'undefined' ||
            typeof SillyTavern.getContext !== 'function'
        ) {

            console.warn(
                '[Lorebook Trigger Tracker] SillyTavern context unavailable.'
            );

            return;
        }


        const context =
            SillyTavern.getContext();


        if (
            !context ||
            !context.eventSource ||
            !context.event_types
        ) {

            console.warn(
                '[Lorebook Trigger Tracker] Event system unavailable.'
            );

            return;
        }


        const event =
            context.event_types.WORLD_INFO_ACTIVATED;


        if (!event) {

            console.warn(
                '[Lorebook Trigger Tracker] WORLD_INFO_ACTIVATED not found.'
            );

            return;
        }


        context.eventSource.on(
            event,
            onActivated
        );


        console.log(
            '[Lorebook Trigger Tracker] WORLD_INFO_ACTIVATED connected.'
        );

    }

    catch (error) {

        console.error(
            '[Lorebook Trigger Tracker] Failed to connect:',
            error
        );

    }

}


/* =========================
   SillyTavern Extension Hook
========================= */

function init() {

    console.log(
        '[Lorebook Trigger Tracker] Initializing...'
    );


    createUI();

    connectEvents();


    console.log(
        '[Lorebook Trigger Tracker] Ready.'
    );

}
