// Seed / fallback data. Used when Airtable is not configured or unreachable
// (see js/airtable-client.js and AIRTABLE_SETUP.md).
// Once Airtable is live this file is only a safety net — edit data there.

const seedData = {
  "settings": {
    "commsOpen": false,
    "reopenDate": null,
    "maxSlots": 8,
    "artTradesOpen": false,
    "requestsOpen": false,
    "announcement": ""
  },
  "services": [
    { "name": "Bust",           "category": "Full render", "basePrice": 40,  "extraCharPrice": 35, "description": "",                                                              "image": "assets/images/examples/bust/bust.webp",        "active": true },
    { "name": "Halfbody",       "category": "Full render", "basePrice": 50,  "extraCharPrice": 40, "description": "",                                                              "image": "assets/images/examples/halfbody/halfbody.webp","active": true },
    { "name": "Knee up",        "category": "Full render", "basePrice": 70,  "extraCharPrice": 60, "description": "",                                                              "image": "assets/images/examples/kneeup/kneeup.webp",    "active": true },
    { "name": "Fullbody",       "category": "Full render", "basePrice": 90,  "extraCharPrice": 70, "description": "",                                                              "image": "assets/images/examples/fullbody/fullbody.webp","active": true },
    { "name": "Chibi",          "category": "Full render", "basePrice": 40,  "extraCharPrice": 35, "description": "",                                                              "image": "assets/images/examples/chibi/chibi.webp",      "active": true },
    { "name": "Custom",         "category": "Full render", "basePrice": 100, "extraCharPrice": 0,  "description": "Fullbody by default. Final price varies with character complexity; includes a moodboard plus an assigned animal.", "image": "assets/images/examples/custom/custom.webp", "active": true },
    { "name": "Reference sheet","category": "Full render", "basePrice": 200, "extraCharPrice": 0,  "description": "Check the example image in the gallery.",                                            "image": "assets/images/examples/refsheet/Illustration15.webp", "active": true },
    { "name": "Sketch Bust",     "category": "Sketch", "basePrice": 15, "extraCharPrice": 0, "description": "", "image": "assets/images/examples/bust/bust2.webp",       "active": true },
    { "name": "Sketch Halfbody", "category": "Sketch", "basePrice": 24, "extraCharPrice": 0, "description": "", "image": "assets/images/examples/halfbody/halfbody2.webp","active": true },
    { "name": "Sketch Knee up",  "category": "Sketch", "basePrice": 30, "extraCharPrice": 0, "description": "", "image": "assets/images/examples/kneeup/kneeup2.webp",   "active": true },
    { "name": "Sketch Fullbody", "category": "Sketch", "basePrice": 40, "extraCharPrice": 0, "description": "", "image": "assets/images/examples/fullbody/fullbody1.webp","active": true },
    { "name": "Sketch Chibi",    "category": "Sketch", "basePrice": 15, "extraCharPrice": 0, "description": "", "image": "assets/images/examples/chibi/chibi1.webp",     "active": true }
  ],
  "commissions": [
    { "id": 1,  "status": "finished",     "title": "fullbody + bg",           "description": "eddytails",        "paid": true },
    { "id": 2,  "status": "finished",     "title": "2 Knee ups",              "description": "da.veed05",        "paid": true },
    { "id": 3,  "status": "finished",     "title": "Sketch fullbody",         "description": "Ashttro",          "paid": true },
    { "id": 4,  "status": "finished",     "title": "Two fullbodies",          "description": "H.z.a3_",          "paid": true },
    { "id": 5,  "status": "finished",     "title": "Halfbody",                "description": "Sif_3905",         "paid": true },
    { "id": 6,  "status": "finished",     "title": "Halfbody",                "description": "simp4lava",        "paid": true },
    { "id": 7,  "status": "waiting-list", "title": "Halfbody",                "description": "da_glooba",        "paid": false },
    { "id": 8,  "status": "waiting-list", "title": "two knees up",            "description": "thealvinxu",       "paid": false },
    { "id": 9,  "status": "finished",     "title": "2 halfbodies",            "description": "Landspeeda",       "paid": true },
    { "id": 10, "status": "waiting-list", "title": "halfbody unshaded",       "description": "lexlul09",         "paid": false },
    { "id": 11, "status": "waiting-list", "title": "Fullbody",                "description": "Seong_strz",       "paid": false },
    { "id": 12, "status": "finished",     "title": "Knee up",                 "description": "Albino_Trash_Panda","paid": true },
    { "id": 13, "status": "finished",     "title": "Sketch fullbody",         "description": "H.z.a3_",          "paid": true },
    { "id": 14, "status": "waiting-list", "title": "Custom",                  "description": "cyborne_exe",      "paid": false },
    { "id": 15, "status": "finished",     "title": "Halfbody + background",   "description": "Jesusrocha",       "paid": true },
    { "id": 16, "status": "finished",     "title": "Fullbody+background",     "description": "theo_frv1",        "paid": true },
    { "id": 17, "status": "finished",     "title": "2 halfbodies",            "description": "nexystuff",        "paid": true }
  ]
};
