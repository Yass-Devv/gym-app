// Photo unique des exercices absents de free-exercise-db, par identifiant d'exercice.
// Images de Wikimedia Commons, sous licences libres : l'auteur et la licence de chacune figurent sur sa page
// commons.wikimedia.org (nom du fichier dans l'adresse).
const BASE = "https://thumb.wikimedia.org/wikipedia/";

const PATHS = {
  "h13": "commons/thumb/7/7a/Airborne_Burpee.jpg/330px-Airborne_Burpee.jpg",
  "f30": "commons/thumb/9/91/Pilates_01.jpg/330px-Pilates_01.jpg",
  "f18": "commons/thumb/6/63/Zumba_%288158431916%29.jpg/330px-Zumba_%288158431916%29.jpg",
  "f5": "commons/thumb/0/02/Trenirovachni_lastici_set.JPG/330px-Trenirovachni_lastici_set.JPG",
  "s-jab-cross": "commons/thumb/d/dd/USMC-100509-M-2339L-173.jpg/330px-USMC-100509-M-2339L-173.jpg",
  "s-combo": "commons/thumb/6/6b/US_Navy_030327-N-9693M-002_Lt._Cmdr._Philip_Creider%2C_left%2C_shows_Aviation_Machinist_Mate_3rd_Class_Gaspar_Vazquez_how_to_work_a_speed_bag.jpg/330px-US_Navy_030327-N-9693M-002_Lt._Cmdr._Philip_Creider%2C_left%2C_shows_Aviation_Machinist_Mate_3rd_Class_Gaspar_Vazquez_how_to_work_a_speed_bag.jpg",
  "s-sprawl": "commons/thumb/8/84/USMC_grappling_sprawl.jpg/330px-USMC_grappling_sprawl.jpg",
  "s-footwork": "commons/thumb/d/d9/Ouch-boxing-footwork.jpg/330px-Ouch-boxing-footwork.jpg",
  "s-griffe": "commons/thumb/0/0a/Speedsuit.jpg/330px-Speedsuit.jpg",
  "s-chien": "commons/thumb/5/57/Downward-Facing-Dog.JPG/330px-Downward-Facing-Dog.JPG",
  "s-salutation": "commons/thumb/3/3a/Yoga_Teacher_Training_in_India_%28cropped%29.jpg/330px-Yoga_Teacher_Training_in_India_%28cropped%29.jpg",
  "s-guerrier1": "commons/thumb/a/a6/Virabhadrasana_I_-_Warrior_Pose_I.jpg/330px-Virabhadrasana_I_-_Warrior_Pose_I.jpg",
  "s-cobra": "commons/thumb/a/ae/Bhujangasana_Yoga-Asana_Nina-Mel.jpg/330px-Bhujangasana_Yoga-Asana_Nina-Mel.jpg",
  "s-arbre": "commons/thumb/7/72/Vriksasana_Yoga-Asana_Nina-Mel.jpg/330px-Vriksasana_Yoga-Asana_Nina-Mel.jpg",
  "s-pigeon": "commons/thumb/1/1e/Yoga_shaktipat_rajakapotasana_by_alexey_baykov.jpg/330px-Yoga_shaktipat_rajakapotasana_by_alexey_baykov.jpg",
  "s-chaise": "commons/thumb/5/59/Utkatasana_Yoga-Asana_Nina-Mel.jpg/330px-Utkatasana_Yoga-Asana_Nina-Mel.jpg",
  "s-longueurs": "commons/thumb/b/b6/Incheon_AsianGames_Swimming_19_%2815178565298%29.jpg/330px-Incheon_AsianGames_Swimming_19_%2815178565298%29.jpg",
  "s-battements-dos": "commons/thumb/e/ec/Gordan_Kozulj_Croatia_backstroke_EC.jpg/330px-Gordan_Kozulj_Croatia_backstroke_EC.jpg",
  "s-plies": "commons/thumb/d/d7/Jiwee_Kwen_-_La_Bayad%C3%A8re%2C_Ombres_2e_v._-_Prix_de_Lausanne_2010-3.jpg/330px-Jiwee_Kwen_-_La_Bayad%C3%A8re%2C_Ombres_2e_v._-_Prix_de_Lausanne_2010-3.jpg",
  "s-releves": "commons/thumb/7/76/EnPointeFoot.jpg/330px-EnPointeFoot.jpg",
  "s-choree": "commons/thumb/8/86/Step_Aerobics_Class_at_a_Gym.JPG/330px-Step_Aerobics_Class_at_a_Gym.JPG",
  "s-danseuse": "commons/thumb/e/ec/%C3%89preuve_Cyclisme_Route_Course_Ligne_Masculine_Jeux_Olympiques_2024_Rue_Saint_%C3%89leuth%C3%A8re_-_Paris_XVIII_%28FR75%29_-_2024-08-03_-_51.jpg/330px-%C3%89preuve_Cyclisme_Route_Course_Ligne_Masculine_Jeux_Olympiques_2024_Rue_Saint_%C3%89leuth%C3%A8re_-_Paris_XVIII_%28FR75%29_-_2024-08-03_-_51.jpg",
  "s-sortie-longue": "commons/thumb/4/4e/20220424_Liege_Bastogne_Liege117_edited_by_PetarM.jpg/330px-20220424_Liege_Bastogne_Liege117_edited_by_PetarM.jpg",
  "s-wall-ball": "commons/thumb/6/61/Soldier_tosses_a_medicine_ball_while_working_out_DVIDS462753.jpg/330px-Soldier_tosses_a_medicine_ball_while_working_out_DVIDS462753.jpg",
  "s-detente": "commons/thumb/c/c3/Vertical_jump_measurement_test.png/330px-Vertical_jump_measurement_test.png",
  "f45": "commons/thumb/2/29/Airman_performing_lunge.jpg/330px-Airman_performing_lunge.jpg",
  "f55": "commons/thumb/b/b5/Barre_%D0%B2_SM_Stretching.jpg/330px-Barre_%D0%B2_SM_Stretching.jpg",
};

export const EX_PICS = Object.fromEntries(Object.entries(PATHS).map(([id, path]) => [id, BASE + path]));
