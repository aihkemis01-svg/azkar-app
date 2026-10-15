let QV = false,
  rk = 0;
/* حالة الورد: pos = أول صفحة في ورد اليوم، n = عدد الصفحات يوميًا، sel = الصلوات المختارة (٠=الفجر … ٤=العشاء) */
if (!st.q) st.q = { j: 1, d: [0, 0, 0, 0, 0], kh: 0, done: null };
if (!st.qh) st.qh = {};
const BOOK = ic('<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 19V5"/>');
$("bq").innerHTML = BOOK + "القرآن";
const ar = (n) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]),
  PN = ["الفجر", "الظهر", "العصر", "المغرب", "العشاء"],
  PE = ["🌅", "☀️", "🌤️", "🌇", "🌙"],
  QP = 604;
const qjuz = (p) => {
  let j = 1;
  while (j < 30 && JP[j] <= p) j++;
  return j;
};
const qclamp = (v, a, b) => Math.min(b, Math.max(a, Math.round(+v) || a));
(function qmig() {
  const q = st.q;
  if (!Array.isArray(q.d) || q.d.length != 5) q.d = [0, 0, 0, 0, 0];
  if (!q.pos) q.pos = JP[(q.j || 1) - 1] || 1; // ترحيل من النسخة القديمة (جزء كامل في اليوم)
  q.pos = qclamp(q.pos, 1, QP);
  q.n = qclamp(q.n || 20, 1, QP);
  if (!Array.isArray(q.sel) || !q.sel.length) q.sel = [0, 1, 2, 3, 4];
  q.sel = [...new Set(q.sel.map(Number))].filter((k) => k >= 0 && k < 5).sort();
  if (!q.sel.length) q.sel = [0, 1, 2, 3, 4];
  q.j = qjuz(q.pos);
})();
const sk = (h) => {
  let n = 0,
    d = new Date();
  if (!h[dk(d)]) d.setDate(d.getDate() - 1);
  while (h[dk(d)]) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
};
function setQ(v) {
  QV = !!v;
  document.body.classList.toggle("q", QV);
}
/* تقسيم ورد اليوم على الصلوات المختارة فقط — يعيد مصفوفة من ٥ عناصر: [من,إلى] أو null لصلاة غير مختارة */
function qwird(pos = st.q.pos, n = st.q.n, sel = st.q.sel) {
  const e = Math.min(QP, pos + n - 1),
    tot = e - pos + 1,
    m = Math.min(sel.length, tot),
    use = sel.slice(0, m),
    b = Math.floor(tot / m),
    r = tot % m;
  let a = pos;
  const out = [null, null, null, null, null];
  use.forEach((k, x) => {
    const c = b + (x < r ? 1 : 0);
    out[k] = [a, a + c - 1];
    a += c;
  });
  return out;
}
const qend = () => Math.min(QP, st.q.pos + st.q.n - 1);
function qroll() {
  const q = st.q;
  if (q.done && q.done !== today) {
    q.pos = (q.end || qend()) + 1 > QP ? 1 : (q.end || qend()) + 1;
    q.j = qjuz(q.pos);
    q.d = [0, 0, 0, 0, 0];
    q.done = null;
    q.end = null;
    save();
  }
}
/* إعادة ضبط تقدّم اليوم (عند تغيير الإعدادات أو موضع البداية) */
function qreset() {
  const q = st.q;
  if (q.done === today) {
    delete st.qh[today];
    if (q.end == QP && q.kh > 0) q.kh--;
  }
  q.d = [0, 0, 0, 0, 0];
  q.done = null;
  q.end = null;
  q.j = qjuz(q.pos);
}
const qds = (a, b) => {
  const f = PM[a - 1],
    l = PM[b - 1];
  return f[0] == l[0]
    ? `سورة ${SN[f[0] - 1]} · الآيات ${ar(f[1])}–${ar(l[1])}`
    : `من ${SN[f[0] - 1]} ${ar(f[1])} إلى ${SN[l[0] - 1]} ${ar(l[1])}`;
};
const qpw = (c) => (c == 1 ? "صفحة واحدة" : c == 2 ? "صفحتان" : c <= 10 ? ar(c) + " صفحات" : ar(c) + " صفحة");
/* ================= رسوم الصفحة ================= */
const sv = (p, c = "") =>
  `<svg class="qi ${c}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const QI = {
  back: '<path d="M19 12H5M12 5l-7 7 7 7"/>',
  chev: '<path d="M15 6l-6 6 6 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  book: '<path d="M2.5 5.5C5.5 4 9 4.2 12 6.2c3-2 6.5-2.2 9.5-.7V19c-3-1.5-6.5-1.3-9.5.7-3-2-6.5-2.2-9.5-.7z"/><path d="M12 6.2V19.7"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01" stroke-width="2.4"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/>',
  chk: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
};
const ORN =
  '<svg class="orn" viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5.5" y="5.5" width="13" height="13"/><rect x="5.5" y="5.5" width="13" height="13" transform="rotate(45 12 12)"/></g><circle cx="12" cy="12" r="1.6" fill="currentColor"/></svg>';
const oct = (x, y, s) =>
  `<rect x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}"/><rect x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" transform="rotate(45 ${x} ${y})"/>`;
const SKY = `<svg class="qsky" viewBox="0 0 400 210" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1" opacity=".3">${oct(30, 30, 46)}${oct(30, 30, 30)}${oct(30, 30, 16)}${oct(372, 30, 46)}${oct(372, 30, 30)}${oct(372, 30, 16)}</g><g transform="translate(0 128)" fill="currentColor" opacity=".2"><rect x="0" y="58" width="400" height="24"/><rect x="92" y="50" width="216" height="10"/><rect x="168" y="46" width="64" height="14"/><path d="M166 46C166 30 182 22 200 12C218 22 234 30 234 46Z"/><rect x="199.2" y="3" width="1.6" height="10"/><circle cx="200" cy="3.6" r="2.4"/><rect x="112" y="44" width="36" height="8"/><path d="M110 44C110 34 120 29 130 21C140 29 150 34 150 44Z"/><rect x="252" y="44" width="36" height="8"/><path d="M250 44C250 34 260 29 270 21C280 29 290 34 290 44Z"/><rect x="47" y="24" width="10" height="36"/><rect x="43.5" y="34" width="17" height="3.4" rx="1"/><path d="M46 24L52 7L58 24Z"/><rect x="343" y="24" width="10" height="36"/><rect x="339.5" y="34" width="17" height="3.4" rx="1"/><path d="M342 24L348 7L354 24Z"/><path d="M2 58C2 50 8 46 14 41C20 46 26 50 26 58Z"/><path d="M374 58C374 50 380 46 386 41C392 46 398 50 398 58Z"/></g></svg>`;
const BOOKSTAND = `<svg class="qbook" viewBox="0 0 130 104" aria-hidden="true"><path d="M30 96L62 64M98 96L66 64" stroke="#9a6a3a" stroke-width="8" stroke-linecap="round"/><path d="M26 98h78" stroke="#7d5128" stroke-width="6" stroke-linecap="round"/><path d="M14 92c3-15 8-24 17-32M10 80c6 0 10 3 11 8M20 68c6-1 10 2 12 7M116 92c-3-15-8-24-17-32M120 80c-6 0-10 3-11 8M110 68c-6-1-10 2-12 7" stroke="#79ad86" stroke-width="1.8" fill="none" stroke-linecap="round"/><g transform="translate(9.5 1) scale(.85) rotate(-5 65 50)"><rect x="34" y="10" width="64" height="72" rx="6" fill="#1f6b50"/><rect x="28" y="12" width="9" height="72" rx="4" fill="#134e3f"/><rect x="38" y="80" width="60" height="6" rx="2" fill="#f5ecd2"/><rect x="34" y="10" width="64" height="72" rx="6" fill="none" stroke="#d9b45a" stroke-width="2"/><rect x="41" y="17" width="50" height="58" rx="3" fill="none" stroke="#d9b45a" stroke-width="1" opacity=".8"/><g fill="none" stroke="#e8c76a" stroke-width="1.6"><rect x="55" y="33" width="22" height="22"/><rect x="55" y="33" width="22" height="22" transform="rotate(45 66 44)"/></g><circle cx="66" cy="44" r="4" fill="#e8c76a"/></g></svg>`;
const bgd = (id, a, b, c) =>
  `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/>${c ? `<stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/>` : `<stop offset="1" stop-color="${b}"/>`}</linearGradient></defs><rect width="48" height="48" rx="14" fill="url(#${id})"/>`;
