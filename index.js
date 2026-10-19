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

// แสดงแจ้งเตือนกลางจอทุกครั้งที่มี event (▶ เริ่ม / 📖 ทริกเกอร์ / ✔ แนบผล) ปิดได้โดยเปลี่ยนเป็น false
const DEBUG_TOASTS = true;

// ดูข้อความล่าสุดกี่ข้อความเพื่อหาคีย์ที่ตรง (ใช้ประมาณคีย์ที่ทำให้ทริกเกอร์)
const SCAN_MESSAGES = 8;

let initialized = false;
let panelOpen = false;
let positionObserver = null;
let positionFrame = 0;

let sheetOpen = false;
let moveMode = false;
const POS_KEY = `${EXT_ID}-sheet-pos`;
let customPos = loadPos();
let viewIndex = -1;
let capturing = false;
let pendingTriggers = null;

const VERSION = 'v17';
const DISPOSE_KEY = '__lttDispose';
const LOADED_KEY = '__lttLoadedFrom';

// เก็บตัวถอด listener ทั้งหมดไว้ เพื่อให้ถอนตัวเองได้เมื่อมีสำเนาใหม่มาแทน
const cleanups = [];
let lastActivate = 0;

function listen(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    cleanups.push(() => target.removeEventListener(type, handler, options));
}

function dispose() {
    while (cleanups.length) {
        try { cleanups.pop()(); } catch { /* ข้าม */ }
    }

    for (const id of [BUTTON_ID, PANEL_ID, SHEET_ID, `${EXT_ID}-style`, `${EXT_ID}-toast`]) {
        document.getElementById(id)?.remove();
    }

    initialized = false;
    panelOpen = false;
    sheetOpen = false;
}

