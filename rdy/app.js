// ── RDY CS2 Dashboard ────────────────────────────────────
// Loads match data from static JSON (exported by Kratos)

const API_BASE = '/kratos/api';
let matches = [];
let allEvents = {};  // matchId -> events[]
let currentView = 'overview';

// ── Init ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);

async function init() {
    // Set up nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => switchView(tab.dataset.view));
    });

    // Close detail on overlay click
    document.getElementById('match-detail').addEventListener('click', e => {
        if (e.target === e.currentTarget) closeDetail();
    });

    // Load data
    try {
        const res = await fetch(`${API_BASE}/matches.json`);
        if (res.ok) {
            matches = await res.json();
            console.log(`[RDY] Loaded ${matches.length} matches`);
        }
    } catch (e) {
        console.warn('[RDY] Failed to load matches:', e);
    }

    render();
}

// ── View Switching ───────────────────────────────────────
function switchView(view) {
    currentView = view;
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.view === view));
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === `view-${view}`));
    render();
}

// ── Render ───────────────────────────────────────────────
function render() {
    const live = matches.filter(m => m.status === 'Live');
    const finished = matches.filter(m => m.status === 'Finished');

    // Update live count in header
    document.getElementById('live-count').textContent = `${live.length} live`;

    if (currentView === 'overview') renderOverview(live, finished);
    else if (currentView === 'matches') renderAllLive(live);
    else if (currentView === 'results') renderAllResults(finished);
}

// ── Overview ─────────────────────────────────────────────
function renderOverview(live, finished) {
    // Hero stats
    document.getElementById('stat-live').textContent = live.length;

    // Compute aggregate stats from match-level data
    let totalKills = 0, totalHS = 0, totalRounds = 0;
    for (const m of matches) {
        const mapScores = m.mapScores || [];
        for (const ms of mapScores) {
            totalRounds += (ms.score1 || 0) + (ms.score2 || 0);
        }
    }

    // We don't have per-event aggregates at overview level, so show what we can
    document.getElementById('stat-total-kills').textContent = '—';
    document.getElementById('stat-hs-rate').textContent = '—';
    document.getElementById('stat-rounds').textContent = totalRounds || '—';

    // Live grid (show first 6)
    const liveGrid = document.getElementById('live-grid');
    if (live.length === 0) {
        liveGrid.innerHTML = '<div class="empty-state">No live matches right now</div>';
    } else {
        liveGrid.innerHTML = live.slice(0, 6).map(m => matchCard(m)).join('');
    }

    // Results grid (show first 6)
    const resultsGrid = document.getElementById('results-grid');
    if (finished.length === 0) {
        resultsGrid.innerHTML = '<div class="empty-state">No finished matches yet</div>';
    } else {
        resultsGrid.innerHTML = finished.slice(0, 6).map(m => matchCard(m)).join('');
    }

    // Weapon stats — load lazily from all events
    loadWeaponStats();
}

function renderAllLive(live) {
    const grid = document.getElementById('all-live-grid');
    if (live.length === 0) {
        grid.innerHTML = '<div class="empty-state">No live matches right now</div>';
    } else {
        grid.innerHTML = live.map(m => matchCard(m)).join('');
    }
}

function renderAllResults(finished) {
    const grid = document.getElementById('all-results-grid');
    if (finished.length === 0) {
        grid.innerHTML = '<div class="empty-state">No finished matches yet</div>';
    } else {
        grid.innerHTML = finished.map(m => matchCard(m)).join('');
    }
}

// ── Match Card ───────────────────────────────────────────
function matchCard(m) {
    const isLive = m.status === 'Live';
    const mapScores = m.mapScores || [];
    const s1 = m.seriesScore1 ?? 0;
    const s2 = m.seriesScore2 ?? 0;
    const hasScore = mapScores.length > 0 && mapScores.some(ms => ms.score1 > 0 || ms.score2 > 0);

    const statusHtml = isLive
        ? `<span class="match-status match-status--live"><span class="pulse-dot"></span>LIVE</span>`
        : `<span class="match-status match-status--finished">FINISHED</span>`;

    const scoreHtml = hasScore
        ? `<span class="mc-score__num">${s1}</span><span class="mc-score__sep">:</span><span class="mc-score__num">${s2}</span>`
        : `<span class="mc-score__sep" style="font-size:14px">VS</span>`;

    const mapPills = mapScores.map(ms => {
        const winClass = ms.mapWinner === 'team1' ? ' map-pill--win1' : ms.mapWinner === 'team2' ? ' map-pill--win2' : '';
        return `<span class="map-pill${winClass}">M${ms.map}: ${ms.score1}-${ms.score2}</span>`;
    }).join('');

    return `
    <div class="match-card ${isLive ? 'match-card--live' : ''}" onclick="openDetail('${m.id}')">
        <div class="match-card__top">
            ${statusHtml}
        </div>
        <div class="match-card__teams">
            <div class="mc-team"><span class="mc-team__name">${esc(m.team1 || 'TBD')}</span></div>
            <div class="mc-score ${!hasScore ? 'mc-score--vs' : ''}">${scoreHtml}</div>
            <div class="mc-team"><span class="mc-team__name">${esc(m.team2 || 'TBD')}</span></div>
        </div>
        <div class="match-card__maps">${mapPills || '<span class="map-pill">No maps</span>'}</div>
    </div>`;
}

