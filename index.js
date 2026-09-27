document.title = 'SCRIPT RAN ✅';

const EXT_ID = 'lorebook-trigger-tracker';

let activatedEntries = [];

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

function createUI() {
    if (document.getElementById(`${EXT_ID}-bookmark`)) {
        return;
    }

    const bookmark = document.createElement('button');

    bookmark.id = `${EXT_ID}-bookmark`;
    bookmark.type = 'button';
    bookmark.title = 'Lorebook Tools';

    // FIX: bookmark button had no visible content before —
    // it rendered as an empty semi-transparent box that blended
    // into the dark ST background, making it look like nothing
    // was created at all.
    bookmark.innerHTML = `
        <span class="ltt-bookmark-icon">
            ◉
        </span>
    `;

    document.body.appendChild(bookmark);


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


    bookmark.addEventListener('click', () => {

        menu.classList.toggle(
            'ltt-open'
        );

    });


    document
        .getElementById(`${EXT_ID}-lorebook`)
        .addEventListener('click', () => {

            menu.classList.remove(
                'ltt-open'
            );

            panel.classList.add(
                'ltt-open'
            );

        });


    panel
        .querySelector('.ltt-close')
        .addEventListener('click', () => {

            panel.classList.remove(
                'ltt-open'
            );

        });
}


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
            : String(
                activatedEntries.length
            );
}


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


function onActivated(data) {

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


function connectEvents() {

    try {

        const context =
            typeof SillyTavern !== 'undefined'
                ? SillyTavern.getContext?.()
                : null;


        if (
            !context?.eventSource ||
            !context?.event_types
        ) {

            console.warn(
                '[Lorebook Trigger Tracker] Event system unavailable.'
            );

            return;
        }


        const event =
            context.event_types
                .WORLD_INFO_ACTIVATED;


        if (event) {

            context.eventSource.on(
                event,
                onActivated
            );


            console.log(
                '[Lorebook Trigger Tracker] WORLD_INFO_ACTIVATED connected.'
            );

        }

    }

    catch (error) {

        console.error(
            '[Lorebook Trigger Tracker] Failed to connect:',
            error
        );

    }
}


function init() {

    createUI();

    connectEvents();


    console.log(
        '[Lorebook Trigger Tracker] Ready.'
    );
}


if (
    document.readyState === 'loading'
) {

    document.addEventListener(
        'DOMContentLoaded',
        init,
        {
            once: true
        }
    );

}

else {

    init();

}
