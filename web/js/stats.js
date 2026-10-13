/* =====================================================
   الإحصائيات: سجل الإنجاز اليومي + السلاسل + شاشة العرض

   st.log["2026-10-13"] = { m:1, e:1, q:1 }
     m = أتممت أذكار الصباح      e = أتممت أذكار المساء
     q = أتممت ورد القرآن        a = أذكار قديمة (قبل هذه الميزة)

   يتم تحديث السجل تلقائيًا عند كل حفظ للحالة (Stats.sync)
   ===================================================== */

const MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];
const WDAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const WSHORT = ["س", "ح", "ن", "ث", "ر", "خ", "ج"]; // يبدأ الأسبوع بالسبت

/* ---------- أدوات التاريخ ---------- */
const parseDk = (k) => {
  const p = k.split("-").map(Number);
  return new Date(p[0], p[1] - 1, p[2]);
};
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const logOf = (k) => st.log[k] || {};

/* ---------- هل أُنجز اليوم؟ ---------- */
const isAdh = (k) => {
  const e = logOf(k);
  return !!(e.m || e.e || e.a);
};
const doneMode = (m) => D.every((d, i) => (st.S[m][i] ?? d[2]) <= 0);

/* ---------- السلاسل ---------- */
function streakOf(pred) {
  let n = 0,
    d = new Date();
  if (!pred(dk(d))) d = addDays(d, -1);
  while (pred(dk(d))) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}
function bestOf(pred) {
  const days = Object.keys(st.log)
    .filter(pred)
    .map((k) => dn0(parseDk(k)))
    .sort((a, b) => a - b);
  let best = 0,
    run = 0,
    prev = null;
  days.forEach((v) => {
    run = prev !== null && v === prev + 1 ? run + 1 : 1;
    prev = v;
    if (run > best) best = run;
  });
  return best;
}
const streak = () => streakOf(isAdh);
const stxt = (n) =>
  n == 0 ? "ابدأ اليوم" : n == 1 ? "يوم واحد" : n == 2 ? "يومان" : n <= 10 ? n + " أيام" : n + " يومًا";

/* ---------- النسب ---------- */
// أيام الفترة (آخر p يومًا، أو الكل إذا p = 0) بدءًا من أول يوم بدأ فيه التتبع
function spanKeys(p) {
  const end = new Date();
  let start = parseDk(st.t0);
  if (p > 0) {
    const s = addDays(end, -(p - 1));
    if (s > start) start = s;
  }
  const keys = [];
  for (let d = start; d <= end; d = addDays(d, 1)) keys.push(dk(d));
  return keys;
}
// اليوم الحالي لا يُحسب ضمن المقام إلا إذا أُنجز (حتى لا تنخفض النسبة قبل نهاية اليوم)
function ratio(field, p) {
  let n = 0,
    c = 0;
  spanKeys(p).forEach((k) => {
    const ok = !!logOf(k)[field];
    if (k === today && !ok) return;
    n++;
    if (ok) c++;
  });
  return { c, n, pct: n ? Math.round((c / n) * 100) : null };
}
const countAll = (f) => Object.values(st.log).filter((e) => e[f]).length;

const Stats = {
  tab: "o", // o نظرة عامة | w أسبوعي | m شهري
  per: 7, // فترة النسب: 7 | 30 | 0 (الكل)
  wk: 0, // عدد الأسابيع للخلف
  mo: 0, // عدد الأشهر للخلف

  /* تهيئة عند التشغيل */
  init() {
    if (!st.log) st.log = {};
    if (!st.lb) {
      // ترحيل البيانات القديمة مرة واحدة
      Object.keys(st.hist || {}).forEach((k) => {
        if (k === today) return;
        const e = st.log[k] || (st.log[k] = {});
        if (!e.m && !e.e) e.a = 1;
      });
      Object.keys(st.qh || {}).forEach((k) => {
        (st.log[k] || (st.log[k] = {})).q = 1;
      });
      st.lb = 1;
    }
    if (!st.t0) st.t0 = today;
  },

  /* مزامنة سجل اليوم مع الحالة الحالية (تُستدعى من save) */
  sync() {
    if (!st.log) st.log = {};
    const e = st.log[today] || (st.log[today] = {});
    e.m = doneMode("m") ? 1 : 0;
    e.e = doneMode("e") ? 1 : 0;
    e.q = st.qh && st.qh[today] ? 1 : 0;
    if (!e.m && !e.e && !e.q && !e.a) delete st.log[today];
    const ks = Object.keys(st.log);
    if (ks.length > 800) delete st.log[ks[0]];
    Reminders.pushDone();
  },

  /* رسم المحتوى حسب التبويب */
  paint() {
    const views = { o: viewOverview, w: viewWeek, m: viewMonth };
    $("sxv").innerHTML = views[Stats.tab]();
    document.querySelectorAll("#sxt button").forEach((b) => b.classList.toggle("on", b.dataset.sxt === Stats.tab));
  },
};