// ── Detail View ──────────────────────────────────────────
async function openDetail(matchId) {
    const overlay = document.getElementById('match-detail');
    const panel = document.getElementById('detail-panel');
    overlay.classList.add('active');

    panel.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Loading match data...</p></div>';

    const m = matches.find(x => String(x.id) === String(matchId));
    if (!m) {
        panel.innerHTML = '<p style="color:var(--text-muted)">Match not found</p>';
        return;
    }

    // Load events
    let events = [];
    try {
        const res = await fetch(`${API_BASE}/matches/${matchId}_events.json`);
        if (res.ok) events = await res.json();
    } catch (e) {
        console.warn('Failed to load events:', e);
    }

    // Cache for weapon stats
    allEvents[matchId] = events;

    const isLive = m.status === 'Live';
    const mapScores = m.mapScores || [];
    const s1 = m.seriesScore1 ?? 0;
    const s2 = m.seriesScore2 ?? 0;
    const hasScore = mapScores.length > 0 && mapScores.some(ms => ms.score1 > 0 || ms.score2 > 0);

    const kills = events.filter(e => e.eventType === 'kill');
    const headshots = kills.filter(e => e.isHeadshot);
    const maxRound = events.reduce((max, e) => Math.max(max, e.roundNumber || 0), 0);
    const hsRate = kills.length > 0 ? Math.round(headshots.length / kills.length * 100) : 0;

    const scoreHtml = hasScore
        ? `<span class="mc-score__num">${s1}</span><span class="mc-score__sep">:</span><span class="mc-score__num">${s2}</span>`
        : `<span class="mc-score__sep">VS</span>`;

    const mapPills = mapScores.map(ms => {
        const winClass = ms.mapWinner === 'team1' ? ' map-pill--win1' : ms.mapWinner === 'team2' ? ' map-pill--win2' : '';
        return `<span class="map-pill${winClass}">M${ms.map}: ${ms.score1}-${ms.score2}</span>`;
    }).join('');

    // Event type counts
    const typeCounts = {};
    events.forEach(e => { typeCounts[e.eventType] = (typeCounts[e.eventType] || 0) + 1; });

    const filterButtons = [
        `<button class="filter-btn active" onclick="filterEvents('${matchId}','all',this)">All (${events.length})</button>`,
        ...Object.entries(typeCounts).map(([type, count]) =>
            `<button class="filter-btn" onclick="filterEvents('${matchId}','${type}',this)">${formatType(type)} (${count})</button>`
        )
    ].join('');

    panel.innerHTML = `
        <button class="detail-close" onclick="closeDetail()">← Back</button>
        <div class="detail-header">
            <span class="match-status ${isLive ? 'match-status--live' : 'match-status--finished'}">
                ${isLive ? '<span class="pulse-dot"></span>LIVE' : 'FINISHED'}
            </span>
            <div class="detail-teams">
                <div class="detail-team__name">${esc(m.team1)}</div>
                <div class="detail-score">${scoreHtml}</div>
                <div class="detail-team__name">${esc(m.team2)}</div>
            </div>
            <div class="detail-maps">${mapPills}</div>
        </div>

        <div class="detail-stat-bar">
            <div class="detail-stat">
                <div class="detail-stat__value">${kills.length}</div>
                <div class="detail-stat__label">Kills</div>
            </div>
            <div class="detail-stat">
                <div class="detail-stat__value">${headshots.length}</div>
                <div class="detail-stat__label">Headshots</div>
            </div>
            <div class="detail-stat">
                <div class="detail-stat__value">${maxRound}</div>
                <div class="detail-stat__label">Rounds</div>
            </div>
            <div class="detail-stat">
                <div class="detail-stat__value">${hsRate}%</div>
                <div class="detail-stat__label">HS Rate</div>
            </div>
        </div>

        <div class="events-section">
            <div class="events-section__title">
                <span>Event Log</span>
                <span class="events-count">${events.length} events</span>
            </div>
            <div class="filter-bar">${filterButtons}</div>
            <div class="events-wrap">
                <table class="ev-table">
                    <thead>
                        <tr>
                            <th>Rnd</th>
                            <th>Type</th>
                            <th>Player</th>
                            <th>Target</th>
                            <th>Weapon</th>
                            <th>Mods</th>
                        </tr>
                    </thead>
                    <tbody id="ev-tbody">
                        ${renderEventRows(events)}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function closeDetail() {
    document.getElementById('match-detail').classList.remove('active');
}

// ── Filter Events ────────────────────────────────────────
function filterEvents(matchId, filter, btn) {
    // Update active button
    btn.closest('.filter-bar').querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const events = allEvents[matchId] || [];
    const filtered = filter === 'all' ? events : events.filter(e => e.eventType === filter);
    document.getElementById('ev-tbody').innerHTML = renderEventRows(filtered);
}

// ── Event Rows ───────────────────────────────────────────
function renderEventRows(events) {
    if (events.length === 0) {
        return `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted)">No events</td></tr>`;
    }

    // Sort newest round first
    const sorted = [...events].sort((a, b) => {
        const ra = a.roundNumber || 0, rb = b.roundNumber || 0;
        if (ra !== rb) return rb - ra;
        if (a.eventType === 'round_end' && b.eventType !== 'round_end') return -1;
        if (b.eventType === 'round_end' && a.eventType !== 'round_end') return 1;
        return 0;
    });

    let html = '';
    let lastRound = -1;

    for (const ev of sorted) {
        const round = ev.roundNumber || 0;

        if (round !== lastRound && round > 0) {
            html += `<tr class="ev-round-sep"><td colspan="6">Round ${round}</td></tr>`;
            lastRound = round;
        }

        let actor = ev.killerName || '—';
        let target = ev.victimName || '—';
        let weapon = ev.weapon || '';

        if (ev.eventType === 'round_end' && ev.logText) weapon = ev.logText;
        else if (!ev.killerName && !ev.victimName && !ev.weapon && ev.logText) weapon = ev.logText;
        if (!weapon) weapon = '—';

        const mods = [];
        if (ev.isHeadshot) mods.push('<span class="mod-icon mod-icon--hs">HS</span>');
        if (ev.isWallbang) mods.push('<span class="mod-icon mod-icon--wb">WB</span>');
        if (ev.isThroughSmoke) mods.push('<span class="mod-icon mod-icon--smoke">S</span>');
        if (ev.isNoScope) mods.push('<span class="mod-icon mod-icon--noscope">NS</span>');
        if (ev.isBlindKill) mods.push('<span class="mod-icon mod-icon--flash">F</span>');

        html += `
        <tr>
            <td style="font-family:var(--font-mono);color:var(--text-muted)">${round || '—'}</td>
            <td><span class="ev-badge ev-badge--${ev.eventType}">${formatType(ev.eventType)}</span></td>
            <td><span class="ev-player ev-player--actor">${esc(actor)}</span></td>
            <td><span class="ev-player ev-player--target">${esc(target)}</span></td>
            <td><span class="ev-weapon">${esc(weapon)}</span></td>
            <td>${mods.join('')}</td>
        </tr>`;
    }

    return html;
}

