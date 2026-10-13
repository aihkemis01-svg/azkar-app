const txt = (d) => {
  if (mode == "m" || !d[3]) return d[0];
  if (d[3] === 1) return R.reduce((t, r) => t.split(r[0]).join(r[1]), d[0]);
  return d[3];
};
const left = (i) => st.S[mode][i] ?? D[i][2],
  allDone = () => D.every((d, i) => left(i) <= 0);
const hIdx = () => (((dn0(new Date()) - st.h0) % H.length) + H.length) % H.length;
const nm = (n) => {
  const s = n.slice(-1),
    f = /[\^*%]/.test(s);
  return (
    "عن " +
    (f ? n.slice(0, -1) : n) +
    " رضي الله " +
    (s == "^" ? "عنها" : s == "*" ? "عنهما" : s == "%" ? "عنهم" : "عنه")
  );
};
const hH = (i) => {
  const h = H[i];
  return `<div class="hn">الحديث ${i + 1} من ${H.length}</div><div class="ht">${h[1]}</div><div class="hr">${nm(h[0])}</div><div class="hs">${SRC[h[2]]}</div>${h[3] ? `<div class="hnt">${h[3]}</div>` : ""}`;
};
const htx = (i) => `«${H[i][1]}»\n${nm(H[i][0])} — ${SRC[H[i][2]]}`;
function card(i) {
  const d = D[i],
    l = left(i),
    dn = l <= 0,
    rep = d[2],
    k = K[i],
    bt = i == 0 ? txt(d).replace(/^بسم الله الرحمن الرحيم\.\s*/, "") : txt(d),
    bs = i == 0 ? '<div class="bsm">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>' : "";
  const b = dn
    ? `<button class="fin undo" data-a="u">تراجع ↺</button>`
    : `<button class="fin" data-a="f">✓ إتمام</button>${rep > 1 && !st.nc ? `<button class="tap" data-a="t" style="--p:${((rep - l) / rep) * 100}%"><span>${l}</span></button>` : ""}`;
  return `<section class="c${dn ? " done" : ""}" id="c${i}" data-i="${i}"${k ? ` data-k="${k}"` : ""} role="button" tabindex="0"><div class="h"><span class="n">${dn ? "✓" : i + 1}</span>${d[1] ? `<span class="s">${d[1]}</span>` : ""}<span class="rep">${rep > 1 ? "التكرار ×" + rep : ""}</span></div>${bs}<div class="t">${bt}</div><div class="f">${b}</div></section>`;
}
function hcard() {
  const u = st.hist[today],
    e = $("hc");
  if (u) {
    e.className = "hc on";
    e.innerHTML = `<div class="hd">✨ حديث اليوم</div>${hH(u - 1)}`;
    e.onclick = () => openH(false);
  } else {
    const r = D.filter((d, i) => left(i) > 0).length;
    e.className = "hc";
    e.onclick = null;
    e.innerHTML = `<div class="lk"><span class="lock">🔒</span><b>حديث اليوم ينتظرك</b><small>أتمم أذكار ${mode == "m" ? "الصباح" : "المساء"} لتفتحه — بقي ${r} من ${D.length}</small></div>`;
  }
}
function prog() {
  let tot = 0,
    dn = 0,
    it = 0;
  D.forEach((d, i) => {
    const l = Math.max(0, left(i));
    tot += d[2];
    dn += d[2] - l;
    if (!l) it++;
  });
  const p = dn / tot;
  $("pg").style.width = p * 100 + "%";
  $("rg").style.strokeDashoffset = 138.2 * (1 - p);
  $("pc").textContent = Math.round(p * 100) + "%";
  $("ttl").textContent = mode == "m" ? "أذكار الصباح" : "أذكار المساء";
  $("sb").textContent = `أُنجز ${it} من ${D.length} ذكرًا`;
  $("sb2").textContent = it == D.length ? "ما شاء الله، أتممتها 🤍" : "اضغط على البطاقة لتبدأ";
  $("hint").textContent = st.nc ? "اضغط على البطاقة لإتمام الذكر" : "اضغط على البطاقة لإنقاص العدّ";
  $("ch").innerHTML = G.map((g, gi) => {
    let n = 0,
      c = 0;
    for (let i = g[0]; i < gEnd(gi); i++) {
      n++;
      if (left(i) <= 0) c++;
    }
    return `<button data-s="${gi}" class="${c == n ? "ok" : ""}">${g[3]}<b>${c}/${n}</b></button>`;
  }).join("");
  hcard();
}
const swap = (i) => {
  $("c" + i).outerHTML = card(i);
  prog();
};
function finish(i) {
  if (left(i) <= 0) return;
  st.S[mode][i] = 0;
  save();
  swap(i);
  const e = $("c" + i);
  e.classList.add("pop");
  const r = e.getBoundingClientRect();
  burst(r.right - 30, r.top + 20, 10);
  vib([30, 40, 30]);
  if (allDone()) return celebrate();
  const n = $("c" + (i + 1)),
    g = G.find((x) => x[0] == i + 1);
  setTimeout(() => (g ? $("s" + G.indexOf(g)) : n)?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
}
function hit(i) {
  const l = left(i);
  if (l <= 0) return;
  if (st.nc || l == 1) return finish(i);
  st.S[mode][i] = l - 1;
  save();
  swap(i);
  $("c" + i)
    .querySelector(".tap")
    .classList.add("bump");
  vib(12);
}
function celebrate() {
  if (!st.hist[today]) st.hist[today] = hIdx() + 1;
  const k = Object.keys(st.hist);
  if (k.length > 400) delete st.hist[k[0]];
  save();
  prog();
  vib([40, 60, 40, 60, 80]);
  burst(innerWidth / 2, innerHeight / 3, 45);
  setTimeout(() => openH(true), 700);
}
