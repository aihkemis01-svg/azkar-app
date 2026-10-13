/* =====================================================
   نقطة البداية: تُحمَّل آخر ملف
   ===================================================== */
Stats.init();
save();
render();
Reminders.init();

// إن بقي التطبيق مفتوحًا في الخلفية وتغيّر اليوم، نعيد التحميل ليبدأ يوم جديد
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && dk() !== today) location.reload();
});
