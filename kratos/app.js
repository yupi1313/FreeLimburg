// ── Kratos CS2 Match Viewer ──────────────────────────
const API_BASE = 'http://localhost:3000/api';

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
    try {
        const res = await fetch(`${API_BASE}/matches`);
        matches = await res.json();
        renderMatchList();
    } catch (err) {
        matchGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <p>⚠️ Failed to load matches. Make sure the API server is running on port 3000.</p>
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
        const [matchRes, eventsRes] = await Promise.all([
            fetch(`${API_BASE}/matches/${id}`),
            fetch(`${API_BASE}/matches/${id}/events`)
        ]);

        currentMatch = await matchRes.json();
        currentEvents = await eventsRes.json();

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

    // Events usually arrive from DB desc (newest first). Let's sort them ascending by timestamp for the log
    // The scraper might just use timestamp of scraping. We have roundNumber.
    // Let's sort by round ascending, then ID or something to keep order.
    // We'll reverse the array since Prisma orderBy: { timestamp: 'desc' }
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