function addStyles() {
    // ใส่ CSS ใหม่ทุกครั้ง: ถ้ามี style ของไฟล์เก่า/สำเนาซ้ำโหลดมาก่อน
    // แล้วข้ามไป หน้าต่างจะไม่มี CSS และหลุดไปอยู่ใต้หน้าแชทแบบมองไม่เห็น
    document.getElementById(`${EXT_ID}-style`)?.remove();

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
        cursor: pointer;
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
    }

    /* ===== แจ้งเตือนกลางล่างจอ (แนวนอน เล็ก) ===== */
    #${EXT_ID}-toast {
        position: fixed;
        left: 0;
        right: 0;
        top: 50%;
        width: fit-content;
        max-width: min(88vw, 360px);
        margin: 0 auto;
        box-sizing: border-box;
        overflow: hidden;

        display: flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        padding: 5px 11px 7px;

        background: linear-gradient(90deg, rgba(125,30,52,.95), rgba(30,28,42,.97) 75%);
        -webkit-backdrop-filter: blur(12px);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(246,232,226,.4);
        border-left: 2px solid #c24a5e;
        border-radius: 5px;
        box-shadow: 0 4px 14px rgba(0,0,0,.4);

        color: #efe7ea;
        font-family: 'Segoe UI', 'Sarabun', Tahoma, sans-serif;
        font-size: 11px;
        line-height: 1.4;
        text-align: center;

        z-index: 1000001;
        pointer-events: none;
        animation: ltt-toast-in .28s cubic-bezier(.2,.9,.3,1.15) both;
    }

    #${EXT_ID}-toast .ltt-toast-icon {
        flex: none;
        display: flex;
        width: 8px;
        height: 8px;
        color: #e0788a;
        animation: ltt-toast-twinkle 1.6s ease-in-out infinite alternate;
    }

    #${EXT_ID}-toast .ltt-toast-icon svg {
        width: 100%;
        height: 100%;
    }

    #${EXT_ID}-toast .ltt-toast-body {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 1px 10px;
        min-width: 0;
    }

    #${EXT_ID}-toast .ltt-toast-line {
        color: #f6e8e2;
        word-break: break-word;
    }

    #${EXT_ID}-toast .ltt-toast-bar {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 1.5px;
        background: #e0788a;
        opacity: .85;
        transform-origin: left center;
        animation: ltt-toast-bar var(--ms, 5s) linear both;
    }

    /* แบบเตือน: โทนส้มอำพัน */
    #${EXT_ID}-toast.ltt-toast-warn {
        border-color: rgba(240,163,94,.6);
        border-left-color: #f0a35e;
    }

    #${EXT_ID}-toast.ltt-toast-warn .ltt-toast-icon {
        color: #f0a35e;
    }

    #${EXT_ID}-toast.ltt-toast-warn .ltt-toast-bar {
        background: #f0a35e;
    }

    #${EXT_ID}-toast.ltt-toast-out {
        animation: ltt-toast-out .26s ease forwards;
    }

    @keyframes ltt-toast-in {
        from { opacity: 0; transform: translateY(6px) scale(.94); }
        to   { opacity: 1; transform: none; }
    }

    @keyframes ltt-toast-out {
        from { opacity: 1; transform: none; }
        to   { opacity: 0; transform: translateY(-4px) scale(.96); }
    }

    @keyframes ltt-toast-bar {
        from { transform: scaleX(1); }
        to   { transform: scaleX(0); }
    }

    @keyframes ltt-toast-twinkle {
        from { transform: scale(.6); opacity: .55; }
        to   { transform: scale(1);  opacity: 1; }
    }

    @media (prefers-reduced-motion: reduce) {
        #${EXT_ID}-toast,
        #${EXT_ID}-toast .ltt-toast-icon {
            animation: none;
        }

        #${EXT_ID}-toast .ltt-toast-bar {
            animation-duration: 0s;
        }
    }

    /* ===== หน้าต่างรายการทริกเกอร์ (กรอบซ้อนสองชั้น + แท็บห้อย + ประกาย) ===== */
    #${SHEET_ID} {
        position: fixed;
        left: 8px;
        right: 8px;
        bottom: 80px;
        max-width: 270px;
        max-height: 38vh;
        margin: 0 auto;
        box-sizing: border-box;

        display: flex;
        flex-direction: column;

        /* พื้นเรียบ ไล่เฉดไวน์แดง → ม่วงเข้ม มีแสงฟุ้งนุ่ม ๆ ที่มุม (ไม่มีลายตาราง) */
        background-color: #1c1824;
        background-image:
            radial-gradient(120% 70% at 100% 0%, rgba(224,120,138,.20), transparent 60%),
            radial-gradient(90% 60% at 0% 100%, rgba(179,36,63,.26), transparent 65%),
            linear-gradient(170deg, #5e1730 0%, #2a1a2c 50%, #1a1622 100%);

        border: 1px solid rgba(246,232,226,.55);
        border-radius: 4px;
        box-shadow:
            0 12px 30px rgba(0,0,0,.55),
            0 0 0 1px rgba(0,0,0,.35),
            inset 0 1px 0 rgba(246,232,226,.14);

        color: #efe7ea;
        font-family: 'Segoe UI', 'Sarabun', Tahoma, sans-serif;
        font-size: 10.5px;
        line-height: 1.45;

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

    /* เส้นในบาง ๆ ซ้อนอีกชั้น */
    #${SHEET_ID}::before {
        content: '';
        position: absolute;
        inset: 3px;
        border: 1px solid rgba(224,120,138,.38);
        border-radius: 2px;
        pointer-events: none;
    }

    /* ข้าวหลามตัดที่มุมกรอบ */
    #${SHEET_ID} .ltt-corner {
        position: absolute;
        width: 6px;
        height: 6px;
        background: #f6e8e2;
        box-shadow: 0 0 0 1.5px #1c1824, 0 0 6px rgba(246,232,226,.35);
        transform: rotate(45deg);
        pointer-events: none;
    }

    #${SHEET_ID} .ltt-c-tl { top: -4px; left: -4px; }
    #${SHEET_ID} .ltt-c-tr { top: -4px; right: -4px; }
    #${SHEET_ID} .ltt-c-bl { bottom: -4px; left: -4px; }
    #${SHEET_ID} .ltt-c-br { bottom: -4px; right: -4px; }

    /* ประกายสี่แฉกเกาะขอบ */
    #${SHEET_ID} .ltt-spk {
        position: absolute;
        display: flex;
        color: #e0788a;
        pointer-events: none;
        animation: ltt-sheet-twinkle 2.2s ease-in-out infinite alternate;
    }

    #${SHEET_ID} .ltt-spk svg {
        width: 100%;
        height: 100%;
    }

    #${SHEET_ID} .ltt-spk-a { width: 13px; height: 13px; top: -9px; right: 22px; color: #f6e8e2; }
    #${SHEET_ID} .ltt-spk-b { width: 8px;  height: 8px;  bottom: -6px; left: 30px; animation-delay: 1.1s; }
    #${SHEET_ID} .ltt-spk-c { width: 6px;  height: 6px;  top: -5px; right: 46px; animation-delay: .5s; }

    @keyframes ltt-sheet-twinkle {
        from { transform: scale(.6); opacity: .55; }
        to   { transform: scale(1);  opacity: 1; }
    }

    @keyframes ltt-card-in {
        from { opacity: 0; transform: translateY(5px); }
        to   { opacity: 1; transform: none; }
    }

    @media (prefers-reduced-motion: reduce) {
        #${SHEET_ID} .ltt-spk,
        #${SHEET_ID} .ltt-card { animation: none; }
    }

    /* แท็บครีมห้อยคาบขอบบน */
    #${SHEET_ID} .ltt-title {
        position: absolute;
        top: -10px;
        left: 16px;
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 1px 11px 1px 8px;
        background: linear-gradient(180deg, #fbefe9, #f0dcd4);
        color: #8f1f38;
        border: 1px solid #b3243f;
        border-radius: 2px;
        box-shadow: 0 0 0 2px #1c1824, 0 2px 6px rgba(0,0,0,.35);
        font-family: Georgia, serif;
        font-size: 9.5px;
        font-weight: 700;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        line-height: 15px;
    }

    #${SHEET_ID} .ltt-title svg {
        width: 8px;
        height: 8px;
        color: #b3243f;
    }

    /* แถบหัว: ปุ่มเลื่อนรวมเป็นแคปซูลเดียว */
    #${SHEET_ID} .ltt-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin: 0 8px;
        padding: 12px 0 6px 2px;
        background: linear-gradient(90deg, rgba(224,120,138,.7), rgba(224,120,138,.12) 70%, transparent) left bottom / 100% 1px no-repeat;
    }

    #${SHEET_ID} .ltt-nav {
        display: flex;
        align-items: center;
        gap: 2px;
        padding: 2px 3px;
        border: 1px solid rgba(224,120,138,.5);
        border-radius: 12px;
        background: rgba(10,8,16,.38);
    }

    #${SHEET_ID} .ltt-nav button {
        appearance: none;
        -webkit-appearance: none;
        width: 18px;
        height: 18px;
        padding: 0;
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 0 !important;
        border-radius: 50% !important;
        background: transparent !important;
        box-shadow: none !important;
        color: #f6e8e2;
        font-size: 13px;
        line-height: 1;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: background .15s ease;
    }

    #${SHEET_ID} .ltt-nav button:active {
        background: rgba(246,232,226,.2) !important;
    }

    #${SHEET_ID} .ltt-nav button:disabled {
        opacity: .28;
    }

    /* ปุ่มปิดแยกด้วยเส้นกั้นบาง ๆ */
    #${SHEET_ID} .ltt-nav .ltt-close {
        margin-left: 3px;
        font-size: 10px;
        color: #e0788a;
        position: relative;
    }

    #${SHEET_ID} .ltt-nav .ltt-close::before {
        content: '';
        position: absolute;
        left: -4px;
        top: 4px;
        bottom: 4px;
        width: 1px;
        background: rgba(224,120,138,.45);
    }

    #${SHEET_ID} .ltt-nav-label {
        min-width: 26px;
        text-align: center;
        font-family: 'Courier New', monospace;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: .5px;
        color: #f6e8e2;
    }

    /* จำนวนรายการ (ซ้ายของแถบหัว) */
    #${SHEET_ID} .ltt-meta {
        display: flex;
        align-items: center;
        gap: 5px;
        min-width: 0;
        padding: 2px 0 2px 2px;
        color: #f6e8e2;
        font-size: 10px;
        line-height: 1.7;
        letter-spacing: .3px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    #${SHEET_ID} .ltt-meta::before {
        content: '\\2726';
        flex: none;
        color: #e0788a;
        font-size: 9px;
    }

    #${SHEET_ID} .ltt-meta:empty {
        display: none;
    }

    /* ข้อความที่ใช้ค้นหา (บรรทัดเล็กใต้เส้น) */
    #${SHEET_ID} .ltt-query {
        margin: 4px 10px 0;
        padding: 2px 0;
        color: #bfaeb6;
        font-size: 9px;
        line-height: 1.8;
        font-style: italic;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    #${SHEET_ID} .ltt-query:empty {
        display: none;
    }

    #${SHEET_ID} .ltt-list {
        display: flex;
        flex-direction: column;
        gap: 5px;
        min-height: 0;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        padding: 6px 8px 16px;
        -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 16px), transparent);
        mask-image: linear-gradient(to bottom, #000 calc(100% - 16px), transparent);
        scrollbar-width: thin;
        scrollbar-color: rgba(224,120,138,.6) transparent;
    }

    #${SHEET_ID} .ltt-list::-webkit-scrollbar { width: 4px; }
    #${SHEET_ID} .ltt-list::-webkit-scrollbar-track { background: transparent; }
    #${SHEET_ID} .ltt-list::-webkit-scrollbar-thumb { background: rgba(224,120,138,.55); border-radius: 2px; }


    /* ปุ่มย้าย (ติ๊ก = เปิดโหมดลากย้าย / กดอีกครั้ง = ล็อกตำแหน่ง) */
    #${SHEET_ID} .ltt-nav button svg {
        width: 11px;
        height: 11px;
        pointer-events: none;
    }

    #${SHEET_ID} .ltt-nav .ltt-move .ltt-tick { display: none; }

    #${SHEET_ID} .ltt-nav .ltt-move.ltt-on {
        background: #f6e8e2 !important;
        color: #8f1f38;
    }

    #${SHEET_ID} .ltt-nav .ltt-move.ltt-on .ltt-arrows { display: none; }
    #${SHEET_ID} .ltt-nav .ltt-move.ltt-on .ltt-tick { display: block; }

    #${SHEET_ID} .ltt-nav .ltt-reset[hidden] { display: none; }

    #${SHEET_ID}.ltt-nonav .ltt-prev,
    #${SHEET_ID}.ltt-nonav .ltt-next,
    #${SHEET_ID}.ltt-nonav .ltt-nav-label { display: none; }

    /* โหมดย้าย: กรอบประเรืองแสง ลากได้ทั้งหน้าต่าง */
    #${SHEET_ID}.ltt-moving {
        cursor: grab;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        box-shadow:
            0 0 0 1px rgba(246,232,226,.9),
            0 0 14px rgba(224,120,138,.55),
            0 12px 30px rgba(0,0,0,.55);
    }

    #${SHEET_ID}.ltt-moving::before {
        border-style: dashed;
        border-color: rgba(246,232,226,.7);
    }

    #${SHEET_ID}.ltt-moving.ltt-dragging {
        cursor: grabbing;
        transition: none;
    }

    #${SHEET_ID}.ltt-moving .ltt-list {
        touch-action: none;
        overflow: hidden;
    }

    /* ข้อความสถานะว่าง */
    #${SHEET_ID} .ltt-note {
        padding: 14px 0 8px;
        color: #cdbcc4;
        text-align: center;
    }

    #${SHEET_ID} .ltt-note::before {
        content: '\\2726';
        display: block;
        margin-bottom: 4px;
        color: #e0788a;
        font-size: 15px;
        line-height: 1;
    }

    /* การ์ดรายการ: แถบสีด้านซ้าย + เลขลำดับ + ป้ายชื่อเล่ม */
    #${SHEET_ID} .ltt-card {
        position: relative;
        flex: none;
        padding: 5px 7px 6px 11px;
        border: 1px solid rgba(224,120,138,.32);
        border-radius: 3px;
        background: linear-gradient(135deg, rgba(10,8,16,.55), rgba(10,8,16,.3));
        box-shadow: inset 0 1px 0 rgba(246,232,226,.05);
        overflow: hidden;
        animation: ltt-card-in .3s ease both;
        animation-delay: calc(var(--i, 0) * 45ms);
    }

    #${SHEET_ID} .ltt-card::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: linear-gradient(180deg, #e0788a, #b3243f);
    }

    /* constant = แถบทอง */
    #${SHEET_ID} .ltt-card.ltt-const {
        border-color: rgba(232,194,122,.38);
    }

    #${SHEET_ID} .ltt-card.ltt-const::before {
        background: linear-gradient(180deg, #f4dba2, #c9953f);
    }

    /* ไม่พบคีย์: เส้นประ จางลง */
    #${SHEET_ID} .ltt-card.ltt-weak {
        border-style: dashed;
        opacity: .86;
    }

    #${SHEET_ID} .ltt-card-top {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    #${SHEET_ID} .ltt-num {
        flex: none;
        font-family: 'Courier New', monospace;
        font-size: 9px;
        font-weight: 700;
        color: #e0788a;
        letter-spacing: .5px;
    }

    #${SHEET_ID} .ltt-card.ltt-const .ltt-num {
        color: #e8c27a;
    }

    #${SHEET_ID} .ltt-book {
        flex: none;
        max-width: 40%;
        padding: 0 6px;
        background: linear-gradient(180deg, #c42b48, #a21f39);
        color: #f6e8e2;
        border-radius: 2px;
        font-family: Georgia, serif;
        font-size: 8.5px;
        letter-spacing: .7px;
        line-height: 1.9;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    #${SHEET_ID} .ltt-card-title {
        flex: 1;
        min-width: 0;
        color: #fff;
        font-size: 11px;
        font-weight: 600;
        line-height: 1.3;
        word-break: break-word;
    }

    /* แถวคีย์: มีป้ายหัวแถวเล็ก ๆ */
    #${SHEET_ID} .ltt-keys {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 3px;
        margin-top: 4px;
    }

    #${SHEET_ID} .ltt-keys + .ltt-keys {
        margin-top: 3px;
    }

    #${SHEET_ID} .ltt-keys-label {
        flex: none;
        min-width: 19px;
        color: #e0788a;
        font-family: Georgia, serif;
        font-size: 7.5px;
        letter-spacing: 1.4px;
        text-transform: uppercase;
    }

    #${SHEET_ID} .ltt-key {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 0 7px 0 6px;
        border: 1px solid rgba(246,232,226,.4);
        border-radius: 9px;
        background: rgba(246,232,226,.09);
        color: #f6e8e2;
        font-size: 9.5px;
        line-height: 14px;
        word-break: break-word;
    }

    #${SHEET_ID} .ltt-key::before {
        content: '';
        flex: none;
        width: 4px;
        height: 4px;
        background: #e0788a;
        transform: rotate(45deg);
    }

    #${SHEET_ID} .ltt-key.ltt-sec {
        border-style: dashed;
        border-color: rgba(246,232,226,.3);
        background: transparent;
        color: #d9c9d0;
    }

    #${SHEET_ID} .ltt-key.ltt-sec::before {
        background: transparent;
        border: 1px solid #e0788a;
        box-sizing: border-box;
    }

    /* ป้ายบอกเหตุผลท้ายการ์ด */
    #${SHEET_ID} .ltt-tag {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-top: 4px;
        color: #bfaeb6;
        font-size: 9px;
    }

    #${SHEET_ID} .ltt-tag::before {
        content: '\\2726';
        flex: none;
        color: #e0788a;
        font-size: 9px;
    }

    #${SHEET_ID} .ltt-card.ltt-const .ltt-tag {
        color: #e8c27a;
    }

    #${SHEET_ID} .ltt-card.ltt-const .ltt-tag::before {
        color: #e8c27a;
    }

    /* สถานะการติดตามท้ายรายการ */
    #${SHEET_ID} .ltt-status {
        margin-top: 4px;
        padding-top: 7px;
        border-top: 1px dashed rgba(246,232,226,.2);
        color: #9d8c95;
        font-size: 8.5px;
        line-height: 1.45;
        text-align: center;
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

        // กันไม่ให้การแตะแย่งโฟกัสจากกล่องข้อความ (คีย์บอร์ดปิด -> เลย์เอาต์ขยับ -> คลิกหลุด)
        item.addEventListener('mousedown', event => event.preventDefault());

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

    updateBadge();
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

    button.addEventListener('mousedown', event => event.preventDefault());

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

    cleanups.push(() => positionObserver?.disconnect());

    listen(window, 'resize', schedulePosition, { passive: true });
    listen(window, 'scroll', schedulePosition, { passive: true, capture: true });
    listen(window, 'orientationchange', () => setTimeout(schedulePosition, 150));

    if (window.visualViewport) {
        listen(window.visualViewport, 'resize', schedulePosition, { passive: true });
        listen(window.visualViewport, 'scroll', schedulePosition, { passive: true });
    }
}

