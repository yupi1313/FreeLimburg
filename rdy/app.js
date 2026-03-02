// ── RDY CS2 Website ─────────────────────────────────────
const API = '/kratos/api';
let matches = [];
let eventsCache = {};
let section = 'home';

// ── Static Content ──────────────────────────────────────
// Real news from rdy.gg CS2
const NEWS = [
    { tag: 'Tournament', title: 'NIP and Liquid lose on opening day of ESL Pro League', desc: 'NIP can\'t be serious, man. Both teams stumble in their opening matches of the prestigious league.', author: 'Elliott Griffiths', url: 'https://rdy.gg/en/cs2/news/nip-and-liquid-lose-pro-league', img: 'img/news1.png' },
    { tag: 'News', title: 'BLAST announce massive changes to 2027 circuit', desc: 'BLAST have announced ground-breaking changes to their tournament structure and finances.', author: 'Elliott Griffiths', url: 'https://rdy.gg/en/cs2/news/blast-announce-massive-changes-2027-circuit', img: 'img/news2.png' },
    { tag: 'Tournament', title: 'The lowdown on every team in Stage One — ESL Pro League', desc: 'While it\'s a shame that such a prestigious event is online for the first two stages, it\'s always a good time at ESL Pro League.', author: 'Elliott Griffiths', url: 'https://rdy.gg/en/cs2/news/lowdown-on-every-team-esl-pro-league', img: 'img/news1.png' },
    { tag: 'News', title: 'New York Attorney General sues Valve over CS2 loot boxes', desc: 'New York sues Valve, alleging CS2 and Dota 2 loot boxes constitute illegal gambling.', author: 'Andreea "Div" Esanu', url: 'https://rdy.gg/en/cs2/news/new-york-sues-valve-loot-boxes', img: 'img/news3.png' },
    { tag: 'News', title: '3DMAX swap bodyy for misutaaa', desc: '3DMAX have replaced bodyy with misutaaa after a sketchy patch of form.', author: 'Elliott Griffiths', url: 'https://rdy.gg/en/cs2/news/3dmax-swap-bodyy-for-misutaaa', img: 'img/news2.png' },
    { tag: 'Opinion', title: 'MOUZ\' failed plot and four more things we learnt from PGL Cluj-Napoca', desc: 'Another Vitality win, but there\'s more bubbling beneath the surface after PGL Cluj-Napoca.', author: 'Elliott Griffiths', url: 'https://rdy.gg/en/cs2/news/mouz-failed-plot-things-we-learnt-cluj-napoca', img: 'img/news3.png' },
    { tag: 'Tournament', title: 'Vitality collect yet another trophy with win in Cluj-Napoca', desc: 'This is definitely the best team of all time.', author: 'Elliott Griffiths', url: 'https://rdy.gg/en/cs2/news/vitality-collect-another-trophy-cluj-napoca', img: 'img/news1.png' },
    { tag: 'News', title: 'Get rdy: Competitive guide for February 27th — March 4th', desc: 'Get rdy with me — the weekend and upcoming weekly planner for competitive matches.', author: 'Cristy "Pandora" Ramadani', url: 'https://rdy.gg/en/cs2/news/get-rdy-competitive-guide-for-february-27th-march-4th', img: 'img/news2.png' },
];

// CS2 video highlights
const VIDEOS = [
    { title: 'Best of ESL Pro League S21 — Highlights', channel: 'ESL Counter-Strike', thumb: 'img/thumb1.png', url: 'https://www.youtube.com/results?search_query=ESL+Pro+League+CS2+highlights+2025' },
    { title: 'ZywOo vs s1mple — Who\'s the GOAT in 2025?', channel: 'HLTV.org', thumb: 'img/thumb2.png', url: 'https://www.youtube.com/results?search_query=zywoo+vs+s1mple+CS2+2025' },
    { title: 'PGL Cluj-Napoca Grand Final Highlights', channel: 'PGL CS2', thumb: 'img/thumb3.png', url: 'https://www.youtube.com/results?search_query=PGL+Cluj+Napoca+CS2+grand+final' },
    { title: 'Top 20 Plays of the Month — February 2025', channel: 'HLTV.org', thumb: 'img/thumb4.png', url: 'https://www.youtube.com/results?search_query=CS2+top+plays+February+2025' },
];

