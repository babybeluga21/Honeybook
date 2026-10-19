const EXT_ID = 'lorebook-trigger-tracker';
const BUTTON_ID = `${EXT_ID}-button`;
const PANEL_ID = `${EXT_ID}-panel`;
const SHEET_ID = `${EXT_ID}-sheet`;
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
    { id: 'lorebook', label: 'Lorebook', icon: SPARK, count: 0, onClick: () => toggleSheet() }
];

// ดูข้อความล่าสุดกี่ข้อความเพื่อหาคีย์ที่ตรง (ใช้ประมาณคีย์ที่ทำให้ทริกเกอร์)
const SCAN_MESSAGES = 8;

let initialized = false;
let panelOpen = false;
let positionObserver = null;
let positionFrame = 0;

let sheetOpen = false;
let viewIndex = -1;
let capturing = false;
let pendingTriggers = null;

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

    /* ===== แผงแสดงทริกเกอร์ Lorebook ===== */
    #${SHEET_ID} {
        position: fixed;
        left: 8px;
        right: 8px;
        bottom: 80px;
        max-width: 440px;
        max-height: 50vh;
        margin: 0 auto;
        box-sizing: border-box;

        display: flex;
        flex-direction: column;

        background: linear-gradient(90deg, rgba(125,30,52,.6), rgba(30,28,42,.6) 65%);
        -webkit-backdrop-filter: blur(10px);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(225,215,235,.4);
        border-left: 3px solid #c24a5e;
        border-radius: 3px;
        box-shadow: 0 4px 14px rgba(0,0,0,.35);

        color: #efe7ea;
        font-family: 'Segoe UI', 'Sarabun', Tahoma, sans-serif;
        font-size: 12px;

        z-index: 1000000;
        visibility: hidden;
        opacity: 0;
        transform: translateY(6px);
        pointer-events: none;
        transition: opacity .18s ease, transform .18s ease, visibility .18s;
    }

    #${SHEET_ID}.ltt-visible {
        visibility: visible;
        opacity: 1;
        transform: none;
        pointer-events: auto;
    }

    /* ลูกไม้ขอบบน */
    #${SHEET_ID}::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 5px;
        background: radial-gradient(circle at 4px 0, #f5eff2 2.7px, transparent 3px) 0 0/8px 5px repeat-x;
        pointer-events: none;
    }

    #${SHEET_ID} .ltt-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 10px 4px 12px;
    }

    #${SHEET_ID} .ltt-title {
        font-family: Georgia, serif;
        font-size: 11px;
        letter-spacing: 3px;
        color: #e0788a;
    }

    #${SHEET_ID} .ltt-nav {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    #${SHEET_ID} .ltt-nav button {
        appearance: none;
        -webkit-appearance: none;
        width: 22px;
        height: 22px;
        padding: 0;
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(194,74,94,.75) !important;
        border-radius: 2px !important;
        background: rgba(20,18,28,.35) !important;
        box-shadow: none !important;
        color: #efe7ea;
        font-size: 13px;
        line-height: 1;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
    }

    #${SHEET_ID} .ltt-nav button:disabled {
        opacity: .35;
    }

    #${SHEET_ID} .ltt-nav-label {
        min-width: 34px;
        text-align: center;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        color: #f6e8e2;
    }

    #${SHEET_ID} .ltt-meta {
        padding: 0 12px 6px;
        color: #bfaeb6;
        font-size: 11px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    #${SHEET_ID} .ltt-list {
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        padding: 0 12px 10px;
    }

    #${SHEET_ID} .ltt-note {
        padding: 8px 0 2px;
        color: #bfaeb6;
    }

    #${SHEET_ID} .ltt-card {
        margin-top: 6px;
        padding: 6px 8px;
        border: 1px solid rgba(194,74,94,.5);
        border-radius: 2px;
        background: rgba(20,18,28,.35);
    }

    #${SHEET_ID} .ltt-card-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
    }

    #${SHEET_ID} .ltt-card-title {
        color: #fff;
        font-size: 12.5px;
        word-break: break-word;
    }

    #${SHEET_ID} .ltt-book {
        flex: none;
        max-width: 40%;
        padding: 0 5px;
        border: 1px solid rgba(194,74,94,.6);
        border-radius: 2px;
        color: #e0788a;
        font-family: Georgia, serif;
        font-size: 9px;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    #${SHEET_ID} .ltt-keys {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-top: 5px;
    }

    #${SHEET_ID} .ltt-key {
        padding: 0 7px;
        border: 1px solid rgba(246,232,226,.5);
        border-radius: 9px;
        background: rgba(246,232,226,.1);
        color: #f6e8e2;
        font-size: 11px;
        word-break: break-word;
    }

    #${SHEET_ID} .ltt-key.ltt-sec {
        border-style: dashed;
    }

    #${SHEET_ID} .ltt-tag {
        margin-top: 4px;
        color: #bfaeb6;
        font-size: 11px;
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
        positionSheet();
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

            // ปิดวงตัวเลือกก่อน แล้วค่อยทำงานของตัวเลือกนั้น
            closePanel();

            if (typeof category.onClick === 'function') {
                category.onClick();
            }
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

        if (sheetOpen) {
            closeSheet();
            return;
        }

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
        button.classList.toggle('ltt-active', sheetOpen);
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
    const panel = document.getElementById(PANEL_ID);
    const button = document.getElementById(BUTTON_ID);
    const sheet = document.getElementById(SHEET_ID);

    if (
        panel?.contains(event.target) ||
        button?.contains(event.target) ||
        sheet?.contains(event.target)
    ) {
        return;
    }

    if (sheetOpen) closeSheet();
    if (panelOpen) closePanel();
});