/*
 * แตะตัวเลือกกลม
 * ใช้ pointerup (รู้เป้าหมายตั้งแต่ตอนยกนิ้ว ไม่โดนเลย์เอาต์ขยับตอนคีย์บอร์ดปิดแย่งไป)
 * และ click เป็นตัวสำรอง ทั้งคู่ผ่านตัวกันซ้ำตัวเดียวกัน
 */
function activateItem(item) {
    const now = Date.now();

    if (now - lastActivate < 450) return;
    lastActivate = now;

    const category = CATEGORIES.find(c => c.id === item.dataset.id);

    try {
        closePanel();

        if (typeof category?.onClick === 'function') category.onClick();
    } catch (error) {
        console.error(`[${EXT_ID}] ${category?.label} error`, error);
        showToast(`${category?.label}: ${error?.message || error}`);
    }
}

// หาตัวเลือกจากพิกัดนิ้วเทียบกรอบของมันตรง ๆ
// ใช้ได้แม้มีอะไรโปร่งใสลอยทับตัวเลือก จนเบราว์เซอร์ส่งการแตะไปให้ตัวนั้นแทน
function itemAtPoint(event) {
    if (!panelOpen) return null;

    const x = event.clientX;
    const y = event.clientY;

    if (!Number.isFinite(x) || !Number.isFinite(y) || (x === 0 && y === 0)) return null;

    const pad = 8;

    for (const item of document.querySelectorAll(`#${PANEL_ID} .ltt-item`)) {
        const r = item.getBoundingClientRect();

        if (x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad) {
            return item;
        }
    }

    return null;
}

