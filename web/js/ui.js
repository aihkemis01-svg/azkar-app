const dark = () => st.theme == "dark" || (st.theme == "auto" && matchMedia("(prefers-color-scheme:dark)").matches);
function theme() {
  const r = document.documentElement;
  st.theme == "auto" ? r.removeAttribute("data-theme") : (r.dataset.theme = st.theme);
  $("th").innerHTML = st.theme == "auto" ? AUTO : st.theme == "dark" ? MOON : SUN;
  $("tc").content = dark() ? "#0a1411" : "#f5efe0";
}
function head() {
  $("gt").textContent = mode == "m" ? "صباح الخير ☀️" : "مساء الخير 🌙";
  try {
    $("dt").textContent =
      new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date()) +
      " · " +
      new Intl.DateTimeFormat("ar", { day: "numeric", month: "long" }).format(new Date());
  } catch (e) {}
}
function render() {
  document.documentElement.style.setProperty("--fs", st.fs + "px");
  document.body.dataset.m = mode;
  document.body.classList.toggle("hs", !!st.hs);
  $("bm").className = mode == "m" && !QV ? "on" : "";
  $("be").className = mode == "e" && !QV ? "on" : "";
  $("bq").className = QV ? "on" : "";
  $("L").className = st.hide ? "hide" : "";
  $("L").innerHTML = D.map((d, i) => {
    const g = G.findIndex((x) => x[0] == i);
    return (
      (g >= 0 ? `<div class="sec" id="s${g}">${G[g][1]}${G[g][2] ? `<small>${G[g][2]}</small>` : ""}</div>` : "") +
      card(i)
    );
  }).join("");
  head();
  prog();
  if (QV) qrender();
  theme();
  document.documentElement.style.setProperty("--bh", $("bar").offsetHeight + 8 + "px");
}
$("bm").innerHTML = SUN + "الصباح";
$("be").innerHTML = MOON + "المساء";
$("gr").innerHTML = SET;
function copy(s, b) {
  const ok = () => {
      b.textContent = "تم النسخ ✓";
    },
    fb = () => {
      const a = document.createElement("textarea");
      a.value = s;
      a.readOnly = true;
      a.style.cssText = "position:fixed;top:0;opacity:0";
      document.body.appendChild(a);
      a.select();
      a.setSelectionRange(0, 99999);
      let k = false;
      try {
        k = document.execCommand("copy");
      } catch (e) {}
      a.remove();
      k ? ok() : prompt("انسخ النص من هنا:", s);
    };
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(s).then(ok, fb);
  else fb();
}
const open = (h) => {
    $("sh").innerHTML = h;
    $("ov").classList.add("on");
  },
  shut = () => $("ov").classList.remove("on");