document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
        closeSheet();
        closePanel();
    }
});


/* ============================================================
 * ตรวจจับ Lorebook ที่ถูกทริกเกอร์
 * ============================================================ */

function getCtx() {
    try {
        return globalThis.SillyTavern?.getContext?.() ?? null;
    } catch {
        return null;
    }
}

function toArray(value) {
    if (Array.isArray(value)) return value;
    if (value === undefined || value === null || value === '') return [];
    return [value];
}

function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// หาว่าคีย์ไหนในรายการปรากฏอยู่ในข้อความ
function matchKeys(list, text, entry) {
    const caseSensitive = entry?.caseSensitive === true;
    const wholeWords = entry?.matchWholeWords === true;
    const haystack = caseSensitive ? text : text.toLowerCase();
    const found = [];

    for (const raw of toArray(list)) {
        const key = String(raw).trim();
        if (!key) continue;

        let ok = false;

        try {
            const regexKey = key.match(/^\/([\s\S]+)\/([a-z]*)$/i);

            if (regexKey) {
                ok = new RegExp(regexKey[1], regexKey[2]).test(text);
            } else {
                const needle = caseSensitive ? key : key.toLowerCase();

                if (wholeWords) {
                    const edge = '[^\\p{L}\\p{N}_]';
                    ok = new RegExp(
                        `(?:^|${edge})${escapeRegExp(needle)}(?:$|${edge})`,
                        'u'
                    ).test(haystack);
                } else {
                    ok = haystack.includes(needle);
                }
            }
        } catch {
            ok = false;
        }

        if (ok) found.push(key);
    }

    return found;
}

// สรุปรายการที่ถูกทริกเกอร์เป็นข้อมูลเล็ก ๆ เก็บไว้กับข้อความ
function summarizeEntries(entries, chat) {
    const text = (chat || [])
        .filter(message => message && !message.is_system)
        .slice(-SCAN_MESSAGES)
        .map(message => String(message.mes ?? ''))
        .join('\n');

    return entries.map(entry => {
        const keys = toArray(entry.key);
        const secondary = toArray(entry.keysecondary);

        return {
            w: String(entry.world ?? ''),
            id: entry.uid,
            t: String(entry.comment || keys[0] || `#${entry.uid}`),
            k: matchKeys(keys, text, entry),
            s: matchKeys(secondary, text, entry),
            c: Boolean(entry.constant),
            v: Boolean(entry.vectorized)
        };
    });
}

function trackedIndices() {
    const ctx = getCtx();
    const indices = [];

    (ctx?.chat || []).forEach((message, index) => {
        if (message?.extra?.ltt_triggers) indices.push(index);
    });

    return indices;
}

function latestTracked() {
    const indices = trackedIndices();
    return indices.length ? indices[indices.length - 1] : -1;
}

