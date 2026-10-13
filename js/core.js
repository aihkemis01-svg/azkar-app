const $ = (i) => document.getElementById(i),
  dk = (d = new Date()) => d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(),
  today = dk(),
  dn0 = (d) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
const ic = (p) => `<svg class="i" viewBox="0 0 24 24">${p}</svg>`;
const SUN = ic(
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  ),
  MOON = ic('<path d="M21 13A9 9 0 1111 3a7 7 0 0010 10z"/>'),
  SET = ic('<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>'),
  AUTO = ic('<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 010 18z" fill="currentColor"/>');
let mode = new Date().getHours() < 15 ? "m" : "e",
  st = {
    fs: 24,
    nc: 0,
    hide: 0,
    theme: "auto",
    S: { m: {}, e: {} },
    day: today,
    hist: {},
    h0: null,
  },
  cur = 0;
try {
  Object.assign(st, JSON.parse(localStorage.getItem("azkar5") || "{}"));
} catch (e) {}
if (st.day !== today) {
  st.S = { m: {}, e: {} };
  st.day = today;
}
if (st.h0 == null) st.h0 = dn0(new Date());
const save = () => {
  try {
    localStorage.setItem("azkar5", JSON.stringify(st));
  } catch (e) {}
};
const vib = (p) => {
  try {
    navigator.vibrate && navigator.vibrate(p);
  } catch (e) {}
};
function burst(x, y, n) {
  for (let k = 0; k < n; k++) {
    const p = document.createElement("i"),
      a = Math.random() * 6.28,
      v = 40 + Math.random() * 90;
    p.className = "cf";
    p.style.cssText = `left:${x}px;top:${y}px;--x:${Math.cos(a) * v}px;--y:${Math.sin(a) * v - 30}px;background:${["#72cbb3", "#f2c14e", "#e98a7c", "#7fb6e8"][k % 4]}`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 900);
  }
}
