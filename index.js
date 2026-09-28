const EXT_ID = 'lorebook-trigger-tracker';
const BUTTON_ID = `${EXT_ID}-button`;

let initialized = false;
let observer = null;
let retryTimer = null;

function findToolbar() {
    return document.querySelector('#leftSendForm');
}

function stopWaiting() {
    if (observer) {
        observer.disconnect();
        observer = null;
    }

    if (retryTimer) {
        clearInterval(retryTimer);
        retryTimer = null;
    }
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

    if (!observer) {
        observer = new MutationObserver(() => {
            const currentToolbar = findToolbar();

            if (currentToolbar) {
                createToolbarButton(currentToolbar);
                initialized = true;
                stopWaiting();
            }
        });

        observer.observe(document.documentElement, {
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

function createToolbarButton(toolbar) {
    if (document.getElementById(BUTTON_ID)) {
        return;
    }

    const button = document.createElement('div');

    button.id = BUTTON_ID;
    button.className = 'fa-solid fa-bookmark interactable';
    button.title = 'Lorebook Trigger Tracker';
    button.setAttribute('aria-label', 'Lorebook Trigger Tracker');
    button.tabIndex = 0;

    button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();

        console.log(`[${EXT_ID}] Toolbar button clicked`);

        // เมนู Lorebook จะใส่ตรงนี้ในขั้นต่อไป
    });

    button.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            button.click();
        }
    });

    const optionsButton = toolbar.querySelector('#options_button');

    if (optionsButton) {
        optionsButton.insertAdjacentElement('afterend', button);
    } else {
        toolbar.prepend(button);
    }

    console.log(`[${EXT_ID}] Native composer tool inserted`);
}

export async function init() {
    console.log(`[${EXT_ID}] init()`);

    if (initialized) {
        return;
    }

    waitForToolbar();
}
