package com.yassgym.app.steps;

import android.content.Context;

import androidx.annotation.NonNull;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import java.util.concurrent.TimeUnit;

/** Relevé du podomètre toutes les 15 minutes, même appli fermée (minimum autorisé par Android). */
public class StepWorker extends Worker {
    private static final String NAME = "yassgym-steps";

    public StepWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        StepSensor.sampleNow(getApplicationContext());
        return Result.success();
    }

    public static void schedule(Context c) {
        PeriodicWorkRequest req = new PeriodicWorkRequest.Builder(StepWorker.class, 15, TimeUnit.MINUTES).build();
        WorkManager.getInstance(c).enqueueUniquePeriodicWork(NAME, ExistingPeriodicWorkPolicy.KEEP, req);
    }

    public static void cancel(Context c) {
        WorkManager.getInstance(c).cancelUniqueWork(NAME);
    }
}