const PIC = [
  `<svg viewBox="0 0 48 48">${bgd("pg0", "#dcecf3", "#fdf0da")}<path d="M14 31a10 10 0 0120 0z" fill="#f5a623"/><path d="M24 13v4M13 19l3 3M35 19l-3 3M7 28h4M37 28h4" stroke="#f5a623" stroke-width="2.4" stroke-linecap="round" fill="none"/><path d="M8 34h32" stroke="#6fb2d2" stroke-width="2.6" stroke-linecap="round"/><path d="M14 39h20" stroke="#6fb2d2" stroke-width="2.6" stroke-linecap="round" opacity=".6"/></svg>`,
  `<svg viewBox="0 0 48 48">${bgd("pg1", "#fdf3d8", "#fbe6b8")}<circle cx="24" cy="24" r="8" fill="#f5a01d"/><path d="M24 8v5M24 35v5M8 24h5M35 24h5M12.7 12.7l3.5 3.5M31.8 31.8l3.5 3.5M12.7 35.3l3.5-3.5M31.8 16.2l3.5-3.5" stroke="#f5a01d" stroke-width="2.6" stroke-linecap="round"/></svg>`,
  `<svg viewBox="0 0 48 48">${bgd("pg2", "#fdeadb", "#fad3b5")}<path d="M13 32a11 11 0 0122 0z" fill="#ee8a4b"/><path d="M24 12v4M12.5 17.5l2.8 2.8M35.5 17.5l-2.8 2.8M8 27h4M36 27h4" stroke="#ee8a4b" stroke-width="2.4" stroke-linecap="round" fill="none"/><path d="M9 36h30M15 41h18" stroke="#e3a07a" stroke-width="2.4" stroke-linecap="round"/></svg>`,
  `<svg viewBox="0 0 48 48">${bgd("pg3", "#ffb36b", "#f0705a", "#9b4f9e")}<path d="M15 32a9 9 0 0118 0z" fill="#ffd86b"/><path d="M24 15v3M14.5 19.5l2 2M33.5 19.5l-2 2" stroke="#ffe9a8" stroke-width="2" stroke-linecap="round"/><path d="M6 34h36M10 39h28" stroke="#5b2f7a" stroke-width="2.6" stroke-linecap="round" opacity=".75"/></svg>`,
  `<svg viewBox="0 0 48 48">${bgd("pg4", "#34429f", "#1a2160")}<path d="M29 11a13 13 0 1 0 8 22 10.5 10.5 0 0 1-8-22z" fill="#f6d77a"/><circle cx="13" cy="14" r="1.4" fill="#fff"/><circle cx="35" cy="12" r="1" fill="#fff" opacity=".8"/><circle cx="39" cy="26" r="1.2" fill="#fff" opacity=".7"/><circle cx="12" cy="34" r="1" fill="#fff" opacity=".6"/></svg>`,
];
const QVERSE = "وَرَتِّلِ ٱلۡقُرۡءَانَ تَرۡتِيلًا";
function qrender() {
  qroll();
  const q = st.q,
    por = qwird(),
    act = por.map((p, k) => (p ? k : -1)).filter((k) => k >= 0),
    dn = act.filter((k) => q.d[k]).length,
    nx = act.find((k) => !q.d[k]) ?? -1,
    e = qend(),
    tot = e - q.pos + 1,
    pg = act.reduce((t, k) => t + (q.d[k] ? por[k][1] - por[k][0] + 1 : 0), 0),
    pr = pg / tot,
    split = q.sel.length == 5 ? "بالتساوي" : q.sel.length == 1 ? "بعد " + PN[q.sel[0]] : ar(q.sel.length) + " صلوات",
    C = 163.4;
  $("Q").innerHTML = `<div class="qpage">
<div class="qhero">${SKY}<button class="qback" data-qa="back" aria-label="رجوع">${sv(QI.back)}</button>
<div class="qh"><h1>القرآن الكريم ${sv(QI.book)}</h1><p>وردك اليومي</p><div class="qv">﴿ ${QVERSE} ﴾<small>المزمل : ${ar(4)}</small></div></div></div>
<div class="qcfg">
<button class="qcell" data-qa="p">${sv(QI.chev, "qchev")}<span class="qct"><small>التقسيم على الصلوات</small><b>${split}</b></span><span class="qcic">${sv(QI.cal)}</span></button>
<button class="qcell" data-qa="n">${sv(QI.down, "qchev")}<span class="qct"><small>مقدار الورد اليومي</small><b>${qpw(q.n)}</b></span><span class="qcic">${sv(QI.book)}</span></button>
<button class="qgear" data-qa="all" aria-label="الإعدادات">${sv(QI.gear)}</button>
</div>
<div class="qprog"><div class="qring"><svg viewBox="0 0 64 64"><circle class="tr" cx="32" cy="32" r="26" fill="none" stroke-width="6"/><circle class="fl" cx="32" cy="32" r="26" fill="none" stroke-width="6" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pr)}"/></svg><b>${ar(Math.round(pr * 100))}٪</b></div>
<div class="qpt"><h2>تقدمك اليوم</h2><p>من إجمالي ${qpw(tot)}</p><div class="qbar"><i style="width:${pr * 100}%"></i></div><small>${ar(pg)} من ${ar(tot)} ${tot > 10 ? "صفحة" : "صفحات"}</small></div>${BOOKSTAND}</div>
<div class="qsec"><i></i>${ORN}<h3>وردك بعد كل صلاة</h3>${ORN}<i></i></div>
${act
    .map((k) => {
      const p = por[k],
        c = p[1] - p[0] + 1,
        d = q.d[k];
      return `<div class="qr${d ? " done" : k == nx ? " nx" : ""}" data-k="${k}"><b class="qpn">${PN[k]}</b><span class="qri">${PIC[k]}</span><span class="qsep"></span><div class="qrt"><b>بعد صلاة ${PN[k]}</b><small>${qpw(c)} من القرآن الكريم</small><em>ص ${ar(p[0])}${c > 1 ? "–" + ar(p[1]) : ""}</em></div><button class="qgo">${d ? sv(QI.chk) + "تمّت" : sv(QI.book) + "اقرأ الآن" + sv(QI.chev, "qchev")}</button></div>`;
    })
    .join("")}
<p class="qmeta">${dn == act.length ? "ما شاء الله، أتممت ورد اليوم 🤍 · " : ""}ص ${ar(q.pos)}–${ar(e)} · الجزء ${ar(qjuz(q.pos))}${q.kh ? " · الختمات: " + ar(q.kh) : ""}</p>
<div class="qft"><i></i>${ORN}<span>وما توفيقي إلا بالله</span>${ORN}<i></i></div></div>`;
}
/* ---------- صفحة تخصيص الورد ---------- */
const LEAF =
  '<svg class="lf" viewBox="0 0 40 40" aria-hidden="true"><path d="M6 36C10 24 18 14 32 6" stroke="#79ad86" stroke-width="1.6" fill="none"/><g fill="#8dbb98"><ellipse cx="14" cy="26" rx="6" ry="3" transform="rotate(-50 14 26)"/><ellipse cx="22" cy="18" rx="6" ry="3" transform="rotate(-40 22 18)"/><ellipse cx="29" cy="11" rx="5" ry="2.6" transform="rotate(-30 29 11)"/><ellipse cx="9" cy="31" rx="4" ry="2.2" transform="rotate(-60 9 31)"/></g></svg>';
