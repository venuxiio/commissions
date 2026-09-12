// Shared commission request form — one definition, three mount points:
//   index.html  public request modal   → mode 'public'
//   admin.html  "Add commission"       → mode 'admin-add'
//   admin.html  ✏️ edit dialog         → mode 'admin-edit'
//
// Add-on labels/prices come from siteData.addons, services from the
// `services` mount option — edit the data, not this file. Markup reuses the
// classes in css/request-form.css (shared by both pages).
//
// The component renders its own <form> and handles validation, image
// compression/upload and the estimate; the host decides what "submit" means
// via the onSubmit callback (public: SupabaseClient.submitRequest, admin:
// adminCreateCommission / adminUpdateCommission).

const RequestForm = (() => {
    const MAX_IMAGES = 3;
    const MAX_EDGE = 1600;      // compressed long edge, px
    const PASS_THROUGH = 300 * 1024;  // files smaller than this upload as-is

    // legacy status keys — the same ones the admin board uses (mapped to the
    // DB's request/waiting/in_progress/finished by db-client.js)
    const STATUS_OPTIONS = [
        ['request', 'Request'],
        ['waiting-list', 'Waiting list'],
        ['in-progress', 'In progress'],
        ['finished', 'Finished']
    ];

    let instanceCount = 0;

    function addonsData() {
        return (typeof siteData !== 'undefined' && siteData.addons) || {};
    }

    function mount(container, options = {}) {
        const mode = options.mode || 'public';
        const isPublic = mode === 'public';
        const isEdit = mode === 'admin-edit';
        const services = options.services || [];
        const uid = `rff${++instanceCount}`;
        const requireImage = options.requireImage !== undefined ? options.requireImage : isPublic;

        const findService = name => services.find(s => s.name === name) || null;

        // ---- instance state ----
        const initial = options.initial || {};
        const state = {
            service: initial.service || services[0]?.name || null,
            chars: Math.min(6, Math.max(1, initial.chars || 1)),
            // key → false (flat addon) | tier value (perCharacter addon)
            addons: {},
            // staged files + kept existing attachments, in display order
            images: [],
            removedAttachments: [],
            submitting: false
        };
        Object.values(addonsData()).forEach(addon => {
            if (addon.perCharacter) {
                state.addons[addon.key] = initial.options?.[addon.key] || null;
            } else {
                state.addons[addon.key] = Boolean(initial.options?.[addon.key]);
            }
        });
        (initial.attachments || []).forEach(path => {
            if (path) state.images.push({ kind: 'existing', path });
        });

        const els = {};

        // ---- tiny DOM helpers ----
        function el(tag, className, text) {
            const node = document.createElement(tag);
            if (className) node.className = className;
            if (text !== undefined) node.textContent = text;
            return node;
        }

        function formGroup(labelText, inputEl, { hintId, star, inline } = {}) {
            const group = el('div', 'form-group');
            const label = el('label', null, labelText);
            if (inputEl.id) label.htmlFor = inputEl.id;
            if (star) label.appendChild(el('span', 'req-star', ' *'));
            if (inline) label.appendChild(el('span', 'form-hint-inline', ` ${inline}`));
            group.append(label, inputEl);
            if (hintId) {
                const hint = el('p', 'form-hint');
                hint.id = hintId;
                group.appendChild(hint);
                return { group, hint };
            }
            return { group };
        }

        // ---- sections ----

        function buildContact(form) {
            // honeypot: hidden from humans, catches bots (public only)
            if (isPublic) {
                const hp = document.createElement('input');
                hp.type = 'text';
                hp.name = 'website';
                hp.id = `${uid}-hp`;
                hp.tabIndex = -1;
                hp.autocomplete = 'off';
                hp.hidden = true;
                els.honeypot = hp;
                form.appendChild(hp);
            }

            const name = document.createElement('input');
            name.type = 'text';
            name.id = `${uid}-name`;
            name.placeholder = 'Name / nickname';
            name.value = initial.client || '';
            els.name = name;
            const nameRow = el('div', 'form-row');
            nameRow.appendChild(formGroup('Your name', name, { star: true }).group);
            form.appendChild(nameRow);

            const email = document.createElement('input');
            email.type = 'email';
            email.id = `${uid}-email`;
            email.placeholder = 'your@email.com';
            email.value = contactPart(initial.contact, 0);

            const social = document.createElement('input');
            social.type = 'text';
            social.id = `${uid}-social`;
            social.placeholder = 'username';
            social.value = contactPart(initial.contact, 1);

            const contactRow = el('div', 'form-row form-row-multi');
            const emailGroup = el('div', 'form-group');
            const emailLabel = el('label', null, 'Email');
            emailLabel.htmlFor = email.id;
            emailGroup.append(emailLabel, email);
            const socialGroup = el('div', 'form-group');
            const socialLabel = el('label', null, 'Discord / Instagram username');
            socialLabel.htmlFor = social.id;
            socialGroup.append(socialLabel, social);
            contactRow.append(emailGroup, socialGroup);
            form.append(contactRow, el('p', 'form-hint', 'Fill at least one contact field so I can reach you. *'));

            els.email = email;
            els.social = social;
        }

        // "email · @social" is stored as one string; best-effort split for
        // pre-filling the edit form (covers what the public form writes)
        function contactPart(contact, index) {
            if (!contact) return '';
            const parts = contact.split(' · ');
            return (parts[index] || '').replace(/^@/, '');
        }

        function buildServiceField(form) {
            const group = el('div', 'form-group');
            if (isPublic) {
                const label = el('label', null, 'Service');
                const display = el('div', 'service-display');
                display.id = `${uid}-service-display`;
                group.append(label, display);
                els.serviceDisplay = display;
            } else {
                const select = document.createElement('select');
                select.id = `${uid}-service`;
                services.forEach(service => {
                    const opt = document.createElement('option');
                    opt.value = service.name;
                    opt.textContent = service.name;
                    select.appendChild(opt);
                });
                // a stored service that was since deactivated/renamed must
                // still be selectable, not silently dropped
                if (state.service && !findService(state.service)) {
                    const opt = document.createElement('option');
                    opt.value = state.service;
                    opt.textContent = `${state.service} (inactive)`;
                    select.appendChild(opt);
                }
                select.value = state.service || '';
                select.addEventListener('change', () => {
                    state.service = select.value || null;
                    updateEstimateUI();
                });
                els.serviceSelect = select;
                const label = el('label', null, 'Service');
                label.htmlFor = select.id;
                group.append(label, select);
            }
            form.appendChild(group);
        }

        function buildChars(form) {
            const minus = el('button', null, '−');
            minus.type = 'button';
            minus.id = `${uid}-chars-minus`;
            minus.setAttribute('aria-label', 'Fewer characters');

            const value = el('span', 'number-stepper-value', String(state.chars));
            value.id = `${uid}-chars-value`;

            const plus = el('button', null, '+');
            plus.type = 'button';
            plus.id = `${uid}-chars-plus`;
            plus.setAttribute('aria-label', 'More characters');

            const stepper = el('div', 'number-stepper');
            stepper.append(minus, value, plus);

            const { group, hint } = formGroup('Number of characters', stepper, { hintId: `${uid}-extra-hint`, star: true });
            form.appendChild(group);
            els.charsValue = value;
            els.extraHint = hint;

            const updateChars = delta => {
                state.chars = Math.min(6, Math.max(1, state.chars + delta));
                value.textContent = state.chars;
                updateEstimateUI();
            };
            minus.addEventListener('click', () => updateChars(-1));
            plus.addEventListener('click', () => updateChars(1));
        }

        function buildOptions(form) {
            const addons = Object.values(addonsData());
            if (!addons.length) return;

            const group = el('div', 'form-group');
            group.appendChild(el('label', null, 'Options'));
            const grid = el('div', 'options-grid');

            addons.forEach(addon => {
                const box = el('div', 'option-box');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `${uid}-${addon.key}`;
                checkbox.checked = Boolean(state.addons[addon.key]);

                const main = el('label', 'option-main');
                main.htmlFor = checkbox.id;
                const text = el('span', 'option-text', addon.label);
                if (addon.perCharacter) {
                    const tier = (addon.tiers || [])[0];
                    const top = (addon.tiers || [])[(addon.tiers || []).length - 1];
                    if (tier && top) {
                        text.appendChild(el('span', 'option-price',
                            `+€${tier.price}–${top.price}${addon.perCharacter ? ' / char' : ''}`));
                    }
                } else {
                    text.appendChild(el('span', 'option-price', `+€${addon.price}`));
                }
                main.append(checkbox, text);
                box.appendChild(main);

                if (addon.perCharacter) {
                    box.classList.add('option-with-sub');
                    const sub = el('div', 'option-sub');
                    sub.id = `${uid}-${addon.key}-detail`;
                    const tierSelect = document.createElement('select');
                    tierSelect.id = `${uid}-${addon.key}-amount`;
                    (addon.tiers || []).forEach(tier => {
                        const opt = document.createElement('option');
                        opt.value = tier.value;
                        opt.textContent = tier.label;
                        tierSelect.appendChild(opt);
                    });
                    tierSelect.value = state.addons[addon.key] || (addon.tiers || [])[0]?.value || '';
                    const subLabel = el('label', 'option-sub-label', `${addon.label.split(' /')[0]} complexity (per character)`);
                    subLabel.htmlFor = tierSelect.id;
                    sub.append(subLabel, tierSelect);
                    box.appendChild(sub);
                    els[`${addon.key}Sub`] = sub;

                    tierSelect.addEventListener('change', () => {
                        if (checkbox.checked) {
                            state.addons[addon.key] = tierSelect.value;
                            updateEstimateUI();
                        }
                    });
                }

                checkbox.addEventListener('change', () => {
                    if (addon.perCharacter) {
                        const tierSelect = box.querySelector('select');
                        state.addons[addon.key] = checkbox.checked ? tierSelect.value : null;
                        els[`${addon.key}Sub`].hidden = !checkbox.checked;
                    } else {
                        state.addons[addon.key] = checkbox.checked;
                    }
                    updateEstimateUI();
                });

                grid.appendChild(box);
            });

            group.appendChild(grid);
            form.appendChild(group);
        }

        function buildImages(form) {
            const group = el('div', 'form-group');
            const label = el('label', null, 'Reference images');
            if (requireImage) label.appendChild(el('span', 'req-star', ' *'));
            label.appendChild(el('span', 'form-hint-inline', ' (up to 3 — character sheet, poses, palette…)'));
            group.appendChild(label);

            const grid = el('div', 'ref-images');
            const status = el('p', 'ref-image-status');
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.multiple = true;
            input.className = 'ref-image-input';
            input.id = `${uid}-file`;

            const addTile = el('button', 'ref-image-add', '+');
            addTile.type = 'button';
            addTile.title = 'Add a reference image';
            addTile.addEventListener('click', () => input.click());
            els.addTile = addTile;

            input.addEventListener('change', () => {
                const room = MAX_IMAGES - state.images.length;
                const files = Array.from(input.files || []);
                input.value = '';
                const ok = files.filter(f => f.type.startsWith('image/'));
                let message = '';
                if (ok.length < files.length) message = 'Only image files can be attached.';
                if (files.length > room) message = `Up to ${MAX_IMAGES} images — the extra ${files.length - room} were skipped.`;
                ok.slice(0, Math.max(0, room)).forEach(file => {
                    state.images.push({
                        kind: 'file',
                        file,
                        name: file.name,
                        previewUrl: URL.createObjectURL(file)
                    });
                });
                status.textContent = message;
                renderImageGrid();
            });

            els.imageGrid = grid;
            els.imageStatus = status;
            group.append(grid, addTile, input, status);
            form.appendChild(group);
            renderImageGrid();
        }

        function renderImageGrid() {
            const grid = els.imageGrid;
            grid.innerHTML = '';

            state.images.forEach((item, index) => {
                const thumb = el('div', 'ref-image-thumb');
                const img = document.createElement('img');
                img.alt = item.kind === 'existing' ? 'Reference' : item.name;
                if (item.kind === 'existing') {
                    if (options.resolveAttachment) {
                        options.resolveAttachment(item.path).then(url => { img.src = url; })
                            .catch(() => { img.alt = 'Preview unavailable'; });
                    }
                } else {
                    img.src = item.previewUrl;
                }
                const remove = el('button', 'ref-image-remove', '✕');
                remove.type = 'button';
                remove.title = 'Remove';
                remove.setAttribute('aria-label', `Remove reference ${index + 1}`);
                remove.addEventListener('click', () => {
                    if (item.kind === 'existing') {
                        state.removedAttachments.push(item.path);
                    } else {
                        URL.revokeObjectURL(item.previewUrl);
                    }
                    state.images.splice(index, 1);
                    renderImageGrid();
                });
                thumb.append(img, remove);
                grid.appendChild(thumb);
            });

            const addTile = els.addTile;
            if (addTile) addTile.hidden = state.images.length >= MAX_IMAGES;
        }

        function buildDetails(form) {
            const details = document.createElement('textarea');
            details.id = `${uid}-details`;
            details.rows = 3;
            details.placeholder = 'e.g. my OC sitting, happy expression, soft colors';
            details.value = initial.details || '';
            els.details = details;
            form.appendChild(formGroup('Details', details, { inline: '(pose, expression, mood…)' }).group);
        }

        function buildEstimate(form) {
            if (isEdit) {
                // the artist's number is authoritative — editable, with a
                // link to re-fill it from the live math
                const override = document.createElement('input');
                override.type = 'number';
                override.id = `${uid}-estimate`;
                override.min = '0';
                override.step = '0.01';
                override.placeholder = 'estimate €';
                if (initial.estimate != null) override.value = initial.estimate;
                els.estimateOverride = override;

                const hint = el('p', 'estimate-override-hint');
                els.estimateHint = hint;

                const recalc = el('button', 'estimate-recalc', 'recalculate');
                recalc.type = 'button';
                recalc.title = 'Fill in the price computed from this form';
                recalc.addEventListener('click', () => {
                    override.value = computeEstimate().total;
                });

                const wrap = el('div', 'estimate-override');
                wrap.append(override, recalc);
                form.appendChild(formGroup('Final price', wrap, { star: true }).group);
                form.appendChild(hint);
                return;
            }

            const panel = el('div', 'quick-math');
            const heading = el('h3', null, '🧮 Quick math ');
            heading.appendChild(el('span', 'quick-math-sub', '(estimate)'));
            const breakdown = el('div', 'quick-math-breakdown');
            const total = el('div', 'quick-math-total');
            const totalValue = el('span', 'quick-math-total-value', '≈ €0');
            totalValue.id = `${uid}-math-total`;
            total.append(totalValue, el('span', 'quick-math-note', 'Final price confirmed by me after review'));
            panel.append(heading, breakdown, total);
            form.appendChild(panel);
            els.breakdown = breakdown;
            els.mathTotal = totalValue;
        }

        function buildStatus(form) {
            const select = document.createElement('select');
            select.id = `${uid}-status`;
            STATUS_OPTIONS.forEach(([value, label]) => {
                const opt = document.createElement('option');
                opt.value = value;
                opt.textContent = label;
                select.appendChild(opt);
            });
            select.value = initial.status || 'waiting-list';
            els.status = select;
            form.appendChild(formGroup('Status', select).group);
        }

        function buildTos(form) {
            const agree = el('label', 'tos-agree');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `${uid}-tos`;
            const text = el('span', null, "I've read the ");
            const link = document.createElement('a');
            link.href = '#terms';
            link.className = 'tos-link';
            link.textContent = 'Terms of Service';
            text.appendChild(link);
            text.appendChild(document.createTextNode(" and agree to them. I understand submitting doesn't guarantee acceptance."));
            text.appendChild(el('span', 'req-star', ' *'));
            agree.append(checkbox, text);
            form.appendChild(agree);
            els.tos = checkbox;
        }

        // ---- estimate + validation + submit ----

        function computeEstimate() {
            const service = findService(state.service);
            if (!service) return { total: 0, lines: [] };

            const lines = [`${service.name} × ${state.chars} — €${service.basePrice}`];
            let total = service.basePrice;

            if (state.chars > 1 && service.extraCharPrice > 0) {
                const extras = (state.chars - 1) * service.extraCharPrice;
                total += extras;
                lines.push(`+${state.chars - 1} extra character${state.chars > 2 ? 's' : ''} — +€${extras}`);
            }

            Object.values(addonsData()).forEach(addon => {
                const chosen = state.addons[addon.key];
                if (addon.perCharacter) {
                    const tier = (addon.tiers || []).find(t => t.value === chosen);
                    if (tier) {
                        const cost = tier.price * state.chars;
                        total += cost;
                        lines.push(`${addon.label} × ${state.chars} — +€${cost}`);
                    }
                } else if (chosen) {
                    total += addon.price;
                    lines.push(`${addon.label} — +€${addon.price}`);
                }
            });

            return { total, lines };
        }

        function updateEstimateUI() {
            const service = findService(state.service);

            if (els.breakdown) {
                const { total, lines } = computeEstimate();
                els.breakdown.innerHTML = '';
                lines.forEach(line => els.breakdown.appendChild(el('p', null, line)));
                if (!lines.length) {
                    els.breakdown.appendChild(el('p', 'quick-math-empty', 'No service available'));
                }
                els.mathTotal.textContent = `≈ €${total.toFixed(2)}`;
            }
            if (els.extraHint) {
                els.extraHint.textContent = service && service.extraCharPrice > 0
                    ? `Each extra character: +€${service.extraCharPrice}`
                    : '';
            }
            if (els.estimateHint) {
                els.estimateHint.textContent = `auto: ≈ €${computeEstimate().total.toFixed(2)}`;
            }
        }

        function flattenContact() {
            const email = els.email.value.trim();
            const social = els.social.value.trim();
            return [email, social && (social.includes('@') ? social : `@${social}`)].filter(Boolean).join(' · ');
        }

        function buildOptions_() {
            const opts = {};
            Object.values(addonsData()).forEach(addon => {
                const chosen = state.addons[addon.key];
                if (addon.perCharacter ? chosen : chosen === true) opts[addon.key] = chosen;
            });
            opts.chars = state.chars;
            return opts;
        }

        function validate() {
            const errors = [];
            if (!els.name.value.trim()) errors.push('Your name is required.');
            if (!els.email.value.trim() && !els.social.value.trim()) {
                errors.push('Fill at least one contact (email or Discord/Instagram).');
            }
            if (els.email.value.trim() && !/^\S+@\S+\.\S+$/.test(els.email.value.trim())) {
                errors.push("That email address doesn't look right.");
            }
            if (!state.service) errors.push('No service is available — please try again later.');
            if (requireImage && !state.images.length) errors.push('Add at least one reference image.');
            if (isPublic && !els.tos.checked) errors.push("You need to agree to the Terms of Service.");
            return errors;
        }

        function showError(messages) {
            els.error.innerHTML = '';
            messages.forEach(message => els.error.appendChild(el('p', null, `• ${message}`)));
            els.error.hidden = false;
            els.error.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        function hideError() {
            els.error.hidden = true;
            els.error.innerHTML = '';
        }

        function setButton(label, disabled) {
            const button = options.submitButton;
            if (!button) return;
            if (disabled && !button.dataset.originalLabel) {
                button.dataset.originalLabel = button.textContent;
            }
            button.textContent = disabled ? label : (button.dataset.originalLabel || 'Submit');
            if (!disabled) delete button.dataset.originalLabel;
            button.disabled = disabled;
        }

        // Downscale + re-encode large images (phone photos are huge); PNG
        // transparency is flattened onto white or it turns black as JPEG.
        async function compressImage(file) {
            if (file.size < PASS_THROUGH && /^image\/(png|jpeg|webp)$/.test(file.type)) return file;

            let source;
            try {
                source = await createImageBitmap(file, { imageOrientation: 'from-image' });
            } catch {
                source = await new Promise((resolve, reject) => {
                    const url = URL.createObjectURL(file);
                    const img = new Image();
                    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
                    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`Couldn't read ${file.name} — is it a real image?`)); };
                    img.src = url;
                });
            }

            const scale = Math.min(1, MAX_EDGE / Math.max(source.width, source.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(source.width * scale));
            canvas.height = Math.max(1, Math.round(source.height * scale));
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
            if (source.close) source.close();

            const blob = await new Promise((resolve, reject) => {
                canvas.toBlob(b => b ? resolve(b) : reject(new Error(`Couldn't process ${file.name}.`)), 'image/jpeg', 0.85);
            });
            return blob;
        }

        // Upload every staged file that isn't uploaded yet — a retry after a
        // failed insert must not create duplicate copies in the bucket.
        async function uploadStaged() {
            const pending = state.images.filter(i => i.kind === 'file' && !i.uploadedPath);
            for (let i = 0; i < pending.length; i++) {
                setButton(`Uploading ${i + 1}/${pending.length}…`, true);
                const item = pending[i];
                try {
                    const blob = await compressImage(item.file);
                    item.uploadedPath = await SupabaseClient.uploadReferenceImage(blob);
                } catch (err) {
                    throw new Error(`Couldn't upload ${item.name} — check your connection and try again. (${err.message})`);
                }
            }
        }

        function getData() {
            const data = {
                client: els.name.value.trim(),
                contact: flattenContact(),
                service: state.service,
                details: els.details.value.trim(),
                options: buildOptions_(),
                estimate: els.estimateOverride && els.estimateOverride.value !== ''
                    ? Number(els.estimateOverride.value)
                    : computeEstimate().total,
                attachments: state.images.map(item =>
                    item.kind === 'existing' ? item.path : item.uploadedPath).filter(Boolean),
                removedAttachments: [...state.removedAttachments]
            };
            if (!isPublic) data.status = els.status.value;
            if (isPublic) data.honeypot = els.honeypot.value;
            return data;
        }

        async function onSubmit_(e) {
            e.preventDefault();
            if (state.submitting) return;
            hideError();

            // bots get a fake success — no validation, no upload, no insert
            if (isPublic && els.honeypot.value) {
                await options.onSubmit({ honeypot: els.honeypot.value });
                return;
            }

            const errors = validate();
            if (errors.length) {
                showError(errors);
                return;
            }

            state.submitting = true;
            try {
                setButton('Sending…', true);
                await uploadStaged();
                await options.onSubmit(getData());
            } catch (err) {
                console.error('Form submit failed:', err);
                // host can replace technical errors with a friendlier message
                showError([options.errorMessage || (err && err.message) || 'Sending failed — try again in a minute.']);
            } finally {
                state.submitting = false;
                setButton('', false);
            }
        }

        // ---- assemble ----

        // public mode: the read-only "this is what you're ordering" box
        function renderServiceDisplay() {
            if (!els.serviceDisplay) return;
            els.serviceDisplay.innerHTML = '';
            const service = findService(state.service);
            if (!service) return;
            els.serviceDisplay.appendChild(el('span', 'service-display-name', service.name));
            els.serviceDisplay.appendChild(el('span', 'service-display-price', `from €${service.basePrice}`));
        }

        function render() {
            const form = document.createElement('form');
            form.className = 'request-form';
            form.noValidate = true;
            form.id = options.formId || `${uid}-form`;
            form.addEventListener('submit', onSubmit_);

            buildContact(form);
            buildServiceField(form);
            buildChars(form);
            buildOptions(form);
            buildImages(form);
            buildDetails(form);
            buildEstimate(form);
            if (!isPublic) buildStatus(form);
            if (isPublic) buildTos(form);

            const errorBox = el('div', 'form-error');
            errorBox.id = `${uid}-error`;
            errorBox.hidden = true;
            form.appendChild(errorBox);
            els.error = errorBox;

            container.innerHTML = '';
            container.appendChild(form);
            els.form = form;

            renderServiceDisplay();
            updateEstimateUI();
        }

        render();

        // ---- handle ----
        return {
            formId: options.formId || `${uid}-form`,
            getData,
            validate,
            // public mode: point the read-only display at a service picked
            // from the site's service cards; returns false if unknown
            setService(name) {
                if (!findService(name)) return false;
                state.service = name;
                if (els.serviceSelect) els.serviceSelect.value = name;
                renderServiceDisplay();
                updateEstimateUI();
                return true;
            },
            focus() {
                setTimeout(() => {
                    if (els.name && !els.form.hidden) els.name.focus({ preventScroll: true });
                }, 100);
            },
            destroy() {
                state.images.forEach(item => {
                    if (item.kind === 'file' && item.previewUrl) URL.revokeObjectURL(item.previewUrl);
                });
                container.innerHTML = '';
            }
        };
    }

    return { mount };
})();
