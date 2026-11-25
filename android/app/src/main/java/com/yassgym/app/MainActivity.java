package com.yassgym.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.yassgym.app.steps.PedometerPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Plugins écrits pour YASS-GYM : à enregistrer avant super.onCreate
        registerPlugin(PedometerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
