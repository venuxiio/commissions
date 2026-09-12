// Supabase REST wrapper for the commission site (no SDK — plain fetch).
// The database stores COMMISSION REQUESTS ONLY. Services, prices and the
// open/closed settings live in commissions.js and are hand-edited there.
// Public site: submit requests + upload reference images (anon key).
// Admin board: full CRUD on commissions + reading those images back
// (service_role key, pasted into admin.html).
//
// Keys (see js/config.js + SUPABASE_SETUP.md):
//   anon         — public, in config.js. Enforced by Row Level Security:
//                  insert commissions rows with status='request' and
//                  paid=false only, plus upload into the private
//                  'commission-refs' storage bucket. No reads, no updates,
//                  no deletes.
//   service_role — private, pasted into admin.html. Bypasses RLS: full
//                  control of the commissions table + bucket.

const SupabaseClient = (() => {
    const isConfigured = () => Boolean(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey);

    // REST helper. key = anon or the admin's service_role key.
    async function request(path, { method = 'GET', key = CONFIG.supabaseAnonKey, body, query, returning = 'minimal' } = {}) {
        const url = new URL(`${CONFIG.supabaseUrl}/rest/v1/${path}`);
        if (query) Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));

        const headers = {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
        };
        if (body) headers['Prefer'] = `return=${returning}`;

        const res = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });
        if (!res.ok) {
            let detail = '';
            try { detail = (await res.json()).message || ''; } catch { /* ignore */ }
            throw new Error(`Supabase ${res.status}${detail ? ': ' + detail : ''}`);
        }
        if (method === 'GET' || (body && returning !== 'minimal')) return res.json();
        return null;
    }

    // ---- Normalizers: DB columns → the shapes the site's renderers expect ----

    function normalizeCommission(r) {
        // DB status → legacy status keys used by the admin board renderer
        const statusMap = {
            'request': 'request',
            'waiting': 'waiting-list',
            'in_progress': 'in-progress',
            'finished': 'finished'
        };
        return {
            recordId: r.id,
            id: r.id,
            status: statusMap[r.status] || 'waiting-list',
            title: r.service || '',
            description: r.client || '',
            contact: r.contact || '',
            details: r.details || '',
            refs: r.refs || '',
            attachments: Array.isArray(r.attachments) ? r.attachments : [],
            options: r.options || {},
            estimate: r.estimate != null ? Number(r.estimate) : null,
            paid: Boolean(r.paid),
            sortOrder: r.sort_order != null ? Number(r.sort_order) : null,
            created: r.created_at || ''
        };
    }

    // ---- Reference image storage (private 'commission-refs' bucket) ----
    // Rows store only the paths; the public form uploads with the anon key
    // (insert-only policy), the admin board reads previews with service_role.

    const REF_BUCKET = 'commission-refs';

    // Storage objects aren't JSON — separate from request(). key = anon or
    // the admin's service_role key.
    async function storageRequest(objectPath, { method = 'GET', key = CONFIG.supabaseAnonKey, body, contentType } = {}) {
        const res = await fetch(`${CONFIG.supabaseUrl}/storage/v1/object/${REF_BUCKET}/${objectPath}`, {
            method,
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`,
                ...(contentType ? { 'Content-Type': contentType } : {})
            },
            body
        });
        if (!res.ok) {
            let detail = '';
            try { detail = (await res.text()).slice(0, 160); } catch { /* ignore */ }
            throw new Error(`Storage ${res.status}${detail ? ': ' + detail : ''}`);
        }
        return res;
    }

    function randomId() {
        if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    }

    // Upload one (already compressed) image, return its storage path.
    async function uploadReferenceImage(blob, key = CONFIG.supabaseAnonKey) {
        const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
        const path = `refs/${randomId()}.${ext}`;
        await storageRequest(path, { method: 'POST', key, body: blob, contentType: blob.type || 'image/jpeg' });
        return path;
    }

    // path → object URL cache so board re-renders don't refetch the same
    // image (and so a URL another card still displays never gets revoked
    // mid-render). Revoke only via dropAttachmentUrl.
    const blobUrlCache = new Map();

    async function getAttachmentUrl(key, path) {
        if (blobUrlCache.has(path)) return blobUrlCache.get(path);
        const res = await storageRequest(path, { key });
        const url = URL.createObjectURL(await res.blob());
        blobUrlCache.set(path, url);
        return url;
    }

    function dropAttachmentUrl(path) {
        const url = blobUrlCache.get(path);
        if (url) {
            URL.revokeObjectURL(url);
            blobUrlCache.delete(path);
        }
    }

    async function adminDeleteAttachment(key, path) {
        await storageRequest(path, { method: 'DELETE', key });
        dropAttachmentUrl(path);
    }

    // ---- Public API (anon key) ----

    // Submit a request-form payload as a new commissions row (status: request).
    // The DB policy rejects anything else — even a crafted request can't
    // create a 'waiting' row or mark itself paid.
    // Throws on failure so the form can show an error instead of pretending.
    async function submitRequest(payload) {
        if (!isConfigured()) {
            throw new Error('Request form is not configured yet.');
        }
        const row = {
            client: payload.client,
            contact: payload.contact,
            service: payload.service,
            details: payload.details,
            attachments: payload.attachments || [],
            options: payload.options || {},
            estimate: payload.estimate,
            status: 'request',
            paid: false
        };
        // legacy link references — the form no longer collects them, but an
        // admin flow may still pass some (column is `not null default ''`,
        // so omitting it entirely is fine too)
        if (payload.refs) row.refs = payload.refs;

        await request('commissions', {
        method: 'POST',
        body: row,
        returning: 'minimal'
        });

        return true;
    }

    // ---- Admin-only helpers (service_role key passed in, never stored here) ----

    async function adminGetCommissions(key) {
        const rows = await request('commissions', { key, query: { select: '*', order: 'id.asc' } });
        return rows.map(normalizeCommission);
    }

    const STATUS_TO_DB = {
        'request': 'request',
        'waiting-list': 'waiting',
        'in-progress': 'in_progress',
        'finished': 'finished'
    };

    async function adminUpdateCommission(key, id, fields) {
        const patch = {};
        if (fields.status) patch.status = STATUS_TO_DB[fields.status];
        if (fields.paid !== undefined) patch.paid = fields.paid;
        if (fields.client !== undefined) patch.client = fields.client;
        if (fields.service !== undefined) patch.service = fields.service;
        if (fields.contact !== undefined) patch.contact = fields.contact;
        if (fields.details !== undefined) patch.details = fields.details;
        if (fields.estimate !== undefined) patch.estimate = fields.estimate;
        if (fields.options !== undefined) patch.options = fields.options;
        if (fields.attachments !== undefined) patch.attachments = fields.attachments;
        if (fields.sortOrder !== undefined) patch.sort_order = fields.sortOrder;
        const rows = await request(`commissions?id=eq.${id}`, { method: 'PATCH', key, body: patch});
        return rows && rows.length ? normalizeCommission(rows[0]) : null;
    }

    async function adminDeleteCommission(key, id) {
        await request(`commissions?id=eq.${id}`, { method: 'DELETE', key });
    }

    async function adminCreateCommission(key, fields) {
        const row = {
            client: fields.client || '',
            service: fields.service || '',
            contact: fields.contact || '',
            details: fields.details || '',
            options: fields.options || {},
            attachments: fields.attachments || [],
            estimate: fields.estimate ?? null,
            status: STATUS_TO_DB[fields.status] || 'waiting',
            paid: Boolean(fields.paid)
        };
        // returning: 'representation' — the caller wants the created row back
        const rows = await request('commissions', { method: 'POST', key, body: row, returning: 'representation' });
        return rows && rows.length ? normalizeCommission(rows[0]) : null;
    }

    async function validateKey(key) {
        if (!CONFIG.supabaseUrl || !key) return false;
        try {
            // service_role reads the base commissions table directly;
            // the anon key would be rejected by RLS here — so this doubles
            // as an "is this the admin key" check.
            await request('commissions', {
                key, query: { select: 'id', limit: '1' }
            });
            return true;
        } catch {
            return false;
        }
    }

    return {
        isConfigured,
        submitRequest,
        uploadReferenceImage,
        getAttachmentUrl,
        dropAttachmentUrl,
        adminDeleteAttachment,
        adminGetCommissions,
        adminUpdateCommission,
        adminDeleteCommission,
        adminCreateCommission,
        validateKey
    };
})();