// ── Weapon Stats ─────────────────────────────────────────
async function loadWeaponStats() {
    const container = document.getElementById('weapon-stats');

    // Aggregate weapons from all match event files
    const weaponCounts = {};
    const promises = matches.slice(0, 20).map(async m => {
        try {
            if (allEvents[m.id]) return allEvents[m.id];
            const res = await fetch(`${API_BASE}/matches/${m.id}_events.json`);
            if (res.ok) {
                const events = await res.json();
                allEvents[m.id] = events;
                return events;
            }
        } catch (e) { }
        return [];
    });

    const allEventArrays = await Promise.all(promises);
    for (const events of allEventArrays) {
        for (const e of events) {
            if (e.eventType === 'kill' && e.weapon) {
                weaponCounts[e.weapon] = (weaponCounts[e.weapon] || 0) + 1;
            }
        }
    }

    // Compute aggregate stats now that we have events
    let totalKills = 0, totalHS = 0;
    for (const events of allEventArrays) {
        for (const e of events) {
            if (e.eventType === 'kill') {
                totalKills++;
                if (e.isHeadshot) totalHS++;
            }
        }
    }

    document.getElementById('stat-total-kills').textContent = totalKills || '—';
    document.getElementById('stat-hs-rate').textContent = totalKills > 0 ? `${Math.round(totalHS / totalKills * 100)}%` : '—';

    const sorted = Object.entries(weaponCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const maxCount = sorted.length > 0 ? sorted[0][1] : 1;

    if (sorted.length === 0) {
        container.innerHTML = '<div class="empty-state">No weapon data yet</div>';
        return;
    }

    container.innerHTML = sorted.map(([weapon, count], i) => `
        <div class="weapon-card">
            <div class="weapon-card__rank">#${i + 1}</div>
            <div class="weapon-card__info">
                <div class="weapon-card__name">${esc(weapon)}</div>
                <div class="weapon-card__bar">
                    <div class="weapon-card__fill" style="width:${Math.round(count / maxCount * 100)}%"></div>
                </div>
            </div>
            <div class="weapon-card__count">${count}</div>
        </div>
    `).join('');
}

// ── Helpers ──────────────────────────────────────────────
function formatType(type) {
    const map = { kill: 'Kill', suicide: 'Suicide', bomb_plant: 'Plant', bomb_defuse: 'Defuse', round_start: 'Start', round_end: 'End' };
    return map[type] || type;
}

function esc(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
