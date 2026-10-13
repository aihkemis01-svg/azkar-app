package com.azkar.morningevening;

import android.app.Activity;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * يعرض ملفات الواجهة (HTML/CSS/JS) من مجلد assets داخل WebView،
 * ويوفّر للواجهة جسرًا باسم AzkarNative لإدارة التذكيرات.
 */
public class MainActivity extends Activity {
    static final String HOST = "appassets.androidplatform.net";
    private static final String NOTIF_PERMISSION = "android.permission.POST_NOTIFICATIONS";
    private static final int REQ_NOTIF = 77;

    WebView web;
    private String pendingTarget = "";

    static String mime(String path) {
        if (path.endsWith(".html")) return "text/html";
        if (path.endsWith(".js")) return "application/javascript";
        if (path.endsWith(".css")) return "text/css";
        if (path.endsWith(".png")) return "image/png";
        if (path.endsWith(".woff2")) return "font/woff2";
        return "application/octet-stream";
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        int bg = Color.parseColor("#f7f4ec");
        getWindow().setStatusBarColor(bg);
        getWindow().setNavigationBarColor(bg);
        if (Build.VERSION.SDK_INT >= 23) {
            getWindow().getDecorView().setSystemUiVisibility(0x2000); // أيقونات شريط الحالة داكنة
        }

        readTarget(getIntent());

        web = new WebView(this);
        web.setBackgroundColor(bg);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);

        web.addJavascriptInterface(new Bridge(), "AzkarNative");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if (!HOST.equals(u.getHost())) return null;
                String path = u.getPath();
                if (path == null || path.equals("/")) path = "/index.html";
                try {
                    InputStream in = getAssets().open(path.substring(1));
                    return new WebResourceResponse(mime(path), "UTF-8", in);
                } catch (IOException e) {
                    return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", null,
                            new ByteArrayInputStream(new byte[0]));
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return !HOST.equals(Uri.parse(url).getHost());
            }
        });
        web.loadUrl("https://" + HOST + "/index.html");
    }

    /* ---------- فتح التطبيق من الإشعار ---------- */

    private void readTarget(Intent i) {
        String t = i == null ? null : i.getStringExtra("target");
        pendingTarget = t == null ? "" : t;
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        readTarget(intent);
        if (web != null) web.evaluateJavascript("window.azkarGo&&window.azkarGo()", null);
    }

    /* ---------- إذن الإشعارات (أندرويد 13+) ---------- */

    private boolean needsNotifPermission() {
        return Build.VERSION.SDK_INT >= 33
                && checkSelfPermission(NOTIF_PERMISSION) != PackageManager.PERMISSION_GRANTED;
    }

    private void askNotifPermission() {
        if (needsNotifPermission()) requestPermissions(new String[]{NOTIF_PERMISSION}, REQ_NOTIF);
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] perms, int[] results) {
        super.onRequestPermissionsResult(code, perms, results);
        if (code == REQ_NOTIF && web != null) web.evaluateJavascript("window.azkarPerm&&window.azkarPerm()", null);
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    /* ---------- الجسر مع الواجهة: window.AzkarNative ---------- */

    public class Bridge {
        /** حالة الإشعارات: {"notif":true,"exact":true,"sdk":33} */
        @JavascriptInterface
        public String info() {
            JSONObject o = new JSONObject();
            try {
                NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                o.put("notif", Build.VERSION.SDK_INT < 24 || nm.areNotificationsEnabled());
                o.put("exact", Reminders.canScheduleExact(MainActivity.this));
                o.put("sdk", Build.VERSION.SDK_INT);
            } catch (Exception ignored) {
            }
            return o.toString();
        }

        /** حفظ إعدادات التذكيرات وإعادة الجدولة */
        @JavascriptInterface
        public void setReminders(String json) {
            Reminders.saveConfig(MainActivity.this, json);
            Reminders.scheduleAll(MainActivity.this);
        }

        /** ما أُنجز اليوم: {"day":"2026-10-13","m":1,"e":0,"q":0} */
        @JavascriptInterface
        public void setDone(String json) {
            Reminders.saveDone(MainActivity.this, json);
        }

        /** طلب إذن الإشعارات (يُستدعى عند تفعيل تذكير من المستخدم) */
        @JavascriptInterface
        public void requestPermission() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    askNotifPermission();
                }
            });
        }

        /** إشعار تجريبي فوري */
        @JavascriptInterface
        public void test() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (needsNotifPermission()) askNotifPermission();
                    else Reminders.show(MainActivity.this, "t", true);
                }
            });
        }

        /** القسم المطلوب فتحه عند الدخول من إشعار (m / e / q) ثم يُمسح */
        @JavascriptInterface
        public String takeTarget() {
            String t = pendingTarget;
            pendingTarget = "";
            return t;
        }

        /** فتح إعدادات الإشعارات للتطبيق */
        @JavascriptInterface
        public void openSettings() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Intent i;
                    if (Build.VERSION.SDK_INT >= 26) {
                        i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                        i.putExtra(Settings.EXTRA_APP_PACKAGE, getPackageName());
                    } else {
                        i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                                Uri.parse("package:" + getPackageName()));
                    }
                    startActivity(i);
                }
            });
        }
    }
}
