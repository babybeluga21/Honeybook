const EXT_ID = 'lorebook-trigger-tracker';
const BUTTON_ID = `${EXT_ID}-button`;

let initialized = false;
let toolbarObserver = null;
let personaObserver = null;

function addStyles() {
    if (document.getElementById(`${EXT_ID}-style`)) return;

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

            position: relative !important;
            box-sizing: border-box !important;

            cursor: pointer;
            background: rgba(0, 0, 0, .25) !important;
            border: 1px solid rgba(255,255,255,.18);
        }

        #${BUTTON_ID} img {
            width: 100% !important;
            height: 100% !important;

            display: block;
            object-fit: cover !important;

            border-radius: 50% !important;
            pointer-events: none;
        }

        #${BUTTON_ID} .ltt-fallback {
            width: 100%;
            height: 100%;

            display: flex;
            align-items: center;
            justify-content: center;

            font-size: 15px;
            pointer-events: none;
        }

        #${BUTTON_ID}:hover {
            filter: brightness(1.12);
        }
    `;

    document.head.appendChild(style);
}

function findPersonaImage() {
    const selectors = [
        '#user_avatar_block img',
        '#persona_ui img',
    ];

    for (const selector of selectors) {
        const img = document.querySelector(selector);

        if (img && img.src) {
            return img.src;
        }
    }

    return '';
}

function updatePersona(button) {
    if (!button || !document.body.contains(button)) return;

    const image = button.querySelector('.ltt-persona-image');
    const fallback = button.querySelector('.ltt-fallback');

    if (!image || !fallback) return;

    const src = findPersonaImage();

    if (src) {
        if (image.src !== src) {
            image.src = src;
        }

        image.style.display = 'block';
        fallback.style.display = 'none';
    } else {
        image.removeAttribute('src');
        image.style.display = 'none';
        fallback.style.display = 'flex';
    }
}

function watchPersona(button) {
    const personaBlock = document.querySelector('#user_avatar_block');

    if (!personaBlock) {
        return;
    }

    if (personaObserver) {
        personaObserver.disconnect();
    }

    personaObserver = new MutationObserver(() => {
        updatePersona(button);
    });

    personaObserver.observe(personaBlock, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['src'],
    });

    updatePersona(button);
}

function keepButtonAtEnd(toolbar, button) {
    if (!toolbar || !button) return;

    button.style.order = '9999';

    if (toolbar.lastElementChild !== button) {
        toolbar.appendChild(button);
    }
}

function createButton(toolbar) {
    let button = document.getElementById(BUTTON_ID);

    if (button) {
        keepButtonAtEnd(toolbar, button);
        updatePersona(button);
        watchPersona(button);
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

        console.log(`[${EXT_ID}] button clicked`);
    });

    button.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            button.click();
        }
    });

    toolbar.appendChild(button);
    keepButtonAtEnd(toolbar, button);

    updatePersona(button);
    watchPersona(button);

    console.log(`[${EXT_ID}] Persona button inserted`);

    return button;
}

function startToolbarWatch() {
    const toolbar = document.querySelector('#leftSendForm');

    if (toolbar) {
        createButton(toolbar);
        initialized = true;
        return;
    }

    toolbarObserver = new MutationObserver(() => {
        const currentToolbar = document.querySelector('#leftSendForm');

        if (!currentToolbar) return;

        createButton(currentToolbar);

        initialized = true;

        toolbarObserver.disconnect();
        toolbarObserver = null;
    });

    toolbarObserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
    });
}

export async function init() {
    console.log(`[${EXT_ID}] init()`);

    if (initialized) return;

    startToolbarWatch();
}
