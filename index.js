
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
        /* ===== Floating Glass Orb ===== */
        #${BUTTON_ID} {
            position: fixed !important;
            left: 8px;
            top: 50%;
            z-index: 999998;

            width: 36px;
            height: 36px;
            padding: 0;
            margin: 0;
            border: 1px solid rgba(245,225,235,.65);
            border-radius: 50%;
            outline: none;

            display: flex;
            align-items: center;
            justify-content: center;

            background:
                radial-gradient(
                    ellipse at 30% 20%,
                    rgba(255,245,248,.9) 0%,
                    rgba(255,200,215,.55) 9%,
                    transparent 28%
                ),
                radial-gradient(
                    circle at 35% 28%,
                    rgba(235,125,157,.95) 0%,
                    rgba(157,53,91,.88) 35%,
                    rgba(72,34,61,.96) 72%,
                    rgba(35,28,43,.98) 100%
                ) !important;

            box-shadow:
                inset 0 1px 3px rgba(255,255,255,.65),
                inset -3px -4px 8px rgba(27,15,35,.45),
                0 2px 8px rgba(0,0,0,.3),
                0 0 10px rgba(194,74,94,.16) !important;

            cursor: pointer;
            user-select: none;
            -webkit-tap-highlight-color: transparent;

            transform: translateY(-100%);
            transition:
                box-shadow .2s ease,
                filter .2s ease,
                transform .15s ease,
                border-color .2s ease;
        }

        #${BUTTON_ID} .ltt-orb {
            position: absolute;
            inset: 0;
            border-radius: 50%;
            overflow: hidden;
            pointer-events: none;
        }

        /* Soft glass reflection */
        #${BUTTON_ID} .ltt-orb::before {
            content: "";
            position: absolute;
            width: 19px;
            height: 10px;
            top: 4px;
            left: 5px;
            border-radius: 50%;
            background: linear-gradient(
                180deg,
                rgba(255,255,255,.8),
                rgba(255,255,255,.08)
            );
            filter: blur(1px);
            transform: rotate(-35deg);
        }

        #${BUTTON_ID} .ltt-orb::after {
            content: "";
            position: absolute;
            width: 7px;
            height: 3px;
            top: 15px;
            left: 5px;
            border-radius: 50%;
            background: rgba(255,235,242,.55);
            filter: blur(1px);
            transform: rotate(-40deg);
        }

        #${BUTTON_ID}:hover {
            border-color: rgba(255,225,235,.9);
            filter: brightness(1.12);
            box-shadow:
                inset 0 1px 4px rgba(255,255,255,.7),
                0 0 12px rgba(194,74,94,.35),
                0 3px 10px rgba(0,0,0,.3) !important;
        }

        #${BUTTON_ID}:active {
            transform: translateY(-100%) scale(.92);
        }

        #${BUTTON_ID}.ltt-active {
            border-color: #f3bdca;
            box-shadow:
                inset 0 1px 4px rgba(255,255,255,.75),
                0 0 14px rgba(224,120,138,.48),
                0 0 28px rgba(194,74,94,.2),
                0 3px 10px rgba(0,0,0,.3) !important;
        }

        /* ===== Floating Lorebook Panel ===== */
        #${PANEL_ID} {
            position: fixed;
            display: none;
            align-items: center;
            gap: 5px;
            padding: 5px;

            box-sizing: border-box;
            max-width: calc(100vw - 16px);

            background: linear-gradient(
                110deg,
                rgba(100,38,58,.94),
                rgba(48,35,52,.95) 68%,
                rgba(36,31,45,.96)
            );

            backdrop-filter: blur(14px) saturate(120%);
            -webkit-backdrop-filter: blur(14px) saturate(120%);

            border: 1px solid rgba(225,215,235,.4);
            border-left: 3px solid #c24a5e;
            border-radius: 9px;

            box-shadow:
                inset 0 1px 0 rgba(255,255,255,.08),
                0 5px 18px rgba(0,0,0,.3);

            color: #efe7ea;
            font-family: 'Segoe UI', 'Sarabun', Tahoma, sans-serif;

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
            gap: 6px;

            min-height: 32px;
            padding: 0 10px;
            margin: 0;

            border: 1px solid rgba(255,220,230,.12);
            border-radius: 6px;

            background: linear-gradient(
                120deg,
                rgba(255,210,225,.09),
                rgba(255,255,255,.025)
            );

            color: #f3e6eb;
            font-family: inherit;
            font-size: 12px;

            white-space: nowrap;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;

            transition:
                background .15s ease,
                border-color .15s ease;
        }

        #${PANEL_ID} .ltt-category:hover {
            background: rgba(224,120,138,.16);
            border-color: rgba(240,170,190,.3);
        }

        #${PANEL_ID} .ltt-category:active {
            background: rgba(224,120,138,.24);
        }

        #${PANEL_ID} .ltt-category-icon {
            color: #e6a1b1;
            font-size: 13px;
        }

        #${PANEL_ID} .ltt-category-count {
            min-width: 15px;
            height: 15px;
            padding: 0 4px;

            display: inline-flex;
            align-items: center;
            justify-content: center;

            border: 1px solid rgba(240,200,215,.16);
            border-radius: 8px;

            background: rgba(255,220,235,.08);
            color: #f0c5d1;
            font-size: 10px;
        }

        @media (prefers-reduced-motion: reduce) {
            #${BUTTON_ID},
            #${PANEL_ID},
            #${PANEL_ID} .ltt-category {
                transition: none;
            }
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

function positionButton() {
    const button = document.getElementById(BUTTON_ID);
    const target = findTextbox();

    if (!button || !target) return;

    const rect = target.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    const margin = 8;
    const buttonSize = button.offsetHeight || 36;

    let left = rect.left;
    let top = rect.top - 4;

    if (top - buttonSize < margin) {
        top = Math.max(margin + buttonSize, rect.top + buttonSize);
    }

    left = Math.max(
        margin,
        Math.min(left, window.innerWidth - 36 - margin)
    );

    top = Math.max(
        buttonSize + margin,
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

    panel.style.visibility = 'hidden';
    panel.style.display = 'flex';

    const buttonRect = button.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const margin = 8;

    let left = buttonRect.left;
    let top = buttonRect.top - panelRect.height - 4;

    if (top < margin) {
        top = buttonRect.bottom + 4;
    }

    left = Math.min(
        left,
        window.innerWidth - panelRect.width - margin
    );

    left = Math.max(margin, left);

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

        // เชื่อมระบบตรวจจับ Trigger จริงภายหลัง
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

    const orb = document.createElement('span');
    orb.className = 'ltt-orb';
    orb.setAttribute('aria-hidden', 'true');

    button.appendChild(orb);

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

    console.log(`[${EXT_ID}] Glass orb initialized`);
}