function updateBadge() {
    const ctx = getCtx();
    const index = latestTracked();
    const count = index >= 0
        ? ctx.chat[index].extra.ltt_triggers.items.length
        : 0;

    const badge = document.querySelector(
        `#${PANEL_ID} .ltt-item[data-id="lorebook"] .ltt-count`
    );

    if (badge) badge.textContent = String(count);
}

function startTracking() {
    const ctx = getCtx();

    if (!ctx?.eventSource) {
        console.warn(`[${EXT_ID}] ไม่พบ SillyTavern.getContext() จึงตรวจจับ Lorebook ไม่ได้`);
        return;
    }

    const types = ctx.eventTypes || {};
    const on = (name, fallback, handler) =>
        ctx.eventSource.on(name ?? fallback, handler);

    // เริ่มสร้างคำตอบ: เริ่มเก็บทริกเกอร์ (ข้ามการนับโทเค็นและงานเบื้องหลัง)
    on(types.GENERATION_STARTED, 'generation_started', (type, _params, dryRun) => {
        if (dryRun) return;

        capturing = type !== 'quiet';
        pendingTriggers = null;
    });

    // Lorebook ที่ถูกทริกเกอร์ในรอบนี้
    on(types.WORLD_INFO_ACTIVATED, 'world_info_activated', entries => {
        if (!capturing) return;

        const list = Array.isArray(entries)
            ? entries
            : Array.from(entries || []);

        pendingTriggers = summarizeEntries(list, getCtx()?.chat);
    });

    // คำตอบมาถึง: แนบผลทริกเกอร์ไว้กับข้อความคำตอบ
    on(types.MESSAGE_RECEIVED, 'message_received', mesId => {
        if (!capturing) return;

        const chat = getCtx()?.chat;
        if (!chat?.length) return;

        const index = Number.isInteger(mesId) ? mesId : chat.length - 1;
        const message = chat[index];

        if (!message || message.is_user || message.is_system) return;

        let question = '';

        for (let i = index - 1; i >= 0; i--) {
            if (chat[i]?.is_user) {
                question = String(chat[i].mes ?? '')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .slice(0, 40);
                break;
            }
        }

        message.extra = message.extra || {};
        message.extra.ltt_triggers = {
            q: question,
            items: pendingTriggers || []
        };

        capturing = false;
        pendingTriggers = null;
        viewIndex = index;

        updateBadge();
        if (sheetOpen) renderSheet();
    });

    // เปลี่ยนแชท: ล้างสถานะและอัปเดตตัวเลข
    on(types.CHAT_CHANGED, 'chat_id_changed', () => {
        capturing = false;
        pendingTriggers = null;
        viewIndex = -1;

        updateBadge();
        if (sheetOpen) renderSheet();
    });

    updateBadge();
}

/* ============================================================
 * แผงแสดงรายการทริกเกอร์
 * ============================================================ */

function makeEl(tag, className, text) {
    const element = document.createElement(tag);

    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;

    return element;
}

function createSheet() {
    let sheet = document.getElementById(SHEET_ID);
    if (sheet) return sheet;

    sheet = document.createElement('div');
    sheet.id = SHEET_ID;

    sheet.innerHTML = `
        <div class="ltt-head">
            <span class="ltt-title">+ TRIGGERS</span>
            <span class="ltt-nav">
                <button type="button" class="ltt-prev" aria-label="ก่อนหน้า">‹</button>
                <span class="ltt-nav-label"></span>
                <button type="button" class="ltt-next" aria-label="ถัดไป">›</button>
                <button type="button" class="ltt-close" aria-label="ปิด">✕</button>
            </span>
        </div>
        <div class="ltt-meta"></div>
        <div class="ltt-list"></div>
    `;

    const step = delta => {
        const indices = trackedIndices();
        const position = indices.indexOf(viewIndex) + delta;

        if (position < 0 || position >= indices.length) return;

        viewIndex = indices[position];
        renderSheet();
    };

    sheet.querySelector('.ltt-prev').addEventListener('click', event => {
        event.stopPropagation();
        step(-1);
    });

    sheet.querySelector('.ltt-next').addEventListener('click', event => {
        event.stopPropagation();
        step(1);
    });

    sheet.querySelector('.ltt-close').addEventListener('click', event => {
        event.stopPropagation();
        closeSheet();
    });

    document.body.appendChild(sheet);

    return sheet;
}

