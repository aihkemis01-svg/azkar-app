function openH(f) {
  cur = (st.hist[today] || hIdx() + 1) - 1;
  open(
    `${f ? "<h3>تقبّل الله طاعتك 🤍</h3>" : ""}<div class="hc"><div class="hd">✨ حديث اليوم</div>${hH(cur)}</div><div class="acts"><button class="wide" id="cp">نسخ</button><button class="wide" id="shr">مشاركة</button></div><div class="ro"><span>ورد القرآن: الجزء الحالي</span><select id="qj">${Array.from({ length: 30 }, (_, i) => `<option value="${i + 1}"${st.q.j == i + 1 ? " selected" : ""}>${i + 1}</option>`).join("")}</select></div><button class="wide" id="hl">أحاديثي السابقة</button><button class="wide dk" data-x>إغلاق</button>`,
  );
}
function openL() {
  const e = Object.entries(st.hist).reverse();
  open(
    `<h3>أحاديثي (${e.length})</h3>${e.length ? e.map(([d, v]) => `<details><summary><b>${v}</b><span>${H[v - 1][1]}</span></summary><div class="hc">${hH(v - 1)}</div></details>`).join("") : '<p class="hint">أتمم أذكارك لتبدأ مجموعتك من الأحاديث</p>'}<button class="wide dk" data-x>إغلاق</button>`,
  );
}
function openS() {
  open(`<h3>الإعدادات</h3><div class="ro"><span>حجم الخط</span><input type="range" id="fz" min="16" max="40" step="2" value="${st.fs}"></div>
<div class="ro"><span>المظهر</span><div class="seg"><button data-th="auto" class="${st.theme == "auto" ? "on" : ""}">تلقائي</button><button data-th="light" class="${st.theme == "light" ? "on" : ""}">نهاري</button><button data-th="dark" class="${st.theme == "dark" ? "on" : ""}">ليلي</button></div></div>
<label class="ro"><span>إتمام بدون عدّ</span><input type="checkbox" class="sw" id="ncb" ${st.nc ? "checked" : ""}></label>
<label class="ro"><span>إخفاء الأذكار المنجزة</span><input type="checkbox" class="sw" id="hdb" ${st.hide ? "checked" : ""}></label>
<button class="wide" id="hl">أحاديثي السابقة</button><button class="wide dk" data-x>تم</button>`);
}