// ── Init ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    document.querySelectorAll('.nav-link').forEach(a => {
        a.addEventListener('click', e => { e.preventDefault(); go(a.dataset.section); });
    });
    try {
        const r = await fetch(`${API}/matches.json`);
        if (r.ok) matches = await r.json();
    } catch (e) { console.warn('Load failed:', e); }
    render();
    renderExpertPick();
});

function renderExpertPick() {
    const el = document.getElementById('expert-pick');
    if (!el) return;
    const live = matches.filter(m => m.status === 'Live');
    if (live.length === 0) {
        el.innerHTML = '<div class="empty" style="padding:8px;font-size:11px">No live matches to analyze</div>';
        return;
    }
    // Pick the match with the most map action
    const best = live.reduce((best, m) => {
        const mapScores = m.mapScores || [];
        const totalRounds = mapScores.reduce((t, ms) => t + (ms.score1 || 0) + (ms.score2 || 0), 0);
        return totalRounds > (best._rounds || 0) ? { ...m, _rounds: totalRounds } : best;
    }, { _rounds: 0 });

    if (!best.team1) {
        el.innerHTML = '<div class="empty" style="padding:8px;font-size:11px">Analyzing matches...</div>';
        return;
    }

    const mapScores = best.mapScores || [];
    let t1r = 0, t2r = 0;
    mapScores.forEach(ms => { t1r += ms.score1 || 0; t2r += ms.score2 || 0; });
    const fav = t1r >= t2r ? best.team1 : best.team2;

    el.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            ${teamAva(best.team1)}<span style="font-weight:700;font-size:12px">${esc(best.team1)}</span>
            <span style="color:var(--text3);font-size:11px">vs</span>
            <span style="font-weight:700;font-size:12px">${esc(best.team2)}</span>${teamAva(best.team2)}
        </div>
        <div style="font-size:11px;color:var(--accent);font-weight:600">⚡ Expert favors ${esc(fav)}</div>
        <div style="font-size:10px;color:var(--text3);margin-top:4px">Based on ${best._rounds} rounds played</div>
    `;
}

function go(s) {
    section = s;
    document.querySelectorAll('.nav-link').forEach(a => a.classList.toggle('active', a.dataset.section === s));
    render();
    window.scrollTo(0, 0);
}

// ── Render ──────────────────────────────────────────────
function render() {
    const app = document.getElementById('app');
    const live = matches.filter(m => m.status === 'Live');
    const finished = matches.filter(m => m.status === 'Finished');

    if (section === 'home') app.innerHTML = homeView(live, finished);
    else if (section === 'matches') app.innerHTML = matchesView(live);
    else if (section === 'results') app.innerHTML = resultsView(finished);
    else if (section === 'news') app.innerHTML = newsView();
}

// ── Home View ───────────────────────────────────────────
function homeView(live, finished) {
    return `
        ${secBlock('Recent News', 'Read all news', () => go('news'), newsGrid(NEWS.slice(0, 4)))}
        ${secBlock('Video Highlights', '', null, videoGrid(VIDEOS))}
        ${secBlock(`<span class="dot"></span> Live Matches`, 'View all', () => go('matches'),
        live.length ? matchList(live.slice(0, 8)) : '<div class="empty">No live matches right now</div>'
    )}
        ${secBlock('Results', 'View all', () => go('results'),
        finished.length ? matchList(finished.slice(0, 6)) : '<div class="empty">No finished matches yet</div>'
    )}
    `;
}

function matchesView(live) {
    return `
        <div class="sec">
            <div class="sec-head"><h2 class="sec-title"><span class="dot"></span> All Live Matches</h2></div>
            ${live.length ? matchList(live) : '<div class="empty">No live matches right now</div>'}
        </div>
    `;
}

function resultsView(finished) {
    return `
        <div class="sec">
            <div class="sec-head"><h2 class="sec-title">All Results</h2></div>
            ${finished.length ? matchList(finished) : '<div class="empty">No finished matches yet</div>'}
        </div>
    `;
}

function newsView() {
    return `
        <div class="sec">
            <div class="sec-head"><h2 class="sec-title">CS2 News</h2></div>
            ${newsGrid(NEWS)}
        </div>
        <div class="sec">
            <div class="sec-head"><h2 class="sec-title">Video Highlights</h2></div>
            ${videoGrid(VIDEOS)}
        </div>
    `;
}

// ── Components ──────────────────────────────────────────
function secBlock(title, moreText, moreFn, content) {
    const moreId = moreText ? `sec-more-${Math.random().toString(36).slice(2)}` : '';
    const moreHtml = moreText ? `<a class="sec-more" id="${moreId}">${moreText} →</a>` : '';
    // We'll attach event after render
    setTimeout(() => {
        if (moreId && moreFn) {
            const el = document.getElementById(moreId);
            if (el) el.onclick = moreFn;
        }
    }, 0);
    return `<div class="sec"><div class="sec-head"><h2 class="sec-title">${title}</h2>${moreHtml}</div>${content}</div>`;
}

function newsGrid(items) {
    return `<div class="news-grid">${items.map(n => `
        <a class="news-card" href="${n.url}" target="_blank" rel="noopener">
            ${n.img ? `<div class="news-card__img"><img src="${n.img}" alt=""></div>` : ''}
            <div class="news-card__body">
                <span class="news-card__tag">${esc(n.tag)}</span>
                <div class="news-card__title">${esc(n.title)}</div>
                <div class="news-card__desc">${esc(n.desc)}</div>
                <div class="news-card__author">${esc(n.author)}</div>
            </div>
        </a>
    `).join('')}</div>`;
}

function videoGrid(items) {
    return `<div class="video-grid">${items.map(v => `
        <a class="video-card" href="${v.url}" target="_blank" rel="noopener">
            <div class="video-card__thumb">
                <img src="${v.thumb}" alt="">
                <div class="video-card__play">▶</div>
            </div>
            <div class="video-card__info">
                <div class="video-card__title">${esc(v.title)}</div>
                <div class="video-card__channel">${esc(v.channel)}</div>
            </div>
        </a>
    `).join('')}</div>`;
}

// Calculate series score from map data (a map is won at 13+ rounds)
function calcSeries(mapScores) {
    let s1 = 0, s2 = 0;
    for (const ms of mapScores) {
        if (ms.score1 >= 13 && ms.score1 > ms.score2) s1++;
        else if (ms.score2 >= 13 && ms.score2 > ms.score1) s2++;
    }
    return { s1, s2 };
}

function mapWinner(ms) {
    if (ms.score1 >= 13 && ms.score1 > ms.score2) return 'team1';
    if (ms.score2 >= 13 && ms.score2 > ms.score1) return 'team2';
    return null;
}

function matchList(items) {
    return `<div class="match-list">${items.map(m => {
        const isLive = m.status === 'Live';
        const mapScores = m.mapScores || [];
        const { s1, s2 } = calcSeries(mapScores);
        const hasScore = mapScores.some(ms => ms.score1 > 0 || ms.score2 > 0);

        const odds = generateOdds(m);

        const maps = mapScores.filter(ms => ms.score1 > 0 || ms.score2 > 0).map(ms => {
            const w = mapWinner(ms);
            const wc = w === 'team1' ? ' mr-map--w1' : w === 'team2' ? ' mr-map--w2' : '';
            return `<span class="mr-map${wc}">M${ms.map}: ${ms.score1}-${ms.score2}</span>`;
        }).join('');

        return `
        <div class="match-row ${isLive ? 'match-row--live' : ''}" onclick="openMatch('${m.id}')">
            <div class="mr-status">
                <span class="mr-badge ${isLive ? 'mr-badge--live' : 'mr-badge--fin'}">
                    ${isLive ? '<span class="dot"></span>LIVE' : 'FIN'}
                </span>
            </div>
            <div class="mr-teams">
                <span class="mr-team">${teamAva(m.team1)}${esc(m.team1 || 'TBD')}</span>
                <div class="mr-score">
                    <span>${hasScore ? s1 : ''}</span>
                    <span class="mr-score__sep">${hasScore ? ':' : 'vs'}</span>
                    <span>${hasScore ? s2 : ''}</span>
                </div>
                <span class="mr-team">${esc(m.team2 || 'TBD')}${teamAva(m.team2)}</span>
            </div>
            <div class="mr-maps">${maps}</div>
            <div class="mr-odds">
                <span class="mr-odd ${odds.fav === 1 ? 'mr-odd--fav' : ''}">${odds.o1}</span>
                <span class="mr-odd ${odds.fav === 2 ? 'mr-odd--fav' : ''}">${odds.o2}</span>
            </div>
        </div>`;
    }).join('')}</div>`;
}

// ── Generate display odds from score data ────────────────
function generateOdds(m) {
    const mapScores = m.mapScores || [];
    let t1rounds = 0, t2rounds = 0;
    for (const ms of mapScores) {
        t1rounds += ms.score1 || 0;
        t2rounds += ms.score2 || 0;
    }
    const total = t1rounds + t2rounds;
    if (total === 0) return { o1: '—', o2: '—', fav: 0 };

    const t1pct = t1rounds / total;
    // Convert to decimal odds
    const o1 = t1pct > 0.01 ? (1 / t1pct).toFixed(2) : '—';
    const o2 = (1 - t1pct) > 0.01 ? (1 / (1 - t1pct)).toFixed(2) : '—';
    const fav = t1pct >= 0.5 ? 1 : 2;
    return { o1, o2, fav };
}

// ── Match Detail ────────────────────────────────────────
async function openMatch(id) {
    // Create overlay if not exists
    let ov = document.querySelector('.overlay');
    if (!ov) {
        ov = document.createElement('div');
        ov.className = 'overlay';
        ov.innerHTML = '<div class="panel" id="panel"></div>';
        ov.addEventListener('click', e => { if (e.target === ov) ov.classList.remove('open'); });
        document.body.appendChild(ov);
    }
    ov.classList.add('open');
    const panel = document.getElementById('panel');
    panel.innerHTML = '<div class="loading">Loading match...</div>';

    const m = matches.find(x => String(x.id) === String(id));
    if (!m) { panel.innerHTML = '<div class="empty">Match not found</div>'; return; }

    let events = [];
    try {
        const r = await fetch(`${API}/matches/${id}_events.json`);
        if (r.ok) events = await r.json();
    } catch (e) { }
    eventsCache[id] = events;

    const kills = events.filter(e => e.eventType === 'kill');
    const hs = kills.filter(e => e.isHeadshot);
    const maxRnd = events.reduce((mx, e) => Math.max(mx, e.roundNumber || 0), 0);
    const hsRate = kills.length ? Math.round(hs.length / kills.length * 100) : 0;
    const mapScores = m.mapScores || [];
    const { s1, s2 } = calcSeries(mapScores);
    const hasScore = mapScores.some(ms => ms.score1 > 0 || ms.score2 > 0);
    const isLive = m.status === 'Live';

    const maps = mapScores.filter(ms => ms.score1 > 0 || ms.score2 > 0).map(ms => {
        const w = mapWinner(ms);
        const wc = w === 'team1' ? ' mr-map--w1' : w === 'team2' ? ' mr-map--w2' : '';
        return `<span class="mr-map${wc}">M${ms.map}: ${ms.score1}-${ms.score2}</span>`;
    }).join('');

    const tc = {};
    events.forEach(e => { tc[e.eventType] = (tc[e.eventType] || 0) + 1; });
    const filterBtns = [
        `<button class="fbtn on" onclick="filterEv('${id}','all',this)">All (${events.length})</button>`,
        ...Object.entries(tc).map(([t, c]) => `<button class="fbtn" onclick="filterEv('${id}','${t}',this)">${fmtType(t)} (${c})</button>`)
    ].join('');

    panel.innerHTML = `
        <button class="panel-close" onclick="document.querySelector('.overlay').classList.remove('open')">← Back</button>
        <div class="panel-header">
            <span class="mr-badge ${isLive ? 'mr-badge--live' : 'mr-badge--fin'}">${isLive ? '<span class="dot"></span>LIVE' : 'FINISHED'}</span>
            <div class="panel-teams">
                <span class="panel-tn">${esc(m.team1)}</span>
                <div class="panel-sc"><span>${hasScore ? s1 : ''}</span><span>${hasScore ? ':' : 'vs'}</span><span>${hasScore ? s2 : ''}</span></div>
                <span class="panel-tn">${esc(m.team2)}</span>
            </div>
            <div class="panel-maps">${maps}</div>
        </div>
        <div class="panel-stats">
            <div class="ps"><div class="ps-val">${kills.length}</div><div class="ps-lbl">Kills</div></div>
            <div class="ps"><div class="ps-val">${hs.length}</div><div class="ps-lbl">Headshots</div></div>
            <div class="ps"><div class="ps-val">${maxRnd}</div><div class="ps-lbl">Rounds</div></div>
            <div class="ps"><div class="ps-val">${hsRate}%</div><div class="ps-lbl">HS Rate</div></div>
        </div>
        <div class="filters">${filterBtns}</div>
        <div class="ev-wrap">
            <table class="ev-tbl"><thead><tr>
                <th>Rnd</th><th>Type</th><th>Player</th><th>Target</th><th>Weapon</th><th>Mods</th>
            </tr></thead><tbody id="evbody">${evRows(events)}</tbody></table>
        </div>
    `;
}

function filterEv(id, f, btn) {
    btn.closest('.filters').querySelectorAll('.fbtn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    const evs = eventsCache[id] || [];
    document.getElementById('evbody').innerHTML = evRows(f === 'all' ? evs : evs.filter(e => e.eventType === f));
}

function evRows(events) {
    if (!events.length) return '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text3)">No events</td></tr>';
    const sorted = [...events].sort((a, b) => {
        const ra = a.roundNumber || 0, rb = b.roundNumber || 0;
        if (ra !== rb) return rb - ra;
        if (a.eventType === 'round_end' && b.eventType !== 'round_end') return -1;
        if (b.eventType === 'round_end' && a.eventType !== 'round_end') return 1;
        return 0;
    });
    let h = '', lr = -1;
    for (const e of sorted) {
        const r = e.roundNumber || 0;
        if (r !== lr && r > 0) { h += `<tr class="ev-rsep"><td colspan="6">Round ${r}</td></tr>`; lr = r; }
        let actor = e.killerName || '—', target = e.victimName || '—', wpn = e.weapon || '';
        if (e.eventType === 'round_end' && e.logText) wpn = e.logText;
        else if (!e.killerName && !e.victimName && !e.weapon && e.logText) wpn = e.logText;
        if (!wpn) wpn = '—';
        let mods = '';
        if (e.isHeadshot) mods += '<span class="mod mod-hs">HS</span>';
        if (e.isWallbang) mods += '<span class="mod mod-wb">WB</span>';
        if (e.isThroughSmoke) mods += '<span class="mod mod-s">S</span>';
        if (e.isNoScope) mods += '<span class="mod mod-ns">NS</span>';
        if (e.isBlindKill) mods += '<span class="mod mod-f">F</span>';
        h += `<tr>
            <td style="color:var(--text3)">${r || '—'}</td>
            <td><span class="badge badge--${e.eventType}">${fmtType(e.eventType)}</span></td>
            <td><span class="ev-actor">${esc(actor)}</span></td>
            <td><span class="ev-target">${esc(target)}</span></td>
            <td><span class="ev-wpn">${esc(wpn)}</span></td>
            <td>${mods}</td>
        </tr>`;
    }
    return h;
}

// ── Helpers ─────────────────────────────────────────────
function fmtType(t) {
    return { kill: 'Kill', suicide: 'Suicide', bomb_plant: 'Plant', bomb_defuse: 'Defuse', round_start: 'Start', round_end: 'End' }[t] || t;
}

const AVA_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#a855f7', '#06b6d4', '#ec4899', '#f97316', '#10b981', '#6366f1'];
function teamAva(name) {
    if (!name) return '';
    const initial = name.charAt(0).toUpperCase();
    const hash = name.split('').reduce((h, c) => h + c.charCodeAt(0), 0);
    const color = AVA_COLORS[hash % AVA_COLORS.length];
    return `<span class="team-ava" style="background:${color}22;color:${color}">${initial}</span>`;
}

function esc(s) {
    return s ? s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : '';
}
