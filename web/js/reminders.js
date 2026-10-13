/* =====================================================
   التذكيرات اليومية
   - الجدولة والإشعارات تتم في الجزء الأصلي من التطبيق (Android)
     عبر الجسر window.AzkarNative
   - هنا: واجهة الإعدادات + إرسال الإعدادات والحالة للجزء الأصلي
   ===================================================== */

const RM_NAMES = { m: "☀️ أذكار الصباح", e: "🌙 أذكار المساء", q: "📖 ورد القرآن" };

const Reminders = {
  _done: "",

  has: () => !!window.AzkarNative,

  /* الإعدادات بالصيغة التي يفهمها الجزء الأصلي */
  config() {
    const o = { quiet: st.rm.quiet ? 1 : 0 };
    ["m", "e", "q"].forEach((k) => {
      const t = (st.rm[k].t || "06:00").split(":").map(Number);
      o[k] = { on: st.rm[k].on ? 1 : 0, h: t[0] || 0, mi: t[1] || 0 };
    });
    return o;
  },

  /* إرسال الإعدادات (يعيد جدولة المنبهات) */
  apply() {
    if (!Reminders.has()) return;
    try {
      AzkarNative.setReminders(JSON.stringify(Reminders.config()));
    } catch (e) {}
  },

  /* إبلاغ الجزء الأصلي بما أُنجز اليوم حتى لا يرسل تذكيرًا لا حاجة له */
  pushDone() {
    if (!Reminders.has()) return;
    const e = st.log[today] || {};
    const s = JSON.stringify({ day: today, m: e.m ? 1 : 0, e: e.e ? 1 : 0, q: e.q ? 1 : 0 });
    if (s === Reminders._done) return;
    Reminders._done = s;
    try {
      AzkarNative.setDone(s);
    } catch (x) {}
  },

  /* قسم التذكيرات داخل الإعدادات */
  html() {
    const nat = Reminders.has();
    const items = ["m", "e", "q"]
      .map(
        (k) => `<div class="rm-i">
      <label class="ro"><span>${RM_NAMES[k]}</span><input type="checkbox" class="sw" data-rk="${k}" ${st.rm[k].on ? "checked" : ""} ${nat ? "" : "disabled"}></label>
      <div class="rm-t" ${st.rm[k].on ? "" : "hidden"}><span>وقت التذكير</span><input type="time" data-rt="${k}" value="${st.rm[k].t}"></div>
    </div>`,
      )
      .join("");
    return `<div class="rm">
      <div class="rm-h">🔔 التذكيرات اليومية</div>
      ${nat ? "" : '<p class="hint">التذكيرات تعمل داخل تطبيق الأندرويد فقط.</p>'}
      ${items}
      <label class="ro"><span>تنبيه هادئ <small>(بدون صوت)</small></span><input type="checkbox" class="sw" id="rmq" ${st.rm.quiet ? "checked" : ""} ${nat ? "" : "disabled"}></label>
      <div id="rms"></div>
      <p class="hint">يصلك تذكير واحد فقط في الوقت المحدد، ولا يصلك إن كنت قد أتممتَ الذكر في ذلك اليوم.</p>
      <button class="wide" id="rmt" ${nat ? "" : "disabled"}>تجربة التنبيه</button>
    </div>`;
  },

  /* بعد فتح الإعدادات: عرض حالة الإشعارات */
  afterOpen() {
    Reminders.status();
  },
  status() {
    const el = $("rms");
    if (!el || !Reminders.has()) return;
    let info = {};
    try {
      info = JSON.parse(AzkarNative.info());
    } catch (e) {}
    const any = ["m", "e", "q"].some((k) => st.rm[k].on);
    let h = "";
    if (any && info.notif === false) {
      h = `<p class="rm-w">⚠️ الإشعارات متوقفة للتطبيق في إعدادات الجهاز، لن تصلك التذكيرات. <button class="sx-lnk" id="rmo">فتح الإعدادات</button></p>`;
    } else if (any && info.exact === false) {
      h = `<p class="hint">قد يتأخر التذكير بضع دقائق بحسب إعدادات توفير الطاقة.</p>`;
    }
    el.innerHTML = h;
  },

  /* فتح التطبيق من إشعار: الانتقال للقسم المناسب */
  go() {
    let t = "";
    try {
      t = (window.AzkarNative && AzkarNative.takeTarget()) || "";
    } catch (e) {}
    if (t === "m" || t === "e") {
      mode = t;
      setQ(0);
      render();
      scrollTo({ top: 0 });
    } else if (t === "q") {
      setQ(1);
      render();
      scrollTo({ top: 0 });
    }
  },

  init() {
    Reminders.apply();
    Reminders.pushDone();
    Reminders.go();
  },
};

/* نداءات من الجزء الأصلي */
window.azkarGo = Reminders.go;
window.azkarPerm = () => Reminders.status();

/* ---------- الأحداث ---------- */
$("ov").addEventListener("change", (e) => {
  const t = e.target;
  if (t.dataset.rk) {
    const k = t.dataset.rk;
    st.rm[k].on = +t.checked;
    t.closest(".rm-i").querySelector(".rm-t").hidden = !t.checked;
    save();
    Reminders.apply();
    if (t.checked) {
      try {
        AzkarNative.requestPermission();
      } catch (x) {}
    }
    setTimeout(Reminders.status, 600);
  } else if (t.dataset.rt) {
    if (/^\d{1,2}:\d{2}$/.test(t.value)) {
      st.rm[t.dataset.rt].t = t.value;
      save();
      Reminders.apply();
    }
  } else if (t.id === "rmq") {
    st.rm.quiet = +t.checked;
    save();
    Reminders.apply();
  }
});
$("ov").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b || !Reminders.has()) return;
  if (b.id === "rmt") {
    Reminders.apply();
    AzkarNative.test();
    setTimeout(Reminders.status, 600);
  } else if (b.id === "rmo") AzkarNative.openSettings();
});
