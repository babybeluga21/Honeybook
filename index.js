const EXT_ID = 'lorebook-trigger-tracker';
const BUTTON_ID = `${EXT_ID}-button`;
const PANEL_ID = `${EXT_ID}-panel`;
const SHEET_ID = `${EXT_ID}-sheet`;
const SEARCH_ID = `${EXT_ID}-search`;
const WRITE_ID = `${EXT_ID}-write`;
const DICE_ID = `${EXT_ID}-dice`;
const CAL_ID = `${EXT_ID}-cal`;
// ตัวเลือก CSS ที่ใช้ร่วมกันของหน้าต่างทั้งหมด (Triggers / Search / Write / Dice / Calendar)
const WINS = `:is(#${SHEET_ID}, #${SEARCH_ID}, #${WRITE_ID}, #${DICE_ID}, #${CAL_ID})`;
// หน้าต่างที่ใช้ปุ่มเครื่องมือแบบ Write (Dice / Calendar)
const TOOLWINS = `:is(#${DICE_ID}, #${CAL_ID})`;
const ORB_SIZE = 23;

// ขยับลูกแก้วขึ้นจากขอบกล่องข้อความ (px) ปรับเลขนี้ได้
const NUDGE_UP = 5;

// ตัวเลือกกลมที่แผ่ออกมาเป็นส่วนโค้ง
const ITEM_SIZE = 30;
const ITEM_SMALL = 24; // ลูกแก้วเล็ก (ค้นหา)
const ARC_RADIUS = 62;
const ARC_STEP = 40;

// ไอคอนประกายสี่แฉก (ใช้สีตามตัวอักษร)
const SPARK = '<svg viewBox="0 0 10 10" width="10" height="10" fill="currentColor" aria-hidden="true"><path d="M5 0C5.4 3.2 6.8 4.6 10 5C6.8 5.4 5.4 6.8 5 10C4.6 6.8 3.2 5.4 0 5C3.2 4.6 4.6 3.2 5 0Z"/></svg>';

const SEARCH_ICON = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="5" cy="5" r="3.4"/><path d="M7.6 7.6L10.6 10.6"/></svg>';
const WRITE_ICON = '<svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M1.5 8V6.4C1.5 4.4 2.6 3.2 4.4 2.9V4C3.6 4.3 3.2 4.9 3.2 5.6H4.6V8H1.5ZM6.9 8V6.4C6.9 4.4 8 3.2 9.8 2.9V4C9 4.3 8.6 4.9 8.6 5.6H10V8H6.9Z"/></svg>';

const DICE_ICON = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><rect x="1.6" y="1.6" width="8.8" height="8.8" rx="2"/><circle cx="4.2" cy="4.2" r=".75" fill="currentColor" stroke="none"/><circle cx="6" cy="6" r=".75" fill="currentColor" stroke="none"/><circle cx="7.8" cy="7.8" r=".75" fill="currentColor" stroke="none"/></svg>';
const CAL_ICON = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" aria-hidden="true"><rect x="1.6" y="2.4" width="8.8" height="8" rx="1.6"/><path d="M1.6 5.2H10.4M4 1.2V3.4M8 1.2V3.4"/></svg>';

// ปุ่มในหน้าต่าง Write (เรียงซ้าย → ขวา) เพิ่ม/ลบ/แก้ได้ที่นี่
//   open / close : ตัวเปิด / ตัวปิด (close เว้นว่างได้ ถ้าเป็นตัวเดี่ยว)
//   when         : 'line' = แตะ 2 ครั้งแล้วประกบตอนเว้นบรรทัด
//                  'space' = แตะ 2 ครั้งแล้วประกบตอนเว้นวรรค
//                  null = แทรกเลย ไม่มีระบบประกบ
//   star         : ปุ่มดอกจัน (มีตัวเลือก 1/2/3 ดอกข้างปุ่ม)
const QUICK_BUTTONS = [
    { id: 'dq', open: () => '"', close: () => '"', when: 'line' },
    { id: 'sq', open: () => "'", close: () => "'", when: 'line' },
    { id: 'br', open: () => '[', close: () => ']', when: 'line' },
    { id: 'st', open: () => starText(), close: () => starText(), when: 'space', star: true }
    // ปุ่มที่ปิดไว้: เอา // หน้าบรรทัดออก (อย่าลืมใส่ , ต่อท้ายบรรทัดดอกจันด้านบน)
    // { id: 'pr', open: () => '(', close: () => ')', when: null },
    // { id: 'el', open: () => '…', close: () => '', when: null }
];

// สัญลักษณ์ในถาดของปุ่ม ♡ (หน้าต่าง Write) แตะแล้วแทรกที่เคอร์เซอร์ — เพิ่ม/ลบ/เรียงใหม่ได้
const QUICK_SYMBOLS = ['~', '—', '!', '?', '…', '♡', '♪', '☆'];

// จำนวนผลค้นหาสูงสุดที่แสดง (เรียงจากข้อความใหม่ไปเก่า)
const SEARCH_LIMIT = 40;

// ลำดับในวงล้อ: เพิ่มลูกแก้วใหม่ได้ไม่จำกัด แค่เพิ่มบรรทัดที่นี่ (เกิน 3 ลูกวงล้อจะหมุนได้เอง)
// วงล้อเห็นทีละ 3 ลูก ตอนเปิดครั้งแรกลูกกลางโค้งคือลำดับ WHEEL_START (ดูส่วนวงล้อด้านล่าง)
//   small: true = ลูกเล็ก / count = มีเลขแจ้งที่มุมลูก
const CATEGORIES = [
    { id: 'search', label: 'Search', icon: SEARCH_ICON, small: true, onClick: () => toggleSearch() },
    { id: 'lorebook', label: 'Lorebook', icon: SPARK, count: 0, onClick: () => toggleSheet() },
    { id: 'write', label: 'Write', icon: WRITE_ICON, onClick: () => toggleWrite() },
    { id: 'dice', label: 'Dice', icon: DICE_ICON, onClick: () => toggleDice() },
    { id: 'calendar', label: 'Calendar', icon: CAL_ICON, count: 0, onClick: () => toggleCal() }
];

// แสดงแจ้งเตือนกลางจอทุกครั้งที่มี event (▶ เริ่ม / 📖 ทริกเกอร์ / ✔ แนบผล) ปิดได้โดยเปลี่ยนเป็น false
const DEBUG_TOASTS = true;

// ดูข้อความล่าสุดกี่ข้อความเพื่อหาคีย์ที่ตรง (ใช้ประมาณคีย์ที่ทำให้ทริกเกอร์)
const SCAN_MESSAGES = 8;

// แสดงสูงสุดกี่รายการต่อหน้า (มากกว่านี้จะแบ่งไปหน้าถัดไป) ปรับเลขนี้ได้
const PER_PAGE = 10;

let initialized = false;
let panelOpen = false;
let positionObserver = null;
let positionFrame = 0;

let sheetOpen = false;
let searchOpen = false;
let writeOpen = false;
let moveMode = false;
const POS_KEY = `${EXT_ID}-sheet-pos`;
let customPos = loadPos();
let viewIndex = -1;
let viewPage = 0;
let livePage = 0;
let capturing = false;
let pendingTriggers = null;

const VERSION = 'v22';
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

    for (const id of [BUTTON_ID, PANEL_ID, SHEET_ID, SEARCH_ID, WRITE_ID, DICE_ID, CAL_ID, `${EXT_ID}-style`, `${EXT_ID}-toast`]) {
        document.getElementById(id)?.remove();
    }

    initialized = false;
    panelOpen = false;
    sheetOpen = false;
    searchOpen = false;
    writeOpen = false;
    diceOpen = false;
    calOpen = false;
    cancelWheelAnim();
    wheelDrag = null;
    armed = [];
}

function addStyles() {
    // ใส่ CSS ใหม่ทุกครั้ง: ถ้ามี style ของไฟล์เก่า/สำเนาซ้ำโหลดมาก่อน
    // แล้วข้ามไป หน้าต่างจะไม่มี CSS และหลุดไปอยู่ใต้หน้าแชทแบบมองไม่เห็น
    document.getElementById(`${EXT_ID}-style`)?.remove();

    const style = document.createElement('style');
    style.id = `${EXT_ID}-style`;

    const baseCss = `
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
        touch-action: none;

        opacity: 0;
        pointer-events: none;
        transform: translate(-50%, -50%) scale(.3);
        transition:
            transform .28s cubic-bezier(.2,.9,.3,1.25) var(--d, 0s),
            opacity .18s ease var(--d, 0s),
            background .15s ease;
    }

    #${PANEL_ID}.ltt-visible .ltt-item {
        opacity: var(--o, 1);
        pointer-events: auto;
        transform: translate(calc(-50% + var(--x, 0px)), calc(-50% + var(--y, 0px))) scale(var(--s, 1));
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
        flex: none;
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
        padding: 0 3px;
        white-space: nowrap;
        text-align: center;
        font-family: 'Courier New', monospace;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: .5px;
        color: #f6e8e2;
    }

    /* จำนวนรายการ (ซ้ายของแถบหัว) */
    #${SHEET_ID} .ltt-meta {
        flex: 1 1 auto;
        display: flex;
        align-items: center;
        gap: 5px;
        min-width: 0;
        padding: 2px 0 2px 2px;
        color: #f6e8e2;
        font-size: 10px;
        line-height: 2;
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

    /* ข้อความที่ใช้ค้นหา: ห้ามซ่อนส่วนเกินแนวตั้ง ไม่งั้นสระ/วรรณยุกต์ไทยที่สูงจะโดนตัด */
    #${SHEET_ID} .ltt-query {
        flex: none;
        margin: 5px 10px 0;
        padding: 3px 0;
        color: #bfaeb6;
        font-size: 9.5px;
        line-height: 2;
        white-space: normal;
        overflow: visible;
        word-break: break-word;
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
        --ltt-c: 224,120,138;
        padding: 7px 10px 7px 10px;
        border: 1px solid rgba(var(--ltt-c), .3);
        border-radius: 5px;
        background: linear-gradient(135deg, rgba(10,8,16,.55), rgba(10,8,16,.3));
        box-shadow: inset 0 1px 0 rgba(246,232,226,.05);
        overflow: hidden;
        animation: ltt-card-in .3s ease both;
        animation-delay: calc(var(--i, 0) * 45ms);
    }

    /* มุมกรอบ 4 มุม (ตัวแทนแถบด้านซ้ายเดิม) */
    #${SHEET_ID} .ltt-card::before {
        content: '';
        position: absolute;
        inset: 3px;
        pointer-events: none;
        background:
            linear-gradient(rgb(var(--ltt-c)), rgb(var(--ltt-c))) top left / 9px 1px no-repeat,
            linear-gradient(rgb(var(--ltt-c)), rgb(var(--ltt-c))) top left / 1px 9px no-repeat,
            linear-gradient(rgb(var(--ltt-c)), rgb(var(--ltt-c))) top right / 9px 1px no-repeat,
            linear-gradient(rgb(var(--ltt-c)), rgb(var(--ltt-c))) top right / 1px 9px no-repeat,
            linear-gradient(rgb(var(--ltt-c)), rgb(var(--ltt-c))) bottom left / 9px 1px no-repeat,
            linear-gradient(rgb(var(--ltt-c)), rgb(var(--ltt-c))) bottom left / 1px 9px no-repeat,
            linear-gradient(rgb(var(--ltt-c)), rgb(var(--ltt-c))) bottom right / 9px 1px no-repeat,
            linear-gradient(rgb(var(--ltt-c)), rgb(var(--ltt-c))) bottom right / 1px 9px no-repeat;
        opacity: .85;
    }

    /* constant = กรอบทอง */
    #${SHEET_ID} .ltt-card.ltt-const {
        --ltt-c: 232,194,122;
        border-color: rgba(232,194,122,.34);
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

    const extraCss = `
    /* ===== ลูกแก้วเล็ก (ค้นหา) ===== */
    #${PANEL_ID} .ltt-item.ltt-small {
        width: ${ITEM_SMALL}px;
        height: ${ITEM_SMALL}px;
    }

    #${PANEL_ID} .ltt-item.ltt-small svg {
        width: 10px;
        height: 10px;
    }

    #${PANEL_ID} .ltt-item.ltt-small::after {
        width: 4px;
        height: 9px;
        background:
            linear-gradient(#c24a5e, #c24a5e) center top / 1px 6px no-repeat,
            radial-gradient(circle, #c24a5e 1.4px, transparent 1.8px) center bottom / 4px 4px no-repeat;
    }

    /* ป้ายของลูกแก้วเล็กวางเหนือลูกแก้ว ไม่ให้ชนป้าย/เลขของ Lorebook */
    #${PANEL_ID} .ltt-item.ltt-small .ltt-item-label {
        left: 2px;
        top: auto;
        bottom: calc(100% + 8px);
        transform: none;
        font-size: 8.5px;
    }

    #${PANEL_ID}.ltt-flip .ltt-item.ltt-small .ltt-item-label {
        left: auto;
        right: 2px;
    }

    /* ===== หน้าต่างค้นหา / Write (ส่วนที่ต่างจากหน้าต่าง Triggers) ===== */
    ${WINS} .ltt-search-box {
        flex: none;
        margin: 8px 8px 0;
    }

    ${WINS} .ltt-search-input {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        box-sizing: border-box;
        margin: 0;
        padding: 6px 10px;
        border: 1px solid rgba(224,120,138,.45);
        border-radius: 5px;
        background: rgba(10,8,16,.5);
        box-shadow: none;
        color: #f6e8e2;
        font-family: inherit;
        font-size: 12px;
        line-height: 1.6;
        outline: none;
    }

    ${WINS} .ltt-search-input::-webkit-search-cancel-button { -webkit-appearance: none; display: none; }
    ${WINS} .ltt-search-input::placeholder { color: #9d8c95; }
    ${WINS} .ltt-search-input:focus { border-color: rgba(246,232,226,.8); }

    ${WINS} .ltt-hit { cursor: pointer; }
    ${WINS} .ltt-spacer { flex: 1; }

    ${WINS} .ltt-snip {
        margin-top: 5px;
        color: #e6d8de;
        font-size: 10.5px;
        line-height: 1.75;
        word-break: break-word;
    }

    ${WINS} .ltt-snip mark {
        padding: 0 2px;
        border-radius: 2px;
        background: rgba(224,120,138,.38);
        color: #fff;
    }

    ${WINS} .ltt-act {
        -webkit-appearance: none;
        appearance: none;
        flex: none;
        margin: 0;
        padding: 0 8px;
        border: 1px solid rgba(246,232,226,.4) !important;
        border-radius: 9px !important;
        background: transparent !important;
        box-shadow: none !important;
        color: #f6e8e2;
        font-family: inherit;
        font-size: 9px;
        line-height: 15px;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
    }

    ${WINS} .ltt-act:active { background: rgba(246,232,226,.2) !important; }

    ${WINS} .ltt-act.ltt-confirm {
        border-color: #e0788a !important;
        background: #b3243f !important;
        color: #fff;
    }

    /* ===== Write: กรอบเตี้ย ปุ่มแถวเดียว คำอธิบายจิ๋วอยู่ขวาบน ===== */
    #${WRITE_ID} {
        width: fit-content;
        max-width: min(300px, calc(100vw - 16px));
    }

    /* ประกายและข้าวหลามตัดมุมขวาบนเอาออก เพื่อเว้นที่ให้ปุ่มปิดกับป้ายคำอธิบาย */
    #${WRITE_ID} .ltt-spk,
    #${WRITE_ID} .ltt-c-tr { display: none; }

    /* หัวไม่กินพื้นที่แนวตั้ง: คำอธิบายกับปุ่มปิดลอยอยู่บนขอบกล่องขวาบน */
    #${WRITE_ID} .ltt-head { display: contents; }

    /* ป้ายคำอธิบายจิ๋ว วางบนขอบบน ก่อนถึงปุ่มปิด */
    #${WRITE_ID} .ltt-meta {
        position: absolute;
        top: -6px;
        right: 16px;
        z-index: 3;
        flex: none;
        padding: 0 5px;
        overflow: visible;
        background: rgba(28,24,36,.94);
        border: 1px solid rgba(224,120,138,.45);
        border-radius: 2px;
        color: rgba(246,232,226,.78);
        font-size: 7px;
        line-height: 11px;
        letter-spacing: 0;
    }

    #${WRITE_ID} .ltt-meta::before { display: none; }

    /* ปุ่มปิดแยกเป็นปุ่มกลมที่มุมขวาบน (สไตล์เดียวกับป้าย WRITE) */
    #${WRITE_ID} .ltt-nav {
        position: absolute;
        top: -8px;
        right: -7px;
        z-index: 4;
        padding: 0;
        border: 0;
        background: none;
    }

    #${WRITE_ID} .ltt-nav .ltt-close {
        width: 16px;
        height: 16px;
        margin: 0;
        border: 1px solid #b3243f !important;
        background: linear-gradient(180deg, #fbefe9, #f0dcd4) !important;
        box-shadow: 0 0 0 2px #1c1824, 0 2px 6px rgba(0,0,0,.35) !important;
        color: #8f1f38;
        font-size: 8px;
        font-weight: 700;
    }

    #${WRITE_ID} .ltt-nav .ltt-close::before { display: none; }

    #${WRITE_ID} .ltt-row {
        flex: none;
        display: flex;
        align-items: center;
        gap: 3px;
        padding: 11px 9px 8px;
        overflow-x: auto;
        white-space: nowrap;
        scrollbar-width: none;
    }

    #${WRITE_ID} .ltt-row::-webkit-scrollbar { display: none; }

    #${WRITE_ID} .ltt-tool {
        -webkit-appearance: none;
        appearance: none;
        flex: none;
        min-width: 24px;
        height: 22px;
        margin: 0;
        padding: 0 5px;
        border: 1px solid rgba(246,232,226,.4) !important;
        border-radius: 5px !important;
        background: rgba(246,232,226,.09) !important;
        box-shadow: none !important;
        color: #f6e8e2;
        font-family: inherit;
        font-size: 12px;
        line-height: 1;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: background .15s ease, border-color .15s ease;
    }

    #${WRITE_ID} .ltt-tool:active { background: rgba(246,232,226,.28) !important; }

    /* แตะ 2 ครั้งแล้ว รอประกบตัวปิด */
    #${WRITE_ID} .ltt-tool.ltt-on {
        border-color: #f6e8e2 !important;
        background: #c42b48 !important;
        box-shadow: 0 0 0 1px rgba(246,232,226,.25) !important;
        color: #fff;
    }

    /* ปุ่มสัญลักษณ์กุ๊กกิ๊ก (เปิดถาดสัญลักษณ์) */
    #${WRITE_ID} .ltt-tool.ltt-sym { color: #e0788a; }

    #${WRITE_ID} .ltt-tool.ltt-open {
        border-color: #f6e8e2 !important;
        background: rgba(246,232,226,.3) !important;
    }

    #${WRITE_ID} .ltt-name {
        max-width: 64px;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 11.5px;
    }

    #${WRITE_ID} .ltt-sep {
        flex: none;
        width: 1px;
        height: 14px;
        margin: 0 1px;
        background: rgba(224,120,138,.5);
    }

    /* ตัวเลือกจำนวนดอกจัน 1 / 2 / 3 */
    #${WRITE_ID} .ltt-grp {
        flex: none;
        display: flex;
        align-items: center;
        gap: 2px;
    }

    #${WRITE_ID} .ltt-lvl {
        display: flex;
        height: 22px;
        box-sizing: border-box;
        padding: 2px;
        border: 1px solid rgba(224,120,138,.55);
        border-radius: 11px;
        background: rgba(10,8,16,.4);
    }

    #${WRITE_ID} .ltt-lvl button {
        -webkit-appearance: none;
        appearance: none;
        min-width: 13px;
        height: 16px;
        margin: 0;
        padding: 0;
        border: 0 !important;
        border-radius: 8px !important;
        background: none !important;
        box-shadow: none !important;
        color: #d9a9b3;
        font: 700 9.5px 'Courier New', monospace;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
    }

    #${WRITE_ID} .ltt-lvl button.ltt-sel {
        background: #f6e8e2 !important;
        color: #8f1f38;
    }

    /* ถาดสัญลักษณ์ ลอยเหนือหน้าต่าง Write */
    #${WRITE_ID} .ltt-fly {
        position: absolute;
        left: 50%;
        bottom: calc(100% + 16px);
        transform: translateX(-50%);
        box-sizing: border-box;
        max-width: calc(100vw - 16px);
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 6px 8px;
        overflow-x: auto;
        white-space: nowrap;
        scrollbar-width: none;
        background: linear-gradient(170deg, #4a1428, #231826 60%, #1a1622);
        border: 1px solid rgba(246,232,226,.55);
        border-radius: 4px;
        box-shadow:
            0 8px 20px rgba(0,0,0,.5),
            0 0 0 1px rgba(0,0,0,.35),
            inset 0 0 0 2px #261827,
            inset 0 0 0 3px rgba(224,120,138,.3);
    }

    #${WRITE_ID} .ltt-fly::-webkit-scrollbar { display: none; }
    #${WRITE_ID} .ltt-fly[hidden] { display: none; }
    #${WRITE_ID} .ltt-fly .ltt-tool { min-width: 26px; font-size: 13px; }

    /* ===== วงล้อ: ลูกที่หลุดโค้งจางหาย / แผ่นรับนิ้วปัดตามแนวโค้ง ===== */
    #${PANEL_ID} .ltt-catch {
        position: absolute;
        left: 0;
        top: 0;
        transform: translate(-50%, -50%);
        background: transparent;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        -webkit-tap-highlight-color: transparent;
    }

    #${PANEL_ID}.ltt-visible .ltt-catch { pointer-events: auto; }
    #${PANEL_ID}.ltt-static .ltt-catch { display: none; }
    #${PANEL_ID}.ltt-visible .ltt-item.ltt-off { pointer-events: none; }
    #${PANEL_ID}.ltt-rolling .ltt-item { transition: none; }
    #${PANEL_ID} .ltt-count.ltt-hide { display: none; }

    /* ===== Dice / Calendar ===== */
    ${TOOLWINS} .ltt-dice-ctl,
    ${TOOLWINS} .ltt-cal-top { flex: none; }

    ${TOOLWINS} .ltt-bar {
        flex: none;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 4px;
        margin: 8px 8px 0;
    }

    ${TOOLWINS} .ltt-bar.ltt-bar-in { margin: 0; }

    ${TOOLWINS} .ltt-hint {
        color: #bfaeb6;
        font-size: 9.5px;
        line-height: 1.6;
    }

    ${TOOLWINS} .ltt-tool {
        -webkit-appearance: none;
        appearance: none;
        flex: none;
        min-width: 24px;
        height: 22px;
        margin: 0;
        padding: 0 7px;
        border: 1px solid rgba(246,232,226,.4) !important;
        border-radius: 5px !important;
        background: rgba(246,232,226,.09) !important;
        box-shadow: none !important;
        color: #f6e8e2;
        font-family: inherit;
        font-size: 11px;
        line-height: 1;
        white-space: nowrap;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: background .15s ease, border-color .15s ease;
    }

    ${TOOLWINS} .ltt-tool:active { background: rgba(246,232,226,.28) !important; }

    ${TOOLWINS} .ltt-tool.ltt-on {
        border-color: #f6e8e2 !important;
        background: #c42b48 !important;
        color: #fff;
    }

    ${TOOLWINS} .ltt-tool.ltt-confirm,
    ${TOOLWINS} .ltt-tool.ltt-danger {
        border-color: #e0788a !important;
        background: #b3243f !important;
        color: #fff;
    }

    ${TOOLWINS} .ltt-step { min-width: 22px; padding: 0 5px; font-size: 14px; }

    ${TOOLWINS} .ltt-grow { flex: 1 1 80px; width: auto; min-width: 0; }
    ${TOOLWINS} .ltt-time { flex: none; width: 84px; }

    ${TOOLWINS} .ltt-bar .ltt-search-input {
        height: 24px;
        padding: 2px 8px;
        font-size: 11.5px;
        line-height: 1.4;
        color-scheme: dark;
    }

    ${TOOLWINS} .ltt-search-input[type="date"],
    ${TOOLWINS} .ltt-search-input[type="time"] { color-scheme: dark; }

    #${DICE_ID} .ltt-area {
        display: block;
        min-height: 96px;
        resize: none;
        line-height: 1.6;
    }

    /* ปุ่มตารางสุ่ม: ชื่อ + ดินสอแก้ไข ติดกันเป็นก้อนเดียว */
    #${DICE_ID} .ltt-grp2 { display: inline-flex; max-width: 100%; }

    #${DICE_ID} .ltt-chip {
        max-width: 118px;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    #${DICE_ID} .ltt-grp2 .ltt-chip {
        border-top-right-radius: 0 !important;
        border-bottom-right-radius: 0 !important;
        border-right-width: 0 !important;
    }

    #${DICE_ID} .ltt-chip-edit {
        min-width: 22px;
        padding: 0 4px;
        border-top-left-radius: 0 !important;
        border-bottom-left-radius: 0 !important;
        color: #e0788a;
    }

    /* ผลทอย: ใบล่าสุดเด่น ใบเก่าไม่เล่นแอนิเมชันซ้ำ */
    #${DICE_ID} .ltt-roll { animation: none; }

    #${DICE_ID} .ltt-roll.ltt-latest {
        animation: ltt-card-in .3s ease both;
        border-color: rgba(246,232,226,.7);
    }

    #${DICE_ID} .ltt-roll-text {
        color: #fff;
        font-size: 12.5px;
        font-weight: 600;
        line-height: 1.55;
        word-break: break-word;
    }

    ${TOOLWINS} .ltt-roll-act { margin-top: 5px; }

    /* ปฏิทิน */
    #${CAL_ID} .ltt-book { max-width: none; }
    #${CAL_ID} .ltt-card-top { flex-wrap: wrap; }
    #${CAL_ID} .ltt-card.ltt-past { opacity: .6; }
    #${CAL_ID} .ltt-snip-tap { cursor: pointer; }
    #${CAL_ID} .ltt-snip-full { opacity: .75; font-style: italic; }

    #${CAL_ID} .ltt-card.ltt-cal-edit {
        display: flex;
        flex-direction: column;
        gap: 5px;
        opacity: 1;
    }

    #${CAL_ID} .ltt-cal-edit .ltt-search-input { width: 100%; box-sizing: border-box; }
    #${CAL_ID} .ltt-cal-edit .ltt-bar .ltt-grow { width: auto; }
    #${CAL_ID} .ltt-cal-edit .ltt-bar .ltt-time { width: 84px; }

    /* ไฮไลต์ข้อความที่เลื่อนไปหา */
    .mes.ltt-flash { animation: ltt-mes-flash 2.4s ease-out; }

    @keyframes ltt-mes-flash {
        0%, 35% { box-shadow: 0 0 0 2px rgba(224,120,138,.9), 0 0 18px rgba(224,120,138,.5); }
        100%    { box-shadow: 0 0 0 2px rgba(224,120,138,0), 0 0 18px rgba(224,120,138,0); }
    }
