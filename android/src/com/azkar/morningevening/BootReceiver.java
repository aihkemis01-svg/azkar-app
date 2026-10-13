package com.azkar.morningevening;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** يعيد جدولة التذكيرات بعد إعادة التشغيل أو التحديث أو تغيير الوقت/المنطقة الزمنية. */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        Reminders.scheduleAll(context);
    }
}
