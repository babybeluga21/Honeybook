alert('SCRIPT RAN ✅');

function init() {
    const test = document.createElement('button');

    test.textContent = '🔖';
    test.id = 'ltt-test-button';

    test.style.position = 'fixed';
    test.style.left = '10px';
    test.style.bottom = '80px';
    test.style.width = '45px';
    test.style.height = '45px';
    test.style.zIndex = '99999';

    test.style.background = '#222';
    test.style.color = '#fff';
    test.style.border = '2px solid #fff';
    test.style.borderRadius = '10px';

    test.style.fontSize = '22px';
    test.style.cursor = 'pointer';

    document.body.appendChild(test);

    console.log('[Lorebook Trigger Tracker] INIT WORKED');
}