`;

    // หน้าต่าง Search / Write ใช้หน้าตาเดียวกับ Triggers: ขยายตัวเลือกของ Triggers ให้ครอบทั้งสาม
    style.textContent = baseCss.replaceAll(`#${SHEET_ID}`, WINS) + extraCss;

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
        positionWins();
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

    // วางลูกตามตำแหน่งวงล้อ (หมุนได้) และแถบรับนิ้ว
    wheelSx = sx;
    wheelSy = sy;
    wheelCx = cx;
    wheelCy = cy;

    layoutWheel();
    layoutCatcher(panel);

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

    // แถบรับนิ้วสำหรับปัดวงล้อ (อยู่ใต้ลูกแก้ว) ถ้ามีลูกไม่เกิน 3 ไม่ต้องหมุนจึงปิดไว้
    const catcher = document.createElement('div');
    catcher.className = 'ltt-catch';
    panel.appendChild(catcher);
    panel.classList.toggle('ltt-static', !wheelSpins());

    for (const category of CATEGORIES) {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = category.small ? 'ltt-item ltt-small' : 'ltt-item';
        item.dataset.id = category.id;
        item.title = category.label;

        item.innerHTML = `
            ${category.icon}
            <span class="ltt-item-label">${category.label}</span>
            ${category.count === undefined ? '' : `<span class="ltt-count">${category.count}</span>`}
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

        if (anyWinOpen()) {
            closeAllWins();
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
    settleWheel();

    const panel = document.getElementById(PANEL_ID);
    const button = document.getElementById(BUTTON_ID);

    if (panel) {
        panel.classList.remove('ltt-visible');
    }

    if (button) {
        button.classList.toggle('ltt-active', anyWinOpen());
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
        if (item.classList.contains('ltt-off')) continue;

        const r = item.getBoundingClientRect();

        if (x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad) {
            return item;
        }
    }

    return null;
}

function onItemTap(event) {
    // เพิ่งปัดวงล้อ: ปล่อยนิ้วเหนือลูกไหนก็ไม่นับเป็นการแตะเลือก
    if (wheelMoved) return;

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

    // ปัดวงล้อ
    listen(window, 'pointerdown', onWheelPointerDown, true);
    listen(window, 'pointermove', onWheelPointerMove, true);
    listen(window, 'pointerup', onWheelPointerUp, true);
    listen(window, 'pointercancel', onWheelPointerUp, true);
    listen(window, 'wheel', onWheelScroll, { capture: true, passive: false });

    listen(document, 'click', function onOutsideClick(event) {
        // คลิกที่ตามหลังการเลือกตัวเลือกหยก ๆ ห้ามนับเป็นการแตะข้างนอก
        if (Date.now() - lastActivate < 450) return;

        const panel = document.getElementById(PANEL_ID);
        const button = document.getElementById(BUTTON_ID);
        const sheet = document.getElementById(SHEET_ID);
        const search = document.getElementById(SEARCH_ID);
        const write = document.getElementById(WRITE_ID);
        const dice = document.getElementById(DICE_ID);
        const cal = document.getElementById(CAL_ID);

        if (
            panel?.contains(event.target) ||
            button?.contains(event.target) ||
            sheet?.contains(event.target) ||
            search?.contains(event.target) ||
            write?.contains(event.target) ||
            dice?.contains(event.target) ||
            cal?.contains(event.target)
        ) {
            return;
        }

        // Write เป็นตัวช่วยพิมพ์: แตะกล่องข้อความ/ที่อื่นระหว่างพิมพ์ต้องไม่ปิด (ปิดด้วย ✕ หรือแตะลูกแก้ว)
        if (!writeOpen) closeAllWins();
        if (panelOpen) closePanel();
    });

    listen(document, 'keydown', event => {
        if (event.key === 'Escape') {
            closeAllWins();
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
        viewPage = 0;
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
        viewPage = 0;
        livePage = 0;

        updateBadge();
        if (sheetOpen) renderSheet();

        // ปฏิทินเป็นของแชทนั้น ๆ: เปลี่ยนแชทแล้วอ่านใหม่
        calEditing = null;
        updateCalBadge();
        if (calOpen) renderCal();
    });

    // ปฏิทิน: จับวันที่จากข้อความที่ส่ง/ได้รับ/แก้ไข/สุ่มใหม่ (จับคำ ไม่เรียก AI)
    on(types.MESSAGE_SENT, 'message_sent', mesId => calScanMessage(mesId));
    on(types.MESSAGE_RECEIVED, 'message_received', mesId => calScanMessage(mesId));
    on(types.MESSAGE_EDITED, 'message_edited', mesId => calScanMessage(mesId));
    on(types.MESSAGE_SWIPED, 'message_swiped', mesId => calScanMessage(mesId));

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


function itemsOf(ctx, index) {
    const items = ctx?.chat?.[index]?.extra?.ltt_triggers?.items;
    return Array.isArray(items) ? items.filter(item => item && typeof item === 'object') : [];
}

function pageCount(total) {
    return Math.max(1, Math.ceil(total / PER_PAGE));
}

// ลำดับหน้าทั้งหมด: แต่ละข้อความ (เรียงเก่า→ใหม่) แตกเป็นหลายหน้าถ้ามีเกิน PER_PAGE
function pageSequence(ctx) {
    const seq = [];

    for (const index of trackedIndices()) {
        const pages = pageCount(itemsOf(ctx, index).length);
        for (let page = 0; page < pages; page++) seq.push({ index, page });
    }

    return seq;
}

function stepPage(delta) {
    const ctx = getCtx();
    const seq = ctx ? pageSequence(ctx) : [];

    if (!seq.length) {
        const max = pageCount(liveEntries?.length || 0) - 1;
        livePage = Math.max(0, Math.min(livePage + delta, max));
        renderSheet();
        return;
    }

    const current = seq.findIndex(entry => entry.index === viewIndex && entry.page === viewPage);
    const target = seq[(current < 0 ? seq.length - 1 : current) + delta];

    if (!target) return;

    viewIndex = target.index;
    viewPage = target.page;
    renderSheet();
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

    const step = delta => stepPage(delta);

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
    card.style.setProperty('--i', String(Math.min(index % PER_PAGE, 8)));

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
    list.scrollTop = 0;
    query.textContent = '';

    const indices = trackedIndices();

    // สรุปจำนวน: "11–20 / 23" เมื่อมีหลายหน้า ไม่งั้น "N รายการ"
    const summary = (total, page) => {
        if (total <= PER_PAGE) return `${total} รายการ`;

        const from = page * PER_PAGE + 1;
        const to = Math.min(total, from + PER_PAGE - 1);

        return `${from}–${to} / ${total}`;
    };

    if (!ctx || !indices.length) {
        const total = liveEntries?.length || 0;
        const pages = pageCount(total);

        livePage = Math.max(0, Math.min(livePage, pages - 1));

        label.textContent = pages > 1 ? `${livePage + 1}/${pages}` : '1';
        prev.disabled = livePage <= 0;
        next.disabled = livePage >= pages - 1;
        meta.textContent = summary(total, livePage);

        if (total) {
            query.textContent = 'ผลล่าสุดจาก SillyTavern';

            liveEntries
                .slice(livePage * PER_PAGE, (livePage + 1) * PER_PAGE)
                .forEach((item, i) => list.appendChild(renderCard(item, livePage * PER_PAGE + i)));
        } else {
            list.appendChild(makeEl('div', 'ltt-note', 'ไม่มีการทริกเกอร์'));
        }

        appendStatus(list);

        return;
    }

    if (!indices.includes(viewIndex)) {
        viewIndex = indices[indices.length - 1];
        viewPage = 0;
    }

    const data = ctx.chat[viewIndex].extra.ltt_triggers;
    const items = itemsOf(ctx, viewIndex);
    const pages = pageCount(items.length);

    viewPage = Math.max(0, Math.min(viewPage, pages - 1));

    const seq = pageSequence(ctx);
    const position = seq.findIndex(entry => entry.index === viewIndex && entry.page === viewPage);

    label.textContent = pages > 1 ? `#${viewIndex} · ${viewPage + 1}/${pages}` : `#${viewIndex}`;
    prev.disabled = position <= 0;
    next.disabled = position >= seq.length - 1;

    meta.textContent = summary(items.length, viewPage);
    query.textContent = data.q ? `จาก “${data.q}”` : '';

    if (!items.length) {
        list.appendChild(makeEl('div', 'ltt-note', 'ข้อความนี้ไม่มี Lorebook ถูกทริกเกอร์'));
        appendStatus(list);

        return;
    }

    items
        .slice(viewPage * PER_PAGE, (viewPage + 1) * PER_PAGE)
        .forEach((item, i) => list.appendChild(renderCard(item, viewPage * PER_PAGE + i)));
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
    closeSearch();
    closeWrite();
    closeDice();
    closeCal();

    const sheet = createSheet();
    const button = document.getElementById(BUTTON_ID);

    sheetOpen = true;
    viewIndex = latestTracked();
    viewPage = 0;
    livePage = 0;

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

    syncOrb();
}

