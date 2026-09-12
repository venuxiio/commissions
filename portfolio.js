// Portfolio gallery data — edit this file to add art.
// Keep the list sorted newest-first: 'date' (YYYY-MM-DD, zero-padded) is what
// the site string-sorts by, so '2026-7-3' instead of '2026-07-03' would sort
// wrong. Equal dates keep file order.
// Optional per item: 'title' (lightbox caption, defaults to category),
//                    'focus' (object-position for off-center crops, e.g. wide reference sheets).

const portfolioItems = [
    { src: 'assets/images/examples/custom/Illustration113.webp',             category: 'Custom',          date: '2026-09-08' },
    { src: 'assets/images/examples/halfbody/Shark.webp',                     category: 'Halfbody',        date: '2026-09-07' },
    { src: 'assets/images/examples/kneeup/ge.webp',                          category: 'Knee up',         date: '2026-09-07' },
    { src: 'assets/images/examples/kneeup/bfb.webp',                         category: 'Knee up',         date: '2026-09-06' },
    { src: 'assets/images/examples/fullbody/reu.webp',                       category: 'Fullbody',        date: '2026-09-05' },
    { src: 'assets/images/examples/chibi/chibi1.webp',                       category: 'Chibi',           date: '2026-09-04' },
    { src: 'assets/images/examples/kneeup/Illustration100.webp',             category: 'Knee up',         date: '2026-09-03' },
    { src: 'assets/images/examples/kneeup/Illustration94.webp',              category: 'Knee up',         date: '2026-09-02' },
    { src: 'assets/images/examples/kneeup/Illustration106.webp',             category: 'Knee up',         date: '2026-09-01' },
    { src: 'assets/images/examples/kneeup/cwc.webp',                         category: 'Knee up',         date: '2026-08-31' },
    { src: 'assets/images/examples/fullbody/104353733_jKtHePsU0tpOXpb.webp', category: 'Fullbody',        date: '2026-08-22' },
    { src: 'assets/images/examples/kneeup/kneeup3.webp',                     category: 'Knee up',         date: '2026-08-09' },
    { src: 'assets/images/examples/bust/bust2.webp',                         category: 'Bust',            date: '2026-07-26' },
    { src: 'assets/images/examples/refsheet/5.webp',                         category: 'Reference Sheet', date: '2026-07-20' },
    { src: 'assets/images/examples/bust/119230122_ZSgnKSI8rI1eR2e.webp',     category: 'Bust',            date: '2026-07-17' },
    { src: 'assets/images/examples/fullbody/119119719_xn3VnStcaiu0qyv.webp', category: 'Fullbody',        date: '2026-07-16' },
    { src: 'assets/images/examples/halfbody/120590102_iZF4gzlA7LOV5K5.webp', category: 'Halfbody',        date: '2026-07-15' },
    { src: 'assets/images/examples/halfbody/239.webp',                       category: 'Halfbody',        date: '2026-07-12' },
    { src: 'assets/images/examples/halfbody/Illustration11.webp',            category: 'Halfbody',        date: '2026-07-11' },
    { src: 'assets/images/examples/custom/custom.webp',                      category: 'Custom',          date: '2026-06-27' },
    { src: 'assets/images/examples/chibi/109287195_yKIUzhLE4FBBDAW.webp',    category: 'Chibi',           date: '2026-06-14' },
    { src: 'assets/images/examples/fullbody/fullbody1.webp',                 category: 'Fullbody',        date: '2026-05-30' },
    { src: 'assets/images/examples/refsheet/Illustration15.webp',            category: 'Reference Sheet', date: '2026-05-16', focus: '68% 50%' },
    { src: 'assets/images/examples/kneeup/kneeup.webp',                      category: 'Knee up',         date: '2026-05-02' },
    { src: 'assets/images/examples/bust/97772967_xLGHDIWFxCSzqWd.webp',      category: 'Bust',            date: '2026-04-18' },
    { src: 'assets/images/examples/halfbody/halfbody2.webp',                 category: 'Halfbody',        date: '2026-04-04' },
    { src: 'assets/images/examples/chibi/chibi.webp',                        category: 'Chibi',           date: '2026-03-14' },
    { src: 'assets/images/examples/fullbody/fullbody.webp',                  category: 'Fullbody',        date: '2026-02-21' },
    { src: 'assets/images/examples/kneeup/kneeup2.webp',                     category: 'Knee up',         date: '2026-01-24' },
    { src: 'assets/images/examples/halfbody/halfbody.webp',                  category: 'Halfbody',        date: '2025-12-13' },
    { src: 'assets/images/examples/bust/bust.webp',                          category: 'Bust',            date: '2025-11-15' },
];

// Chip order in the filter bar
const portfolioCategories = ['Bust', 'Halfbody', 'Knee up', 'Fullbody', 'Chibi', 'Custom', 'Reference Sheet'];
