import React, { useEffect, useRef, useState } from "react";
import { SENSITIVE_AREAS } from "./Shell";

// ─── Choix des zones sensibles sur un corps 3D réaliste ──────────────────────
// Modèles : corps de base MakeHuman (licence CC0), rendus athlétiques et habillés d'une tenue
// YASS-GYM par tools/makehuman-corps.py → public/models/corps-homme.glb et corps-femme.glb.
// three.js n'est chargé que quand cet écran s'ouvre.
// On fait tourner le corps en glissant, on touche un point pour signaler / retirer une zone,
// et les flèches tournent et zooment directement vers la zone précédente ou suivante.

const MODELS = {
  homme: {
    file: "corps-homme.glb", height: 1.73,
    spots: {
      cou: [[0, 1.456, 0.08]],
      epaules: [[0.215, 1.411, 0.033], [-0.215, 1.411, 0.033]],
      coudes: [[0.374, 1.189, 0.083], [-0.374, 1.189, 0.083]],
      poignets: [[0.499, 1.061, 0.264], [-0.499, 1.061, 0.264]],
      dos: [[0, 1.383, -0.067]],
      lombaires: [[0, 1.027, -0.058]],
      hanches: [[0.155, 0.923, 0.006], [-0.155, 0.923, 0.006]],
      genoux: [[0.148, 0.503, 0.08], [-0.148, 0.503, 0.08]],
      chevilles: [[0.236, 0.072, 0.02], [-0.236, 0.072, 0.02]],
    },
  },
  femme: {
    file: "corps-femme.glb", height: 1.59,
    spots: {
      cou: [[0, 1.373, 0.056]],
      epaules: [[0.184, 1.297, 0.019], [-0.184, 1.297, 0.019]],
      coudes: [[0.326, 1.091, 0.053], [-0.326, 1.091, 0.053]],
      poignets: [[0.429, 0.971, 0.181], [-0.429, 0.971, 0.181]],
      dos: [[0, 1.255, -0.08]],
      lombaires: [[0, 0.917, -0.07]],
      hanches: [[0.163, 0.821, 0.018], [-0.163, 0.821, 0.018]],
      genoux: [[0.134, 0.446, 0.082], [-0.134, 0.446, 0.082]],
      chevilles: [[0.197, 0.068, 0.015], [-0.197, 0.068, 0.015]],
    },
  },
};

// Angle sous lequel montrer chaque zone (0 = de face, π = de dos)
const TURN = {
  cou: 0, epaules: 0.45, coudes: 0.5, poignets: 0.35, dos: Math.PI, lombaires: Math.PI,
  hanches: 0.55, genoux: 0.25, chevilles: 0.6,
};

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const cssVar = (name, fallback) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

// Regroupe les parties du GLB (peau, tenue, liseré) en une seule géométrie à plusieurs matières,
// pour que l'éclairage reste continu aux bords de la tenue.
function mergeParts(THREE, root) {
  const parts = [];
  root.traverse((o) => { if (o.isMesh) parts.push(o); });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", parts[0].geometry.getAttribute("position"));
  const index = [];
  const names = [];
  for (const m of parts) {
    const idx = m.geometry.getIndex().array;
    geo.addGroup(index.length, idx.length, names.length);
    for (let i = 0; i < idx.length; i++) index.push(idx[i]);
    names.push(m.material.name);
  }
  geo.setIndex(index);
  geo.computeVertexNormals();
  return { geo, names };
}