function renderCard(item) {
    const card = makeEl('div', 'ltt-card');

    const top = makeEl('div', 'ltt-card-top');
    top.appendChild(makeEl('span', 'ltt-card-title', item.t));

    if (item.w) top.appendChild(makeEl('span', 'ltt-book', item.w));

    card.appendChild(top);

    const keys = toArray(item.k);
    const secondary = toArray(item.s);

    if (keys.length || secondary.length) {
        const row = makeEl('div', 'ltt-keys');

        keys.forEach(key => row.appendChild(makeEl('span', 'ltt-key', key)));
        secondary.forEach(key => row.appendChild(makeEl('span', 'ltt-key ltt-sec', key)));

        card.appendChild(row);
    }

    if (item.c) {
        card.appendChild(makeEl('div', 'ltt-tag', 'constant · ทำงานตลอด'));
    } else if (!keys.length && !secondary.length) {
        card.appendChild(makeEl(
            'div',
            'ltt-tag',
            item.v
                ? 'ทริกเกอร์ด้วย vector'
                : 'ไม่พบคีย์ในข้อความล่าสุด (อาจมาจาก recursion หรือเงื่อนไขอื่น)'
        ));
    }

    return card;
}

function renderSheet() {
    const sheet = createSheet();
    const ctx = getCtx();

    const list = sheet.querySelector('.ltt-list');
    const meta = sheet.querySelector('.ltt-meta');
    const label = sheet.querySelector('.ltt-nav-label');
    const prev = sheet.querySelector('.ltt-prev');
    const next = sheet.querySelector('.ltt-next');

    list.textContent = '';

    const indices = trackedIndices();

    if (!ctx || !indices.length) {
        label.textContent = '—';
        meta.textContent = '';
        prev.disabled = true;
        next.disabled = true;

        list.appendChild(makeEl(
            'div',
            'ltt-note',
            'ยังไม่มีข้อมูล ลองส่งข้อความแล้วรอให้ตอบก่อน'
        ));

        return;
    }

    if (!indices.includes(viewIndex)) {
        viewIndex = indices[indices.length - 1];
    }

    const position = indices.indexOf(viewIndex);
    const data = ctx.chat[viewIndex].extra.ltt_triggers;
    const items = data.items || [];

    label.textContent = `#${viewIndex}`;
    prev.disabled = position <= 0;
    next.disabled = position >= indices.length - 1;

    meta.textContent = (data.q ? `จาก “${data.q}” · ` : '') + `${items.length} รายการ`;

    if (!items.length) {
        list.appendChild(makeEl(
            'div',
            'ltt-note',
            'ข้อความนี้ไม่มี Lorebook ถูกทริกเกอร์'
        ));

        return;
    }

    items.forEach(item => list.appendChild(renderCard(item)));
}

function positionSheet() {
    const sheet = document.getElementById(SHEET_ID);
    const target = findTextbox();

    if (!sheet || !target) return;

    const rect = target.getBoundingClientRect();
    const bottom = Math.max(8, window.innerHeight - rect.top + 14);
    const room = Math.max(140, rect.top - 24);

    sheet.style.bottom = `${bottom}px`;
    sheet.style.maxHeight = `${Math.min(room, window.innerHeight * 0.6)}px`;
}

function openSheet() {
    const sheet = createSheet();
    const button = document.getElementById(BUTTON_ID);

    sheetOpen = true;
    viewIndex = latestTracked();

    renderSheet();
    positionSheet();

    sheet.classList.add('ltt-visible');
    button?.classList.add('ltt-active');
}

function closeSheet() {
    if (!sheetOpen) return;

    sheetOpen = false;

    document.getElementById(SHEET_ID)?.classList.remove('ltt-visible');

    if (!panelOpen) {
        document.getElementById(BUTTON_ID)?.classList.remove('ltt-active');
    }
}

function toggleSheet() {
    if (sheetOpen) closeSheet();
    else openSheet();
}

export async function init() {
    if (initialized) return;

    initialized = true;

    addStyles();
    createPanel();
    createButton();
    startPositionObserver();
    startTracking();

    schedulePosition();

    console.log(`[${EXT_ID}] Floating orb initialized`);
}
