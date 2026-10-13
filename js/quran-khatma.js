let QV = false,
  rk = 0;
if (!st.q) st.q = { j: 1, d: [0, 0, 0, 0, 0], kh: 0, done: null };
if (!st.qh) st.qh = {};
const BOOK = ic('<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 19V5"/>');
$("bq").innerHTML = BOOK + "القرآن";
const ar = (n) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]),
  PN = ["الفجر", "الظهر", "العصر", "المغرب", "العشاء"],
  PE = ["🌅", "☀️", "🌤️", "🌇", "🌙"];
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
function qpor(j) {
  const s = JP[j - 1],
    e = JP[j] - 1,
    n = e - s + 1,
    b = Math.floor(n / 5),
    r = n % 5;
  let a = s;
  return [0, 1, 2, 3, 4].map((k) => {
    const c = b + (k < r ? 1 : 0),
      o = [a, a + c - 1];
    a += c;
    return o;
  });
}
function qroll() {
  const q = st.q;
  if (q.done && q.done !== today) {
    q.j = (q.j % 30) + 1;
    q.d = [0, 0, 0, 0, 0];
    q.done = null;
    save();
  }
}
const qds = (a, b) => {
  const f = PM[a - 1],
    l = PM[b - 1];
  return f[0] == l[0]
    ? `سورة ${SN[f[0] - 1]} · الآيات ${ar(f[1])}–${ar(l[1])}`
    : `من ${SN[f[0] - 1]} ${ar(f[1])} إلى ${SN[l[0] - 1]} ${ar(l[1])}`;
};
function qrender() {
  qroll();
  const q = st.q,
    por = qpor(q.j),
    dn = q.d.filter(Boolean).length,
    nx = q.d.indexOf(0);
  const tot = por[4][1] - por[0][0] + 1,
    pg = por.reduce((t, p, k) => t + (q.d[k] ? p[1] - p[0] + 1 : 0), 0),
    pr = pg / tot;
  $("Q").innerHTML =
    `<div class="qc"><h2>ورد اليوم: الجزء ${ar(q.j)}</h2><small>${ar(dn)} من ٥ مقاطع · ${ar(pg)} من ${ar(tot)} صفحة${q.kh ? ` · الختمات: ${ar(q.kh)}` : ""}</small><div class="qbar"><i style="width:${pr * 100}%"></i></div></div>` +
    por
      .map(
        (p, k) =>
          `<div class="qp${q.d[k] ? " done" : k == nx ? " nx" : ""}" data-k="${k}"><span class="pi">${PE[k]}</span><div class="qt"><b>${PN[k]}</b><small>ص ${ar(p[0])} – ${ar(p[1])} (${ar(p[1] - p[0] + 1)} صفحات)<br>${qds(p[0], p[1])}</small></div><button class="go">${q.d[k] ? "✓ تمّ" : "اقرأ"}</button></div>`,
      )
      .join("") +
    `<p class="hint">اقرأ بعد كل صلاة مقطعًا واحدًا، فتختم القرآن في ٣٠ يومًا بإذن الله</p>`;
  $("gt").textContent = "كتاب الله 📖";
  $("ttl").textContent = "ورد القرآن";
  $("sb").textContent = `الجزء ${ar(q.j)} من ٣٠`;
  $("sb2").textContent = dn == 5 ? "ما شاء الله، أتممت ورد اليوم 🤍" : nx >= 0 ? `التالي: ${PN[nx]}` : "";
  $("pc").textContent = Math.round(pr * 100) + "%";
  $("rg").style.strokeDashoffset = 138.2 * (1 - pr);
  $("pg").style.width = pr * 100 + "%";
}
$("Q").addEventListener("click", (e) => {
  const c = e.target.closest(".qp");
  if (c) openR(+c.dataset.k);
});
function openR(k) {
  rk = k;
  const q = st.q,
    p = qpor(q.j)[k];
  $("rt").textContent = `${PN[k]} · ص ${ar(p[0])}–${ar(p[1])}`;
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
addEventListener("popstate", hideR);
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
  const q = st.q;
  let all = false;
  if (q.d[rk]) {
    if (q.done === today) {
      q.done = null;
      delete st.qh[today];
      if (q.j == 30 && q.kh > 0) q.kh--;
    }
    q.d[rk] = 0;
    vib(10);
  } else {
    q.d[rk] = 1;
    vib([30, 40, 30]);
    burst(innerWidth / 2, innerHeight - 110, 14);
    if (q.d.every(Boolean)) {
      all = true;
      q.done = today;
      st.qh[today] = 1;
      if (q.j == 30) q.kh++;
    }
  }
  save();
  closeR();
  qrender();
  if (all) {
    vib([40, 60, 40, 60, 80]);
    burst(innerWidth / 2, innerHeight / 3, 45);
    setTimeout(
      () =>
        open(
          `<h3>ما شاء الله! أتممت ورد اليوم 🤍</h3><div class="hc" style="margin:8px 0 0;cursor:default"><div class="hd">الجزء ${ar(q.j)} ✓</div><div class="ht" style="font-size:20px">${q.j == 30 ? "ختمتَ القرآن الكريم، تقبّل الله منك 🎉" : "تقبّل الله منك. غدًا بإذن الله: الجزء " + ar(q.j + 1)}</div></div><button class="wide dk" data-x>إغلاق</button>`,
        ),
      500,
    );
  } else {
    const n = document.querySelector(".qp.nx");
    n && n.scrollIntoView({ behavior: "smooth", block: "center" });
  }
};
