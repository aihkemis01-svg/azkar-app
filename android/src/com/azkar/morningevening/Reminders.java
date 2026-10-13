package com.azkar.morningevening;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import org.json.JSONObject;

import java.util.Calendar;

/**
 * منطق التذكيرات: الحفظ، الجدولة، وعرض الإشعار.
 * المفاتيح: m = أذكار الصباح، e = أذكار المساء، q = ورد القرآن
 */
final class Reminders {
    static final String ACTION = "com.azkar.morningevening.REMIND";
    private static final String PREFS = "azkar_native";
    private static final String CH_LOUD = "azkar_reminders";
    private static final String CH_QUIET = "azkar_quiet";
    private static final String[] KEYS = {"m", "e", "q"};

    private Reminders() {}

    private static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private static JSONObject read(Context c, String name) {
        try {
            return new JSONObject(prefs(c).getString(name, "{}"));
        } catch (Exception e) {
            return new JSONObject();
        }
    }

    static void saveConfig(Context c, String json) {
        prefs(c).edit().putString("cfg", json).apply();
    }

    static void saveDone(Context c, String json) {
        prefs(c).edit().putString("done", json).apply();
    }

    static boolean anyEnabled(Context c) {
        JSONObject cfg = read(c, "cfg");
        for (String k : KEYS) {
            JSONObject o = cfg.optJSONObject(k);
            if (o != null && o.optInt("on", 0) == 1) return true;
        }
        return false;
    }

    /** نفس صيغة التاريخ في الواجهة: السنة-الشهر-اليوم بدون أصفار */
    private static String today() {
        Calendar c = Calendar.getInstance();
        return c.get(Calendar.YEAR) + "-" + (c.get(Calendar.MONTH) + 1) + "-" + c.get(Calendar.DAY_OF_MONTH);
    }

    private static boolean doneToday(Context c, String key) {
        JSONObject d = read(c, "done");
        return today().equals(d.optString("day")) && d.optInt(key, 0) == 1;
    }

    /* ---------------- الجدولة ---------------- */

    private static int requestCode(String key) {
        return 10 + key.charAt(0);
    }

    private static PendingIntent alarmIntent(Context c, String key) {
        Intent i = new Intent(c, ReminderReceiver.class);
        i.setAction(ACTION);
        i.putExtra("k", key);
        return PendingIntent.getBroadcast(c, requestCode(key), i,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static long nextTime(int hour, int minute) {
        Calendar c = Calendar.getInstance();
        c.set(Calendar.HOUR_OF_DAY, hour);
        c.set(Calendar.MINUTE, minute);
        c.set(Calendar.SECOND, 0);
        c.set(Calendar.MILLISECOND, 0);
        if (c.getTimeInMillis() <= System.currentTimeMillis() + 1000) c.add(Calendar.DAY_OF_YEAR, 1);
        return c.getTimeInMillis();
    }

    static boolean canScheduleExact(Context c) {
        if (Build.VERSION.SDK_INT < 31) return true;
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        return am.canScheduleExactAlarms();
    }

    private static void schedule(Context c, String key, int hour, int minute) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        long at = nextTime(hour, minute);
        PendingIntent pi = alarmIntent(c, key);
        try {
            if (Build.VERSION.SDK_INT >= 23) {
                if (canScheduleExact(c)) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
                else am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
            } else {
                am.setExact(AlarmManager.RTC_WAKEUP, at, pi);
            }
        } catch (SecurityException e) {
            // تم سحب إذن المنبّهات الدقيقة: نستخدم منبّهًا غير دقيق
            if (Build.VERSION.SDK_INT >= 23) am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
            else am.set(AlarmManager.RTC_WAKEUP, at, pi);
        }
    }

    private static void cancel(Context c, String key) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        am.cancel(alarmIntent(c, key));
    }

    /** يعيد جدولة كل التذكيرات حسب الإعدادات المحفوظة */
    static void scheduleAll(Context c) {
        JSONObject cfg = read(c, "cfg");
        for (String k : KEYS) scheduleOne(c, cfg, k);
    }

    static void scheduleOne(Context c, String key) {
        scheduleOne(c, read(c, "cfg"), key);
    }

    private static void scheduleOne(Context c, JSONObject cfg, String key) {
        JSONObject o = cfg.optJSONObject(key);
        if (o != null && o.optInt("on", 0) == 1) schedule(c, key, o.optInt("h", 6), o.optInt("mi", 0));
        else cancel(c, key);
    }

    /* ---------------- الإشعار ---------------- */

    private static void ensureChannels(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        NotificationChannel loud = new NotificationChannel(CH_LOUD, "تذكيرات الأذكار", NotificationManager.IMPORTANCE_DEFAULT);
        loud.setDescription("تذكير يومي بأذكار الصباح والمساء وورد القرآن");
        NotificationChannel quiet = new NotificationChannel(CH_QUIET, "تذكيرات هادئة", NotificationManager.IMPORTANCE_LOW);
        quiet.setDescription("نفس التذكيرات بدون صوت");
        nm.createNotificationChannel(loud);
        nm.createNotificationChannel(quiet);
    }

    private static String title(String key) {
        if ("m".equals(key)) return "أذكار الصباح";
        if ("e".equals(key)) return "أذكار المساء";
        if ("q".equals(key)) return "وردك اليومي";
        return "تنبيه تجريبي";
    }

    private static String body(String key) {
        if ("m".equals(key)) return "حان وقت أذكار الصباح، ابدأ يومك بذكر الله ☀️";
        if ("e".equals(key)) return "حان وقت أذكار المساء، اختم يومك بذكر الله 🌙";
        if ("q".equals(key)) return "لا تنسَ وردك اليومي من القرآن الكريم 📖";
        return "هكذا ستظهر لك التذكيرات 🤍";
    }

    /**
     * يعرض الإشعار. force = true للتجربة (يتجاهل التفعيل والإنجاز).
     * لا يعرض التذكير إذا كان الذكر قد أُنجز اليوم.
     */
    static void show(Context c, String key, boolean force) {
        JSONObject cfg = read(c, "cfg");
        if (!force) {
            JSONObject o = cfg.optJSONObject(key);
            if (o == null || o.optInt("on", 0) != 1) return;
            if (doneToday(c, key)) return;
        }
        boolean quiet = cfg.optInt("quiet", 0) == 1;
        ensureChannels(c);

        Intent open = new Intent(c, MainActivity.class);
        open.putExtra("target", key);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent content = PendingIntent.getActivity(c, 100 + key.charAt(0), open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Notification.Builder b;
        if (Build.VERSION.SDK_INT >= 26) {
            b = new Notification.Builder(c, quiet ? CH_QUIET : CH_LOUD);
            b.setTimeoutAfter(6L * 60 * 60 * 1000); // يختفي تلقائيًا بعد 6 ساعات
        } else {
            b = new Notification.Builder(c);
            b.setPriority(quiet ? Notification.PRIORITY_LOW : Notification.PRIORITY_DEFAULT);
            if (!quiet) b.setDefaults(Notification.DEFAULT_SOUND);
        }
        int icon = c.getResources().getIdentifier("ic_stat", "drawable", c.getPackageName());
        b.setSmallIcon(icon != 0 ? icon : android.R.drawable.ic_popup_reminder)
                .setContentTitle(title(key))
                .setContentText(body(key))
                .setStyle(new Notification.BigTextStyle().bigText(body(key)))
                .setContentIntent(content)
                .setAutoCancel(true)
                .setOnlyAlertOnce(true)
                .setCategory(Notification.CATEGORY_REMINDER);

        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        nm.notify(1000 + key.charAt(0), b.build());
    }
}
