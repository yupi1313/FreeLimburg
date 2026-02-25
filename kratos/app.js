// ── Kratos CS2 Match Viewer ──────────────────────────
// Hybrid mode: static JSON for historical data + live tunnel for real-time

const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const STATIC_API = isDev ? 'http://localhost:3000/api' : '/kratos/api';
let LIVE_API = null; // Will be loaded from config.json

// Headers for localtunnel bypass
const TUNNEL_HEADERS = { 'Bypass-Tunnel-Reminder': 'true' };

// ── State ───────────────────────────────────────────
let matches = [];
let currentMatch = null;
let currentMapNumber = null;
let currentEvents = [];
let activeFilter = 'all';

// ── DOM References ──────────────────────────────────
const listView = document.getElementById('list-view');
const detailView = document.getElementById('detail-view');
const matchGrid = document.getElementById('match-grid');
const matchCountEl = document.getElementById('match-count');

// ── Init ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);

async function init() {
    // 1. Load config for live API URL
    try {
        const cfgRes = await fetch('/kratos/config.json');
        const cfg = await cfgRes.json();
        if (cfg.liveApiUrl) LIVE_API = cfg.liveApiUrl;
    } catch (e) {
        console.warn('[Config] No config.json found, live mode disabled');
    }

    // In dev mode, always use the local server as live
    if (isDev) LIVE_API = 'http://localhost:3000/api';

    // 2. Load matches (try live first, fall back to static)
    try {
        let loadedMatches = [];

        // Try live API first
        if (LIVE_API) {
            try {
                const liveRes = await fetch(`${LIVE_API}/matches`, {
                    signal: AbortSignal.timeout(5000),
                    headers: TUNNEL_HEADERS
                });
                if (liveRes.ok) {
                    loadedMatches = await liveRes.json();
                    console.log(`[Live] Loaded ${loadedMatches.length} matches from live API`);
                }
            } catch (e) {
                console.warn('[Live] Live API unavailable, falling back to static');
            }
        }

        // Also load static data for finished matches that may not be in live DB anymore
        if (!isDev) {
            try {
                const staticRes = await fetch(`${STATIC_API}/matches.json`);
                if (staticRes.ok) {
                    const staticMatches = await staticRes.json();
                    // Merge: live takes priority, append static ones not in live
                    const liveIds = new Set(loadedMatches.map(m => String(m.id)));
                    for (const sm of staticMatches) {
                        if (!liveIds.has(String(sm.id))) {
                            loadedMatches.push(sm);
                        }
                    }
                    console.log(`[Static] Merged static data, total: ${loadedMatches.length} matches`);
                }
            } catch (e) {
                console.warn('[Static] Failed to load static matches');
            }
        }

        matches = loadedMatches;
        renderMatchList();
    } catch (err) {
        matchGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <p>⚠️ Failed to load matches.</p>
            </div>`;
        console.error('Failed to load matches:', err);
    }
}

// ── Match List ──────────────────────────────────────
function renderMatchList() {
    matchCountEl.textContent = `${matches.length} matches`;

    if (matches.length === 0) {
        matchGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <p>No matches recorded yet</p>
            </div>`;
        return;
    }

    matchGrid.innerHTML = matches.map(m => {
        const isLive = m.status?.toLowerCase() === 'live';
        const statusHtml = isLive
            ? `<div class="live-indicator"><span class="live-dot"></span><span>LIVE</span></div>`
            : `<span>FINISHED</span>`;

        return `
        <div class="match-card" data-id="${m.id}" onclick="openMatch('${m.id}')">
            <div class="match-card__tournament">
                <span class="tournament-badge-status ${isLive ? 'status-live' : 'status-finished'}">${statusHtml}</span>
            </div>
            <div class="match-card__teams">
                <div class="team">
                    <span class="team__name">${escHtml(m.team1 || 'Team 1')}</span>
                </div>
                <div class="score-block">
                    <span class="score-sep" style="font-size: 14px;">VS</span>
                </div>
                <div class="team">
                    <span class="team__name">${escHtml(m.team2 || 'Team 2')}</span>
                </div>
            </div>
            <div class="match-card__footer">
                <span class="event-count" style="font-size: 11px;">ID: ${m.id}</span>
                <div class="map-pills"></div>
            </div>
        </div>`;
    }).join('');
}

