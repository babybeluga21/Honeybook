const EXT_ID = 'lorebook-trigger-tracker';

let activatedEntries = [];


/* =========================================================
   Utility
========================================================= */

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    }[char]));
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

    if (key !== undefined && key !== null && key !== '') {
        return [String(key)];
    }

    return [];
}


/* =========================================================
   Create UI
========================================================= */

function createUI() {

    // ถ้ามีอยู่แล้ว ไม่สร้างซ้ำ
    if (document.getElementById(`${EXT_ID}-bookmark`)) {
        return;
    }


    /* =====================================================
       BOOKMARK BUTTON
    ===================================================== */

    const bookmark = document.createElement('button');

    bookmark.id = `${EXT_ID}-bookmark`;
    bookmark.type = 'button';

    bookmark.title = 'Lorebook Tools';
    bookmark.setAttribute(
        'aria-label',
        'Lorebook Tools'
    );

    bookmark.innerHTML = `
        <span class="ltt-bookmark-icon">
            🔖
        </span>
    `;

    document.body.appendChild(bookmark);


    /* =====================================================
       TOOL MENU
    ===================================================== */

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

                <strong>
                    LOREBOOK
                </strong>

                <small>
                    Trigger Tracker
                </small>

            </span>

            <span class="ltt-arrow">
                ›
            </span>

        </button>
    `;

    document.body.appendChild(menu);


    /* =====================================================
       LOREBOOK PANEL
    ===================================================== */

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


    /* =====================================================
       BOOKMARK CLICK
    ===================================================== */

    bookmark.addEventListener('click', (event) => {

        event.stopPropagation();

        panel.classList.remove(
            'ltt-open'
        );

        menu.classList.toggle(
            'ltt-open'
        );

    });


    /* =====================================================
       LOREBOOK CLICK
    ===================================================== */

    const lorebookButton =
        document.getElementById(
            `${EXT_ID}-lorebook`
        );

    if (lorebookButton) {

        lorebookButton.addEventListener(
            'click',
            (event) => {

                event.stopPropagation();

                menu.classList.remove(
                    'ltt-open'
                );

                panel.classList.add(
                    'ltt-open'
                );

                renderPanel();

            }
        );

    }


    /* =====================================================
       CLOSE PANEL
    ===================================================== */

    const closeButton =
        panel.querySelector(
            '.ltt-close'
        );

    if (closeButton) {

        closeButton.addEventListener(
            'click',
            () => {

                panel.classList.remove(
                    'ltt-open'
                );

            }
        );

    }


    /* =====================================================
       CLICK OUTSIDE
    ===================================================== */

    document.addEventListener(
        'click',
        (event) => {

            if (
                !menu.contains(event.target) &&
                !bookmark.contains(event.target)
            ) {

                menu.classList.remove(
                    'ltt-open'
                );

            }

        }
    );

}


/* =========================================================
   UPDATE COUNTER
========================================================= */

function updateCount() {

    const counter =
        document.querySelector(
            `#${EXT_ID}-lorebook sup`
        );

    if (!counter) {
        return;
    }


    const count =
        activatedEntries.length;


    counter.textContent =
        count > 99
            ? '99+'
            : String(count);

}


/* =========================================================
   RENDER PANEL
========================================================= */

function renderPanel() {

    const content =
        document.querySelector(
            `#${EXT_ID}-panel .ltt-content`
        );

    if (!content) {
        return;
    }


    /* -----------------------------------------------------
       NOTHING ACTIVATED
    ----------------------------------------------------- */

    if (!activatedEntries.length) {

        content.innerHTML = `
            <div class="ltt-empty">
                No World Info activated.
            </div>
        `;

        return;
    }


    /* -----------------------------------------------------
       RENDER ENTRIES
    ----------------------------------------------------- */

    content.innerHTML =
        activatedEntries
            .map((entry) => {

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
                            Entry:
                            #${uid}
                        </div>

                    </div>
                `;

            })
            .join('');

}


/* =========================================================
   WORLD INFO ACTIVATED
========================================================= */

function onActivated(data) {

    console.log(
        '[Lorebook Trigger Tracker] WORLD_INFO_ACTIVATED:',
        data
    );


    /* -----------------------------------------------------
       CASE 1
       Event ส่ง array มาโดยตรง
    ----------------------------------------------------- */

    if (Array.isArray(data)) {

        activatedEntries =
            data;

    }


    /* -----------------------------------------------------
       CASE 2
       Event ส่ง object ที่มี allActivatedEntries
    ----------------------------------------------------- */

    else if (
        Array.isArray(
            data?.allActivatedEntries
        )
    ) {

        activatedEntries =
            data.allActivatedEntries;

    }


    /* -----------------------------------------------------
       UNKNOWN FORMAT
    ----------------------------------------------------- */

    else {

        activatedEntries = [];

    }


    updateCount();

    renderPanel();

}


/* =========================================================
   CONNECT SILLYTAVERN EVENTS
========================================================= */

function connectEvents() {

    try {

        /* -------------------------------------------------
           CHECK SILLYTAVERN
        ------------------------------------------------- */

        if (
            typeof SillyTavern === 'undefined'
        ) {

            console.warn(
                '[Lorebook Trigger Tracker] SillyTavern is unavailable.'
            );

            return;
        }


        /* -------------------------------------------------
           CHECK getContext
        ------------------------------------------------- */

        if (
            typeof SillyTavern.getContext !==
            'function'
        ) {

            console.warn(
                '[Lorebook Trigger Tracker] getContext() is unavailable.'
            );

            return;
        }


        /* -------------------------------------------------
           GET CONTEXT
        ------------------------------------------------- */

        const context =
            SillyTavern.getContext();


        if (!context) {

            console.warn(
                '[Lorebook Trigger Tracker] Context unavailable.'
            );

            return;
        }


        /* -------------------------------------------------
           CHECK EVENT SYSTEM
        ------------------------------------------------- */

        if (
            !context.eventSource ||
            !context.event_types
        ) {

            console.warn(
                '[Lorebook Trigger Tracker] Event system unavailable.'
            );

            return;
        }


        /* -------------------------------------------------
           WORLD INFO EVENT
        ------------------------------------------------- */

        const event =
            context
                .event_types
                .WORLD_INFO_ACTIVATED;


        if (!event) {

            console.warn(
                '[Lorebook Trigger Tracker] WORLD_INFO_ACTIVATED event not found.'
            );

            return;
        }


        /* -------------------------------------------------
           CONNECT
        ------------------------------------------------- */

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


/* =========================================================
   INITIALIZE
========================================================= */

function init() {

    console.log(
        '[Lorebook Trigger Tracker] Initializing...'
    );


    /* -----------------------------------------------------
       CREATE UI
    ----------------------------------------------------- */

    createUI();


    /* -----------------------------------------------------
       CONNECT EVENTS
    ----------------------------------------------------- */

    connectEvents();


    /* -----------------------------------------------------
       DONE
    ----------------------------------------------------- */

    console.log(
        '[Lorebook Trigger Tracker] Ready.'
    );

}
