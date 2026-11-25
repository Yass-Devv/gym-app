"""Convertit le corps de base MakeHuman (CC0) en GLB athlétique + points des zones sensibles.
Usage : python -I tools/makehuman-corps.py <dossier_avec_base.obj_et_targets> public/models
Dépend de numpy. Les fichiers .target nécessaires sont listés dans build().
"""
import json, os, struct, sys
import numpy as np

SRC, OUT = sys.argv[1], sys.argv[2]

# ── Lecture de l'OBJ ──
verts, groups = [], {}
g = None
with open(os.path.join(SRC, "base.obj")) as f:
    for line in f:
        if line.startswith("v "):
            verts.append([float(x) for x in line.split()[1:4]])
        elif line.startswith("g "):
            g = line.split()[1]
        elif line.startswith("f "):
            idx = [int(p.split("/")[0]) - 1 for p in line.split()[1:]]
            groups.setdefault(g, []).append(idx)
BASE = np.array(verts, dtype=np.float64)

def load_target(name):
    d = np.zeros_like(BASE)
    with open(os.path.join(SRC, name + ".target")) as f:
        for line in f:
            if line.startswith("#") or not line.strip():
                continue
            i, x, y, z = line.split()
            d[int(i)] = (float(x), float(y), float(z))
    return d

PROFILES = {
    # muscle 0.7 / poids 0.3 (silhouette sèche et musclée)
    "male": {"male-young": 1.0, "mm": 1.0, "lw": 0.5},
    "female": {"female-young": 1.0, "mm": 0.75, "lw": 0.45},
}

def build(sex):
    p = PROFILES[sex]
    v = BASE.copy()
    for eth in ("caucasian", "african", "asian"):
        v += load_target(f"{eth}-{sex}-young") / 3
    mm, lw = p["mm"], p["lw"]
    v += load_target(f"universal-{sex}-young-maxmuscle-averageweight") * mm * (1 - lw)
    v += load_target(f"universal-{sex}-young-maxmuscle-minweight") * mm * lw
    v += load_target(f"universal-{sex}-young-averagemuscle-minweight") * (1 - mm) * lw
    return v

def tris(gnames):
    out = []
    for gn in gnames:
        for face in groups.get(gn, []):
            for k in range(1, len(face) - 1):
                out.append((face[0], face[k], face[k + 1]))
    return np.array(out, dtype=np.int64)

def joint(v, name):
    ids = sorted({i for f in groups["joint-" + name] for i in f})
    return v[ids].mean(axis=0)

def raycast(orig, d, P, T):
    """Premier point de la surface touché par le rayon orig + t*d (Möller–Trumbore vectorisé)."""
    a, b, c = P[T[:, 0]], P[T[:, 1]], P[T[:, 2]]
    e1, e2 = b - a, c - a
    h = np.cross(d, e2)
    det = (e1 * h).sum(1)
    ok = np.abs(det) > 1e-12
    inv = np.where(ok, 1 / np.where(ok, det, 1), 0)
    s = orig - a
    u = (s * h).sum(1) * inv
    q = np.cross(s, e1)
    w = (q * d).sum(1) * inv
    t = (e2 * q).sum(1) * inv
    hit = ok & (u >= 0) & (w >= 0) & (u + w <= 1) & (t > 1e-6)
    if not hit.any():
        return None
    return orig + d * t[hit].min()

def surface(center, direction, P, T):
    d = np.asarray(direction, float); d /= np.linalg.norm(d)
    p = raycast(center + d * 0.6, -d, P, T)  # depuis l'extérieur, vers l'articulation
    return None if p is None else p + d * 0.004