export default function BodyZones({ value = [], onToggle, disabled = false, gender }) {
  const model = MODELS[gender === "femme" ? "femme" : "homme"];
  const stageRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | ok | failed
  const [focus, setFocus] = useState(null);

  // Le rendu 3D lit ces valeurs à chaque image : on les garde dans une ref
  const live = useRef({});
  live.current = { value, focus, onPick: (id) => { setFocus(id); if (!disabled) onToggle(id); } };

  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};
    setStatus("loading");

    Promise.all([
      import("three"),
      import("three/examples/jsm/loaders/GLTFLoader.js"),
    ]).then(async ([THREE, { GLTFLoader }]) => {
      const gltf = await new GLTFLoader().loadAsync(`${process.env.PUBLIC_URL}/models/${model.file}`);
      if (cancelled || !stageRef.current) return;
      const stage = stageRef.current;
      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch {
        setStatus("failed");
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.85;
      stage.prepend(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 50);

      // Éclairage de studio : ambiance douce, lumière principale de trois-quarts, liseré orange derrière
      const hemi = new THREE.HemisphereLight(0xffffff, 0x3a3530, 1.6);
      const key = new THREE.DirectionalLight(0xffffff, 2.6);
      key.position.set(2.2, 3, 3.5);
      const fill = new THREE.DirectionalLight(0xffffff, 0.7);
      fill.position.set(-3, 1, 2);
      const rim = new THREE.DirectionalLight(0xffffff, 3);
      rim.position.set(-1.5, 2.5, -3);
      const rim2 = new THREE.DirectionalLight(0xffffff, 1.2);
      rim2.position.set(2, 1.5, -2.5);
      scene.add(hemi, key, fill, rim, rim2);

      // Le corps
      const { geo, names } = mergeParts(THREE, gltf.scene);
      const mats = {
        peau: new THREE.MeshStandardMaterial({ color: 0xb8ad9f, roughness: 0.6, metalness: 0 }),
        tenue: new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.45, metalness: 0.05 }),
        "liseré": new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0 }),
      };
      const body = new THREE.Group();
      const mesh = new THREE.Mesh(geo, names.map((n) => mats[n] || mats.peau));
      body.add(mesh);
      scene.add(body);

      // Ombre au sol
      const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(0.4, 40),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false })
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.002;
      shadow.scale.set(1, 0.6, 1);
      scene.add(shadow);

      // Points cliquables : pastille, halo, et une sphère invisible plus grosse pour viser facilement
      const dotGeo = new THREE.SphereGeometry(0.02, 20, 14);
      const haloGeo = new THREE.SphereGeometry(0.036, 20, 14);
      const hitGeo = new THREE.SphereGeometry(0.07, 12, 8);
      const spots = [];
      const hits = [];
      for (const area of SENSITIVE_AREAS) {
        for (const p of model.spots[area.id] || []) {
          const dot = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({ toneMapped: false }));
          const halo = new THREE.Mesh(haloGeo, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false }));
          const hit = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
          for (const m of [dot, halo, hit]) { m.position.set(...p); m.userData.zone = area.id; body.add(m); }
          hits.push(hit);
          spots.push({ id: area.id, dot, halo });
        }
      }

      // Couleurs prises dans le thème de l'appli
      const colors = {};
      const readTheme = () => {
        colors.acc = new THREE.Color(cssVar("--acc", "#ff6a00"));
        colors.idle = new THREE.Color(0x111111);
        colors.ring = new THREE.Color(0xffffff);
        mats["liseré"].color.copy(colors.acc);
        rim.color.copy(colors.acc);
      };
      readTheme();
      const themeObs = new MutationObserver(readTheme);
      themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

      // Cadrage : corps entier, ou zoom sur la zone choisie
      const h = model.height;
      const FULL = { y: h * 0.5, dist: h * 2.5 };
      const ZOOM = h * 1.45;
      const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      const st = { rot: 0.3, targetRot: 0.3, y: FULL.y, dist: FULL.dist, lastFocus: undefined, hover: null };

      const resize = () => {
        const w = stage.clientWidth, hh = stage.clientHeight;
        if (!w || !hh) return;
        renderer.setSize(w, hh, false);
        camera.aspect = w / hh;
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(stage);

      // Clic, survol et glisser
      const ray = new THREE.Raycaster();
      const ndc = new THREE.Vector2();
      const pick = (e) => {
        const r = renderer.domElement.getBoundingClientRect();
        ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        ray.setFromCamera(ndc, camera);
        // Le premier objet touché : si c'est le corps devant un point, on ne prend pas le point caché
        const first = ray.intersectObjects([mesh, ...hits], false)[0];
        return first?.object.userData.zone || null;
      };
      const canvas = renderer.domElement;
      let drag = null;
      const onDown = (e) => { drag = { x: e.clientX, rot: st.targetRot, moved: false, id: e.pointerId }; };
      const onMove = (e) => {
        if (drag && e.pointerId === drag.id) {
          const dx = e.clientX - drag.x;
          if (Math.abs(dx) > 6) {
            if (!drag.moved) canvas.setPointerCapture?.(e.pointerId);
            drag.moved = true;
          }
          if (drag.moved) st.targetRot = drag.rot + dx * 0.012;
          return;
        }
        st.hover = e.pointerType === "mouse" ? pick(e) : null;
        canvas.style.cursor = st.hover ? "pointer" : "grab";
      };
      const onUp = (e) => {
        if (drag && !drag.moved) {
          const id = pick(e);
          if (id) live.current.onPick(id);
        }
        drag = null;
      };
      const onCancel = () => { drag = null; };
      const onLeave = () => { st.hover = null; };
      canvas.addEventListener("pointerdown", onDown);
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerup", onUp);
      canvas.addEventListener("pointercancel", onCancel);
      canvas.addEventListener("pointerleave", onLeave);

      let raf = 0;
      let last = performance.now();
      const frame = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const { value: sel, focus: f } = live.current;

        // Nouvelle zone choisie : on tourne le corps par le chemin le plus court
        if (f !== st.lastFocus) {
          st.lastFocus = f;
          if (f) st.targetRot = st.rot + wrap(TURN[f] - st.rot);
        }
        const target = f ? { y: Math.max(model.spots[f][0][1], h * 0.24), dist: ZOOM } : FULL;
        const k = reduced ? 1 : 1 - Math.exp(-dt * 7);
        st.rot += (st.targetRot - st.rot) * k;
        st.y += (target.y - st.y) * k;
        st.dist += (target.dist - st.dist) * k;
        body.rotation.y = st.rot;
        camera.position.set(0, st.y + 0.1, st.dist);
        camera.lookAt(0, st.y, 0);

        const pulse = reduced ? 1 : 1 + 0.22 * Math.sin(now / 160);
        for (const s of spots) {
          const on = sel.includes(s.id);
          const focused = s.id === f;
          s.dot.material.color.copy(on ? colors.acc : colors.idle);
          s.halo.material.color.copy(on ? colors.acc : colors.ring);
          s.halo.material.opacity = focused || s.id === st.hover ? 0.6 : 0.4;
          s.halo.scale.setScalar(focused ? 1.25 * pulse : s.id === st.hover ? 1.2 : 1);
        }
        renderer.render(scene, camera);
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
      setStatus("ok");

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        themeObs.disconnect();
        canvas.removeEventListener("pointerdown", onDown);
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerup", onUp);
        canvas.removeEventListener("pointercancel", onCancel);
        canvas.removeEventListener("pointerleave", onLeave);
        scene.traverse((o) => {
          o.geometry?.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m?.dispose());
        });
        renderer.dispose();
        canvas.remove();
      };
    }).catch(() => { if (!cancelled) setStatus("failed"); });

    return () => { cancelled = true; cleanup(); };
  }, [model]);

  const n = SENSITIVE_AREAS.length;
  const idx = SENSITIVE_AREAS.findIndex((a) => a.id === focus);
  const step = (d) => {
    const next = idx < 0 ? (d > 0 ? 0 : n - 1) : (idx + d + n) % n;
    setFocus(SENSITIVE_AREAS[next].id);
  };
  const area = SENSITIVE_AREAS[idx];
  const on = area && value.includes(area.id);

  // Sans WebGL (ou modèle introuvable) : on garde la liste de boutons
  if (status === "failed") {
    return (
      <div className="pills">
        {SENSITIVE_AREAS.map((a) => {
          const sel = value.includes(a.id);
          return (
            <button type="button" key={a.id} className={sel ? "on" : ""} aria-pressed={sel}
              disabled={disabled} onClick={() => onToggle(a.id)}>
              {a.label}<span aria-hidden="true">{sel ? " ×" : " +"}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bz">
      <div className="bz-stage" ref={stageRef}>
        {status === "loading" && <span className="bz-load mono dim">Chargement du modèle 3D…</span>}
        <span className="bz-tip mono dim" aria-hidden="true">Glisse pour tourner · touche un point</span>
        {focus && (
          <button type="button" className="bz-reset mono" onClick={() => setFocus(null)}>Vue entière</button>
        )}
      </div>

      <div className="bz-nav">
        <button type="button" className="bz-arrow" aria-label="Zone précédente" onClick={() => step(-1)}>‹</button>
        <div className="bz-cur" aria-live="polite">
          <b>{area ? area.label : "Corps entier"}</b>
          <span className={"mono" + (on ? " acc" : " dim")}>
            {area ? (on ? "Zone signalée" : "Non signalée")
              : value.length ? `${value.length} zone${value.length > 1 ? "s" : ""} signalée${value.length > 1 ? "s" : ""}` : "Aucune zone signalée"}
          </span>
        </div>
        <button type="button" className="bz-arrow" aria-label="Zone suivante" onClick={() => step(1)}>›</button>
      </div>

      {area && (
        <button type="button" className={"btn center bz-toggle" + (on ? " ghost" : "")} disabled={disabled}
          aria-pressed={on} onClick={() => onToggle(area.id)}>
          {on ? `Retirer : ${area.label.toLowerCase()}` : `Signaler : ${area.label.toLowerCase()}`}
        </button>
      )}

      {value.length > 0 && (
        <div className="pills bz-chips">
          {SENSITIVE_AREAS.filter((a) => value.includes(a.id)).map((a) => (
            <button type="button" key={a.id} className="on" disabled={disabled}
              aria-label={`Retirer ${a.label}`} onClick={() => onToggle(a.id)}>
              {a.label}<span aria-hidden="true"> ×</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
