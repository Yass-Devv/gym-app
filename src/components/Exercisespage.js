import React, { useState, useEffect } from "react";
import { api } from "../api";
import { Logo, SensitiveBadge, catPhoto, clean, plural } from "./Shell";
import MuscleMap from "./MuscleMap";

// ─── 40 EXERCICES HOMME ───────────────────────────────────────────────────────
const EXERCISES_HOMME = [
  { id:"h1",  name:"Squat barre",          cat:"Jambes",   emoji:"🏋️", diff:"Intermédiaire", calPerRep:0.35, muscles:["Quadriceps","Fessiers","Ischio-jambiers"], zones:["legs"],             benefits:["Force des jambes","Hormones anabolisantes","Posture"], desc:"Barre sur les trapèzes, descendez cuisses parallèles au sol." },
  { id:"h2",  name:"Soulevé de terre",      cat:"Dos",      emoji:"🏗️", diff:"Avancé",        calPerRep:0.45, muscles:["Dos","Fessiers","Ischio-jambiers","Trapèze"], zones:["back","legs"],   benefits:["Force brute totale","Chaîne postérieure","Testostérone"], desc:"Barre au sol, dos droit, poussez avec les jambes." },
  { id:"h3",  name:"Développé couché",      cat:"Poitrine", emoji:"💪", diff:"Intermédiaire", calPerRep:0.32, muscles:["Pectoraux","Triceps","Épaules"],             zones:["chest","arms"],    benefits:["Pectoraux épais","Force de poussée","Haut du corps"], desc:"Allongé sur banc, descendez la barre jusqu'à la poitrine." },
  { id:"h4",  name:"Traction pronation",    cat:"Dos",      emoji:"🔝", diff:"Avancé",        calPerRep:0.38, muscles:["Grand dorsal","Biceps","Trapèze"],           zones:["back","arms"],     benefits:["Dos en V","Prise de force","Posture droite"], desc:"Barre prise large, tirez jusqu'au menton au-dessus." },
  { id:"h5",  name:"Développé militaire",   cat:"Épaules",  emoji:"🎯", diff:"Intermédiaire", calPerRep:0.30, muscles:["Deltoïdes","Triceps","Trapèze"],             zones:["shoulders","arms"],benefits:["Épaules larges","Force fonctionnelle","Stabilité"], desc:"Poussez la barre au-dessus de la tête en position debout." },
  { id:"h6",  name:"Squat avant",           cat:"Jambes",   emoji:"🦵", diff:"Avancé",        calPerRep:0.34, muscles:["Quadriceps","Core","Fessiers"],              zones:["legs","core"],     benefits:["Quadriceps massifs","Mobilité","Posture"], desc:"Barre sur les clavicules, descendez en gardant le buste droit." },
  { id:"h7",  name:"Rowing barre",          cat:"Dos",      emoji:"🚣", diff:"Intermédiaire", calPerRep:0.28, muscles:["Grand dorsal","Rhomboïdes","Biceps"],        zones:["back","arms"],     benefits:["Dos épais","Posture","Équilibre musculaire"], desc:"Buste penché à 45°, tirez la barre vers le nombril." },
  { id:"h8",  name:"Dips lestés",           cat:"Poitrine", emoji:"⬇️", diff:"Avancé",        calPerRep:0.32, muscles:["Pectoraux","Triceps","Épaules"],             zones:["chest","arms"],    benefits:["Masse pectorale","Triceps puissants","Force bras"], desc:"Barres parallèles avec poids ajoutés, descente contrôlée." },
  { id:"h9",  name:"Curl barre",            cat:"Bras",     emoji:"💪", diff:"Débutant",      calPerRep:0.20, muscles:["Biceps","Brachial","Avant-bras"],            zones:["arms"],            benefits:["Biceps volumineux","Masse bras","Force préhension"], desc:"Barre en supination, fléchissez sans balancer le buste." },
  { id:"h10", name:"Extension triceps câble",cat:"Bras",    emoji:"📏", diff:"Débutant",      calPerRep:0.18, muscles:["Triceps"],                                   zones:["arms"],            benefits:["Triceps définis","Isolation","Volume bras"], desc:"Câble en hauteur, poussez vers le bas en gardant les coudes fixes." },
  { id:"h11", name:"Leg press lourd",        cat:"Jambes",  emoji:"🦿", diff:"Débutant",      calPerRep:0.28, muscles:["Quadriceps","Fessiers","Mollets"],           zones:["legs"],            benefits:["Force jambes","Sécurisé dos","Charge maximale"], desc:"Machine inclinée, poussez avec les pieds, ne verrouillez pas les genoux." },
  { id:"h12", name:"Hack squat",             cat:"Jambes",  emoji:"⚙️", diff:"Intermédiaire", calPerRep:0.30, muscles:["Quadriceps","Fessiers"],                    zones:["legs"],            benefits:["Quadriceps isolation","Genoux sains","Technique sûre"], desc:"Machine hack squat, descendez jusqu'à 90° de flexion." },
  { id:"h13", name:"Burpees",                cat:"Cardio",  emoji:"🔥", diff:"Avancé",        calPerRep:0.50, muscles:["Corps entier"],                             zones:["legs","chest","core"],benefits:["Cardio intense","Calories brûlées","Explosivité"], desc:"Pompe + saut enchaînés, maintien cardio élevé." },
  { id:"h14", name:"Pompes diamant",          cat:"Bras",   emoji:"💎", diff:"Intermédiaire", calPerRep:0.25, muscles:["Triceps","Pectoraux internes"],              zones:["arms","chest"],    benefits:["Triceps ciblés","Poitrine interne","Sans matériel"], desc:"Mains en forme de diamant sous la poitrine, pompez." },
  { id:"h15", name:"Arnold press",            cat:"Épaules",emoji:"🌀", diff:"Intermédiaire", calPerRep:0.26, muscles:["Deltoïdes","Triceps","Pectoraux"],           zones:["shoulders","arms"],benefits:["Épaules complètes","Rotation naturelle","Volume"], desc:"Rotation des haltères paume dedans vers dehors en poussant." },
  { id:"h16", name:"Face pull",               cat:"Épaules",emoji:"🎗️", diff:"Débutant",      calPerRep:0.16, muscles:["Deltoïdes post.","Trapèze","Rhomboïdes"],   zones:["shoulders","back"],benefits:["Équilibre épaules","Prévention blessures","Posture"], desc:"Câble haut, tirez la corde vers le visage coudes écartés." },
  { id:"h17", name:"Planche",                 cat:"Abdos",  emoji:"⚡", diff:"Débutant",      calPerRep:0.15, muscles:["Core","Épaules","Fessiers"],                 zones:["core"],            benefits:["Gainage total","Dos protégé","Stabilité"], desc:"Avant-bras au sol, corps aligné, contractez tout." },
  { id:"h18", name:"Crunch câble",            cat:"Abdos",  emoji:"🔄", diff:"Intermédiaire", calPerRep:0.14, muscles:["Abdominaux","Obliques"],                    zones:["core"],            benefits:["Abdos définis","Résistance progressive","Core fort"], desc:"À genoux face au câble, fléchissez en touchant les cuisses." },
  { id:"h19", name:"Box jump",                cat:"Cardio", emoji:"📦", diff:"Avancé",        calPerRep:0.42, muscles:["Quadriceps","Fessiers","Mollets"],           zones:["legs"],            benefits:["Explosivité","Puissance athlétique","Cardio"], desc:"Sautez sur une boîte, réception genoux fléchis." },
  { id:"h20", name:"Kettlebell swing",        cat:"Cardio", emoji:"🔔", diff:"Intermédiaire", calPerRep:0.28, muscles:["Fessiers","Ischio-jambiers","Core","Épaules"],zones:["legs","core"],    benefits:["Cardio & force","Chaîne postérieure","Coordination"], desc:"Poussée des hanches pour balancer le kettlebell à hauteur épaules." },
  { id:"h21", name:"Rowing haltère",          cat:"Dos",    emoji:"🚣", diff:"Intermédiaire", calPerRep:0.27, muscles:["Grand dorsal","Rhomboïdes","Biceps"],        zones:["back","arms"],     benefits:["Dos épais unilatéral","Équilibre","Posture"], desc:"Un genou sur banc, tirez l'haltère vers la hanche." },
  { id:"h22", name:"Leg curl couché",         cat:"Jambes", emoji:"🦵", diff:"Débutant",      calPerRep:0.22, muscles:["Ischio-jambiers"],                          zones:["legs"],            benefits:["Ischio isolation","Équilibre quadri/ischio","Prévention"], desc:"Machine allongé, fléchissez les talons vers les fesses." },
  { id:"h23", name:"Extension quadriceps",    cat:"Jambes", emoji:"🦿", diff:"Débutant",      calPerRep:0.20, muscles:["Quadriceps"],                               zones:["legs"],            benefits:["Isolation quadriceps","Définition","Genou stable"], desc:"Machine assise, étendez les jambes sans verrouiller les genoux." },
  { id:"h24", name:"Shrugs haltères",         cat:"Épaules",emoji:"🤷", diff:"Débutant",      calPerRep:0.18, muscles:["Trapèze supérieur"],                        zones:["shoulders"],       benefits:["Trapèzes imposants","Cou puissant","Look athlétique"], desc:"Haltères en main, haussez les épaules vers les oreilles." },
  { id:"h25", name:"Dumbbell fly",            cat:"Poitrine",emoji:"🦅", diff:"Intermédiaire",calPerRep:0.24, muscles:["Pectoraux","Deltoïdes ant."],                zones:["chest","shoulders"],benefits:["Étirement pectoraux","Définition","Amplitude"], desc:"Allongé, ouvrez les bras en arc de cercle jusqu'aux côtés." },
  { id:"h26", name:"Corde à sauter",          cat:"Cardio", emoji:"🪢", diff:"Débutant",      calPerRep:0.12, muscles:["Mollets","Coordination","Core"],            zones:["legs","core"],     benefits:["Cardio efficace","Coordination","Endurance"], desc:"Sautez à la corde rythme régulier, pointe des pieds." },
  { id:"h27", name:"Hollow body",             cat:"Abdos",  emoji:"🛸", diff:"Avancé",        calPerRep:0.20, muscles:["Core","Abdominaux","Hip flexors"],           zones:["core"],            benefits:["Gainage gymnique","Tension profonde","Force core"], desc:"Allongé, bras et jambes levés légèrement, ventre rentré." },
  { id:"h28", name:"Leg raise suspendu",      cat:"Abdos",  emoji:"🔼", diff:"Avancé",        calPerRep:0.22, muscles:["Abdominaux bas","Hip flexors"],              zones:["core"],            benefits:["Abdos bas ciblés","Force suspension","Core complet"], desc:"Suspendu à une barre, levez les jambes tendues à 90°." },
  { id:"h29", name:"Incliné développé",       cat:"Poitrine",emoji:"📐", diff:"Intermédiaire",calPerRep:0.30, muscles:["Pectoraux supérieurs","Triceps","Épaules"],  zones:["chest","arms"],    benefits:["Poitrine haute","Volume pectoraux","Symétrie"], desc:"Banc incliné 30-45°, développez la barre ou haltères." },
  { id:"h30", name:"Decline développé",       cat:"Poitrine",emoji:"📉", diff:"Intermédiaire",calPerRep:0.30, muscles:["Pectoraux inférieurs","Triceps"],            zones:["chest","arms"],    benefits:["Poitrine basse","Définition","Complet pectoraux"], desc:"Banc décliné, développez la barre vers la poitrine basse." },
  { id:"h31", name:"Bulgarian squat",         cat:"Jambes", emoji:"🇧🇬", diff:"Avancé",       calPerRep:0.32, muscles:["Quadriceps","Fessiers","Stabilisateurs"],    zones:["legs"],            benefits:["Force unilatérale","Équilibre","Fessiers ciblés"], desc:"Pied arrière sur banc, descendez le genou avant vers le sol." },
  { id:"h32", name:"Good morning",            cat:"Dos",    emoji:"🌅", diff:"Intermédiaire", calPerRep:0.25, muscles:["Ischio-jambiers","Érecteurs","Fessiers"],    zones:["back","legs"],     benefits:["Chaîne postérieure","Ischio flexibilité","Bas du dos"], desc:"Barre sur nuque, inclinez le buste en gardant le dos droit." },
  { id:"h33", name:"Dips triceps banc",       cat:"Bras",   emoji:"🪑", diff:"Débutant",      calPerRep:0.22, muscles:["Triceps","Épaules"],                        zones:["arms"],            benefits:["Triceps sans machine","Accessible","Force poussée"], desc:"Mains sur banc derrière vous, descendez et remontez." },
  { id:"h34", name:"Curl concentré",          cat:"Bras",   emoji:"🎯", diff:"Débutant",      calPerRep:0.17, muscles:["Biceps chef long"],                         zones:["arms"],            benefits:["Pic biceps","Isolation maximale","Symétrie"], desc:"Coude sur la cuisse, fléchissez lentement sans balancement." },
  { id:"h35", name:"Mountain climbers",       cat:"Cardio", emoji:"🧗", diff:"Intermédiaire", calPerRep:0.22, muscles:["Core","Épaules","Jambes"],                  zones:["core","legs"],     benefits:["Cardio gainage","Coordination","Brûle graisses"], desc:"Position pompe, genoux alternés vers la poitrine rapidement." },
  { id:"h36", name:"Tirage vertical",         cat:"Dos",    emoji:"⬇️", diff:"Débutant",      calPerRep:0.25, muscles:["Grand dorsal","Biceps","Rhomboïdes"],       zones:["back","arms"],     benefits:["Dos large","Alternative traction","Progression"], desc:"Machine ou câble, tirez la barre vers la poitrine buste légèrement incliné." },
  { id:"h37", name:"Peck deck",               cat:"Poitrine",emoji:"🦁", diff:"Débutant",      calPerRep:0.20, muscles:["Pectoraux","Deltoïdes ant."],               zones:["chest"],           benefits:["Isolation pectoraux","Étirement","Définition"], desc:"Machine, rapprochez les coudes devant vous en arc de cercle." },
  { id:"h38", name:"Élévations latérales",    cat:"Épaules",emoji:"✈️", diff:"Débutant",      calPerRep:0.16, muscles:["Deltoïdes latéraux"],                       zones:["shoulders"],       benefits:["Épaules larges","Définition","Symétrie"], desc:"Haltères, levez les bras sur les côtés jusqu'à hauteur épaules." },
  { id:"h39", name:"Sprint intervalles",      cat:"Cardio", emoji:"🏃", diff:"Avancé",        calPerRep:0.60, muscles:["Jambes","Cardio","Core"],                   zones:["legs","core"],     benefits:["Cardio maximal","Brûle graisses","Vitesse"], desc:"Sprint 20-30s effort max, récupération 40s, répétez." },
  { id:"h40", name:"Farmer walk",             cat:"Cardio", emoji:"👨‍🌾", diff:"Intermédiaire",calPerRep:0.35, muscles:["Avant-bras","Trapèze","Core","Jambes"],     zones:["back","legs","core"],benefits:["Force fonctionnelle","Prise en main","Cardio force"], desc:"Haltères lourds en main, marchez sur une distance définie." },
  { id:"h41", name:"Squat pause", cat:"Jambes", emoji:"\u23f8\ufe0f", diff:"Avanc\u00e9", calPerRep:0.36, muscles:["Quadriceps", "Fessiers", "Core"], zones:["legs", "core"], benefits:["Force explosive", "Stabilit\u00e9 en bas", "Contr\u00f4le"], desc:"Effectuez un squat normal mais faites une pause de 2-3 secondes en bas avant de remonter. Gardez la poitrine haute, les genoux align\u00e9s sur les orteils et le dos parfaitement droit. \u26a0\ufe0f \u00c9vitez de vous d\u00e9tendre en bas : restez sous tension pendant toute la pause. Inspirez en descendant, expirez en poussant." },
  { id:"h42", name:"Deadlift roumain halt\u00e8res", cat:"Dos", emoji:"\ud83c\udfcb\ufe0f", diff:"Interm\u00e9diaire", calPerRep:0.33, muscles:["Ischio-jambiers", "Fessiers", "\u00c9recteurs"], zones:["back", "legs"], benefits:["Ischio-jambiers profonds", "Fessiers toniques", "Souplesse"], desc:"Debout, halt\u00e8res devant les cuisses, descendez-les le long des jambes en poussant les hanches vers l'arri\u00e8re, dos droit. Sentez l'\u00e9tirement dans les ischio-jambiers. \ud83d\udca1 Conseil : imaginez que vous essayez de toucher le mur derri\u00e8re vous avec vos fessiers, pas de fl\u00e9chir les genoux. Remontez en contractant les fessiers en haut." },
  { id:"h43", name:"Pull-over halt\u00e8re", cat:"Poitrine", emoji:"\ud83d\udd03", diff:"Interm\u00e9diaire", calPerRep:0.24, muscles:["Pectoraux", "Grand dorsal", "Triceps"], zones:["chest", "back"], benefits:["Expansion thoracique", "Connexion pec-dos", "Amplitude"], desc:"Allong\u00e9 transversalement sur un banc, halt\u00e8re \u00e0 deux mains au-dessus de la poitrine. Descendez l'halt\u00e8re derri\u00e8re la t\u00eate en arc de cercle, bras l\u00e9g\u00e8rement fl\u00e9chis. \u26a0\ufe0f Ne descendez pas trop bas si manque de souplesse. Expirez en remontant. Id\u00e9al \u00e0 faire apr\u00e8s des exercices de cage thoracique." },
  { id:"h44", name:"Squat Zercher", cat:"Jambes", emoji:"\ud83e\udd3c", diff:"Avanc\u00e9", calPerRep:0.38, muscles:["Quadriceps", "Core", "\u00c9recteurs", "Biceps"], zones:["legs", "core"], benefits:["Force core extr\u00eame", "Posture athl\u00e9tique", "Polyarticulaire"], desc:"Barre plac\u00e9e dans le creux des coudes fl\u00e9chis, bras crois\u00e9s. Descendez en squat profond, gardez les coudes relev\u00e9s et le buste droit. \ud83d\udca1 Cet exercice force naturellement une position verticale du buste. Id\u00e9al pour les athl\u00e8tes. \u26a0\ufe0f Utilisez des prot\u00e8ge-coudes si la barre est inconfortable." },
  { id:"h45", name:"Bench press prise serr\u00e9e", cat:"Bras", emoji:"\ud83e\udd0f", diff:"Interm\u00e9diaire", calPerRep:0.28, muscles:["Triceps", "Pectoraux internes", "\u00c9paules ant."], zones:["arms", "chest"], benefits:["Triceps massifs", "Poitrine interne", "Force pouss\u00e9e"], desc:"Sur le banc plat, prenez la barre avec une prise \u00e0 largeur d'\u00e9paules. Descendez la barre vers le bas du sternum, coudes pr\u00e8s du corps. \ud83d\udca1 La cl\u00e9 : gardez les coudes \u00e0 45\u00b0 du corps, ni trop \u00e9cart\u00e9s ni trop serr\u00e9s. \u26a0\ufe0f N'utilisez pas une prise trop \u00e9troite qui stresse les poignets." },
  { id:"h46", name:"Traction supination", cat:"Dos", emoji:"\ud83d\udd04", diff:"Avanc\u00e9", calPerRep:0.4, muscles:["Biceps", "Grand dorsal", "Rhombo\u00efdes"], zones:["back", "arms"], benefits:["Biceps + dos combin\u00e9", "Force fonctionnelle", "Synergie musculaire"], desc:"Barre prise en supination (paumes vers vous), largeur d'\u00e9paules. Tirez en amenant le menton au-dessus de la barre. \ud83d\udca1 La prise supination active beaucoup plus les biceps que la pronation. D\u00e9marrez avec les bras tendus, ne balancez pas le corps. Descendez lentement en 3 secondes." },
  { id:"h47", name:"D\u00e9velopp\u00e9 halt\u00e8res inclin\u00e9", cat:"Poitrine", emoji:"\ud83d\udcc8", diff:"Interm\u00e9diaire", calPerRep:0.3, muscles:["Pectoraux sup.", "Delto\u00efdes ant.", "Triceps"], zones:["chest", "arms"], benefits:["Poitrine haute", "\u00c9quilibre droite/gauche", "Amplitude"], desc:"Banc \u00e0 30-45\u00b0, halt\u00e8res en main \u00e0 hauteur d'\u00e9paules. Poussez en arc de cercle vers le haut en rapprochant l\u00e9g\u00e8rement les halt\u00e8res. \ud83d\udca1 Les halt\u00e8res permettent une meilleure amplitude que la barre. \u26a0\ufe0f Ne laissez pas les halt\u00e8res se toucher en haut, maintenez la tension." },
  { id:"h48", name:"Rowing Yates", cat:"Dos", emoji:"\ud83d\udcaa", diff:"Interm\u00e9diaire", calPerRep:0.29, muscles:["Dos \u00e9pais", "Rhombo\u00efdes", "Biceps"], zones:["back", "arms"], benefits:["Dos \u00e9pais style bodybuilding", "Trap\u00e8zes m\u00e9dians", "Force"], desc:"Buste inclin\u00e9 \u00e0 seulement 70\u00b0 (presque droit), barre en supination. Tirez vers le nombril en gardant les coudes proches du corps. \ud83d\udca1 Cette variante de Dorian Yates favorise le dos \u00e9pais plut\u00f4t que le dos large. Gardez la poitrine haute et contractez les omoplates \u00e0 chaque rep." },
  { id:"h49", name:"Hack squat machine", cat:"Jambes", emoji:"\ud83d\udd27", diff:"D\u00e9butant", calPerRep:0.28, muscles:["Quadriceps", "Fessiers"], zones:["legs"], benefits:["S\u00e9curis\u00e9 pour le dos", "Quadriceps cibl\u00e9s", "Progression facile"], desc:"Machine hack squat, pieds \u00e0 largeur d'\u00e9paules \u00e0 mi-plateforme. Descendez jusqu'\u00e0 90\u00b0 de flexion du genou. \ud83d\udca1 Position des pieds haute = plus de fessiers, position basse = plus de quadriceps. \u26a0\ufe0f Ne verrouillez jamais les genoux en haut. Contr\u00f4lez la descente en 2-3 secondes." },
  { id:"h50", name:"Overhead squat", cat:"Jambes", emoji:"\ud83c\udfc6", diff:"Avanc\u00e9", calPerRep:0.4, muscles:["Corps entier", "Core", "\u00c9paules", "Quadriceps"], zones:["legs", "core", "shoulders"], benefits:["Mobilit\u00e9 totale", "Core de fer", "Coordination"], desc:"Barre maintenue \u00e0 bout de bras au-dessus de la t\u00eate, prise large. Descendez en squat complet sans laisser la barre d\u00e9river vers l'avant. \ud83d\udca1 C'est le test ultime de mobilit\u00e9 et stabilit\u00e9. \u26a0\ufe0f Commencez avec un b\u00e2ton ou une barre vide avant d'ajouter du poids. Regardez devant vous." },
  { id:"h51", name:"Curl inclin\u00e9 halt\u00e8res", cat:"Bras", emoji:"\ud83d\udcd0", diff:"Interm\u00e9diaire", calPerRep:0.19, muscles:["Biceps chef long", "Brachial"], zones:["arms"], benefits:["\u00c9tirement biceps maximal", "Chef long isol\u00e9", "Pic biceps"], desc:"Assis sur banc inclin\u00e9 \u00e0 45-60\u00b0, bras pendants vers le sol. Fl\u00e9chissez les halt\u00e8res en supinant le poignet en montant. \ud83d\udca1 L'inclinaison place les biceps en pr\u00e9-\u00e9tirement, maximisant le travail du chef long. \u26a0\ufe0f Descendez compl\u00e8tement \u00e0 chaque rep. Ne balancez pas les \u00e9paules." },
  { id:"h52", name:"Skull crusher", cat:"Bras", emoji:"\ud83d\udc80", diff:"Interm\u00e9diaire", calPerRep:0.2, muscles:["Triceps", "Chef long triceps"], zones:["arms"], benefits:["Masse triceps", "Isolation compl\u00e8te", "Force extension"], desc:"Allong\u00e9 sur banc, barre EZ au-dessus de la poitrine, bras tendus. Descendez la barre vers le front en fl\u00e9chissant uniquement les coudes. \ud83d\udca1 Gardez les coudes point\u00e9s vers le plafond, ne les laissez pas s'\u00e9carter. \u26a0\ufe0f Barre EZ recommand\u00e9e pour les poignets. Utilisez un partenaire si vous montez lourd." },
  { id:"h53", name:"Leg extension isom\u00e9trique", cat:"Jambes", emoji:"\u23f1\ufe0f", diff:"D\u00e9butant", calPerRep:0.16, muscles:["Quadriceps", "VMO"], zones:["legs"], benefits:["Activation VMO", "Genou stable", "R\u00e9habilitation"], desc:"Machine leg extension, montez \u00e0 90\u00b0 et maintenez 3 secondes en haut avant de descendre lentement. \ud83d\udca1 La contraction isom\u00e9trique renforce particuli\u00e8rement le VMO (vaste m\u00e9dial oblique), crucial pour la stabilit\u00e9 du genou. \u26a0\ufe0f Pas de charge trop lourde : la qualit\u00e9 prime sur la quantit\u00e9 ici." },
  { id:"h54", name:"Tirage horizontal c\u00e2ble", cat:"Dos", emoji:"\ud83d\udd00", diff:"D\u00e9butant", calPerRep:0.24, muscles:["Rhombo\u00efdes", "Trap\u00e8ze m\u00e9dian", "Biceps"], zones:["back", "arms"], benefits:["Posture parfaite", "Omoplates actives", "Dos tonique"], desc:"Assis face au c\u00e2ble bas, poign\u00e9es neutres, tirez vers le ventre en serrant les omoplates. \ud83d\udca1 Concentrez-vous sur le mouvement des omoplates : elles doivent se rapprocher de la colonne vert\u00e9brale. Maintenez 1 seconde en position contract\u00e9e. \u26a0\ufe0f Ne balancez pas le buste, restez droit." },
  { id:"h55", name:"\u00c9l\u00e9vation frontale halt\u00e8res", cat:"\u00c9paules", emoji:"\u2b06\ufe0f", diff:"D\u00e9butant", calPerRep:0.17, muscles:["Delto\u00efde ant\u00e9rieur", "Pectoraux sup."], zones:["shoulders"], benefits:["\u00c9paules avant", "\u00c9quilibre delto\u00efdes", "D\u00e9finition"], desc:"Debout, halt\u00e8res devant les cuisses. Levez un bras \u00e0 la fois jusqu'\u00e0 hauteur des yeux, l\u00e9g\u00e8rement de c\u00f4t\u00e9. \ud83d\udca1 L\u00e9g\u00e8re rotation externe du pouce vers le haut en montant pour mieux activer le delto\u00efde. \u26a0\ufe0f \u00c9vitez de monter au-dessus des \u00e9paules : cela stresse inutilement l'articulation." },
  { id:"h56", name:"Squat bulgare avec halt\u00e8res", cat:"Jambes", emoji:"\ud83c\udfcb\ufe0f", diff:"Avanc\u00e9", calPerRep:0.34, muscles:["Quadriceps", "Fessiers", "Stabilisateurs"], zones:["legs"], benefits:["Force unilat\u00e9rale", "\u00c9quilibre", "Isolation fessiers"], desc:"Un pied sur banc derri\u00e8re vous, halt\u00e8res en main. Descendez le genou avant vers le sol, genou align\u00e9 sur le pied. \ud83d\udca1 La longueur de la foul\u00e9e d\u00e9termine le muscle cibl\u00e9 : foul\u00e9e longue = fessiers, foul\u00e9e courte = quadriceps. \u26a0\ufe0f Regardez droit devant pour maintenir l'\u00e9quilibre." },
  { id:"h57", name:"Rowing T-bar", cat:"Dos", emoji:"\ud83d\ude80", diff:"Interm\u00e9diaire", calPerRep:0.3, muscles:["Grand dorsal", "Rhombo\u00efdes", "Trap\u00e8ze"], zones:["back", "arms"], benefits:["\u00c9paisseur dos", "Force maximale", "Prise en main"], desc:"Machine T-bar ou barre dans un coin, prise neutre. Tirez vers la poitrine en gardant le buste \u00e0 45\u00b0. \ud83d\udca1 Id\u00e9al pour d\u00e9velopper l'\u00e9paisseur du dos plut\u00f4t que la largeur. \u26a0\ufe0f Gardez le dos droit et ne laissez pas la charge tirer vos \u00e9paules vers l'avant en bas." },
  { id:"h58", name:"Sissy squat", cat:"Jambes", emoji:"\ud83c\udfad", diff:"Avanc\u00e9", calPerRep:0.26, muscles:["Quadriceps", "Rotule"], zones:["legs"], benefits:["Isolation quadriceps", "Extension compl\u00e8te", "Force genou"], desc:"Debout sur les orteils, inclinez le corps vers l'arri\u00e8re en fl\u00e9chissant les genoux vers l'avant. Les hanches restent en ligne droite avec les \u00e9paules. \ud83d\udca1 Cet exercice isole exceptionnellement les quadriceps. \u26a0\ufe0f D\u00e9conseill\u00e9 si vous avez des probl\u00e8mes aux genoux. Commencez avec le soutien d'un mur." },
  { id:"h59", name:"Power clean", cat:"Cardio", emoji:"\u26a1", diff:"Avanc\u00e9", calPerRep:0.55, muscles:["Corps entier", "Explosivit\u00e9", "Trapezes"], zones:["legs", "back", "shoulders"], benefits:["Puissance athl\u00e9tique", "Explosivit\u00e9 totale", "Coordination"], desc:"Depuis le sol, tirez la barre explosivementau niveau des hanches, puis recevez-la sur les \u00e9paules en vous accroupissant. \ud83d\udca1 Le power clean est LE mouvement d'halt\u00e9rophilie pour d\u00e9velopper la puissance. \u26a0\ufe0f Apprentissage obligatoire avec un coach ou une barre l\u00e9g\u00e8re avant de monter en charge." },
  { id:"h60", name:"Planche lat\u00e9rale", cat:"Abdos", emoji:"\u2194\ufe0f", diff:"Interm\u00e9diaire", calPerRep:0.16, muscles:["Obliques", "Core", "Abducteurs"], zones:["core"], benefits:["Obliques cibl\u00e9s", "Gainage lat\u00e9ral", "Taille"], desc:"Sur l'avant-bras lat\u00e9ralement, corps align\u00e9 de la t\u00eate aux pieds. Soulevez les hanches et maintenez. \ud83d\udca1 Pour augmenter la difficult\u00e9 : soulevez le bras libre vers le plafond ou ajoutez une rotation de hanche. \u26a0\ufe0f Ne laissez pas les hanches tomber. Commencez par 20 secondes de chaque c\u00f4t\u00e9." },
  { id:"h61", name:"Dragon flag", cat:"Abdos", emoji:"\ud83d\udc09", diff:"Avanc\u00e9", calPerRep:0.28, muscles:["Core entier", "Abdominaux", "Stabilisateurs"], zones:["core"], benefits:["Force core extr\u00eame", "Calisthenics", "Contr\u00f4le"], desc:"Allong\u00e9 sur un banc, tenez la structure derri\u00e8re la t\u00eate. Montez le corps en planche verticale puis descendez lentement en gardant le corps rigide. \ud83d\udca1 Exercice de Bruce Lee. Descendez sur 4-5 secondes pour maximaliser la tension. \u26a0\ufe0f Ne laissez jamais les hanches fl\u00e9chir, le corps doit rester rectiligne." },
  { id:"h62", name:"Cable fly poitrine", cat:"Poitrine", emoji:"\ud83e\udd85", diff:"Interm\u00e9diaire", calPerRep:0.22, muscles:["Pectoraux", "Delto\u00efdes ant."], zones:["chest"], benefits:["Tension constante", "D\u00e9finition pectoraux", "\u00c9tirement"], desc:"Deux c\u00e2bles au niveau des \u00e9paules, tirez vers le centre en arc de cercle. \ud83d\udca1 Contrairement aux halt\u00e8res, les c\u00e2bles maintiennent une tension constante sur tout le mouvement. \u26a0\ufe0f Ne croisez pas les mains trop loin : arr\u00eatez quand elles se touchent. Contr\u00f4lez le retour." },
  { id:"h63", name:"Thruster", cat:"Cardio", emoji:"\ud83d\ude80", diff:"Avanc\u00e9", calPerRep:0.48, muscles:["Corps entier", "Quadriceps", "\u00c9paules"], zones:["legs", "shoulders", "core"], benefits:["Cardio-force", "Br\u00fble graisses maximale", "Conditioning"], desc:"Squat frontal avec barre ou halt\u00e8res, puis enchainement direct en d\u00e9velopp\u00e9 militaire sans pause. \ud83d\udca1 Le thruster combine deux des meilleurs exercices polyarticulaires. Populaire en CrossFit. \u26a0\ufe0f Utilisez une charge mod\u00e9r\u00e9e pour maintenir une bonne technique sur toutes les reps." },
  { id:"h64", name:"Rowing cable bras tendu", cat:"Dos", emoji:"\ud83d\udd19", diff:"Interm\u00e9diaire", calPerRep:0.2, muscles:["Grand dorsal", "Serratile", "Core"], zones:["back"], benefits:["Isolation grand dorsal", "Connexion neurale", "D\u00e9finition"], desc:"Face au c\u00e2ble haut, bras tendu, descendez le c\u00e2ble vers la cuisse en gardant le bras presque droit. \ud83d\udca1 Excellent pour am\u00e9liorer la connexion mentale-musculaire avec le grand dorsal. Concentrez-vous sur la contraction \u00e0 chaque rep. \u26a0\ufe0f Charge l\u00e9g\u00e8re : ce n'est pas un exercice de force." },
  { id:"h65", name:"Jefferson curl", cat:"Dos", emoji:"\ud83c\udf0a", diff:"Avanc\u00e9", calPerRep:0.22, muscles:["\u00c9recteurs", "Ischio-jambiers", "Colonne"], zones:["back", "legs"], benefits:["Mobilit\u00e9 colonne", "D\u00e9compression vert\u00e9brale", "Souplesse"], desc:"Debout sur une bo\u00eete, barre en mains. Descendez vert\u00e8bre par vert\u00e8bre en arrondissant progressivement le dos. \ud83d\udca1 Exercice controvers\u00e9 mais excellent pour la mobilit\u00e9 lombaire quand ma\u00eetris\u00e9. \u26a0\ufe0f Uniquement avec des charges tr\u00e8s l\u00e9g\u00e8res au d\u00e9part. Consultez un pro si probl\u00e8mes de dos." },
  { id:"h66", name:"Calf raise debout", cat:"Jambes", emoji:"\ud83d\udc5f", diff:"D\u00e9butant", calPerRep:0.12, muscles:["Gastrocn\u00e9miens", "Sol\u00e9aire"], zones:["legs"], benefits:["Mollets d\u00e9finis", "Explosivit\u00e9", "Cheville stable"], desc:"Debout sur le bord d'une marche, montez sur la pointe des pieds le plus haut possible puis descendez en dessous du niveau de la marche. \ud83d\udca1 Descendez compl\u00e8tement pour \u00e9tirer le mollet avant de remonter. \u26a0\ufe0f \u00c9vitez de rebondir en bas. 3 secondes en haut en contraction pour maximiser l'effet." },
  { id:"h67", name:"Reverse curl", cat:"Bras", emoji:"\ud83d\udd01", diff:"D\u00e9butant", calPerRep:0.16, muscles:["Brachioradial", "Avant-bras", "Biceps"], zones:["arms"], benefits:["Avant-bras forts", "Prise en main", "\u00c9quilibre bras"], desc:"Barre prise en pronation (paumes vers le bas), fl\u00e9chissez les coudes. \ud83d\udca1 Ce mouvement d\u00e9veloppe le brachioradial, souvent n\u00e9glig\u00e9, et renforce consid\u00e9rablement la prise. \u26a0\ufe0f Utilisez moins de poids qu'un curl normal : les avant-bras se fatiguent vite. Id\u00e9al en fin de s\u00e9ance." },
  { id:"h68", name:"Nordic hamstring curl", cat:"Jambes", emoji:"\ud83c\udfd4\ufe0f", diff:"Avanc\u00e9", calPerRep:0.35, muscles:["Ischio-jambiers", "Fessiers"], zones:["legs"], benefits:["Force ischio excentrique", "Pr\u00e9vention claquages", "Vitesse"], desc:"Genoux au sol, chevilles bloqu\u00e9es par un partenaire. Descendez lentement vers le sol en r\u00e9sistant avec les ischio-jambiers, repoussez-vous avec les mains. \ud83d\udca1 L'un des meilleurs exercices pour pr\u00e9venir les claquages. \u26a0\ufe0f Extr\u00eamement difficile au d\u00e9but. Commencez par 3-5 reps de qualit\u00e9." },
  { id:"h69", name:"Ab wheel rollout", cat:"Abdos", emoji:"\u2699\ufe0f", diff:"Avanc\u00e9", calPerRep:0.24, muscles:["Core entier", "Dorsal", "\u00c9paules"], zones:["core", "back"], benefits:["Core ultime", "Force abdominale", "Posture"], desc:"\u00c0 genoux ou debout, faites rouler la roue abdominale vers l'avant jusqu'\u00e0 la position allong\u00e9e, puis revenez. \ud83d\udca1 \u00c9vitez de creuser le dos : gardez un gainage abdominal maximum tout au long du mouvement. \u26a0\ufe0f D\u00e9butez \u00e0 genoux. Debout avec la roue est l'un des exercices abdominaux les plus difficiles qui soit." },
  { id:"h70", name:"Gluteus kickback c\u00e2ble", cat:"Jambes", emoji:"\ud83c\udf51", diff:"D\u00e9butant", calPerRep:0.18, muscles:["Fessiers", "Ischio-jambiers"], zones:["legs"], benefits:["Fessiers ronds", "Isolation", "D\u00e9finition"], desc:"\u00c0 4 pattes face au c\u00e2ble bas, poussez la jambe vers l'arri\u00e8re et le haut en contractant le fessier. \ud83d\udca1 Maintenez 1 seconde en contraction maximale. \u26a0\ufe0f \u00c9vitez d'arquer le dos : le mouvement vient uniquement de la hanche. Charge l\u00e9g\u00e8re pour bien sentir la contraction." },
  { id:"h71", name:"Svend press", cat:"Poitrine", emoji:"\ud83e\udd32", diff:"D\u00e9butant", calPerRep:0.18, muscles:["Pectoraux", "Delto\u00efdes"], zones:["chest", "shoulders"], benefits:["Activation pectoraux", "\u00c9chauffement", "D\u00e9finition"], desc:"Pressez deux disques entre vos paumes, poussez les bras vers l'avant \u00e0 hauteur de poitrine. \ud83d\udca1 La pression isom\u00e9trique entre les paumes active intens\u00e9ment les pectoraux. Excellent pour l'activation avant une s\u00e9ance de pecs. \u26a0\ufe0f Exercice compl\u00e9mentaire, pas principal. Poids l\u00e9ger." },
  { id:"h72", name:"Pistol squat", cat:"Jambes", emoji:"\ud83d\udd2b", diff:"Avanc\u00e9", calPerRep:0.38, muscles:["Quadriceps", "Fessiers", "Stabilisateurs", "Core"], zones:["legs", "core"], benefits:["Force unilat\u00e9rale extr\u00eame", "\u00c9quilibre", "Mobilit\u00e9"], desc:"Sur une jambe, descendez en squat complet, l'autre jambe tendue devant vous. Remontez sans aide. \ud83d\udca1 Ma\u00eetrisez d'abord en vous tenant \u00e0 un support. Progressez avec une bo\u00eete pour limiter la profondeur. \u26a0\ufe0f N\u00e9cessite une excellente mobilit\u00e9 de cheville. \u00c9chauffez-vous bien avant." },
  { id:"h73", name:"Chin-up lest\u00e9", cat:"Dos", emoji:"\ud83c\udfcb\ufe0f", diff:"Avanc\u00e9", calPerRep:0.45, muscles:["Grand dorsal", "Biceps", "Brachial"], zones:["back", "arms"], benefits:["Force max bras-dos", "Masse dorsale", "Prise"], desc:"Traction supination avec poids suppl\u00e9mentaire (ceinture lest\u00e9e). \ud83d\udca1 Le lestage est la cl\u00e9 pour progresser quand les tractions sans poids sont trop faciles. \u26a0\ufe0f Ma\u00eetrisez 10-15 tractions propres avant d'ajouter du poids. Descendez toujours compl\u00e8tement." },
  { id:"h74", name:"Lateral raise c\u00e2ble", cat:"\u00c9paules", emoji:"\ud83e\udd8b", diff:"D\u00e9butant", calPerRep:0.17, muscles:["Delto\u00efde lat\u00e9ral"], zones:["shoulders"], benefits:["Tension constante", "\u00c9paules larges", "Isolation"], desc:"C\u00e2ble bas \u00e0 c\u00f4t\u00e9 de vous, soulevez le bras tendu jusqu'\u00e0 hauteur de l'\u00e9paule. \ud83d\udca1 Le c\u00e2ble maintient une tension constante sur tout le mouvement, sup\u00e9rieur aux halt\u00e8res. \u26a0\ufe0f L\u00e9g\u00e8re flexion du coude. Ne montez pas au-dessus de l'horizontale. Charge l\u00e9g\u00e8re, tempo lent." },
  { id:"h75", name:"Deadlift sumo", cat:"Dos", emoji:"\ud83e\udd38", diff:"Avanc\u00e9", calPerRep:0.44, muscles:["Adducteurs", "Fessiers", "Dos", "Quadriceps"], zones:["legs", "back"], benefits:["Force hanche", "Adducteurs", "Alternative soulev\u00e9 classique"], desc:"\u00c9cartement large des pieds, pointes vers l'ext\u00e9rieur, barre proche du corps. \ud83d\udca1 Position plus verticale du dos que le soulev\u00e9 classique, moins de stress lombaire. Id\u00e9al pour les personnes avec les jambes longues. \u26a0\ufe0f La barre doit rester contre le corps pendant tout le mouvement." },
  { id:"h76", name:"Cable pull through", cat:"Dos", emoji:"\ud83d\udd04", diff:"Interm\u00e9diaire", calPerRep:0.26, muscles:["Fessiers", "Ischio-jambiers", "\u00c9recteurs"], zones:["legs", "back"], benefits:["Cha\u00eene post\u00e9rieure", "Mouvement fonctionnel", "Fessiers actifs"], desc:"Face \u00e0 l'oppos\u00e9 du c\u00e2ble bas, poign\u00e9e entre les jambes. Poussez les hanches vers l'avant en contractant les fessiers. \ud83d\udca1 Excellent pour apprendre le patron de mouvement hip hinge. \u26a0\ufe0f Gardez les genoux l\u00e9g\u00e8rement fl\u00e9chis. Ne fl\u00e9chissez pas excessivement la colonne." },
  { id:"h77", name:"Bear crawl", cat:"Cardio", emoji:"\ud83d\udc3b", diff:"Interm\u00e9diaire", calPerRep:0.3, muscles:["Core", "\u00c9paules", "Quadriceps", "Coordination"], zones:["core", "shoulders"], benefits:["Cardio fonctionnel", "Core actif", "Coordination"], desc:"\u00c0 4 pattes, genoux juste au-dessus du sol. Avancez en bougeant simultan\u00e9ment main droite-pied gauche puis main gauche-pied droit. \ud83d\udca1 Maintenez le dos plat comme une table. \u26a0\ufe0f Restez lent et contr\u00f4l\u00e9 au d\u00e9but. La vitesse vient avec la ma\u00eetrise." },
  { id:"h78", name:"Sled push", cat:"Cardio", emoji:"\ud83d\udef7", diff:"Interm\u00e9diaire", calPerRep:0.5, muscles:["Quadriceps", "Fessiers", "Pectoraux", "\u00c9paules"], zones:["legs", "chest"], benefits:["Cardio-force", "Explosivit\u00e9", "Membres inf\u00e9rieurs"], desc:"Poussez un tra\u00eeneau lourd sur une distance d\u00e9finie, corps inclin\u00e9 \u00e0 45\u00b0. \ud83d\udca1 Plus l'inclinaison est grande, plus les quadriceps travaillent. \u26a0\ufe0f Maintenez le dos droit, ne courbez pas la colonne. Si pas de tra\u00eeneau, utilisez une barre sur le sol avec des disques." },
  { id:"h79", name:"Inverted row", cat:"Dos", emoji:"\ud83d\udd03", diff:"D\u00e9butant", calPerRep:0.24, muscles:["Rhombo\u00efdes", "Biceps", "Trap\u00e8ze m\u00e9dian"], zones:["back", "arms"], benefits:["Dos tonique", "Accessible", "Alternative traction"], desc:"Allong\u00e9 sous une barre fixe, prenez-la et tirez votre poitrine vers elle en gardant le corps droit. \ud83d\udca1 Plus le corps est horizontal, plus c'est difficile. Commencez avec les pieds au sol. \u26a0\ufe0f Serrez les omoplates en haut, maintenez 1 seconde. Corps rigide tout au long." },
  { id:"h80", name:"Landmine press", cat:"\u00c9paules", emoji:"\ud83d\uddff", diff:"Interm\u00e9diaire", calPerRep:0.27, muscles:["\u00c9paules", "Pectoraux", "Triceps", "Core"], zones:["shoulders", "chest"], benefits:["Doux pour \u00e9paules", "Fonctionnel", "Stabilit\u00e9 scapulaire"], desc:"Barre dans un coin ou support landmine, tenez l'extr\u00e9mit\u00e9 \u00e0 hauteur d'\u00e9paule, poussez vers le haut et l'avant. \ud83d\udca1 Le mouvement en arc est moins agressif pour les \u00e9paules que le d\u00e9velopp\u00e9 classique. Excellent pour les personnes avec des douleurs d'\u00e9paule. \u26a0\ufe0f Un bras \u00e0 la fois pour maximiser le travail stabilisateur." },
  { id:"h81", name:"GHD sit-up", cat:"Abdos", emoji:"\ud83d\udd31", diff:"Avanc\u00e9", calPerRep:0.25, muscles:["Abdominaux", "Hip flexors", "\u00c9recteurs"], zones:["core"], benefits:["Abdominaux complets", "Force hip flexors", "Performance athl\u00e9tique"], desc:"Sur la machine GHD, descendez jusqu'\u00e0 la position horizontale puis remontez. \ud83d\udca1 Contrairement aux crunchs, vous travaillez sur toute l'amplitude. \u26a0\ufe0f Risque de DOMS intense les premiers jours. Commencez par 5-8 reps maximum m\u00eame si vous \u00eates en forme." },
  { id:"h82", name:"Z press", cat:"\u00c9paules", emoji:"\ud83e\uddd8", diff:"Avanc\u00e9", calPerRep:0.28, muscles:["Delto\u00efdes", "Trap\u00e8ze", "Core", "Stabilisateurs"], zones:["shoulders", "core"], benefits:["Mobilit\u00e9 hanches", "Presse overhead pure", "Posture"], desc:"Assis \u00e0 m\u00eame le sol jambes tendues devant, pressez la barre au-dessus de la t\u00eate. \ud83d\udca1 Elimine toute triche avec les jambes, force un tronc parfaitement stable. \u26a0\ufe0f N\u00e9cessite une bonne mobilit\u00e9 des ischio-jambiers. Commencez avec une barre l\u00e9g\u00e8re." },
  { id:"h83", name:"Split jerk", cat:"Cardio", emoji:"\u26a1", diff:"Avanc\u00e9", calPerRep:0.52, muscles:["Jambes", "\u00c9paules", "Core", "Explosivit\u00e9"], zones:["legs", "shoulders"], benefits:["Puissance explosive", "Halt\u00e9rophilie", "Athl\u00e9tisme"], desc:"Barre sur les \u00e9paules, fl\u00e9chissez rapidement puis propulsez la barre au-dessus de la t\u00eate en \u00e9cartant les jambes. \ud83d\udca1 Mouvement d'halt\u00e9rophilie olympique. La vitesse est cruciale, pas la force pure. \u26a0\ufe0f Apprentissage obligatoire avec un coach sp\u00e9cialis\u00e9 halt\u00e9rophilie." },
  { id:"h84", name:"Landmine squat", cat:"Jambes", emoji:"\ud83d\udd31", diff:"Interm\u00e9diaire", calPerRep:0.32, muscles:["Quadriceps", "Fessiers", "Core"], zones:["legs", "core"], benefits:["Angle naturel", "S\u00e9curis\u00e9 dos", "Progression squat"], desc:"Tenez l'extr\u00e9mit\u00e9 de la barre en landmine contre la poitrine, faites un squat. \ud83d\udca1 L'angle de la barre guide naturellement vers une bonne m\u00e9canique de squat. Id\u00e9al pour progresser avant le squat libre. \u26a0\ufe0f Gardez la barre proche du sternum tout au long." },
  { id:"h85", name:"Rope climb", cat:"Cardio", emoji:"\ud83e\udea2", diff:"Avanc\u00e9", calPerRep:0.55, muscles:["Biceps", "Avant-bras", "Dos", "Core"], zones:["back", "arms", "core"], benefits:["Force fonctionnelle", "Corps complet", "Endurance musculaire"], desc:"Grimpez une corde en vous aidant des bras et jambes (ou bras seuls pour plus de difficult\u00e9). \ud83d\udca1 La technique jambes est essentielle : enroulez la corde autour du pied pour vous y appuyer. \u26a0\ufe0f Descendez toujours lentement et contr\u00f4l\u00e9. Ne l\u00e2chez jamais soudainement." },
  { id:"h86", name:"Glute ham raise", cat:"Jambes", emoji:"\ud83e\uddb5", diff:"Avanc\u00e9", calPerRep:0.3, muscles:["Ischio-jambiers", "Fessiers", "Mollets"], zones:["legs"], benefits:["Force excentrique ischio", "Pr\u00e9vention blessures", "Chaine post\u00e9rieure"], desc:"Machine GHR, descendez lentement vers le sol puis remontez en contractant les ischio-jambiers. \ud83d\udca1 L'un des meilleurs exercices pour les ischio-jambiers. Activez les fessiers pour aider si trop difficile. \u26a0\ufe0f Extr\u00eamement difficile. D\u00e9butez avec des bandes \u00e9lastiques d'assistance." },
  { id:"h87", name:"Kettlebell turkish get-up", cat:"Cardio", emoji:"\ud83c\udfcb\ufe0f", diff:"Avanc\u00e9", calPerRep:0.45, muscles:["Corps entier", "Core", "\u00c9paules", "Mobilit\u00e9"], zones:["core", "shoulders"], benefits:["Mobilit\u00e9 totale", "Stabilit\u00e9 \u00e9paules", "Fonctionnel"], desc:"Allong\u00e9 avec kettlebell bras tendu, levez-vous progressivement en plusieurs \u00e9tapes tout en gardant le kettlebell au-dessus. \ud83d\udca1 Apprenez les 5 \u00e9tapes s\u00e9par\u00e9ment avant de les encha\u00eener. \u26a0\ufe0f D\u00e9butez avec un poids tr\u00e8s l\u00e9ger (ou m\u00eame une chaussure pos\u00e9e sur le poing) pour apprendre le mouvement." },
  { id:"h88", name:"Copenhagen plank", cat:"Abdos", emoji:"\ud83d\udd35", diff:"Avanc\u00e9", calPerRep:0.22, muscles:["Adducteurs", "Core", "Obliques"], zones:["core", "legs"], benefits:["Adducteurs forts", "Pr\u00e9vention blessures groin", "Gainage lat\u00e9ral"], desc:"Sur l'avant-bras lat\u00e9ralement, pied sup\u00e9rieur pos\u00e9 sur un banc, pied inf\u00e9rieur en l'air. Maintenez. \ud83d\udca1 Excellent pour renforcer les adducteurs souvent n\u00e9glig\u00e9s. \u26a0\ufe0f Commencez par la version genoux sur banc avant la version jambe tendue." },
  { id:"h89", name:"Banded monster walk", cat:"Jambes", emoji:"\ud83e\udd96", diff:"D\u00e9butant", calPerRep:0.18, muscles:["Fessiers moyens", "Abducteurs", "Hanches"], zones:["legs"], benefits:["Activation fessiers", "Stabilit\u00e9 genou", "Pr\u00e9vention blessures"], desc:"\u00c9lastique autour des genoux ou chevilles, adoptez une position semi-squat et avancez lat\u00e9ralement. \ud83d\udca1 Garder la r\u00e9sistance constante en ne laissant pas les genoux se rapprocher. \u26a0\ufe0f Id\u00e9al en \u00e9chauffement avant squats et fentes pour activer les fessiers moyens." },
  { id:"h90", name:"Tempo bench press", cat:"Poitrine", emoji:"\u23f1\ufe0f", diff:"Interm\u00e9diaire", calPerRep:0.3, muscles:["Pectoraux", "Triceps", "Delto\u00efdes"], zones:["chest", "arms"], benefits:["Hypertrophie maximale", "Contr\u00f4le", "Temps sous tension"], desc:"D\u00e9velopp\u00e9 couch\u00e9 avec tempo contr\u00f4l\u00e9 : 4 secondes en descente, 1 seconde de pause en bas, 1 seconde en mont\u00e9e. \ud83d\udca1 Le temps sous tension est un facteur cl\u00e9 d'hypertrophie. R\u00e9duisez le poids de 30-40% par rapport \u00e0 votre max habituel. \u26a0\ufe0f Pas de rebond sur la poitrine : la pause \u00e9limine l'\u00e9lan." }
];

