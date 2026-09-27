function init() {
    const sendForm = document.querySelector('#send_form');

    if (!sendForm) {
        console.log('[Lorebook Trigger Tracker] #send_form not found');
        return;
    }

    const bookmark = document.createElement('button');

    bookmark.id = 'lorebook-trigger-tracker-bookmark';
    bookmark.type = 'button';
    bookmark.textContent = '🔖';

    // ให้ปุ่มอยู่ "ใน" กล่องส่งข้อความ
    sendForm.style.position = 'relative';

    Object.assign(bookmark.style, {
        position: 'absolute',
        right: '72px',
        bottom: '8px',

        width: '48px',
        height: '52px',

        padding: '0',
        margin: '0',

        border: 'none',
        borderRadius: '0',

        background: '#b83f5b',
        color: '#fff',

        fontSize: '24px',
        lineHeight: '1',

        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',

        cursor: 'pointer',
        zIndex: '20'
    });

    sendForm.appendChild(bookmark);

    bookmark.addEventListener('click', () => {
        console.log('Lorebook button clicked');
    });

    console.log('[Lorebook Trigger Tracker] Button inserted into #send_form');
}
