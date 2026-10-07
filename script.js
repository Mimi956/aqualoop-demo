// script.js
const state = {
  reg: 'India',
  harbor: 'Kochi',
  tab: 'login',
  accounts: {},
  usr: { logged: false, name: '', id: '', bank: { hol: '', nam: '', num: '', ifsc: '' } },
  bal: { India: 12450, PNG: 580 },
  nets: {
    'NET-IN-2026-8842': { id: 'NET-IN-2026-8842', poly: 'Nylon-6', ref: '₹ 4,200', val: 4200, st: 'Active' },
    'NET-PNG-2026-1109': { id: 'NET-PNG-2026-1109', poly: 'HDPE', ref: 'K 190', val: 190, st: 'Active' }
  },
  bounties: [
    { id: 'BTY-01', loc: 'Kochi Sector 4', poly: 'Nylon-6', wt: 85, reward: 4500, cur: '₹' },
    { id: 'BTY-02', loc: 'Vizag Approach', poly: 'HDPE', wt: 140, reward: 7200, cur: '₹' }
  ],
  marketplace: [
    { name: 'Nylon-6 Pellets', qty: '380 MT', price: '₹ 1,72,000', badge: 'Recovered' },
    { name: 'HDPE Net Flakes', qty: '210 MT', price: '₹ 94,500', badge: 'Low Carbon' },
    { name: 'R-PP Granules', qty: '160 MT', price: '₹ 81,200', badge: 'Verified' }
  ]
};

const harbors = { India: ['Kochi', 'Vizag', 'Chennai'], PNG: ['Port Moresby', 'Lae'] };

function switchTab(t) {
  if (t !== 'login' && !state.usr.logged) {
    t = 'login';
  }

  state.tab = t;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('tab-act', 'bg-cyan/20', 'text-cyan'));
  const act = document.getElementById(`tab-${t}`);
  if (act) act.classList.add('tab-act', 'bg-cyan/20', 'text-cyan');

  document.querySelectorAll('.v-pan').forEach(p => p.classList.add('hidden'));
  const pan = document.getElementById(`view-${t}`);
  if (pan) pan.classList.remove('hidden');

  if (t === 'map' && mapObj) setTimeout(() => mapObj.invalidateSize(), 0);
}

function setRegion(r) {
  state.reg = r;
  state.harbor = harbors[r][0];
  const indiaButton = document.getElementById('reg-in');
  const pngButton = document.getElementById('reg-png');
  indiaButton.classList.toggle('bg-cyan/20', r === 'India');
  indiaButton.classList.toggle('text-cyan', r === 'India');
  indiaButton.classList.toggle('text-slate-400', r !== 'India');
  indiaButton.setAttribute('aria-pressed', String(r === 'India'));
  pngButton.classList.toggle('bg-cyan/20', r === 'PNG');
  pngButton.classList.toggle('text-cyan', r === 'PNG');
  pngButton.classList.toggle('text-slate-400', r !== 'PNG');
  pngButton.setAttribute('aria-pressed', String(r === 'PNG'));
  const hSel = document.getElementById('harbor-sel');
  hSel.innerHTML = harbors[r].map(h => `<option value="${h}">${h} Port</option>`).join('');
  hSel.value = state.harbor;
  setHarbor(state.harbor);
  updateUI();
}

function setHarbor(h) {
  state.harbor = h;
  const portLabel = document.getElementById('f-port-lbl');
  if (portLabel) portLabel.textContent = `${h} Harbor (${state.reg})`;
  const hSel = document.getElementById('harbor-sel');
  if (hSel) hSel.value = h;
}

function updateUI() {
  const cur = state.reg === 'India' ? '₹' : 'K';
  document.getElementById('f-bal').textContent = `${cur} ${state.bal[state.reg].toLocaleString()}`;
  document.getElementById('w-bal').textContent = `Available: ${cur} ${state.bal[state.reg].toLocaleString()}`;
  const account = state.usr.bank.num;
  document.getElementById('w-bank-account').textContent = account
    ? `Payout account: ${state.usr.bank.nam} •••• ${account.slice(-4)}`
    : 'Add bank details before withdrawing.';
  const eprBar = document.getElementById('epr-bar');
  if (eprBar) eprBar.style.width = `${Math.min(100, 78 + (state.reg === 'India' ? 0 : 8))}%`;
  renderBounties();
  renderRegistry();
  renderMarketplace();
}

function doScan(id) {
  const beam = document.getElementById('scan-beam');
  const card = document.getElementById('net-card');
  beam.classList.remove('hidden');
  card.classList.add('hidden');

  setTimeout(() => {
    beam.classList.add('hidden');
    const d = state.nets[id];
    if (d) {
      document.getElementById('net-id').textContent = d.id;
      document.getElementById('net-ref').textContent = d.ref;
      card.classList.remove('hidden');
    }
  }, 1000);
}

function claimRefund() {
  const id = document.getElementById('net-id').textContent;
  const d = state.nets[id];
  if (d && d.st === 'Active') {
    d.st = 'Claimed';
    state.bal[state.reg] += d.val;
    updateUI();
    document.getElementById('net-card').classList.add('hidden');
    toast(`Refund of ${d.ref} claimed!`, 'success');
  }
}

