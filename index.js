const EXT_ID = 'lorebook-trigger-tracker';
const BUTTON_ID = `${EXT_ID}-button`;
const PANEL_ID = `${EXT_ID}-panel`;

let initialized = false;
let toolbarObserver = null;
let panelOpen = false;


/* =========================================================
 * STYLE
 * ========================================================= */

function addStyles() {
    if (document.getElementById(`${EXT_ID}-style`)) {
        return;
    }

    const style = document.createElement('style');
    style.id = `${EXT_ID}-style`;

    style.textContent = `
        /* =====================================================
         * PERSONA TOOL BUTTON
         * ===================================================== */

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

            background: rgba(255,255,255,.045) !important;

            border:
                1px solid rgba(255,255,255,.14) !important;

            transition:
                filter .15s ease,
                transform .15s ease,
                box-shadow .18s ease;
        }


        #${BUTTON_ID}:hover {
            filter: brightness(1.12);

            box-shadow:
                0 0 8px rgba(255,255,255,.08);
        }


        #${BUTTON_ID}:active {
            transform: scale(.94);
        }


        #${BUTTON_ID}.ltt-active {
            box-shadow:
                0 0 0 1px rgba(255,255,255,.16),
                0 0 12px rgba(255,255,255,.10);
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

            font-size: 14px;

            color:
                rgba(255,255,255,.72);

            pointer-events: none;
        }


        /* =====================================================
         * TRANSPARENT GLASS PANEL
         * ===================================================== */

        #${PANEL_ID} {
            position: fixed;

            display: none;

            align-items: center;

            gap: 3px;

            padding: 3px 4px;

            box-sizing: border-box;

            /*
             * โปร่งใสเป็นหลัก
             */
            background:
                rgba(255,255,255,.055);

            /*
             * Glass effect
             */
            backdrop-filter:
                blur(14px)
                saturate(120%);

            -webkit-backdrop-filter:
                blur(14px)
                saturate(120%);

            /*
             * ขอบบางมาก
             */
            border:
                1px solid rgba(255,255,255,.14);

            border-radius: 8px;

            /*
             * เงานุ่ม ๆ
             */
            box-shadow:
                0 6px 20px rgba(0,0,0,.18),
                inset 0 1px 0 rgba(255,255,255,.07);

            z-index: 999999;

            opacity: 0;

            transform:
                translateY(4px)
                scale(.97);

            transform-origin:
                bottom left;

            pointer-events: none;

            transition:
                opacity .16s ease,
                transform .16s ease;
        }


        #${PANEL_ID}.ltt-visible {
            display: flex;

            opacity: 1;

            transform:
                translateY(0)
                scale(1);

            pointer-events: auto;
        }


        /* =====================================================
         * CATEGORY BUTTON
         * ===================================================== */

        #${PANEL_ID} .ltt-category {
            appearance: none;
            -webkit-appearance: none;

            display: flex;

            align-items: center;

            gap: 4px;

            height: 22px;

            padding: 0 6px;

            margin: 0;

            border: 0;

            border-radius: 5px;

            /*
             * ปุ่มด้านในก็โปร่งใส
             */
            background:
                rgba(255,255,255,.035);

            color:
                rgba(255,255,255,.84);

            font-family: inherit;

            font-size: 10px;

            line-height: 1;

            cursor: pointer;

            white-space: nowrap;

            box-sizing: border-box;

            transition:
                background .14s ease,
                color .14s ease,
                transform .12s ease;
        }


        #${PANEL_ID} .ltt-category:hover {
            background:
                rgba(255,255,255,.085);

            color:
                rgba(255,255,255,.98);
        }


        #${PANEL_ID} .ltt-category:active {
            transform:
                scale(.96);
        }


        /* =====================================================
         * CATEGORY ICON
         * ===================================================== */

        #${PANEL_ID} .ltt-category-icon {
            display: inline-flex;

            align-items: center;
            justify-content: center;

            font-size: 10px;

            line-height: 1;

            opacity: .85;
        }


        /* =====================================================
         * COUNT
         * ===================================================== */

        #${PANEL_ID} .ltt-category-count {
            min-width: 12px;

            height: 12px;

            padding: 0 3px;

            display: inline-flex;

            align-items: center;
            justify-content: center;

            border-radius: 6px;

            background:
                rgba(255,255,255,.07);

            color:
                rgba(255,255,255,.60);

            font-size: 8px;

            line-height: 1;

            box-sizing: border-box;
        }
    `;

    document.head.appendChild(style);
}


