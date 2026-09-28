const EXT_ID = 'lorebook-trigger-tracker';
const BUTTON_ID = `${EXT_ID}-button`;
const STYLE_ID = `${EXT_ID}-style`;

let initialized = false;
let toolbarObserver = null;
let retryTimer = null;
let moveQueued = false;
let personaListenerBound = false;

function findToolbar() {
    return document.querySelector('#leftSendForm');
}

function stopWaiting() {
    if (retryTimer) {
        clearInterval(retryTimer);
        retryTimer = null;
    }
}

function addStyles() {
    if (document.getElementById(STYLE_ID)) {
        return;
    }

    const style = document.createElement('style');

    style.id = STYLE_ID;

    style.textContent = `
        #${BUTTON_ID} {
            width: 32px;
            height: 32px;
            min-width: 32px;
            min-height: 32px;
            padding: 0;
            margin: 0;
            border-radius: 50%;
            overflow: hidden;
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            flex: 0 0 32px;
        }

        #${BUTTON_ID} img {
            width: 100%;
            height: 100%;
            display: block;
            object-fit: cover;
            border-radius: 50%;
            pointer-events: none;
            user-select: none;
        }

        #${BUTTON_ID} .lorebook-trigger-tracker-fallback {
            font-size: 16px;
            line-height: 1;
        }
    `;

    document.head.appendChild(style);
}

function getPersonaImageUrl() {
    const avatar =
        window.user_avatar ??
        window.userAvatar ??
        '';

    if (!avatar || avatar === 'none') {
        return '';
    }

    return `User%20Avatars/${encodeURIComponent(avatar)}`;
}

function updatePersonaImage() {
    const button = document.getElementById(BUTTON_ID);

    if (!button) {
        return;
    }

    const url = getPersonaImageUrl();

    const oldImage = button.querySelector('img');

    if (oldImage) {
        oldImage.remove();
    }

    if (!url) {
        button.innerHTML =
            '<span class="lorebook-trigger-tracker-fallback">🔖</span>';

        return;
    }

    const image = document.createElement('img');

    image.alt = '';
    image.draggable = false;
    image.src = url;

    image.addEventListener(
        'error',
        () => {
            image.remove();

            button.innerHTML =
                '<span class="lorebook-trigger-tracker-fallback">🔖</span>';
        },
        { once: true }
    );

    button.innerHTML = '';
    button.appendChild(image);
}

function bindPersonaChange() {
    if (personaListenerBound) {
        return;
    }

    personaListenerBound = true;

    if (
        window.eventSource &&
        window.event_types?.PERSONA_CHANGED
    ) {
        window.eventSource.on(
            window.event_types.PERSONA_CHANGED,
            () => {
                updatePersonaImage();
            }
        );
    }
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

function createToolbarButton(toolbar) {
    let button = document.getElementById(BUTTON_ID);

    if (button) {
        placeButtonLast(toolbar, button);
        updatePersonaImage();
        watchToolbar(toolbar, button);

        return button;
    }

    button = document.createElement('div');

    button.id = BUTTON_ID;

    button.className = 'interactable';

    button.title =
        'Lorebook Trigger Tracker';

    button.setAttribute(
        'aria-label',
        'Lorebook Trigger Tracker'
    );

    button.tabIndex = 0;

    button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();

        console.log(
            `[${EXT_ID}] Lorebook button clicked`
        );

        /*
         * Lorebook menu will be added here.
         */
    });

    button.addEventListener('keydown', (event) => {
        if (
            event.key === 'Enter' ||
            event.key === ' '
        ) {
            event.preventDefault();
            button.click();
        }
    });

    toolbar.appendChild(button);

    placeButtonLast(toolbar, button);

    updatePersonaImage();

    watchToolbar(toolbar, button);

    console.log(
        `[${EXT_ID}] Persona avatar composer tool inserted`
    );

    return button;
}

function waitForToolbar() {
    if (initialized) {
        return;
    }

    const toolbar = findToolbar();

    if (toolbar) {
        addStyles();

        createToolbarButton(toolbar);

        initialized = true;

        stopWaiting();

        return;
    }

    if (!toolbarObserver) {
        toolbarObserver = new MutationObserver(() => {
            const currentToolbar = findToolbar();

            if (currentToolbar) {
                addStyles();

                createToolbarButton(currentToolbar);

                initialized = true;

                stopWaiting();
            }
        });

        toolbarObserver.observe(
            document.documentElement,
            {
                childList: true,
                subtree: true,
            }
        );
    }

    if (!retryTimer) {
        retryTimer = setInterval(() => {
            const currentToolbar = findToolbar();

            if (currentToolbar) {
                addStyles();

                createToolbarButton(currentToolbar);

                initialized = true;

                stopWaiting();
            }
        }, 500);
    }
}

export async function init() {
    console.log(
        `[${EXT_ID}] init()`
    );

    if (initialized) {
        return;
    }

    waitForToolbar();
    bindPersonaChange();
}