function onItemTap(event) {
    const item = event.target?.closest?.(`#${PANEL_ID} .ltt-item`) || itemAtPoint(event);

    if (!item) return;

    if (event.type === 'pointerup' && event.button > 0) return;

    event.preventDefault();

    // click ปล่อยให้ผ่านไปไม่ได้ ไม่งั้นเดี๋ยวตัวอื่นมาสลับสถานะซ้ำ
    if (event.type === 'click') event.stopImmediatePropagation();

    activateItem(item);
}

function bindGlobalListeners() {
    listen(window, 'pointerup', onItemTap, true);
    listen(window, 'click', onItemTap, true);

    listen(document, 'click', function onOutsideClick(event) {
        // คลิกที่ตามหลังการเลือกตัวเลือกหยก ๆ ห้ามนับเป็นการแตะข้างนอก
        if (Date.now() - lastActivate < 450) return;

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

    listen(document, 'keydown', event => {
        if (event.key === 'Escape') {
            closeSheet();
            closePanel();
        }
    });
}


/* ============================================================
 * ตรวจจับ Lorebook ที่ถูกทริกเกอร์
 * ============================================================ */

// โมดูล script.js ของ SillyTavern (ใช้เป็นตัวสำรองเมื่อไม่มี getContext)
let stModule = null;

function getCtx() {
    try {
        const ctx = globalThis.SillyTavern?.getContext?.();
        if (ctx) return ctx;
    } catch {
        // ข้าม
    }

    return stModule?.chat ? { chat: stModule.chat } : null;
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

    return entries.filter(entry => entry && typeof entry === 'object').map(entry => {
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
        if (Array.isArray(message?.extra?.ltt_triggers?.items)) indices.push(index);
    });

    return indices;
}

function latestTracked() {
    const indices = trackedIndices();
    return indices.length ? indices[indices.length - 1] : -1;
}

// เลขบนวงกลม Lorebook = จำนวนรายการที่ทริกเกอร์ติดในรอบล่าสุด
// ส่งตัวเลขเข้ามาตรง ๆ ได้ (ตอน event มาถึงทันที) ไม่ส่งก็คำนวณจากข้อความล่าสุด
function updateBadge(override) {
    let count;

    if (Number.isInteger(override)) {
        count = override;
    } else {
        const ctx = getCtx();
        const index = latestTracked();

        count = index >= 0
            ? ctx.chat[index].extra.ltt_triggers.items.length
            : (liveEntries?.length || 0);
    }

    const badge = document.querySelector(
        `#${PANEL_ID} .ltt-item[data-id="lorebook"] .ltt-count`
    );

    if (badge) badge.textContent = String(count);
}

// สถานะของตัวติดตาม (แสดงในหน้าต่างตอนไม่มีข้อมูล เพื่อดูว่าขาดตรงไหน)
const trackerState = {
    hooked: false,
    via: '',
    generations: 0,
    lastType: '',
    wiEvents: 0,
    lastWiCount: 0,
    received: 0,
    quiet: 0,
    note: ''
};

// รายการล่าสุดที่ SillyTavern ส่งมา (แสดงได้แม้ยังแนบกับข้อความไม่สำเร็จ แบบเดียวกับตัวอ้างอิง)
let liveEntries = null;
const debugLog = [];

// มือถือไม่มี devtools: แสดง event ล่าสุด 3 รายการเป็น toast ให้เห็นเลยว่า event มาถึงไหม
function debugEvent(text) {
    debugLog.push(text);
    while (debugLog.length > 3) debugLog.shift();

    if (!DEBUG_TOASTS) return;

    // แสดงบรรทัดเดียว (เฉพาะเหตุการณ์ล่าสุด)
    try { showToast(text, 4000); } catch { /* ข้าม */ }
}

let hookAttempts = 0;
let hookTimer = 0;

// หา event bus ของ SillyTavern: ลองจาก getContext() ก่อน ไม่เจอก็ import จาก events.js ตรง ๆ
async function resolveEventBus() {
    // ลำดับเดียวกับ extension ตัวอ้างอิงที่ใช้ได้: import จาก script.js แบบ relative ก่อน
    // แล้วค่อยลอง path เต็ม, getContext(), และ events.js
    const sources = [
        ['script.js (relative)', () => import('../../../../script.js')],
        ['script.js', () => import('/script.js')],
        ['events.js', () => import('/scripts/events.js')]
    ];

    for (const [via, load] of sources) {
        try {
            const mod = await load();

            if (mod?.eventSource?.on && mod?.event_types) {
                stModule = mod;
                return { bus: mod.eventSource, types: mod.event_types, via };
            }
        } catch {
            // ข้าม ลองตัวถัดไป
        }
    }

    const ctx = getCtx();

    if (ctx?.eventSource?.on) {
        return {
            bus: ctx.eventSource,
            types: ctx.eventTypes || ctx.event_types || {},
            via: 'context'
        };
    }

    return null;
}

// payload ของ world_info_activated: รับได้ทั้ง array / Set / Map / object ที่คีย์ด้วย uid / entry เดี่ยว
function toEntryList(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (payload instanceof Map) return Array.from(payload.values());
    if (typeof payload[Symbol.iterator] === 'function') return Array.from(payload);

    if (typeof payload === 'object') {
        if ('uid' in payload && ('key' in payload || 'content' in payload)) return [payload];
        return Object.values(payload);
    }

    return [];
}

async function startTracking() {
    if (trackerState.hooked || !initialized) return;

    const found = await resolveEventBus();

    if (!initialized || trackerState.hooked) return;

    // ยังต่อไม่ได้ (SillyTavern อาจโหลดไม่เสร็จ): ลองใหม่ทุกวินาทีสูงสุด 20 ครั้ง
    if (!found) {
        hookAttempts += 1;

        if (hookAttempts < 20) {
            hookTimer = setTimeout(() => startTracking().catch(() => {}), 1000);
        } else {
            console.warn(`[${EXT_ID}] ไม่พบ eventSource จึงตรวจจับ Lorebook ไม่ได้`);
            showToast('Lorebook Tracker: ต่อกับ SillyTavern ไม่ได้ จึงตรวจจับ Lorebook ไม่ได้', 9000);
        }

        return;
    }

    const { bus, types, via } = found;

    const on = (name, fallback, handler) => {
        const eventName = name ?? fallback;

        bus.on(eventName, handler);

        cleanups.push(() => {
            try {
                (bus.removeListener || bus.off)?.call(bus, eventName, handler);
            } catch { /* ข้าม */ }
        });
    };

    // เริ่มสร้างคำตอบ: เริ่มเก็บทริกเกอร์
    // quiet (งานเบื้องหลังของ extension อื่น เช่น สรุปความจำ) ต้อง "ไม่แตะ" สถานะเลย
    // ของเดิมเขียนทับ capturing = false ทำให้คำตอบหลักไม่ถูกแนบผล จึงขึ้น "ไม่มีการทริกเกอร์"
    on(types.GENERATION_STARTED, 'generation_started', (type, _params, dryRun) => {
        if (dryRun) return;

        if (type === 'quiet') {
            trackerState.quiet += 1;
            return;
        }

        capturing = true;
        pendingTriggers = [];

        trackerState.generations += 1;
        trackerState.lastType = String(type || 'normal');
        trackerState.lastWiCount = 0;
        trackerState.note = '';
    });

    // Lorebook ที่ถูกทริกเกอร์ในรอบนี้
    // SillyTavern อาจยิง event นี้หลายครั้งต่อหนึ่งคำตอบ จึงรวมกัน (ไม่ทับของเดิม)
    // ไม่กรองด้วย capturing แล้ว: ถ้ามาก่อน/นอกรอบ ก็เก็บไว้ก่อน แล้วรอบใหม่จะล้างเอง
    on(types.WORLD_INFO_ACTIVATED, 'world_info_activated', payload => {
        trackerState.wiEvents += 1;

        const fresh = summarizeEntries(toEntryList(payload), getCtx()?.chat);
        const merged = new Map();

        for (const item of [...(pendingTriggers || []), ...fresh]) {
            merged.set(`${item.w}\u0000${item.id}`, item);
        }

        pendingTriggers = [...merged.values()];
        liveEntries = pendingTriggers;
        updateBadge(pendingTriggers.length);
        trackerState.lastWiCount = pendingTriggers.length;
        debugEvent(`📖 ทริกเกอร์ ${pendingTriggers.length} รายการ`);
    });

    // คำตอบมาถึง: แนบผลทริกเกอร์ไว้กับข้อความคำตอบ
    on(types.MESSAGE_RECEIVED, 'message_received', mesId => {
        if (!capturing) {
            trackerState.note = 'ข้าม: ได้รับข้อความโดยไม่มีรอบสร้างคำตอบที่เปิดอยู่';
            debugEvent('✖ ' + trackerState.note);
            return;
        }

        const chat = getCtx()?.chat;

        if (!chat?.length) {
            trackerState.note = 'ข้าม: อ่านรายการแชทไม่ได้';
            return;
        }

        const index = Number.isInteger(mesId) ? mesId : chat.length - 1;
        const message = chat[index];

        if (!message || message.is_user || message.is_system) {
            trackerState.note = `ข้าม: ข้อความ #${index} เป็นของผู้ใช้/ระบบ`;
            return;
        }

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
        trackerState.received += 1;
        trackerState.note = '';
        // ถ้าติดแล้วจะมี toast "📖 ทริกเกอร์ N รายการ" ขึ้นไปแล้ว บอกซ้ำเฉพาะตอนไม่มีอะไรติด
        if (!(message.extra.ltt_triggers.items.length)) debugEvent('📖 ไม่มี Lorebook ทริกเกอร์');

        updateBadge();
        if (sheetOpen) renderSheet();
    });

    // เปลี่ยนแชท: ล้างสถานะและอัปเดตตัวเลข
    on(types.CHAT_CHANGED, 'chat_id_changed', () => {
        capturing = false;
        pendingTriggers = null;
        liveEntries = null;
        viewIndex = -1;

        updateBadge();
        if (sheetOpen) renderSheet();
    });

    trackerState.hooked = true;
    trackerState.via = via;

    debugEvent(`✓ ${VERSION} ต่อ event แล้ว (${via})`);

    updateBadge();
}

/* ============================================================
 * แผงแสดงรายการทริกเกอร์
 * ============================================================ */

function showToast(text, ms = 5000) {
    const id = `${EXT_ID}-toast`;

    document.getElementById(id)?.remove();

    const lines = String(text).split('\n').filter(line => line.trim().length);
    const isWarn = /^[✖⚠]/.test(lines[0] || '');

    const toast = makeEl('div', isWarn ? 'ltt-toast-warn' : '');
    toast.id = id;
    toast.style.setProperty('--ms', `${ms}ms`);

    const icon = makeEl('span', 'ltt-toast-icon');
    icon.innerHTML = SPARK;
    toast.appendChild(icon);

    const body = makeEl('div', 'ltt-toast-body');
    lines.forEach(line => body.appendChild(makeEl('div', 'ltt-toast-line', line)));
    toast.appendChild(body);

    toast.appendChild(makeEl('div', 'ltt-toast-bar'));

    document.body.appendChild(toast);

    // กลางล่างของจอ: แนวนอนใช้ margin:auto แนวตั้งวางเหนือกล่องข้อความ
    // (ถ้าหากล่องข้อความไม่เจอ ให้ห่างขอบล่าง 90px)
    const box = typeof findTextbox === 'function' ? findTextbox() : null;
    const boxRect = box ? box.getBoundingClientRect() : null;
    const bottomEdge = boxRect && boxRect.width && boxRect.height
        ? boxRect.top - 10
        : window.innerHeight - 90;

    placeTop(toast, Math.max(8, bottomEdge - toast.offsetHeight));

    setTimeout(() => toast.classList.add('ltt-toast-out'), Math.max(0, ms - 260));
    setTimeout(() => toast.remove(), ms);
}

function makeEl(tag, className, text) {
    const element = document.createElement(tag);

    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;

    return element;
}


function loadPos() {
    try {
        const raw = JSON.parse(localStorage.getItem(POS_KEY) || 'null');
        if (raw && Number.isFinite(raw.x) && Number.isFinite(raw.y)) return raw;
    } catch { /* ข้าม */ }
    return null;
}

function savePos() {
    try {
        if (customPos) localStorage.setItem(POS_KEY, JSON.stringify(customPos));
        else localStorage.removeItem(POS_KEY);
    } catch { /* ข้าม */ }
}

function syncMoveUi() {
    const sheet = document.getElementById(SHEET_ID);
    if (!sheet) return;

    sheet.classList.toggle('ltt-moving', moveMode);
    sheet.querySelector('.ltt-move')?.classList.toggle('ltt-on', moveMode);

    const reset = sheet.querySelector('.ltt-reset');
    if (reset) reset.hidden = !customPos;
}

// ลากย้ายหน้าต่างด้วยนิ้ว/เมาส์ (ทำงานเฉพาะตอนติ๊กโหมดย้าย)
function bindDrag(sheet) {
    let drag = null;

    sheet.addEventListener('pointerdown', event => {
        if (!moveMode || event.button > 0) return;
        if (event.target.closest('.ltt-nav')) return;

        const rect = sheet.getBoundingClientRect();
        drag = { id: event.pointerId, dx: event.clientX - rect.left, dy: event.clientY - rect.top };

        sheet.classList.add('ltt-dragging');
        try { sheet.setPointerCapture(event.pointerId); } catch { /* ข้าม */ }
        event.preventDefault();
    });

    sheet.addEventListener('pointermove', event => {
        if (!drag || event.pointerId !== drag.id) return;

        customPos = { x: event.clientX - drag.dx, y: event.clientY - drag.dy };
        positionSheet();
        event.preventDefault();
    });

    const end = event => {
        if (!drag || event.pointerId !== drag.id) return;

        drag = null;
        sheet.classList.remove('ltt-dragging');
        savePos();
        syncMoveUi();
    };

    sheet.addEventListener('pointerup', end);
    sheet.addEventListener('pointercancel', end);
}

function createSheet() {
    let sheet = document.getElementById(SHEET_ID);
    if (sheet) return sheet;

    sheet = document.createElement('div');
    sheet.id = SHEET_ID;

    sheet.innerHTML = `
        <span class="ltt-corner ltt-c-tl"></span>
        <span class="ltt-corner ltt-c-tr"></span>
        <span class="ltt-corner ltt-c-bl"></span>
        <span class="ltt-corner ltt-c-br"></span>
        <span class="ltt-spk ltt-spk-a">${SPARK}</span>
        <span class="ltt-spk ltt-spk-b">${SPARK}</span>
        <span class="ltt-spk ltt-spk-c">${SPARK}</span>
        <span class="ltt-title">${SPARK}Triggers</span>
        <div class="ltt-head">
            <span class="ltt-meta"></span>
            <span class="ltt-nav">
                <button type="button" class="ltt-prev" aria-label="ก่อนหน้า">‹</button>
                <span class="ltt-nav-label"></span>
                <button type="button" class="ltt-next" aria-label="ถัดไป">›</button>
                <button type="button" class="ltt-reset" aria-label="คืนตำแหน่งเดิม" title="คืนตำแหน่งเดิม" hidden>↺</button>
                <button type="button" class="ltt-move" aria-label="ย้ายตำแหน่ง" title="ย้ายตำแหน่ง">
                    <svg class="ltt-arrows" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 1v10M1 6h10M6 1L4.4 2.6M6 1l1.6 1.6M6 11l-1.6-1.6M6 11l1.6-1.6M1 6l1.6-1.6M1 6l1.6 1.6M11 6L9.4 4.4M11 6L9.4 7.6"/></svg>
                    <svg class="ltt-tick" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 6.4L5 9l4.5-5.5"/></svg>
                </button>
                <button type="button" class="ltt-close" aria-label="ปิด">✕</button>
            </span>
        </div>
        <div class="ltt-query"></div>
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

    sheet.querySelector('.ltt-move').addEventListener('click', event => {
        event.stopPropagation();
        moveMode = !moveMode;
        syncMoveUi();
    });

    sheet.querySelector('.ltt-reset').addEventListener('click', event => {
        event.stopPropagation();
        customPos = null;
        savePos();
        syncMoveUi();
        positionSheet();
    });

    bindDrag(sheet);
    document.body.appendChild(sheet);
    syncMoveUi();

    return sheet;
}

function appendStatus(list) {
    const text = trackerState.hooked
        ? `ติดตาม: ต่อแล้ว (${trackerState.via}) · สร้างคำตอบ ${trackerState.generations} ครั้ง` +
          ` · พบ Lorebook ${trackerState.wiEvents} ครั้ง · แนบผล ${trackerState.received} ครั้ง` +
          ` · quiet ${trackerState.quiet}` +
          (trackerState.note ? ` · ${trackerState.note}` : '')
        : `ติดตาม: ยังไม่ได้ต่อกับ SillyTavern (ลอง ${hookAttempts} ครั้ง)`;

    list.appendChild(makeEl('div', 'ltt-status', text));
}

function renderKeyRow(label, keys, secondary) {
    const row = makeEl('div', 'ltt-keys');

    row.appendChild(makeEl('span', 'ltt-keys-label', label));
    keys.forEach(key => row.appendChild(makeEl('span', secondary ? 'ltt-key ltt-sec' : 'ltt-key', key)));

    return row;
}

function renderCard(item, index = 0) {
    const keys = toArray(item.k);
    const secondary = toArray(item.s);
    const hasKeys = keys.length > 0 || secondary.length > 0;

    const card = makeEl('div', 'ltt-card');
    card.style.setProperty('--i', String(Math.min(index, 8)));

    if (item.c) card.classList.add('ltt-const');
    else if (!hasKeys && !item.v) card.classList.add('ltt-weak');

    const top = makeEl('div', 'ltt-card-top');
    top.appendChild(makeEl('span', 'ltt-num', String(index + 1).padStart(2, '0')));
    if (item.w) top.appendChild(makeEl('span', 'ltt-book', item.w));
    top.appendChild(makeEl('span', 'ltt-card-title', item.t));

    card.appendChild(top);

    if (keys.length) card.appendChild(renderKeyRow('Key', keys, false));
    if (secondary.length) card.appendChild(renderKeyRow('2nd', secondary, true));

    if (item.c) {
        card.appendChild(makeEl('div', 'ltt-tag', 'constant · ทำงานตลอด'));
    } else if (!hasKeys) {
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
    const query = sheet.querySelector('.ltt-query');
    const label = sheet.querySelector('.ltt-nav-label');
    const prev = sheet.querySelector('.ltt-prev');
    const next = sheet.querySelector('.ltt-next');

    list.textContent = '';
    query.textContent = '';
    sheet.classList.toggle('ltt-nonav', !ctx || !trackedIndices().length);

    const indices = trackedIndices();

    if (!ctx || !indices.length) {
        label.textContent = '—';
        meta.textContent = '0 รายการ';
        prev.disabled = true;
        next.disabled = true;

        if (liveEntries?.length) {
            meta.textContent = `${liveEntries.length} รายการ`;
            query.textContent = 'ผลล่าสุดจาก SillyTavern';
            liveEntries.forEach((item, i) => list.appendChild(renderCard(item, i)));
        } else {
            list.appendChild(makeEl(
                'div',
                'ltt-note',
                'ไม่มีการทริกเกอร์'
            ));
        }

        appendStatus(list);

        return;
    }

    if (!indices.includes(viewIndex)) {
        viewIndex = indices[indices.length - 1];
    }

    const position = indices.indexOf(viewIndex);
    const data = ctx.chat[viewIndex].extra.ltt_triggers;
    const items = data.items.filter(item => item && typeof item === 'object');

    label.textContent = `#${viewIndex}`;
    prev.disabled = position <= 0;
    next.disabled = position >= indices.length - 1;

    meta.textContent = `${items.length} รายการ`;
    query.textContent = data.q ? `จาก “${data.q}”` : '';

    if (!items.length) {
        list.appendChild(makeEl(
            'div',
            'ltt-note',
            'ข้อความนี้ไม่มี Lorebook ถูกทริกเกอร์'
        ));

        appendStatus(list);

        return;
    }

    items.forEach((item, i) => list.appendChild(renderCard(item, i)));
}

// วางด้วย top แล้ววัดตำแหน่งจริงบนจอ ถ้าเพี้ยน (เช่นมี ancestor ที่ทำให้ fixed
// อิงกรอบอื่น ไม่ใช่หน้าจอ) ให้ชดเชยส่วนต่างเอง ไม่พึ่งการคำนวณด้วย bottom
function placeTop(el, desiredTop) {
    el.style.bottom = 'auto';
    el.style.top = `${desiredTop}px`;

    const error = desiredTop - el.getBoundingClientRect().top;

    if (Math.abs(error) > 1) {
        el.style.top = `${desiredTop + error}px`;
    }
}

function resetCustomStyle(sheet) {
    for (const prop of ['left', 'right', 'width', 'margin']) sheet.style.removeProperty(prop);
}

// ตำแหน่งที่ผู้ใช้ลากไว้เอง: จำกัดไม่ให้หลุดขอบจอ
function placeCustom(sheet) {
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;
    const margin = 6;

    const width = Math.min(270, viewW - margin * 2);

    sheet.style.margin = '0';
    sheet.style.right = 'auto';
    sheet.style.width = `${width}px`;
    sheet.style.maxHeight = `${Math.max(110, viewH * 0.5)}px`;

    const height = sheet.offsetHeight;

    customPos.x = Math.max(margin, Math.min(customPos.x, viewW - width - margin));
    customPos.y = Math.max(margin, Math.min(customPos.y, viewH - height - margin));

    sheet.style.left = `${customPos.x}px`;
    placeTop(sheet, customPos.y);
}

function positionSheet() {
    if (!sheetOpen) return;

    const sheet = document.getElementById(SHEET_ID);
    if (!sheet) return;

    const target = findTextbox();
    const rect = target ? target.getBoundingClientRect() : null;
    const hasBox = Boolean(rect && rect.width && rect.height);

    const viewH = window.innerHeight;
    const gap = 14;

    // กล่องข้อความถูกซ่อน (เช่นยังไม่เข้าแชท): วางเหนือขอบล่างจอ 80px
    const bottomEdge = hasBox ? rect.top - gap : viewH - 80;
    const room = Math.max(110, bottomEdge - 14);

    if (customPos) {
        placeCustom(sheet);
        return;
    }

    resetCustomStyle(sheet);
    sheet.style.maxHeight = `${Math.min(room, viewH * 0.38)}px`;

    // วัดโดยปิดอนิเมชันชั่วคราว ไม่งั้นค่าเพี้ยนระหว่างกำลัง transition
    const prevTransition = sheet.style.transition;
    const prevTransform = sheet.style.transform;

    sheet.style.transition = 'none';
    sheet.style.transform = 'none';

    placeTop(sheet, Math.max(8, bottomEdge - sheet.offsetHeight));

    sheet.style.transform = prevTransform;
    sheet.style.transition = prevTransition;
}

function openSheet() {
    const sheet = createSheet();
    const button = document.getElementById(BUTTON_ID);

    sheetOpen = true;
    viewIndex = latestTracked();

    sheet.classList.add('ltt-visible');
    button?.classList.add('ltt-active');

    renderSheet();
    positionSheet();
    verifySheet();
}

// เช็คว่าหน้าต่างขึ้นบนจอจริงไหม ถ้าไม่ขึ้นให้บอกสาเหตุบนจอเลย (มือถือไม่มี devtools)
function verifySheet() {
    setTimeout(() => {
        const sheet = document.getElementById(SHEET_ID);
        if (!sheet || !sheetOpen) return;

        const cs = getComputedStyle(sheet);
        const r = sheet.getBoundingClientRect();
        const viewH = document.documentElement.clientHeight;
        const viewW = document.documentElement.clientWidth;

        const offscreen =
            r.width < 10 || r.height < 10 ||
            r.bottom <= 0 || r.top >= viewH ||
            r.right <= 0 || r.left >= viewW;

        if (cs.position !== 'fixed' || cs.visibility !== 'visible' || offscreen) {
            showToast(
                `หน้าต่างไม่แสดง: position=${cs.position}, visibility=${cs.visibility}, ` +
                `y=${Math.round(r.top)}/${viewH} — น่าจะมี extension ซ้ำหรือ CSS อื่นทับ`,
                10000
            );
        }
    }, 320);
}

function closeSheet() {
    if (!sheetOpen) return;

    sheetOpen = false;
    moveMode = false;
    syncMoveUi();

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

    // ถ้ามีสำเนาใหม่ (v4+) ของตัวเองโหลดค้างอยู่ ให้เก็บกวาดแล้วเข้ามาแทน
    // ถ้ามีของอยู่แต่ไม่มีตัวถอน แปลว่าเป็นสำเนาเก่าที่ถอดไม่ได้
    const previous = globalThis[DISPOSE_KEY];
    const foreign = typeof previous !== 'function' && Boolean(
        document.getElementById(BUTTON_ID) ||
        document.getElementById(`${EXT_ID}-style`)
    );

    if (typeof previous === 'function') {
        try { previous(); } catch { /* ข้าม */ }
    }

    initialized = true;

    // บันทึกว่าไฟล์นี้ถูกโหลดจากที่ไหนบ้าง (ใช้เช็คโฟลเดอร์ซ้ำ)
    const loaded = (globalThis[LOADED_KEY] = globalThis[LOADED_KEY] || []);
    loaded.push(import.meta.url);

    globalThis[DISPOSE_KEY] = dispose;

    // ลบของเก่าที่ค้างอยู่ก่อนสร้างใหม่ ให้ปุ่ม/แผงทุกชิ้นเป็นของไฟล์นี้ล้วน
    for (const id of [BUTTON_ID, PANEL_ID, SHEET_ID]) {
        document.getElementById(id)?.remove();
    }

    addStyles();
    createPanel();
    updateBadge();
    createButton();
    bindGlobalListeners();
    startPositionObserver();

    cleanups.push(() => clearTimeout(hookTimer));
    startTracking().catch(error => {
        console.error(`[${EXT_ID}] tracking error`, error);
        trackerState.note = `ต่อไม่สำเร็จ: ${error?.message || error}`;
        showToast(`✖ ${VERSION} ${trackerState.note}`, 15000);
    });

    schedulePosition();

    console.log(`[${EXT_ID}] ${VERSION} loaded from ${import.meta.url}`);

    const paths = [...new Set(loaded)].map(u => {
        try { return new URL(u).pathname; } catch { return u; }
    });

    if (foreign || paths.length > 1) {
        showToast(
            `⚠ Lorebook Tracker ถูกโหลดซ้ำ — ลบโฟลเดอร์ที่ไม่ใช้ออก\n` +
            (paths.length > 1 ? paths.join('\n') : 'พบสำเนาเก่าค้างอยู่ในหน้า'),
            14000
        );
    } else {
        showToast(`✓ Lorebook Tracker ${VERSION} โหลดแล้ว`);
    }
}

// เริ่มทำงานเอง (SillyTavern ไม่ได้เรียก init ให้) init มีตัวกันเรียกซ้ำอยู่แล้ว
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
} else {
    init();
}
