// Seed / fallback data. Used when Supabase is not configured or unreachable
// (see js/db-client.js and SUPABASE_SETUP.md).
// Once Supabase is live this file is only a safety net — edit data there.
// Commissions have no public surface anymore (admin board only), so the
// seed queue is empty.

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
  "commissions": []
};
