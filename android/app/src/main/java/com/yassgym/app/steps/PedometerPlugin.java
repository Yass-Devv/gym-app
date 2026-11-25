package com.yassgym.app.steps;

import android.Manifest;
import android.content.Context;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import org.json.JSONException;

/** Pont entre l'appli web (src/steps.js) et le podomètre du téléphone. */
@CapacitorPlugin(
    name = "Pedometer",
    permissions = { @Permission(alias = "activity", strings = { Manifest.permission.ACTIVITY_RECOGNITION }) }
)
public class PedometerPlugin extends Plugin {

    private boolean granted() {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.Q || getPermissionState("activity") == PermissionState.GRANTED;
    }

    private JSObject status() {
        Context c = getContext();
        JSObject r = new JSObject();
        r.put("available", StepSensor.available(c));
        r.put("permission", granted());
        r.put("enabled", StepStore.isEnabled(c) && granted());
        return r;
    }

    @PluginMethod
    public void status(PluginCall call) {
        call.resolve(status());
    }

    @PluginMethod
    public void enable(PluginCall call) {
        if (!StepSensor.available(getContext())) {
            call.reject("Ce téléphone n'a pas de podomètre.", "UNAVAILABLE");
            return;
        }
        if (granted()) turnOn(call);
        else requestPermissionForAlias("activity", call, "permissionDone");
    }

    @PermissionCallback
    private void permissionDone(PluginCall call) {
        if (granted()) turnOn(call);
        else call.reject("Autorisation « Activité physique » refusée.", "DENIED");
    }

    private void turnOn(PluginCall call) {
        Context c = getContext();
        if (!StepStore.isEnabled(c)) StepStore.setEnabled(c, true);
        ActivityTracking.start(c);
        StepWorker.schedule(c);
        new Thread(() -> {
            StepSensor.sampleNow(c); // premier relevé : sert de point de départ
            call.resolve(status());
        }).start();
    }

    @PluginMethod
    public void disable(PluginCall call) {
        Context c = getContext();
        StepStore.setEnabled(c, false);
        ActivityTracking.stop(c);
        StepWorker.cancel(c);
        call.resolve(status());
    }

    /** { from: "AAAA-MM-JJ", to: "AAAA-MM-JJ" } → { days: [{ day, steps, run, rejected }] } */
    @PluginMethod
    public void getDays(PluginCall call) {
        String from = call.getString("from");
        String to = call.getString("to");
        if (from == null || to == null) {
            call.reject("Dates manquantes.");
            return;
        }
        Context c = getContext();
        new Thread(() -> {
            if (granted()) StepSensor.sampleNow(c); // relevé frais avant de répondre
            try {
                JSObject r = new JSObject();
                r.put("days", StepStore.days(c, from, to));
                call.resolve(r);
            } catch (JSONException e) {
                call.reject("Lecture des pas impossible.");
            }
        }).start();
    }
}