// ─── 40 EXERCICES FEMME ───────────────────────────────────────────────────────
const EXERCISES_FEMME = [
  { id:"f1",  name:"Hip thrust",             cat:"Fessiers", emoji:"🍑", diff:"Débutant",      calPerRep:0.28, muscles:["Fessiers","Ischio-jambiers","Core"],         zones:["legs"],            benefits:["Fessiers ronds","Chaîne postérieure","Hanches"], desc:"Épaules sur banc, barre sur les hanches, poussez vers le haut." },
  { id:"f2",  name:"Squat sumo",             cat:"Jambes",   emoji:"🦵", diff:"Débutant",      calPerRep:0.28, muscles:["Fessiers","Quadriceps","Adducteurs"],        zones:["legs"],            benefits:["Fessiers & intérieur cuisses","Tonification","Posture"], desc:"Pieds écartés pointes vers l'extérieur, descendez profond." },
  { id:"f3",  name:"Fente arrière",          cat:"Jambes",   emoji:"🚶", diff:"Débutant",      calPerRep:0.24, muscles:["Fessiers","Quadriceps","Mollets"],           zones:["legs"],            benefits:["Équilibre","Fessiers ciblés","Fonctionnel"], desc:"Reculez un pied, descendez le genou arrière vers le sol." },
  { id:"f4",  name:"Donkey kicks",           cat:"Fessiers", emoji:"🦵", diff:"Débutant",      calPerRep:0.16, muscles:["Fessiers","Ischio-jambiers"],                zones:["legs"],            benefits:["Fessiers isolation","Sans matériel","Tonification"], desc:"À 4 pattes, poussez un talon vers le plafond en contractant." },
  { id:"f5",  name:"Abduction élastique",    cat:"Fessiers", emoji:"🔴", diff:"Débutant",      calPerRep:0.14, muscles:["Fessiers moyens","Abducteurs"],              zones:["legs"],            benefits:["Hanches rondes","Fessiers latéraux","Équilibre"], desc:"Élastique autour des genoux, écartez les jambes en résistance." },
  { id:"f6",  name:"Glute bridge",           cat:"Fessiers", emoji:"🌉", diff:"Débutant",      calPerRep:0.18, muscles:["Fessiers","Ischio-jambiers","Core"],         zones:["legs","core"],     benefits:["Fessiers activés","Dos soulagé","Accessible"], desc:"Allongée, pieds au sol, poussez les hanches vers le haut." },
  { id:"f7",  name:"Step-up",                cat:"Jambes",   emoji:"🪜", diff:"Débutant",      calPerRep:0.22, muscles:["Fessiers","Quadriceps","Ischio-jambiers"],   zones:["legs"],            benefits:["Fonctionnel","Fessiers unilatéral","Coordination"], desc:"Montez sur une marche ou boîte, alternez les jambes." },
  { id:"f8",  name:"Squat gobelet",          cat:"Jambes",   emoji:"🏆", diff:"Débutant",      calPerRep:0.26, muscles:["Quadriceps","Fessiers","Core"],              zones:["legs","core"],     benefits:["Technique squat","Core engagé","Accessible"], desc:"Haltère ou kettlebell tenu devant la poitrine, squat profond." },
  { id:"f9",  name:"Pompes genoux",          cat:"Poitrine", emoji:"💪", diff:"Débutant",      calPerRep:0.20, muscles:["Pectoraux","Triceps","Épaules"],             zones:["chest","arms"],    benefits:["Force bras","Poitrine tonifiée","Progression"], desc:"Genoux au sol, descendez la poitrine vers le sol et poussez." },
  { id:"f10", name:"Triceps banc",           cat:"Bras",     emoji:"🪑", diff:"Débutant",      calPerRep:0.18, muscles:["Triceps"],                                  zones:["arms"],            benefits:["Bras fermes","Face arrière bras","Sans matériel"], desc:"Mains sur banc derrière, descendez les fesses vers le sol." },
  { id:"f11", name:"Curl haltères",          cat:"Bras",     emoji:"💪", diff:"Débutant",      calPerRep:0.16, muscles:["Biceps","Avant-bras"],                      zones:["arms"],            benefits:["Bras tonifiés","Force fonctionnelle","Définition"], desc:"Haltères légers, fléchissez les coudes alternativement." },
  { id:"f12", name:"Planche",                cat:"Abdos",    emoji:"⚡", diff:"Débutant",      calPerRep:0.15, muscles:["Core","Épaules","Fessiers"],                 zones:["core"],            benefits:["Gainage complet","Ventre plat","Dos protégé"], desc:"Avant-bras ou mains, corps droit, contractez l'abdomen." },
  { id:"f13", name:"Crunch basique",         cat:"Abdos",    emoji:"🔄", diff:"Débutant",      calPerRep:0.12, muscles:["Abdominaux"],                               zones:["core"],            benefits:["Abdos définis","Ventre plat","Accessible"], desc:"Allongée, mains derrière la tête, relevez les épaules." },
  { id:"f14", name:"Bicycle crunch",         cat:"Abdos",    emoji:"🚴", diff:"Intermédiaire", calPerRep:0.16, muscles:["Abdominaux","Obliques"],                    zones:["core"],            benefits:["Taille affinée","Obliques","Cardio léger"], desc:"Jambes alternées en vélo, coude vers le genou opposé." },
  { id:"f15", name:"Mountain climbers",      cat:"Cardio",   emoji:"🧗", diff:"Intermédiaire", calPerRep:0.22, muscles:["Core","Épaules","Jambes"],                  zones:["core","legs"],     benefits:["Cardio gainage","Brûle graisses","Coordination"], desc:"Position pompe, genoux alternés vers la poitrine vite." },
  { id:"f16", name:"Jump rope",              cat:"Cardio",   emoji:"🪢", diff:"Débutant",      calPerRep:0.12, muscles:["Mollets","Cardio","Coordination"],          zones:["legs"],            benefits:["Cardio efficace","Mollets fins","Coordination"], desc:"Sautez à la corde à rythme régulier sur la pointe des pieds." },
  { id:"f17", name:"Burpees modifiés",       cat:"Cardio",   emoji:"🔥", diff:"Intermédiaire", calPerRep:0.38, muscles:["Corps entier"],                             zones:["legs","chest","core"],benefits:["Cardio total","Brûle graisses","Tonicité"], desc:"Pompe sur genoux + saut, version accessible du burpee." },
  { id:"f18", name:"Zumba squats",           cat:"Cardio",   emoji:"💃", diff:"Débutant",      calPerRep:0.20, muscles:["Jambes","Fessiers","Cardio"],               zones:["legs"],            benefits:["Cardio fun","Jambes toniques","Calories brûlées"], desc:"Squats rythmés avec mouvement de bras, restez en rythme." },
  { id:"f19", name:"Side lunge",             cat:"Jambes",   emoji:"↔️", diff:"Débutant",      calPerRep:0.22, muscles:["Adducteurs","Fessiers","Quadriceps"],       zones:["legs"],            benefits:["Intérieur cuisses","Hanches souples","Équilibre"], desc:"Écartez une jambe sur le côté en pliant le genou, alternez." },
  { id:"f20", name:"Sumo deadlift",          cat:"Fessiers", emoji:"🏋️", diff:"Intermédiaire", calPerRep:0.35, muscles:["Fessiers","Ischio-jambiers","Adducteurs"],  zones:["legs","back"],     benefits:["Fessiers profonds","Cuisses toniques","Force totale"], desc:"Pieds très écartés, barre entre les jambes, dos droit." },
  { id:"f21", name:"Romanian deadlift",      cat:"Fessiers", emoji:"🌹", diff:"Intermédiaire", calPerRep:0.32, muscles:["Ischio-jambiers","Fessiers","Bas du dos"],  zones:["legs","back"],     benefits:["Ischio étirés","Fessiers ciblés","Posture"], desc:"Haltères, descendez le long des jambes dos droit jambes quasi tendues." },
  { id:"f22", name:"Élévation jambe côté",   cat:"Fessiers", emoji:"🦵", diff:"Débutant",      calPerRep:0.14, muscles:["Fessiers moyens","Abducteurs"],             zones:["legs"],            benefits:["Hanches galbées","Fessiers latéraux","Sans matériel"], desc:"Allongée sur le côté, levez la jambe supérieure lentement." },
  { id:"f23", name:"Squat pulse",            cat:"Jambes",   emoji:"🔛", diff:"Débutant",      calPerRep:0.16, muscles:["Quadriceps","Fessiers"],                    zones:["legs"],            benefits:["Brûlure musculaire","Tonification","Endurance"], desc:"Position squat bas, faites de petits mouvements de 5cm." },
  { id:"f24", name:"Fente marchée",          cat:"Jambes",   emoji:"🚶", diff:"Intermédiaire", calPerRep:0.26, muscles:["Fessiers","Quadriceps","Mollets"],          zones:["legs"],            benefits:["Fonctionnel","Fessiers actifs","Cardio léger"], desc:"Avancez en fentes successives sur une distance." },
  { id:"f25", name:"Wall sit",               cat:"Jambes",   emoji:"🧱", diff:"Débutant",      calPerRep:0.18, muscles:["Quadriceps","Fessiers","Core"],             zones:["legs","core"],     benefits:["Endurance jambes","Brûle graisses","Accessible"], desc:"Dos contre le mur, cuisses parallèles, maintenez la position." },
  { id:"f26", name:"Rowing élastique",       cat:"Dos",      emoji:"🎗️", diff:"Débutant",      calPerRep:0.18, muscles:["Grand dorsal","Rhomboïdes","Biceps"],       zones:["back","arms"],     benefits:["Dos tonique","Posture droite","Doux pour les articulations"], desc:"Élastique fixé, tirez vers vous en serrant les omoplates." },
  { id:"f27", name:"Superman",               cat:"Dos",      emoji:"🦸", diff:"Débutant",      calPerRep:0.14, muscles:["Érecteurs du rachis","Fessiers","Épaules"],  zones:["back"],            benefits:["Bas du dos fort","Posture","Prévention douleurs"], desc:"Allongée ventre, levez simultanément bras et jambes." },
  { id:"f28", name:"Bird dog",               cat:"Abdos",    emoji:"🐦", diff:"Débutant",      calPerRep:0.13, muscles:["Core","Érecteurs","Fessiers"],              zones:["core","back"],     benefits:["Stabilité","Coordination","Dos sain"], desc:"À 4 pattes, étendez bras et jambe opposés en simultané." },
  { id:"f29", name:"Dead bug",               cat:"Abdos",    emoji:"🐞", diff:"Intermédiaire", calPerRep:0.16, muscles:["Core profond","Abdominaux","Hip flexors"],  zones:["core"],            benefits:["Core profond","Coordination","Dos protégé"], desc:"Allongée, bras vers plafond, baissez alternativement bras et jambe opposée." },
  { id:"f30", name:"Pilates 100",            cat:"Abdos",    emoji:"💆", diff:"Intermédiaire", calPerRep:0.14, muscles:["Abdominaux","Core","Hip flexors"],           zones:["core"],            benefits:["Core profond","Contrôle","Ventre plat"], desc:"Jambes à 45°, bras tendus, tapotez l'air 100 fois en respirant." },
  { id:"f31", name:"Clamshell",              cat:"Fessiers", emoji:"🐚", diff:"Débutant",      calPerRep:0.13, muscles:["Fessiers moyens","Rotateurs de hanche"],    zones:["legs"],            benefits:["Hanches stables","Fessiers latéraux","Prévention genou"], desc:"Sur le côté, genoux fléchis, ouvrez le genou supérieur comme une palourde." },
  { id:"f32", name:"Hip circle",             cat:"Fessiers", emoji:"⭕", diff:"Débutant",      calPerRep:0.15, muscles:["Fessiers","Hanches","Core"],                zones:["legs","core"],     benefits:["Mobilité hanches","Fessiers actifs","Échauffement"], desc:"À 4 pattes, genou fléchi, faites des cercles avec la hanche." },
  { id:"f33", name:"Kick-boxing cardio",     cat:"Cardio",   emoji:"🥊", diff:"Intermédiaire", calPerRep:0.40, muscles:["Corps entier","Cardio"],                   zones:["legs","arms","core"],benefits:["Cardio fun","Confiance","Calories brûlées"], desc:"Enchaînements de coups de poing et pied à rythme soutenu." },
  { id:"f34", name:"Jumping jacks",          cat:"Cardio",   emoji:"⭐", diff:"Débutant",      calPerRep:0.10, muscles:["Cardio","Mollets","Épaules"],               zones:["legs"],            benefits:["Échauffement","Cardio doux","Coordination"], desc:"Sautez en écartant bras et jambes puis revenez, répétez." },
  { id:"f35", name:"High knees",             cat:"Cardio",   emoji:"🦵", diff:"Débutant",      calPerRep:0.18, muscles:["Cardio","Hip flexors","Core"],              zones:["legs","core"],     benefits:["Cardio léger","Cuisses ciblées","Mobilité"], desc:"Courez sur place en levant les genoux au-dessus des hanches." },
  { id:"f36", name:"Triceps overhead",       cat:"Bras",     emoji:"☝️", diff:"Débutant",      calPerRep:0.16, muscles:["Triceps"],                                  zones:["arms"],            benefits:["Bras fermes","Face arrière","Léger"], desc:"Haltère à deux mains au-dessus de la tête, fléchissez les coudes." },
  { id:"f37", name:"Curl marteau",           cat:"Bras",     emoji:"🔨", diff:"Débutant",      calPerRep:0.16, muscles:["Biceps brachial","Avant-bras"],             zones:["arms"],            benefits:["Bras toniques","Avant-bras","Prise en main"], desc:"Haltères prise neutre (pouce en haut), fléchissez alternativement." },
  { id:"f38", name:"Yoga flow",              cat:"Mobilité", emoji:"🧘", diff:"Débutant",      calPerRep:0.10, muscles:["Flexibilité","Core","Équilibre"],           zones:["core"],            benefits:["Souplesse","Récupération","Bien-être"], desc:"Enchaînements chien tête en bas / cobra / guerrier." },
  { id:"f39", name:"Stretching fessiers",    cat:"Mobilité", emoji:"🌸", diff:"Débutant",      calPerRep:0.08, muscles:["Fessiers","Piriforme","Hanches"],           zones:["legs"],            benefits:["Récupération","Souplesse","Prévention douleurs"], desc:"Allongée, croisez une jambe sur le genou opposé, tirez vers vous." },
  { id:"f40", name:"Foam roller jambes",     cat:"Mobilité", emoji:"🟤", diff:"Débutant",      calPerRep:0.08, muscles:["Fascias","Ischio-jambiers","Quadriceps"],  zones:["legs"],            benefits:["Récupération musculaire","Anti-douleurs","Souplesse"], desc:"Roulez lentement le rouleau sur les groupes musculaires ciblés." },
  { id:"f41", name:"Frog pump", cat:"Fessiers", emoji:"\ud83d\udc38", diff:"D\u00e9butant", calPerRep:0.15, muscles:["Fessiers", "Adducteurs"], zones:["legs"], benefits:["Activation fessiers", "Adducteurs", "Sans mat\u00e9riel"], desc:"Allong\u00e9e sur le dos, plantes des pieds coll\u00e9es, genoux fl\u00e9chis vers l'ext\u00e9rieur (position grenouille). Poussez les hanches vers le haut en contractant les fessiers. \ud83d\udca1 La position grenouille permet une activation maximale des fessiers. Faites 20-30 reps rapides pour bien activer. \u26a0\ufe0f Restez sur les \u00e9paules, pas sur le cou." },
  { id:"f42", name:"Reverse hyperextension", cat:"Fessiers", emoji:"\ud83d\udd04", diff:"Interm\u00e9diaire", calPerRep:0.22, muscles:["Fessiers", "Ischio-jambiers", "Bas du dos"], zones:["legs", "back"], benefits:["D\u00e9compression lombaire", "Fessiers cibl\u00e9s", "R\u00e9cup\u00e9ration"], desc:"Sur un banc ou bo\u00eete pliom\u00e9trique, jambes pendantes. Soulevez les jambes tendues en contractant les fessiers. \ud83d\udca1 Excellent pour d\u00e9comprimer la colonne apr\u00e8s des soulev\u00e9s de terre. \u26a0\ufe0f Mouvement fluide sans \u00e0-coups. Maintenez 1 seconde en haut." },
  { id:"f43", name:"B-stance hip thrust", cat:"Fessiers", emoji:"\ud83e\uddb5", diff:"Interm\u00e9diaire", calPerRep:0.26, muscles:["Fessiers", "Ischio-jambiers unilat\u00e9ral"], zones:["legs"], benefits:["Force unilat\u00e9rale fessiers", "\u00c9quilibre", "Sym\u00e9trie"], desc:"Hip thrust avec 80% du poids sur une jambe, l'autre pos\u00e9e en support l\u00e9ger. \ud83d\udca1 Cette variation r\u00e9v\u00e8le les d\u00e9s\u00e9quilibres entre les deux fessiers. \u26a0\ufe0f Le pied de support ne doit pas pousser activement, il sert juste d'\u00e9quilibre." },
  { id:"f44", name:"Cable glute kickback debout", cat:"Fessiers", emoji:"\ud83c\udf51", diff:"D\u00e9butant", calPerRep:0.17, muscles:["Fessiers", "Ischio-jambiers"], zones:["legs"], benefits:["Isolation fessiers", "D\u00e9finition", "Contr\u00f4le"], desc:"Debout face au c\u00e2ble bas, cheville attach\u00e9e. Poussez la jambe vers l'arri\u00e8re en contractant le fessier, corps l\u00e9g\u00e8rement inclin\u00e9 vers l'avant. \ud83d\udca1 Maintenez 2 secondes en contraction maximale. \u26a0\ufe0f Ne balancez pas la jambe : le mouvement doit \u00eatre contr\u00f4l\u00e9. Amplitude compl\u00e8te." },
  { id:"f45", name:"Curtsy lunge", cat:"Jambes", emoji:"\ud83d\udc83", diff:"Interm\u00e9diaire", calPerRep:0.24, muscles:["Fessiers moyens", "Adducteurs", "Quadriceps"], zones:["legs"], benefits:["Hanches galb\u00e9es", "Fessiers lat\u00e9raux", "\u00c9quilibre"], desc:"Passez une jambe derri\u00e8re et de l'autre c\u00f4t\u00e9 (comme une r\u00e9v\u00e9rence). Descendez le genou arri\u00e8re vers le sol. \ud83d\udca1 Excellent pour le fessier moyen, souvent n\u00e9glig\u00e9 mais responsable de la largeur des hanches. \u26a0\ufe0f Gardez le genou avant align\u00e9 sur le pied, ne laissez pas rentrer vers l'int\u00e9rieur." },
  { id:"f46", name:"Single leg glute bridge", cat:"Fessiers", emoji:"\ud83e\uddb5", diff:"D\u00e9butant", calPerRep:0.2, muscles:["Fessiers", "Core", "Ischio-jambiers"], zones:["legs", "core"], benefits:["Fessiers unilat\u00e9ral", "Stabilit\u00e9", "R\u00e9v\u00e8le les d\u00e9s\u00e9quilibres"], desc:"Glute bridge sur une seule jambe, l'autre tendue en l'air. Poussez les hanches le plus haut possible. \ud83d\udca1 Si vous sentez plus un c\u00f4t\u00e9 que l'autre, travaillez ce c\u00f4t\u00e9 en priorit\u00e9. \u26a0\ufe0f Gardez les hanches de niveau, ne laissez pas un c\u00f4t\u00e9 tomber. Contractez l'abdomen." },
  { id:"f47", name:"Abductor machine", cat:"Fessiers", emoji:"\ud83e\uddb5", diff:"D\u00e9butant", calPerRep:0.14, muscles:["Fessiers moyens", "Abducteurs", "Tenseur du fascia lata"], zones:["legs"], benefits:["Hanches rondes", "Fessiers lat\u00e9raux", "Accessible"], desc:"Machine abducteur, \u00e9cartez les jambes contre la r\u00e9sistance. \ud83d\udca1 Faites des s\u00e9ries lentes (3 secondes en \u00e9cartant, 3 en revenant) pour maximiser l'activation du fessier moyen. \u26a0\ufe0f Ne prenez pas trop lourd : l'objectif est la qualit\u00e9 de contraction, pas la force brute." },
  { id:"f48", name:"Smith machine hip thrust", cat:"Fessiers", emoji:"\ud83d\udd29", diff:"D\u00e9butant", calPerRep:0.28, muscles:["Fessiers", "Ischio-jambiers"], zones:["legs"], benefits:["S\u00e9curis\u00e9", "Charge progressive", "Guid\u00e9"], desc:"Hip thrust avec la barre guid\u00e9e de la machine Smith, \u00e9paules sur banc. \ud83d\udca1 La machine Smith s\u00e9curise le mouvement et permet de charger plus lourd en solo. \u26a0\ufe0f Placez la barre sur les hanches avec une protection (mousse). Les pieds \u00e0 distance appropri\u00e9e du banc." },
  { id:"f49", name:"Lateral band walk", cat:"Fessiers", emoji:"\ud83e\udd80", diff:"D\u00e9butant", calPerRep:0.15, muscles:["Fessiers moyens", "Abducteurs", "Genoux stables"], zones:["legs"], benefits:["Activation fessiers", "Pr\u00e9vention genou", "Warm-up"], desc:"\u00c9lastique aux chevilles ou genoux, position semi-squat, marchez lat\u00e9ralement en maintenant l'\u00e9cartement. \ud83d\udca1 Id\u00e9al en activation avant squats. Gardez les genoux sortis tout au long. \u26a0\ufe0f Faites des pas de taille moyenne, ni trop petits ni trop grands." },
  { id:"f50", name:"Romanian split squat", cat:"Jambes", emoji:"\ud83c\udf39", diff:"Interm\u00e9diaire", calPerRep:0.3, muscles:["Ischio-jambiers", "Fessiers", "Quadriceps"], zones:["legs"], benefits:["Ischio cibl\u00e9s", "\u00c9quilibre", "Unilateral"], desc:"Fente bulgare mais en gardant le buste plus inclin\u00e9 vers l'avant pour cibler les ischio-jambiers. \ud83d\udca1 Diff\u00e9rence avec la fente bulgare classique : penchement du buste vers l'avant et charge plus faible. \u26a0\ufe0f Sentez l'\u00e9tirement dans l'ischio-jambier de la jambe avant \u00e0 chaque r\u00e9p\u00e9tition." },
  { id:"f51", name:"Pilates bridge", cat:"Abdos", emoji:"\ud83c\udf09", diff:"D\u00e9butant", calPerRep:0.13, muscles:["Core profond", "Fessiers", "Ischio-jambiers"], zones:["core", "legs"], benefits:["Core profond", "Activation fessiers", "Dos sain"], desc:"Allong\u00e9e, pieds joints. Montez le bassin lentement vert\u00e8bre par vert\u00e8bre, maintenez 3 secondes puis descendez de m\u00eame. \ud83d\udca1 La lenteur et la conscience de chaque vert\u00e8bre est la cl\u00e9 Pilates. \u26a0\ufe0f Ne montez pas trop haut : arr\u00eatez quand les genoux, hanches et \u00e9paules sont align\u00e9s." },
  { id:"f52", name:"Teaser Pilates", cat:"Abdos", emoji:"\ud83e\udd38", diff:"Avanc\u00e9", calPerRep:0.22, muscles:["Abdominaux", "Hip flexors", "\u00c9quilibre"], zones:["core"], benefits:["Core complet", "\u00c9quilibre", "Flexibilit\u00e9"], desc:"Depuis la position allong\u00e9e, levez simultan\u00e9ment jambes et buste pour former un V avec le corps, bras tendus. \ud83d\udca1 C'est l'exercice roi du Pilates. Contr\u00f4lez la descente autant que la mont\u00e9e. \u26a0\ufe0f Si trop difficile, gardez les genoux fl\u00e9chis au d\u00e9part." },
  { id:"f53", name:"Side plank with rotation", cat:"Abdos", emoji:"\ud83d\udd04", diff:"Interm\u00e9diaire", calPerRep:0.18, muscles:["Obliques", "Core", "\u00c9paules"], zones:["core"], benefits:["Obliques cibl\u00e9s", "Taille", "Stabilit\u00e9"], desc:"Planche lat\u00e9rale sur l'avant-bras, faites passer le bras libre sous le corps en rotation. \ud83d\udca1 La rotation engage les obliques profonds responsables d'une taille cintr\u00e9e. \u26a0\ufe0f Les hanches ne doivent pas bouger, seul le buste tourne." },
  { id:"f54", name:"Woodchop c\u00e2ble", cat:"Abdos", emoji:"\ud83e\ude93", diff:"Interm\u00e9diaire", calPerRep:0.2, muscles:["Obliques", "Core", "\u00c9paules", "Rotation"], zones:["core", "shoulders"], benefits:["Taille sculpt\u00e9e", "Rotation fonctionnelle", "Obliques forts"], desc:"C\u00e2ble en diagonale haute/basse, tirez en rotation du buste de haut en bas ou l'inverse. \ud83d\udca1 Mouvement fonctionnel qui simule les rotations de la vie quotidienne et du sport. \u26a0\ufe0f Le pivot vient des hanches et du buste, pas des bras. Gardez les bras relativement tendus." },
  { id:"f55", name:"Ballet squat relev\u00e9", cat:"Jambes", emoji:"\ud83e\ude70", diff:"D\u00e9butant", calPerRep:0.2, muscles:["Quadriceps", "Fessiers", "Mollets", "Adducteurs"], zones:["legs"], benefits:["Jambes galb\u00e9es", "Posture ballet", "Mollets fins"], desc:"Pieds tr\u00e8s \u00e9cart\u00e9s sur la pointe, descendez en pli\u00e9 puis remontez sur les pointes. \ud83d\udca1 La mont\u00e9e sur pointe active les mollets en plus des quadriceps. \u26a0\ufe0f Genoux dans l'axe des orteils en permanence. Tenez-vous \u00e0 un support si manque d'\u00e9quilibre." },
  { id:"f56", name:"Resistance band pull apart", cat:"\u00c9paules", emoji:"\u2194\ufe0f", diff:"D\u00e9butant", calPerRep:0.13, muscles:["Delto\u00efdes post.", "Rhombo\u00efdes", "Trap\u00e8ze"], zones:["shoulders", "back"], benefits:["Posture parfaite", "\u00c9quilibre \u00e9paules", "Pr\u00e9vention"], desc:"Tenez un \u00e9lastique \u00e0 hauteur d'\u00e9paules bras tendus, \u00e9cartez les bras en tirant l'\u00e9lastique. \ud83d\udca1 Excellent contre la posture vo\u00fbt\u00e9e caus\u00e9e par le bureau. \u26a0\ufe0f Pincez les omoplates en fin de mouvement. Bras l\u00e9g\u00e8rement fl\u00e9chis. Id\u00e9al \u00e0 faire tous les jours." },
  { id:"f57", name:"Triceps kickback", cat:"Bras", emoji:"\ud83d\udc4a", diff:"D\u00e9butant", calPerRep:0.15, muscles:["Triceps"], zones:["arms"], benefits:["Bras fermes", "Isolation triceps", "Sans machine"], desc:"Buste inclin\u00e9 \u00e0 45\u00b0, coude coll\u00e9 \u00e0 la hanche, \u00e9tendez l'avant-bras vers l'arri\u00e8re. \ud83d\udca1 Maintenez 1-2 secondes le bras compl\u00e8tement tendu pour maximiser la contraction. \u26a0\ufe0f Le coude ne doit pas bouger, seul l'avant-bras se d\u00e9place. Charge l\u00e9g\u00e8re, amplitude compl\u00e8te." },
  { id:"f58", name:"Hammer curl bands", cat:"Bras", emoji:"\ud83d\udd28", diff:"D\u00e9butant", calPerRep:0.14, muscles:["Biceps", "Brachioradial", "Avant-bras"], zones:["arms"], benefits:["Bras toniques", "Avant-bras", "Accessible"], desc:"\u00c9lastique sous les pieds, prise neutre (pouces vers le haut), fl\u00e9chissez les coudes alternativement. \ud83d\udca1 La r\u00e9sistance de l'\u00e9lastique augmente avec l'amplitude, diff\u00e9rent des halt\u00e8res. \u26a0\ufe0f Gardez les coudes immobiles contre le buste. Descendez lentement." },
  { id:"f59", name:"Y-T-W raises", cat:"Dos", emoji:"\u2708\ufe0f", diff:"D\u00e9butant", calPerRep:0.12, muscles:["Rhombo\u00efdes", "Trap\u00e8ze", "Rotateurs"], zones:["back", "shoulders"], benefits:["Posture", "Pr\u00e9vention \u00e9paules", "Dos tonique"], desc:"Allong\u00e9e sur le ventre ou pench\u00e9e, levez les bras en formant successivement un Y, un T puis un W. \ud83d\udca1 Ces mouvements corrigent les d\u00e9s\u00e9quilibres de la coiffe des rotateurs. \u26a0\ufe0f Poids tr\u00e8s l\u00e9gers ou sans poids. La qualit\u00e9 du mouvement prime." },
  { id:"f60", name:"Hip hinge avec \u00e9lastique", cat:"Fessiers", emoji:"\ud83d\udd03", diff:"D\u00e9butant", calPerRep:0.18, muscles:["Fessiers", "Ischio-jambiers", "\u00c9recteurs"], zones:["legs", "back"], benefits:["Apprentissage mouvement", "Cha\u00eene post\u00e9rieure", "S\u00e9curis\u00e9"], desc:"\u00c9lastique autour des hanches fix\u00e9 \u00e0 un support, poussez les hanches vers l'arri\u00e8re puis revenez. \ud83d\udca1 Parfait pour apprendre le mouvement de hip hinge avant de passer au deadlift. \u26a0\ufe0f Dos droit absolument. Les genoux se fl\u00e9chissent l\u00e9g\u00e8rement mais c'est un mouvement de hanche avant tout." },
  { id:"f61", name:"Pallof press", cat:"Abdos", emoji:"\ud83c\udfaf", diff:"Interm\u00e9diaire", calPerRep:0.17, muscles:["Obliques", "Core anti-rotation", "\u00c9paules"], zones:["core"], benefits:["Core anti-rotation", "Taille", "Stabilit\u00e9"], desc:"C\u00e2ble lat\u00e9ral \u00e0 hauteur de poitrine, poussez les bras vers l'avant et retenez la r\u00e9sistance du c\u00e2ble. \ud83d\udca1 L'anti-rotation est une fonction majeure du core souvent n\u00e9glig\u00e9e. \u26a0\ufe0f Ne laissez pas le c\u00e2ble vous faire pivoter : r\u00e9sistez activement. Genoux l\u00e9g\u00e8rement fl\u00e9chis." },
  { id:"f62", name:"Banded squat walk", cat:"Jambes", emoji:"\ud83e\udd86", diff:"D\u00e9butant", calPerRep:0.2, muscles:["Fessiers moyens", "Quadriceps", "Abducteurs"], zones:["legs"], benefits:["Activation compl\u00e8te", "Warm-up", "Fessiers actifs"], desc:"\u00c9lastique aux genoux, position squat bas. Avancez en gardant la r\u00e9sistance et la position semi-squat. \ud83d\udca1 Id\u00e9al en activation avant la s\u00e9ance de jambes. \u26a0\ufe0f Ne laissez pas les genoux s'effondrer vers l'int\u00e9rieur : r\u00e9sistez \u00e0 l'\u00e9lastique." },
  { id:"f63", name:"Romanian single leg deadlift", cat:"Fessiers", emoji:"\ud83e\udda9", diff:"Interm\u00e9diaire", calPerRep:0.28, muscles:["Ischio-jambiers", "Fessiers", "Stabilisateurs"], zones:["legs", "back"], benefits:["\u00c9quilibre", "Ischio unilat\u00e9ral", "Proprioception"], desc:"Sur une jambe, penchez le buste vers l'avant en tendant l'autre jambe derri\u00e8re vous. \ud83d\udca1 Regardez un point fixe au sol pour garder l'\u00e9quilibre. \u26a0\ufe0f Ne faites pas pivoter les hanches : gardez-les parall\u00e8les au sol tout au long du mouvement." },
  { id:"f64", name:"Step-up with knee drive", cat:"Jambes", emoji:"\ud83e\ude9c", diff:"Interm\u00e9diaire", calPerRep:0.25, muscles:["Fessiers", "Quadriceps", "Hip flexors"], zones:["legs", "core"], benefits:["Fonctionnel", "Fessiers actifs", "\u00c9quilibre"], desc:"Montez sur la bo\u00eete et \u00e0 la fin du mouvement, levez le genou oppos\u00e9 vers la poitrine. \ud83d\udca1 Le drive du genou ajoute de la stabilit\u00e9 et active les hip flexors. \u26a0\ufe0f Poussez bien avec la jambe pos\u00e9e sur la bo\u00eete, ne vous aidez pas avec la jambe qui monte." },
  { id:"f65", name:"Cable crunch agenouill\u00e9e", cat:"Abdos", emoji:"\ud83d\udd3d", diff:"Interm\u00e9diaire", calPerRep:0.16, muscles:["Abdominaux", "Obliques"], zones:["core"], benefits:["R\u00e9sistance progressive", "Abdos d\u00e9finis", "Efficace"], desc:"Agenouill\u00e9e face au c\u00e2ble haut, corde derri\u00e8re la t\u00eate. Fl\u00e9chissez le buste vers les genoux. \ud83d\udca1 La r\u00e9sistance du c\u00e2ble est sup\u00e9rieure aux crunchs normaux. \u26a0\ufe0f Ce sont les abdominaux qui doivent tirer, pas les bras. Maintenez 1 seconde en bas." },
  { id:"f66", name:"Jumping squat", cat:"Cardio", emoji:"\ud83d\ude80", diff:"Interm\u00e9diaire", calPerRep:0.32, muscles:["Quadriceps", "Fessiers", "Mollets", "Cardio"], zones:["legs"], benefits:["Explosivit\u00e9", "Cardio", "Br\u00fble graisses"], desc:"Squat normal suivi d'un saut explosif. Atterrissez doucement en fl\u00e9chissant les genoux. \ud83d\udca1 L'atterrissage doux prot\u00e8ge les articulations. \u26a0\ufe0f Ne faites pas des squats trop profonds avant le saut pour pr\u00e9server les genoux. Id\u00e9al en HIIT." },
  { id:"f67", name:"Pilates leg circle", cat:"Abdos", emoji:"\u2b55", diff:"D\u00e9butant", calPerRep:0.12, muscles:["Hip flexors", "Core", "Adducteurs"], zones:["core", "legs"], benefits:["Mobilit\u00e9 hanche", "Core actif", "Souplesse"], desc:"Allong\u00e9e, une jambe tendue vers le plafond. Faites de grands cercles avec cette jambe dans les deux sens. \ud83d\udca1 Le core doit rester stable pendant que la jambe tourne. \u26a0\ufe0f Gardez les deux \u00e9paules au sol. Commencez par de petits cercles puis agrandissez." },
  { id:"f68", name:"Inchworm", cat:"Cardio", emoji:"\ud83d\udc1b", diff:"D\u00e9butant", calPerRep:0.18, muscles:["Core", "\u00c9paules", "Ischio-jambiers", "Souplesse"], zones:["core", "shoulders"], benefits:["Mobilit\u00e9 totale", "Activation", "Echauffement"], desc:"Debout, descendez toucher le sol, marchezavec les mains jusqu'en position pompe, revenez en marchant avec les mains. \ud83d\udca1 Excellent \u00e9chauffement dynamique. \u26a0\ufe0f Gardez les jambes aussi tendues que possible pour \u00e9tirer les ischio-jambiers." },
  { id:"f69", name:"Squat to press", cat:"Cardio", emoji:"\ud83d\udcab", diff:"Interm\u00e9diaire", calPerRep:0.3, muscles:["Corps entier", "Quadriceps", "\u00c9paules"], zones:["legs", "shoulders"], benefits:["Cardio-force", "Calories br\u00fbl\u00e9es", "Fonctionnel"], desc:"Squat avec halt\u00e8res, puis en remontant poussez les halt\u00e8res au-dessus de la t\u00eate. \ud83d\udca1 L'\u00e9lan du squat aide \u00e0 propulser les halt\u00e8res vers le haut. \u26a0\ufe0f Restez contr\u00f4l\u00e9e sur la descente du squat m\u00eame si vous \u00eates fatigu\u00e9e. Charge mod\u00e9r\u00e9e pour maintenir la forme." },
  { id:"f70", name:"Active stretching flow", cat:"Mobilit\u00e9", emoji:"\ud83c\udf0a", diff:"D\u00e9butant", calPerRep:0.09, muscles:["Souplesse", "Mobilit\u00e9", "R\u00e9cup\u00e9ration"], zones:["core", "legs"], benefits:["R\u00e9cup\u00e9ration active", "Souplesse durable", "Bien-\u00eatre"], desc:"Encha\u00eenement : pigeon, l\u00e9zard, \u00e9tirement hip flexor, fente lat\u00e9rale, torsion assise. Maintenez 30s chaque position. \ud83d\udca1 Les \u00e9tirements actifs (l\u00e9g\u00e8re contraction du muscle oppos\u00e9) sont plus efficaces que les \u00e9tirements passifs. \u26a0\ufe0f Ne forcez jamais jusqu'\u00e0 la douleur. La respiration profonde aide \u00e0 rel\u00e2cher." }
];

