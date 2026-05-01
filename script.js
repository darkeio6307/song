/**
 * =========================================================================
 * 🌌 ARSHAD SUPREME ENGINE v44.0 (The Infinity Flow Update)
 * Optimized for: Tecno Pova 7
 * CRITICAL FIXES & UPGRADES: 
 * 1. Auto-Play Bug Fixed: Songs now play sequentially. Loop never breaks!
 * 2. Search Upgraded: Exact matches to your search query forced to the TOP.
 * 3. Smart Categories: Chips updated to Trending, Artists, Albums.
 * 4. SERVER UPGRADE: Vercel High-Speed API & Smart JSON Extractor Added! 🔥
 * =========================================================================
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, updateDoc, increment, addDoc, query, orderBy, limit, deleteDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCnwHn6b2F8O8M-3Elk54tydzqldj78Cxg",
  authDomain: "arshad-music.firebaseapp.com",
  projectId: "arshad-music",
  storageBucket: "arshad-music.firebasestorage.app",
  messagingSenderId: "301555315508",
  appId: "1:301555315508:web:28340660dfbfe2429beb61"
};

let db = null;
try { const firebaseApp = initializeApp(firebaseConfig); db = getFirestore(firebaseApp); } catch(e) { console.error("Firebase Offline"); }

const vipDB = { 
    "dark_eio": { displayName: "Dark_eio", pass: "moh0909", relation: "Universe Lord 👑", badge: "The Creator", theme: "theme-default", avatar: "darkeio.jpg", headerText: "God Mode 👑" },
    "muskan": { displayName: "Muskan", pass: "Love", relation: "My Love, My Life ❤️", badge: "Queen", theme: "theme-muskan", avatar: "wife.jpg", headerText: "Love ❤️" },
    "priti": { displayName: "Priti", pass: "bff", relation: "Best Friend 🤞", badge: "Angel", theme: "theme-preeti", avatar: "bff.jpg", headerText: "Best Friend 🥀" }
};

const app = document.getElementById('mainApp');
const audio = document.getElementById('audioEngine');
const playBtn = document.getElementById('playBtn');
const seekSlider = document.getElementById('seekSlider');
const roomLiveTag = document.getElementById('roomLiveTag');

let currentUser = ""; let currentDisplay = "";
let currentQueue = []; let myPlaylist = []; let currentIndex = 0;
let isPlaylistView = false; let currentChatPartner = null; 
let chatUnsub = null; let typingUnsub = null; let partnerStatusUnsub = null;
let globalChatListeners = {}; 

let currentPage = 1; let currentQuery = "Trending Hindi Hits";
let isLoadingMore = false; let hasMoreSongs = true;
let typingTimer; let sleepTimeout = null; let isMapView = false;

let myHostedRoomId = null; let myJoinedRoomId = null; let joinedRoomUnsub = null; let lastAudioSrc = "";
const aiVibes = ["Top Trending Hindi Songs", "Best Bollywood Artists", "Global Hit Albums", "New Hindi Releases 2026"];

function getRoomID(user1, user2) { return [user1.toLowerCase(), user2.toLowerCase()].sort().join("_"); }
function vibeClick() { if(navigator.vibrate) navigator.vibrate(40); }
function showToast(m) { const t = document.getElementById('toast'); t.innerText = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3500); }

function formatTime(ts) { if(!ts) return ""; return new Date(ts).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}); }
function formatLastSeen(ts) {
    if(!ts) return "Offline"; 
    const diff = Date.now() - ts;
    if(diff < 60000) return "Online"; 
    
    const date = new Date(ts); const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    if (date.toDateString() === today.toDateString()) { return `last seen today at ${timeStr}`; } 
    else if (date.toDateString() === yesterday.toDateString()) { return `last seen yesterday at ${timeStr}`; } 
    else { return `last seen ${date.toLocaleDateString('en-IN', {day:'numeric', month:'short'})} at ${timeStr}`; }
}
function fmtTime(s) { let m = Math.floor(s/60); let sec = Math.floor(s%60); return `${m}:${sec<10?'0'+sec:sec}`; }

// === 🌌 1. STAR-MAP CANVAS ===
const canvas = document.getElementById('starMapCanvas');
const ctx = canvas.getContext('2d');
let stars = []; let camX = 0, camY = 0;

function initStarMap() {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    stars = currentQueue.map(song => ({
        song: song, x: Math.random() * 2000 - 1000, y: Math.random() * 2000 - 1000,
        size: Math.random() * 3 + 1, color: `hsl(${Math.random() * 360}, 70%, 70%)`
    }));
    renderCanvas();
}

function renderCanvas() {
    if(!isMapView) return;
    ctx.fillStyle = '#000'; ctx.fillRect(0,0, canvas.width, canvas.height);
    stars.forEach(star => {
        const screenX = star.x - camX + canvas.width/2; const screenY = star.y - camY + canvas.height/2;
        if(screenX > -50 && screenX < canvas.width+50 && screenY > -50 && screenY < canvas.height+50) {
            ctx.shadowBlur = 10; ctx.shadowColor = star.color; ctx.fillStyle = star.color;
            ctx.beginPath(); ctx.arc(screenX, screenY, star.size, 0, Math.PI*2); ctx.fill();
            if(Math.abs(screenX - canvas.width/2) < 100 && Math.abs(screenY - canvas.height/2) < 100) {
                ctx.font = "10px Outfit"; ctx.fillStyle = "#fff"; ctx.shadowBlur = 0;
                ctx.fillText(star.song.name.substring(0, 15), screenX + 10, screenY + 5);
            }
        }
    });
    requestAnimationFrame(renderCanvas);
}

let isDragging = false, lastX, lastY;
canvas.addEventListener('touchstart', e => { isDragging = true; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY; }, {passive: true});
canvas.addEventListener('touchmove', e => { if(!isDragging) return; camX -= (e.touches[0].clientX - lastX); camY -= (e.touches[0].clientY - lastY); lastX = e.touches[0].clientX; lastY = e.touches[0].clientY; }, {passive: true});
canvas.addEventListener('touchend', () => {
    isDragging = false; let closestDist = Infinity; let closestIdx = -1;
    stars.forEach((star, idx) => {
        const screenX = star.x - camX + canvas.width/2; const screenY = star.y - camY + canvas.height/2;
        const dist = Math.sqrt(Math.pow(screenX - canvas.width/2, 2) + Math.pow(screenY - canvas.height/2, 2));
        if(dist < 30 && dist < closestDist) { closestDist = dist; closestIdx = idx; }
    });
    if(closestIdx !== -1) playSong(closestIdx);
});

document.getElementById('viewSwitchBtn').addEventListener('click', () => {
    vibeClick(); isMapView = !isMapView;
    const canvasCont = document.getElementById('universeCanvasContainer'); const scrollCont = document.getElementById('musicLibraryContainer'); const btn = document.getElementById('viewSwitchBtn');
    if(isMapView) { canvasCont.classList.remove('hidden'); scrollCont.classList.add('hidden'); btn.innerHTML = '<i class="fa-solid fa-list"></i> Switch to List'; initStarMap(); } 
    else { canvasCont.classList.add('hidden'); scrollCont.classList.remove('hidden'); btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Switch to Map'; }
});

// === 🌌 2. DIRECT BOOT ===
function bootSession(rawName, showWelcome = false, userData) {
    currentUser = rawName.toLowerCase();
    currentDisplay = userData ? userData.displayName : (rawName.charAt(0).toUpperCase() + rawName.slice(1));
    
    document.getElementById('splashScreen').style.display = 'none'; 
    document.getElementById('loginScreen').classList.add('hidden'); 
    app.classList.remove('hidden');

    if(userData) {
        document.body.className = userData.theme || "theme-default";
        document.getElementById('userAvatar').src = userData.avatar || "guest.jpg";
        document.getElementById('profRelation').innerText = userData.relation || "Vibe Listener";
        if(userData.headerText) { document.getElementById('timeGreeting').innerText = userData.headerText; } 
        else { const hrs = new Date().getHours(); document.getElementById('timeGreeting').innerText = hrs < 12 ? "Good Morning," : hrs < 17 ? "Good Afternoon," : hrs < 21 ? "Good Evening," : "Good Night,"; }
    }
    
    document.getElementById('userName').innerText = currentDisplay; document.getElementById('profName').innerText = currentDisplay;

    if(showWelcome) {
        if(currentUser === "dark_eio") showToast("Welcome back Lord 👑"); else if(currentUser === "muskan") showToast("Welcome back Sweetheart ❤️"); else showToast("Welcome to Universe 🎧");
    }
    if(currentUser === 'dark_eio') { document.getElementById('lordPowerPanel').classList.remove('hidden'); }
    
    try { const startingVibe = aiVibes[Math.floor(Math.random() * aiVibes.length)]; fetchMusic(startingVibe); } catch(e){}

    if (db) {
        getDoc(doc(db, "vaults", currentUser)).then(vSnap => {
            myPlaylist = vSnap.exists() ? vSnap.data().songs : [];
            document.getElementById('profSongCount').innerText = myPlaylist.length;
        }).catch(e=>{});
        trackAndLoadStats(); trackOnlineSouls(); startGlobalNotifications(); listenToRooms();
    }
}

function trackAndLoadStats() {
    setInterval(() => { updateDoc(doc(db, "stats", currentUser), { today: increment(1), week: increment(1), month: increment(1) }).catch(()=>{}); }, 60000);
    onSnapshot(doc(db, "stats", currentUser), (snap) => {
        const todayStr = new Date().toLocaleDateString(); 
        if(snap.exists()) { 
            const d = snap.data();
            if(d.lastDate !== todayStr) { setDoc(doc(db, "stats", currentUser), { today: 0, lastDate: todayStr }, {merge: true}); document.getElementById('statToday').innerText = "0"; } 
            else { document.getElementById('statToday').innerText = d.today || 0; }
            document.getElementById('statWeek').innerText = d.week || 0; document.getElementById('statMonth').innerText = d.month || 0; 
        } else { setDoc(doc(db, "stats", currentUser), { today: 0, week: 0, month: 0, lastDate: todayStr }); }
    });
}

const onlinePopup = document.getElementById('onlinePopup');
document.getElementById('onlineSoulsTag').addEventListener('click', () => { vibeClick(); onlinePopup.classList.toggle('show'); });
document.getElementById('closeOnlinePopup').addEventListener('click', () => { vibeClick(); onlinePopup.classList.remove('show'); });

function trackOnlineSouls() {
    if (!db) return;
    onSnapshot(collection(db, "liveStatus"), (snap) => {
        let onlineCount = 0; const popupList = document.getElementById('onlinePopupList');
        popupList.innerHTML = ''; const popupFrag = document.createDocumentFragment();

        snap.forEach(docSnap => {
            const data = docSnap.data();
            if (data.lastSeen > (Date.now() - 60000)) {
                onlineCount++; 
                const pItem = document.createElement('div'); pItem.className = 'online-user-item';
                let playingText = data.isPlaying && data.songName ? `Vibing: ${data.songName}` : 'Chilling...';
                pItem.innerHTML = `<img src="${data.avatar || 'guest.jpg'}"><div><p>${data.displayName || docSnap.id}</p><span>${playingText}</span></div>`;
                popupFrag.appendChild(pItem);
            }
        });
        
        document.getElementById('onlineCountText').innerText = `${onlineCount} Online`;
        popupList.appendChild(popupFrag);
        if(popupList.childNodes.length === 0) popupList.innerHTML = '<p style="font-size:10px; color:#aaa; text-align:center;">Only you are here...</p>';
    });
}

document.getElementById('profileBtn').addEventListener('click', () => { vibeClick(); const drop = document.getElementById('topProfileStats'); if(drop.classList.contains('hidden')) { drop.classList.remove('hidden'); } else { drop.classList.add('hidden'); } });
document.getElementById('closeStatsBtn').addEventListener('click', () => { vibeClick(); document.getElementById('topProfileStats').classList.add('hidden'); });
window.logoutApp = () => { vibeClick(); localStorage.clear(); updateLiveStatus(false); setTimeout(() => { location.reload(); }, 300); };
document.getElementById('powerForceTheme').addEventListener('click', () => { vibeClick(); document.body.className = "theme-preeti"; showToast("UI Theme Forced! 🎨"); });

// === 🎶 3. MUSIC ENGINE (SEARCH UPGRADE: EXACT MATCH TOP) ===
async function fetchMusic(q, isLoadMore = false) {
    const heading = document.getElementById('listHeading'); const loader = document.getElementById('infiniteLoader');
    if(!isLoadMore) { currentPage = 1; currentQuery = q; heading.innerText = "Scanning Galaxy..."; hasMoreSongs = true; currentQueue = []; document.getElementById('songsList').innerHTML = '';} 
    else { loader.classList.remove('hidden'); }
    isLoadingMore = true;
    
    try {
        // 🔥 The Most Stable Vercel API
        const res = await fetch(`https://jiosaavn-api-privatecvc2.vercel.app/search/songs?query=${q}&page=${currentPage}&limit=50`);
        const data = await res.json();
        
        // Smart Data Extractor
        let newSongs = data?.data?.results || data?.results || [];

        if(newSongs.length > 0) {
            // 🔥 UPGRADE: Smart Exact Match Algorithm
            const searchLower = q.toLowerCase();
            newSongs.sort((a, b) => {
                const aMatch = a.name.toLowerCase() === searchLower ? 1 : 0;
                const bMatch = b.name.toLowerCase() === searchLower ? 1 : 0;
                if(aMatch !== bMatch) return bMatch - aMatch; 
                return (parseInt(b.year) || 0) - (parseInt(a.year) || 0); 
            });

            const startIndex = currentQueue.length; currentQueue = [...currentQueue, ...newSongs];
            appendLibrary(newSongs, startIndex);
            if(!isLoadMore) heading.innerText = `'${q}' Vibes`;
            if(isMapView) initStarMap();
        } else { 
            hasMoreSongs = false; 
            if(!isLoadMore) showToast("No matches found."); 
        }
    } catch(e) { 
        console.error("API Error Bhai: ", e); 
        if(!isLoadMore) showToast("Network Drop!"); 
    }
    
    isLoadingMore = false; loader.classList.add('hidden');
}

function renderLibrary() { document.getElementById('songsList').innerHTML = ''; appendLibrary(currentQueue, 0); }
function appendLibrary(songs, startIndex) {
    const list = document.getElementById('songsList'); const frag = document.createDocumentFragment(); 
    songs.forEach((song, i) => {
        const globalIndex = startIndex + i; const div = document.createElement('div'); div.className = 'song-card glass-widget';
        if(globalIndex === currentIndex && !audio.paused) div.classList.add('active-playing-card');
        
        const isFav = myPlaylist.some(s => s.id === song.id);
        
        // 🔥 UPGRADE: Added Live Audio Wave Animation for Playing Track
        div.innerHTML = `
            <img src="${song.image[2].url}" onclick="playSong(${globalIndex})" loading="lazy">
            <div class="song-info-v2" onclick="playSong(${globalIndex})"><h4>${song.name}</h4><p>${song.artists.primary[0].name} • ${song.year||'Unknown'}</p></div>
            <div class="audio-wave"><div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div></div>
            <button class="fav-btn" style="color:${isFav?'var(--neon-main)':'#555'}" onclick="toggleFav(event, ${globalIndex})"><i class="fa-solid fa-heart"></i></button>`;
        frag.appendChild(div);
    });
    list.appendChild(frag);
}

document.getElementById('musicLibraryContainer').addEventListener('scroll', function() {
    if(isPlaylistView || !hasMoreSongs || isLoadingMore) return; 
    if (this.scrollTop + this.clientHeight >= this.scrollHeight - 150) { currentPage++; fetchMusic(currentQuery, true); }
}, {passive: true});

async function toggleFav(e, globalIndex) {
    vibeClick(); e.stopPropagation();
    const song = currentQueue[globalIndex]; const idx = myPlaylist.findIndex(s => s.id === song.id);
    if(idx > -1) { myPlaylist.splice(idx, 1); showToast("Removed from Vault"); } else { myPlaylist.push(song); showToast("Saved to Vault ❤️"); }
    if(db) await setDoc(doc(db, "vaults", currentUser), { songs: myPlaylist });
    if(isPlaylistView) renderLibrary(); else { e.currentTarget.style.color = (idx > -1) ? '#555' : 'var(--neon-main)'; document.getElementById('profSongCount').innerText = myPlaylist.length; }
}
window.toggleFav = toggleFav; window.playSong = playSong;

function playSong(i) {
    if(i >= currentQueue.length) i = 0; // Safe bound check
    currentIndex = i; const song = currentQueue[i];
    
    // Update Glow and Wave
    const allCards = document.querySelectorAll('.song-card');
    allCards.forEach((card, index) => {
        if(index === i) card.classList.add('active-playing-card');
        else card.classList.remove('active-playing-card');
    });

    document.getElementById('playerTitle').innerText = song.name; document.getElementById('playerArtist').innerText = song.artists.primary[0].name; document.getElementById('playerCover').src = song.image[1].url;
    document.getElementById('bgAura').style.background = `url(${song.image[1].url})`; document.getElementById('bgAura').style.backgroundSize = "cover";
    
    seekSlider.value = 0; document.getElementById('timeCurrent').innerText = "0:00"; document.getElementById('timeTotal').innerText = "0:00";
    
    audio.src = song.downloadUrl[4].url; audio.volume = 0; 
    audio.play().then(() => { let vol = 0; let fadeInterval = setInterval(() => { if(vol < 1) { vol += 0.05; audio.volume = Math.min(1, vol); } else clearInterval(fadeInterval); }, 50); }).catch(e=>{});
    
    document.getElementById('vinylDisk').classList.add('spin-vinyl'); playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>'; document.getElementById('profileBtn').classList.add('playing'); 
    
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({ title: song.name, artist: song.artists.primary[0].name, artwork: [{ src: song.image[2].url, sizes: '500x500', type: 'image/jpeg' }] });
        navigator.mediaSession.setActionHandler('play', () => playBtn.click());
        navigator.mediaSession.setActionHandler('pause', () => playBtn.click());
        navigator.mediaSession.setActionHandler('nexttrack', () => document.getElementById('nextBtn').click());
        navigator.mediaSession.setActionHandler('previoustrack', () => document.getElementById('prevBtn').click());
    }

    if(myHostedRoomId && db) updateRoomState(song, true);
    if(db) updateLiveStatus(true, song);
    
    document.querySelector('.lyrics-text').innerHTML = `Vibing to:<br><span style="color:var(--neon-main)">${song.name}</span>`;
}

let lastTap = 0;
document.getElementById('vinylDisk').addEventListener('touchend', (e) => {
    const currentTime = new Date().getTime(); const tapLength = currentTime - lastTap;
    if (tapLength < 300 && tapLength > 0) {
        if(!isNaN(audio.duration)) { audio.currentTime = Math.min(audio.duration, audio.currentTime + 10); showToast("⏩ +10s"); vibeClick(); }
        e.preventDefault();
    }
    lastTap = currentTime;
});

audio.onwaiting = () => playBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
audio.onplaying = () => playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
audio.onpause = () => playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';

audio.onloadedmetadata = () => { if(!isNaN(audio.duration)) { document.getElementById('timeTotal').innerText = fmtTime(audio.duration); seekSlider.max = 100; } };

audio.ontimeupdate = () => { 
    if(!isNaN(audio.duration)) { 
        seekSlider.value = (audio.currentTime/audio.duration)*100; document.getElementById('timeCurrent').innerText = fmtTime(audio.currentTime);
        if (audio.duration - audio.currentTime < 3 && audio.volume > 0.05) audio.volume -= 0.01; 
    } 
};
seekSlider.addEventListener('input', () => { if(!isNaN(audio.duration)) { audio.currentTime = (seekSlider.value/100)*audio.duration; }});

playBtn.addEventListener('click', () => {
    vibeClick();
    if(audio.paused) {
        audio.play().catch(e=>{}); document.getElementById('vinylDisk').classList.add('spin-vinyl'); document.getElementById('profileBtn').classList.add('playing');
        if(myHostedRoomId && db) updateRoomState(currentQueue[currentIndex], true);
        if(db) updateLiveStatus(true, currentQueue[currentIndex]);
    } else {
        audio.pause(); document.getElementById('vinylDisk').classList.remove('spin-vinyl'); document.getElementById('profileBtn').classList.remove('playing');
        if(myHostedRoomId && db) updateRoomState(currentQueue[currentIndex], false);
        if(db) updateLiveStatus(false, null);
    }
});

document.getElementById('nextBtn').addEventListener('click', () => { vibeClick(); audio.dispatchEvent(new Event('ended')); });
document.getElementById('prevBtn').addEventListener('click', () => { vibeClick(); if(currentIndex > 0) playSong(currentIndex - 1); });

// 🔥 BUG 1 FIXED: Auto-Play Next Song (Sequential & Reliable)
audio.addEventListener('ended', () => {
    if(currentQueue.length > 0) {
        let nextIdx = (currentIndex + 1) % currentQueue.length;
        playSong(nextIdx);
        showToast("Playing Next Track...");
    }
});

document.getElementById('sleepTimerBtn').addEventListener('click', () => {
    vibeClick(); const btn = document.getElementById('sleepTimerBtn');
    if(sleepTimeout) { clearTimeout(sleepTimeout); sleepTimeout = null; btn.classList.remove('timer-active'); showToast("Sleep Timer Off ☀️"); } 
    else { sleepTimeout = setTimeout(() => { audio.pause(); playBtn.innerHTML = '<i class="fa-solid fa-play"></i>'; document.getElementById('vinylDisk').classList.remove('spin-vinyl'); document.getElementById('profileBtn').classList.remove('playing'); showToast("App Slept 🌙"); }, 30 * 60000); btn.classList.add('timer-active'); showToast("Sleep mode: 30 Mins 🌙"); }
});

if ('webkitSpeechRecognition' in window) {
    const rec = new webkitSpeechRecognition(); rec.lang = 'hi-IN'; const mic = document.getElementById('micBtn');
    mic.onclick = () => { vibeClick(); rec.start(); mic.style.color = '#ff0055'; };
    rec.onresult = (e) => { document.getElementById('searchInput').value = e.results[0][0].transcript; document.getElementById('searchBtn').click(); mic.style.color = 'var(--neon-main)'; };
    rec.onerror = () => mic.style.color = 'var(--neon-main)';
}

// === 🏠 6. ROOM FEATURE ===
document.getElementById('btnRoomToggle').addEventListener('click', () => { vibeClick(); document.getElementById('chatWidget').classList.remove('show'); document.getElementById('roomWidget').classList.toggle('show'); document.querySelectorAll('.dock-item').forEach(el => el.classList.remove('active')); document.getElementById('btnRoomToggle').classList.add('active'); });
document.getElementById('closeRoomBtn').addEventListener('click', () => { vibeClick(); document.getElementById('roomWidget').classList.remove('show'); document.getElementById('btnRoomToggle').classList.remove('active'); document.getElementById(isPlaylistView ? 'btnPlaylist' : 'btnHome').classList.add('active'); });

document.getElementById('createRoomBtn').addEventListener('click', async () => { 
    vibeClick(); 
    if(!db) return showToast("Offline");
    if(myHostedRoomId) return showToast("You already have an active room!");
    const roomCode = Math.floor(1000 + Math.random() * 9000).toString();
    myHostedRoomId = roomCode;
    
    let songData = currentQueue[currentIndex] || null;
    await setDoc(doc(db, "rooms", roomCode), { hostId: currentUser, hostName: currentDisplay, active: true, createdAt: Date.now(), songId: songData ? songData.id : null, audio: songData ? songData.downloadUrl[4].url : null, songName: songData ? songData.name : "Silence", artist: songData ? songData.artists.primary[0].name : "", cover: songData ? songData.image[2].url : "", isPlaying: !audio.paused });
    showToast(`Room #${roomCode} Created!`); document.getElementById('createRoomBtn').innerText = "ROOM ACTIVE (LISTED)";
});

async function updateRoomState(song, isPlaying) { if(!myHostedRoomId || !db) return; await updateDoc(doc(db, "rooms", myHostedRoomId), { songId: song.id, audio: song.downloadUrl[4].url, songName: song.name, cover: song.image[2].url, artist: song.artists.primary[0].name, isPlaying: isPlaying }); }

window.deleteRoom = async (roomId, e) => {
    e.stopPropagation(); vibeClick();
    if(db) { await deleteDoc(doc(db, "rooms", roomId)); if(myHostedRoomId === roomId) { myHostedRoomId = null; document.getElementById('createRoomBtn').innerText = "CREATE PRIVATE ROOM"; showToast("Room Closed"); } }
};

function listenToRooms() {
    onSnapshot(collection(db, "rooms"), (snap) => {
        const list = document.getElementById('activeRoomsList'); list.innerHTML = ''; let count = 0; const frag = document.createDocumentFragment();
        snap.forEach(docSnap => {
            const data = docSnap.data();
            if(Date.now() - data.createdAt > 10800000) { deleteDoc(doc(db, "rooms", docSnap.id)); return; }
            if(data.active) {
                count++; const div = document.createElement('div'); div.className = 'contact-item';
                const delBtnHtml = (data.hostId === currentUser) ? `<button class="room-del-btn" onclick="deleteRoom('${docSnap.id}', event)"><i class="fa-solid fa-trash"></i></button>` : '';
                div.innerHTML = `<div class="story-ring" style="display:flex; justify-content:center; align-items:center; width:50px; height:50px;"><i class="fa-solid fa-house-signal" style="color:#00ff88; font-size:20px;"></i></div><div style="flex:1; margin-left:15px;"><h4>Room #${docSnap.id}</h4><p class="fm-listener-badge live">Host: ${data.hostName}</p></div>${delBtnHtml}`;
                div.onclick = () => joinRoom(docSnap.id, data.hostId); frag.appendChild(div);
            }
        });
        list.appendChild(frag); if(count === 0) list.innerHTML = '<p class="empty-msg" style="text-align:center; margin-top:20px;">No active rooms found.</p>';
    });
}

function joinRoom(roomId, hostId) {
    if(hostId === currentUser) return showToast("You are the host!");
    if(myJoinedRoomId === roomId) return;
    if(joinedRoomUnsub) joinedRoomUnsub();
    myJoinedRoomId = roomId; roomLiveTag.classList.remove('hidden'); document.getElementById('roomLiveText').innerText = "Room #" + roomId; showToast(`Joined Room #${roomId}`);
    
    joinedRoomUnsub = onSnapshot(doc(db, "rooms", roomId), snap => {
        if(!snap.exists() || !snap.data().active) { showToast("Room ended by host."); roomLiveTag.classList.add('hidden'); myJoinedRoomId = null; audio.pause(); document.getElementById('vinylDisk').classList.remove('spin-vinyl'); document.getElementById('profileBtn').classList.remove('playing'); return; }
        const d = snap.data(); if(!d.audio) return;
        
        if(lastAudioSrc !== d.audio) {
            lastAudioSrc = d.audio; showToast(`Host playing: ${d.songName}`);
            const s = { id: d.songId, name: d.songName, artists: { primary: [{ name: d.artist }] }, image: [{},{},{url: d.cover}], downloadUrl: [{},{},{},{},{url: d.audio}] }; 
            currentQueue = [s]; playSong(0);
        }
        requestAnimationFrame(() => {
            if(d.isPlaying === false && !audio.paused) { audio.pause(); document.getElementById('vinylDisk').classList.remove('spin-vinyl'); document.getElementById('profileBtn').classList.remove('playing'); } 
            else if(d.isPlaying === true && audio.paused) { audio.play().catch(e=>{}); document.getElementById('vinylDisk').classList.add('spin-vinyl'); document.getElementById('profileBtn').classList.add('playing'); }
        });
    });
}
roomLiveTag.onclick = () => { vibeClick(); if(myJoinedRoomId && joinedRoomUnsub) { joinedRoomUnsub(); myJoinedRoomId = null; roomLiveTag.classList.add('hidden'); audio.pause(); document.getElementById('vinylDisk').classList.remove('spin-vinyl'); document.getElementById('profileBtn').classList.remove('playing'); showToast("Left Room."); } };

// === 💬 7. CHAT UPGRADE (READ RECEIPTS) ===
function startGlobalNotifications() {
    const appLoadTime = Date.now();
    onSnapshot(collection(db, "liveStatus"), (snap) => {
        snap.forEach(docSnap => {
            const partnerId = docSnap.id;
            if(partnerId !== currentUser && !globalChatListeners[partnerId]) {
                const roomID = getRoomID(currentUser, partnerId);
                globalChatListeners[partnerId] = onSnapshot(query(collection(db, `privateChats/${roomID}/messages`), orderBy("timestamp", "desc"), limit(1)), (msgSnap) => {
                    msgSnap.forEach(mDoc => {
                        const msgData = mDoc.data();
                        if(msgData.timestamp > appLoadTime && msgData.sender !== currentUser && currentChatPartner !== partnerId) {
                            document.getElementById('chatBadge').classList.remove('hidden'); showToast(`💬 New msg from ${partnerId}`);
                        }
                    });
                });
            }
        });
    });
}

function autoScrollChat() { const area = document.getElementById('directMessages'); area.scrollTop = area.scrollHeight; }

document.getElementById('btnChatToggle').addEventListener('click', () => {
    vibeClick(); document.getElementById('chatBadge').classList.add('hidden'); document.getElementById('roomWidget').classList.remove('show'); document.getElementById('chatWidget').classList.add('show'); 
    document.querySelectorAll('.dock-item').forEach(el => el.classList.remove('active')); document.getElementById('btnChatToggle').classList.add('active');
    
    if(db) {
        onSnapshot(collection(db, "liveStatus"), (snap) => {
            if(currentChatPartner) return; 
            const list = document.getElementById('onlineUsersList'); list.innerHTML = ''; let count = 0; const frag = document.createDocumentFragment();
            snap.forEach(docSnap => {
                const data = docSnap.data();
                if(docSnap.id !== currentUser) {
                    count++; const isOnline = data.lastSeen > (Date.now() - 60000); const statusClass = isOnline ? 'is-online' : 'is-offline';
                    let badge = isOnline ? `<span class="fm-listener-badge live">Online</span>` : `<span class="fm-listener-badge">${formatLastSeen(data.lastSeen)}</span>`;
                    const item = document.createElement('div'); item.className = `contact-item ${statusClass}`; 
                    item.innerHTML = `<img src="${data.avatar || 'guest.jpg'}"><div style="flex:1;"><h4>${data.displayName || docSnap.id}</h4><p>${badge}</p></div>`;
                    item.onclick = () => openPrivateChat(docSnap.id, data.displayName || docSnap.id, data.avatar); frag.appendChild(item);
                }
            });
            list.appendChild(frag); if(count === 0) list.innerHTML = '<p class="empty-msg" style="text-align:center; margin-top:20px;">No one here 🏜️</p>';
        });
    }
});

document.getElementById('closeChatBtn').addEventListener('click', () => { vibeClick(); document.getElementById('chatWidget').classList.remove('show'); document.getElementById('btnChatToggle').classList.remove('active'); document.getElementById(isPlaylistView ? 'btnPlaylist' : 'btnHome').classList.add('active'); });
document.getElementById('backToContactsBtn').addEventListener('click', () => { vibeClick(); document.getElementById('chatRoomView').classList.add('hidden'); document.getElementById('chatContactsView').classList.remove('hidden'); currentChatPartner = null; if(chatUnsub) chatUnsub(); if(typingUnsub) typingUnsub(); if(partnerStatusUnsub) partnerStatusUnsub();});

function openPrivateChat(partnerId, partnerName, avatar) {
    currentChatPartner = partnerId; document.getElementById('chatContactsView').classList.add('hidden'); document.getElementById('chatRoomView').classList.remove('hidden');
    document.getElementById('chatPartnerName').innerText = partnerName; document.getElementById('chatPartnerAvatar').src = avatar || 'guest.jpg';
    
    if(partnerStatusUnsub) partnerStatusUnsub();
    partnerStatusUnsub = onSnapshot(doc(db, "liveStatus", partnerId), (snap) => {
        const statText = document.getElementById('chatPartnerStatus');
        if(snap.exists()) { const data = snap.data(); const isOnline = data.lastSeen > (Date.now() - 60000); statText.innerText = isOnline ? "Online" : formatLastSeen(data.lastSeen); statText.className = isOnline ? "status-text online" : "status-text"; }
    });

    const roomID = getRoomID(currentUser, partnerId); const area = document.getElementById('directMessages'); area.innerHTML = ''; 
    
    try {
        const cachedChat = localStorage.getItem('chat_' + roomID);
        if(cachedChat) { 
            const frag = document.createDocumentFragment();
            JSON.parse(cachedChat).forEach(m => {
                const div = document.createElement('div'); div.className = `chat-msg ${m.sender === currentUser ? 'mine' : 'them'}`; 
                div.innerHTML = `${m.text} <span class="msg-time">${formatTime(m.timestamp)}</span>`; frag.appendChild(div);
            });
            area.appendChild(frag); autoScrollChat();
        }
    } catch(e) {}

    if(chatUnsub) chatUnsub(); if(typingUnsub) typingUnsub();
    
    if (db) {
        let isInitialLoad = true;
        chatUnsub = onSnapshot(query(collection(db, `privateChats/${roomID}/messages`), orderBy("timestamp", "asc")), (snap) => {
            if(isInitialLoad) {
                area.innerHTML = ''; const msgs = []; const frag = document.createDocumentFragment();
                snap.forEach(d => {
                    const m = d.data(); const docId = d.id; msgs.push(m);
                    if(m.sender !== currentUser && !m.read) { updateDoc(doc(db, `privateChats/${roomID}/messages`, docId), { read: true }).catch(()=>{}); }

                    const div = document.createElement('div'); div.className = `chat-msg ${m.sender === currentUser ? 'mine' : 'them'}`; div.id = `msg-${docId}`;
                    let tickHtml = ''; if(m.sender === currentUser) { tickHtml = m.read ? `<i class="fa-solid fa-check-double" style="color:#00ff88; font-size:10px; margin-left:5px;"></i>` : `<i class="fa-solid fa-check" style="color:#ccc; font-size:10px; margin-left:5px;"></i>`; }
                    div.innerHTML = `${m.text} <span class="msg-time">${formatTime(m.timestamp)}${tickHtml}</span>`; frag.appendChild(div);
                });
                area.appendChild(frag); localStorage.setItem('chat_' + roomID, JSON.stringify(msgs)); autoScrollChat(); isInitialLoad = false;
            } else {
                snap.docChanges().forEach(change => {
                    const m = change.doc.data(); const docId = change.doc.id;
                    if(change.type === 'added') {
                        if(m.sender !== currentUser && !m.read) { updateDoc(doc(db, `privateChats/${roomID}/messages`, docId), { read: true }).catch(()=>{}); }
                        const div = document.createElement('div'); div.className = `chat-msg ${m.sender === currentUser ? 'mine' : 'them'}`; div.id = `msg-${docId}`;
                        let tickHtml = ''; if(m.sender === currentUser) { tickHtml = m.read ? `<i class="fa-solid fa-check-double" style="color:#00ff88; font-size:10px; margin-left:5px;"></i>` : `<i class="fa-solid fa-check" style="color:#ccc; font-size:10px; margin-left:5px;"></i>`; }
                        div.innerHTML = `${m.text} <span class="msg-time">${formatTime(m.timestamp)}${tickHtml}</span>`; area.appendChild(div); autoScrollChat();
                    }
                    if(change.type === 'modified') {
                        const msgEl = document.getElementById(`msg-${docId}`);
                        if(msgEl && m.sender === currentUser && m.read) { const tickEl = msgEl.querySelector('.fa-check'); if(tickEl) { tickEl.className = 'fa-solid fa-check-double'; tickEl.style.color = '#00ff88'; } }
                    }
                });
            }
        });

        typingUnsub = onSnapshot(doc(db, `privateChats/${roomID}/typing`, partnerId), (snap) => {
            const indicator = document.getElementById('typingIndicator'); const status = document.getElementById('chatPartnerStatus');
            if(snap.exists() && snap.data().isTyping) { indicator.classList.remove('hidden'); status.classList.add('hidden');} 
            else { indicator.classList.add('hidden'); status.classList.remove('hidden');}
        });
    }
}

document.getElementById('directChatInput').addEventListener('input', () => {
    if(!currentChatPartner || !db) return; const roomID = getRoomID(currentUser, currentChatPartner);
    setDoc(doc(db, `privateChats/${roomID}/typing`, currentUser), { isTyping: true }); clearTimeout(typingTimer);
    typingTimer = setTimeout(() => { setDoc(doc(db, `privateChats/${roomID}/typing`, currentUser), { isTyping: false }); }, 1500);
});

let isSending = false;
document.getElementById('sendDirectChatBtn').addEventListener('click', async () => {
    if(isSending) return;
    const inp = document.getElementById('directChatInput'); const txt = inp.value.trim();
    if(!txt || !currentChatPartner || !db) return; 
    
    isSending = true;
    const roomID = getRoomID(currentUser, currentChatPartner); const ts = Date.now();
    inp.value = ''; setDoc(doc(db, `privateChats/${roomID}/typing`, currentUser), { isTyping: false });
    
    await addDoc(collection(db, `privateChats/${roomID}/messages`), { sender: currentUser, text: txt, timestamp: ts, read: false });
    setTimeout(() => { isSending = false; }, 500);
});
document.getElementById('directChatInput').addEventListener('keypress', (e) => { if(e.key === 'Enter') document.getElementById('sendDirectChatBtn').click(); });

// === 🧠 8. AI MOOD ENGINE ===
document.querySelectorAll('.mood-chip').forEach(btn => { btn.onclick = () => { vibeClick(); isPlaylistView = false; fetchMusic(btn.getAttribute('data-mood')); showToast(`AI generating ${btn.innerText} vibes...`); }; });
document.getElementById('searchBtn').addEventListener('click', () => { vibeClick(); isPlaylistView = false; const q = document.getElementById('searchInput').value.trim(); if(q) fetchMusic(q); });

document.getElementById('btnHome').addEventListener('click', () => { 
    vibeClick(); isPlaylistView = false; document.getElementById('searchSection').style.display = 'block'; document.getElementById('moodMatrix').style.display = 'flex';
    document.getElementById('listHeading').innerText = "Infinite Discovery"; document.querySelectorAll('.dock-item').forEach(el => el.classList.remove('active')); document.getElementById('btnHome').classList.add('active'); fetchMusic(aiVibes[Math.floor(Math.random() * aiVibes.length)]); 
});
document.getElementById('btnPlaylist').addEventListener('click', () => { 
    vibeClick(); isPlaylistView = true; document.getElementById('searchSection').style.display = 'none'; document.getElementById('moodMatrix').style.display = 'none';
    currentQueue = myPlaylist; renderLibrary(); document.getElementById('listHeading').innerText = "Your Vault";
    document.querySelectorAll('.dock-item').forEach(el => el.classList.remove('active')); document.getElementById('btnPlaylist').classList.add('active');
});

async function updateLiveStatus(isPlaying, song = null) {
    if(!db) return; const ref = doc(db, "liveStatus", currentUser);
    if(isPlaying && song) { await setDoc(ref, { isPlaying: true, songName: song.name, songId: song.id, displayName: currentDisplay, avatar: vipDB[currentUser]?.avatar || "guest.jpg", lastSeen: Date.now() }); } 
    else { await updateDoc(ref, { isPlaying: false, lastSeen: Date.now() }); }
}
setInterval(() => { if(currentUser && db) updateLiveStatus(false); }, 15000);

document.getElementById('openLyricsAreaBtn').addEventListener('click', (e) => {
    if(e.target.closest('.playback-controls') || e.target.closest('.seek-wrapper')) return;
    document.getElementById('lyricsPanel').classList.add('show');
});
document.getElementById('closeLyricsBtn').addEventListener('click', () => document.getElementById('lyricsPanel').classList.remove('show'));

// === 🚨 SAFE BOOT UP LOGIC ===
document.addEventListener('DOMContentLoaded', () => {
    const failsafeTimer = setTimeout(() => {
        document.getElementById('splashScreen').style.display = 'none';
        if(localStorage.getItem('keepMeLoggedIn') && document.getElementById('mainApp').classList.contains('hidden')) {
            document.getElementById('loginScreen').classList.remove('hidden');
        } else if (!localStorage.getItem('keepMeLoggedIn')) {
            document.getElementById('loginScreen').classList.remove('hidden');
        }
    }, 4000);

    try {
        const savedUser = localStorage.getItem('keepMeLoggedIn');
        if (savedUser) {
            const u = savedUser.toLowerCase(); let userData = vipDB[u];
            if (userData) { clearTimeout(failsafeTimer); bootSession(savedUser, false, userData); }
            else {
                if (db) {
                    getDoc(doc(db, "users", u)).then(snap => {
                        clearTimeout(failsafeTimer);
                        if (snap.exists()) { let d = snap.data(); d.displayName = savedUser; bootSession(savedUser, false, d); } 
                        else { document.getElementById('splashScreen').style.display = 'none'; document.getElementById('loginScreen').classList.remove('hidden'); }
                    }).catch(() => { clearTimeout(failsafeTimer); document.getElementById('splashScreen').style.display = 'none'; document.getElementById('loginScreen').classList.remove('hidden'); });
                } else { clearTimeout(failsafeTimer); document.getElementById('splashScreen').style.display = 'none'; document.getElementById('loginScreen').classList.remove('hidden'); }
            }
        } else {
            clearTimeout(failsafeTimer);
            setTimeout(() => { document.getElementById('splashScreen').style.display = 'none'; document.getElementById('loginScreen').classList.remove('hidden'); }, 3500);
        }
    } catch(e) {
        clearTimeout(failsafeTimer);
        document.getElementById('splashScreen').style.display = 'none'; document.getElementById('loginScreen').classList.remove('hidden');
    }
});

document.getElementById('emergencyRescueBtn').addEventListener('click', () => {
    document.getElementById('splashScreen').style.display = 'none';
    if(localStorage.getItem('keepMeLoggedIn')) document.getElementById('mainApp').classList.remove('hidden');
    else document.getElementById('loginScreen').classList.remove('hidden');
});

document.getElementById('toggleRegister').addEventListener('click', () => { vibeClick(); document.getElementById('loginMode').classList.add('hidden'); document.getElementById('registerMode').classList.remove('hidden'); });
document.getElementById('toggleLogin').addEventListener('click', () => { vibeClick(); document.getElementById('registerMode').classList.add('hidden'); document.getElementById('loginMode').classList.remove('hidden'); });
document.getElementById('loginBtn').addEventListener('click', async () => {
    vibeClick(); const rawUser = document.getElementById('username').value.trim(); const p = document.getElementById('password').value.trim();
    if(!rawUser || !p) return showToast("Details toh bharo!"); const u = rawUser.toLowerCase(); 
    document.getElementById('loginBtn').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> LOADING...';
    let userData = vipDB[u];
    if(!userData && db) { try { const snap = await getDoc(doc(db, "users", u)); if(snap.exists()) { userData = snap.data(); userData.displayName = rawUser; } } catch(e) {} }
    if (userData && userData.pass === p) { localStorage.setItem('keepMeLoggedIn', rawUser); bootSession(rawUser, true, userData); } 
    else { document.getElementById('loginError').style.display = 'block'; document.getElementById('loginBtn').innerHTML = 'ENTER UNIVERSE <i class="fa-solid fa-bolt"></i>'; showToast("Galat Password!"); }
});
document.getElementById('registerBtn').addEventListener('click', async () => {
    vibeClick(); const rawUser = document.getElementById('regUsername').value.trim(); const p = document.getElementById('regPassword').value.trim();
    if(!rawUser || !p) return showToast("Details fill karo!"); document.getElementById('registerBtn').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> INITIALIZING...';
    const lowerU = rawUser.toLowerCase();
    if(db) {
        try {
            const snap = await getDoc(doc(db, "users", lowerU));
            if(snap.exists() || vipDB[lowerU]) { showToast("Name already taken!"); document.getElementById('registerBtn').innerHTML = 'INITIALIZE <i class="fa-solid fa-cloud-arrow-up"></i>'; return; }
            await setDoc(doc(db, "users", lowerU), { pass: p, relation: "New Soul", badge: "Explorer", theme: "theme-default", avatar: "guest.jpg" });
            showToast("Registered! Welcome to Universe."); localStorage.setItem('keepMeLoggedIn', rawUser); setTimeout(() => { location.reload(); }, 1500);
        } catch(e) { showToast("Error registering."); document.getElementById('registerBtn').innerHTML = 'INITIALIZE <i class="fa-solid fa-cloud-arrow-up"></i>'; }
    } else { showToast("Firebase Offline!"); document.getElementById('registerBtn').innerHTML = 'INITIALIZE <i class="fa-solid fa-cloud-arrow-up"></i>'; }
});
