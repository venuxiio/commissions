// Supabase REST wrapper for the commission site (no SDK — plain fetch).
// The database stores COMMISSION REQUESTS ONLY. Services, prices and the
// open/closed settings live in commissions.js and are hand-edited there.
// Public site: submit requests (anon key). Admin board: full CRUD on
// commissions (service_role key, pasted into admin.html).
//
// Keys (see js/config.js + SUPABASE_SETUP.md):
//   anon         — public, in config.js. Enforced by Row Level Security:
//                  insert commissions rows with status='request' and
//                  paid=false only. No reads, no updates, no deletes.
//   service_role — private, pasted into admin.html. Bypasses RLS: full
//                  control of the commissions table.

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
            options: r.options || {},
            estimate: r.estimate != null ? Number(r.estimate) : null,
            paid: Boolean(r.paid),
            sortOrder: r.sort_order != null ? Number(r.sort_order) : null,
            created: r.created_at || ''
        };
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
            refs: payload.refs,
            options: payload.options || {},
            estimate: payload.estimate,
            status: 'request',
            paid: false
        };

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
            status: STATUS_TO_DB[fields.status] || 'waiting',
            paid: Boolean(fields.paid)
        };
        const rows = await request('commissions', { method: 'POST', key, body: row });
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
        adminGetCommissions,
        adminUpdateCommission,
        adminDeleteCommission,
        adminCreateCommission,
        validateKey
    };
})();
