const EXT_ID = 'lorebook-trigger-tracker';
const BUTTON_ID = `${EXT_ID}-button`;

let initialized = false;
let toolbarObserver = null;

function findToolbar() {
    return document.querySelector('#leftSendForm');
}

function findPersonaImage() {
    const selectors = [
        '#user_avatar_block img',
        '#persona_ui img',
    ];

    for (const selector of selectors) {
        const img = document.querySelector(selector);

        if (img && img.src) {
            return img;
        }
    }

    return null;
}

function updatePersona(button) {
    if (!button || !document.body.contains(button)) {
        return;
    }

    const persona = findPersonaImage();

    if (!persona || !persona.src) {
        button.style.backgroundImage = '';
        button.textContent = '◉';
        return;
    }

    button.textContent = '';
    button.style.backgroundImage = `url("${persona.src}")`;
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

function createButton(toolbar) {
    let button = document.getElementById(BUTTON_ID);

    if (button) {
        placeButtonLast(toolbar, button);
        updatePersona(button);
        return button;
    }

    button = document.createElement('div');

    button.id = BUTTON_ID;
    button.className = 'interactable';
    button.title = 'Lorebook Trigger Tracker';
    button.setAttribute(
        'aria-label',
        'Lorebook Trigger Tracker'
    );
    button.tabIndex = 0;

    Object.assign(button.style, {
        order: '9999',
        width: '32px',
        height: '32px',
        minWidth: '32px',
        minHeight: '32px',
        margin: '0 3px',
        padding: '0',
        borderRadius: '50%',
        overflow: 'hidden',
        boxSizing: 'border-box',
        backgroundColor: 'rgba(0, 0, 0, .25)',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        border: '1px solid rgba(255, 255, 255, .18)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '15px',
    });

    button.textContent = '◉';

    button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();

        /*
         * Refresh the Persona image only when the user
         * interacts with the tool.
         *
         * No polling and no Persona observer are used.
         */
        updatePersona(button);

        console.log(
            `[${EXT_ID}] button clicked`
        );
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
    updatePersona(button);

    console.log(
        `[${EXT_ID}] Native composer tool inserted`
    );

    return button;
}

function watchToolbar(toolbar, button) {
    if (toolbarObserver) {
        toolbarObserver.disconnect();
    }

    toolbarObserver = new MutationObserver(() => {
        placeButtonLast(toolbar, button);
    });

    toolbarObserver.observe(toolbar, {
        childList: true,
    });
}

function start() {
    if (initialized) {
        return;
    }

    const toolbar = findToolbar();

    /*
     * Composer already exists.
     */
    if (toolbar) {
        const button = createButton(toolbar);

        watchToolbar(toolbar, button);

        initialized = true;
        return;
    }

    /*
     * Composer has not been created yet.
     *
     * This observer exists only until the toolbar
     * appears, then it disconnects permanently.
     */
    toolbarObserver = new MutationObserver(() => {
        const currentToolbar = findToolbar();

        if (!currentToolbar) {
            return;
        }

        toolbarObserver.disconnect();
        toolbarObserver = null;

        const button = createButton(currentToolbar);

        watchToolbar(currentToolbar, button);

        initialized = true;
    });

    toolbarObserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
    });
}

export async function init() {
    console.log(`[${EXT_ID}] init()`);
    start();
}
