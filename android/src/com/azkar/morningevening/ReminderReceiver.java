package com.azkar.morningevening;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** يُستدعى عند حلول وقت التذكير: يعرض الإشعار ثم يجدول تذكير اليوم التالي. */
public class ReminderReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String key = intent.getStringExtra("k");
        if (key == null) return;
        try {
            Reminders.show(context, key, false);
        } finally {
            Reminders.scheduleOne(context, key);
        }
    }
}
