let QV = false,
  rk = 0,
  qpend = null;
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
/* ===== إعدادات الورد: المقدار اليومي + التقسيم على الصلوات ===== */
const QP = 604,
  clampN = (v, a, b, f) => {
    v = Math.round(+v);
    return isFinite(v) ? Math.max(a, Math.min(b, v)) : f;
  },
  juzOf = (p) => {
    let j = 1;
    for (let i = 0; i < 30; i++) if (p >= JP[i]) j = i + 1;
    return j;
  },
  pgw = (n) => (n === 1 ? "صفحة واحدة" : n === 2 ? "صفحتان" : n <= 10 ? ar(n) + " صفحات" : ar(n) + " صفحة"),
  has604 = (p) => p.n > 0 && (p.e < p.s || p.e === QP),
  actK = (w) => w.plan.map((p, k) => (p.n > 0 ? k : -1)).filter((k) => k >= 0);
/* يبني خطة اليوم: تُقسَّم الصفحات على الصلوات المختارة، والباقي يذهب للأوائل */
function qmake(w) {
  const ids = w.mode === "equal" ? [0, 1, 2, 3, 4] : [0, 1, 2, 3, 4].filter((i) => w.act[i]),
    m = ids.length || 5,
    b = Math.floor(w.amount / m),
    r = w.amount % m;
  let off = 0;
  return [0, 1, 2, 3, 4].map((i) => {
    const k = ids.indexOf(i),
      n = k < 0 ? 0 : b + (k < r ? 1 : 0);
    if (!n) return { n: 0 };
    const s = ((w.pos - 1 + off) % QP) + 1,
      e = ((w.pos - 1 + off + n - 1) % QP) + 1;
    off += n;
    return { s, e, n };
  });
}
function qw() {
  const q = st.q;
  if (!q.w) {
    /* ترحيل من النظام القديم (جزء كامل لكل يوم) مع الحفاظ على التقدّم */
    if (q.done && q.done !== today) {
      q.j = (q.j % 30) + 1;
      q.d = [0, 0, 0, 0, 0];
      q.done = null;
    }
    q.w = { amount: 20, mode: "equal", act: [1, 1, 1, 1, 1], pos: JP[(q.j || 1) - 1], date: today, plan: null };
  }
  const w = q.w;
  w.amount = clampN(w.amount, 1, QP, 20);
  w.pos = clampN(w.pos, 1, QP, 1);
  if (!Array.isArray(w.act) || w.act.length !== 5 || !w.act.some(Boolean)) w.act = [1, 1, 1, 1, 1];
  if (w.date !== today) {
    /* يوم جديد: نبدأ من أول صفحة لم تُقرأ، فلا يضيع شيء */
    if (w.plan) {
      const i = w.plan.findIndex((p, k) => p.n > 0 && !q.d[k]);
      if (i >= 0) w.pos = w.plan[i].s;
      else {
        const L = [...w.plan].reverse().find((p) => p.n > 0);
        if (L) w.pos = (L.e % QP) + 1;
      }
    }
    w.plan = null;
    q.d = [0, 0, 0, 0, 0];
    q.done = null;
    w.date = today;
  }
  if (!w.plan) {
    w.plan = qmake(w);
    save();
  }
  const f = w.plan.find((p) => p.n > 0);
  if (f) q.j = juzOf(f.s);
  return w;
}
function qreset() {
  const w = qw();
  w.plan = qmake(w);
  st.q.d = [0, 0, 0, 0, 0];
  if (st.q.done === today) delete st.qh[today];
  st.q.done = null;
  save();
}
function qSetPos(p) {
  qw().pos = clampN(p, 1, QP, 1);
  qreset();
  if (QV) qrender();
}
/* يسأل قبل أي تغيير يعيد ضبط تقدّم اليوم */
function qask(fn) {
  if (!st.q.d.some(Boolean)) return fn();
  qpend = fn;
  open(
    `<h3>تغيير إعدادات الورد</h3><p class="hint">سيُعاد ضبط تقدّم ورد اليوم الحالي. هل تريد المتابعة؟</p><button class="wide dk" id="qy">متابعة</button><button class="wide" data-x>إلغاء</button>`,
  );
}
const qd1 = (a, b) => {
  const f = PM[a - 1],
    l = PM[b - 1];
  return f[0] == l[2]
    ? `سورة ${SN[f[0] - 1]} · الآيات ${ar(f[1])}–${ar(l[3])}`
    : `من ${SN[f[0] - 1]} ${ar(f[1])} إلى ${SN[l[2] - 1]} ${ar(l[3])}`;
};
const qds = (p) => (p.e >= p.s ? qd1(p.s, p.e) : qd1(p.s, QP) + "<br>ثم " + qd1(1, p.e)),
  qrg = (p) =>
    p.e >= p.s
      ? p.s === p.e
        ? `ص ${ar(p.s)}`
        : `ص ${ar(p.s)} – ${ar(p.e)}`
      : `ص ${ar(p.s)}${p.s < QP ? " – " + ar(QP) : ""} ثم ${ar(1)}${p.e > 1 ? " – " + ar(p.e) : ""}`;