/* =========================================================
 * FIND SILLYTAVERN ELEMENTS
 * ========================================================= */

function findToolbar() {
    return document.querySelector('#leftSendForm');
}


function findSendForm() {
    return document.querySelector('#send_form');
}


/* =========================================================
 * FIND PERSONA
 * ========================================================= */

function findPersonaImage() {
    const selectors = [
        '#user_avatar_block img',
        '#persona_ui img',
    ];

    for (const selector of selectors) {
        const img =
            document.querySelector(selector);

        if (img && img.src) {
            return img.src;
        }
    }

    return '';
}


/* =========================================================
 * UPDATE PERSONA
 * ========================================================= */

function updatePersona(button) {
    if (
        !button ||
        !document.body.contains(button)
    ) {
        return;
    }

    const image =
        button.querySelector(
            '.ltt-persona-image'
        );

    const fallback =
        button.querySelector(
            '.ltt-fallback'
        );

    if (!image || !fallback) {
        return;
    }

    const src =
        findPersonaImage();

    if (src) {
        if (image.src !== src) {
            image.src = src;
        }

        image.style.display =
            'block';

        fallback.style.display =
            'none';
    } else {
        image.removeAttribute('src');

        image.style.display =
            'none';

        fallback.style.display =
            'flex';
    }
}


/* =========================================================
 * POSITION PANEL
 * ========================================================= */

function positionPanel() {
    const panel =
        document.getElementById(
            PANEL_ID
        );

    const sendForm =
        findSendForm();

    if (!panel || !sendForm) {
        return;
    }

    const rect =
        sendForm.getBoundingClientRect();

    const panelRect =
        panel.getBoundingClientRect();

    const margin = 8;

    let left =
        rect.left;

    let top =
        rect.top -
        panelRect.height -
        6;


    if (
        left + panelRect.width >
        window.innerWidth - margin
    ) {
        left =
            window.innerWidth -
            panelRect.width -
            margin;
    }


    if (left < margin) {
        left = margin;
    }


    if (top < margin) {
        top = margin;
    }


    panel.style.left =
        `${left}px`;

    panel.style.top =
        `${top}px`;
}


/* =========================================================
 * CREATE PANEL
 * ========================================================= */

function createPanel() {
    let panel =
        document.getElementById(
            PANEL_ID
        );

    if (panel) {
        return panel;
    }

    panel =
        document.createElement('div');

    panel.id =
        PANEL_ID;


    /* Lorebook */

    const lorebookButton =
        document.createElement('button');

    lorebookButton.type =
        'button';

    lorebookButton.className =
        'ltt-category';


    lorebookButton.innerHTML = `
        <span class="ltt-category-icon">◉</span>
        <span>Lorebook</span>
        <span class="ltt-category-count">0</span>
    `;


    lorebookButton.addEventListener(
        'click',
        (event) => {

            event.preventDefault();
            event.stopPropagation();

            console.log(
                `[${EXT_ID}] Lorebook / Trigger clicked`
            );

            /*
             * ระบบ Lorebook จริง
             * จะต่อเข้าตรงนี้
             */
        }
    );


    panel.appendChild(
        lorebookButton
    );


    document.body.appendChild(
        panel
    );


    return panel;
}


/* =========================================================
 * TOGGLE PANEL
 * ========================================================= */

function togglePanel() {
    const panel =
        createPanel();

    const button =
        document.getElementById(
            BUTTON_ID
        );

    if (!panel || !button) {
        return;
    }

    panelOpen =
        !panelOpen;


    if (panelOpen) {

        panel.classList.add(
            'ltt-visible'
        );

        button.classList.add(
            'ltt-active'
        );


        requestAnimationFrame(() => {
            positionPanel();
        });

    } else {

        panel.classList.remove(
            'ltt-visible'
        );

        button.classList.remove(
            'ltt-active'
        );
    }
}


/* =========================================================
 * CREATE BUTTON
 * ========================================================= */

