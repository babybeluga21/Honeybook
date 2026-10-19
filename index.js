const EXT_ID = 'lorebook-trigger-tracker';
const BUTTON_ID = `${EXT_ID}-button`;
const PANEL_ID = `${EXT_ID}-panel`;
const ORB_SIZE = 23;

// ขยับลูกแก้วขึ้นจากขอบกล่องข้อความ (px) ปรับเลขนี้ได้
const NUDGE_UP = 5;

// ตัวเลือกกลมที่แผ่ออกมาเป็นส่วนโค้ง
const ITEM_SIZE = 30;
const ARC_RADIUS = 56;
const ARC_STEP = 36;

// ไอคอนประกายสี่แฉก (ใช้สีตามตัวอักษร)
const SPARK = '<svg viewBox="0 0 10 10" width="10" height="10" fill="currentColor" aria-hidden="true"><path d="M5 0C5.4 3.2 6.8 4.6 10 5C6.8 5.4 5.4 6.8 5 10C4.6 6.8 3.2 5.4 0 5C3.2 4.6 4.6 3.2 5 0Z"/></svg>';

// เพิ่มตัวเลือกใหม่ได้ที่นี่ (แนะนำไม่เกิน 3 อัน)
const CATEGORIES = [
    { id: 'lorebook', label: 'Lorebook', icon: SPARK, count: 0 }
];

let initialized = false;
let panelOpen = false;
let positionObserver = null;
let positionFrame = 0;