function qrender() {
  const q = st.q,
    w = qw(),
    pl = w.plan,
    ak = actK(w),
    dn = ak.filter((k) => q.d[k]).length,
    nx = ak.find((k) => !q.d[k]) ?? -1,
    tot = pl.reduce((t, p) => t + p.n, 0),
    pg = pl.reduce((t, p, k) => t + (q.d[k] ? p.n : 0), 0),
    pr = tot ? pg / tot : 0,
    am = [...new Set([...Array.from({ length: 30 }, (_, i) => i + 1), 35, 40, 45, 50, 60, 80, 100, w.amount])].sort((a, b) => a - b);
  $("Q").innerHTML =
    `<div class="qc"><h2>ورد اليوم: الجزء ${ar(q.j)}</h2><small>${ar(dn)} من ${ar(ak.length)} مقاطع · ${ar(pg)} من ${ar(tot)} صفحة${q.kh ? ` · الختمات: ${ar(q.kh)}` : ""}</small><div class="qbar"><i style="width:${pr * 100}%"></i></div></div>` +
    `<div class="qcfg"><label class="qsel"><small>مقدار الورد اليومي</small><select id="qa">${am.map((n) => `<option value="${n}"${n === w.amount ? " selected" : ""}>${pgw(n)}</option>`).join("")}</select></label><label class="qsel"><small>التقسيم على الصلوات</small><select id="qm"><option value="equal"${w.mode === "equal" ? " selected" : ""}>بالتساوي</option><option value="custom"${w.mode === "custom" ? " selected" : ""}>حسب اختياري</option></select></label><button class="ib" id="qg" aria-label="إعدادات الورد">${SET}</button></div>` +
    (w.mode === "custom"
      ? `<div class="qchips">${PN.map((n, i) => `<button class="${w.act[i] ? "on" : ""}" data-pr="${i}">${n}</button>`).join("")}</div>`
      : "") +
    `<p class="hint">ختمة كل ${ar(Math.ceil(QP / w.amount))} يومًا تقريبًا</p>` +
    pl
      .map((p, k) =>
        p.n
          ? `<div class="qp${q.d[k] ? " done" : k == nx ? " nx" : ""}" data-k="${k}"><span class="pi">${PE[k]}</span><div class="qt"><b>${PN[k]}</b><small>${qrg(p)} (${pgw(p.n)})<br>${qds(p)}</small></div><button class="go">${q.d[k] ? "✓ تمّ" : "اقرأ"}</button></div>`
          : `<div class="qp off"><span class="pi">${PE[k]}</span><div class="qt"><b>${PN[k]}</b><small>لا ورد بعد هذه الصلاة</small></div></div>`,
      )
      .join("") +
    `<p class="hint">اقرأ بعد كل صلاة مقطعها، فتختم القرآن في ${ar(Math.ceil(QP / w.amount))} يومًا بإذن الله</p>`;
  $("gt").textContent = "كتاب الله 📖";
  $("ttl").textContent = "ورد القرآن";
  $("sb").textContent = `الورد اليومي: ${pgw(w.amount)}`;
  $("sb2").textContent = tot && dn == ak.length ? "ما شاء الله، أتممت ورد اليوم 🤍" : nx >= 0 ? `التالي: ${PN[nx]}` : "";
  $("pc").textContent = Math.round(pr * 100) + "%";
  $("rg").style.strokeDashoffset = 138.2 * (1 - pr);
  $("pg").style.width = pr * 100 + "%";
}
function openQS() {
  const w = qw(),
    f = w.plan.find((p) => p.n > 0);
  open(
    `<h3>إعدادات الورد</h3><div class="ro"><span>صفحة بداية القراءة (١–٦٠٤)</span><input type="number" id="qpos" min="1" max="${QP}" value="${f ? f.s : w.pos}" inputmode="numeric"></div><button class="wide" id="qps">حفظ الصفحة</button><div class="ro"><span>البدء من جزء</span><select id="qj">${Array.from({ length: 30 }, (_, i) => `<option value="${i + 1}"${st.q.j == i + 1 ? " selected" : ""}>${ar(i + 1)}</option>`).join("")}</select></div><button class="wide dk" data-x>إغلاق</button>`,
  );
}
$("Q").addEventListener("click", (e) => {
  if (e.target.closest("#qg")) return openQS();
  const b = e.target.closest("[data-pr]");
  if (b) {
    const w = qw(),
      i = +b.dataset.pr;
    if (w.act[i] && w.act.filter(Boolean).length === 1) return;
    return qask(() => {
      w.act[i] = w.act[i] ? 0 : 1;
      qreset();
      qrender();
    });
  }
  const c = e.target.closest(".qp[data-k]");
  if (c) openR(+c.dataset.k);
});
$("Q").addEventListener("change", (e) => {
  const id = e.target.id;
  if (id != "qa" && id != "qm") return;
  const v = e.target.value;
  qask(() => {
    const w = qw();
    if (id == "qa") w.amount = clampN(v, 1, QP, 20);
    else w.mode = v == "custom" ? "custom" : "equal";
    qreset();
    qrender();
  });
  if (!qpend) return;
});
$("ov").addEventListener("click", (e) => {
  const t = e.target;
  if (t.id == "qy") {
    const f = qpend;
    qpend = null;
    shut();
    f && f();
  } else if ((t.id == "ov" || t.hasAttribute("data-x")) && qpend) {
    qpend = null;
    if (QV) qrender();
  } else if (t.id == "qps") {
    const v = parseInt($("qpos").value, 10);
    if (!(v >= 1 && v <= QP)) {
      $("qpos").focus();
      return;
    }
    qask(() => {
      shut();
      qSetPos(v);
    });
  }
});
function openR(k) {
  rk = k;
  const p = qw().plan[k];
  $("rt").textContent = `${PN[k]} · ${qrg(p)}`;
  let h = "";
  for (let i = 0; i < p.n; i++) {
    const n = ((p.s - 1 + i) % QP) + 1;
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
  }
  $("rdb").innerHTML = h;
  $("rdb").scrollTop = 0;
  $("rdn").textContent = st.q.d[k] ? "↺ إلغاء علامة الإتمام" : "✓ تمّت قراءة هذا الورد";
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
  const q = st.q,
    w = qw(),
    p = w.plan[rk];
  let all = false;
  if (q.d[rk]) {
    if (q.done === today) {
      q.done = null;
      delete st.qh[today];
    }
    if (has604(p) && q.kh > 0) q.kh--;
    q.d[rk] = 0;
    vib(10);
  } else {
    q.d[rk] = 1;
    if (has604(p)) q.kh++;
    vib([30, 40, 30]);
    burst(innerWidth / 2, innerHeight - 110, 14);
    if (actK(w).every((k) => q.d[k])) {
      all = true;
      q.done = today;
      st.qh[today] = 1;
    }
  }
  save();
  closeR();
  qrender();
  if (all) {
    const L = [...w.plan].reverse().find((x) => x.n > 0),
      fin = w.plan.some((x, k) => q.d[k] && has604(x));
    vib([40, 60, 40, 60, 80]);
    burst(innerWidth / 2, innerHeight / 3, 45);
    setTimeout(
      () =>
        open(
          `<h3>ما شاء الله! أتممت ورد اليوم 🤍</h3><div class="hc" style="margin:8px 0 0;cursor:default"><div class="hd">${pgw(w.amount)} ✓</div><div class="ht" style="font-size:20px">${fin ? "ختمتَ القرآن الكريم، تقبّل الله منك 🎉" : "تقبّل الله منك. غدًا بإذن الله نكمل من صفحة " + ar((L.e % QP) + 1)}</div></div><button class="wide dk" data-x>إغلاق</button>`,
        ),
      500,
    );
  } else {
    const n = document.querySelector(".qp.nx");
    n && n.scrollIntoView({ behavior: "smooth", block: "center" });
  }
};
