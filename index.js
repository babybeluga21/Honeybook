
const EXT_ID = 'lorebook-trigger-tracker';
const BUTTON_ID = `${EXT_ID}-button`;
const PANEL_ID = `${EXT_ID}-panel`;

let initialized = false;
let panelOpen = false;
let positionObserver = null;
let positionFrame = 0;

function addStyles() {
    if (document.getElementById(`${EXT_ID}-style`)) return;

    const style = document.createElement('style');
    style.id = `${EXT_ID}-style`;

    style.textContent = `
        #${BUTTON_ID} {
            position: fixed !important;
            left: 8px;
            top: 50%;
            z-index: 999998;

            width: 32px;
            height: 34px;
            padding: 0;
            margin: 0;
            border: none;
            border-radius: 0;
            outline: none;

            display: flex;
            align-items: center;
            justify-content: center;

            background: transparent !important;
            box-shadow: none !important;
            color: #ff8a3d !important;

            cursor: pointer;
            user-select: none;
            -webkit-tap-highlight-color: transparent;

            transform: translateY(-100%);
            transition:
                color .15s ease,
                opacity .15s ease,
                transform .15s ease;
        }

        #${BUTTON_ID} .ltt-arrow {
            display: block;
            font-family: Arial, sans-serif;
            font-size: 38px;
            font-weight: 300;
            line-height: 1;
            color: #ff8a3d;
            pointer-events: none;
        }

        #${BUTTON_ID}:hover {
            color: #ffad70 !important;
        }

        #${BUTTON_ID}:active {
            transform: translateY(-100%) translateX(2px);
        }

        #${BUTTON_ID}.ltt-active .ltt-arrow {
            color: #ffc08d;
            text-shadow: 0 0 8px rgba(255,138,61,.3);
        }

        #${PANEL_ID} {
            position: fixed;
            display: none;
            align-items: center;
            gap: 3px;
            padding: 4px;

            box-sizing: border-box;
            max-width: calc(100vw - 16px);

            background: rgba(35,35,40,.78);
            backdrop-filter: blur(14px) saturate(120%);
            -webkit-backdrop-filter: blur(14px) saturate(120%);

            border: 1px solid rgba(255,255,255,.14);
            border-radius: 8px;

            box-shadow: 0 6px 20px rgba(0,0,0,.2);

            z-index: 999999;
            opacity: 0;
            transform: translateY(4px) scale(.97);
            transform-origin: bottom left;
            pointer-events: none;

            transition:
                opacity .16s ease,
                transform .16s ease;
        }

        #${PANEL_ID}.ltt-visible {
            display: flex;
            opacity: 1;
            transform: translateY(0) scale(1);
            pointer-events: auto;
        }

        #${PANEL_ID} .ltt-category {
            appearance: none;
            -webkit-appearance: none;

            display: flex;
            align-items: center;
            gap: 5px;

            min-height: 30px;
            padding: 0 9px;
            margin: 0;

            border: 0;
            border-radius: 5px;
            background: rgba(255,255,255,.05);

            color: rgba(255,255,255,.88);
            font-family: inherit;
            font-size: 12px;

            white-space: nowrap;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
        }

        #${PANEL_ID} .ltt-category:active {
            background: rgba(255,255,255,.12);
        }

        #${PANEL_ID} .ltt-category-icon {
            font-size: 12px;
        }

        #${PANEL_ID} .ltt-category-count {
            min-width: 15px;
            height: 15px;
            padding: 0 4px;

            display: inline-flex;
            align-items: center;
            justify-content: center;

            border-radius: 8px;
            background: rgba(255,255,255,.1);
            color: rgba(255,255,255,.7);
            font-size: 10px;
        }
    `;

    document.head.appendChild(style);
}

function findSendForm() {
    return document.querySelector('#send_form');
}

function findTextbox() {
    const selectors = [
        '#send_textarea',
        '#chat_textarea',
        'textarea[name="message"]',
        '#send_form textarea',
        '#send_form [contenteditable="true"]'
    ];

    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) return element;
    }

    return findSendForm();
}

/*
 * วางลูกศรเหนือกล่องข้อความทางซ้าย
 * คำนวณใหม่จากตำแหน่งจริงเพื่อรองรับมือถือ
 */
function positionButton() {
    const button = document.getElementById(BUTTON_ID);
    const target = findTextbox();

    if (!button || !target) return;

    const rect = target.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    const margin = 8;
    const buttonHeight = button.offsetHeight || 34;

    let left = rect.left;
    let top = rect.top - 4;

    // ถ้าพื้นที่เหนือกล่องข้อความไม่พอ
    // ให้วางลูกศรไว้ภายในขอบบนของกล่องแทน
    if (top - buttonHeight < margin) {
        top = Math.max(margin + buttonHeight, rect.top + buttonHeight);
    }

    // ป้องกันลูกศรหลุดขอบจอ
    left = Math.max(
        margin,
        Math.min(left, window.innerWidth - 32 - margin)
    );

    top = Math.max(
        buttonHeight + margin,
        Math.min(top, window.innerHeight - margin)
    );

    button.style.left = `${left}px`;
    button.style.top = `${top}px`;
}

function schedulePosition() {
    if (positionFrame) {
        cancelAnimationFrame(positionFrame);
    }

    positionFrame = requestAnimationFrame(() => {
        positionFrame = 0;
        positionButton();

        if (panelOpen) positionPanel();
    });
}