const CLOCK = sv('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  SAVE = sv('<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v6h7V3M8 21v-7h8v7"/>'),
  XC = sv('<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>');
let qt = null;
const QCP = document.createElement("div");
QCP.id = "qcp";
QCP.className = "qcp";
document.body.appendChild(QCP);
function qsheet() {
  const q = st.q,
    sc = QCP.scrollTop;
  if (!qt) qt = { n: q.n, sel: q.sel.slice(), pos: q.pos };
  const e = Math.min(QP, qt.pos + qt.n - 1),
    por = qt.sel.length ? qwird(qt.pos, qt.n, qt.sel) : null,
    lines = por ? por.map((p, k) => (p ? `بعد ${PN[k]}: ${qpw(p[1] - p[0] + 1)}` : "")).filter(Boolean).join(" · ") : "";
  QCP.innerHTML = `<div class="qcw">
<svg class="qcsky" viewBox="0 0 400 160" preserveAspectRatio="xMidYMin slice" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1" opacity=".3">${oct(26, 26, 46)}${oct(26, 26, 30)}${oct(26, 26, 16)}${oct(374, 26, 46)}${oct(374, 26, 30)}${oct(374, 26, 16)}</g></svg>
<div class="qch">${BOOKSTAND.replace('class="qbook"', 'class="qcbk"')}<div class="qtt"><div class="qtr">${LEAF}<h2>تخصيص ورد القرآن</h2>${LEAF.replace('class="lf"', 'class="lf flip"')}</div><div class="qdv"><i></i>${ORN}<i></i></div></div><button class="qcb" data-c="back" aria-label="رجوع">${sv(QI.back)}</button></div>
<div class="qcard row"><span class="ql">عدد الصفحات يوميًا</span><div class="qstp"><button data-c="m" aria-label="أنقص">−</button><input id="qn" type="number" inputmode="numeric" min="1" max="${QP}" value="${qt.n}"><button data-c="pl" aria-label="زِد">+</button></div></div>
<div class="qcard"><div class="qqh">${CLOCK}<b>متى تقرأ؟</b></div><p class="qhint">اختر الصلوات، وقسّم الصفحات بينها بالتساوي</p><div class="qpch" id="qs">${PN.map((n, k) => `<button data-k="${k}" class="${qt.sel.includes(k) ? "on" : ""}">${n} ${PE[k]}</button>`).join("")}<button data-all="1" class="${qt.sel.length == 5 ? "on" : ""}">بعد كل الصلوات 🕌</button></div></div>
<div class="qcard row"><span class="ql">البدء من صفحة</span><input id="qpg" class="qnum" type="number" inputmode="numeric" min="1" max="${QP}" value="${qt.pos}"></div>
<div class="qpvc">${LEAF.replace('class="lf"', 'class="lf cl"')}${LEAF.replace('class="lf"', 'class="lf cr flip"')}<b>${por ? `ورد اليوم: ص ${ar(qt.pos)} - ${ar(e)} (${qpw(e - qt.pos + 1)})` : "اختر صلاة واحدة على الأقل"}</b><div class="qdv"><i></i>${LEAF.replace('class="lf"', 'class="lf sm"')}<i></i></div><p>${lines}</p></div>
<button class="qsv" data-c="save"${qt.sel.length ? "" : " disabled"}>حفظ ${SAVE}</button><button class="qcn" data-c="cancel">إلغاء ${XC}</button>
<div class="qbt">${LEAF}<i></i>${ORN}<i></i>${LEAF.replace('class="lf"', 'class="lf flip"')}</div></div>`;
  QCP.scrollTop = sc;
}
function qcOpen() {
  qt = null;
  qsheet();
  QCP.scrollTop = 0;
  QCP.classList.add("on");
  document.body.style.overflow = "hidden";
  history.pushState({ c: 1 }, "");
}
function qcHide() {
  QCP.classList.remove("on");
  document.body.style.overflow = "";
  qt = null;
}
function qcClose() {
  if (history.state && history.state.c) history.back();
  else qcHide();
}
QCP.addEventListener("click", (e) => {
  const t = e.target.closest("button"),
    q = st.q;
  if (!t || !qt) return;
  const c = t.dataset.c;
  if (c == "back" || c == "cancel") return qcClose();
  let ch = true;
  if (c == "m") qt.n = qclamp(qt.n - 1, 1, QP);
  else if (c == "pl") qt.n = qclamp(qt.n + 1, 1, QP);
  else if (t.closest("#qs")) {
    if (t.dataset.all) qt.sel = [0, 1, 2, 3, 4];
    else {
      const k = +t.dataset.k;
      qt.sel = qt.sel.includes(k) ? qt.sel.filter((x) => x != k) : [...qt.sel, k].sort();
    }
  } else if (c == "save") {
    if (!qt.sel.length) return;
    if (qt.n != q.n || qt.pos != q.pos || qt.sel.join() != q.sel.join()) {
      q.n = qt.n;
      q.sel = qt.sel;
      q.pos = qt.pos;
      qreset();
    }
    save();
    qrender();
    return qcClose();
  } else ch = false;
  if (ch) qsheet();
});
QCP.addEventListener("change", (e) => {
  if (!qt) return;
  if (e.target.id == "qn") qt.n = qclamp(e.target.value, 1, QP);
  else if (e.target.id == "qpg") qt.pos = qclamp(e.target.value, 1, QP);
  else return;
  qsheet();
});
/* ---------- التنقل: الدخول إلى صفحة القرآن والخروج منها ---------- */
function enterQ() {
  setQ(1);
  render();
  scrollTo({ top: 0 });
  history.pushState({ q: 1 }, "");
}
function leaveQ() {
  setQ(0);
  render();
  scrollTo({ top: 0 });
}
$("bq").onclick = enterQ;
$("Q").addEventListener("click", (e) => {
  const a = e.target.closest("[data-qa]")?.dataset.qa;
  if (a == "back") return history.state && history.state.q ? history.back() : leaveQ();
  if (a) return qcOpen();
  const c = e.target.closest(".qr");
  if (c) openR(+c.dataset.k);
});
function openR(k) {
  rk = k;
  const q = st.q,
    p = qwird()[k];
  if (!p) return;
  $("rt").textContent = `بعد ${PN[k]} · ص ${ar(p[0])}–${ar(p[1])}`;
  let h = "";
  for (let n = p[0]; n <= p[1]; n++)
    h +=
      `<div class="pgs">صفحة ${ar(n)}</div>` +
      Q[n - 1]
        .replace(
          /\{\{S:(\d+)\}\}/g,
          (m, s) =>
            `</span><div class="sn">سورة ${SN[s - 1]}</div>` +
            (s != 1 && s != 9 ? `<div class="bq">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>` : "") +
            "<span>",
        )
        .replace(/﴿([^﴾]*)﴾/g, '<span class="an">$1</span>')
        .replace(/^/, "<span>") +
      "</span>";
  $("rdb").innerHTML = h;
  $("rdb").scrollTop = 0;
  $("rdn").textContent = q.d[k] ? "↺ إلغاء علامة الإتمام" : "✓ تمّت قراءة هذا الورد";
  $("rd").classList.add("on");
  document.body.style.overflow = "hidden";
  history.pushState({ r: 1 }, "");
}
function hideR() {
  $("rd").classList.remove("on");
  document.body.style.overflow = "";
}
function closeR() {
  if (history.state && history.state.r) history.back();
  else hideR();
}
addEventListener("popstate", () => {
  if (QCP.classList.contains("on")) qcHide();
  else if ($("rd").classList.contains("on")) hideR();
  else if (QV) leaveQ();
});
$("rc").onclick = closeR;
$("rm").onclick = () => {
  st.fs = Math.max(16, st.fs - 2);
  save();
  document.documentElement.style.setProperty("--fs", st.fs + "px");
};
$("rp").onclick = () => {
  st.fs = Math.min(40, st.fs + 2);
  save();
  document.documentElement.style.setProperty("--fs", st.fs + "px");
};
$("rdn").onclick = () => {
  const q = st.q,
    act = qwird()
      .map((p, k) => (p ? k : -1))
      .filter((k) => k >= 0);
  let all = false;
  if (q.d[rk]) {
    if (q.done === today) {
      q.done = null;
      delete st.qh[today];
      if (q.end == QP && q.kh > 0) q.kh--;
      q.end = null;
    }
    q.d[rk] = 0;
    vib(10);
  } else {
    q.d[rk] = 1;
    vib([30, 40, 30]);
    burst(innerWidth / 2, innerHeight - 110, 14);
    if (act.every((k) => q.d[k])) {
      all = true;
      q.done = today;
      q.end = qend();
      st.qh[today] = 1;
      if (q.end == QP) q.kh++;
    }
  }
  save();
  closeR();
  qrender();
  if (all) {
    vib([40, 60, 40, 60, 80]);
    burst(innerWidth / 2, innerHeight / 3, 45);
    const fin = q.end == QP,
      nxp = fin ? 1 : q.end + 1;
    setTimeout(
      () =>
        open(
          `<h3>ما شاء الله! أتممت ورد اليوم 🤍</h3><div class="hc" style="margin:8px 0 0;cursor:default"><div class="hd">ص ${ar(q.pos)}–${ar(q.end)} ✓</div><div class="ht" style="font-size:20px">${fin ? "ختمتَ القرآن الكريم، تقبّل الله منك 🎉" : "تقبّل الله منك. غدًا بإذن الله نبدأ من صفحة " + ar(nxp)}</div></div><button class="wide dk" data-x>إغلاق</button>`,
        ),
      500,
    );
  } else {
    const n = document.querySelector(".qp.nx");
    n && n.scrollIntoView({ behavior: "smooth", block: "center" });
  }
};
