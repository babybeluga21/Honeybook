const EXT_ID = 'lorebook-trigger-tracker';
const BUTTON_ID = `${EXT_ID}-button`;

let initialized = false;
let toolbarObserver = null;
let retryTimer = null;
let moveQueued = false;

function findToolbar() {
    return document.querySelector('#leftSendForm');
}

function stopWaiting() {
    if (retryTimer) {
        clearInterval(retryTimer);
        retryTimer = null;
    }
}

function placeButtonLast(toolbar, button) {
    if (!toolbar || !button) {
        return;
    }

    /*
     * Keep Lorebook after every existing tool.
     * The order value also helps when SillyTavern
     * or another extension adds tools dynamically.
     */
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

    /*
     * If the button already exists, just move it
     * to the correct position.
     */
    if (button) {
        placeButtonLast(toolbar, button);
        watchToolbar(toolbar, button);
        return button;
    }

    button = document.createElement('div');

    button.id = BUTTON_ID;

    /*
     * Use SillyTavern's own button classes.
     */
    button.className =
        'fa-solid fa-bookmark interactable';

    button.title =
        'Lorebook Trigger Tracker';

    button.setAttribute(
        'aria-label',
        'Lorebook Trigger Tracker'
    );

    button.tabIndex = 0;

    /*
     * Force it to behave like the other
     * composer tools.
     */
    button.style.order = '9999';

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

    /*
     * Add it first...
     */
    toolbar.appendChild(button);

    /*
     * ...then make sure it stays last even if
     * another extension adds a new tool afterward.
     */
    placeButtonLast(toolbar, button);

    watchToolbar(toolbar, button);

    console.log(
        `[${EXT_ID}] Native composer tool inserted`
    );

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

    /*
     * Wait for SillyTavern to create the composer.
     */
    if (!toolbarObserver) {
        toolbarObserver = new MutationObserver(() => {
            const currentToolbar = findToolbar();

            if (currentToolbar) {
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
}