// ── Open Match Detail ───────────────────────────────
async function openMatch(id) {
    listView.style.display = 'none';
    detailView.classList.add('active');

    detailView.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading match data...</p>
        </div>`;

    try {
        let matchData = null;
        let eventsData = [];

        // Try live API first (for real-time data)
        if (LIVE_API) {
            try {
                const [matchRes, eventsRes] = await Promise.all([
                    fetch(`${LIVE_API}/matches/${id}`, { signal: AbortSignal.timeout(5000), headers: TUNNEL_HEADERS }),
                    fetch(`${LIVE_API}/matches/${id}/events`, { signal: AbortSignal.timeout(5000), headers: TUNNEL_HEADERS })
                ]);
                if (matchRes.ok) matchData = await matchRes.json();
                if (eventsRes.ok) eventsData = await eventsRes.json();
                if (matchData) console.log(`[Live] Loaded match ${id} with ${eventsData.length} events`);
            } catch (e) {
                console.warn(`[Live] Failed to fetch match ${id} from live API`);
            }
        }

        // Fall back to static if live failed
        if (!matchData && !isDev) {
            try {
                const [matchRes, eventsRes] = await Promise.all([
                    fetch(`${STATIC_API}/matches/${id}.json`),
                    fetch(`${STATIC_API}/matches/${id}_events.json`)
                ]);
                if (matchRes.ok) matchData = await matchRes.json();
                if (eventsRes.ok) eventsData = await eventsRes.json();
                console.log(`[Static] Loaded match ${id} from static files`);
            } catch (e) {
                console.warn(`[Static] Failed to fetch match ${id} from static files`);
            }
        }

        if (!matchData) throw new Error('Match not found');

        currentMatch = matchData;
        currentEvents = eventsData;

        // Find available map numbers
        const maps = [...new Set(currentEvents.map(e => e.mapNumber))].sort((a, b) => a - b);
        if (maps.length > 0) {
            currentMapNumber = maps[0];
        } else {
            currentMapNumber = null;
        }

        activeFilter = 'all';
        renderDetail();
    } catch (err) {
        detailView.innerHTML = `
            <button class="back-btn" onclick="goBack()">← Back to matches</button>
            <div class="empty-state">
                <p>⚠️ Failed to load match data</p>
            </div>`;
        console.error('Failed to load match:', err);
    }
}

function goBack() {
    detailView.classList.remove('active');
    listView.style.display = 'block';
    currentMatch = null;
    currentEvents = [];
}

// ── Render Detail ───────────────────────────────────
function renderDetail() {
    const m = currentMatch;

    // Available maps
    const maps = [...new Set(currentEvents.map(e => e.mapNumber))].sort((a, b) => a - b);

    // Filter events for current map
    const mapEvents = currentMapNumber !== null
        ? currentEvents.filter(e => e.mapNumber === currentMapNumber)
        : currentEvents;

    // Apply type filter
    const filteredEvents = activeFilter === 'all'
        ? mapEvents
        : mapEvents.filter(e => e.eventType === activeFilter);

    // Compute stats
    const kills = mapEvents.filter(e => e.eventType === 'kill');
    const headshots = kills.filter(e => e.isHeadshot);
    const maxRound = mapEvents.reduce((max, e) => Math.max(max, e.roundNumber || 0), 0);

    // Event type counts for filter buttons
    const typeCounts = {};
    mapEvents.forEach(e => {
        typeCounts[e.eventType] = (typeCounts[e.eventType] || 0) + 1;
    });

    const isLive = m.status?.toLowerCase() === 'live';
    const statusHtml = isLive
        ? `<div class="live-indicator"><span class="live-dot"></span><span>LIVE</span></div>`
        : `<span>FINISHED</span>`;

    detailView.innerHTML = `
        <button class="back-btn" onclick="goBack()">← Back to matches</button>

        <div class="detail-header">
            <div class="detail-header__top">
                <span class="tournament-badge-status ${isLive ? 'status-live' : 'status-finished'}">${statusHtml}</span>
            </div>
            <div class="detail-teams">
                <div class="detail-team">
                    <div class="detail-team__name">${escHtml(m.team1 || 'Team 1')}</div>
                </div>
                <div class="detail-score">
                    <span class="detail-score__sep" style="font-size: 24px;">VS</span>
                </div>
                <div class="detail-team">
                    <div class="detail-team__name">${escHtml(m.team2 || 'Team 2')}</div>
                </div>
            </div>
        </div>

        ${maps.length > 0 ? `
        <div class="map-tabs" id="map-tabs">
            ${maps.map(mapNum => `
                <button class="map-tab ${mapNum === currentMapNumber ? 'active' : ''}"
                        onclick="switchMap(${mapNum})">
                    <span class="map-tab__name">Map ${mapNum}</span>
                </button>
            `).join('')}
            <button class="map-tab ${currentMapNumber === null ? 'active' : ''}"
                    onclick="switchMap(null)">
                <span class="map-tab__name">All Maps</span>
            </button>
        </div>
        ` : ''}

        <div class="stats-summary">
            <div class="stat-card stat-card--kills">
                <div class="stat-card__value">${kills.length}</div>
                <div class="stat-card__label">Kills</div>
            </div>
            <div class="stat-card stat-card--hs">
                <div class="stat-card__value">${headshots.length}</div>
                <div class="stat-card__label">Headshots</div>
            </div>
            <div class="stat-card stat-card--rounds">
                <div class="stat-card__value">${maxRound}</div>
                <div class="stat-card__label">Rounds Played</div>
            </div>
            <div class="stat-card">
                <div class="stat-card__value">${kills.length > 0 ? Math.round(headshots.length / kills.length * 100) : 0}%</div>
                <div class="stat-card__label">HS Rate</div>
            </div>
        </div>

        <div class="events-panel">
            <div class="events-toolbar">
                <span class="events-toolbar__title">Event Log</span>
                <span class="events-toolbar__count">${filteredEvents.length} events</span>
            </div>
            <div class="events-filter">
                <button class="filter-btn ${activeFilter === 'all' ? 'active' : ''}" onclick="setFilter('all')">All (${mapEvents.length})</button>
                ${Object.entries(typeCounts).map(([type, count]) => `
                    <button class="filter-btn ${activeFilter === type ? 'active' : ''}" onclick="setFilter('${type}')">${formatEventType(type)} (${count})</button>
                `).join('')}
            </div>
            <div class="events-table-wrap">
                <table class="events-table">
                    <thead>
                        <tr>
                            <th class="col-round">Round</th>
                            <th>Type</th>
                            <th>Player</th>
                            <th>Target</th>
                            <th class="col-weapon">Weapon</th>
                            <th>Mods</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${renderEventsRows(filteredEvents)}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function switchMap(mapNum) {
    currentMapNumber = mapNum;
    activeFilter = 'all';
    renderDetail();
}

function setFilter(filter) {
    activeFilter = filter;
    renderDetail();
}

// ── Event Rows ──────────────────────────────────────
function renderEventsRows(events) {
    if (events.length === 0) {
        return `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">No events</td></tr>`;
    }

    let html = '';
    let lastRound = -1;

    // Reverse since events arrive newest-first from the API
    const sorted = [...events].reverse();

    for (const ev of sorted) {
        const round = ev.roundNumber || 0;

        // Round separator
        if (round !== lastRound && round > 0) {
            html += `<tr class="round-row"><td colspan="6">Round ${round}</td></tr>`;
            lastRound = round;
        }

        let actorName = ev.killerName || '';
        let targetName = ev.victimName || '';
        let weaponName = ev.weapon || '';

        // If it's a non-kill event, the scraper sometimes puts data in logText
        if (!actorName && !targetName && !weaponName && ev.logText) {
            weaponName = ev.logText;
        }

        if (!actorName) actorName = '—';
        if (!targetName) targetName = '—';
        if (!weaponName) weaponName = '—';

        const mods = [];
        if (ev.isHeadshot) mods.push('<span class="mod-icon mod-icon--hs" title="Headshot">HS</span>');
        if (ev.isWallbang) mods.push('<span class="mod-icon mod-icon--wb" title="Wallbang">WB</span>');
        if (ev.isThroughSmoke) mods.push('<span class="mod-icon mod-icon--smoke" title="Through smoke">S</span>');
        if (ev.isNoScope) mods.push('<span class="mod-icon mod-icon--noscope" title="No scope">NS</span>');
        if (ev.isBlindKill) mods.push('<span class="mod-icon mod-icon--flash" title="Blind Kill">F</span>');

        html += `
        <tr>
            <td class="col-round" style="font-family:var(--font-mono);color:var(--text-muted)">${round || '—'}</td>
            <td><span class="event-badge event-badge--${ev.eventType}">${formatEventType(ev.eventType)}</span></td>
            <td><span class="player-name player-name--actor">${escHtml(actorName)}</span></td>
            <td><span class="player-name player-name--target">${escHtml(targetName)}</span></td>
            <td class="col-weapon"><span class="weapon-name">${escHtml(weaponName)}</span></td>
            <td><div class="modifiers">${mods.join('')}</div></td>
        </tr>`;
    }

    return html;
}

// ── Helpers ─────────────────────────────────────────
function formatEventType(type) {
    const map = {
        'kill': 'Kill',
        'suicide': 'Suicide',
        'bomb_plant': 'Plant',
        'bomb_defuse': 'Defuse',
        'round_start': 'Round Start',
        'round_end': 'Round End'
    };
    return map[type] || type;
}

function escHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