/* ---------- نظرة عامة ---------- */
function viewOverview() {
  const full = Object.values(st.log).filter((e) => e.m && e.e && e.q).length;
  const tile = (n, t) => `<div class="sx-t"><b>${ar(n)}</b><small>${t}</small></div>`;
  const bar = (ico, name, f) => {
    const r = ratio(f, Stats.per);
    return `<div class="sx-bar"><span>${ico} ${name}</span><div class="sx-track"><i class="${f}" style="width:${r.pct || 0}%"></i></div><b>${r.pct === null ? "—" : ar(r.pct) + "٪"}</b></div>`;
  };
  const per = (p, t) => `<button data-sxp="${p}" class="${Stats.per === p ? "on" : ""}">${t}</button>`;

  let skHtml;
  if (st.hs) {
    skHtml = `<p class="hint">السلسلة مخفية.</p>`;
  } else {
    const row = (name, cur, best) =>
      `<div class="sx-sr"><span>${name}</span><b>${stxt(cur).replace(/\d+/, (n) => ar(n))}</b><small>الأطول: ${ar(best)}</small></div>`;
    skHtml =
      row("الأذكار", streak(), bestOf(isAdh)) +
      row(
        "ورد القرآن",
        qStreak(),
        bestOf((k) => logOf(k).q),
      );
  }
  return `<div class="sx-grid">
    ${tile(countAll("q"), "يومًا أتممت فيه وردك")}
    ${tile(full, "يومًا اكتمل فيه كل شيء")}
    ${tile(countAll("m"), "يومًا أتممت أذكار الصباح")}
    ${tile(countAll("e"), "يومًا أتممت أذكار المساء")}
  </div>
  <div class="sx-sub">نسبة الإنجاز</div>
  <div class="seg sx-per">${per(7, "٧ أيام")}${per(30, "٣٠ يومًا")}${per(0, "الكل")}</div>
  ${bar("☀️", "الصباح", "m")}${bar("🌙", "المساء", "e")}${bar("📖", "الورد", "q")}
  <div class="sx-card">
    <div class="sx-ch"><b>🔥 سلسلة الأيام</b><button class="sx-lnk" id="sxh">${st.hs ? "إظهار" : "إخفاء"}</button></div>
    ${skHtml}
    ${st.hs ? "" : '<p class="hint">الأيام المتتالية التي أتممت فيها الأذكار (صباحًا أو مساءً) أو الورد.</p>'}
  </div>`;
}
const qStreak = () => streakOf((k) => logOf(k).q);

/* ---------- أسبوعي ---------- */
function viewWeek() {
  const end = addDays(new Date(), -7 * Stats.wk);
  const days = [];
  for (let i = 0; i < 7; i++) days.push(addDays(end, -i));
  const first = days[6],
    last = days[0];
  let cm = 0,
    ce = 0,
    cq = 0;
  const rows = days
    .map((d) => {
      const k = dk(d),
        e = logOf(k);
      if (e.m) cm++;
      if (e.e) ce++;
      if (e.q) cq++;
      const chip = (f, ico) => `<i class="${e[f] ? "on" : e.a && f !== "q" ? "on a" : ""}">${ico}</i>`;
      return `<div class="sx-row${k === today ? " now" : ""}"><div class="sx-d"><b>${WDAYS[d.getDay()]}</b><small>${ar(d.getDate())} ${MONTHS[d.getMonth()]}</small></div><div class="sx-c">${chip("m", "☀️")}${chip("e", "🌙")}${chip("q", "📖")}</div></div>`;
    })
    .join("");
  return `<div class="sx-range">${ar(first.getDate())} ${MONTHS[first.getMonth()]} – ${ar(last.getDate())} ${MONTHS[last.getMonth()]}</div>
  <div class="sx-sum"><span>☀️ ${ar(cm)}/٧</span><span>🌙 ${ar(ce)}/٧</span><span>📖 ${ar(cq)}/٧</span></div>
  ${rows}
  <div class="acts"><button class="wide" data-sxw="1">الأسبوع السابق</button><button class="wide" data-sxw="-1" ${Stats.wk ? "" : "disabled"}>الأسبوع التالي</button></div>`;
}

