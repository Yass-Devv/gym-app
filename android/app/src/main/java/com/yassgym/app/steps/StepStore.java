package com.yassgym.app.steps;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.SystemClock;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

/**
 * Mémoire du podomètre, sur le téléphone.
 *
 * Le capteur TYPE_STEP_COUNTER donne un total de pas depuis le démarrage du téléphone. À chaque relevé
 * (toutes les 15 minutes en arrière-plan, à l'ouverture de l'appli et à chaque changement d'activité),
 * on prend la différence avec le relevé précédent et on la range dans le bon jour, après trois contrôles :
 *  1. les pas comptés pendant un trajet en véhicule ou à vélo (détection d'activité de Google) sont ignorés ;
 *  2. une cadence impossible pour un humain (plus de 3,5 pas par seconde en moyenne) est plafonnée ;
 *  3. la part faite en courant (détection d'activité, ou cadence moyenne de course) est notée à part,
 *     car courir dépense deux fois plus par kilomètre.
 */
public final class StepStore {
    private static final String PREFS = "yassgym_steps";
    private static final double MAX_CADENCE = 3.5;   // pas par seconde, au-delà ce n'est pas humain
    private static final double RUN_CADENCE = 2.3;   // ≈ 140 pas par minute en moyenne : on court
    private static final long KEEP_INTERVALS_MS = 3L * 24 * 3600 * 1000;
    private static final int KEEP_DAYS = 60;
    private static final Object LOCK = new Object();

    public static final String VEHICLE = "veh";
    public static final String RUNNING = "run";

    private StepStore() {}

