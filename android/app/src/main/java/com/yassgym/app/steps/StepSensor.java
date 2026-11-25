package com.yassgym.app.steps;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.Handler;
import android.os.HandlerThread;

import androidx.core.content.ContextCompat;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/** Lecture du podomètre matériel du téléphone (puce basse consommation, compte même écran éteint). */
public final class StepSensor {
    private StepSensor() {}

    public static boolean available(Context c) {
        SensorManager sm = (SensorManager) c.getSystemService(Context.SENSOR_SERVICE);
        return sm != null && sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER) != null;
    }

    /** Depuis Android 10, lire les pas demande l'autorisation « Activité physique ». */
    public static boolean permitted(Context c) {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.Q
            || ContextCompat.checkSelfPermission(c, Manifest.permission.ACTIVITY_RECOGNITION) == PackageManager.PERMISSION_GRANTED;
    }

    /** Valeur actuelle du compteur (pas depuis le démarrage), ou null. Bloquant : à appeler hors du fil principal. */
    public static Float read(Context c, long timeoutMs) {
        if (!permitted(c)) return null;
        SensorManager sm = (SensorManager) c.getSystemService(Context.SENSOR_SERVICE);
        if (sm == null) return null;
        Sensor s = sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        if (s == null) return null;

        final float[] value = { -1 };
        final CountDownLatch latch = new CountDownLatch(1);
        HandlerThread thread = new HandlerThread("yassgym-steps");
        thread.start();
        SensorEventListener listener = new SensorEventListener() {
            @Override public void onSensorChanged(SensorEvent e) {
                value[0] = e.values[0];
                latch.countDown();
            }
            @Override public void onAccuracyChanged(Sensor sensor, int accuracy) { }
        };
        sm.registerListener(listener, s, SensorManager.SENSOR_DELAY_NORMAL, new Handler(thread.getLooper()));
        try {
            latch.await(timeoutMs, TimeUnit.MILLISECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            sm.unregisterListener(listener);
            thread.quitSafely();
        }
        return value[0] < 0 ? null : value[0];
    }

    /** Relève le compteur et l'enregistre. Bloquant. */
    public static void sampleNow(Context c) {
        if (!StepStore.isEnabled(c)) return;
        Float v = read(c, 4000);
        if (v != null) StepStore.sample(c, v, System.currentTimeMillis());
    }
}