/* ---------- شهري ---------- */
function viewMonth() {
  const now = new Date(),
    base = new Date(now.getFullYear(), now.getMonth() - Stats.mo, 1);
  const y = base.getFullYear(),
    m = base.getMonth(),
    n = new Date(y, m + 1, 0).getDate(),
    lead = (base.getDay() + 1) % 7;
  const todayD = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let cm = 0,
    ce = 0,
    cq = 0,
    cf = 0,
    cells = "";
  for (let i = 0; i < lead; i++) cells += `<div></div>`;
  for (let d = 1; d <= n; d++) {
    const dt = new Date(y, m, d),
      k = dk(dt),
      e = logOf(k);
    if (e.m) cm++;
    if (e.e) ce++;
    if (e.q) cq++;
    const all = e.m && e.e && e.q;
    if (all) cf++;
    const dot = (f) => `<i class="${f}${e[f] ? " on" : e.a && f !== "q" ? " a on" : ""}"></i>`;
    cells += `<div class="sx-cell${all ? " full" : ""}${k === today ? " now" : ""}${dt > todayD ? " fut" : ""}"><b>${ar(d)}</b><span class="dots">${dot("m")}${dot("e")}${dot("q")}</span></div>`;
  }
  return `<div class="sx-range">${MONTHS[m]} ${ar(y)}</div>
  <div class="sx-sum"><span>☀️ ${ar(cm)}</span><span>🌙 ${ar(ce)}</span><span>📖 ${ar(cq)}</span><span>✨ ${ar(cf)}</span></div>
  <div class="sx-cal">${WSHORT.map((w) => `<div class="sx-wd">${w}</div>`).join("")}${cells}</div>
  <p class="hint sx-leg"><i class="m"></i> صباح &nbsp; <i class="e"></i> مساء &nbsp; <i class="q"></i> ورد &nbsp; ✨ يوم مكتمل</p>
  <div class="acts"><button class="wide" data-sxm="1">الشهر السابق</button><button class="wide" data-sxm="-1" ${Stats.mo ? "" : "disabled"}>الشهر التالي</button></div>`;
}

/* ---------- فتح الشاشة ---------- */
function openStats() {
  Stats.tab = "o";
  Stats.wk = 0;
  Stats.mo = 0;
  open(`<h3>📊 إحصائيات الإنجاز</h3>
    <div class="seg sx-tabs" id="sxt"><button data-sxt="o">نظرة عامة</button><button data-sxt="w">أسبوعي</button><button data-sxt="m">شهري</button></div>
    <div id="sxv"></div>
    <button class="wide dk" data-x>إغلاق</button>`);
  Stats.paint();
}

/* ---------- الأحداث ---------- */
$("sx").innerHTML = ic('<path d="M4 20V11M10 20V4M16 20v-6M22 20H2"/>');
document.querySelector(".stk").onclick = openStats;

$("ov").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  const d = b.dataset;
  if (b.id === "sxo") openStats();
  else if (d.sxt) {
    Stats.tab = d.sxt;
    Stats.paint();
  } else if (d.sxp !== undefined) {
    Stats.per = +d.sxp;
    Stats.paint();
  } else if (d.sxw) {
    Stats.wk = Math.max(0, Stats.wk + +d.sxw);
    Stats.paint();
  } else if (d.sxm) {
    Stats.mo = Math.max(0, Stats.mo + +d.sxm);
    Stats.paint();
  } else if (b.id === "sxh") {
    st.hs = st.hs ? 0 : 1;
    save();
    render();
    Stats.paint();
  }
});
$("sx").onclick = openStats;
$("ov").addEventListener("change", (e) => {
  if (e.target.id === "hsb") {
    st.hs = +e.target.checked;
    save();
    render();
  }
});