function onGhostSub(e) {
  e.preventDefault();
  const wt = parseInt(document.getElementById('gg-wt').value);
  const cur = state.reg === 'India' ? '₹' : 'K';
  state.bounties.unshift({
    id: `BTY-0${state.bounties.length + 1}`,
    loc: document.getElementById('gg-gps').value,
    poly: document.getElementById('gg-type').value,
    wt: wt,
    reward: wt * (state.reg === 'India' ? 65 : 3),
    cur: cur
  });
  renderBounties();
  toast('Bounty reported!', 'success');
}

function renderBounties() {
  const box = document.getElementById('bty-list');
  box.innerHTML = state.bounties.map((b, i) => `
    <div class="p-2.5 bg-oc-900 rounded border border-slate-800 flex justify-between items-center text-xs">
      <div><p class="font-bold text-cyan">${b.id} • ${b.poly}</p><span class="text-[10px] text-slate-400">${b.loc} (${b.wt}kg)</span></div>
      <button onclick="claimBounty(${i})" class="btn-sub bg-cyan/20 text-cyan">${b.cur} ${b.reward}</button>
    </div>
  `).join('');
}

function claimBounty(i) {
  const b = state.bounties[i];
  state.bal[state.reg] += b.reward;
  state.bounties.splice(i, 1);
  updateUI();
  toast('Bounty claimed!', 'success');
}