def glb(path, P, prims):
    """prims : liste de (nom_matière, triangles). Une primitive par matière, positions partagées."""
    pad = lambda b, ch=b"\0": b + ch * ((4 - len(b) % 4) % 4)
    pos = pad(P.astype(np.float32).tobytes())
    big = P.shape[0] > 65535
    blobs, views, accs, meshp, mats = [pos], [], [], [], []
    views.append({"buffer": 0, "byteOffset": 0, "byteLength": len(pos), "target": 34962})
    accs.append({"bufferView": 0, "componentType": 5126, "count": len(P), "type": "VEC3",
                 "min": P.min(0).tolist(), "max": P.max(0).tolist()})
    off = len(pos)
    for k, (name, T) in enumerate(prims):
        b = pad(T.astype(np.uint32 if big else np.uint16).tobytes())
        views.append({"buffer": 0, "byteOffset": off, "byteLength": len(b), "target": 34963})
        accs.append({"bufferView": len(views) - 1, "componentType": 5125 if big else 5123, "count": int(T.size), "type": "SCALAR"})
        mats.append({"name": name, "pbrMetallicRoughness": {"baseColorFactor": [0.8, 0.8, 0.8, 1], "metallicFactor": 0, "roughnessFactor": 0.6}})
        meshp.append({"attributes": {"POSITION": 0}, "indices": len(accs) - 1, "material": k})
        blobs.append(b); off += len(b)
    binc = b"".join(blobs)
    gltf = {
        "asset": {"version": "2.0", "generator": "YASS-GYM depuis MakeHuman (CC0)", "copyright": "CC0 1.0 - MakeHuman base mesh"},
        "scene": 0, "scenes": [{"nodes": [0]}], "nodes": [{"mesh": 0, "name": "corps"}],
        "meshes": [{"primitives": meshp}], "materials": mats,
        "buffers": [{"byteLength": len(binc)}], "bufferViews": views, "accessors": accs,
    }
    js = pad(json.dumps(gltf, separators=(",", ":")).encode(), b" ")
    total = 12 + 8 + len(js) + 8 + len(binc)
    with open(path, "wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, total))
        f.write(struct.pack("<II", len(js), 0x4E4F534A)); f.write(js)
        f.write(struct.pack("<II", len(binc), 0x004E4942)); f.write(binc)

def cut(P, T, yc):
    """Découpe le maillage le long du plan horizontal y = yc (bords nets, sommets partagés)."""
    P = list(map(tuple, P)); out = []; memo = {}
    def mid(a, b):
        k = (min(a, b), max(a, b))
        if k not in memo:
            pa, pb = np.array(P[a]), np.array(P[b])
            t = (yc - pa[1]) / (pb[1] - pa[1])
            P.append(tuple(pa + (pb - pa) * t)); memo[k] = len(P) - 1
        return memo[k]
    for tri in T:
        side = [P[i][1] >= yc for i in tri]
        if all(side) or not any(side):
            out.append(tuple(tri)); continue
        # sommet isolé d'un côté : on le met en premier en gardant l'orientation
        lone = [k for k in range(3) if side.count(side[k]) == 1][0]
        a, b, c = tri[lone], tri[(lone + 1) % 3], tri[(lone + 2) % 3]
        m1, m2 = mid(a, b), mid(a, c)
        out += [(a, m1, m2), (m1, b, c), (m1, c, m2)]
    return np.array(P), np.array(out, dtype=np.int64)

def outfit(P, T, J, female):
    """Classe chaque triangle : 0 peau, 1 tenue (noir), 2 liseré (orange). Renvoie aussi le maillage découpé."""
    top = J("pelvis")[1] + (0.06 if female else 0.075)
    bottom = (J("l-knee")[1] + J("l-upper-leg")[1]) / 2 + (0.0 if female else -0.06)
    levels = [top, top - 0.035, bottom]
    if female:
        torso = (np.abs(P[:, 0]) < 0.14) & (P[:, 1] > top + 0.2) & (P[:, 1] < J("neck")[1] - 0.06)
        bust = P[torso][np.argmax(P[torso][:, 2]), 1]
        lo, hi = bust - 0.085, bust + 0.065
        levels += [lo, lo + 0.025, hi]
    for yc in levels:
        P, T = cut(P, T, yc)
    c = P[T].mean(1)
    x, y = c[:, 0], c[:, 1]
    cls = np.zeros(len(T), dtype=np.int8)
    legs = (np.abs(x) < 0.235) & (y < top) & (y > bottom)
    cls[legs] = 1
    cls[legs & (y > top - 0.035)] = 2
    if female:
        bra = (np.abs(x) < 0.175) & (y > lo) & (y < hi)
        cls[bra] = 1
        cls[bra & (y < lo + 0.025)] = 2
    return P, T, cls

meta = {}
for sex in ("male", "female"):
    v = build(sex) * 0.1  # décimètres → mètres
    T_all = tris(["body", "helper-l-eye", "helper-r-eye"])
    used = np.unique(T_all)
    remap = -np.ones(len(v), dtype=np.int64); remap[used] = np.arange(len(used))
    P = v[used].copy(); T = remap[T_all]
    pel = joint(v, "pelvis")
    shift = np.array([-pel[0], -P[:, 1].min(), -pel[2]])
    P += shift
    J = lambda n: joint(v, n) + shift
    Tb = remap[tris(["body"])]

    spots = {}
    def put(zone, pts):
        spots[zone] = [np.round(p, 4).tolist() for p in pts if p is not None]
    side = lambda n: [(J(n.replace("X", "l")), 1), (J(n.replace("X", "r")), -1)]
    # Les côtés : l = gauche du personnage. On place chaque point selon le signe de x.
    def lr(n, dirf):
        return [surface(c, dirf(np.sign(c[0]) or s), P, Tb) for c, s in side(n)]
    neck = J("neck")
    put("cou", [surface(neck + [0, -0.01, 0], [0, -0.25, 1], P, Tb)])
    put("epaules", lr("X-shoulder", lambda s: [s * 0.7, 0.8, 0.5]))
    put("coudes", lr("X-elbow", lambda s: [s * 0.3, 0, 1]))
    put("poignets", lr("X-hand", lambda s: [s * 0.2, 0, 1]))
    scap = (J("l-scapula") + J("r-scapula")) / 2
    put("dos", [surface(np.array([0, scap[1] - 0.04, scap[2]]), [0, 0, -1], P, Tb)])
    spines = sorted([J(f"spine-{i}") for i in range(1, 5)], key=lambda p: p[1])
    put("lombaires", [surface(np.array([0, spines[0][1] + 0.02, spines[0][2]]), [0, 0, -1], P, Tb)])
    put("hanches", lr("X-upper-leg", lambda s: [s * 1, 0.1, 0.35]))
    put("genoux", lr("X-knee", lambda s: [0, 0, 1]))
    put("chevilles", lr("X-ankle", lambda s: [s * 1, 0, 0.25]))
    meta[sex] = {"height": round(float(P[:, 1].max()), 3), "spots": spots,
                 "verts": int(len(P)), "tris": int(len(T))}
    P, T, cls = outfit(P, T, J, sex == "female")
    prims = [(n, T[cls == k]) for k, n in enumerate(["peau", "tenue", "liseré"]) if (cls == k).any()]
    glb(os.path.join(OUT, f"corps-{'homme' if sex == 'male' else 'femme'}.glb"), P, prims)

print(json.dumps(meta, indent=1))