function toggleSheet() {
    if (sheetOpen) closeSheet();
    else openSheet();
}

/* ============================================================
 * หน้าต่างค้นหาข้อความ + หน้าต่างตัวช่วยพิมพ์ (Write)
 * ใช้หน้าตาเดียวกับหน้าต่าง Triggers (CSS ใช้ร่วมกันผ่าน :is())
 * ============================================================ */

let searchQuery = '';
let searchTimer = 0;
let branchTimer = 0;

function anyWinOpen() {
    return sheetOpen || searchOpen || writeOpen || diceOpen || calOpen;
}

function syncOrb() {
    document.getElementById(BUTTON_ID)?.classList.toggle('ltt-active', panelOpen || anyWinOpen());
}

function closeAllWins() {
    closeSheet();
    closeSearch();
    closeWrite();
    closeDice();
    closeCal();
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// สร้างหน้าต่างเปล่าหน้าตาเดียวกับหน้าต่าง Triggers
function createWin(id, title, bodyHtml) {
    let win = document.getElementById(id);
    if (win) return win;

    win = document.createElement('div');
    win.id = id;

    win.innerHTML = `
        <span class="ltt-corner ltt-c-tl"></span>
        <span class="ltt-corner ltt-c-tr"></span>
        <span class="ltt-corner ltt-c-bl"></span>
        <span class="ltt-corner ltt-c-br"></span>
        <span class="ltt-spk ltt-spk-a">${SPARK}</span>
        <span class="ltt-spk ltt-spk-b">${SPARK}</span>
        <span class="ltt-spk ltt-spk-c">${SPARK}</span>
        <span class="ltt-title">${SPARK}${title}</span>
        <div class="ltt-head">
            <span class="ltt-meta"></span>
            <span class="ltt-nav">
                <button type="button" class="ltt-close" aria-label="ปิด">✕</button>
            </span>
        </div>
        ${bodyHtml}
    `;

    win.querySelector('.ltt-close').addEventListener('click', event => {
        event.stopPropagation();
        closeAllWins();
    });

    document.body.appendChild(win);

    return win;
}

// วางหน้าต่างเหนือกล่องข้อความ (เหมือนหน้าต่าง Triggers) และไม่ให้จมใต้คีย์บอร์ด
function positionWin(win) {
    if (!win || !win.classList.contains('ltt-visible')) return;

    const target = findTextbox();
    const rect = target ? target.getBoundingClientRect() : null;
    const hasBox = Boolean(rect && rect.width && rect.height);

    const vv = window.visualViewport;
    const viewH = vv ? Math.min(window.innerHeight, vv.height + vv.offsetTop) : window.innerHeight;
    const gap = 14;

    const bottomEdge = hasBox ? Math.min(rect.top - gap, viewH - gap) : viewH - 80;
    const room = Math.max(110, bottomEdge - 14);

    resetCustomStyle(win);
    win.style.maxHeight = `${Math.min(room, viewH * 0.5)}px`;

    const prevTransition = win.style.transition;
    const prevTransform = win.style.transform;

    win.style.transition = 'none';
    win.style.transform = 'none';

    placeTop(win, Math.max(8, bottomEdge - win.offsetHeight));

    win.style.transform = prevTransform;
    win.style.transition = prevTransition;
}

function positionWins() {
    positionWin(document.getElementById(SEARCH_ID));
    positionWin(document.getElementById(WRITE_ID));
    positionWin(document.getElementById(DICE_ID));
    positionWin(document.getElementById(CAL_ID));
}

/* ---------- ค้นหา ---------- */

function getMessageEl(index) {
    return document.querySelector(`#chat .mes[mesid="${index}"]`);
}

function flashMessage(el) {
    el.classList.remove('ltt-flash');
    void el.offsetWidth;
    el.classList.add('ltt-flash');
    setTimeout(() => el.classList.remove('ltt-flash'), 2600);
}

// เลื่อนไปที่ข้อความ #index (ถ้ายังไม่ถูกโหลดลงหน้าจอ จะโหลดข้อความเก่าเพิ่มให้เอง)
async function jumpToMessage(index) {
    let el = getMessageEl(index);

    if (!el) {
        try {
            await getCtx()?.executeSlashCommandsWithOptions?.(`/chat-jump ${index}`);
            await sleep(300);
            el = getMessageEl(index);
        } catch { /* ข้าม แล้วลองวิธีถัดไป */ }
    }

    for (let n = 0; !el && n < 60; n++) {
        const more = document.querySelector('#show_more_messages');
        if (!more) break;

        more.click();
        await sleep(140);
        el = getMessageEl(index);
    }

    if (!el) {
        showToast(`✖ หาข้อความ #${index} บนหน้าจอไม่เจอ`);
        return;
    }

    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    flashMessage(el);
}

// แยกสาขา (branch) จากข้อความ #index โดยไม่ต้องเลื่อนไปหา
async function branchFromMessage(index) {
    try {
        const button = getMessageEl(index)?.querySelector('.mes_create_branch');

        if (button) {
            button.click();
        } else {
            const run = getCtx()?.executeSlashCommandsWithOptions;
            if (typeof run !== 'function') throw new Error('ไม่พบคำสั่งแยกสาขาในเวอร์ชันนี้');

            await run(`/branch-create mesId=${index}`);
        }

        showToast(`✓ แยกสาขาจากข้อความ #${index} แล้ว`);
    } catch (error) {
        console.error(`[${EXT_ID}] branch error`, error);
        showToast(`✖ แยกสาขาไม่สำเร็จ: ${error?.message || error}`);
    }
}

function flatText(message) {
    return String(message?.mes ?? '').replace(/\s+/g, ' ').trim();
}

// ตัดข้อความรอบคำที่เจอ พร้อมไฮไลต์ (สร้างด้วย DOM ไม่ใช้ innerHTML)
function makeSnippet(text, needle) {
    const box = makeEl('div', 'ltt-snip');
    const at = needle ? text.toLowerCase().indexOf(needle) : -1;

    if (at < 0) {
        box.textContent = text.slice(0, 90) + (text.length > 90 ? '…' : '');
        return box;
    }

    const start = Math.max(0, at - 28);
    const end = Math.min(text.length, at + needle.length + 52);

    if (start > 0) box.appendChild(document.createTextNode('…'));
    box.appendChild(document.createTextNode(text.slice(start, at)));
    box.appendChild(makeEl('mark', '', text.slice(at, at + needle.length)));
    box.appendChild(document.createTextNode(text.slice(at + needle.length, end)));
    if (end < text.length) box.appendChild(document.createTextNode('…'));

    return box;
}

function makeAction(label, onClick) {
    const button = makeEl('button', 'ltt-act', label);
    button.type = 'button';

    button.addEventListener('click', event => {
        event.stopPropagation();
        onClick(button);
    });

    return button;
}

function renderHit(chat, index, needle, order) {
    const message = chat[index];

    const card = makeEl('div', 'ltt-card ltt-hit');
    card.style.setProperty('--i', String(Math.min(order, 8)));

    // ข้อความของผู้ใช้ = กรอบทอง / ตัวละคร = กรอบชมพู
    if (message?.is_user) card.classList.add('ltt-const');

    const top = makeEl('div', 'ltt-card-top');
    top.appendChild(makeEl('span', 'ltt-num', `#${index}`));
    if (message?.name) top.appendChild(makeEl('span', 'ltt-book', message.name));
    top.appendChild(makeEl('span', 'ltt-spacer'));

    top.appendChild(makeAction('ไปที่', () => {
        closeSearch();
        jumpToMessage(index);
    }));

    // แตะครั้งแรก = ขอยืนยัน, แตะอีกครั้งภายใน 3 วินาที = สร้างสาขา
    top.appendChild(makeAction('แยกสาขา', button => {
        if (!button.classList.contains('ltt-confirm')) {
            button.classList.add('ltt-confirm');
            button.textContent = 'ยืนยัน?';

            clearTimeout(branchTimer);
            branchTimer = setTimeout(() => {
                button.classList.remove('ltt-confirm');
                button.textContent = 'แยกสาขา';
            }, 3000);

            return;
        }

        clearTimeout(branchTimer);
        closeSearch();
        branchFromMessage(index);
    }));

    card.appendChild(top);
    card.appendChild(makeSnippet(flatText(message), needle));

    card.addEventListener('click', () => {
        closeSearch();
        jumpToMessage(index);
    });

    return card;
}

function runSearch() {
    const win = document.getElementById(SEARCH_ID);
    if (!win) return;

    const list = win.querySelector('.ltt-list');
    const meta = win.querySelector('.ltt-meta');
    const chat = getCtx()?.chat || [];
    const query = searchQuery.trim();

    list.textContent = '';
    list.scrollTop = 0;

    if (!query) {
        meta.textContent = chat.length ? `${chat.length} ข้อความในแชท` : '';
        list.appendChild(makeEl('div', 'ltt-note', 'พิมพ์คำที่อยากหา หรือพิมพ์ #เลขข้อความ'));
        positionWin(win);
        return;
    }

    const numberMatch = query.match(/^#(\d+)$/);
    const needle = numberMatch ? '' : query.toLowerCase();
    const hits = [];

    if (numberMatch) {
        const index = Number(numberMatch[1]);
        if (chat[index]) hits.push(index);
    } else {
        for (let index = chat.length - 1; index >= 0; index--) {
            if (flatText(chat[index]).toLowerCase().includes(needle)) hits.push(index);
        }
    }

    meta.textContent = hits.length
        ? (hits.length > SEARCH_LIMIT ? `พบ ${hits.length} · แสดง ${SEARCH_LIMIT} ล่าสุด` : `พบ ${hits.length} ข้อความ`)
        : 'ไม่พบ';

    if (!hits.length) {
        list.appendChild(makeEl('div', 'ltt-note', 'ไม่พบข้อความที่ตรงกัน'));
    } else {
        hits.slice(0, SEARCH_LIMIT).forEach((index, order) => {
            list.appendChild(renderHit(chat, index, needle, order));
        });
    }

    positionWin(win);
}

function createSearchWin() {
    const existing = document.getElementById(SEARCH_ID);
    if (existing) return existing;

    const win = createWin(SEARCH_ID, 'Search', `
        <div class="ltt-search-box">
            <input type="search" class="ltt-search-input" placeholder="ค้นหาในแชท…" autocomplete="off" enterkeyhint="search">
        </div>
        <div class="ltt-list"></div>
    `);

    const input = win.querySelector('.ltt-search-input');

    input.addEventListener('input', () => {
        searchQuery = input.value;
        clearTimeout(searchTimer);
        searchTimer = setTimeout(runSearch, 160);
    });

    // Enter = เก็บคีย์บอร์ดเพื่อให้เห็นผลลัพธ์เต็มจอ
    input.addEventListener('keydown', event => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        clearTimeout(searchTimer);
        runSearch();
        input.blur();
    });

    cleanups.push(() => clearTimeout(searchTimer));

    return win;
}

function openSearch() {
    closeSheet();
    closeWrite();
    closeDice();
    closeCal();

    const win = createSearchWin();

    searchOpen = true;
    win.classList.add('ltt-visible');
    syncOrb();

    win.querySelector('.ltt-search-input').value = searchQuery;

    runSearch();
    positionWin(win);

    setTimeout(() => win.querySelector('.ltt-search-input')?.focus(), 80);
}

function closeSearch() {
    if (!searchOpen) return;

    searchOpen = false;
    document.getElementById(SEARCH_ID)?.classList.remove('ltt-visible');
    syncOrb();
}

function toggleSearch() {
    if (searchOpen) closeSearch();
    else openSearch();
}

/* ---------- Write: ปุ่มแทรกเครื่องหมาย + ชื่อผู้ใช้ ---------- */

const DOUBLE_MS = 350;
const STAR_KEY = `${EXT_ID}-star-level`;
const tapAt = {};

let starLevel = loadStarLevel();
let armed = [];        // ปุ่มที่แตะ 2 ครั้งแล้ว รอประกบตัวปิด: { id, close, when }
let prevValue = '';
let writeBusy = false;

function loadStarLevel() {
    try {
        const n = Number(localStorage.getItem(STAR_KEY));
        return n >= 1 && n <= 3 ? n : 2;
    } catch {
        return 2;
    }
}

function starText() {
    return '*'.repeat(starLevel);
}

function userName() {
    const name = getCtx()?.name1;
    return name && String(name).trim() ? String(name).trim() : '';
}

function getBox() {
    return document.querySelector('#send_textarea') || findTextbox();
}

function buttonLabel(def) {
    const close = def.close();
    return close ? `${def.open()} ${close}` : def.open();
}

// ส่ง input ให้ SillyTavern รู้ว่าข้อความเปลี่ยน (ปรับความสูง/เก็บฉบับร่าง) โดยไม่วนกลับเข้าตัวประกบ
function commitBox(box) {
    prevValue = box.value;
    writeBusy = true;

    try {
        box.dispatchEvent(new Event('input', { bubbles: true }));
    } finally {
        writeBusy = false;
    }
}

// แทรกที่เคอร์เซอร์ ไม่เรียก focus() เพื่อไม่ให้คีย์บอร์ดเด้งขึ้น/ลง และหน้าต่างไม่ขยับ
function insertText(text, caretOffset) {
    const box = getBox();

    if (!box || typeof box.value !== 'string') {
        showToast('✖ หากล่องข้อความไม่เจอ');
        return;
    }

    const start = box.selectionStart ?? box.value.length;
    const end = box.selectionEnd ?? start;

    box.value = box.value.slice(0, start) + text + box.value.slice(end);

    const caret = start + (caretOffset ?? text.length);
    box.setSelectionRange(caret, caret);

    commitBox(box);
}

function syncWrite() {
    const win = document.getElementById(WRITE_ID);
    if (!win) return;

    for (const def of QUICK_BUTTONS) {
        const button = win.querySelector(`[data-btn="${def.id}"]`);
        if (!button) continue;

        button.classList.toggle('ltt-on', armed.some(item => item.id === def.id));
        button.textContent = buttonLabel(def);
    }

    win.querySelectorAll('.ltt-lvl button').forEach(button => {
        button.classList.toggle('ltt-sel', Number(button.dataset.n) === starLevel);
    });
}

function pressButton(def) {
    const box = getBox();
    if (!box || typeof box.value !== 'string') return;

    const open = def.open();
    const close = def.close();
    const start = box.selectionStart ?? box.value.length;
    const end = box.selectionEnd ?? start;

    // เลือกข้อความไว้ → ครอบให้ทันที
    if (end > start && close) {
        const v = box.value;
        box.value = v.slice(0, start) + open + v.slice(start, end) + close + v.slice(end);

        const caret = end + open.length + close.length;
        box.setSelectionRange(caret, caret);
        commitBox(box);

        return;
    }

    // แทรกเลย (ไม่มีระบบประกบ)
    if (!def.when) {
        if (close) insertText(open + close, open.length);
        else insertText(open);

        return;
    }

    // กดปุ่มสีแดงซ้ำ = ปิดทันที
    const index = armed.findIndex(item => item.id === def.id);

    if (index >= 0) {
        insertText(armed[index].close);
        armed.splice(index, 1);
        tapAt[def.id] = 0;
        syncWrite();

        return;
    }

    const now = Date.now();

    // แตะ 2 ครั้งติดกัน = รอประกบ (ตัวเปิดใส่ไปแล้วตอนแตะครั้งแรก)
    if (now - (tapAt[def.id] || 0) < DOUBLE_MS) {
        armed.push({ id: def.id, close, when: def.when });
        tapAt[def.id] = 0;
        syncWrite();

        return;
    }

    // แตะครั้งเดียว = ใส่ตัวอักษรปกติ
    // คู่ที่ตัวเปิด/ปิดต่างกัน เช่น [ ] : ถ้าก่อนเคอร์เซอร์ยังมีตัวเปิดค้าง ให้ใส่ตัวปิดแทน
    let text = open;

    if (close && close !== open) {
        const before = box.value.slice(0, start);

        if (before.split(open).length > before.split(close).length) text = close;
    }

    insertText(text);
    tapAt[def.id] = now;
}

// ประกบตัวปิดให้หลังผู้ใช้เว้นบรรทัด/เว้นวรรค
// ตรวจหลังพิมพ์ (ไม่ใช่ก่อน) เพราะคีย์บอร์ดมือถือหลายตัวยกเลิก event ก่อนพิมพ์ไม่ได้
function onWriteInput(event) {
    const box = event.target;

    if (writeBusy || box?.id !== 'send_textarea') return;

    const value = box.value;
    const caret = box.selectionStart ?? value.length;

    if (!value) {
        if (armed.length) {
            armed = [];
            syncWrite();
        }

        prevValue = value;
        return;
    }

    let typed = '';

    if (!event.isComposing && caret > 0) {
        if (event.inputType === 'insertLineBreak' || event.inputType === 'insertParagraph') typed = '\n';
        else if (event.inputType === 'insertText' && event.data === ' ') typed = ' ';
        else if (value.length === prevValue.length + 1) typed = value[caret - 1];

        if (typed && value[caret - 1] !== typed) typed = '';
    }

    if (armed.length && (typed === '\n' || typed === ' ')) {
        // เว้นบรรทัด = ปิดทุกตัวที่ค้างแล้วรีเซ็ต / เว้นวรรค = ปิดเฉพาะดอกจัน
        const hit = typed === '\n' ? armed.slice() : armed.filter(item => item.when === 'space');

        if (hit.length) {
            const at = caret - 1;
            const before = value.slice(0, at);
            let tail = '';

            // ผู้ใช้พิมพ์ตัวปิดเองไว้แล้ว ก็ไม่ใส่ซ้ำ
            [...hit].reverse().forEach(item => {
                if (item.close && !(before + tail).endsWith(item.close)) tail += item.close;
            });

            box.value = before + tail + value.slice(at);

            const next = at + tail.length + 1;
            box.setSelectionRange(next, next);

            armed = typed === '\n' ? [] : armed.filter(item => item.when !== 'space');
            syncWrite();
            commitBox(box);

            return;
        }
    }

    prevValue = box.value;
}

function makeTool(label, onClick, className) {
    const button = makeEl('button', className ? `ltt-tool ${className}` : 'ltt-tool', label);
    button.type = 'button';

    // ไม่ให้ปุ่มแย่งโฟกัสจากกล่องข้อความ (คีย์บอร์ดจะได้ไม่ปิด และเคอร์เซอร์ไม่หาย)
    button.addEventListener('mousedown', event => event.preventDefault());
    button.addEventListener('click', event => {
        event.stopPropagation();
        onClick(button);
    });

    return button;
}

function createWriteWin() {
    const existing = document.getElementById(WRITE_ID);
    if (existing) return existing;

    const win = createWin(WRITE_ID, 'Write', '<div class="ltt-row"></div>');
    const row = win.querySelector('.ltt-row');

    win.querySelector('.ltt-meta').textContent = 'แตะ 2 ครั้ง = ประกบหลังให้';

    for (const def of QUICK_BUTTONS) {
        const button = makeTool(buttonLabel(def), () => pressButton(def));
        button.dataset.btn = def.id;

        if (!def.star) {
            row.appendChild(button);
            continue;
        }

        // ดอกจัน + ตัวเลือก 1 / 2 / 3 ดอก
        const group = makeEl('span', 'ltt-grp');
        const level = makeEl('span', 'ltt-lvl');

        for (const n of [1, 2, 3]) {
            const choice = makeEl('button', '', String(n));
            choice.type = 'button';
            choice.dataset.n = String(n);
            choice.setAttribute('aria-label', `${n} ดอกจัน`);

            choice.addEventListener('mousedown', event => event.preventDefault());
            choice.addEventListener('click', event => {
                event.stopPropagation();
                starLevel = n;

                try { localStorage.setItem(STAR_KEY, String(n)); } catch { /* ข้าม */ }

                syncWrite();
            });

            level.appendChild(choice);
        }

        group.appendChild(button);
        group.appendChild(level);
        row.appendChild(group);
    }

    // ปุ่มสัญลักษณ์กุ๊กกิ๊ก: เปิด/ปิดถาดที่ลอยเหนือหน้าต่าง
    row.appendChild(makeTool('♡', () => {
        const fly = win.querySelector('.ltt-fly');
        setFly(Boolean(fly?.hidden));
    }, 'ltt-sym'));

    row.appendChild(makeEl('span', 'ltt-sep'));

    const name = makeTool('', () => insertText(userName() || '{{user}}'), 'ltt-name');
    name.dataset.role = 'name';
    row.appendChild(name);

    const fly = makeEl('div', 'ltt-fly');
    fly.hidden = true;

    for (const symbol of QUICK_SYMBOLS) {
        fly.appendChild(makeTool(symbol, () => insertText(symbol)));
    }

    win.appendChild(fly);

    return win;
}

function setFly(open) {
    const win = document.getElementById(WRITE_ID);
    if (!win) return;

    const fly = win.querySelector('.ltt-fly');
    if (fly) fly.hidden = !open;

    win.querySelector('.ltt-sym')?.classList.toggle('ltt-open', open);
}

function openWrite() {
    closeSheet();
    closeSearch();
    closeDice();
    closeCal();

    const win = createWriteWin();

    writeOpen = true;
    win.classList.add('ltt-visible');
    syncOrb();

    // ชื่อผู้ใช้เปลี่ยนได้ (เปลี่ยน persona) จึงอัปเดตป้ายทุกครั้งที่เปิด
    win.querySelector('[data-role="name"]').textContent = userName() || '{{user}}';

    syncWrite();
    positionWin(win);
}

function closeWrite() {
    if (!writeOpen) return;

    writeOpen = false;
    setFly(false);
    document.getElementById(WRITE_ID)?.classList.remove('ltt-visible');
    syncOrb();
}

function toggleWrite() {
    if (writeOpen) closeWrite();
    else openWrite();
}

/* ============================================================
 * Dice / Random และ ปฏิทิน: ส่วนคำนวณล้วน (ไม่แตะหน้าจอ)
 * ============================================================ */

/* ---------- ตัวสุ่ม + ตัวอ่านสูตรลูกเต๋า (ไม่แตะ DOM) ---------- */

const DICE_MAX_COUNT = 100;   // ทอยได้สูงสุดกี่ลูกต่อพจน์
const DICE_MAX_SIDES = 1000;  // ลูกเต๋ามีได้สูงสุดกี่หน้า
const DICE_MAX_TERMS = 12;    // สูตรมีได้สูงสุดกี่พจน์

// สุ่มจำนวนเต็ม 0..max-1 แบบไม่เอนเอียง (ใช้ crypto ของเบราว์เซอร์ ไม่เรียก AI)
function secureInt(max) {
    if (!(max > 1)) return 0;

    const cryptoObj = globalThis.crypto;

    if (cryptoObj?.getRandomValues) {
        const limit = Math.floor(0x100000000 / max) * max;
        const buf = new Uint32Array(1);

        do {
            cryptoObj.getRandomValues(buf);
        } while (buf[0] >= limit);

        return buf[0] % max;
    }

    return Math.floor(Math.random() * max);
}

function rollDie(sides) {
    return secureInt(sides) + 1;
}

/*
 * อ่านสูตร เช่น d20, 2d6+3, 1d20+1d4-2, 4d6kh3 (ทอย 4 เก็บ 3 สูงสุด), 2d20kl1 (เก็บต่ำสุด)
 * คืน { terms } หรือ { error }
 */
function parseDiceFormula(input) {
    const raw = String(input ?? '')
        .toLowerCase()
        .replace(/[−–—]/g, '-')
        .replace(/＋/g, '+')
        .trim();

    if (!raw) return { error: 'ใส่สูตรก่อน เช่น 2d6+3' };

    // เว้นวรรคระหว่างตัวเลข (เช่น "2d6 3") ถ้ารวมเงียบ ๆ จะกลายเป็น 2d63 จึงแจ้งให้ใส่ + หรือ - แทน
    if (/\d\s+\d/.test(raw)) return { error: 'ระหว่างพจน์ต้องมี + หรือ - (เช่น 2d6+3)' };

    const s = raw.replace(/[\s_]/g, '');

    const termRe = /^([+-]?)(?:(\d*)d(\d+|%)(?:k([hl])(\d+))?|(\d{1,6}))/;
    const terms = [];
    let rest = s;
    let totalDice = 0;

    while (rest) {
        const m = rest.match(termRe);

        if (!m) return { error: `อ่านสูตรไม่ออกตรง “${rest.slice(0, 8)}”` };
        if (terms.length && !m[1]) return { error: `ระหว่างพจน์ต้องมี + หรือ - (ตรง “${rest.slice(0, 8)}”)` };
        if (terms.length >= DICE_MAX_TERMS) return { error: `สูตรยาวเกินไป (สูงสุด ${DICE_MAX_TERMS} พจน์)` };

        const sign = m[1] === '-' ? -1 : 1;

        if (m[6] !== undefined) {
            terms.push({ kind: 'num', sign, value: Number(m[6]) });
        } else {
            const count = m[2] === '' ? 1 : Number(m[2]);
            const sides = m[3] === '%' ? 100 : Number(m[3]);
            const keep = m[4] ? { mode: m[4], k: Number(m[5]) } : null;

            if (count < 1 || count > DICE_MAX_COUNT) return { error: `ทอยได้ 1–${DICE_MAX_COUNT} ลูกต่อพจน์` };
            if (sides < 2 || sides > DICE_MAX_SIDES) return { error: `ลูกเต๋ามีได้ 2–${DICE_MAX_SIDES} หน้า` };
            if (keep && (keep.k < 1 || keep.k > count)) return { error: `kh/kl ต้องเก็บ 1–${count} ลูก` };

            totalDice += count;
            if (totalDice > 200) return { error: 'ทอยรวมกันมากเกินไป' };

            terms.push({ kind: 'dice', sign, count, sides, keep });
        }

        rest = rest.slice(m[0].length);
    }

    if (!terms.some(term => term.kind === 'dice')) return { error: 'ต้องมีลูกเต๋าอย่างน้อยหนึ่งลูก เช่น d20' };

    const label = s.replace(/^\+/, '');

    return { terms, label };
}

function rollFormula(input) {
    const parsed = parseDiceFormula(input);

    if (parsed.error) return parsed;

    let total = 0;
    const parts = [];

    for (const term of parsed.terms) {
        if (term.kind === 'num') {
            total += term.sign * term.value;
            parts.push({ sign: term.sign, num: term.value });
            continue;
        }

        const rolls = Array.from({ length: term.count }, () => rollDie(term.sides));
        let kept = rolls.map(() => true);

        if (term.keep) {
            const order = rolls.map((_, i) => i).sort((a, b) => {
                const diff = term.keep.mode === 'h' ? rolls[b] - rolls[a] : rolls[a] - rolls[b];
                return diff || a - b;
            });

            kept = rolls.map(() => false);
            order.slice(0, term.keep.k).forEach(i => { kept[i] = true; });
        }

        const sum = rolls.reduce((acc, value, i) => acc + (kept[i] ? value : 0), 0);

        total += term.sign * sum;
        parts.push({ sign: term.sign, rolls, kept });
    }

    // ลูกเดียวไม่มีตัวบวก (เช่น d20) ไม่ต้องแสดงรายละเอียดซ้ำ
    const single = parsed.terms.length === 1 && parsed.terms[0].kind === 'dice' && parsed.terms[0].count === 1;

    const detail = single ? '' : parts.map((part, i) => {
        const sign = part.sign < 0 ? '-' : (i > 0 ? '+' : '');

        if (part.num !== undefined) return `${sign}${part.num}`;

        const faces = part.rolls.map((value, j) => (part.kept[j] ? String(value) : `(${value})`));

        return `${sign}[${faces.join(', ')}]`;
    }).join(' ');

    return {
        ok: true,
        label: parsed.label,
        total,
        detail,
        text: `🎲 ${parsed.label} = ${total}${detail ? ` ${detail}` : ''}`
    };
}

function flipCoinText() {
    return `🪙 เหรียญ = ${secureInt(2) ? 'หัว' : 'ก้อย'}`;
}

function yesNoText() {
    return `❓ ใช่/ไม่ใช่ = ${secureInt(2) ? 'ใช่' : 'ไม่ใช่'}`;
}

function tableRollText(table) {
    const items = (table?.items || []).filter(item => String(item).trim());

    if (!items.length) return '';

    return `📜 ${table.name} = ${items[secureInt(items.length)]}`;
}

/* ---------- ปฏิทิน: จับวันที่/เวลาจากข้อความ (ไม่แตะ DOM, ไม่เรียก AI) ---------- */

// คำที่ทำให้ประโยคน่าจะเป็น "นัด/กิจกรรม" เพิ่ม/ลบได้
const CAL_KEYWORDS = [
    'นัดหมาย', 'นัดกัน', 'งานเลี้ยง', 'นัด', 'งาน', 'ประชุม', 'เจอกัน', 'พบกัน', 'เดท', 'สอบ', 'แข่ง', 'เทศกาล', 'วันเกิด',
    'ส่งงาน', 'กำหนด', 'เดินทาง', 'ออกเดินทาง', 'เลื่อน', 'จอง', 'ภารกิจ', 'ปาร์ตี้', 'ไปเที่ยว',
    'พิธี', 'กิจกรรม', 'ฉลอง', 'แต่งงาน'
];

// เทศกาล: m/d = วันที่ที่ใช้ (approx = วันเปลี่ยนตามปี ใช้ค่าประมาณ) เพิ่ม/ลบ/แก้ได้
const CAL_FESTIVALS = [
    { names: ['สงกรานต์'], m: 4, d: 13 },
    { names: ['ลอยกระทง'], m: 11, d: 15, approx: true },
    { names: ['วันปีใหม่', 'ขึ้นปีใหม่', 'ปีใหม่'], m: 1, d: 1 },
    { names: ['วันวาเลนไทน์', 'วาเลนไทน์'], m: 2, d: 14 },
    { names: ['วันฮาโลวีน', 'ฮาโลวีน', 'ฮัลโลวีน'], m: 10, d: 31 },
    { names: ['คริสต์มาส'], m: 12, d: 25 },
    { names: ['วันแม่'], m: 8, d: 12 },
    { names: ['วันพ่อ'], m: 12, d: 5 }
];

const TH_MONTHS = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const TH_MONTHS_SHORT = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const EN_MONTHS = ['', 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const TH_DAYS_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const TH_WEEKDAYS = { 'อาทิตย์': 0, 'จันทร์': 1, 'อังคาร': 2, 'พุธ': 3, 'พฤหัสบดี': 4, 'พฤหัส': 4, 'ศุกร์': 5, 'เสาร์': 6 };

function escRe(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ชื่อเดือนทั้งหมด (ไทยเต็ม/ย่อ + อังกฤษเต็ม/ย่อ) → เลขเดือน
const MONTH_LOOKUP = new Map();

for (let m = 1; m <= 12; m++) {
    MONTH_LOOKUP.set(TH_MONTHS[m], m);
    MONTH_LOOKUP.set(TH_MONTHS_SHORT[m].replace(/\.$/, ''), m);
    MONTH_LOOKUP.set(EN_MONTHS[m], m);
    MONTH_LOOKUP.set(EN_MONTHS[m].slice(0, 3), m);
}

MONTH_LOOKUP.set('sept', 9);

const MONTH_SRC = [...MONTH_LOOKUP.keys()].sort((a, b) => b.length - a.length).map(escRe).join('|');

function monthOf(name) {
    return MONTH_LOOKUP.get(String(name).toLowerCase().replace(/\.$/, '')) || 0;
}

const NUM_WORDS = { 'หนึ่ง': 1, 'เอ็ด': 1, 'สอง': 2, 'สาม': 3, 'สี่': 4, 'ห้า': 5, 'หก': 6, 'เจ็ด': 7, 'แปด': 8, 'เก้า': 9, 'สิบ': 10, 'สิบเอ็ด': 11, 'สิบสอง': 12 };
const NUM_SRC = '\\d{1,2}|สิบเอ็ด|สิบสอง|หนึ่ง|เอ็ด|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า|สิบ';

function numOf(text) {
    return /^\d+$/.test(text) ? Number(text) : (NUM_WORDS[text] || 0);
}

function normalizeDigits(text) {
    return String(text ?? '').replace(/[๐-๙]/g, ch => String(ch.charCodeAt(0) - 0x0E50));
}

const p2 = n => String(n).padStart(2, '0');

/* ---------- เลขวัน (ใช้ UTC ล้วน ไม่โดนเขตเวลา/ฤดูร้อนรบกวน) ---------- */

function utcOf(y, m, d) {
    const t = new Date(0);
    t.setUTCFullYear(y, m - 1, d);
    t.setUTCHours(0, 0, 0, 0);
    return t;
}

function isoOf(y, m, d) {
    return `${String(y).padStart(4, '0')}-${p2(m)}-${p2(d)}`;
}

function parseISO(text) {
    const m = String(text || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;

    const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);

    return validYmd(y, mo, d) ? { y, m: mo, d } : null;
}

function daysInMonth(y, m) {
    return utcOf(y, m + 1, 0).getUTCDate();
}

function validYmd(y, m, d) {
    return y >= 1 && y <= 9999 && m >= 1 && m <= 12 && d >= 1 && d <= daysInMonth(y, m);
}

function addDays(iso, n) {
    const p = parseISO(iso);
    if (!p) return '';

    const t = utcOf(p.y, p.m, p.d + n);
    const y = t.getUTCFullYear();

    return y >= 1 && y <= 9999 ? isoOf(y, t.getUTCMonth() + 1, t.getUTCDate()) : '';
}

// บวกเดือน: ถ้าวันที่เกินของเดือนปลายทาง (เช่น 31 ม.ค. + 1 เดือน) ถอยมาวันสุดท้ายของเดือน
function addMonths(iso, n) {
    const p = parseISO(iso);
    if (!p) return '';

    const index = p.y * 12 + (p.m - 1) + n;
    const y = Math.floor(index / 12);
    const m = (index % 12 + 12) % 12 + 1;

    if (y < 1 || y > 9999) return '';

    return isoOf(y, m, Math.min(p.d, daysInMonth(y, m)));
}

function weekdayOf(iso) {
    const p = parseISO(iso);
    return p ? utcOf(p.y, p.m, p.d).getUTCDay() : 0;
}

function realTodayISO() {
    const now = new Date();
    return isoOf(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

// วันที่ "dom" ของเดือนที่ใกล้ที่สุด (วันนี้นับด้วย)
function nextDayOfMonth(base, dom) {
    const p = parseISO(base);
    if (!p) return '';

    let { y, m } = p;

    for (let i = 0; i < 14; i++) {
        if (dom <= daysInMonth(y, m) && (i > 0 || dom >= p.d)) return isoOf(y, m, dom);

        m += 1;
        if (m > 12) { m = 1; y += 1; }
    }

    return '';
}

// วันที่ month/day ของปีที่ใกล้ที่สุด (วันนี้นับด้วย)
function nextAnnual(base, month, day) {
    const p = parseISO(base);
    if (!p) return '';

    for (let y = p.y; y < p.y + 9; y++) {
        if (!validYmd(y, month, day)) continue;

        const iso = isoOf(y, month, day);
        if (iso >= base) return iso;
    }

    return '';
}

/*
 * วันในสัปดาห์:
 *   "หน้า"      = วันนั้นที่จะมาถึง นับจากพรุ่งนี้เป็นต้นไป (ไม่นับวันนี้)
 *   "ที่แล้ว"    = วันนั้นที่ผ่านมาล่าสุด ก่อนวันนี้
 *   "นี้"/ไม่ระบุ = วันนั้นที่จะมาถึง นับวันนี้ด้วย
 */
function resolveWeekday(base, weekday, modifier) {
    const cur = weekdayOf(base);

    if (modifier === 'ที่แล้ว' || modifier === 'ที่ผ่านมา') {
        let back = (cur - weekday + 7) % 7;
        if (back === 0) back = 7;
        return addDays(base, -back);
    }

    let ahead = (weekday - cur + 7) % 7;
    if (modifier === 'หน้า' && ahead === 0) ahead = 7;

    return addDays(base, ahead);
}

/* ---------- แสดงผล ---------- */

function fmtDate(iso, withWeekday = true) {
    const p = parseISO(iso);
    if (!p) return iso || '';

    const text = `${p.d} ${TH_MONTHS_SHORT[p.m]} ${p.y}`;

    return withWeekday ? `${TH_DAYS_SHORT[weekdayOf(iso)]} ${text}` : text;
}

/* ---------- ตัวจับเวลา ---------- */

const RE_T_COLON = /(\d{1,2}):(\d{2})(?!\d)/g;
const RE_T_DOT = /(\d{1,2})\.(\d{2})\s*(?:น\.|น(?![ก-๙])|นาฬิกา)/g;
const RE_T_AFTERNOON = new RegExp(`บ่าย\\s*(?:(${NUM_SRC})\\s*(?:โมง)?|โมง)`, 'g');
const RE_T_DAWN = new RegExp(`ตี\\s*(${NUM_SRC})`, 'g');
const RE_T_MONG = new RegExp(`(${NUM_SRC})\\s*โมง\\s*(เช้า|เย็น)?`, 'g');
const RE_T_TUM = new RegExp(`(${NUM_SRC})\\s*ทุ่ม`, 'g');
const RE_T_TUM_BARE = /ทุ่ม(?:ตรง|นึง|หนึ่ง|ครึ่ง)?(?![ก-๙])/g;
const RE_T_NOON = /เที่ยงคืน|เที่ยงวัน|เที่ยง/g;

function hourFromMong(n, part) {
    if (part === 'เย็น') return n >= 4 && n <= 7 ? n + 12 : -1;
    if (part === 'เช้า') return n >= 6 && n <= 11 ? n : -1;
    if (n >= 6 && n <= 12) return n;
    if (n >= 1 && n <= 5) return n + 12;
    return -1;
}

function findTimes(text) {
    const out = [];
    const used = [];

    const free = (a, b) => !used.some(([s, e]) => a < e && b > s);

    const put = (a, b, h, mi) => {
        if (h < 0 || h > 23 || mi < 0 || mi > 59 || !free(a, b)) return;

        used.push([a, b]);
        out.push({ index: a, end: b, time: `${p2(h)}:${p2(mi)}` });
    };

    // "ครึ่ง" ต่อท้าย (บ่ายสองครึ่ง = 14:30)
    const half = b => {
        const m = text.slice(b).match(/^\s*ครึ่ง/);
        return m ? { add: 30, len: m[0].length } : { add: 0, len: 0 };
    };

    const scan = (re, fn) => {
        re.lastIndex = 0;
        let m;

        while ((m = re.exec(text))) {
            if (m[0] === '') { re.lastIndex++; continue; }
            fn(m, m.index, m.index + m[0].length);
        }
    };

    scan(RE_T_COLON, (m, a, b) => put(a, b, Number(m[1]), Number(m[2])));
    scan(RE_T_DOT, (m, a, b) => put(a, b, Number(m[1]), Number(m[2])));

    scan(RE_T_AFTERNOON, (m, a, b) => {
        const n = m[1] ? numOf(m[1]) : 1;
        if (n < 1 || n > 6) return;
        const h = half(b);
        put(a, b + h.len, 12 + n, h.add);
    });

    scan(RE_T_DAWN, (m, a, b) => {
        const n = numOf(m[1]);
        if (n < 1 || n > 5) return;
        const h = half(b);
        put(a, b + h.len, n, h.add);
    });

    scan(RE_T_MONG, (m, a, b) => {
        const hour = hourFromMong(numOf(m[1]), m[2]);
        if (hour < 0) return;
        const h = half(b);
        put(a, b + h.len, hour, h.add);
    });

    scan(RE_T_TUM, (m, a, b) => {
        const n = numOf(m[1]);
        if (n < 1 || n > 5) return;
        const h = half(b);
        put(a, b + h.len, 18 + n, h.add);
    });

    scan(RE_T_TUM_BARE, (m, a, b) => put(a, b, 19, m[0].includes('ครึ่ง') ? 30 : 0));

    scan(RE_T_NOON, (m, a, b) => {
        if (m[0] === 'เที่ยงคืน') put(a, b, 0, 0);
        else {
            const h = half(b);
            put(a, b + h.len, 12, h.add);
        }
    });

    return out.sort((x, y) => x.index - y.index);
}

/* ---------- ตัวจับวันที่ ---------- */

const RE_ISO = /(\d{4})-(\d{1,2})-(\d{1,2})(?!\d)/g;
const RE_DMY = new RegExp(`(?:วันที่\\s*)?(\\d{1,2})\\s*(?:เดือน\\s*)?(${MONTH_SRC})\\.?(?![a-z])`, 'gi');
const RE_NUM_DATE = /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?![\d/])/g;
const RE_FESTIVAL = new RegExp(
    CAL_FESTIVALS.flatMap(f => f.names).sort((a, b) => b.length - a.length).map(escRe).join('|'),
    'g'
);
const RE_DAY_OF_MONTH = /วันที่\s*(\d{1,2})(?!\d)/g;
const RE_IN_N = /อีก\s*(\d{1,3})\s*(วัน|สัปดาห์|อาทิตย์|เดือน|ปี)/g;
const RE_AGO_N = /(\d{1,3})\s*(วัน|สัปดาห์|อาทิตย์|เดือน|ปี)\s*(?:ก่อน|ที่แล้ว|ที่ผ่านมา)/g;
const RE_WEEKDAY = /วัน(พฤหัสบดี|พฤหัส|อาทิตย์|จันทร์|อังคาร|พุธ|ศุกร์|เสาร์)\s*(นี้|หน้า|ที่แล้ว|ที่ผ่านมา)?/g;
const RE_WEEK_MONTH = /(สัปดาห์|อาทิตย์|เดือน)\s*(หน้า|ที่แล้ว|ที่ผ่านมา)/g;
const RE_DAYWORD = /เมื่อวานซืน|เมื่อวานนี้|เมื่อวาน|มะรืนนี้|มะรืน|พรุ่งนี้|วันนี้|คืนนี้|เช้านี้|บ่ายนี้|เย็นนี้|ค่ำนี้/g;

const DAYWORD_OFFSET = {
    'เมื่อวานซืน': -2, 'เมื่อวานนี้': -1, 'เมื่อวาน': -1,
    'มะรืนนี้': 2, 'มะรืน': 2, 'พรุ่งนี้': 1
};

const QUANTITY_AFTER = /^\s*(?:บาท|คน|ปี|เมตร|ชิ้น|ตัว|อัน|ครั้ง|ชั่วโมง|นาที|เหรียญ|ดอลลาร์|ทอง)/;

// ปีหลังวันที่ เช่น "15 มกราคม 2569" (พ.ศ. แปลงเป็น ค.ศ. ให้) คืน { year, len } หรือ null
function readYear(rest, baseP) {
    const m = rest.match(/^\s*(พ\.ศ\.|ค\.ศ\.)?\s*(\d{4})(?!\d)/);
    if (!m) return null;
    if (QUANTITY_AFTER.test(rest.slice(m[0].length))) return null;

    let year = Number(m[2]);
    const storyIsBE = baseP && baseP.y >= 2400;
    const buddhist = m[1] === 'พ.ศ.' || (!m[1] && year >= 2400 && year <= 2700 && !storyIsBE);

    if (buddhist) year -= 543;
    if (year < 1 || year > 9999) return null;

    return { year, len: m[0].length };
}

function addUnits(base, n, unit) {
    if (unit === 'วัน') return addDays(base, n);
    if (unit === 'สัปดาห์' || unit === 'อาทิตย์') return addDays(base, n * 7);
    if (unit === 'เดือน') return addMonths(base, n);
    return addMonths(base, n * 12);
}

/*
 * หาวันที่ทั้งหมดในย่อหน้าเดียว
 * base = "วันนี้ในเรื่อง" (ISO) ว่างได้ ถ้าว่างจะจับเฉพาะวันที่ที่ไม่ต้องอิงวันนี้ (ระบุเดือน/ปี/เทศกาล)
 * weak = กำกวม (เช่น "พรุ่งนี้" เฉย ๆ) ต้องมีคำบริบทหรือเวลาอยู่ใกล้ ๆ ถึงจะนับ
 */
function findDateHits(text, base) {
    const hits = [];
    const used = [];
    const baseP = base ? parseISO(base) : null;
    const anchor = baseP ? base : realTodayISO();

    const free = (a, b) => !used.some(([s, e]) => a < e && b > s);

    const take = (re, fn) => {
        re.lastIndex = 0;
        let m;

        while ((m = re.exec(text))) {
            if (m[0] === '') { re.lastIndex++; continue; }

            const a = m.index;
            let b = a + m[0].length;

            if (!free(a, b)) continue;

            const r = fn(m, a, b);

            // วันที่ที่ผิดรูป (เช่น 31 ก.พ.) กินช่วงข้อความทิ้ง ไม่ให้ตัวอื่นหยิบตัวเลขเดิมไปตีความซ้ำเป็นวันอื่น
            if (r && r.skip) {
                used.push([a, b]);
                continue;
            }

            if (!r || !r.date) continue;

            if (r.end > b) b = r.end;

            used.push([a, b]);
            hits.push({ index: a, end: b, matched: text.slice(a, b), date: r.date, weak: Boolean(r.weak), approx: Boolean(r.approx), festival: Boolean(r.festival) });
        }
    };

    take(RE_ISO, m => {
        const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
        return validYmd(y, mo, d) ? { date: isoOf(y, mo, d) } : { skip: true };
    });

    take(RE_DMY, (m, a, b) => {
        const day = Number(m[1]);
        const month = monthOf(m[2]);

        if (!month) return null;
        if (day < 1 || day > 31) return { skip: true };

        const tail = readYear(text.slice(b), baseP);

        if (tail) {
            return validYmd(tail.year, month, day)
                ? { date: isoOf(tail.year, month, day), end: b + tail.len }
                : { skip: true, end: b + tail.len };
        }

        const date = nextAnnual(anchor, month, day);
        return date ? { date } : { skip: true };
    });

    take(RE_NUM_DATE, (m, a, b) => {
        const prev = text[a - 1];
        if (prev && /[\d/.\-]/.test(prev)) return null;

        const day = Number(m[1]), month = Number(m[2]);
        if (month < 1 || month > 12 || day < 1 || day > 31) return null;

        if (m[3]) {
            if (m[3].length === 3) return null;

            let year = Number(m[3]);

            if (m[3].length === 2) year += 2000;
            else if (year >= 2400 && year <= 2700 && !(baseP && baseP.y >= 2400)) year -= 543;

            return validYmd(year, month, day) ? { date: isoOf(year, month, day) } : null;
        }

        // 1/2 อาจเป็นเศษส่วน จึงถือว่ากำกวม
        const date = nextAnnual(anchor, month, day);
        return date ? { date, weak: true } : null;
    });

    take(RE_FESTIVAL, m => {
        const fest = CAL_FESTIVALS.find(f => f.names.includes(m[0]));
        if (!fest) return null;

        const date = nextAnnual(anchor, fest.m, fest.d);
        return date ? { date, approx: fest.approx, festival: true } : null;
    });

    // ที่เหลือต้องอิงวันนี้ในเรื่อง
    if (baseP) {
        take(RE_DAY_OF_MONTH, m => {
            const dom = Number(m[1]);
            if (dom < 1 || dom > 31) return null;

            const date = nextDayOfMonth(base, dom);
            return date ? { date } : null;
        });

        take(RE_IN_N, m => {
            const date = addUnits(base, Number(m[1]), m[2]);
            return date ? { date } : null;
        });

        take(RE_AGO_N, m => {
            const date = addUnits(base, -Number(m[1]), m[2]);
            return date ? { date } : null;
        });

        take(RE_WEEKDAY, m => {
            const date = resolveWeekday(base, TH_WEEKDAYS[m[1]], m[2]);
            return date ? { date, weak: !m[2] } : null;
        });

        take(RE_WEEK_MONTH, m => {
            const sign = m[2] === 'หน้า' ? 1 : -1;
            const date = m[1] === 'เดือน' ? addMonths(base, sign) : addDays(base, sign * 7);
            return date ? { date } : null;
        });

        take(RE_DAYWORD, m => {
            const date = addDays(base, DAYWORD_OFFSET[m[0]] || 0);
            return date ? { date, weak: true } : null;
        });
    }

    return hits.sort((x, y) => x.index - y.index);
}

function hasCalKeyword(text) {
    return CAL_KEYWORDS.some(word => text.includes(word));
}

function windowOf(text, a, b) {
    return text.slice(Math.max(0, a - 30), Math.min(text.length, b + 45));
}

// ข้อความรอบ ๆ วันที่ (ดิบ) เก็บไว้ให้แตะดูของเต็มได้
function makeContext(text, a, b) {
    const start = Math.max(0, a - 24);
    const end = Math.min(text.length, b + 40);

    let ctx = text.slice(start, end).replace(/\s+/g, ' ').trim();

    if (start > 0) ctx = `…${ctx}`;
    if (end < text.length) ctx = `${ctx}…`;

    return ctx;
}

const TITLE_MAX = 36;
const TITLE_EDGE = /^[\s,.:;"'“”‘’()[\]*_~\-…]+|[\s,.:;"'“”‘’()[\]*_~\-…]+$/g;
const TITLE_FILLER = /^(?:ต่อให้|ถึงแม้|เพราะ|แต่|และ|แล้ว|ก็|ที่|จะ|ว่า|ซึ่ง|โดย|ใน|ณ)\s*/;
const TITLE_BREAK = /[\n\r"“”‘’()[\]{}<>!?;…,]|\.(?:\s|$|\.)/;

function tidyTitle(text) {
    let t = text.replace(/\s+/g, ' ').replace(TITLE_EDGE, '');

    for (let i = 0; i < 3; i++) {
        const next = t.replace(TITLE_FILLER, '');
        if (next === t) break;
        t = next;
    }

    return t.replace(TITLE_EDGE, '');
}

function shortenTitle(t) {
    if (t.length <= TITLE_MAX) return t;

    // ตัดตามขอบคำ: ใช้ตัวแบ่งคำภาษาไทยของเบราว์เซอร์ (Intl.Segmenter) ถ้าไม่มีก็ตัดตรงช่องว่าง
    try {
        if (typeof Intl !== 'undefined' && Intl.Segmenter) {
            let out = '';

            for (const { segment } of new Intl.Segmenter('th', { granularity: 'word' }).segment(t)) {
                if ((out + segment).length > TITLE_MAX) break;
                out += segment;
            }

            out = out.replace(TITLE_EDGE, '');
            if (out.length >= 8) return `${out}…`;
        }
    } catch { /* ใช้วิธีสำรองด้านล่าง */ }

    const cut = t.lastIndexOf(' ', TITLE_MAX);

    return `${cut >= 12 ? t.slice(0, cut) : t.slice(0, TITLE_MAX)}…`;
}

// ประโยคสมมติ/ปฏิเสธ/ยกเลิก: "ต่อให้พรุ่งนี้จะมีประชุม…" "ถ้าพรุ่งนี้ว่าง" "ยกเลิกนัดแล้ว" ไม่ใช่นัดจริง
const CAL_DOUBT = /ต่อให้|ถึงแม้|แม้ว่า|แม้จะ|ถ้า|หาก|สมมติ|ยกเลิก|ไม่มี(?:นัด|ประชุม|งาน|เรียน)|ไม่ได้(?:นัด|ไป)|ไม่เคย|ไม่ต้อง/;

// คำที่บอกว่าประโยคเปลี่ยนเรื่อง/เปลี่ยนประธาน ชื่อรายการหยุดก่อนคำเหล่านี้
const TITLE_CONNECTORS = new Set(['เขา', 'เธอ', 'ผม', 'ฉัน', 'เรา', 'มัน', 'แต่', 'เพราะ', 'ดังนั้น', 'จึง', 'ก็', 'แล้ว', 'ซึ่ง', 'จน']);
// ...ยกเว้นเมื่อเป็นผู้ร่วมนัด เช่น "นัดกับเรา" "ให้ผม"
const TITLE_OBJECT_PREFIX = new Set(['กับ', 'ให้', 'แก่', 'ถึง', 'หา', 'พา', 'ตาม']);

function hasDoubt(text, a, b) {
    const breaker = new RegExp(TITLE_BREAK.source, 'g');
    const left = text.slice(Math.max(0, a - 40), a);
    const right = text.slice(b, b + 40);

    let leftCut = 0;
    for (const m of left.matchAll(breaker)) leftCut = m.index + m[0].length;

    const rightBrk = right.search(TITLE_BREAK);

    return CAL_DOUBT.test(left.slice(leftCut) + (rightBrk >= 0 ? right.slice(0, rightBrk) : right));
}

function cutAtConnector(t) {
    try {
        if (typeof Intl === 'undefined' || !Intl.Segmenter) return t;

        let out = '';
        let prev = '';

        for (const { segment } of new Intl.Segmenter('th', { granularity: 'word' }).segment(t)) {
            const word = segment.trim();

            if (word && out.replace(/\s/g, '').length >= 4 && TITLE_CONNECTORS.has(word) && !TITLE_OBJECT_PREFIX.has(prev)) break;

            out += segment;
            if (word) prev = word;
        }

        return out;
    } catch {
        return t;
    }
}

// ตัวแบ่งคำภาษาไทยของเบราว์เซอร์ (ไม่มีก็คืน null แล้วใช้วิธีสำรอง)
let thSegmenter;

function thWords(text) {
    try {
        if (thSegmenter === undefined) {
            thSegmenter = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('th', { granularity: 'word' }) : null;
        }

        return thSegmenter ? [...thSegmenter.segment(text)].map(item => item.segment) : null;
    } catch {
        return null;
    }
}

// ตัดให้ไม่เกิน max ตัวอักษร ตามขอบคำ
function clipWords(text, max) {
    if (text.length <= max) return text;

    const words = thWords(text);

    if (!words) return `${text.slice(0, max)}…`;

    let out = '';

    for (const word of words) {
        if ((out + word).length > max) break;
        out += word;
    }

    return `${(out || text.slice(0, max)).replace(TITLE_EDGE, '')}…`;
}

// หาคำบริบท (ประชุม/นัด/งาน…) ที่ใกล้วันที่ที่สุด คำที่ซ้อนกันยึดตัวที่เริ่มก่อน/ยาวกว่า (ส่งงาน ไม่ใช่ งาน)
function findKeyword(text, a, b) {
    const lo = Math.max(0, a - 30);
    const around = text.slice(lo, Math.min(text.length, b + 45));
    const found = [];

    for (const word of CAL_KEYWORDS) {
        let at = around.indexOf(word);

        while (at >= 0) {
            found.push({ word, start: lo + at, end: lo + at + word.length });
            at = around.indexOf(word, at + 1);
        }
    }

    if (!found.length) return null;

    found.sort((x, y) => Math.abs(x.start - a) - Math.abs(y.start - a) || (y.end - y.start) - (x.end - x.start));

    let best = found[0];

    for (const item of found) {
        if (item.start < best.start && item.end > best.start) best = item;
    }

    return best;
}

/* ---------- แยก "กับใคร" / "ที่ไหน" / "อะไร" ---------- */

const CAL_PLACES = [
    'มหาวิทยาลัย', 'โรงพยาบาล', 'กองบัญชาการ', 'ห้องประชุม', 'ห้องทดลอง', 'สถานีตำรวจ', 'โรงเรียน', 'โรงแรม',
    'โรงละคร', 'โรงงาน', 'สนามบิน', 'ร้านกาแฟ', 'ภัตตาคาร', 'สำนักงาน', 'หอประชุม', 'ปราสาท', 'ออฟฟิศ',
    'ท่าเรือ', 'สถานี', 'โบสถ์', 'คาเฟ่', 'ตลาด', 'ห้อง', 'ร้าน', 'บ้าน', 'วัง', 'วัด', 'สนาม', 'สวน', 'ห้าง', 'ฐาน', 'ค่าย', 'ศาล'
];

const RE_PLACE = new RegExp(`(?:ที่|ณ|ใน|ยัง)\\s*(${CAL_PLACES.map(escRe).join('|')})(\\s*\\d{1,4})?`);
const PLACE_TAIL_STOP = new Set(['ตอน', 'เวลา', 'วัน', 'แล้ว', 'นะ', 'ครับ', 'ค่ะ', 'ด้วย', 'เพื่อ', 'และ', 'กับ', 'ก็', 'จะ', 'ที่', 'ใน', 'ของ', 'เมื่อ', 'ซึ่ง', 'แต่', 'เขา', 'เธอ', 'ฉัน', 'ผม', 'เรา']);
const WHO_STOP = new Set(['กัน', 'ที่', 'ใคร', 'อะไร', 'ใน', 'แล้ว', 'นะ', 'ด้วย', 'ว่า', 'การ', 'ความ', 'เรื่อง', 'สิ่ง', 'ฝ่าย', 'ตัวเอง']);
const WHO_TITLES = new Set(['ท่าน', 'คุณ', 'พี่', 'น้อง', 'ลุง', 'ป้า', 'น้า', 'ครู', 'อาจารย์', 'หมอ', 'นาย', 'นาง', 'เจ้า', 'พ่อ', 'แม่', 'หัวหน้า', 'ผู้', 'องค์']);
const WHO_SKIP_BEFORE = /(?:เกี่ยว|เหมือน|เท่า|เทียบ|ตรง|ขัด|สอดคล้อง)$/;
const OBJ_FILLER = /^(?:(?:อะไร|ใดๆ|ใด|บ้าง|หน่อย|นี้|นั้น|อยู่)\s*|(?:ซึ่ง|ว่า|ที่|จะ|ก็|แล้ว|นะ|ครับ|ค่ะ|คือ|เป็น|มี|ไว้)(?:\s+|$))/;
const OBJ_STOP = /^(?:เขา|เธอ|ฉัน|ผม|เรา|มัน|แต่|แล้ว|และ|ก็|ซึ่ง|เพราะ|จึง|ดังนั้น|ตอน|เวลา|นะ|ครับ|ค่ะ|ด้วย|ที่|กับ|จะ)/;

// "กับคีริน" (ชื่อที่ SillyTavern รู้แม่นสุด) หรือ "กับเพื่อน" (คำแรกหลัง กับ)
function findWho(zone, names) {
    const known = [...names].sort((x, y) => y.length - x.length);

    for (const name of known) {
        const m = zone.match(new RegExp(`(?:กับ|พบ|เจอ|หา)\\s*(${escRe(name)})`, 'i'));
        if (m) return { text: m[1], raw: m[0] };
    }

    const re = /กับ\s*([ก-๙A-Za-z][ก-๙A-Za-z0-9]*)/g;
    let m;

    while ((m = re.exec(zone))) {
        if (WHO_SKIP_BEFORE.test(zone.slice(Math.max(0, m.index - 6), m.index))) continue;

        const words = thWords(m[1]);
        let first = words ? words[0] : m[1].slice(0, 8);

        if (!first || first.length < 2 || WHO_STOP.has(first)) continue;

        // คำนำหน้าชื่อ (ท่าน/คุณ/พี่…) ติดกับคำถัดไปเป็นชื่อเดียว เช่น "ท่านผู้การ"
        if (words && WHO_TITLES.has(first)) {
            for (let i = 1; i < words.length && i <= 2; i++) {
                const next = words[i];

                if (!/^[ก-๙A-Za-z0-9]+$/.test(next) || PLACE_TAIL_STOP.has(next) || (first + next).length > 16) break;
                if (WHO_STOP.has(next) && words[i - 1] !== 'ผู้') break;

                first += next;
            }
        }

        return { text: first, raw: m[0].slice(0, m[0].length - m[1].length + first.length) };
    }

    return null;
}

// "ที่ห้อง 304" / "ที่โรงพยาบาลกลางเมือง": คำสถานที่ + เลขห้อง หรืออีกไม่เกิน 2 คำที่ติดกัน
function findWhere(zone) {
    const m = RE_PLACE.exec(zone);
    if (!m) return null;

    let text = m[1];
    let end = m.index + m[0].length;

    if (m[2]) {
        text += m[2].replace(/\s+/g, ' ');
    } else {
        let taken = 0;
        let tail = '';

        for (const word of thWords(zone.slice(end)) || []) {
            if (!/^[ก-๙A-Za-z0-9]+$/.test(word) || PLACE_TAIL_STOP.has(word) || taken >= 2 || (tail + word).length > 12) break;

            tail += word;
            taken += 1;
        }

        text += tail;
        end += tail.length;
    }

    return { text, raw: zone.slice(m.index, end) };
}

function tidyObject(rest) {
    let t = rest.replace(/\s+/g, ' ').trim();

    for (let i = 0; i < 4; i++) {
        const next = t.replace(OBJ_FILLER, '');
        if (next === t) break;
        t = next;
    }

    const chunks = t.split(' ').filter(Boolean);

    if (!chunks.length || OBJ_STOP.test(chunks[0])) return '';

    let out = chunks[0];

    if (out.length <= 6 && chunks[1] && !OBJ_STOP.test(chunks[1])) out += ` ${chunks[1]}`;

    return clipWords(out.replace(TITLE_EDGE, ''), 18);
}

/*
 * สรุปแบบ "อะไร · กับใคร · ที่ไหน" เช่น "ประชุมของกองทัพ · กับคีริน · ที่ห้อง 304"
 * คืน '' ถ้าสรุปไม่ได้ (ไม่มีคำบริบท หรือไม่มีอะไรเพิ่มจากตัวคำ) ให้ผู้เรียกใช้ชื่อสำรองแทน
 */
function summarizeEvent(text, a, b, names, festival) {
    const matched = text.slice(a, b);
    const kw = festival ? null : findKeyword(text, a, b);

    if (!kw && !festival) return '';

    const from = kw ? kw.start : a;
    const lo = Math.max(0, from - 20);
    const zone = text.slice(lo, Math.min(text.length, (kw ? kw.end : b) + 70)).replace(matched, ' ');
    const who = findWho(zone, names);
    const where = findWhere(zone);

    let what = matched;

    if (kw) {
        let rest = text.slice(kw.end, kw.end + 70).replace(matched, ' ');

        for (const part of [who?.raw, where?.raw]) {
            if (part) rest = rest.replace(part, ' ');
        }

        const brk = rest.search(TITLE_BREAK);
        const object = tidyObject(brk >= 0 ? rest.slice(0, brk) : rest);

        what = kw.word + (/^[A-Za-z0-9]/.test(object) ? ' ' : '') + object;
    }

    const parts = [what];

    if (who) parts.push(`กับ${who.text}`);
    if (where) parts.push(`ที่${where.text}`);

    if (kw && parts.length === 1 && what === kw.word) return '';

    return parts.join(' · ');
}

/*
 * ชื่อรายการแบบสรุปสั้น ๆ (ไม่เรียก AI):
 *   - ถ้ามีคำบริบท (ประชุม/นัด/งาน…) ใกล้วันที่ เริ่มอ่านจากคำนั้น ไม่งั้นเริ่มหลังวันที่
 *   - ตัดตัววันที่ออก (ซ้ำกับป้ายวันที่) ตัดคำเชื่อมนำหน้า หยุดที่เครื่องหมาย/เครื่องหมายคำพูด
 *   - ยาวเกินตัดตรงช่องว่าง ถ้าได้สั้นเกินไปใช้วลีก่อนหน้าวันที่แทน
 */
function makeTitle(text, a, b) {
    const matched = text.slice(a, b);
    const kw = findKeyword(text, a, b);
    const from = kw ? kw.start : b;

    // ลบตัววันที่ออกก่อนหาจุดตัด (ไม่งั้นจุดใน "ม.ค." จะถูกนับเป็นจบประโยค)
    const forward = text.slice(from).replace(matched, ' ');
    const brk = forward.search(TITLE_BREAK);
    let title = tidyTitle(cutAtConnector(brk >= 0 ? forward.slice(0, brk) : forward));

    if (title.length < 6) {
        const head = text.slice(Math.max(0, a - TITLE_MAX * 2), a);
        const cut = Math.max(...[...head.matchAll(new RegExp(TITLE_BREAK.source, 'g'))].map(m => m.index + m[0].length), 0);

        title = tidyTitle(head.slice(cut)).slice(-TITLE_MAX);
    }

    if (title.length < 3) title = tidyTitle(makeContext(text, a, b));

    return shortenTitle(title);
}

function nearestTime(times, a, b) {
    let best = null;
    let bestDist = 41;

    for (const t of times) {
        const dist = a > t.end ? a - t.end : (t.index > b ? t.index - b : 0);

        if (dist < bestDist) {
            best = t;
            bestDist = dist;
        }
    }

    return best;
}

/*
 * จับรายการนัดหมายจากข้อความเดียว
 * names = ชื่อตัวละคร/ผู้เล่นที่รู้อยู่แล้ว ใช้ช่วยจับ "กับใคร"
 * คืน [{ date, time, title, ctx, matched, approx, doubt }] (date เป็น ISO, time เป็น 'HH:MM' หรือ '')
 */
function detectDates(rawText, base, names = []) {
    const text = normalizeDigits(rawText);
    const out = [];
    const seen = new Set();

    const push = (c, key) => {
        if (seen.has(key)) return;
        seen.add(key);
        out.push(c);
    };

    for (const para of text.split(/\r?\n+/)) {
        if (!para.trim()) continue;

        const hits = findDateHits(para, base);
        const times = findTimes(para);
        const nearby = new Map();

        for (const h of hits) {
            const keyword = hasCalKeyword(windowOf(para, h.index, h.end));
            const t = nearestTime(times, h.index, h.end);

            if (h.weak && !keyword && !t) continue;

            // ประโยคสมมติ/ปฏิเสธ: คำกำกวมอย่าง "พรุ่งนี้" ทิ้งเลย ส่วนวันที่ชัดเจนเก็บไว้แต่ติดป้าย "ไม่แน่ใจ"
            const doubt = hasDoubt(para, h.index, h.end);

            if (doubt && h.weak) continue;

            const time = t ? t.time : '';

            // ประโยคเดียวกันที่บอกทั้ง "สงกรานต์" และ "13 เม.ย." = นัดเดียว
            const mergeKey = `${h.date}|${time}`;
            if (nearby.has(mergeKey) && h.index - nearby.get(mergeKey) < 60) continue;
            nearby.set(mergeKey, h.end);

            push({
                date: h.date,
                time,
                title: summarizeEvent(para, h.index, h.end, names, h.festival) || makeTitle(para, h.index, h.end),
                ctx: makeContext(para, h.index, h.end),
                matched: h.matched,
                approx: h.approx,
                doubt
            }, `${h.date}|${time}|${h.matched}`);
        }

        // มีแต่เวลา ("นัดกันบ่ายสอง") และมีคำบริบท → ถือเป็นวันนี้ในเรื่อง
        if (!hits.length && times.length && base) {
            const t = times[0];

            if (hasCalKeyword(windowOf(para, t.index, t.end))) {
                push({
                    date: base,
                    time: t.time,
                    title: summarizeEvent(para, t.index, t.end, names, false) || makeTitle(para, t.index, t.end),
                    ctx: makeContext(para, t.index, t.end),
                    matched: para.slice(t.index, t.end),
                    approx: false
                }, `${base}|${t.time}|${para.slice(t.index, t.end)}`);
            }
        }
    }

    return out;
}

/* ============================================================
 * วงล้อลูกแก้ว: เห็นทีละ 3 ลูก ปัดนิ้วตามแนวโค้งเพื่อหมุน
 * ลูกที่หลุดออกจะจางหายไปตามโค้ง ลูกใหม่เลื่อนเข้ามาแทน ลำดับวนกลับต้นได้ไม่จำกัด
 * เพิ่มลูกแก้วใหม่ได้ที่ CATEGORIES ด้านบน วงล้อปรับตัวเอง
 * ============================================================ */

const WHEEL_SLOTS = 3;   // เห็นกี่ลูกพร้อมกัน (ถ้ามีลูกมากกว่านี้ถึงจะหมุนได้)
const WHEEL_START = 1;   // ตอนเปิดครั้งแรก ให้ลูกลำดับที่เท่าไร (นับจาก 0) อยู่กลางโค้ง

let wheelPos = WHEEL_START;   // ตำแหน่งวงล้อ หน่วยเป็น "จำนวนลูก" (เป็นทศนิยมได้ขณะกำลังหมุน)
let wheelSx = 1;
let wheelSy = 1;
let wheelCx = 0;
let wheelCy = 0;
let wheelAnim = 0;
let wheelDrag = null;
let wheelMoved = false;
let wheelMovedTimer = 0;
let wheelScrollAt = 0;

function wheelSpins() {
    return CATEGORIES.length > WHEEL_SLOTS;
}

// ระยะของลูกที่ i จากกลางโค้ง (ลบ = สูงกว่า, บวก = ต่ำกว่า) วนรอบแบบวงล้อ
function wheelRel(i, n) {
    let rel = (i - wheelPos) % n;

    if (rel >= n / 2) rel -= n;
    if (rel < -n / 2) rel += n;

    return rel;
}

// วางลูกทุกลูกบนส่วนโค้งตาม wheelPos: ห่างกลางโค้งเกิน 1 ลูกจะค่อย ๆ จางและเล็กลง
function layoutWheel() {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;

    const items = panel.querySelectorAll('.ltt-item');
    const n = items.length;
    const spin = wheelSpins();

    items.forEach((item, i) => {
        const rel = spin ? wheelRel(i, n) : i - (n - 1) / 2;
        const opacity = spin ? Math.max(0, Math.min(1, 2 - Math.abs(rel))) : 1;
        const theta = (45 + ARC_STEP * rel) * Math.PI / 180;

        item.style.setProperty('--x', `${(wheelSx * ARC_RADIUS * Math.sin(theta)).toFixed(1)}px`);
        item.style.setProperty('--y', `${(-wheelSy * ARC_RADIUS * Math.cos(theta)).toFixed(1)}px`);
        item.style.setProperty('--o', opacity.toFixed(3));
        item.style.setProperty('--s', (0.55 + 0.45 * opacity).toFixed(3));
        item.style.setProperty('--d', `${Math.max(0, Math.round(rel) + 1) * 45}ms`);

        item.classList.toggle('ltt-off', opacity < 0.4);
    });
}

// แผ่นรับนิ้วรูปแถบโค้ง (ครอบเฉพาะแนวส่วนโค้ง ไม่บังลูกแก้วหลัก) ใช้ clip-path ตัดรูป
// จึงกันหน้าจอเลื่อนตามนิ้วได้โดยไม่บังการแตะส่วนอื่น
function layoutCatcher(panel) {
    const catcher = panel.querySelector('.ltt-catch');
    if (!catcher) return;

    const outer = ARC_RADIUS + 28;
    const inner = Math.max(26, ARC_RADIUS - 26);
    const from = -22;
    const to = 112;
    const stepDeg = 8;

    const point = (r, deg) => {
        const t = deg * Math.PI / 180;
        return `${(outer + wheelSx * r * Math.sin(t)).toFixed(1)}px ${(outer - wheelSy * r * Math.cos(t)).toFixed(1)}px`;
    };

    const points = [];

    for (let a = from; a <= to; a += stepDeg) points.push(point(outer, a));
    for (let a = to; a >= from; a -= stepDeg) points.push(point(inner, a));

    catcher.style.width = `${outer * 2}px`;
    catcher.style.height = `${outer * 2}px`;
    catcher.style.clipPath = `polygon(${points.join(',')})`;
}

function cancelWheelAnim() {
    if (!wheelAnim) return;

    cancelAnimationFrame(wheelAnim);
    wheelAnim = 0;
}

// หยุดทุกอย่างแล้วเกลี่ยวงล้อให้ตรงช่อง (ใช้ตอนปิดแผง)
function settleWheel() {
    cancelWheelAnim();
    wheelDrag = null;

    const n = CATEGORIES.length;

    if (n > 0) wheelPos = ((Math.round(wheelPos) % n) + n) % n;

    document.getElementById(PANEL_ID)?.classList.remove('ltt-rolling');
    layoutWheel();
}

// เลื่อนวงล้อไปที่ตำแหน่ง target (จำนวนเต็ม) ด้วยแอนิเมชันชะลอตอนท้าย
function snapWheel(target) {
    cancelWheelAnim();

    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;

    const n = CATEGORIES.length;
    const from = wheelPos;
    const start = performance.now();
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const duration = reduce ? 0 : 260;

    panel.classList.add('ltt-rolling');

    const finish = () => {
        wheelAnim = 0;
        wheelPos = ((Math.round(target) % n) + n) % n;
        layoutWheel();
        panel.classList.remove('ltt-rolling');
    };

    const step = now => {
        const t = duration ? Math.min(1, (now - start) / duration) : 1;
        const eased = 1 - Math.pow(1 - t, 3);

        wheelPos = from + (target - from) * eased;
        layoutWheel();

        if (t < 1) wheelAnim = requestAnimationFrame(step);
        else finish();
    };

    wheelAnim = requestAnimationFrame(step);
}

// มุมของนิ้วรอบลูกแก้ว (องศา วัดจากแนวตั้ง ใช้ระบบเดียวกับตอนวางลูก)
function wheelTheta(event) {
    const dx = event.clientX - wheelCx;
    const dy = event.clientY - wheelCy;

    return Math.atan2(dx * wheelSx, -dy * wheelSy) * 180 / Math.PI;
}

function onWheelPointerDown(event) {
    if (!panelOpen || !wheelSpins()) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const target = event.target;
    const onWheel = target?.closest?.(`#${PANEL_ID} .ltt-item`) || target?.closest?.(`#${PANEL_ID} .ltt-catch`);

    if (!onWheel) return;

    const wasAnimating = Boolean(wheelAnim);
    cancelWheelAnim();

    clearTimeout(wheelMovedTimer);
    wheelMoved = false;

    const theta = wheelTheta(event);

    wheelDrag = {
        id: event.pointerId,
        x0: event.clientX,
        y0: event.clientY,
        last: theta,
        acc: 0,
        pos0: wheelPos,
        wasAnimating,
        samples: [{ t: performance.now(), pos: wheelPos }]
    };
}

function onWheelPointerMove(event) {
    if (!wheelDrag || event.pointerId !== wheelDrag.id) return;

    if (!wheelMoved) {
        // ขยับน้อยกว่านี้ถือว่าเป็นการแตะ ไม่ใช่การปัด
        if (Math.hypot(event.clientX - wheelDrag.x0, event.clientY - wheelDrag.y0) < 6) return;

        wheelMoved = true;
        document.getElementById(PANEL_ID)?.classList.add('ltt-rolling');
    }

    const theta = wheelTheta(event);
    let delta = theta - wheelDrag.last;

    if (delta > 180) delta -= 360;
    else if (delta < -180) delta += 360;

    wheelDrag.acc += delta;
    wheelDrag.last = theta;

    // นิ้วเลื่อนไปตามโค้งกี่องศา ลูกก็เลื่อนตามนิ้วเท่านั้น
    wheelPos = wheelDrag.pos0 - wheelDrag.acc / ARC_STEP;

    const now = performance.now();

    wheelDrag.samples.push({ t: now, pos: wheelPos });
    if (wheelDrag.samples.length > 8) wheelDrag.samples.shift();

    layoutWheel();
}

function onWheelPointerUp(event) {
    if (!wheelDrag || event.pointerId !== wheelDrag.id) return;

    const drag = wheelDrag;
    wheelDrag = null;

    if (!wheelMoved) {
        // ปัดค้างระหว่างช่องแล้วนิ้วแตะหยุด → เข้าช่องที่ใกล้สุด
        if (drag.wasAnimating) snapWheel(Math.round(wheelPos));
        // แตะแถบโค้งตรงที่ว่าง = ปิดแผง (เหมือนแตะข้างนอก)
        else if (event.target?.closest?.(`#${PANEL_ID} .ltt-catch`) && !itemAtPoint(event)) closePanel();

        return;
    }

    // ปัดเสร็จ: กันไม่ให้คลิกที่ตามมาถูกนับเป็นการแตะข้างนอกหรือแตะลูกแก้ว
    lastActivate = Date.now();
    wheelMovedTimer = setTimeout(() => { wheelMoved = false; }, 400);

    // ความเร็วช่วงท้าย → ปัดแรงไปต่ออีกหน่อย
    const now = performance.now();
    const recent = drag.samples.filter(sample => now - sample.t < 120);
    let velocity = 0;

    if (recent.length >= 2) {
        const first = recent[0];
        const last = recent[recent.length - 1];

        if (last.t > first.t) velocity = (last.pos - first.pos) / (last.t - first.t);
    }

    const base = Math.round(wheelPos);
    const target = Math.round(wheelPos + velocity * 160);

    snapWheel(Math.max(base - 3, Math.min(base + 3, target)));
}

// เมาส์: หมุนลูกกลิ้งทีละลูก
function onWheelScroll(event) {
    if (!panelOpen || !wheelSpins()) return;
    if (!event.target?.closest?.(`#${PANEL_ID}`)) return;

    event.preventDefault();

    const now = Date.now();
    if (now - wheelScrollAt < 140) return;
    wheelScrollAt = now;

    snapWheel(Math.round(wheelPos) + (event.deltaY > 0 ? 1 : -1));
}

/* ============================================================
 * Dice / Random: ทอยลูกเต๋า เหรียญ ใช่/ไม่ และตารางสุ่มของตัวเอง
 * สุ่มด้วยเบราว์เซอร์ล้วน ๆ ไม่เรียก AI จึงไม่กินโควต้า
 * ผลลัพธ์เลือกได้ว่าจะใส่ลงกล่องข้อความ (บอทเห็น) หรือดูเฉพาะตัวเอง
 * ============================================================ */

const DICE_PRESETS = ['d20', 'd6', 'd100'];
const DICE_HISTORY_MAX = 30;
const DICE_SHARE_KEY = `${EXT_ID}-dice-share`;
const DICE_TABLES_KEY = `${EXT_ID}-dice-tables`;

// ตารางตั้งต้น (แก้/ลบได้ในหน้าต่าง Dice) ตารางของตัวเองเก็บในเบราว์เซอร์ ใช้ได้ทุกแชท
const DICE_SEED_TABLES = [
    {
        id: 'seed-events',
        name: 'เหตุการณ์',
        items: [
            'พบร่องรอยแปลก ๆ บนพื้น',
            'มีเสียงฝีเท้าตามมาจากด้านหลัง',
            'สภาพอากาศเปลี่ยนกะทันหัน',
            'เจอพ่อค้าเร่ที่มีของแปลกตา',
            'ทางข้างหน้าถูกปิดกั้น',
            'ได้ยินเสียงกระซิบจากที่ไกล ๆ',
            'พบของที่ใครบางคนทำตกไว้',
            'สัตว์ป่าโผล่ออกมากลางทาง'
        ]
    },
    {
        id: 'seed-hints',
        name: 'คำใบ้',
        items: [
            'ประตูบานที่ไม่เคยถูกเปิด',
            'จดหมายที่ยังไม่ได้ส่ง',
            'กุญแจดอกเก่า',
            'เสียงระฆังจากที่ไกล ๆ',
            'รอยเปื้อนบนบันได',
            'แผนที่ที่ขาดไปครึ่งแผ่น'
        ]
    }
];

let diceOpen = false;
let diceShare = loadDiceShare();      // true = ใส่ผลลงกล่องข้อความ (บอทเห็น) / false = ดูเฉพาะตัวเอง
let diceTables = loadDiceTables();
let diceHistory = [];                 // ใหม่สุดอยู่บนสุด (เก็บเฉพาะรอบนี้ ไม่บันทึก)
let diceSeq = 0;
let diceEditing = null;               // null = หน้าทอย / 'new' หรือ id ตาราง = หน้าแก้ตาราง
let diceFormula = '2d6+3';
let diceDeleteArm = 0;

function loadDiceShare() {
    try {
        return localStorage.getItem(DICE_SHARE_KEY) === '1';
    } catch {
        return false;
    }
}

function saveDiceShare() {
    try { localStorage.setItem(DICE_SHARE_KEY, diceShare ? '1' : '0'); } catch { /* ข้าม */ }
}

function loadDiceTables() {
    const seeds = () => DICE_SEED_TABLES.map(table => ({ ...table, items: [...table.items] }));

    try {
        const raw = localStorage.getItem(DICE_TABLES_KEY);

        if (raw === null) return seeds();

        const list = JSON.parse(raw);

        if (!Array.isArray(list)) return seeds();

        return list
            .filter(table => table && typeof table.name === 'string' && Array.isArray(table.items))
            .map(table => ({
                id: String(table.id || makeId()),
                name: table.name,
                items: table.items.map(String)
            }));
    } catch {
        return seeds();
    }
}

function saveDiceTables() {
    try {
        localStorage.setItem(DICE_TABLES_KEY, JSON.stringify(diceTables));
    } catch {
        showToast('✖ บันทึกตารางสุ่มไม่สำเร็จ');
    }
}

function makeId() {
    return `${Date.now().toString(36)}${secureInt(46656).toString(36)}`;
}

// ใส่ผลลัพธ์ลงกล่องข้อความที่เคอร์เซอร์ (เว้นวรรคนำให้ถ้าติดกับตัวอักษรก่อนหน้า)
function insertRollText(text) {
    const box = getBox();

    if (!box || typeof box.value !== 'string') {
        showToast('✖ หากล่องข้อความไม่เจอ');
        return false;
    }

    const at = box.selectionStart ?? box.value.length;
    const before = box.value.slice(0, at);
    const lead = before && !/\s$/.test(before) ? ' ' : '';

    insertText(lead + text);

    return true;
}

function logRoll(text) {
    const entry = { id: ++diceSeq, text, shared: false };

    if (diceShare && insertRollText(text)) entry.shared = true;

    diceHistory.unshift(entry);
    if (diceHistory.length > DICE_HISTORY_MAX) diceHistory.length = DICE_HISTORY_MAX;

    renderDiceList();
}

function rollFormulaUi(expression) {
    const result = rollFormula(expression);

    if (result.error) {
        showToast(`✖ ${result.error}`, 3500);
        return;
    }

    logRoll(result.text);
}

function rollTableUi(id) {
    const text = tableRollText(diceTables.find(table => table.id === id));

    if (!text) {
        showToast('✖ ตารางนี้ยังว่างอยู่', 3000);
        return;
    }

    logRoll(text);
}

function renderDiceList() {
    const win = document.getElementById(DICE_ID);
    if (!win) return;

    const list = win.querySelector('.ltt-list');
    const meta = win.querySelector('.ltt-meta');

    list.textContent = '';
    meta.textContent = diceHistory.length ? `ทอยแล้ว ${diceHistory.length} ครั้ง` : '';

    if (!diceHistory.length) {
        list.appendChild(makeEl('div', 'ltt-note', 'แตะปุ่มด้านบนเพื่อทอย'));
        positionWin(win);
        return;
    }

    diceHistory.forEach((entry, index) => {
        const card = makeEl('div', index === 0 ? 'ltt-card ltt-roll ltt-latest' : 'ltt-card ltt-roll');

        card.appendChild(makeEl('div', 'ltt-roll-text', entry.text));

        const row = makeEl('div', 'ltt-keys ltt-roll-act');

        row.appendChild(makeAction(entry.shared ? 'ใส่ในกล่องแล้ว' : 'ใส่ในกล่อง', button => {
            if (insertRollText(entry.text)) {
                entry.shared = true;
                button.textContent = 'ใส่ในกล่องแล้ว';
            }
        }));

        card.appendChild(row);
        list.appendChild(card);
    });

    positionWin(win);
}

function renderTableEditor(host) {
    const isNew = diceEditing === 'new';
    const table = isNew ? { id: '', name: '', items: [] } : diceTables.find(item => item.id === diceEditing);

    if (!table) {
        diceEditing = null;
        return;
    }

    const nameBox = makeEl('div', 'ltt-search-box');
    const name = makeEl('input', 'ltt-search-input');

    name.type = 'text';
    name.placeholder = 'ชื่อตาราง เช่น เหตุการณ์';
    name.maxLength = 24;
    name.value = table.name;
    nameBox.appendChild(name);

    const areaBox = makeEl('div', 'ltt-search-box');
    const area = makeEl('textarea', 'ltt-search-input ltt-area');

    area.placeholder = 'หนึ่งบรรทัด = หนึ่งผลลัพธ์';
    area.rows = 6;
    area.value = table.items.join('\n');
    areaBox.appendChild(area);

    const bar = makeEl('div', 'ltt-bar');

    bar.appendChild(makeTool('บันทึก', () => {
        const title = name.value.trim();
        const items = area.value.split('\n').map(line => line.trim()).filter(Boolean).slice(0, 500);

        if (!title) {
            showToast('✖ ตั้งชื่อตารางก่อน');
            return;
        }

        if (!items.length) {
            showToast('✖ ใส่ผลลัพธ์อย่างน้อย 1 บรรทัด');
            return;
        }

        if (isNew) {
            diceTables.push({ id: makeId(), name: title, items });
        } else {
            table.name = title;
            table.items = items;
        }

        saveDiceTables();
        diceEditing = null;
        renderDice();
    }, 'ltt-on'));

    bar.appendChild(makeTool('ยกเลิก', () => {
        diceEditing = null;
        renderDice();
    }));

    if (!isNew) {
        // แตะครั้งแรก = ขอยืนยัน แตะอีกครั้งภายใน 3 วินาที = ลบ
        bar.appendChild(makeTool('ลบ', button => {
            if (!diceDeleteArm || Date.now() - diceDeleteArm > 3000) {
                diceDeleteArm = Date.now();
                button.textContent = 'แตะอีกครั้งเพื่อลบ';
                button.classList.add('ltt-danger');
                return;
            }

            diceDeleteArm = 0;
            diceTables = diceTables.filter(item => item.id !== table.id);
            saveDiceTables();
            diceEditing = null;
            renderDice();
        }));
    }

    host.appendChild(nameBox);
    host.appendChild(areaBox);
    host.appendChild(bar);
}

function renderDice() {
    const win = document.getElementById(DICE_ID);
    if (!win) return;

    const ctl = win.querySelector('.ltt-dice-ctl');
    const list = win.querySelector('.ltt-list');

    ctl.textContent = '';
    diceDeleteArm = 0;

    if (diceEditing) {
        renderTableEditor(ctl);

        if (diceEditing) {
            list.hidden = true;
            win.querySelector('.ltt-meta').textContent = 'แก้ตารางสุ่ม';
            positionWin(win);
            return;
        }
    }

    list.hidden = false;

    // แถวบน: เลือกว่าผลลัพธ์ให้บอทเห็นหรือไม่
    const shareBar = makeEl('div', 'ltt-bar');

    const shareButton = makeTool(diceShare ? '👁 บอทเห็นผล' : '🙈 เฉพาะเรา', () => {
        diceShare = !diceShare;
        saveDiceShare();
        renderDice();
    }, diceShare ? 'ltt-on' : '');

    shareButton.title = 'สลับ: ใส่ผลลงกล่องข้อความให้บอทเห็น / ดูเฉพาะตัวเอง';
    shareBar.appendChild(shareButton);
    shareBar.appendChild(makeEl('span', 'ltt-hint', diceShare ? 'ใส่ผลลงกล่องข้อความทันที' : 'ดูเฉพาะในหน้าต่างนี้'));
    ctl.appendChild(shareBar);

    // ปุ่มทอยด่วน
    const quickBar = makeEl('div', 'ltt-bar');

    for (const preset of DICE_PRESETS) {
        quickBar.appendChild(makeTool(preset, () => rollFormulaUi(preset)));
    }

    quickBar.appendChild(makeTool('🪙', () => logRoll(flipCoinText())));
    quickBar.appendChild(makeTool('ใช่/ไม่ใช่', () => logRoll(yesNoText())));
    ctl.appendChild(quickBar);

    // สูตรเอง
    const formulaBar = makeEl('div', 'ltt-bar');
    const input = makeEl('input', 'ltt-search-input ltt-grow');

    input.type = 'text';
    input.value = diceFormula;
    input.placeholder = '2d6+3';
    input.autocomplete = 'off';
    input.autocapitalize = 'off';
    input.spellcheck = false;
    input.setAttribute('enterkeyhint', 'go');
    input.setAttribute('aria-label', 'สูตรลูกเต๋า');

    input.addEventListener('input', () => { diceFormula = input.value; });
    input.addEventListener('keydown', event => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        rollFormulaUi(input.value);
    });

    formulaBar.appendChild(input);
    formulaBar.appendChild(makeTool('ทอย', () => rollFormulaUi(input.value), 'ltt-on'));
    ctl.appendChild(formulaBar);

    // ตารางสุ่ม
    const tableBar = makeEl('div', 'ltt-bar');

    for (const table of diceTables) {
        const group = makeEl('span', 'ltt-grp2');

        group.appendChild(makeTool(`📜 ${table.name}`, () => rollTableUi(table.id), 'ltt-chip'));
        group.appendChild(makeTool('✎', () => {
            diceEditing = table.id;
            renderDice();
        }, 'ltt-chip-edit'));

        tableBar.appendChild(group);
    }

    tableBar.appendChild(makeTool('＋ ตาราง', () => {
        diceEditing = 'new';
        renderDice();
    }, 'ltt-chip'));

    ctl.appendChild(tableBar);

    renderDiceList();
}

function createDiceWin() {
    const existing = document.getElementById(DICE_ID);
    if (existing) return existing;

    return createWin(DICE_ID, 'Dice', '<div class="ltt-dice-ctl"></div><div class="ltt-list"></div>');
}

function openDice() {
    closeSheet();
    closeSearch();
    closeWrite();
    closeCal();

    const win = createDiceWin();

    diceOpen = true;
    diceEditing = null;
    win.classList.add('ltt-visible');
    syncOrb();

    renderDice();
    positionWin(win);
}

function closeDice() {
    if (!diceOpen) return;

    diceOpen = false;
    document.getElementById(DICE_ID)?.classList.remove('ltt-visible');
    syncOrb();
}

function toggleDice() {
    if (diceOpen) closeDice();
    else openDice();
}

/* ============================================================
 * ปฏิทินในเรื่อง: จับวันนัด/งาน/เทศกาลจากแชทด้วยการจับคำ (ไม่เรียก AI)
 * เก็บใน chat metadata ของแชทนั้น ๆ (ไฟล์แชทเดียวกัน แยกตามแชท ไม่หายตอนสลับแชท)
 *   today = "วันนี้ในเรื่อง" (ใช้แปลง พรุ่งนี้ / วันศุกร์หน้า ฯลฯ)
 *   items = รายการ { id, key, src, auto, state: 'new' | 'ok' | 'x', date, time, title, approx }
 *           new = จับได้รอยืนยัน / ok = ยืนยันแล้วหรือเพิ่มเอง / x = ลบแล้ว (เก็บไว้กันจับซ้ำ)
 * ============================================================ */

let calOpen = false;
let calEditing = null;   // id ของรายการที่กำลังแก้
let calScanArm = 0;

function calMeta() {
    const meta = getCtx()?.chatMetadata ?? stModule?.chat_metadata;

    return meta && typeof meta === 'object' ? meta : null;
}

function calData(create) {
    const meta = calMeta();
    if (!meta) return null;

    let data = meta.ltt_cal;

    if (!data || typeof data !== 'object' || !Array.isArray(data.items)) {
        if (!create) return null;

        data = { today: '', items: [] };
        meta.ltt_cal = data;
    }

    if (typeof data.today !== 'string') data.today = '';

    return data;
}

function calSave() {
    const ctx = getCtx();
    const save = ctx?.saveMetadataDebounced || ctx?.saveMetadata || stModule?.saveMetadataDebounced || stModule?.saveMetadata;

    try {
        const result = save?.call(ctx);
        if (result && typeof result.catch === 'function') result.catch(() => {});
    } catch (error) {
        console.warn(`[${EXT_ID}] บันทึกปฏิทินไม่สำเร็จ`, error);
    }
}

function calPendingCount() {
    const data = calData(false);

    return data ? data.items.filter(item => item.state === 'new').length : 0;
}

function updateCalBadge() {
    const badge = document.querySelector(`#${PANEL_ID} .ltt-item[data-id="calendar"] .ltt-count`);
    if (!badge) return;

    const count = calPendingCount();

    badge.textContent = String(count);
    badge.classList.toggle('ltt-hide', count === 0);
}

// ชื่อที่ SillyTavern รู้อยู่แล้ว (ผู้เล่น/ตัวละคร/คนที่พูด) ใช้ช่วยจับ "กับใคร" ให้แม่นขึ้น
function calNames(message) {
    const ctx = getCtx();

    return [...new Set([ctx?.name1, ctx?.name2, message?.name]
        .map(name => String(name ?? '').trim())
        .filter(name => name.length >= 2))];
}

// ตัดแท็ก/บล็อกความคิดออกก่อนจับคำ
function calCleanText(text) {
    return String(text ?? '')
        .replace(/<(think|thinking|details)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
        .replace(/<[^>]+>/g, ' ');
}

// ใส่ผลที่จับได้ของข้อความ #index คืนจำนวนรายการ "ใหม่จริง ๆ"
// (รายการรอยืนยันของข้อความเดิมถูกแทนที่ เผื่อแก้ข้อความ/สุ่มคำตอบใหม่ ส่วนที่ยืนยัน/ลบแล้วไม่แตะ)
function calApply(data, index, found) {
    const previous = new Set();

    data.items = data.items.filter(item => {
        const stale = item.src === index && item.state === 'new' && item.auto;

        if (stale) previous.add(item.key);

        return !stale;
    });

    const have = new Set(data.items.map(item => item.key).filter(Boolean));
    let added = 0;

    for (const hit of found) {
        const key = `${index}|${hit.matched}|${hit.date}|${hit.time}`;

        if (have.has(key)) continue;
        have.add(key);

        data.items.push({
            id: makeId(),
            key,
            src: index,
            auto: true,
            state: 'new',
            date: hit.date,
            time: hit.time,
            title: hit.title,
            ctx: hit.ctx || '',
            approx: hit.approx,
            doubt: Boolean(hit.doubt)
        });

        if (!previous.has(key)) added += 1;
    }

    // รายการที่ลบแล้วเก็บไว้กันจับซ้ำ แต่ไม่ให้โตไม่จำกัด
    const dead = data.items.filter(item => item.state === 'x');

    if (dead.length > 300) {
        const drop = new Set(dead.slice(0, dead.length - 300).map(item => item.id));
        data.items = data.items.filter(item => !drop.has(item.id));
    }

    return added;
}

// ข้อความใหม่/แก้ไข/สุ่มใหม่ → จับวันที่ (สร้างข้อมูลปฏิทินของแชทก็ต่อเมื่อเจออะไร)
function calScanMessage(mesId) {
    try {
        const chat = getCtx()?.chat;
        if (!chat?.length) return;

        const index = Number.isInteger(mesId) ? mesId : chat.length - 1;
        const message = chat[index];

        if (!message || message.is_system) return;

        let data = calData(false);
        const found = detectDates(calCleanText(message.mes), data?.today || '', calNames(message));
        const hadPending = Boolean(data?.items.some(item => item.src === index && item.state === 'new' && item.auto));

        if (!found.length && !hadPending) return;

        data = data || calData(true);
        if (!data) return;

        const added = calApply(data, index, found);

        calSave();
        updateCalBadge();
        if (calOpen && !calEditing) renderCal();

        if (added > 0) showToast(`📅 ปฏิทิน: จับได้ ${added} รายการ รอยืนยัน`, 3000);
    } catch (error) {
        console.warn(`[${EXT_ID}] calendar scan error`, error);
    }
}

// สแกนทั้งแชท (ใช้ "วันนี้ในเรื่อง" ปัจจุบันเป็นฐานของทุกข้อความ)
function calScanAll() {
    const chat = getCtx()?.chat;

    if (!chat?.length) {
        showToast('✖ ยังไม่มีข้อความในแชท');
        return;
    }

    const data = calData(true);
    if (!data) return;

    let added = 0;

    chat.forEach((message, index) => {
        if (!message || message.is_system) return;

        added += calApply(data, index, detectDates(calCleanText(message.mes), data.today, calNames(message)));
    });

    calSave();
    updateCalBadge();
    renderCal();
    showToast(`📅 สแกนทั้งแชทแล้ว: ได้รายการใหม่ ${added}`, 3500);
}

function calSetToday(value) {
    const data = calData(true);

    if (!data) {
        showToast('✖ ยังไม่ได้เปิดแชท');
        return;
    }

    data.today = value;
    calSave();
    renderCal();
}

function calRemove(item) {
    const data = calData(false);
    if (!data) return;

    // รายการที่จับอัตโนมัติเก็บเป็น "ลบแล้ว" ไว้กันจับซ้ำ ส่วนที่เพิ่มเองลบทิ้งเลย
    if (item.auto) item.state = 'x';
    else data.items = data.items.filter(other => other.id !== item.id);

    calSave();
    updateCalBadge();
    renderCal();
}

function calSorted(items) {
    return [...items].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
}

function renderCalEdit(item) {
    const card = makeEl('div', 'ltt-card ltt-cal-edit');

    const when = makeEl('div', 'ltt-bar ltt-bar-in');
    const date = makeEl('input', 'ltt-search-input ltt-grow');
    const time = makeEl('input', 'ltt-search-input ltt-time');
    const title = makeEl('input', 'ltt-search-input');

    date.type = 'date';
    date.min = '0001-01-01';
    date.max = '9999-12-31';
    date.value = item.date || '';

    time.type = 'time';
    time.value = item.time || '';

    title.type = 'text';
    title.maxLength = 120;
    title.placeholder = 'ชื่อนัด/งาน';
    title.value = item.title || '';

    when.appendChild(date);
    when.appendChild(time);

    const bar = makeEl('div', 'ltt-bar ltt-bar-in');

    bar.appendChild(makeTool('บันทึก', () => {
        if (!parseISO(date.value)) {
            showToast('✖ วันที่ไม่ถูกต้อง');
            return;
        }

        item.date = date.value;
        item.time = time.value || '';
        item.title = title.value.trim() || '(ไม่มีชื่อ)';
        item.state = 'ok';
        item.approx = false;
        item.doubt = false;
        delete item.fresh;

        calEditing = null;
        calSave();
        updateCalBadge();
        renderCal();
    }, 'ltt-on'));

    bar.appendChild(makeTool('ยกเลิก', () => {
        calEditing = null;

        if (item.fresh) {
            const data = calData(false);
            if (data) data.items = data.items.filter(other => other.id !== item.id);
        }

        renderCal();
    }));

    card.appendChild(when);
    card.appendChild(title);
    card.appendChild(bar);

    return card;
}

function renderCalCard(item, today) {
    if (calEditing === item.id) return renderCalEdit(item);

    const pending = item.state === 'new';
    const past = Boolean(today) && item.date < today;
    const card = makeEl('div', `ltt-card${pending ? ' ltt-weak' : ''}${past ? ' ltt-past' : ''}`);

    const top = makeEl('div', 'ltt-card-top');

    top.appendChild(makeEl('span', 'ltt-book', `${item.approx ? '≈ ' : ''}${fmtDate(item.date)}`));
    if (item.time) top.appendChild(makeEl('span', 'ltt-key', item.time));
    if (today && item.date === today) top.appendChild(makeEl('span', 'ltt-key ltt-sec', 'วันนี้'));
    if (item.doubt && pending) top.appendChild(makeEl('span', 'ltt-key ltt-sec', 'ไม่แน่ใจ'));

    card.appendChild(top);
    const snip = makeEl('div', 'ltt-snip', item.title);

    // แตะชื่อเพื่อสลับไปดูข้อความเต็มรอบ ๆ ที่จับมา (ชื่อเป็นแค่สรุปสั้น ๆ)
    if (item.ctx && item.ctx !== item.title) {
        let full = false;

        snip.classList.add('ltt-snip-tap');
        snip.title = 'แตะเพื่อดูข้อความที่จับมา';
        snip.addEventListener('click', () => {
            full = !full;
            snip.textContent = full ? item.ctx : item.title;
            snip.classList.toggle('ltt-snip-full', full);
            positionWin(document.getElementById(CAL_ID));
        });
    }

    card.appendChild(snip);

    const row = makeEl('div', 'ltt-keys ltt-roll-act');

    if (pending) {
        row.appendChild(makeAction('✓ ยืนยัน', () => {
            item.state = 'ok';
            calSave();
            updateCalBadge();
            renderCal();
        }));
    }

    row.appendChild(makeAction('แก้', () => {
        calEditing = item.id;
        renderCal();
    }));

    row.appendChild(makeAction('ลบ', () => calRemove(item)));

    if (item.auto && Number.isInteger(item.src) && item.src >= 0) {
        row.appendChild(makeAction(`ไปที่ #${item.src}`, () => {
            closeCal();
            jumpToMessage(item.src);
        }));
    }

    card.appendChild(row);

    return card;
}

function renderCal() {
    const win = document.getElementById(CAL_ID);
    if (!win) return;

    const top = win.querySelector('.ltt-cal-top');
    const list = win.querySelector('.ltt-list');
    const meta = win.querySelector('.ltt-meta');

    const data = calData(false);
    const today = data?.today || '';
    const items = (data?.items || []).filter(item => item.state !== 'x');
    const pending = items.filter(item => item.state === 'new').length;

    meta.textContent = items.length ? `รอยืนยัน ${pending} · ยืนยันแล้ว ${items.length - pending}` : '';

    top.textContent = '';
    list.textContent = '';

    // แถววันนี้ในเรื่อง
    const dateBar = makeEl('div', 'ltt-bar');
    const dateInput = makeEl('input', 'ltt-search-input ltt-grow');

    dateInput.type = 'date';
    dateInput.min = '0001-01-01';
    dateInput.max = '9999-12-31';
    dateInput.value = today;
    dateInput.setAttribute('aria-label', 'วันนี้ในเรื่อง');

    dateInput.addEventListener('change', () => {
        if (dateInput.value && !parseISO(dateInput.value)) {
            showToast('✖ วันที่ไม่ถูกต้อง');
            renderCal();
            return;
        }

        calSetToday(dateInput.value);
    });

    const shift = days => {
        const next = addDays(today || realTodayISO(), days);

        if (next) calSetToday(next);
    };

    dateBar.appendChild(makeEl('span', 'ltt-hint', 'วันนี้ในเรื่อง'));
    dateBar.appendChild(makeTool('‹', () => shift(-1), 'ltt-step'));
    dateBar.appendChild(dateInput);
    dateBar.appendChild(makeTool('›', () => shift(1), 'ltt-step'));
    top.appendChild(dateBar);

    // แถวปุ่ม
    const actionBar = makeEl('div', 'ltt-bar');

    actionBar.appendChild(makeTool('＋ เพิ่ม', () => {
        const target = calData(true);

        if (!target) {
            showToast('✖ ยังไม่ได้เปิดแชท');
            return;
        }

        const fresh = {
            id: makeId(),
            key: '',
            src: -1,
            auto: false,
            state: 'ok',
            date: target.today || realTodayISO(),
            time: '',
            title: '',
            approx: false,
            fresh: true
        };

        target.items.push(fresh);
        calEditing = fresh.id;
        renderCal();
    }));

    // แตะครั้งแรก = ขอยืนยัน แตะอีกครั้งภายใน 3 วินาที = สแกน
    actionBar.appendChild(makeTool('สแกนทั้งแชท', button => {
        if (!calScanArm || Date.now() - calScanArm > 3000) {
            calScanArm = Date.now();
            button.textContent = 'แตะอีกครั้งเพื่อสแกน';
            button.classList.add('ltt-confirm');
            return;
        }

        calScanArm = 0;
        calScanAll();
    }));

    if (pending > 1) {
        actionBar.appendChild(makeTool(`✓ ทั้งหมด ${pending}`, () => {
            items.forEach(item => { if (item.state === 'new') item.state = 'ok'; });
            calSave();
            updateCalBadge();
            renderCal();
        }, 'ltt-on'));
    }

    top.appendChild(actionBar);

    // รายการ
    if (!today) {
        list.appendChild(makeEl(
            'div',
            'ltt-note',
            'ตั้ง “วันนี้ในเรื่อง” ก่อน จึงจะจับคำอย่าง พรุ่งนี้ / วันศุกร์หน้า ได้ (วันที่ระบุเดือนกับเทศกาลจับได้เลย)'
        ));
    }

    if (!items.length) {
        list.appendChild(makeEl('div', 'ltt-note', 'ยังไม่มีรายการ เมื่อในแชทพูดถึงวันนัดหรืองาน จะขึ้นที่นี่ให้ติ๊กยืนยัน'));
    } else {
        calSorted(items).forEach(item => list.appendChild(renderCalCard(item, today)));
    }

    positionWin(win);
}

function createCalWin() {
    const existing = document.getElementById(CAL_ID);
    if (existing) return existing;

    return createWin(CAL_ID, 'Calendar', '<div class="ltt-cal-top"></div><div class="ltt-list"></div>');
}

function openCal() {
    closeSheet();
    closeSearch();
    closeWrite();
    closeDice();

    const win = createCalWin();

    // ทิ้งรายการ "เพิ่มเอง" ที่ค้างอยู่โดยไม่ได้บันทึก
    const data = calData(false);
    if (data) data.items = data.items.filter(item => !item.fresh);

    calOpen = true;
    calEditing = null;
    win.classList.add('ltt-visible');
    syncOrb();

    renderCal();
    positionWin(win);
}

function closeCal() {
    if (!calOpen) return;

    calOpen = false;
    calEditing = null;
    document.getElementById(CAL_ID)?.classList.remove('ltt-visible');
    syncOrb();
}

function toggleCal() {
    if (calOpen) closeCal();
    else openCal();
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
    for (const id of [BUTTON_ID, PANEL_ID, SHEET_ID, SEARCH_ID, WRITE_ID, DICE_ID, CAL_ID]) {
        document.getElementById(id)?.remove();
    }

    addStyles();
    createPanel();
    updateBadge();
    updateCalBadge();
    createButton();
    bindGlobalListeners();
    listen(document, 'input', onWriteInput, true);
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
