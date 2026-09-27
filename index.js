(function () {
    'use strict';

    const EXT_ID = 'lorebook-trigger-tracker';
    const BUTTON_ID = `${EXT_ID}-bookmark`;

    let initialized = false;
    let observer = null;
    let retryTimer = null;

    /*
     * ---------------------------------------------------------
     * เริ่มต้น Extension
     * ---------------------------------------------------------
     */

    function init() {
        console.log(`[${EXT_ID}] init() called`);

        waitForSendForm();
    }


    /*
     * ---------------------------------------------------------
     * รอ #send_form
     *
     * SillyTavern อาจยังสร้าง composer ไม่เสร็จตอน Extension ถูกโหลด
     * ดังนั้นเราจะไม่ถือว่า "หาไม่เจอ = พัง"
     * ---------------------------------------------------------
     */

    function waitForSendForm() {

        if (initialized) {
            return;
        }

        const sendForm = document.querySelector('#send_form');

        if (sendForm) {
            console.log(`[${EXT_ID}] #send_form found`);

            createBookmark(sendForm);

            initialized = true;

            if (observer) {
                observer.disconnect();
                observer = null;
            }

            if (retryTimer) {
                clearInterval(retryTimer);
                retryTimer = null;
            }

            return;
        }

        console.log(`[${EXT_ID}] Waiting for #send_form...`);

        /*
         * MutationObserver เฝ้าดู DOM
         * ถ้า SillyTavern สร้าง #send_form ภายหลัง
         * เราจะจับมันได้ทันที
         */

        if (!observer) {

            observer = new MutationObserver(function () {

                if (initialized) {
                    return;
                }

                const form = document.querySelector('#send_form');

                if (form) {
                    console.log(`[${EXT_ID}] #send_form appeared`);

                    createBookmark(form);

                    initialized = true;

                    observer.disconnect();
                    observer = null;

                    if (retryTimer) {
                        clearInterval(retryTimer);
                        retryTimer = null;
                    }
                }

            });

            observer.observe(document.documentElement, {
                childList: true,
                subtree: true
            });
        }

        /*
         * กันกรณี MutationObserver พลาดจากลำดับการสร้าง DOM
         */

        if (!retryTimer) {

            retryTimer = setInterval(function () {

                if (initialized) {
                    clearInterval(retryTimer);
                    retryTimer = null;
                    return;
                }

                const form = document.querySelector('#send_form');

                if (form) {

                    console.log(`[${EXT_ID}] #send_form found by retry`);

                    createBookmark(form);

                    initialized = true;

                    clearInterval(retryTimer);
                    retryTimer = null;

                    if (observer) {
                        observer.disconnect();
                        observer = null;
                    }
                }

            }, 500);
        }
    }


    /*
     * ---------------------------------------------------------
     * สร้างปุ่ม Bookmark
     * ---------------------------------------------------------
     */

    function createBookmark(sendForm) {

        /*
         * ป้องกันสร้างซ้ำ
         */

        const oldButton = document.getElementById(BUTTON_ID);

        if (oldButton) {
            console.log(`[${EXT_ID}] Bookmark already exists`);
            return;
        }


        /*
         * #send_form ต้องเป็น reference point
         * เพื่อให้ปุ่ม absolute อยู่ "ในกล่อง"
         */

        const currentPosition =
            window.getComputedStyle(sendForm).position;

        if (
            currentPosition === 'static' ||
            !currentPosition
        ) {
            sendForm.style.setProperty(
                'position',
                'relative',
                'important'
            );
        }


        /*
         * -----------------------------------------------------
         * สร้างปุ่ม
         * -----------------------------------------------------
         */

        const bookmark = document.createElement('button');

        bookmark.id = BUTTON_ID;
        bookmark.type = 'button';
        bookmark.setAttribute(
            'aria-label',
            'Lorebook Trigger Tracker'
        );

        bookmark.innerHTML = '🔖';


        /*
         * -----------------------------------------------------
         * Style
         *
         * ตั้งทั้งหมดจาก JS ก่อน
         * จะได้ไม่ต้องพึ่ง style.css
         * -----------------------------------------------------
         */

        bookmark.style.setProperty(
            'position',
            'absolute',
            'important'
        );

        bookmark.style.setProperty(
            'right',
            '62px',
            'important'
        );

        bookmark.style.setProperty(
            'top',
            '50%',
            'important'
        );

        bookmark.style.setProperty(
            'transform',
            'translateY(-50%)',
            'important'
        );

        bookmark.style.setProperty(
            'width',
            '44px',
            'important'
        );

        bookmark.style.setProperty(
            'height',
            '48px',
            'important'
        );

        bookmark.style.setProperty(
            'padding',
            '0',
            'important'
        );

        bookmark.style.setProperty(
            'margin',
            '0',
            'important'
        );

        bookmark.style.setProperty(
            'border',
            '0',
            'important'
        );

        bookmark.style.setProperty(
            'outline',
            'none',
            'important'
        );

        bookmark.style.setProperty(
            'border-radius',
            '10px',
            'important'
        );

        bookmark.style.setProperty(
            'background',
            '#b83f5b',
            'important'
        );

        bookmark.style.setProperty(
            'color',
            '#ffffff',
            'important'
        );

        bookmark.style.setProperty(
            'font-size',
            '23px',
            'important'
        );

        bookmark.style.setProperty(
            'line-height',
            '1',
            'important'
        );

        bookmark.style.setProperty(
            'display',
            'flex',
            'important'
        );

        bookmark.style.setProperty(
            'align-items',
            'center',
            'important'
        );

        bookmark.style.setProperty(
            'justify-content',
            'center',
            'important'
        );

        bookmark.style.setProperty(
            'cursor',
            'pointer',
            'important'
        );

        bookmark.style.setProperty(
            'z-index',
            '99999',
            'important'
        );

        bookmark.style.setProperty(
            'box-sizing',
            'border-box',
            'important'
        );


        /*
         * -----------------------------------------------------
         * Hover
         * -----------------------------------------------------
         */

        bookmark.addEventListener(
            'mouseenter',
            function () {

                bookmark.style.setProperty(
                    'filter',
                    'brightness(1.15)',
                    'important'
                );

            }
        );

        bookmark.addEventListener(
            'mouseleave',
            function () {

                bookmark.style.setProperty(
                    'filter',
                    'none',
                    'important'
                );

            }
        );


        /*
         * -----------------------------------------------------
         * Click
         * -----------------------------------------------------
         */

        bookmark.addEventListener(
            'click',
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                console.log(
                    `[${EXT_ID}] Bookmark clicked`
                );

            }
        );


        /*
         * -----------------------------------------------------
         * สำคัญมาก
         *
         * append เข้า #send_form โดยตรง
         * -----------------------------------------------------
         */

        sendForm.appendChild(bookmark);


        console.log(
            `[${EXT_ID}] Bookmark inserted INSIDE #send_form`
        );
    }


    /*
     * ---------------------------------------------------------
     * ทำให้ SillyTavern เรียก init() ได้
     * ---------------------------------------------------------
     */

    window[`${EXT_ID}_init`] = init;


    /*
     * ---------------------------------------------------------
     * กรณี Extension ถูกโหลดแบบ JS ปกติ
     * ---------------------------------------------------------
     */

    if (
        document.readyState === 'loading'
    ) {

        document.addEventListener(
            'DOMContentLoaded',
            init,
            { once: true }
        );

    } else {

        init();

    }


    /*
     * ---------------------------------------------------------
     * เผื่อ SillyTavern เรียก lifecycle hook
     * ---------------------------------------------------------
     */

    window.initLorebookTriggerTracker = init;

})();