    private static SharedPreferences prefs(Context c) {
        return c.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public static boolean isEnabled(Context c) {
        return prefs(c).getBoolean("enabled", false);
    }

    public static void setEnabled(Context c, boolean on) {
        synchronized (LOCK) {
            SharedPreferences.Editor e = prefs(c).edit().putBoolean("enabled", on);
            // On repart d'une base neuve : les pas faits pendant que le suivi était coupé ne sont pas comptés
            e.remove("lastTs").remove("lastCounter").remove("lastBoot");
            e.apply();
        }
    }

    private static long bootTime() {
        return System.currentTimeMillis() - SystemClock.elapsedRealtime();
    }

    private static String dayKey(long ts) {
        SimpleDateFormat f = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
        return f.format(new Date(ts));
    }

    private static long startOfNextDay(long ts) {
        Calendar cal = Calendar.getInstance();
        cal.setTimeInMillis(ts);
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        cal.add(Calendar.DAY_OF_MONTH, 1);
        return cal.getTimeInMillis();
    }

    /** Nouveau relevé du capteur. counter = pas depuis le démarrage du téléphone. */
    public static void sample(Context c, float counter, long now) {
        synchronized (LOCK) {
            SharedPreferences p = prefs(c);
            long lastTs = p.getLong("lastTs", 0);
            float last = p.getFloat("lastCounter", -1);
            long lastBoot = p.getLong("lastBoot", 0);
            long boot = bootTime();
            boolean sameBoot = Math.abs(boot - lastBoot) < 120_000 && counter >= last;
            SharedPreferences.Editor e = p.edit();

            if (lastTs > 0 && last >= 0 && now > lastTs) {
                // Après un redémarrage le capteur repart de zéro : tout ce qu'il affiche date d'après le démarrage
                double delta = sameBoot ? counter - last : counter;
                long from = sameBoot ? lastTs : Math.max(lastTs, boot);
                if (delta > 0 && now > from) record(p, e, from, now, delta);
            }
            e.putLong("lastTs", now).putFloat("lastCounter", counter).putLong("lastBoot", boot);
            prune(p, e, now);
            e.apply();
        }
    }

    private static void record(SharedPreferences p, SharedPreferences.Editor e, long from, long to, double delta) {
        double span = to - from;
        double secs = span / 1000.0;

        // 1. Trajet en véhicule ou à vélo : on retire la part du temps passée à rouler
        double vehFrac = Math.min(1, overlap(p, VEHICLE, from, to) / span);
        double rejected = delta * vehFrac;
        double kept = delta - rejected;

        // 2. Cadence impossible : on plafonne
        double maxKept = secs * MAX_CADENCE * (1 - vehFrac);
        if (kept > maxKept) {
            rejected += kept - maxKept;
            kept = maxKept;
        }

        // 3. Course : détection d'activité, ou cadence moyenne de coureur sur la période
        double runFrac = Math.min(1, overlap(p, RUNNING, from, to) / span);
        if (secs >= 60 && kept / secs >= RUN_CADENCE) runFrac = 1;
        double run = kept * runFrac;

        // Répartition par jour si la période passe minuit (au prorata du temps)
        long a = from;
        while (a < to) {
            long b = Math.min(to, startOfNextDay(a));
            double f = (b - a) / span;
            add(p, e, dayKey(a), kept * f, run * f, rejected * f);
            a = b;
        }
    }

    private static void add(SharedPreferences p, SharedPreferences.Editor e, String day, double steps, double run, double rejected) {
        // Chaque jour n'apparaît qu'une fois par relevé : relire p suffit
        double[] v = read(p, day);
        v[0] += steps;
        v[1] += run;
        v[2] += rejected;
        e.putString("day:" + day, v[0] + "," + v[1] + "," + v[2]);
    }

    private static double[] read(SharedPreferences p, String day) {
        String s = p.getString("day:" + day, null);
        double[] v = new double[3];
        if (s == null) return v;
        String[] parts = s.split(",");
        for (int i = 0; i < 3 && i < parts.length; i++) {
            try { v[i] = Double.parseDouble(parts[i]); } catch (NumberFormatException ignored) { }
        }
        return v;
    }

    // ─── Périodes d'activité (véhicule, course) ───────────────────────────────
    // Stockées comme "début-fin;début-fin;…" ; fin = 0 tant que l'activité est en cours.

    public static void openInterval(Context c, String kind, long ts) {
        synchronized (LOCK) {
            SharedPreferences p = prefs(c);
            String s = p.getString("iv:" + kind, "");
            if (s.endsWith("-0")) return; // déjà en cours
            p.edit().putString("iv:" + kind, (s.isEmpty() ? "" : s + ";") + ts + "-0").apply();
        }
    }

    public static void closeInterval(Context c, String kind, long ts) {
        synchronized (LOCK) {
            SharedPreferences p = prefs(c);
            String s = p.getString("iv:" + kind, "");
            if (!s.endsWith("-0")) return;
            p.edit().putString("iv:" + kind, s.substring(0, s.length() - 1) + ts).apply();
        }
    }

    private static double overlap(SharedPreferences p, String kind, long from, long to) {
        String s = p.getString("iv:" + kind, "");
        if (s.isEmpty()) return 0;
        double total = 0;
        for (String iv : s.split(";")) {
            String[] se = iv.split("-");
            if (se.length != 2) continue;
            try {
                long start = Long.parseLong(se[0]);
                long end = Long.parseLong(se[1]);
                if (end == 0) end = to;
                long a = Math.max(from, start), b = Math.min(to, end);
                if (b > a) total += b - a;
            } catch (NumberFormatException ignored) { }
        }
        return total;
    }

    private static void prune(SharedPreferences p, SharedPreferences.Editor e, long now) {
        for (String kind : new String[] { VEHICLE, RUNNING }) {
            String s = p.getString("iv:" + kind, "");
            if (s.isEmpty()) continue;
            StringBuilder out = new StringBuilder();
            for (String iv : s.split(";")) {
                String[] se = iv.split("-");
                if (se.length != 2) continue;
                long end;
                try { end = Long.parseLong(se[1]); } catch (NumberFormatException ex) { continue; }
                if (end != 0 && now - end > KEEP_INTERVALS_MS) continue;
                if (out.length() > 0) out.append(';');
                out.append(iv);
            }
            e.putString("iv:" + kind, out.toString());
        }
        String oldest = dayKey(now - KEEP_DAYS * 86400000L);
        for (String k : p.getAll().keySet()) {
            if (k.startsWith("day:") && k.substring(4).compareTo(oldest) < 0) e.remove(k);
        }
    }

    /** Jours entre from et to inclus (format AAAA-MM-JJ) : [{ day, steps, run, rejected }] */
    public static JSONArray days(Context c, String from, String to) throws JSONException {
        synchronized (LOCK) {
            SharedPreferences p = prefs(c);
            JSONArray out = new JSONArray();
            java.util.TreeSet<String> sorted = new java.util.TreeSet<>();
            for (String k : p.getAll().keySet()) {
                if (!k.startsWith("day:")) continue;
                String day = k.substring(4);
                if (day.compareTo(from) >= 0 && day.compareTo(to) <= 0) sorted.add(day);
            }
            for (String day : sorted) {
                double[] v = read(p, day);
                JSONObject o = new JSONObject();
                o.put("day", day);
                o.put("steps", Math.round(v[0]));
                o.put("run", Math.round(Math.min(v[1], v[0])));
                o.put("rejected", Math.round(v[2]));
                out.put(o);
            }
            return out;
        }
    }
}