function addStyles() {
    if (document.getElementById(`${EXT_ID}-style`)) return;

    const style = document.createElement('style');
    style.id = `${EXT_ID}-style`;

    style.textContent = `
    /* ===== ลูกแก้ว (ป้ายครีม) ===== */
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

        border: 0 !important;
        border-radius: 50% !important;
        background: #f6e8e2 !important;
        box-shadow: 0 2px 5px rgba(0,0,0,.3) !important;
        color: #b3243f;

        cursor: pointer;
        user-select: none;
        -webkit-tap-highlight-color: transparent;

        transform: translateY(-100%);
        transition: background .2s ease, color .2s ease, transform .15s ease;
    }

    /* วงบางล้อมรอบ */
    #${BUTTON_ID}::before {
        content: '';
        position: absolute;
        inset: -3px;
        border-radius: 50%;
        border: 1px solid rgba(246,232,226,.6);
        pointer-events: none;
        transition: border-color .2s ease;
    }

    #${BUTTON_ID} .ltt-gem {
        display: flex;
        line-height: 0;
        pointer-events: none;
        transition: transform .2s ease;
    }

    #${BUTTON_ID} .ltt-gem svg {
        width: 11px;
        height: 11px;
    }

    #${BUTTON_ID}:not(.ltt-active):hover {
        background: #fff7f3 !important;
    }

    #${BUTTON_ID}:active {
        transform: translateY(-100%) scale(.94);
    }

    /* ตอนเปิด: วงกลายเป็นแดง ประกายกระพริบ */
    #${BUTTON_ID}.ltt-active {
        background: #b3243f !important;
        color: #f6e8e2;
    }

    #${BUTTON_ID}.ltt-active::before {
        border-color: rgba(246,232,226,.95);
    }

    #${BUTTON_ID}.ltt-active .ltt-gem {
        transform: scale(1.1) rotate(90deg);
    }

    #${BUTTON_ID} .ltt-spark {
        position: absolute;
        display: flex;
        opacity: 0;
        transform: scale(0);
        pointer-events: none;
        transition: opacity .2s ease, transform .2s ease;
    }

    #${BUTTON_ID} .ltt-spark svg {
        width: 100%;
        height: 100%;
    }

    #${BUTTON_ID} .ltt-s1 { top: -11px; right: -10px; width: 8px; height: 8px; color: #f6e8e2; }
    #${BUTTON_ID} .ltt-s2 { bottom: -9px; left: -9px; width: 5px; height: 5px; color: #e0788a; }

    #${BUTTON_ID}.ltt-active .ltt-spark {
        opacity: 1;
        transform: scale(1);
        animation: ltt-twinkle 1.6s ease-in-out infinite alternate;
    }

    #${BUTTON_ID}.ltt-active .ltt-s2 {
        animation-delay: .8s;
    }

    @keyframes ltt-twinkle {
        from { transform: scale(.55); opacity: .5; }
        to   { transform: scale(1);   opacity: 1; }
    }

    @media (prefers-reduced-motion: reduce) {
        #${BUTTON_ID}.ltt-active .ltt-spark { animation: none; }
    }

    /* ===== ตัวเลือกกลม (จุดศูนย์กลางอยู่ที่ลูกแก้ว) ===== */
    #${PANEL_ID} {
        --r: ${ARC_RADIUS}px;
        position: fixed;
        left: 0;
        top: 0;
        width: 0;
        height: 0;
        z-index: 999999;
        pointer-events: none;
        font-family: 'Segoe UI', 'Sarabun', Tahoma, sans-serif;
    }

    /* เส้นโค้งบางเชื่อมตัวเลือก */
    #${PANEL_ID} .ltt-arc {
        position: absolute;
        left: 0;
        top: 0;
        width: calc(var(--r) * 2);
        height: calc(var(--r) * 2);
        box-sizing: border-box;
        border: 1px solid rgba(245,239,242,.3);
        border-radius: 50%;
        opacity: 0;
        transform: translate(-50%, -50%) scale(.6);
        transition: opacity .2s ease, transform .26s ease;
    }

    #${PANEL_ID}.ltt-visible .ltt-arc {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }

    #${PANEL_ID} .ltt-item {
        appearance: none;
        -webkit-appearance: none;

        position: absolute;
        left: 0;
        top: 0;
        width: ${ITEM_SIZE}px;
        height: ${ITEM_SIZE}px;
        padding: 0;
        margin: 0;

        display: flex;
        align-items: center;
        justify-content: center;

        border: 0 !important;
        border-radius: 50% !important;
        background: rgba(246,232,226,.92) !important;
        box-shadow: 0 3px 8px rgba(0,0,0,.3) !important;
        color: #b3243f;

        cursor: pointer;
        -webkit-tap-highlight-color: transparent;

        opacity: 0;
        pointer-events: none;
        transform: translate(-50%, -50%) scale(.3);
        transition:
            transform .28s cubic-bezier(.2,.9,.3,1.25) var(--d, 0s),
            opacity .18s ease var(--d, 0s),
            background .15s ease;
    }

    #${PANEL_ID}.ltt-visible .ltt-item {
        opacity: 1;
        pointer-events: auto;
        transform: translate(calc(-50% + var(--x, 0px)), calc(-50% + var(--y, 0px))) scale(1);
    }

    #${PANEL_ID} .ltt-item:active {
        background: #fff !important;
    }

    #${PANEL_ID} .ltt-item svg {
        width: 12px;
        height: 12px;
    }

    /* วงบางรอบตัวเลือก */
    #${PANEL_ID} .ltt-item::before {
        content: '';
        position: absolute;
        inset: -3px;
        border-radius: 50%;
        border: 1px solid rgba(246,232,226,.5);
        pointer-events: none;
    }

    /* พู่ห้อยใต้ตัวเลือก */
    #${PANEL_ID} .ltt-item::after {
        content: '';
        position: absolute;
        left: 50%;
        top: calc(100% + 3px);
        width: 5px;
        height: 11px;
        transform: translateX(-50%);
        pointer-events: none;
        background:
            linear-gradient(#c24a5e, #c24a5e) center top / 1px 7px no-repeat,
            radial-gradient(circle, #c24a5e 1.6px, transparent 2px) center bottom / 5px 5px no-repeat;
    }

    #${PANEL_ID} .ltt-item-label {
        position: absolute;
        left: calc(100% + 9px);
        top: 50%;
        transform: translateY(-50%);
        padding: 1px 6px;

        border: 1px solid rgba(194,74,94,.6);
        border-radius: 2px;
        background: rgba(20,18,28,.5);
        color: #efe7ea;

        font-family: Georgia, serif;
        font-size: 9px;
        letter-spacing: 2px;
        text-transform: uppercase;
        white-space: nowrap;
        pointer-events: none;
    }

    #${PANEL_ID}.ltt-flip .ltt-item-label {
        left: auto;
        right: calc(100% + 9px);
    }

    #${PANEL_ID} .ltt-count {
        position: absolute;
        top: -5px;
        right: -5px;
        min-width: 13px;
        height: 13px;
        padding: 0 3px;
        box-sizing: border-box;

        display: flex;
        align-items: center;
        justify-content: center;

        border-radius: 7px;
        background: #b02a45;
        color: #fff;
        font-size: 9px;
        line-height: 1;
        pointer-events: none;
    }
`;

    document.head.appendChild(style);
}

