const EXT_ID = 'lorebook-trigger-tracker';
const BUTTON_ID = `${EXT_ID}-bookmark`;

let initialized = false;
let observer = null;
let retryTimer = null;

function findSendForm() {
    return document.querySelector('#send_form');
}

function stopWaiting() {
    if (observer) {
        observer.disconnect();
        observer = null;
    }

    if (retryTimer) {
        clearInterval(retryTimer);
        retryTimer = null;
    }
}

function waitForSendForm() {
    if (initialized) {
        return;
    }

    const sendForm = findSendForm();

    if (sendForm) {
        createBookmark(sendForm);
        initialized = true;
        stopWaiting();
        return;
    }

    if (!observer) {
        observer = new MutationObserver(() => {
            if (initialized) {
                stopWaiting();
                return;
            }

            const form = findSendForm();

            if (form) {
                createBookmark(form);
                initialized = true;
                stopWaiting();
            }
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    if (!retryTimer) {
        retryTimer = setInterval(() => {
            if (initialized) {
                stopWaiting();
                return;
            }

            const form = findSendForm();

            if (form) {
                createBookmark(form);
                initialized = true;
                stopWaiting();
            }
        }, 500);
    }
}

function createBookmark(sendForm) {
    if (document.getElementById(BUTTON_ID)) {
        return;
    }

    const position = getComputedStyle(sendForm).position;

    if (position === 'static') {
        sendForm.style.position = 'relative';
    }

    const bookmark = document.createElement('button');

    bookmark.id = BUTTON_ID;
    bookmark.type = 'button';
    bookmark.setAttribute(
        'aria-label',
        'Lorebook Trigger Tracker'
    );
    bookmark.title = 'Lorebook Trigger Tracker';
    bookmark.textContent = '🔖';

    Object.assign(bookmark.style, {
        position: 'absolute',
        right: '62px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '44px',
        height: '44px',
        padding: '0',
        margin: '0',
        border: '0',
        outline: 'none',
        borderRadius: '10px',
        background: '#b83f5b',
        color: '#fff',
        fontSize: '23px',
        lineHeight: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: '99999',
        boxSizing: 'border-box'
    });

    bookmark.addEventListener('mouseenter', () => {
        bookmark.style.filter = 'brightness(1.15)';
    });

    bookmark.addEventListener('mouseleave', () => {
        bookmark.style.filter = 'none';
    });

    bookmark.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();

        console.log(
            `[${EXT_ID}] Bookmark clicked`
        );
    });

    sendForm.appendChild(bookmark);

    console.log(
        `[${EXT_ID}] Bookmark inserted inside #send_form`
    );
}

export async function init() {
    console.log(`[${EXT_ID}] init()`);

    if (initialized) {
        return;
    }

    waitForSendForm();
}
