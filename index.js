const EXT_ID = 'lorebook-trigger-tracker';
const BUTTON_ID = `${EXT_ID}-button`;
const PANEL_ID = `${EXT_ID}-panel`;
const ORB_SIZE = 34;

let initialized = false;
let panelOpen = false;
let positionObserver = null;
let positionFrame = 0;

function addStyles() {
    if (document.getElementById(`${EXT_ID}-style`)) return;

    const style = document.createElement('style');
    style.id = `${EXT_ID}-style`;

    style.textContent = `
    /* ===== ลูกแก้ว ===== */
    #${BUTTON_ID} {
        position: fixed !important;
        left: 8px;
        top: 50%;
        z-index: 999998;

        width: ${ORB_SIZE}px;
        height: ${ORB_SIZE}px;
        padding: 0;
        margin: 0;
        outline: none;

        display: flex;
        align-items: center;
        justify-content: center;

        border: 1px solid rgba(225,215,235,.4) !important;
        border-radius: 50% !important;
        background: linear-gradient(135deg, rgba(125,30,52,.55), rgba(30,28,42,.55) 70%) !important;
        -webkit-backdrop-filter: blur(8px);
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 14px rgba(0,0,0,.35) !important;

        cursor: pointer;
        user-select: none;
        -webkit-tap-highlight-color: transparent;

        transform: translateY(-100%);
        transition: border-color .15s ease, transform .15s ease;
    }

    /* วงจุดไข่ปลารอบลูกแก้ว (ลายลูกไม้) */
    #${BUTTON_ID}::before {
        content: '';
        position: absolute;
        inset: -4px;
        border-radius: 50%;
        border: 1px dotted rgba(245,239,242,.55);
        pointer-events: none;
        transition: border-color .15s ease;
    }

    #${BUTTON_ID} .ltt-gem {
        display: block;
        font-size: 14px;
        line-height: 1;
        color: #f5eff2;
        pointer-events: none;
        transition: transform .15s ease;
    }

    #${BUTTON_ID}:hover {
        border-color: rgba(245,239,242,.7) !important;
    }

    #${BUTTON_ID}:active {
        transform: translateY(-100%) scale(.94);
    }

    #${BUTTON_ID}.ltt-active {
        background: linear-gradient(135deg, rgba(160,40,65,.7), rgba(30,28,42,.55) 70%) !important;
    }

    #${BUTTON_ID}.ltt-active::before {
        border-style: solid;
        border-color: rgba(245,239,242,.7);
    }

    #${BUTTON_ID}.ltt-active .ltt-gem {
        transform: scale(1.12);
    }

    /* ===== แผง ===== */
    #${PANEL_ID} {
        position: fixed;
        display: none;
        align-items: center;
        gap: 4px;
        padding: 10px 6px 6px;

        box-sizing: border-box;
        max-width: calc(100vw - 16px);

        background: linear-gradient(90deg, rgba(125,30,52,.55), rgba(30,28,42,.55) 65%);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);

        border: 1px solid rgba(225,215,235,.4);
        border-left: 3px solid #c24a5e;
        border-radius: 3px;

        box-shadow: 0 4px 14px rgba(0,0,0,.35);
        font-family: 'Segoe UI', 'Sarabun', Tahoma, sans-serif;

        z-index: 999999;
        opacity: 0;
        transform: translateY(4px) scale(.97);
        transform-origin: bottom left;
        pointer-events: none;

        transition: opacity .16s ease, transform .16s ease;
    }

    /* ลูกไม้ขอบบน */
    #${PANEL_ID}::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 5px;
        background: radial-gradient(circle at 4px 0, #f5eff2 2.7px, transparent 3px) 0 0/8px 5px repeat-x;
        pointer-events: none;
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
        gap: 6px;

        min-height: 28px;
        padding: 0 9px;
        margin: 0;

        border: 1px solid rgba(194,74,94,.75);
        border-radius: 2px;
        background: rgba(20,18,28,.35);

        color: #efe7ea;
        font-family: inherit;
        font-size: 12px;

        white-space: nowrap;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
    }

    #${PANEL_ID} .ltt-category:active {
        background: rgba(194,74,94,.3);
    }

    #${PANEL_ID} .ltt-category-icon {
        font-size: 11px;
        color: #e0788a;
    }

    #${PANEL_ID} .ltt-category-count {
        min-width: 15px;
        height: 15px;
        padding: 0 4px;

        display: inline-flex;
        align-items: center;
        justify-content: center;

        border-radius: 8px;
        background: rgba(194,74,94,.35);
        color: #f5eff2;
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
 * วางลูกแก้วเหนือกล่องข้อความทางซ้าย
 * คำนวณใหม่จากตำแหน่งจริงเพื่อรองรับมือถือ
 */
function positionButton() {
    const button = document.getElementById(BUTTON_ID);
    const target = findTextbox();

    if (!button || !target) return;

    const rect = target.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    const margin = 8;
    const buttonHeight = button.offsetHeight || ORB_SIZE;

    let left = rect.left;
    let top = rect.top - 4;

    // ถ้าพื้นที่เหนือกล่องข้อความไม่พอ
    // ให้วางลูกแก้วไว้ภายในขอบบนของกล่องแทน
    if (top - buttonHeight < margin) {
        top = Math.max(margin + buttonHeight, rect.top + buttonHeight);
    }

    // ป้องกันลูกแก้วหลุดขอบจอ
    left = Math.max(
        margin,
        Math.min(left, window.innerWidth - ORB_SIZE - margin)
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
    let top = buttonRect.top - panelRect.height - 6;

    // ถ้าแผงสูงเกินพื้นที่ด้านบน ให้แสดงใต้ปุ่ม
    if (top < margin) {
        top = buttonRect.bottom + 6;
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
        <span class="ltt-category-icon">♥</span>
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

    const gem = document.createElement('span');
    gem.className = 'ltt-gem';
    gem.textContent = '♥';

    button.appendChild(gem);

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

    console.log(`[${EXT_ID}] Floating orb initialized`);
}
