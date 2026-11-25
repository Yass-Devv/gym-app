import Foundation
import Capacitor
import CoreMotion

/// Podomètre de l'iPhone (puce de mouvement, compte même appli fermée), même interface que la version Android
/// (android/app/src/main/java/com/yassgym/app/steps/PedometerPlugin.java) : status, enable, disable, getDays.
///
/// Contrairement à Android, iOS garde lui-même l'historique des pas des 7 derniers jours : pas besoin de relevés
/// en arrière-plan, on interroge CMPedometer jour par jour quand l'appli s'ouvre. iOS écarte déjà les secousses
/// en voiture ; la part faite en courant vient de la détection d'activité (CMMotionActivityManager).
@objc(PedometerPlugin)
public class PedometerPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PedometerPlugin"
    public let jsName = "Pedometer"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "enable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "disable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getDays", returnType: CAPPluginReturnPromise)
    ]

    private let pedometer = CMPedometer()
    private let activityManager = CMMotionActivityManager()
    private let queue = OperationQueue()
    private let enabledKey = "yassgym_steps_enabled"
    private let historyDays = 7 // iOS ne garde pas plus

    private var available: Bool { CMPedometer.isStepCountingAvailable() }
    private var granted: Bool { CMPedometer.authorizationStatus() == .authorized }
    private var enabled: Bool { UserDefaults.standard.bool(forKey: enabledKey) }

    private func statusObject() -> [String: Any] {
        ["available": available, "permission": granted, "enabled": enabled && granted]
    }

    @objc func status(_ call: CAPPluginCall) {
        call.resolve(statusObject())
    }

    @objc func enable(_ call: CAPPluginCall) {
        guard available else {
            call.reject("Ce téléphone n'a pas de podomètre.", "UNAVAILABLE")
            return
        }
        switch CMPedometer.authorizationStatus() {
        case .authorized:
            turnOn(call)
        case .notDetermined:
            // La première lecture fait apparaître la demande d'autorisation « Mouvements et forme »
            let now = Date()
            pedometer.queryPedometerData(from: now.addingTimeInterval(-60), to: now) { [weak self] _, _ in
                DispatchQueue.main.async {
                    guard let self = self else { return }
                    if self.granted { self.turnOn(call) }
                    else { call.reject("Autorisation « Mouvements et forme » refusée.", "DENIED") }
                }
            }
        default:
            call.reject("Autorisation « Mouvements et forme » refusée.", "DENIED")
        }
    }

    private func turnOn(_ call: CAPPluginCall) {
        UserDefaults.standard.set(true, forKey: enabledKey)
        call.resolve(statusObject())
    }

    @objc func disable(_ call: CAPPluginCall) {
        UserDefaults.standard.set(false, forKey: enabledKey)
        call.resolve(statusObject())
    }

    /// { from: "AAAA-MM-JJ", to: "AAAA-MM-JJ" } → { days: [{ day, steps, run, rejected }] }
    @objc func getDays(_ call: CAPPluginCall) {
        guard let fromStr = call.getString("from"), let toStr = call.getString("to"),
              let fromDay = Self.parse(fromStr), let toDay = Self.parse(toStr) else {
            call.reject("Dates manquantes.")
            return
        }
        guard granted, enabled else {
            call.resolve(["days": []])
            return
        }

        let cal = Calendar.current
        let now = Date()
        let oldest = cal.date(byAdding: .day, value: -(historyDays - 1), to: cal.startOfDay(for: now))!
        var start = max(fromDay, oldest)
        let lastDay = min(toDay, cal.startOfDay(for: now))

        var ranges: [(key: String, from: Date, to: Date)] = []
        while start <= lastDay {
            let next = cal.date(byAdding: .day, value: 1, to: start)!
            ranges.append((Self.format(start), start, min(next, now)))
            start = next
        }
        guard let first = ranges.first, let last = ranges.last else {
            call.resolve(["days": []])
            return
        }

        runningPeriods(from: first.from, to: last.to) { [weak self] runs in
            guard let self = self else { return }
            let lock = NSLock()
            var steps: [String: Int] = [:]
            var run: [String: Int] = [:]
            let group = DispatchGroup()

            for r in ranges {
                group.enter()
                self.pedometer.queryPedometerData(from: r.from, to: r.to) { data, _ in
                    lock.lock(); steps[r.key] = data?.numberOfSteps.intValue ?? 0; lock.unlock()
                    group.leave()
                }
                // Pas faits en courant ce jour-là
                for p in runs {
                    let a = max(p.0, r.from), b = min(p.1, r.to)
                    guard b > a else { continue }
                    group.enter()
                    self.pedometer.queryPedometerData(from: a, to: b) { data, _ in
                        lock.lock(); run[r.key, default: 0] += data?.numberOfSteps.intValue ?? 0; lock.unlock()
                        group.leave()
                    }
                }
            }

            group.notify(queue: .main) {
                let days: [[String: Any]] = ranges.compactMap { r in
                    let s = steps[r.key] ?? 0
                    guard s > 0 else { return nil }
                    return ["day": r.key, "steps": s, "run": min(run[r.key] ?? 0, s), "rejected": 0]
                }
                call.resolve(["days": days])
            }
        }
    }

    /// Périodes pendant lesquelles iOS a détecté une course, fusionnées.
    private func runningPeriods(from: Date, to: Date, done: @escaping ([(Date, Date)]) -> Void) {
        guard CMMotionActivityManager.isActivityAvailable() else { done([]); return }
        activityManager.queryActivityStarting(from: from, to: to, to: queue) { activities, _ in
            let list = activities ?? []
            var periods: [(Date, Date)] = []
            for (i, act) in list.enumerated() where act.running && act.confidence != .low {
                let end = i + 1 < list.count ? list[i + 1].startDate : to
                if let lastP = periods.last, lastP.1 >= act.startDate {
                    periods[periods.count - 1].1 = max(lastP.1, end)
                } else {
                    periods.append((act.startDate, end))
                }
            }
            done(periods)
        }
    }

    private static func formatter() -> DateFormatter {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone.current
        f.dateFormat = "yyyy-MM-dd"
        return f
    }

    private static func parse(_ s: String) -> Date? { formatter().date(from: s) }
    private static func format(_ d: Date) -> String { formatter().string(from: d) }
}