// ─── IMAGE ENGINE : charge la DB complète 1 seule fois, puis recherche par nom ──
const DB_URL   = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const IMG_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

// Cache global partagé entre toutes les cartes
let _dbPromise = null;
let _dbReady   = null; // tableau une fois chargé

function loadDB() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = fetch(DB_URL)
    .then(r => r.json())
    .then(data => { _dbReady = data; return data; })
    .catch(() => { _dbReady = []; return []; });
  return _dbPromise;
}

// Nettoyage d'un nom pour comparaison floue
function normalize(str) {
  return str.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // enlève accents
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Mots-clés de traduction FR → EN pour aider la recherche
const FR_EN = {
  "squat":"squat","soulevé de terre":"deadlift","développé couché":"bench press",
  "traction":"pull-up","développé militaire":"overhead press","rowing":"row",
  "dips":"dip","curl":"curl","extension":"extension","leg press":"leg press",
  "hack squat":"hack squat","burpee":"burpee","pompe":"push-up","push-up":"push-up",
  "planche":"plank","crunch":"crunch","fente":"lunge","hip thrust":"hip thrust",
  "sumo":"sumo","kettlebell":"kettlebell","tirage":"pulldown","arnold":"arnold",
  "face pull":"face pull","mollet":"calf","corde":"jump rope","box jump":"box jump",
  "mountain climber":"mountain climber","shrug":"shrug","fly":"fly","flye":"fly",
  "pullover":"pullover","skull crusher":"skull crusher","nordic":"nordic",
  "ab wheel":"ab roller","bird dog":"bird dog","glute bridge":"glute bridge",
  "donkey kick":"donkey kick","abduction":"abduction","jumping jack":"jumping jack",
  "high knee":"high knees","triceps":"triceps","biceps":"biceps","deadlift":"deadlift",
  "good morning":"good morning","concentration":"concentration","lateral raise":"lateral raise",
  "front raise":"front raise","farmer":"farmer","pistol":"pistol squat",
  "chin-up":"chin-up","chinup":"chin-up","pulldown":"pulldown","power clean":"power clean",
  "thruster":"thruster","drag flag":"dragon flag","cable crossover":"cable crossover",
  "hyperextension":"hyperextension","superman":"back extension","t-bar":"t-bar row",
  "inverted row":"inverted row","calf raise":"calf raise","reverse curl":"reverse curl",
};

// Cherche dans la DB la meilleure correspondance pour un nom FR
function findBestMatch(nameFR) {
  if (!_dbReady || _dbReady.length === 0) return null;

  const norm = normalize(nameFR);

  // 1. Essai traduction directe
  let translated = norm;
  for (const [fr, en] of Object.entries(FR_EN)) {
    if (norm.includes(normalize(fr))) {
      translated = normalize(en);
      break;
    }
  }

  // 2. Score chaque exercice de la DB
  let best = null, bestScore = 0;
  for (const ex of _dbReady) {
    if (!ex.images || ex.images.length === 0) continue;
    const exNorm = normalize(ex.name);

    // Score basé sur les mots communs
    const wordsQuery = translated.split(" ").filter(w => w.length > 2);
    const wordsEx    = exNorm.split(" ").filter(w => w.length > 2);
    let score = 0;
    for (const w of wordsQuery) {
      if (wordsEx.includes(w)) score += 2;
      else if (wordsEx.some(ew => ew.includes(w) || w.includes(ew))) score += 1;
    }
    // Bonus si commence pareil
    if (exNorm.startsWith(wordsQuery[0])) score += 1;

    if (score > bestScore) { bestScore = score; best = ex; }
  }

  return bestScore >= 1 ? best : null;
}

// Hook React : recherche l'image pour un exercice donné
function useExerciseImage(exName) {
  const [imgUrl, setImgUrl] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadDB().then(() => {
      if (cancelled) return;
      const match = findBestMatch(exName);
      if (match && match.images && match.images.length > 0) {
        setImgUrl(IMG_BASE + match.images[0]);
      }
      setLoaded(true);
    });
    return () => { cancelled = true; };
  }, [exName]);

  return { imgUrl, loaded };
}

