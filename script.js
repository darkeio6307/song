/**
 * =========================================================================
 * 🌌 ARSHAD SUPREME ENGINE v20.0 (The Faultless Zenith)
 * Optimized for: Tecno Pova 7
 * FIXED: Scroll Area, Name Mix-up, Sidebar Redesign, Live Status in Chat
 * =========================================================================
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, updateDoc, increment, addDoc, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCnwHn6b2F8O8M-3Elk54tydzqldj78Cxg",
  authDomain: "arshad-music.firebaseapp.com",
  projectId: "arshad-music",
  storageBucket: "arshad-music.firebasestorage.app",
  messagingSenderId: "301555315508",
  appId: "1:301555315508:web:28340660dfbfe2429beb61"
};

let db = null;
try {
    const firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp);
} catch(e) { console.error("Firebase Connect Failed!"); }

// BUG FIX 2: LOWERCASE KEYS FOR STRICT MATCHING
const vipDB = { 
    "dark_eio": { pass: "moh0909", relation: "The Creator", badge: "Universe Lord 👑", theme: "theme-default", avatar: "darkeio.jpg" },
    "muskan": { pass: "Love", relation: "The Life Line", badge: "Queen ❤️", theme: "theme-muskan", avatar: "wife.jpg" },
    "preeti": { pass: "bff", relation: "Purest Friend", badge: "Angel 🤞", theme: "theme-preeti", avatar: "bff.jpg" }
};

const app = document.getElementById('mainApp');
const audio = document.getElementById('audioEngine');
const playBtn = document.getElementById('playBtn');
const fmBroadcastBtn = document.getElementById('fmBroadcastBtn');
const fmLiveTag = document.getElementById('fmLiveTag');

let currentUser = "";
let currentQueue = [];
let myPlaylist = [];
let currentIndex = 0;
let isPlaylistView = false;
let isBroadcastingFM = false;
let isListeningToFM = false;
let currentFMSongId = null; 
let currentChatPartner = null;
let chatUnsub = null;

// Infinite Scroll Engine
let currentPage = 1;
let currentQuery = "Top Hindi Hits";
let isLoadingMore = false;
let hasMoreSongs = true;

function vibeClick() { if(navigator.vibrate) navigator.vibrate(40); }
window.playSong = playSong;
window.toggleFav = toggleFav;

// === 🔐 1. PURE GLASS AUTHENTICATION ===
document.getElementById('loginBtn').onclick = async () => {
    vibeClick();
    const uInput = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value.trim();
    if(!uInput || !p) return showToast("Details toh bharo!");
    
    // Strict Lowercase checking
    const u = uInput.toLowerCase(); 
    
    document.getElementById('loginBtn').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> LOADING...';
    
    let userData = vipDB[u];
    if(!userData && db) {
        try { const snap = await getDoc(doc(db, "users", u)); if(snap.exists()) userData = snap.data(); } catch(e) {}
    }
    
    if (userData && userData.pass === p) {
        // Save exact typed name for display, but use lower for DB
        localStorage.setItem('keepMeLoggedIn', uInput); 
        bootSession(uInput, true);
    } else {
        document.getElementById('loginError').style.display = 'block';
        document.getElementById('loginBtn').innerHTML = 'ENTER <i class="fa-solid fa-bolt"></i>'; 
        showToast("Galat Password!");
    }
};

// === 🌌 2. MASTER SESSION ===
async function bootSession(rawName, showWelcome = false) {
    currentUser = rawName; // Keep capitalization for display
    const lowerName = currentUser.toLowerCase();
    
    document.getElementById('splashScreen').style.display = 'none'; 
    document.getElementById('loginScreen').classList.add('hidden'); 
    app.classList.remove('hidden');

    try {
        let userData = vipDB[lowerName] || (await getDoc(doc(db, "users", lowerName))).data();
        if(userData) {
            document.body.className = userData.theme || "theme-default";
            document.getElementById('userAvatar').src = userData.avatar;
            document.getElementById('sideProfAvatar').src = userData.avatar;
            document.getElementById('userBadge').innerText = userData.badge || "Pro Member";
        }
        
        document.getElementById('userName').innerText = currentUser;
        document.getElementById('profName').innerText = currentUser;

        const hrs = new Date().getHours();
        let greet = hrs < 12 ? "Good Morning," : hrs < 17 ? "Good Afternoon," : hrs < 21 ? "Good Evening," : "Good Night,";
        document.getElementById('timeGreeting').innerText = greet;

        if(showWelcome) {
            if(lowerName === "dark_eio") showToast("Welcome back Lord 👑");
            else if(lowerName === "muskan") showToast("Welcome back Sweetheart ❤️");
            else if(lowerName === "preeti") showToast("Welcome back Angel 🥀");
            else showToast("Welcome back Master 🎧");
        }

        if(lowerName === 'dark_eio') fmBroadcastBtn.classList.remove('hidden');
        
        if (db) {
            const vSnap = await getDoc(doc(db, "vaults", lowerName));
            myPlaylist = vSnap.exists() ? vSnap.data().songs : [];
            document.getElementById('profSongCount').innerText = myPlaylist.length;
            trackAndLoadStats(lowerName);
            listenToGlobalFM(lowerName);
            loadLoveCapsule(lowerName);
            listenToLiveActivity(lowerName); // Feature 4: Live Activity in Chat
        }
        
        fetchMusic(currentQuery); 
        
    } catch(e) { console.log("Booted offline."); fetchMusic("Top Hindi Hits"); }
}

function trackAndLoadStats(lowerName) {
    setInterval(() => { updateDoc(doc(db, "stats", lowerName), { today: increment(1) }).catch(()=>{}); }, 60000);
    onSnapshot(doc(db, "stats", lowerName), (snap) => {
        if(snap.exists()) { document.getElementById('statToday').innerText = snap.data().today || 0; }
        else setDoc(doc(db, "stats", lowerName), { today: 0 });
    });
}

// === 🎶 3. SCROLLING MUSIC ENGINE (Bug 1 Fixed) ===
async function fetchMusic(q, isLoadMore = false) {
    const heading = document.getElementById('listHeading');
    const loader = document.getElementById('infiniteLoader');
    
    if(!isLoadMore) {
        currentPage = 1; currentQuery = q; heading.innerText = "Scanning Galaxy...";
        hasMoreSongs = true; currentQueue = [];
    } else { loader.classList.remove('hidden'); }
    
    isLoadingMore = true;
    try {
        const res = await fetch(`https://saavn.sumit.co/api/search/songs?query=${q}&page=${currentPage}&limit=50`);
        const data = await res.json();
        
        if(data.success && data.data.results.length > 0) {
            const startIndex = currentQueue.length;
            currentQueue = [...currentQueue, ...data.data.results];
            
            if(isLoadMore) appendLibrary(data.data.results, startIndex);
            else { renderLibrary(); heading.innerText = `'${q}' - Infinite Vibes`; }
        } else {
            hasMoreSongs = false;
            if(!isLoadMore) showToast("No matches found.");
        }
    } catch(e) { if(!isLoadMore) showToast("Network Drop!"); }
    
    isLoadingMore = false; loader.classList.add('hidden');
}

function renderLibrary() { document.getElementById('songsList').innerHTML = ''; appendLibrary(currentQueue, 0); }

function appendLibrary(songs, startIndex) {
    const list = document.getElementById('songsList');
    songs.forEach((song, i) => {
        const globalIndex = startIndex + i;
        const div = document.createElement('div');
        div.className = 'song-card glass-widget';
        const isFav = myPlaylist.some(s => s.id === song.id);
        
        div.innerHTML = `<img src="${song.image[2].url}" onclick="playSong(${globalIndex})" loading="lazy">
            <div class="song-info-v2" onclick="playSong(${globalIndex})"><h4>${song.name}</h4><p>${song.artists.primary[0].name}</p></div>
            <button class="fav-btn" style="color:${isFav?'var(--neon-main)':'#555'}" onclick="toggleFav(event, ${globalIndex})"><i class="fa-solid fa-heart"></i></button>`;
        list.appendChild(div);
    });
}

// 🔥 BUG 1 FIX: Infinite Scroll Trigger attached to the new Absolute Container
document.getElementById('musicLibraryContainer').addEventListener('scroll', function() {
    if(isPlaylistView || !hasMoreSongs || isLoadingMore) return; 
    if (this.scrollTop + this.clientHeight >= this.scrollHeight - 100) {
        currentPage++; fetchMusic(currentQuery, true);
    }
});

async function toggleFav(e, globalIndex) {
    vibeClick(); e.stopPropagation();
    const song = currentQueue[globalIndex];
    const idx = myPlaylist.findIndex(s => s.id === song.id);
    if(idx > -1) { myPlaylist.splice(idx, 1); showToast("Removed from Vault"); } 
    else { myPlaylist.push(song); showToast("Saved to Vault ❤️"); }
    if(db) await setDoc(doc(db, "vaults", currentUser.toLowerCase()), { songs: myPlaylist });
    document.getElementById('profSongCount').innerText = myPlaylist.length;
    if(isPlaylistView) renderLibrary(); else e.currentTarget.style.color = (idx > -1) ? '#555' : 'var(--neon-main)';
}

function playSong(i) {
    currentIndex = i; const song = currentQueue[i];
    
    document.getElementById('playerTitle').innerText = song.name;
    document.getElementById('playerArtist').innerText = song.artists.primary[0].name;
    document.getElementById('playerCover').src = song.image[1].url;
    document.getElementById('bgAura').style.background = `url(${song.image[1].url})`; document.getElementById('bgAura').style.backgroundSize = "cover";
    
    audio.src = song.downloadUrl[4].url; audio.volume = 1; audio.play();
    document.getElementById('vinylDisk').classList.add('spin-vinyl');
    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    document.getElementById('eqBars').classList.remove('hidden');

    const lowerName = currentUser.toLowerCase();
    if(lowerName !== "muskan" && db) checkLoveCapsule(song, lowerName);
    if(isBroadcastingFM && lowerName === 'dark_eio' && db) broadcastFM(song, true, lowerName);
    if(db) updateLiveStatus(true, song, lowerName);
}

// === 🎧 4. PLAYER CONTROLS ===
playBtn.onclick = () => {
    vibeClick(); const lowerName = currentUser.toLowerCase();
    if(audio.paused) {
        audio.play(); playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>'; document.getElementById('vinylDisk').classList.add('spin-vinyl');
        if(isBroadcastingFM && db) broadcastFM(currentQueue[currentIndex], true, lowerName);
        if(db) updateLiveStatus(true, currentQueue[currentIndex], lowerName);
    } else {
        audio.pause(); playBtn.innerHTML = '<i class="fa-solid fa-play"></i>'; document.getElementById('vinylDisk').classList.remove('spin-vinyl');
        if(isBroadcastingFM && db) broadcastFM(currentQueue[currentIndex], false, lowerName);
        if(db) updateLiveStatus(false, null, lowerName);
    }
};

document.getElementById('nextBtn').onclick = () => { vibeClick(); audio.onended(); };
document.getElementById('prevBtn').onclick = () => { vibeClick(); if(currentIndex > 0) playSong(currentIndex - 1); };

audio.onended = () => {
    if(isPlaylistView) { if(currentIndex < currentQueue.length - 1) playSong(currentIndex + 1); else playSong(0); } 
    else { showToast("AI selecting vibe..."); const m = ["Arijit Singh", "Lofi Sad", "Trending Reel"]; fetchMusic(m[Math.floor(Math.random()*m.length)]); }
};

audio.ontimeupdate = () => { 
    if(!isNaN(audio.duration)) { 
        seekSlider.value = (audio.currentTime/audio.duration)*100; 
        document.getElementById('timeCurrent').innerText = fmtTime(audio.currentTime); 
        document.getElementById('timeTotal').innerText = fmtTime(audio.duration); 
        if (audio.duration - audio.currentTime < 4 && audio.volume > 0.05) audio.volume -= 0.02; 
    } 
};
seekSlider.oninput = () => audio.currentTime = (seekSlider.value/100)*audio.duration;
function fmtTime(s) { let m = Math.floor(s/60); let sec = Math.floor(s%60); return `${m}:${sec<10?'0'+sec:sec}`; }

// === 🎙️ 5. MIC VOICE DJ ===
if ('webkitSpeechRecognition' in window) {
    const rec = new webkitSpeechRecognition(); rec.lang = 'hi-IN';
    micBtn.onclick = () => { vibeClick(); rec.start(); micBtn.style.color = '#ff0055'; };
    rec.onresult = (e) => { document.getElementById('searchInput').value = e.results[0][0].transcript; document.getElementById('searchBtn').click(); micBtn.style.color = 'var(--neon-main)'; };
    rec.onerror = () => micBtn.style.color = 'var(--neon-main)';
}

// === 📡 6. FM KILL SWITCH & SYNC ===
fmBroadcastBtn.onclick = () => {
    vibeClick(); isBroadcastingFM = !isBroadcastingFM;
    fmBroadcastBtn.style.color = isBroadcastingFM ? "#00ff88" : "#fff";
    if(isBroadcastingFM) { showToast("📡 FM Broadcast: LIVE!"); if(currentQueue[currentIndex]) broadcastFM(currentQueue[currentIndex], !audio.paused, currentUser.toLowerCase()); } 
    else { if(db) setDoc(doc(db, "fm", "globalRadio"), { isLive: false }); showToast("📡 Broadcast Ended."); }
};

async function broadcastFM(song, isPlayingStatus, lowerName) {
    await setDoc(doc(db, "fm", "globalRadio"), {
        isLive: true, host: currentUser, songId: song.id, songName: song.name, cover: song.image[2].url, audio: song.downloadUrl[4].url, artist: song.artists.primary[0].name, isPlaying: isPlayingStatus, timestamp: Date.now()
    });
}

function listenToGlobalFM(lowerName) {
    onSnapshot(doc(db, "fm", "globalRadio"), (snap) => {
        const d = snap.data();
        if(d && d.isLive && d.host.toLowerCase() !== lowerName) {
            fmLiveTag.classList.remove('hidden'); fmLiveTag.innerHTML = `<i class="fa-solid fa-tower-broadcast fade-blink"></i> <span>${d.host}'s Live FM</span>`;
            currentFMSongId = d.songId; 
            
            if (isListeningToFM) {
                if (audio.src !== d.audio) { const s = { id: d.songId, name: d.songName, artists: { primary: [{ name: d.artist }] }, image: [{},{},{url: d.cover}], downloadUrl: [{},{},{},{},{url: d.audio}] }; currentQueue = [s]; playSong(0); }
                if(d.isPlaying === false && !audio.paused) { audio.pause(); playBtn.innerHTML = '<i class="fa-solid fa-play"></i>'; document.getElementById('vinylDisk').classList.remove('spin-vinyl'); } 
                else if(d.isPlaying === true && audio.paused) { audio.play(); playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>'; document.getElementById('vinylDisk').classList.add('spin-vinyl'); }
            }

            fmLiveTag.onclick = () => {
                if(!isListeningToFM) {
                    isListeningToFM = true; fmLiveTag.style.color = "#00ff88"; 
                    const s = { id: d.songId, name: d.songName, artists: { primary: [{ name: d.artist }] }, image: [{},{},{url: d.cover}], downloadUrl: [{},{},{},{},{url: d.audio}] };
                    currentQueue = [s]; playSong(0); if(!d.isPlaying) setTimeout(()=>{ audio.pause(); }, 500);
                } else { isListeningToFM = false; fmLiveTag.style.color = "#ff3366"; audio.pause(); }
            };
        } else {
            fmLiveTag.classList.add('hidden'); currentFMSongId = null;
            if(isListeningToFM) { isListeningToFM = false; audio.pause(); playBtn.innerHTML = '<i class="fa-solid fa-play"></i>'; showToast("Host ended broadcast."); }
        }
    });
}

// === 👥 7. LIVE ACTIVITY (IN CHAT) ===
function listenToLiveActivity(lowerName) {
    onSnapshot(collection(db, "liveStatus"), (snap) => {
        const container = document.getElementById('liveStoriesContainer'); container.innerHTML = '';
        let activeCount = 0;
        
        snap.forEach(docSnap => {
            const data = docSnap.data();
            const timeLimit = Date.now() - (60 * 1000); 
            if(docSnap.id !== lowerName && data.isPlaying && data.lastSeen > timeLimit) {
                activeCount++;
                const item = document.createElement('div'); item.className = 'story-item';
                item.innerHTML = `<div class="story-ring"><img src="${data.avatar || 'guest.jpg'}"></div><p>${docSnap.id}</p>`;
                item.onclick = () => {
                    const syncSong = { id: data.songId, name: data.songName, artists: { primary: [{ name: "VIP Sync" }] }, image: [{},{},{url: data.avatar}], downloadUrl: [{},{},{},{},{url: data.audio}] };
                    currentQueue = [syncSong]; playSong(0); showToast(`Tuned into ${docSnap.id}'s Vibe`);
                };
                container.appendChild(item);
            }
        });
        // Hide container if no one is live
        if(activeCount === 0) container.innerHTML = '<p class="empty-msg" style="width:100%; text-align:center; font-size:10px;">Cosmos is quiet...</p>';
    });
}

// === 💬 8. WHATSAPP CHAT (Bug 4 Fixed - Direct HTML Onclick) ===
function loadOnlineUsersForChat(lowerName) {
    onSnapshot(collection(db, "liveStatus"), (snap) => {
        if(currentChatPartner) return; 
        const list = document.getElementById('onlineUsersList'); list.innerHTML = '';
        let count = 0;
        snap.forEach(docSnap => {
            const data = docSnap.data();
            if(docSnap.id !== lowerName && data.lastSeen > (Date.now() - 60000)) {
                count++;
                const isListener = (data.songId === currentFMSongId && currentFMSongId != null);
                const badge = isListener ? `<span style="font-size:9px; background:var(--neon-main); padding:2px 5px; border-radius:5px; color:#000;">🎧 Listening to You</span>` : `<span style="font-size:10px; color:#00ff88;">🟢 Online</span>`;
                const item = document.createElement('div'); item.className = 'contact-item';
                item.innerHTML = `<img src="${data.avatar || 'guest.jpg'}"><div style="flex:1;"><h4>${docSnap.id}</h4><p>${badge}</p></div>`;
                item.onclick = () => openPrivateChat(docSnap.id, data.avatar, lowerName);
                list.appendChild(item);
            }
        });
        if(count === 0) list.innerHTML = '<p class="empty-msg" style="text-align:center; margin-top:20px;">No one online 🏜️</p>';
    });
}

// Initialize chat data when chat widget is opened via HTML onclick
document.getElementById('btnChatToggle').addEventListener('click', () => {
    vibeClick(); document.querySelectorAll('.dock-item').forEach(el => el.classList.remove('active')); document.getElementById('btnChatToggle').classList.add('active');
    if(db) loadOnlineUsersForChat(currentUser.toLowerCase());
});

document.getElementById('backToContactsBtn').onclick = () => {
    vibeClick(); document.getElementById('chatRoomView').classList.add('hidden'); document.getElementById('chatContactsView').classList.remove('hidden');
    currentChatPartner = null; if(chatUnsub) chatUnsub();
};

function openPrivateChat(partner, avatar, lowerName) {
    currentChatPartner = partner;
    document.getElementById('chatContactsView').classList.add('hidden'); document.getElementById('chatRoomView').classList.remove('hidden');
    document.getElementById('chatPartnerName').innerText = partner; document.getElementById('chatPartnerAvatar').src = avatar || 'guest.jpg';
    
    const roomID = [lowerName, partner].sort().join("_");
    if(chatUnsub) chatUnsub();
    
    if (db) {
        chatUnsub = onSnapshot(query(collection(db, `privateChats/${roomID}/messages`), orderBy("timestamp", "asc")), (snap) => {
            const area = document.getElementById('directMessages'); area.innerHTML = '';
            snap.forEach(d => {
                const m = d.data(); const div = document.createElement('div'); div.className = `chat-msg ${m.sender === lowerName ? 'mine' : 'them'}`; div.innerHTML = m.text; area.appendChild(div);
            });
            area.scrollTop = area.scrollHeight;
        });
    }
}

document.getElementById('sendDirectChatBtn').onclick = async () => {
    const inp = document.getElementById('directChatInput');
    if(!inp.value.trim() || !currentChatPartner || !db) return;
    const lowerName = currentUser.toLowerCase();
    const roomID = [lowerName, currentChatPartner].sort().join("_");
    await addDoc(collection(db, `privateChats/${roomID}/messages`), { sender: lowerName, text: inp.value.trim(), timestamp: Date.now() });
    inp.value = '';
};

// === 🧠 9. AI MOOD ENGINE & UI ===
document.querySelectorAll('.mood-chip').forEach(btn => {
    btn.onclick = () => { vibeClick(); isPlaylistView = false; fetchMusic(btn.getAttribute('data-mood')); showToast(`AI generating ${btn.innerText} vibes...`); };
});

document.getElementById('searchBtn').onclick = () => { vibeClick(); isPlaylistView = false; const q = searchInput.value.trim(); if(q) fetchMusic(q); };

document.getElementById('btnHome').onclick = () => { 
    vibeClick(); isPlaylistView = false; 
    document.getElementById('musicLibraryContainer').style.display = 'block'; 
    document.getElementById('moodMatrix').style.display = 'flex';
    document.getElementById('searchSection').style.display = 'block';
    document.querySelectorAll('.dock-item').forEach(el => el.classList.remove('active')); document.getElementById('btnHome').classList.add('active');
    fetchMusic("Top Trending Hits"); 
};
document.getElementById('btnPlaylist').onclick = () => { 
    vibeClick(); isPlaylistView = true; 
    document.getElementById('moodMatrix').style.display = 'none'; document.getElementById('searchSection').style.display = 'none';
    currentQueue = myPlaylist; renderLibrary(); document.getElementById('listHeading').innerText = "Personal Cloud Vault";
    document.querySelectorAll('.dock-item').forEach(el => el.classList.remove('active')); document.getElementById('btnPlaylist').classList.add('active');
};

async function updateLiveStatus(isPlaying, song = null, lowerName) {
    if(isBroadcastingFM || !db) return; 
    const ref = doc(db, "liveStatus", lowerName);
    if(isPlaying && song) { await setDoc(ref, { isPlaying: true, songName: song.name, songId: song.id, avatar: vipDB[lowerName]?.avatar || "guest.jpg", lastSeen: Date.now() }); } 
    else { await updateDoc(ref, { isPlaying: false, lastSeen: Date.now() }); }
}
setInterval(() => { if(currentUser && db) updateLiveStatus(false, null, currentUser.toLowerCase()); }, 15000);

function loadLoveCapsule(lowerName) {
    if (!db) return;
    onSnapshot(query(collection(db, "loveCapsule"), orderBy("timestamp", "desc"), limit(5)), (snap) => {
        const list = document.getElementById('capsuleList'); list.innerHTML = '';
        snap.forEach(d => {
            if(d.data().couple.includes(lowerName) || d.data().couple.includes("Muskan")) {
                const div = document.createElement('div'); div.className = 'capsule-item'; div.innerHTML = `<strong>${d.data().songName}</strong> Saath suna gaya ❤️`; list.appendChild(div);
            }
        });
    });
}
async function checkLoveCapsule(song, lowerName) {
    if (!db) return;
    const snap = await getDoc(doc(db, "liveStatus", "muskan"));
    if(snap.exists() && snap.data().isPlaying && snap.data().songId === song.id) {
        await addDoc(collection(db, "loveCapsule"), { couple: [lowerName, "muskan"], songName: song.name, date: new Date().toLocaleDateString(), timestamp: Date.now() });
    }
}

document.getElementById('logoutBtn').onclick = () => { localStorage.clear(); location.reload(); };
function showToast(m) { const t = document.getElementById('toast'); t.innerText = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3500); }