function createButton(toolbar) {

    let button =
        document.getElementById(
            BUTTON_ID
        );


    if (button) {

        keepButtonAtEnd(
            toolbar,
            button
        );

        updatePersona(
            button
        );

        return button;
    }


    addStyles();


    button =
        document.createElement('div');


    button.id =
        BUTTON_ID;

    button.className =
        'interactable';


    button.title =
        'Lorebook Trigger Tracker';


    button.setAttribute(
        'aria-label',
        'Lorebook Trigger Tracker'
    );


    button.tabIndex =
        0;


    const image =
        document.createElement('img');

    image.className =
        'ltt-persona-image';

    image.alt =
        '';

    image.draggable =
        false;


    const fallback =
        document.createElement('div');

    fallback.className =
        'ltt-fallback';

    fallback.textContent =
        '◉';


    button.appendChild(
        image
    );

    button.appendChild(
        fallback
    );


    button.addEventListener(
        'click',
        (event) => {

            event.preventDefault();

            event.stopPropagation();


            updatePersona(
                button
            );


            togglePanel();
        }
    );


    button.addEventListener(
        'keydown',
        (event) => {

            if (
                event.key === 'Enter' ||
                event.key === ' '
            ) {

                event.preventDefault();

                button.click();
            }
        }
    );


    toolbar.appendChild(
        button
    );


    keepButtonAtEnd(
        toolbar,
        button
    );


    updatePersona(
        button
    );


    createPanel();


    console.log(
        `[${EXT_ID}] Persona tool inserted`
    );


    return button;
}


/* =========================================================
 * KEEP BUTTON LAST
 * ========================================================= */

function keepButtonAtEnd(
    toolbar,
    button
) {

    if (!toolbar || !button) {
        return;
    }


    button.style.order =
        '9999';


    if (
        toolbar.lastElementChild !==
        button
    ) {

        toolbar.appendChild(
            button
        );
    }
}


/* =========================================================
 * WATCH TOOLBAR
 * ========================================================= */

function watchToolbar(
    toolbar,
    button
) {

    if (toolbarObserver) {
        toolbarObserver.disconnect();
    }


    toolbarObserver =
        new MutationObserver(() => {

            keepButtonAtEnd(
                toolbar,
                button
            );
        });


    toolbarObserver.observe(
        toolbar,
        {
            childList: true,
        }
    );
}


/* =========================================================
 * START
 * ========================================================= */

function startToolbarWatch() {

    const toolbar =
        findToolbar();


    if (toolbar) {

        const button =
            createButton(
                toolbar
            );


        watchToolbar(
            toolbar,
            button
        );


        initialized =
            true;

        return;
    }


    toolbarObserver =
        new MutationObserver(() => {

            const currentToolbar =
                findToolbar();


            if (!currentToolbar) {
                return;
            }


            toolbarObserver.disconnect();

            toolbarObserver = null;


            const button =
                createButton(
                    currentToolbar
                );


            watchToolbar(
                currentToolbar,
                button
            );


            initialized =
                true;
        });


    toolbarObserver.observe(
        document.documentElement,
        {
            childList: true,
            subtree: true,
        }
    );
}


/* =========================================================
 * CLOSE ON OUTSIDE CLICK
 * ========================================================= */

document.addEventListener(
    'click',
    (event) => {

        if (!panelOpen) {
            return;
        }


        const panel =
            document.getElementById(
                PANEL_ID
            );

        const button =
            document.getElementById(
                BUTTON_ID
            );


        if (!panel || !button) {
            return;
        }


        if (
            panel.contains(
                event.target
            ) ||
            button.contains(
                event.target
            )
        ) {
            return;
        }


        panelOpen =
            false;


        panel.classList.remove(
            'ltt-visible'
        );


        button.classList.remove(
            'ltt-active'
        );
    }
);


/* =========================================================
 * WINDOW EVENTS
 * ========================================================= */

window.addEventListener(
    'resize',
    () => {

        if (panelOpen) {
            positionPanel();
        }
    }
);


window.addEventListener(
    'scroll',
    () => {

        if (panelOpen) {
            positionPanel();
        }
    },
    true
);


/* =========================================================
 * SILLYTAVERN ENTRY
 * ========================================================= */

export async function init() {

    console.log(
        `[${EXT_ID}] init()`
    );


    if (initialized) {
        return;
    }


    startToolbarWatch();
}