// ─── LIGNE D'EXERCICE (dépliable) ─────────────────────────────────────────────
function ExCard({ ex, user, open, onToggle, onAdd }) {
  const [imgErr, setImgErr] = useState(false);
  const { imgUrl } = useExerciseImage(ex.name);
  // Photo de l'exercice si elle existe, sinon photo de la catégorie
  const src = imgUrl && !imgErr ? imgUrl : catPhoto(ex.cat);

  return (
    <>
      <button type="button" className="row" aria-expanded={open} onClick={onToggle}>
        <span className="th"><img className="ph" src={src} alt="" loading="lazy" onError={() => setImgErr(true)} /></span>
        <span>
          <b>{ex.name}</b>
          <span className="mono dim">{ex.cat} · {ex.diff}</span>
          <SensitiveBadge ex={ex} user={user} />
        </span>
        <span className={"sq" + (open ? " on" : "")} aria-hidden="true">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="ex-body">
          <div className="ex-photo"><img className="ph" src={src} alt={ex.name} onError={() => setImgErr(true)} /></div>
          <SensitiveBadge ex={ex} user={user} full />
          <p className="ex-desc">{clean(ex.desc)}</p>
          <MuscleMap ex={ex} />
          <div className="ex-split">
            <div>
              <h4>Muscles ciblés</h4>
              <ul>{ex.muscles.map((m) => <li key={m}>{m}</li>)}</ul>
            </div>
            <div>
              <h4>Bienfaits</h4>
              <ul>{ex.benefits.map((b) => <li key={b}>{b}</li>)}</ul>
            </div>
          </div>
          <p className="mono dim" style={{ marginBottom: 14 }}>Environ {String(ex.calPerRep).replace(".", ",")} kcal par répétition</p>
          <button type="button" className="btn" onClick={onAdd}>
            <span>Ajouter à une séance</span><span aria-hidden="true">+</span>
          </button>
        </div>
      )}
    </>
  );
}

