// Supabase REST wrapper for the commission site (no SDK — plain fetch).
// Public site: read services/settings + submit requests (anon key).
// When Supabase is unreachable or not configured, callers fall back to
// seedData (bundled in commissions.js) so the site never renders empty.
//
// Keys (see js/config.js + SUPABASE_SETUP.md):
//   anon         — public, in config.js. Enforced by Row Level Security:
//                  read services (active) / settings; insert commissions
//                  rows with status='request' only. No commission reads.
//   service_role — private, pasted into admin.html. Bypasses RLS: full
//                  control of all tables.

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

    function normalizeService(r) {
        return {
            name: r.name || '',
            basePrice: Number(r.base_price) || 0,
            extraCharPrice: Number(r.extra_char_price) || 0,
            description: r.description || '',
            image: r.image || '',
            active: r.active !== false
        };
    }

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
            estimate: r.estimate != null ? Number(r.estimate) : null,
            paid: Boolean(r.paid),
            sortOrder: r.sort_order != null ? Number(r.sort_order) : null,
            created: r.created_at || ''
        };
    }

    function normalizeSettings(r) {
        return {
            commsOpen: Boolean(r.comms_open),
            reopenDate: r.reopen_date || null,
            maxSlots: Number(r.max_slots) || 8,
            artTradesOpen: Boolean(r.art_trades_open),
            requestsOpen: Boolean(r.requests_open),
            announcement: r.announcement || ''
        };
    }

    // ---- Public API (anon key) — getters resolve to null when unavailable
    //      so callers fall back to seed data instead of crashing ----

    async function getServices() {
        if (!isConfigured()) return null;
        try {
            const rows = await request('services', {
                query: { select: '*', order: 'sort.asc' }
            });
            return rows.map(normalizeService).filter(s => s.active);
        } catch (err) {
            console.warn('Supabase unavailable, using seed services:', err.message);
            return null;
        }
    }

    async function getSettings() {
        if (!isConfigured()) return null;
        try {
            const rows = await request('settings', { query: { select: '*', id: 'eq.1' } });
            return rows.length ? normalizeSettings(rows[0]) : null;
        } catch (err) {
            console.warn('Supabase unavailable, using seed settings:', err.message);
            return null;
        }
    }

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

    async function adminGetAll(key) {
        const [services, commissions, settings] = await Promise.all([
            request('services', { key, query: { select: '*', order: 'sort.asc' } }),
            request('commissions', { key, query: { select: '*', order: 'id.asc' } }),
            request('settings', { key, query: { select: '*', id: 'eq.1' } })
        ]);
        return {
            services: services.map(normalizeService),
            commissions: commissions.map(normalizeCommission),
            settings: settings.length ? normalizeSettings(settings[0]) : null
        };
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

    async function adminUpdateSettings(key, settings) {
        const patch = {};
        if (settings.commsOpen !== undefined) patch.comms_open = settings.commsOpen;
        if (settings.reopenDate !== undefined) patch.reopen_date = settings.reopenDate || null;
        if (settings.maxSlots !== undefined) patch.max_slots = settings.maxSlots;
        if (settings.artTradesOpen !== undefined) patch.art_trades_open = settings.artTradesOpen;
        if (settings.requestsOpen !== undefined) patch.requests_open = settings.requestsOpen;
        if (settings.announcement !== undefined) patch.announcement = settings.announcement;
        const rows = await request('settings?id=eq.1', { method: 'PATCH', key, body: patch });
        return rows && rows.length ? normalizeSettings(rows[0]) : null;
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
        getServices,
        getSettings,
        submitRequest,
        adminGetAll,
        adminUpdateCommission,
        adminDeleteCommission,
        adminCreateCommission,
        adminUpdateSettings,
        validateKey
    };
})();