function positionPanel() {
    const panel = document.getElementById(PANEL_ID);
    const button = document.getElementById(BUTTON_ID);

    if (!panel || !button) return;

    // วัดขนาดจริงของแผง แม้ก่อนแสดงผล
    panel.style.visibility = 'hidden';
    panel.style.display = 'flex';

    const buttonRect = button.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const margin = 8;

    let left = buttonRect.left;
    let top = buttonRect.top - panelRect.height - 4;

    // ถ้าแผงสูงเกินพื้นที่ด้านบน ให้แสดงใต้ปุ่ม
    if (top < margin) {
        top = buttonRect.bottom + 4;
    }

    // ไม่ให้แผงเกินขอบจอด้านขวา
    left = Math.min(
        left,
        window.innerWidth - panelRect.width - margin
    );

    left = Math.max(margin, left);

    // ป้องกันแผงเกินขอบจอด้านล่าง
    top = Math.min(
        top,
        window.innerHeight - panelRect.height - margin
    );

    top = Math.max(margin, top);

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
    panel.style.visibility = '';

    if (!panelOpen) {
        panel.style.display = 'none';
    }
}

function createPanel() {
    let panel = document.getElementById(PANEL_ID);
    if (panel) return panel;

    panel = document.createElement('div');
    panel.id = PANEL_ID;

    const lorebookButton = document.createElement('button');
    lorebookButton.type = 'button';
    lorebookButton.className = 'ltt-category';

    lorebookButton.innerHTML = `
        <span class="ltt-category-icon">◉</span>
        <span>Lorebook</span>
        <span class="ltt-category-count">0</span>
    `;

    lorebookButton.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();

        console.log(
            `[${EXT_ID}] Lorebook / Trigger clicked`
        );

        /*
         * เชื่อมระบบตรวจจับ Trigger จริงในขั้นตอนถัดไป
         * ส่วนนี้ยังไม่ได้อ่านข้อมูลจาก Lorebook
         */
    });

    panel.appendChild(lorebookButton);
    document.body.appendChild(panel);

    return panel;
}

function togglePanel() {
    const button = document.getElementById(BUTTON_ID);
    const panel = createPanel();

    if (!button || !panel) return;

    panelOpen = !panelOpen;

    if (panelOpen) {
        panel.style.display = 'flex';
        positionPanel();

        requestAnimationFrame(() => {
            panel.classList.add('ltt-visible');
            button.classList.add('ltt-active');
            positionPanel();
        });
    } else {
        panel.classList.remove('ltt-visible');
        button.classList.remove('ltt-active');

        setTimeout(() => {
            if (!panelOpen) panel.style.display = 'none';
        }, 170);
    }
}

function createButton() {
    let button = document.getElementById(BUTTON_ID);
    if (button) return button;

    button = document.createElement('button');
    button.id = BUTTON_ID;
    button.type = 'button';
    button.setAttribute('aria-label', 'Lorebook Trigger Tracker');
    button.setAttribute('aria-expanded', 'false');
    button.title = 'Lorebook Trigger Tracker';

    const arrow = document.createElement('span');
    arrow.className = 'ltt-arrow';
    arrow.textContent = '›';

    button.appendChild(arrow);

    button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();

        togglePanel();
        button.setAttribute(
            'aria-expanded',
            String(panelOpen)
        );
    });

    document.body.appendChild(button);

    return button;
}

function closePanel() {
    if (!panelOpen) return;

    panelOpen = false;

    const panel = document.getElementById(PANEL_ID);
    const button = document.getElementById(BUTTON_ID);

    if (panel) {
        panel.classList.remove('ltt-visible');

        setTimeout(() => {
            if (!panelOpen) panel.style.display = 'none';
        }, 170);
    }

    if (button) {
        button.classList.remove('ltt-active');
        button.setAttribute('aria-expanded', 'false');
    }
}

function startPositionObserver() {
    if (positionObserver) {
        positionObserver.disconnect();
    }

    positionObserver = new MutationObserver(schedulePosition);

    positionObserver.observe(document.body, {
        childList: true,
        subtree: true
    });

    window.addEventListener('resize', schedulePosition, {
        passive: true
    });

    window.addEventListener('scroll', schedulePosition, {
        passive: true,
        capture: true
    });

    window.addEventListener('orientationchange', () => {
        setTimeout(schedulePosition, 150);
    });

    if (window.visualViewport) {
        window.visualViewport.addEventListener(
            'resize',
            schedulePosition,
            { passive: true }
        );

        window.visualViewport.addEventListener(
            'scroll',
            schedulePosition,
            { passive: true }
        );
    }
}

document.addEventListener('click', event => {
    if (!panelOpen) return;

    const panel = document.getElementById(PANEL_ID);
    const button = document.getElementById(BUTTON_ID);

    if (
        panel?.contains(event.target) ||
        button?.contains(event.target)
    ) {
        return;
    }

    closePanel();
});

document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closePanel();
});

export async function init() {
    if (initialized) return;

    initialized = true;

    addStyles();
    createPanel();
    createButton();
    startPositionObserver();

    schedulePosition();

    console.log(`[${EXT_ID}] Floating arrow initialized`);
}
