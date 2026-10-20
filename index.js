/* Dice & Random Wheel — SillyTavern extension
 * Browser-side randomness only. Public results are inserted into the message box, never auto-sent.
 */
(() => {
  'use strict';
  const ID = 'drw';
  const STYLE_ID = `${ID}-style`;
  const ROOT_ID = `${ID}-root`;
  const ORB_ID = `${ID}-orb`;
  const STORE_KEY = 'drw-custom-tables-v1';
  const ITEMS = [
    { id: 'dice', label: 'Dice', glyph: '✧', title: 'Dice / ลูกเต๋า' },
    { id: 'random', label: 'Random', glyph: '❖', title: 'Random / สุ่ม' },
    { id: 'tables', label: 'Tables', glyph: '☷', title: 'My tables / ตารางสุ่ม' },
  ];
  let initialized = false;
  let selectedIndex = 0;
  let wheelOffset = 0;
  let touchStart = null;
  let customTables = loadTables();
  let lastResult = '';
  let allowInsert = true;
  let panel = 'dice';

  function loadTables() {
    try { const x = JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); return Array.isArray(x) ? x : []; }
    catch { return []; }
  }
  function saveTables() { try { localStorage.setItem(STORE_KEY, JSON.stringify(customTables)); } catch (e) { console.warn(`[${ID}] Could not save tables`, e); } }
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function iconButton(text, title, fn, cls = '') {
    const b = el('button', `drw-btn ${cls}`, text); b.type = 'button'; b.title = title; b.addEventListener('click', fn); return b;
  }
  function addStyles() {
    document.getElementById(STYLE_ID)?.remove();
    const s = el('style'); s.id = STYLE_ID;
    s.textContent = `
      #${ORB_ID}{position:fixed!important;z-index:999990!important;width:25px;height:25px;padding:0!important;margin:0!important;border:1px solid rgba(246,232,226,.75)!important;border-radius:50%!important;background:radial-gradient(circle at 32% 25%,#fff7f2 0%,#f6e8e2 42%,#c98d98 100%)!important;color:#9e203c!important;box-shadow:0 2px 7px #0008, inset 0 0 0 2px #f6e8e2aa!important;display:flex;align-items:center;justify-content:center;font-size:14px;line-height:1;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;}
      #${ORB_ID}::after{content:'';position:absolute;inset:-4px;border:1px solid #f6e8e266;border-radius:50%;pointer-events:none}
      #${ROOT_ID}{position:fixed;z-index:999991;left:8px;bottom:74px;width:min(340px,calc(100vw - 16px));max-height:min(68vh,570px);display:flex;flex-direction:column;overflow:hidden;color:#f6e8e2;font:12px/1.5 'Segoe UI',Tahoma,sans-serif;background:radial-gradient(120% 70% at 100% 0%,#e0788a26,transparent 60%),linear-gradient(155deg,#51172cfa,#2a1b30fa 52%,#17151ffa);border:1px solid #f6e8e288;border-radius:7px;box-shadow:0 12px 32px #0009,inset 0 0 0 3px #1c182488;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);opacity:0;transform:translateY(8px) scale(.98);pointer-events:none;visibility:hidden;transition:opacity .18s,transform .18s,visibility .18s;}
      #${ROOT_ID}.drw-open{opacity:1;transform:none;pointer-events:auto;visibility:visible}
      #${ROOT_ID} *{box-sizing:border-box} #${ROOT_ID} button,#${ROOT_ID} input,#${ROOT_ID} textarea,#${ROOT_ID} select{font:inherit}
      #${ROOT_ID} .drw-head{display:flex;align-items:center;gap:8px;padding:11px 12px 8px;border-bottom:1px solid #e0788a55}
      #${ROOT_ID} .drw-heading{flex:1;font:700 11px Georgia,serif;letter-spacing:1.6px;text-transform:uppercase;color:#fff2ed}
      #${ROOT_ID} .drw-sub{color:#cdbbc4;font-size:10px}
      #${ROOT_ID} .drw-close{border:1px solid #e0788a88!important;background:#f6e8e2!important;color:#8f1f38!important;border-radius:50%!important;width:23px;height:23px;padding:0!important;line-height:1}
      #${ROOT_ID} .drw-body{padding:11px;overflow:auto;overscroll-behavior:contain}
      #${ROOT_ID} .drw-wheel-wrap{position:relative;height:108px;margin:0 0 10px;overflow:hidden;touch-action:pan-y;user-select:none}
      #${ROOT_ID} .drw-arc{position:absolute;width:178px;height:178px;border:1px solid #f6e8e233;border-radius:50%;left:50%;top:60px;transform:translate(-50%,-50%);pointer-events:none}
      #${ROOT_ID} .drw-wheel{position:absolute;inset:0}
      #${ROOT_ID} .drw-wheel-item{position:absolute;left:50%;top:56px;width:35px;height:35px;margin:-17.5px 0 0 -17.5px;border:1px solid #fff2edaa!important;border-radius:50%!important;background:radial-gradient(circle at 30% 25%,#fffaf5,#f6e8e2 48%,#b95d71)!important;color:#9e203c!important;box-shadow:0 3px 8px #0008,inset 0 0 0 2px #fff8!important;display:flex;align-items:center;justify-content:center;font-size:15px;transition:transform .22s,opacity .22s;cursor:pointer}
      #${ROOT_ID} .drw-wheel-item.drw-center{width:41px;height:41px;margin:-20.5px 0 0 -20.5px;box-shadow:0 0 0 3px #e0788a55,0 3px 10px #0009,inset 0 0 0 2px #fff8!important}
      #${ROOT_ID} .drw-wheel-label{position:absolute;left:50%;top:91px;transform:translateX(-50%);font-size:9px;letter-spacing:1px;color:#f6e8e2;white-space:nowrap;text-shadow:0 1px 3px #000}
      #${ROOT_ID} .drw-section{font-weight:700;color:#f6e8e2;margin:2px 0 8px;font-size:11px;letter-spacing:.5px}
      #${ROOT_ID} .drw-row{display:flex;gap:6px;flex-wrap:wrap;margin:7px 0}
      #${ROOT_ID} .drw-btn{border:1px solid #e0788a88!important;border-radius:5px!important;padding:6px 9px!important;background:linear-gradient(135deg,#6c2039aa,#251b2dcc)!important;color:#f6e8e2!important;box-shadow:inset 0 1px #fff1!important;cursor:pointer;min-height:30px}
      #${ROOT_ID} .drw-btn:active{background:#a22b49!important}
      #${ROOT_ID} .drw-btn.drw-active{background:#f6e8e2!important;color:#8f1f38!important;border-color:#fff!important}
      #${ROOT_ID} .drw-field{width:100%;min-width:0;border:1px solid #e0788a77!important;border-radius:5px!important;padding:7px 9px!important;background:#100d18bb!important;color:#fff2ed!important;outline:none!important}
      #${ROOT_ID} .drw-field::placeholder{color:#bba5af}
      #${ROOT_ID} .drw-result{margin-top:10px;padding:10px;border:1px solid #e0788a77;border-left:3px solid #c24a5e;border-radius:5px;background:#100d1880;overflow-wrap:anywhere}
      #${ROOT_ID} .drw-result-value{font-size:18px;font-weight:700;color:#fff3ef}
      #${ROOT_ID} .drw-note{font-size:10px;color:#cdbbc4;margin-top:5px}
      #${ROOT_ID} .drw-check{display:flex;gap:7px;align-items:center;color:#f1dfe5;margin:9px 0}
      #${ROOT_ID} .drw-check input{accent-color:#c24a5e}
      #${ROOT_ID} .drw-table{padding:9px;border:1px solid #e0788a44;border-radius:5px;background:#100d1877;margin:7px 0}
      #${ROOT_ID} .drw-table-title{font-weight:700;margin-bottom:5px;overflow-wrap:anywhere}
      #${ROOT_ID} .drw-empty{color:#cdbbc4;text-align:center;padding:16px 5px}
      #${ROOT_ID} .drw-divider{height:1px;background:#e0788a33;margin:10px 0}
      @media(max-width:480px){#${ROOT_ID}{left:8px;bottom:70px;width:calc(100vw - 16px);max-height:65vh}#${ROOT_ID} .drw-body{padding:10px}}
      @media(prefers-reduced-motion:reduce){#${ROOT_ID},#${ROOT_ID} *{transition:none!important}}
    `;
    document.head.appendChild(s);
  }
  function findTextbox() {
    return document.querySelector('#send_textarea') || document.querySelector('#chat_textarea') || document.querySelector('textarea[name="message"]') || document.querySelector('#send_form textarea') || document.querySelector('#send_form [contenteditable="true"]');
  }
  function positionOrb() {
    const orb = document.getElementById(ORB_ID), target = findTextbox(); if (!orb || !target) return;
    const rect = target.getBoundingClientRect(); if (!rect.width || !rect.height) return;
    const menu = document.querySelector('#options_button'); const mr = menu?.getBoundingClientRect();
    let left = mr?.width ? mr.left + mr.width / 2 - 12.5 : rect.left;
    let top = rect.top - 31;
    if (top < 5) top = rect.top + 5;
    orb.style.left = `${Math.max(4, Math.min(innerWidth - 30, left))}px`;
    orb.style.top = `${Math.max(4, Math.min(innerHeight - 30, top))}px`;
  }
  function setOpen(open) {
    const root = document.getElementById(ROOT_ID), orb = document.getElementById(ORB_ID); if (!root) return;
    root.classList.toggle('drw-open', open); orb?.setAttribute('aria-expanded', String(open));
    if (open) renderPanel(panel);
  }
  function rotate(delta) {
    selectedIndex = (selectedIndex + delta % ITEMS.length + ITEMS.length) % ITEMS.length;
    wheelOffset += delta; renderWheel();
  }
  function renderWheel() {
    const wheel = document.querySelector(`#${ROOT_ID} .drw-wheel`); if (!wheel) return;
    wheel.textContent = '';
    // Only three visible gems; index wraps through the full item list.
    [-1, 0, 1].forEach((step, i) => {
      const idx = (selectedIndex + step + ITEMS.length) % ITEMS.length, item = ITEMS[idx];
      const b = el('button', `drw-wheel-item${step === 0 ? ' drw-center' : ''}`, item.glyph);
      b.type = 'button'; b.setAttribute('aria-label', item.title);
      const angle = step * 0.72 + Math.PI / 2;
      const x = Math.sin(angle) * 60;
      const y = (1 - Math.cos(angle)) * 20 - 8;
      b.style.transform = `translate(${x}px,${y}px) scale(${step === 0 ? 1 : .88})`;
      b.style.opacity = step === 0 ? '1' : '.66';
      b.addEventListener('click', () => { if (step !== 0) { rotate(step); return; } panel = item.id; renderPanel(panel); });
      wheel.appendChild(b);
    });
    const label = document.querySelector(`#${ROOT_ID} .drw-wheel-label`); if (label) label.textContent = ITEMS[selectedIndex].label.toUpperCase();
  }
  function makeResultBox(result, detail = '') {
    const box = el('div', 'drw-result'); box.appendChild(el('div', 'drw-sub', 'RESULT / ผลลัพธ์'));
    box.appendChild(el('div', 'drw-result-value', result)); if (detail) box.appendChild(el('div', 'drw-note', detail));
    const row = el('div', 'drw-row');
    row.appendChild(iconButton('คัดลอก', 'คัดลอกผล', () => copyText(result)));
    row.appendChild(iconButton('แทรกลงแชท', 'แทรกผลลงกล่องข้อความ', () => { if (!allowInsert) { notify('โหมดส่วนตัวเปิดอยู่ — ผลนี้จะไม่ถูกแทรกลงแชท'); return; } insertResult(result); }, 'drw-active'));
    box.appendChild(row); return box;
  }
  function showResult(result, detail = '') {
    lastResult = result;
    const area = document.querySelector(`#${ROOT_ID} .drw-result-host`); if (!area) return;
    area.textContent = ''; area.appendChild(makeResultBox(result, detail));
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); } catch { const ta = el('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
  }
  function insertResult(result) {
    const box = findTextbox(); if (!box) { notify('ไม่พบกล่องข้อความของ SillyTavern'); return; }
    const value = String(result);
    if (box instanceof HTMLTextAreaElement || box instanceof HTMLInputElement) {
      const start = box.selectionStart ?? box.value.length, end = box.selectionEnd ?? box.value.length;
      const before = box.value.slice(0, start), after = box.value.slice(end);
      const spacer = before && !/\s$/.test(before) ? ' ' : '';
      box.value = before + spacer + value + after;
      const pos = (before + spacer + value).length; box.setSelectionRange(pos, pos);
      box.dispatchEvent(new Event('input', { bubbles: true })); box.focus();
    } else {
      box.focus();
      const sel = window.getSelection();
      if (sel && sel.rangeCount) { const range = sel.getRangeAt(0); range.deleteContents(); range.insertNode(document.createTextNode(value)); range.collapse(false); }
      else box.appendChild(document.createTextNode(value));
      box.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
    }
    notify('แทรกผลลงกล่องข้อความแล้ว — ยังไม่ได้ส่ง');
  }
  function notify(message) {
    let toast = document.getElementById(`${ID}-toast`);
    if (!toast) { toast = el('div'); toast.id = `${ID}-toast`; toast.style.cssText = 'position:fixed;z-index:1000002;left:50%;bottom:120px;transform:translateX(-50%);max-width:88vw;padding:8px 12px;border:1px solid #e0788a;border-radius:5px;background:#251622f2;color:#f6e8e2;font:12px sans-serif;box-shadow:0 4px 15px #0008;'; document.body.appendChild(toast); }
    toast.textContent = message; toast.hidden = false; clearTimeout(toast._timer); toast._timer = setTimeout(() => { toast.hidden = true; }, 2400);
  }
  function randomInt(max) { const n = Math.floor(Number(max)); if (!Number.isSafeInteger(n) || n < 1) throw new Error('ด้านของลูกเต๋าต้องเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป');
    // Prefer cryptographically strong browser RNG; rejection sampling avoids modulo bias.
    const range = 0x100000000, limit = Math.floor(range / n) * n; const buf = new Uint32Array(1); let x;
    do { crypto.getRandomValues(buf); x = buf[0]; } while (x >= limit); return (x % n) + 1;
  }
  function rollFormula(input) {
    const formula = String(input).replace(/\s+/g, '').toLowerCase();
    if (!formula || formula.length > 80) throw new Error('กรอกสูตร เช่น 2d6+3');
    const re = /([+-]?)(\d*)d(\d+)|([+-]?\d+)/gy;
    let pos = 0, total = 0, rolls = [], terms = 0;
    while (pos < formula.length) {
      re.lastIndex = pos; const m = re.exec(formula); if (!m || m.index !== pos) throw new Error('สูตรไม่ถูกต้อง ลอง 2d6+3 หรือ d20');
      terms++;
      if (terms > 20) throw new Error('สูตรยาวเกินไป');
      if (m[3]) {
        const count = Number(m[2] || 1), sides = Number(m[3]), sign = m[1] === '-' ? -1 : 1;
        if (count < 1 || count > 100 || !Number.isInteger(count)) throw new Error('จำนวนลูกเต๋าต้องอยู่ระหว่าง 1–100');
        if (sides < 1 || sides > 1000000 || !Number.isInteger(sides)) throw new Error('จำนวนหน้าต้องอยู่ระหว่าง 1–1,000,000');
        const values = []; for (let i = 0; i < count; i++) values.push(randomInt(sides));
        total += sign * values.reduce((a,b) => a+b, 0); rolls.push(`${sign < 0 ? '−' : ''}${count}d${sides}[${values.join(', ')}]`);
      } else {
        const n = Number(m[4]); if (!Number.isSafeInteger(n)) throw new Error('ตัวเลขไม่ถูกต้อง'); total += n; rolls.push(m[4]);
      }
      pos = re.lastIndex;
    }
    return { total, detail: rolls.join('  ') };
  }
  function renderPanel(which) {
    panel = which;
    const body = document.querySelector(`#${ROOT_ID} .drw-body`); if (!body) return;
    body.textContent = '';
    renderWheel();
    if (which === 'dice') renderDice(body);
    else if (which === 'random') renderRandom(body);
    else renderTables(body);
  }
  function renderDice(body) {
    body.appendChild(el('div', 'drw-section', 'DICE / ลูกเต๋า'));
    const row = el('div', 'drw-row');
    [['d20','🎲 d20'],['d6','⚄ d6'],['d100','d100'],['coin','เหรียญ'],['yesno','ใช่ / ไม่ใช่']].forEach(([kind,label]) => row.appendChild(iconButton(label, label, () => {
      try {
        let result, detail = '';
        if (kind === 'd20') result = `🎲 d20 = ${randomInt(20)}`;
        if (kind === 'd6') result = `🎲 d6 = ${randomInt(6)}`;
        if (kind === 'd100') result = `🎲 d100 = ${randomInt(100)}`;
        if (kind === 'coin') result = `🪙 ${randomInt(2) === 1 ? 'หัว' : 'ก้อย'}`;
        if (kind === 'yesno') result = `✦ ${randomInt(2) === 1 ? 'ใช่' : 'ไม่ใช่'}`;
        showResult(result, detail);
      } catch (e) { notify(e.message); }
    })));
    body.appendChild(row);
    body.appendChild(el('div', 'drw-divider'));
    body.appendChild(el('div', 'drw-section', 'CUSTOM FORMULA / สูตรกำหนดเอง'));
    const input = el('input', 'drw-field'); input.placeholder = 'เช่น 2d6+3, d20, 4d8-2'; input.value = '2d6+3'; input.setAttribute('aria-label','สูตรลูกเต๋า'); body.appendChild(input);
    const roll = iconButton('ทอยสูตร', 'ทอยสูตรที่กรอก', () => { try { const r = rollFormula(input.value); showResult(`🎲 ${input.value} = ${r.total}`, r.detail); } catch(e) { notify(e.message); } }, 'drw-active'); body.appendChild(el('div','drw-row')).appendChild(roll);
    const visibility = el('label','drw-check'); const checkbox = el('input'); checkbox.type = 'checkbox'; checkbox.checked = allowInsert; checkbox.addEventListener('change', () => { allowInsert = checkbox.checked; }); visibility.append(checkbox, document.createTextNode('อนุญาตให้แทรกลงแชท (บอทจะเห็นเมื่อส่ง)')); body.appendChild(visibility);
    body.appendChild(el('div','drw-note','ถ้าไม่ติ๊ก ผลยังแสดงให้คุณดูและคัดลอกได้ แต่จะไม่แทรกลงกล่องข้อความอัตโนมัติ ปุ่มแทรกผลด้านล่างยังใช้ได้เมื่อคุณเลือกเอง'));
    const host = el('div','drw-result-host'); body.appendChild(host);
    if (lastResult) host.appendChild(makeResultBox(lastResult));
  }
  function renderRandom(body) {
    body.appendChild(el('div','drw-section','RANDOM / สุ่มสำหรับเนื้อเรื่อง'));
    const choices = [
      ['เหตุการณ์','พบร่องรอยบางอย่างที่ไม่ควรอยู่ตรงนี้','มีเสียงดังมาจากทางที่มืดที่สุด','คนแปลกหน้าเสนอความช่วยเหลือ','เสบียงชิ้นหนึ่งหายไป','เส้นทางข้างหน้าถูกปิด','พบสถานที่พักชั่วคราว'],
      ['คำใบ้','รอยเท้าที่หยุดกะทันหัน','กลิ่นดอกไม้ในสถานที่ร้าง','ข้อความถูกขีดทับ','วัตถุที่อุ่นทั้งที่อากาศหนาว','เสียงเรียกชื่อจากที่ไกล'],
      ['อารมณ์ฉาก','ตึงเครียด','อบอุ่นชั่วคราว','น่าสงสัย','วุ่นวาย','เศร้าหมอง','ชวนประหลาดใจ'],
    ];
    choices.forEach(([title,...values]) => {
      const card = el('div','drw-table'); card.appendChild(el('div','drw-table-title',title));
      card.appendChild(iconButton('สุ่ม '+title, 'สุ่ม '+title, () => { const value = values[randomInt(values.length)-1]; showResult(`✦ ${title}: ${value}`); })); body.appendChild(card);
    });
    body.appendChild(el('div','drw-divider'));
    body.appendChild(el('div','drw-section','VISIBILITY / การเปิดเผย'));
    body.appendChild(el('div','drw-note','ผลสุ่มจะแสดงเฉพาะในแผงนี้ก่อน คุณเป็นคนเลือกเองว่าจะคัดลอกหรือแทรกลงข้อความให้บอทเห็น ไม่มีการเรียก AI และไม่มีการส่งข้อความอัตโนมัติ'));
    const host = el('div','drw-result-host'); body.appendChild(host); if (lastResult) host.appendChild(makeResultBox(lastResult));
  }
  function renderTables(body) {
    body.appendChild(el('div','drw-section','MY RANDOM TABLES / ตารางสุ่มของฉัน'));
    const title = el('input','drw-field'); title.placeholder = 'ชื่อตาราง เช่น ของที่พบในหีบ'; title.setAttribute('aria-label','ชื่อตาราง'); body.appendChild(title);
    const entries = el('textarea','drw-field'); entries.placeholder = 'ใส่หนึ่งผลลัพธ์ต่อหนึ่งบรรทัด'; entries.rows = 4; entries.style.marginTop = '7px'; entries.setAttribute('aria-label','รายการสุ่ม'); body.appendChild(entries);
    body.appendChild(el('div','drw-row')).appendChild(iconButton('＋ เพิ่มตาราง', 'บันทึกตารางสุ่มใหม่', () => {
      const name = title.value.trim(), values = entries.value.split('\n').map(x=>x.trim()).filter(Boolean);
      if (!name || values.length < 2) { notify('ใส่ชื่อตารางและผลลัพธ์อย่างน้อย 2 รายการ'); return; }
      customTables.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, name, values }); saveTables(); renderPanel('tables'); notify('บันทึกตารางแล้ว');
    }, 'drw-active'));
    body.appendChild(el('div','drw-divider'));
    if (!customTables.length) body.appendChild(el('div','drw-empty','ยังไม่มีตารางสุ่ม\nเพิ่มตารางแรกได้ด้านบน'));
    customTables.forEach(table => {
      const card = el('div','drw-table'); card.appendChild(el('div','drw-table-title',table.name)); card.appendChild(el('div','drw-note',`${table.values.length} รายการ`));
      const row = el('div','drw-row');
      row.appendChild(iconButton('สุ่ม',`สุ่มจาก ${table.name}`,()=>{ const value=table.values[randomInt(table.values.length)-1]; showResult(`✦ ${table.name}: ${value}`); }));
      row.appendChild(iconButton('ลบ','ลบตารางนี้',()=>{ if (!confirm(`ลบตาราง “${table.name}” หรือไม่?`)) return; customTables=customTables.filter(t=>t.id!==table.id); saveTables(); renderPanel('tables'); }));
      card.appendChild(row); body.appendChild(card);
    });
    const host = el('div','drw-result-host'); body.appendChild(host); if (lastResult) host.appendChild(makeResultBox(lastResult));
  }
  function createUI() {
    document.getElementById(ROOT_ID)?.remove(); document.getElementById(ORB_ID)?.remove();
    const orb = el('button','', '✧'); orb.id=ORB_ID; orb.type='button'; orb.title='Dice & Random Wheel'; orb.setAttribute('aria-label','เปิดวงล้อลูกแก้ว'); orb.setAttribute('aria-expanded','false'); orb.addEventListener('click',()=>setOpen(!document.getElementById(ROOT_ID)?.classList.contains('drw-open'))); document.body.appendChild(orb);
    const root=el('section'); root.id=ROOT_ID; root.setAttribute('aria-label','Dice and Random Wheel');
    const head=el('div','drw-head'); const titles=el('div'); titles.appendChild(el('div','drw-heading','DICE & RANDOM')); titles.appendChild(el('div','drw-sub','Browser-side tools · ไม่ใช้โควต้า')); head.append(titles,iconButton('×','ปิด',()=>setOpen(false),'drw-close')); root.appendChild(head);
    const body=el('div','drw-body'); const wrap=el('div','drw-wheel-wrap'); wrap.appendChild(el('div','drw-arc')); wrap.appendChild(el('div','drw-wheel')); wrap.appendChild(el('div','drw-wheel-label')); body.appendChild(wrap); root.appendChild(body); document.body.appendChild(root);
    wrap.addEventListener('pointerdown',e=>{ touchStart={x:e.clientX,y:e.clientY}; });
    wrap.addEventListener('pointerup',e=>{ if(!touchStart)return; const dx=e.clientX-touchStart.x,dy=e.clientY-touchStart.y; touchStart=null; if(Math.abs(dx)>18 && Math.abs(dx)>Math.abs(dy)*.7) rotate(dx<0?1:-1); });
    wrap.addEventListener('pointercancel',()=>touchStart=null);
    document.addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false);});
    renderPanel(panel); positionOrb();
  }
  function init() {
    if (initialized) return;
    initialized=true; addStyles(); createUI();
    window.addEventListener('resize',positionOrb,{passive:true}); window.addEventListener('scroll',positionOrb,{passive:true,capture:true});
    const observer = new MutationObserver(()=>{ if(!document.getElementById(ORB_ID)||!document.getElementById(ROOT_ID)){createUI();} positionOrb(); });
    observer.observe(document.body,{childList:true,subtree:true});
    // Keep the observer reference so a hot reload can cleanly dispose the extension.
    window.__drwObserver?.disconnect(); window.__drwObserver=observer;
  }
  function dispose() { window.__drwObserver?.disconnect(); window.removeEventListener('resize',positionOrb); window.removeEventListener('scroll',positionOrb,true); document.getElementById(ROOT_ID)?.remove(); document.getElementById(ORB_ID)?.remove(); document.getElementById(STYLE_ID)?.remove(); initialized=false; }
  window.__diceRandomWheelDispose?.(); window.__diceRandomWheelDispose=dispose;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
