import UIKit
import Capacitor

/// Écran principal de l'appli : enregistre les plugins écrits pour YASS-GYM (comme MainActivity.java sur Android).
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(PedometerPlugin())
    }
}
