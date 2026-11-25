// ─── Podomètre ───────────────────────────────────────────────────────────────
// Dans l'appli Android et iPhone, les pas viennent de la puce podomètre du téléphone (plugin natif « Pedometer » :
// android/app/src/main/java/com/yassgym/app/steps et ios/App/App/PedometerPlugin.swift). Le téléphone écarte lui-même les pas comptés pendant un
// trajet en véhicule ou à vélo, et plafonne les cadences impossibles. Ici on récupère les totaux par jour et on
// les envoie au serveur, qui calcule la distance et les calories d'après la taille, le poids et le sexe.
// Dans un navigateur, il n'y a pas de podomètre fiable : la fonction est indiquée comme indisponible.
import { Capacitor, registerPlugin } from "@capacitor/core";
import { api } from "./api";
import { dayKey, addDays } from "./data/challenges";

const Pedometer = registerPlugin("Pedometer");

const platform = () => Capacitor.getPlatform();
export const pedometerSupported = () => platform() === "android" || platform() === "ios";

// Où accorder l'autorisation quand elle a été refusée
export const pedometerDeniedHelp = () => platform() === "ios"
  ? "Autorisation refusée. Tu peux l'accorder dans Réglages → YASS-GYM → Mouvements et forme."
  : "Autorisation refusée. Tu peux l'accorder dans les réglages Android : Applis → YASS-GYM → Autorisations → Activité physique.";

// Nom de l'autorisation demandée par le téléphone
export const pedometerPermissionName = () => platform() === "ios" ? "Mouvements et forme" : "Activité physique";

// { available, permission, enabled } ; available = false hors de l'appli mobile
export async function pedometerStatus() {
  if (!pedometerSupported()) return { available: false, permission: false, enabled: false };
  try {
    return await Pedometer.status();
  } catch {
    return { available: false, permission: false, enabled: false };
  }
}

export const enablePedometer  = () => Pedometer.enable();
export const disablePedometer = () => Pedometer.disable();

// Envoie au serveur les pas des derniers jours. Renvoie les jours enregistrés, ou null sans podomètre.
let syncing = null;
export function syncSteps(days = 7) {
  if (!pedometerSupported()) return Promise.resolve(null);
  if (syncing) return syncing; // un seul envoi à la fois
  syncing = (async () => {
    const st = await pedometerStatus();
    if (!st.enabled) return null;
    const to = dayKey(new Date());
    const { days: list = [] } = await Pedometer.getDays({ from: addDays(to, -(days - 1)), to });
    if (list.length === 0) return [];
    return api.saveSteps(list.map((d) => ({
      day: d.day,
      steps: Math.min(100000, Math.max(0, Math.round(d.steps))),
      runSteps: Math.min(Math.round(d.steps), Math.max(0, Math.round(d.run))),
      rejected: Math.max(0, Math.round(d.rejected)),
    })));
  })().finally(() => { syncing = null; });
  return syncing;
}
