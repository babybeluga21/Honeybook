const EXT_ID = 'lorebook-trigger-tracker';
const BUTTON_ID = `${EXT_ID}-button`;

let initialized = false;
let toolbarObserver = null;
let retryTimer = null;
let moveQueued = false;
let personaObserver = null;

function findToolbar() {
    return document.querySelector('#leftSendForm');
}

function getPersonaImage() {
    // SillyTavern แสดง Persona ปัจจุบันไว้ใน UI นี้
    const avatar =
        document.querySelector('#user_avatar_block img') ||
        document.querySelector('#user_avatar_block .avatar img') ||
        document.querySelector('#persona_ui img');

    return avatar?.src || '';
}

function updatePersonaImage(button) {
    if (!button) return;

    const image = button.querySelector('.ltt-persona-image');
    const fallback = button.querySelector('.ltt-fallback');

    const src = getPersonaImage();

    if (src) {
        image.src = src;
        image.style.display = 'block';
        fallback.style.display = 'none';
    } else {
        image.removeAttribute('src');
        image.style.display = 'none';
        fallback.style.display = 'flex';
    }
}

function addStyles() {
    if (document.getElementById(`${EXT_ID}-style`)) {
        return;
    }

    const style = document.createElement('style');
    style.id = `${EXT_ID}-style`;

    style.textContent = `
        #${BUTTON_ID} {
            order: 9999 !important;
            width: 32px !important;
            height: 32px !important;
            min-width: 32px !important;
            min-height: 32px !important;
            padding: 0 !important;
            margin: 0 3px !important;

            border-radius: 50% !important;
            overflow: hidden !important;

            display: flex !important;
            align-items: center !important;
            justify-content: center !important;

            cursor: pointer;
            position: relative;
            box-sizing: border-box;

            background: rgba(0, 0, 0, 0.25) !important;
            border: 1px solid rgba(255,255,255,.18);

            font-family: inherit;
            font-size: 16px;
        }

        #${BUTTON_ID} .ltt-persona-image {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            display: block;
            border-radius: 50%;
            pointer-events: none;
        }

        #${BUTTON_ID} .ltt-fallback {
            width: 100%;
            height: 100%;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            font-size: 15px;
        }

        #${BUTTON_ID}:hover {
            filter: brightness(1.15);
        }
    `;

    document.head.appendChild(style);
}

function placeButtonLast(toolbar, button) {
    if (!toolbar || !button) {
        return;
    }

    button.style.order = '9999';

    if (toolbar.lastElementChild !== button) {
        toolbar.appendChild(button);
    }
}

function queueButtonPosition(toolbar, button) {
    if (moveQueued) {
        return;
    }

    moveQueued = true;

    queueMicrotask(() => {
        moveQueued = false;

        if (
            document.body.contains(toolbar) &&
            document.body.contains(button)
        ) {
            placeButtonLast(toolbar, button);
        }
    });
}

function watchToolbar(toolbar, button) {
    if (toolbarObserver) {
        toolbarObserver.disconnect();
    }

    toolbarObserver = new MutationObserver(() => {
        queueButtonPosition(toolbar, button);
    });

    toolbarObserver.observe(toolbar, {
        childList: true,
    });
}

function watchPersona(button) {
    if (personaObserver) {
        personaObserver.disconnect();
    }

    personaObserver = new MutationObserver(() => {
        updatePersonaImage(button);
    });

    personaObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src'],
    });

    // ตรวจซ้ำเผื่อ Persona เปลี่ยนผ่าน event/UI
    setInterval(() => {
        updatePersonaImage(button);
    }, 1000);
}

function createToolbarButton(toolbar) {
    let button = document.getElementById(BUTTON_ID);

    if (button) {
        placeButtonLast(toolbar, button);
        updatePersonaImage(button);
        watchToolbar(toolbar, button);
        return button;
    }

    addStyles();

    button = document.createElement('div');
    button.id = BUTTON_ID;
    button.className = 'interactable';
    button.title = 'Lorebook Trigger Tracker';
    button.setAttribute('aria-label', 'Lorebook Trigger Tracker');
    button.tabIndex = 0;

    const image = document.createElement('img');
    image.className = 'ltt-persona-image';
    image.alt = '';
    image.draggable = false;

    const fallback = document.createElement('div');
    fallback.className = 'ltt-fallback';
    fallback.textContent = '◉';

    button.appendChild(image);
    button.appendChild(fallback);

    button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();

        console.log(`[${EXT_ID}] Lorebook button clicked`);
    });

    button.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            button.click();
        }
    });

    toolbar.appendChild(button);

    placeButtonLast(toolbar, button);
    updatePersonaImage(button);
    watchToolbar(toolbar, button);
    watchPersona(button);

    console.log(`[${EXT_ID}] Persona tool inserted`);

    return button;
}

function waitForToolbar() {
    if (initialized) {
        return;
    }

    const toolbar = findToolbar();

    if (toolbar) {
        createToolbarButton(toolbar);
        initialized = true;
        stopWaiting();
        return;
    }

    if (!toolbarObserver) {
        toolbarObserver = new MutationObserver(() => {
            const currentToolbar = findToolbar();

            if (currentToolbar) {
                createToolbarButton(currentToolbar);
                initialized = true;
                stopWaiting();
            }
        });

        toolbarObserver.observe(document.documentElement, {
            childList: true,
            subtree: true,
        });
    }

    if (!retryTimer) {
        retryTimer = setInterval(() => {
            const currentToolbar = findToolbar();

            if (currentToolbar) {
                createToolbarButton(currentToolbar);
                initialized = true;
                stopWaiting();
            }
        }, 500);
    }
}

function stopWaiting() {
    if (retryTimer) {
        clearInterval(retryTimer);
        retryTimer = null;
    }
}

export async function init() {
    console.log(`[${EXT_ID}] init()`);

    if (initialized) {
        return;
    }

    waitForToolbar();
}
