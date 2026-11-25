package com.yassgym.app.steps;

import android.annotation.SuppressLint;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.SystemClock;

import com.google.android.gms.location.ActivityRecognition;
import com.google.android.gms.location.ActivityTransition;
import com.google.android.gms.location.ActivityTransitionEvent;
import com.google.android.gms.location.ActivityTransitionRequest;
import com.google.android.gms.location.ActivityTransitionResult;
import com.google.android.gms.location.DetectedActivity;

import java.util.ArrayList;
import java.util.List;

/**
 * Détection d'activité de Google (accéléromètre + modèles de Google Play Services) :
 * on note les périodes en voiture / bus / train (IN_VEHICLE), à vélo et en course.
 * Les pas comptés pendant un trajet sont ensuite ignorés par StepStore.
 */
public final class ActivityTracking {
    private ActivityTracking() {}

    private static PendingIntent pendingIntent(Context c) {
        Intent i = new Intent(c, Receiver.class);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        // Google Play Services remplit l'intention : elle doit rester modifiable
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) flags |= PendingIntent.FLAG_MUTABLE;
        return PendingIntent.getBroadcast(c, 0, i, flags);
    }

    @SuppressLint("MissingPermission")
    public static void start(Context c) {
        if (!StepSensor.permitted(c)) return;
        List<ActivityTransition> list = new ArrayList<>();
        for (int type : new int[] { DetectedActivity.IN_VEHICLE, DetectedActivity.ON_BICYCLE, DetectedActivity.RUNNING }) {
            list.add(new ActivityTransition.Builder().setActivityType(type)
                .setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_ENTER).build());
            list.add(new ActivityTransition.Builder().setActivityType(type)
                .setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_EXIT).build());
        }
        try {
            ActivityRecognition.getClient(c).requestActivityTransitionUpdates(new ActivityTransitionRequest(list), pendingIntent(c));
        } catch (SecurityException ignored) {
            // Autorisation retirée entre-temps : le podomètre continue, sans filtre véhicule
        }
    }

    @SuppressLint("MissingPermission")
    public static void stop(Context c) {
        try {
            ActivityRecognition.getClient(c).removeActivityTransitionUpdates(pendingIntent(c));
        } catch (SecurityException ignored) { }
    }

    /** Reçoit les débuts et fins d'activité. */
    public static class Receiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (!ActivityTransitionResult.hasResult(intent)) return;
            ActivityTransitionResult result = ActivityTransitionResult.extractResult(intent);
            if (result == null) return;
            final Context c = context.getApplicationContext();
            final List<ActivityTransitionEvent> events = result.getTransitionEvents();
            final PendingResult pending = goAsync();
            new Thread(() -> {
                try {
                    // Relevé juste avant de changer de période : les pas d'avant restent bien classés
                    StepSensor.sampleNow(c);
                    long nowWall = System.currentTimeMillis();
                    long nowNanos = SystemClock.elapsedRealtimeNanos();
                    for (ActivityTransitionEvent ev : events) {
                        long ts = nowWall - (nowNanos - ev.getElapsedRealTimeNanos()) / 1_000_000L;
                        String kind = ev.getActivityType() == DetectedActivity.RUNNING ? StepStore.RUNNING : StepStore.VEHICLE;
                        if (ev.getTransitionType() == ActivityTransition.ACTIVITY_TRANSITION_ENTER) {
                            StepStore.openInterval(c, kind, ts);
                        } else {
                            StepStore.closeInterval(c, kind, ts);
                        }
                    }
                } finally {
                    pending.finish();
                }
            }).start();
        }
    }

    /** Après un redémarrage du téléphone, Android oublie les abonnements : on les reprend. */
    public static class BootReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (!Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) return;
            Context c = context.getApplicationContext();
            if (!StepStore.isEnabled(c)) return;
            start(c);
            StepWorker.schedule(c);
            final PendingResult pending = goAsync();
            new Thread(() -> {
                try { StepSensor.sampleNow(c); } finally { pending.finish(); }
            }).start();
        }
    }
}