// ─── PAGE EXERCICES ───────────────────────────────────────────────────────────
function ExercisesPage({ user, gender, onGoSeance }) {
  const [filter,   setFilter]   = useState("Tous");
  const [search,   setSearch]   = useState("");
  const [toast,    setToast]    = useState("");
  const [openId,   setOpenId]   = useState(null);
  const [pickerId, setPickerId] = useState(null);
  const [seances,  setSeances]  = useState([]);

  const allExercises = gender === "femme" ? EXERCISES_FEMME : EXERCISES_HOMME;
  const cats = ["Tous", ...new Set(allExercises.map((e) => e.cat))];

  const filtered = allExercises.filter((e) =>
    (filter === "Tous" || e.cat === filter) &&
    (search === "" || e.name.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => {
    if (!user) return;
    api.getSeances().then(setSeances).catch((err) => console.error(err));
  }, [user]);

  const say = (m) => { setToast(m); setTimeout(() => setToast(""), 2500); };

  const addTo = async (ex, seance) => {
    setPickerId(null);
    if ((seance.exercises || []).find((it) => it.ex.id === ex.id)) {
      return say(`${ex.name} est déjà dans « ${seance.nom} ».`);
    }
    try {
      const saved = await api.updateSeance(seance.id, {
        exercises: [...(seance.exercises || []), { ex, sets: "3", reps: "", weight: "" }],
      });
      setSeances((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
      say(`${ex.name} ajouté à « ${seance.nom} ».`);
    } catch (err) {
      say(err.status ? err.message : "Serveur injoignable.");
    }
  };

  return (
    <div className="screen with-tabs">
      <header className="bar">
        <Logo />
        <span className="mono dim">{plural(allExercises.length, "exercice")}</span>
      </header>

      <div className="pad">
        <h1 className="disp h1" style={{ margin: "6px 0 10px" }}>Exercices</h1>
        <input className="search" type="search" placeholder="Rechercher un exercice" aria-label="Rechercher un exercice"
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="chips" role="tablist" aria-label="Catégories">
          {cats.map((c) => (
            <button type="button" key={c} role="tab" aria-selected={filter === c}
              className={filter === c ? "on" : ""} onClick={() => setFilter(c)}>{c === "Tous" ? "Tout" : c}</button>
          ))}
        </div>
        <div className="mono count">{plural(filtered.length, "résultat")}</div>

        {filtered.length === 0 && (
          <div className="empty"><b className="disp">Rien trouvé</b>Essaie un autre mot ou une autre catégorie.</div>
        )}

        {filtered.map((ex) => (
          <div key={ex.id}>
            <ExCard ex={ex} user={user} open={openId === ex.id}
              onToggle={() => { setOpenId(openId === ex.id ? null : ex.id); setPickerId(null); }}
              onAdd={() => setPickerId(ex.id)} />

            {pickerId === ex.id && (
              <div className="picker">
                <div className="mono acc">Ajouter à quelle séance ?</div>
                {seances.map((s) => (
                  <button type="button" key={s.id} className="row no-th" onClick={() => addTo(ex, s)}>
                    <span><b>{s.nom}</b><span className="mono dim">{s.jour} · {plural((s.exercises || []).length, "exercice")}</span></span>
                    <span aria-hidden="true">+</span>
                  </button>
                ))}
                {seances.length === 0 && (
                  <button type="button" className="row no-th" onClick={() => onGoSeance(null)}>
                    <span><b>Aucune séance pour l'instant</b><span className="mono dim">Créer ma première séance</span></span>
                    <span aria-hidden="true">→</span>
                  </button>
                )}
                <button type="button" className="link dim" onClick={() => setPickerId(null)}>Annuler</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

export default ExercisesPage;
