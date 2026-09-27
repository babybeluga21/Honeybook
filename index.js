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

// CSS is injected directly here instead of relying on manifest.json's
// "css" auto-load, since that mechanism was confirmed to never fire
// for this extension (verified via document.styleSheets inspection).
function injectStyles() {
    if (document.getElementById(`${EXT_ID}-styles`)) {
        return;
    }

    const style = document.createElement('style');
    style.id = `${EXT_ID}-styles`;
    style.textContent = `
#lorebook-trigger-tracker-bookmark {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 120px;
    height: 120px;
    padding: 0;
    border: 4px solid yellow;
    border-radius: 5px 5px 2px 2px;
    background: red;
    color: #fff;
    z-index: 2147483647;
    cursor: pointer;
    box-shadow: 0 3px 12px rgba(0,0,0,.35);
}

#lorebook-trigger-tracker-bookmark .ltt-bookmark-icon {
    display: block;
    font-size: 60px;
    line-height: 112px;
    text-align: center;
}

#lorebook-trigger-tracker-menu,
#lorebook-trigger-tracker-panel {
    position: fixed;
    left: 10px;
    z-index: 2147483645;
    display: none;
    color: #eee;
    background: rgba(15,15,18,.95);
    border: 1px solid rgba(255,255,255,.12);
    border-radius: 12px;
    box-shadow: 0 8px 30px rgba(0,0,0,.5);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
}

#lorebook-trigger-tracker-menu {
    bottom: 132px;
    width: 250px;
    padding: 8px;
}

#lorebook-trigger-tracker-menu.ltt-open,
#lorebook-trigger-tracker-panel.ltt-open {
    display: block;
}

#lorebook-trigger-tracker-menu .ltt-menu-title {
    padding: 6px 8px 8px;
    color: #aaa;
    font-size: 11px;
    letter-spacing: .12em;
}

#lorebook-trigger-tracker-menu .ltt-tool {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: #eee;
    text-align: left;
    cursor: pointer;
}

#lorebook-trigger-tracker-menu .ltt-tool:hover {
    background: rgba(255,255,255,.07);
}

.ltt-tool-symbol {
    width: 34px;
    text-align: center;
    font-size: 20px;
}

.ltt-tool-symbol sup {
    margin-left: 1px;
    color: #d28a9c;
    font-size: 9px;
}

.ltt-tool-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.ltt-tool-text strong {
    font-size: 12px;
    letter-spacing: .06em;
}

.ltt-tool-text small {
    color: #999;
    font-size: 11px;
}

.ltt-arrow {
    color: #777;
    font-size: 20px;
}

#lorebook-trigger-tracker-panel {
    bottom: 132px;
    width: min(330px, calc(100vw - 20px));
    max-height: 55vh;
    overflow-y: auto;
}

.ltt-panel-header {
    position: sticky;
    top: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    background: rgba(15,15,18,.97);
    border-bottom: 1px solid rgba(255,255,255,.08);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: .08em;
}

.ltt-close {
    border: 0;
    background: transparent;
    color: #aaa;
    font-size: 20px;
    cursor: pointer;
}

.ltt-content {
    padding: 8px 10px 12px;
}

.ltt-entry {
    padding: 8px 4px;
    border-bottom: 1px solid rgba(255,255,255,.07);
}

.ltt-entry-title {
    font-weight: 600;
}

.ltt-detail {
    margin-top: 3px;
    padding-left: 17px;
    color: #aaa;
    font-size: 12px;
}

.ltt-empty {
    padding: 18px 8px;
    color: #999;
    text-align: center;
}
    `;

    document.head.appendChild(style);
}

function createUI() {
    if (document.getElementById(`${EXT_ID}-bookmark`)) {
        return;
    }

    injectStyles();

    const bookmark = document.createElement('button');

    bookmark.id = `${EXT_ID}-bookmark`;
    bookmark.type = 'button';
    bookmark.title = 'Lorebook Tools';

    // pure CSS ribbon shape — no icon/emoji, just a solid tab
    // with a V-notch cut into the bottom edge, like a bookmark
    // ribbon hanging out of the box
    bookmark.innerHTML = '';

    document.body.appendChild(bookmark);

    // Attach the bookmark tab directly to the real ST message
    // input box, so it "grows out of" the box edge instead of
    // floating independently. Try known ST selectors in order.
    function findInputBox() {
        return (
            document.querySelector('#send_form') ||
            document.querySelector('#form_sheld') ||
            document.querySelector('#nonQRFormItems') ||
            document.querySelector('#send_textarea')?.closest('form') ||
            null
        );
    }

    function positionBookmark() {
        const box = findInputBox();

        if (!box) {
            // fallback: keep it fixed near bottom-left if the
            // box can't be found on this ST version
            bookmark.style.position = 'fixed';
            bookmark.style.left = '10px';
            bookmark.style.bottom = '82px';
            bookmark.style.top = '';
            return;
        }

        const rect = box.getBoundingClientRect();

        // tab sticks out from the top-right corner of the box,
        // overlapping it by half its own height like a bookmark
        bookmark.style.position = 'fixed';
        bookmark.style.left = (rect.right - 42) + 'px';
        bookmark.style.top = (rect.top - 16) + 'px';
        bookmark.style.bottom = '';
    }

    positionBookmark();

    // re-run on resize/orientation/keyboard show-hide, since the
    // input box moves in all of those cases on mobile
    window.addEventListener('resize', positionBookmark);
    window.visualViewport?.addEventListener('resize', positionBookmark);

    bookmark.style.width = '36px';
    bookmark.style.height = '36px';
    bookmark.style.background = 'radial-gradient(circle at 35% 30%, #e07a92, #c0455f 55%, #7a2436)';
    bookmark.style.boxShadow = '0 3px 10px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.15)';
    bookmark.style.borderRadius = '50%';
    bookmark.style.border = '2px solid rgba(255,255,255,.35)';
    bookmark.style.padding = '0';
    bookmark.style.zIndex = '2147483647';


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