function onPassGen(e) {
  e.preventDefault();
  const id = `NET-${state.reg === 'India' ? 'IN' : 'PNG'}-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const qrBox = document.getElementById('qrcode');
  qrBox.innerHTML = '';
  new QRCode(qrBox, { text: id, width: 90, height: 90 });
  document.getElementById('qr-id').textContent = id;
  document.getElementById('qr-box').classList.remove('hidden');

  state.nets[id] = { id: id, poly: document.getElementById('m-poly').value, ref: `₹ ${document.getElementById('m-dep').value}`, val: 4500, st: 'Active' };
  renderRegistry();
  toast('Passport minted!', 'success');
}

function renderMarketplace() {
  const box = document.getElementById('mkt-grid');
  if (!box) return;
  box.innerHTML = state.marketplace.map(item => `
    <div class="glass p-4 rounded-2xl space-y-3">
      <div class="flex justify-between items-center">
        <span class="text-[10px] uppercase tracking-[0.2em] text-cyan bg-cyan/10 px-2 py-1 rounded-full">${item.badge}</span>
        <span class="text-[10px] text-slate-400">${item.qty}</span>
      </div>
      <div>
        <h3 class="font-bold text-white">${item.name}</h3>
        <p class="text-xs text-slate-400">Closed-loop circular feedstock</p>
      </div>
      <div class="flex justify-between items-center border-t border-slate-800 pt-3">
        <span class="text-lg font-bold text-white">${item.price}</span>
        <button class="btn-sub bg-emerald-500/15 text-emerald-300">Buy</button>
      </div>
    </div>
  `).join('');
}

function renderRegistry() {
  const tbl = document.getElementById('reg-tbl');
  tbl.innerHTML = Object.values(state.nets).map(n => `
    <tr class="border-b border-slate-800/60"><td class="py-1 text-cyan">${n.id}</td><td>${n.poly}</td><td>${n.ref}</td><td><span class="px-1.5 py-0.5 rounded text-[10px] ${n.st === 'Active' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}">${n.st}</span></td></tr>
  `).join('');
}

function setPortMode(m) {
  const isRegister = m === 'reg';
  document.getElementById('f-log').classList.toggle('hidden', m !== 'log');
  document.getElementById('f-reg').classList.toggle('hidden', !isRegister);
  document.getElementById('p-t-log').classList.toggle('bg-cyan/20', !isRegister);
  document.getElementById('p-t-log').classList.toggle('text-cyan', !isRegister);
  document.getElementById('p-t-log').classList.toggle('text-slate-400', isRegister);
  document.getElementById('p-t-reg').classList.toggle('bg-cyan/20', isRegister);
  document.getElementById('p-t-reg').classList.toggle('text-cyan', isRegister);
  document.getElementById('p-t-reg').classList.toggle('text-slate-400', !isRegister);
  document.getElementById('p-t-log').setAttribute('aria-pressed', String(!isRegister));
  document.getElementById('p-t-reg').setAttribute('aria-pressed', String(isRegister));
}

function onPortalLog(e) {
  e.preventDefault();
  const uid = document.getElementById('log-uid').value.trim();
  const pin = document.getElementById('log-pin').value.trim();
  const account = state.accounts[uid];

  if (!uid || !pin) {
    toast('Enter your fisher ID and PIN to continue.', 'info');
    return;
  }

  if (!account || account.pin !== pin) {
    toast('Invalid fisher ID or PIN. Create an account first.', 'info');
    return;
  }

  login(account.name, uid);
}

function onPortalReg(e) {
  e.preventDefault();
  const name = document.getElementById('reg-nam').value.trim();
  const id = document.getElementById('reg-uid').value.trim();
  const pin = document.getElementById('reg-pin').value.trim();
  const bank = {
    hol: document.getElementById('reg-bank-hol').value.trim(),
    nam: document.getElementById('reg-bank-nam').value.trim(),
    num: document.getElementById('reg-bank-num').value.trim(),
    ifsc: document.getElementById('reg-bank-ifsc').value.trim()
  };
  if (!name || !id || !pin || pin.length < 4 || Object.values(bank).some(value => !value)) {
    toast('Complete all account details and create a 4-digit PIN.', 'info');
    return;
  }
  state.accounts[id] = { name, pin };
  state.usr.bank = bank;
  login(name, id);
}

function login(u, id = u) {
  state.usr.logged = true;
  state.usr.name = u;
  state.usr.id = id;
  document.getElementById('auth-lbl').textContent = `ID: ${u}`;
  document.getElementById('p-act').classList.remove('hidden');
  document.getElementById('f-log').classList.add('hidden');
  document.getElementById('f-reg').classList.add('hidden');
  document.getElementById('p-usr-info').textContent = `Logged in as ${u}`;
  document.getElementById('f-reg').reset();
  document.getElementById('f-log').reset();
  updateUI();
  switchTab('fisher');
  toast(`Welcome ${u}`, 'success');
}

function onLogout() {
  state.usr.logged = false;
  state.usr.name = '';
  state.usr.id = '';
  document.getElementById('auth-lbl').textContent = 'Login';
  document.getElementById('p-act').classList.add('hidden');
  document.getElementById('f-log').classList.remove('hidden');
  switchTab('login');
  toast('Logged out', 'info');
}

function openAuthModal() {
  setPortMode('log');
  switchTab('login');
}

function openModal(id) {
  if (id === 'm-bank') {
    document.getElementById('b-hol').value = state.usr.bank.hol;
    document.getElementById('b-nam').value = state.usr.bank.nam;
    document.getElementById('b-num').value = state.usr.bank.num;
    document.getElementById('b-ifsc').value = state.usr.bank.ifsc;
  }
  if (id === 'm-wdraw') {
    updateUI();
    document.getElementById('w-amt').value = '';
  }
  document.getElementById(id).classList.remove('hidden');
}
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

function onBankSave(e) {
  e.preventDefault();
  const bank = {
    hol: document.getElementById('b-hol').value.trim(),
    nam: document.getElementById('b-nam').value.trim(),
    num: document.getElementById('b-num').value.trim(),
    ifsc: document.getElementById('b-ifsc').value.trim()
  };
  if (Object.values(bank).some(value => !value)) {
    toast('Complete all bank details before saving.', 'info');
    return;
  }
  state.usr.bank = bank;
  updateUI();
  closeModal('m-bank');
  toast('Bank details saved', 'success');
}

function onWithdraw(e) {
  e.preventDefault();
  if (!state.usr.logged) {
    closeModal('m-wdraw');
    openAuthModal();
    toast('Please log in before withdrawing.', 'info');
    return;
  }
  if (!state.usr.bank.hol || !state.usr.bank.nam || !state.usr.bank.num || !state.usr.bank.ifsc) {
    closeModal('m-wdraw');
    openModal('m-bank');
    toast('Add bank details before withdrawing.', 'info');
    return;
  }

  const amt = parseFloat(document.getElementById('w-amt').value);
  if (!Number.isFinite(amt) || amt <= 0) {
    toast('Enter a valid withdrawal amount.', 'info');
    return;
  }
  if (amt > state.bal[state.reg]) {
    toast('Withdrawal exceeds your available balance.', 'info');
    return;
  }

  state.bal[state.reg] -= amt;
  updateUI();
  closeModal('m-wdraw');
  toast('Demo withdrawal recorded; no money was sent to your bank.', 'success');
}

function toast(msg, type = 'info') {
  const box = document.getElementById('toast');
  const el = document.createElement('div');
  el.className = `px-3 py-2 rounded-xl text-xs bg-oc-900 border border-cyan text-cyan shadow-lg`;
  el.textContent = msg;
  box.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

let mapObj = null;
window.onload = function() {
  setRegion('India');
  switchTab('login');
  if (window.L) {
    mapObj = L.map('interactive-map').setView([15.2, 78.2], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapObj);
  }
  new Chart(document.getElementById('chart-m'), {
    type: 'line',
    data: { labels: ['May', 'Jun', 'Jul', 'Aug'], datasets: [{ data: [1800, 2200, 2900, 3400], borderColor: '#00f5d4' }] },
    options: { responsive: true, maintainAspectRatio: false }
  });
  new Chart(document.getElementById('chart-p'), {
    type: 'doughnut',
    data: { labels: ['Nylon', 'HDPE', 'PP'], datasets: [{ data: [60, 25, 15], backgroundColor: ['#00f5d4', '#00bbf9', '#fbbf24'] }] },
    options: { responsive: true, maintainAspectRatio: false }
  });
};