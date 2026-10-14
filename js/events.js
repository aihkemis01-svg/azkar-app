$("L").addEventListener("click", (e) => {
  const c = e.target.closest(".c");
  if (!c) return;
  const i = +c.dataset.i,
    a = e.target.closest("[data-a]")?.dataset.a;
  if (a == "u") {
    delete st.S[mode][i];
    save();
    swap(i);
    vib(10);
  } else if (a == "f") finish(i);
  else hit(i);
});
$("L").addEventListener("keydown", (e) => {
  if ((e.key == "Enter" || e.key == " ") && e.target.classList.contains("c")) {
    e.preventDefault();
    hit(+e.target.dataset.i);
  }
});
$("ch").addEventListener("click", (e) => {
  const b = e.target.closest("[data-s]");
  if (b) $("s" + b.dataset.s).scrollIntoView({ behavior: "smooth", block: "start" });
});
$("bm").onclick = () => {
  mode = "m";
  setQ(0);
  render();
  scrollTo({ top: 0 });
};
$("be").onclick = () => {
  mode = "e";
  setQ(0);
  render();
  scrollTo({ top: 0 });
};
$("bq").onclick = () => {
  setQ(1);
  render();
  scrollTo({ top: 0 });
};
$("th").onclick = () => {
  st.theme = { auto: "light", light: "dark", dark: "auto" }[st.theme];
  save();
  theme();
};
$("gr").onclick = openS;
$("ov").addEventListener("click", (e) => {
  const t = e.target;
  if (t.id == "ov" || t.hasAttribute("data-x")) shut();
  if (t.dataset.th) {
    st.theme = t.dataset.th;
    save();
    theme();
    openS();
  }
  if (t.id == "hl") openL();
  if (t.id == "cp") copy(htx(cur), t);
  if (t.id == "shr") {
    if (navigator.share) navigator.share({ text: htx(cur) }).catch(() => {});
    else copy(htx(cur), t);
  }
});
$("ov").addEventListener("input", (e) => {
  if (e.target.id == "fz") {
    st.fs = +e.target.value;
    save();
    document.documentElement.style.setProperty("--fs", st.fs + "px");
  }
});
$("ov").addEventListener("change", (e) => {
  if (e.target.id == "qj") {
    const j = +e.target.value;
    qask(() => {
      shut();
      qSetPos(JP[j - 1]);
    });
  }
  if (e.target.id == "ncb") {
    st.nc = +e.target.checked;
    save();
    render();
  }
  if (e.target.id == "hdb") {
    st.hide = +e.target.checked;
    save();
    render();
  }
});
addEventListener("keydown", (e) => {
  if (e.key == "Escape") {
    shut();
    hideR();
  }
});
matchMedia("(prefers-color-scheme:dark)").addEventListener?.("change", theme);
