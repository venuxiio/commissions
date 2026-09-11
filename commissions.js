// Services + site settings — edit this file to change prices, add a service,
// or flip commissions open/closed. This file is the single source of truth:
// the database stores commission requests only, nothing here is read back.
//
// `services`: array order = display order on the site.
// `addons`: the request form's optional add-ons (rendered + priced from here
//   by js/request-form.js). `key`/`tier.value` are what gets stored in the
//   commissions.options column — renaming them orphans existing rows.
// `settings.commsOpen` flips the public banner + request form;
// `settings.reopenDate` (YYYY-MM-DD or null) shows "closed until <date>";
// `settings.maxSlots` is admin-board display only (waiting-list slots).

const siteData = {
  "settings": {
    "commsOpen": true,
    "reopenDate": null,
    "maxSlots": 8
  },
  "addons": {
    "background": {
      "key": "background", "label": "Simple background", "price": 10
    },
    "armor": {
      "key": "armor", "label": "Armor / weapons / robotic parts", "perCharacter": true,
      "tiers": [
        { "value": "simple",  "label": "Simple — +€5",  "price": 5 },
        { "value": "complex", "label": "Complex — +€10", "price": 10 }
      ]
    }
  },
  "services": [
    { "name": "Bust",           "basePrice": 40,  "extraCharPrice": 35, "description": "",                                                              "image": "assets/images/examples/bust/bust.webp",        "active": true },
    { "name": "Halfbody",       "basePrice": 50,  "extraCharPrice": 40, "description": "",                                                              "image": "assets/images/examples/halfbody/halfbody.webp","active": true },
    { "name": "Knee up",        "basePrice": 70,  "extraCharPrice": 60, "description": "",                                                              "image": "assets/images/examples/kneeup/kneeup.webp",    "active": true },
    { "name": "Fullbody",       "basePrice": 90,  "extraCharPrice": 70, "description": "",                                                              "image": "assets/images/examples/fullbody/fullbody.webp","active": true },
    { "name": "Chibi",          "basePrice": 40,  "extraCharPrice": 35, "description": "",                                                              "image": "assets/images/examples/chibi/chibi.webp",      "active": true },
    { "name": "Custom",         "basePrice": 100, "extraCharPrice": 0,  "description": "Fullbody by default. Final price varies with character complexity; includes a moodboard plus an assigned animal.", "image": "assets/images/examples/custom/custom.webp", "active": true },
    { "name": "Reference sheet","basePrice": 200, "extraCharPrice": 0,  "description": "Check the example image in the gallery.",                                            "image": "assets/images/examples/refsheet/Illustration15.webp", "active": true }
  ]
};
