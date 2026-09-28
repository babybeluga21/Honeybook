const EXT_ID = 'lorebook-trigger-tracker';
const BUTTON_ID = `${EXT_ID}-button`;
const PANEL_ID = `${EXT_ID}-panel`;

let initialized = false;
let toolbarObserver = null;
let panelOpen = false;

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

            position: relative !important;
            box-sizing: border-box !important;

            cursor: pointer;
            background: rgba(0, 0, 0, .25) !important;
            border: 1px solid rgba(255,255,255,.18) !important;

            transition:
                transform .15s ease,
                filter .15s ease,
                box-shadow .15s ease;
        }

        #${BUTTON_ID}:hover {
            filter: brightness(1.12);
        }

        #${BUTTON_ID}.ltt-active {
            box-shadow:
                0 0 0 1px rgba(255,255,255,.25),
                0 0 10px rgba(255,255,255,.12);
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

        /*
         * แถบหมวดเครื่องมือ
         */
        #${PANEL_ID} {
            position: fixed;

            display: none;
            align-items: center;
            gap: 5px;

            padding: 5px 6px;

            background: rgba(18, 18, 18, .82);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);

            border: 1px solid rgba(255,255,255,.14);
            border-radius: 10px;

            box-shadow:
                0 8px 25px rgba(0,0,0,.28);

            z-index: 999999;

            box-sizing: border-box;
        }

        #${PANEL_ID}.ltt-visible {
            display: flex;
        }

        .ltt-category {
            appearance: none;
            -webkit-appearance: none;

            display: flex;
            align-items: center;
            gap: 6px;

            height: 30px;

            padding: 0 10px;

            border: 0;
            border-radius: 7px;

            background: rgba(255,255,255,.06);
            color: rgba(255,255,255,.9);

            font-family: inherit;
            font-size: 13px;

            cursor: pointer;

            white-space: nowrap;

            transition:
                background .15s ease,
                transform .15s ease;
        }

        .ltt-category:hover {
            background: rgba(255,255,255,.12);
        }

        .ltt-category:active {
            transform: scale(.97);
        }

        .ltt-category-icon {
            font-size: 14px;
            opacity: .9;
        }

        .ltt-category-count {
            min-width: 15px;
            height: 15px;

            display: inline-flex;
            align-items: center;
            justify-content: center;

            padding: 0 4px;

            border-radius: 8px;

            background: rgba(255,255,255,.1);

            font-size: 10px;
            opacity: .75;
        }
    `;

    document.head.appendChild(style);
}

function findToolbar() {
    return document.querySelector('#leftSendForm');
}

function findSendForm() {
    return document.querySelector('#send_form');
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
    if (!button || !document.body.contains(button)) {
        return;
    }

    const image = button.querySelector('.ltt-persona-image');
    const fallback = button.querySelector('.ltt-fallback');

    if (!image || !fallback) {
        return;
    }

    const src = findPersonaImage();

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

function positionPanel() {
    const panel = document.getElementById(PANEL_ID);
    const sendForm = findSendForm();

    if (!panel || !sendForm) {
        return;
    }

    const rect = sendForm.getBoundingClientRect();

    /*
     * วางแถบไว้เหนือกล่องพิมพ์
     */
    const panelRect = panel.getBoundingClientRect();

    let left = rect.left;
    let top = rect.top - panelRect.height - 7;

    /*
     * กันไม่ให้แถบล้นจอด้านข้าง
     */
    const margin = 8;

    if (left + panelRect.width > window.innerWidth - margin) {
        left = window.innerWidth - panelRect.width - margin;
    }

    if (left < margin) {
        left = margin;
    }

    /*
     * ถ้าพื้นที่ด้านบนไม่พอ
     * ให้ชิดด้านบนแทน
     */
    if (top < margin) {
        top = margin;
    }

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
}

function createPanel() {
    let panel = document.getElementById(PANEL_ID);

    if (panel) {
        return panel;
    }

    panel = document.createElement('div');
    panel.id = PANEL_ID;

    /*
     * หมวดแรกสำหรับทดสอบ
     */
    const lorebookButton = document.createElement('button');

    lorebookButton.type = 'button';
    lorebookButton.className = 'ltt-category';

    lorebookButton.innerHTML = `
        <span class="ltt-category-icon">◉</span>
        <span>Lorebook</span>
        <span class="ltt-category-count">0</span>
    `;

    lorebookButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();

        console.log(`[${EXT_ID}] Lorebook / Trigger clicked`);

        /*
         * ตรงนี้ค่อยต่อกับระบบ Trigger จริงภายหลัง
         */
    });

    panel.appendChild(lorebookButton);

    document.body.appendChild(panel);

    return panel;
}

function togglePanel() {
    const panel = createPanel();
    const button = document.getElementById(BUTTON_ID);

    if (!panel || !button) {
        return;
    }

    panelOpen = !panelOpen;

    if (panelOpen) {
        panel.classList.add('ltt-visible');
        button.classList.add('ltt-active');

        /*
         * ต้องคำนวณหลัง display:flex แล้ว
         */
        requestAnimationFrame(() => {
            positionPanel();
        });
    } else {
        panel.classList.remove('ltt-visible');
        button.classList.remove('ltt-active');
    }
}

function createButton(toolbar) {
    let button = document.getElementById(BUTTON_ID);

    if (button) {
        keepButtonAtEnd(toolbar, button);
        updatePersona(button);
        return button;
    }

    addStyles();

    button = document.createElement('div');

    button.id = BUTTON_ID;
    button.className = 'interactable';

    button.title = 'Lorebook Trigger Tracker';
    button.setAttribute(
        'aria-label',
        'Lorebook Trigger Tracker'
    );

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

        updatePersona(button);
        togglePanel();
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

    keepButtonAtEnd(toolbar, button);
    updatePersona(button);

    createPanel();

    console.log(
        `[${EXT_ID}] Persona tool inserted`
    );

    return button;
}

function keepButtonAtEnd(toolbar, button) {
    if (!toolbar || !button) {
        return;
    }

    button.style.order = '9999';

    if (toolbar.lastElementChild !== button) {
        toolbar.appendChild(button);
    }
}

function watchToolbar(toolbar, button) {
    if (toolbarObserver) {
        toolbarObserver.disconnect();
    }

    toolbarObserver = new MutationObserver(() => {
        keepButtonAtEnd(toolbar, button);
    });

    toolbarObserver.observe(toolbar, {
        childList: true,
    });
}

function startToolbarWatch() {
    const toolbar = findToolbar();

    if (toolbar) {
        const button = createButton(toolbar);

        watchToolbar(toolbar, button);

        initialized = true;
        return;
    }

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

/*
 * ปิดแถบเมื่อคลิกพื้นที่อื่น
 */
document.addEventListener('click', (event) => {
    if (!panelOpen) {
        return;
    }

    const panel = document.getElementById(PANEL_ID);
    const button = document.getElementById(BUTTON_ID);

    if (!panel || !button) {
        return;
    }

    if (
        panel.contains(event.target) ||
        button.contains(event.target)
    ) {
        return;
    }

    panelOpen = false;

    panel.classList.remove('ltt-visible');
    button.classList.remove('ltt-active');
});

/*
 * ขยับตำแหน่งแถบตามหน้าจอ
 */
window.addEventListener('resize', () => {
    if (panelOpen) {
        positionPanel();
    }
});

window.addEventListener('scroll', () => {
    if (panelOpen) {
        positionPanel();
    }
}, true);

export async function init() {
    console.log(`[${EXT_ID}] init()`);

    if (initialized) {
        return;
    }

    startToolbarWatch();
}
