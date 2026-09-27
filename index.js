console.log('[LTT TEST] index.js loaded');

const testButton = document.createElement('button');

testButton.id = 'ltt-test-button';
testButton.textContent = 'TEST';

testButton.style.position = 'fixed';
testButton.style.left = '10px';
testButton.style.bottom = '100px';
testButton.style.zIndex = '999999999';

testButton.style.width = '60px';
testButton.style.height = '35px';

testButton.style.background = 'red';
testButton.style.color = 'white';

testButton.style.border = 'none';
testButton.style.borderRadius = '8px';

testButton.style.fontSize = '14px';

document.body.appendChild(testButton);

console.log('[LTT TEST] button created');