// ไอคอนสามขีด (ปุ่มเมนูทางซ้ายของกล่องข้อความ)
function findMenuButton() {
    return document.querySelector('#options_button');
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
 * วางลูกแก้วเหนือไอคอนสามขีดทางซ้ายของกล่องข้อความ
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

    // จัดให้อยู่กึ่งกลางเหนือไอคอนสามขีด ถ้าไม่เจอให้ใช้ขอบซ้ายของกล่องข้อความ
    const menu = findMenuButton();
    const menuRect = menu ? menu.getBoundingClientRect() : null;

    let left = menuRect && menuRect.width
        ? menuRect.left + menuRect.width / 2 - ORB_SIZE / 2
        : rect.left;
    let top = rect.top - 4 - NUDGE_UP;

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
        positionPanel();
    });
}

/*
 * แผ่ตัวเลือกกลมเป็นส่วนโค้งรอบลูกแก้ว
 * ปกติโค้งขึ้นด้านบน-ขวา ถ้าชิดขอบจะกลับด้านให้อัตโนมัติ
 */
function positionPanel() {
    const panel = document.getElementById(PANEL_ID);
    const button = document.getElementById(BUTTON_ID);

    if (!panel || !button) return;

    const rect = button.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    panel.style.left = `${cx}px`;
    panel.style.top = `${cy}px`;

    const margin = 8;
    const need = ARC_RADIUS + ITEM_SIZE / 2 + 12;

    const sy = cy - need >= margin ? 1 : -1;
    const sx = cx + need <= window.innerWidth - margin ? 1 : -1;

    panel.classList.toggle('ltt-flip', sx < 0);

    const items = panel.querySelectorAll('.ltt-item');
    const n = items.length;

    items.forEach((item, i) => {
        const theta = (45 + ARC_STEP * (i - (n - 1) / 2)) * Math.PI / 180;
        const x = sx * ARC_RADIUS * Math.sin(theta);
        const y = -sy * ARC_RADIUS * Math.cos(theta);

        item.style.setProperty('--x', `${x.toFixed(1)}px`);
        item.style.setProperty('--y', `${y.toFixed(1)}px`);
        item.style.setProperty('--d', `${i * 45}ms`);
    });

    const arc = panel.querySelector('.ltt-arc');

    if (arc) {
        const top = sy === 1 ? '0' : '50%';
        const bottom = sy === 1 ? '50%' : '0';
        const left = sx === 1 ? '50%' : '0';
        const right = sx === 1 ? '0' : '50%';

        arc.style.clipPath = `inset(${top} ${right} ${bottom} ${left})`;
    }
}

function createPanel() {
    let panel = document.getElementById(PANEL_ID);
    if (panel) return panel;

    panel = document.createElement('div');
    panel.id = PANEL_ID;

    const arc = document.createElement('div');
    arc.className = 'ltt-arc';
    panel.appendChild(arc);

    for (const category of CATEGORIES) {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'ltt-item';
        item.dataset.id = category.id;
        item.title = category.label;

        item.innerHTML = `
            ${category.icon}
            <span class="ltt-item-label">${category.label}</span>
            <span class="ltt-count">${category.count}</span>
        `;

        item.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();

            console.log(
                `[${EXT_ID}] ${category.label} clicked`
            );

            /*
             * เชื่อมระบบตรวจจับ Trigger จริงในขั้นตอนถัดไป
             * ส่วนนี้ยังไม่ได้อ่านข้อมูลจาก Lorebook
             */
        });

        panel.appendChild(item);
    }

    document.body.appendChild(panel);

    return panel;
}

function togglePanel() {
    const button = document.getElementById(BUTTON_ID);
    const panel = createPanel();

    if (!button || !panel) return;

    panelOpen = !panelOpen;

    positionPanel();

    panel.classList.toggle('ltt-visible', panelOpen);
    button.classList.toggle('ltt-active', panelOpen);
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
    gem.innerHTML = SPARK;

    button.appendChild(gem);

    for (const cls of ['ltt-s1', 'ltt-s2']) {
        const spark = document.createElement('span');
        spark.className = `ltt-spark ${cls}`;
        spark.innerHTML = SPARK;
        button.appendChild(spark);
    }

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
