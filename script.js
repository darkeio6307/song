// === 1. FIREBASE SETUP & IMPORTS ===
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

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// === 2. VIP DATABASE ===
const vipDB = { 
    "dark_eio": { pass: "moh0909", relation: "The Creator 👑", theme: "theme-default", themeName: "Dark Neon", avatar: "darkeio.jpg" },
    "Muskan": { pass: "Love", relation: "Wife ❤️", theme: "theme-muskan", themeName: "Romantic Rose", avatar: "wife.jpg" },
    "Preeti": { pass: "bff", relation: "pure Best friend 🤞", theme: "theme-preeti", themeName: "BFF Vibes", avatar: "bff.jpg" }
};

// Elements
const splash = document.getElementById('splashScreen');
const login = document.getElementById('loginScreen');
const app = document.getElementById('mainApp');
const audio = document.getElementById('audioEngine');
const playBtn = document.getElementById('playBtn');
const seekSlider = document.getElementById('seekSlider');
const vinylDisk = document.getElementById('vinylDisk');
const visualizer = document.getElementById('eqBars');
const songsList = document.getElementById('songsList');
const searchInput = document.getElementById('searchInput');
const bgAura = document.getElementById('bgAura');
const notesContainer = document.getElementById('notesContainer');
const liveActivityArea = document.getElementById('liveActivityArea');
const liveStoriesContainer = document.getElementById('liveStoriesContainer');
const profileSidebar = document.getElementById('profileSidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

// Chat & Lyrics Elements
const chatWidget = document.getElementById('chatWidget');
const openChatBtn = document.getElementById('openChatBtn');
const lyricsPanel = document.getElementById('lyricsPanel');
const proPlayerArea = document.querySelector('.pro-player'); 

// Globals
let currentUser = "";
let currentQueue = []; 
let myPlaylist = []; 
let currentIndex = 0;
let isPlaylistView = false; // 🔥 ये बताएगा कि तू Vault में है या नहीं
let noteInterval;
let sessionSeconds = 0;

window.playSong = playSong;
window.toggleFav = toggleFav;

// === 🛑 AUTO-LOGIN & SAFETY VALVE ===
window.onload = async () => {
    const savedUser = localStorage.getItem('keepMeLoggedIn');
    const safetyValve = setTimeout(() => {
        if (splash && !splash.classList.contains('hidden')) {
            splash.classList.add('hidden');
            if (savedUser) app.classList.remove('hidden');
            else login.classList.remove('hidden');
        }
    }, 5000);

    if (savedUser) {
        showToast("ख़ुश-आमदीद, मेरे आका...");
        await initializeUserSession(savedUser);
        clearTimeout(safetyValve);
    } else {
        setTimeout(() => { splash.classList.add('hidden'); login.classList.remove('hidden'); clearTimeout(safetyValve); }, 3000);
    }
};

// === 3. CORE LOGIN & REGISTER (Error Logging Fixed) ===
document.getElementById('toggleRegister').onclick = () => { 
    document.getElementById('loginMode').classList.add('hidden'); 
    document.getElementById('registerMode').classList.remove('hidden'); 
    document.getElementById('loginTitle').innerText = 'NEW REGISTRATION'; 
};
document.getElementById('toggleLogin').onclick = () => { 
    document.getElementById('registerMode').classList.add('hidden'); 
    document.getElementById('loginMode').classList.remove('hidden'); 
    document.getElementById('loginTitle').innerText = 'ELITE PORTAL'; 
};

document.getElementById('registerBtn').onclick = async () => {
    const u = document.getElementById('regUsername').value.trim();
    const p = document.getElementById('regPassword').value.trim();
    if(!u || !p) { showToast("नाम और पासवर्ड भरें!"); return; }
    
    const btn = document.getElementById('registerBtn');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    
    try {
        const userRef = doc(db, "users", u.toLowerCase());
        const checkSnap = await getDoc(userRef);
        if(checkSnap.exists()) { 
            showToast("ये नाम पहले से मौजूद है!"); 
        } else {
            await setDoc(userRef, { pass: p, relation: "Music Lover 🎵", theme: "theme-guest", themeName: "Minimal Green", avatar: "guest.jpg" });
            showToast("अकाउंट बन गया! अब लॉग-इन करें।");
            document.getElementById('toggleLogin').click();
        }
    } catch(e) { 
        console.error(e); 
        showToast("Database Locked! Firebase Rules चेक कर।"); 
    }
    
    btn.innerHTML = 'REGISTER <i class="fa-solid fa-cloud-arrow-up"></i>';
};

document.getElementById('loginBtn').onclick = async () => {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value.trim();
    if(!u || !p) return;
    document.getElementById('loginBtn').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    
    let userData = vipDB[u] || (await getDoc(doc(db, "users", u.toLowerCase()))).data();
    if (userData && userData.pass === p) { localStorage.setItem('keepMeLoggedIn', u); await initializeUserSession(u); } 
    else { document.getElementById('loginError').style.display = 'block'; document.getElementById('loginBtn').innerHTML = 'INITIALIZE <i class="fa-solid fa-bolt"></i>'; }
};

async function initializeUserSession(u) {
    currentUser = u;
    try {
        let userData = vipDB[currentUser] || (await getDoc(doc(db, "users", currentUser.toLowerCase()))).data();
        document.body.className = userData.theme;
        const vaultSnap = await getDoc(doc(db, "vaults", currentUser));
        myPlaylist = vaultSnap.exists() ? vaultSnap.data().songs : [];
        const statsRef = doc(db, "stats", currentUser);
        const statsSnap = await getDoc(statsRef);
        if (!statsSnap.exists()) await setDoc(statsRef, { today: 0, week: 0, month: 0 });

        document.getElementById('userName').innerText = currentUser;
        document.getElementById('userAvatar').src = userData.avatar;
        document.getElementById('sideProfAvatar').src = userData.avatar;
        document.getElementById('profName').innerText = currentUser;
        
        updateProfileBadge(statsSnap.exists() ? statsSnap.data().month : 0);
        document.getElementById('profSongCount').innerText = myPlaylist.length;
        updateTimeGreeting();

        splash.classList.add('hidden');
        login.classList.add('hidden');
        app.classList.remove('hidden');
        
        startCloudTimer(); listenToLiveActivity(); loadVibeChat(); 
        fetchMusic("Top Lofi Hindi");
    } catch (e) { console.error(e); }
}

function updateTimeGreeting() {
    const hours = new Date().getHours();
    let greeting = hours < 12 ? "Good Morning," : hours < 17 ? "Good Afternoon," : "Good Evening,";
    const greetElement = document.getElementById('timeGreeting');
    if(greetElement) greetElement.innerText = greeting;
}

function updateProfileBadge(minutes) {
    const badgeEl = document.getElementById('userBadge') || createBadgeElement();
    if(minutes > 600) badgeEl.innerHTML = '<i class="fa-solid fa-crown"></i> Music Lord';
    else if(minutes > 120) badgeEl.innerHTML = '<i class="fa-solid fa-fire"></i> Vibe Master';
    else badgeEl.innerHTML = '<i class="fa-solid fa-headphones"></i> Rookie';
}
function createBadgeElement() {
    const badge = document.createElement('div');
    badge.id = 'userBadge'; badge.className = 'user-badge';
    document.getElementById('profName').after(badge);
    return badge;
}

// === 4. CLOUD STATS & LIVE ACTIVITY ===
function startCloudTimer() {
    updateStatsUI();
    setInterval(async () => {
        sessionSeconds++;
        if (sessionSeconds % 5 === 0 && !audio.paused) updateLiveStatus(true, currentQueue[currentIndex]);
        if (sessionSeconds % 60 === 0) {
            const statsRef = doc(db, "stats", currentUser);
            await updateDoc(statsRef, { today: increment(1), week: increment(1), month: increment(1) });
            updateStatsUI();
        }
    }, 1000);
}

async function updateStatsUI() {
    const statsSnap = await getDoc(doc(db, "stats", currentUser));
    if (statsSnap.exists()) {
        const d = statsSnap.data();
        document.getElementById('statToday').innerText = `${d.today}m`;
        document.getElementById('statWeek').innerText = `${Math.floor(d.week/60)}h ${d.week%60}m`;
        document.getElementById('statMonth').innerText = `${Math.floor(d.month/60)}h ${d.month%60}m`;
        updateProfileBadge(d.month);
    }
}

function listenToLiveActivity() {
    onSnapshot(collection(db, "liveStatus"), (snap) => {
        liveStoriesContainer.innerHTML = '';
        let hasLive = false;
        const timeLimit = Date.now() - (10 * 1000); 

        snap.forEach((docSnap) => {
            const user = docSnap.id;
            const data = docSnap.data();
            if (user !== currentUser && data.isPlaying && data.lastSeen > timeLimit) {
                hasLive = true;
                const story = document.createElement('div');
                story.className = 'story-item';
                story.innerHTML = `<div class="story-ring"><img src="${data.avatar}"></div><p>${user}</p><span>${data.songName}</span>`;
                story.onclick = () => {
                    showToast(`Synced with ${user}'s Vibe! 🎧`); 
                    const fakeSong = { id: data.songId, name: data.songName, artists: { primary: [{ name: data.artist }] }, image: [{},{},{url: data.cover}], downloadUrl: [{},{},{},{},{url: data.audio}] };
                    currentQueue = [fakeSong]; playSong(0);
                };
                liveStoriesContainer.appendChild(story);
            }
        });
        liveActivityArea.classList.toggle('hidden', !hasLive);
    });
}

async function updateLiveStatus(isPlaying, song = null) {
    const ref = doc(db, "liveStatus", currentUser);
    if(isPlaying && song) {
        await setDoc(ref, { isPlaying: true, songName: song.name, artist: song.artists.primary[0].name, cover: song.image[2].url, audio: song.downloadUrl[4].url, songId: song.id, avatar: vipDB[currentUser]?.avatar || "guest.jpg", lastSeen: Date.now() });
    } else { await updateDoc(ref, { isPlaying: false, lastSeen: 0 }); }
}

// === 💬 VIBE CHAT SYSTEM ===
function loadVibeChat() {
    if(!chatWidget) return;
    const chatMessages = document.getElementById('chatMessages');
    const q = query(collection(db, "globalChat"), orderBy("timestamp", "desc"), limit(50));
    
    onSnapshot(q, (snap) => {
        const msgs = [];
        snap.forEach(doc => msgs.push(doc.data()));
        chatMessages.innerHTML = '';
        msgs.reverse().forEach(m => {
            const d = document.createElement('div');
            d.className = `chat-msg ${m.sender === currentUser ? 'mine' : ''}`;
            d.innerHTML = `<span>${m.sender}</span>${m.text}`;
            chatMessages.appendChild(d);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });

    document.getElementById('sendChatBtn').onclick = async () => {
        const input = document.getElementById('chatInput');
        const text = input.value.trim();
        if(!text) return;
        input.value = '';
        await addDoc(collection(db, "globalChat"), { sender: currentUser, text: text, timestamp: Date.now() });
    };

    document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('sendChatBtn').click();
    });
}

if(openChatBtn) openChatBtn.onclick = () => { chatWidget.classList.add('show'); lyricsPanel.classList.remove('show'); };
if(document.getElementById('closeChatBtn')) document.getElementById('closeChatBtn').onclick = () => chatWidget.classList.remove('show');

// === 🎤 LYRICS SYSTEM ===
if(proPlayerArea) {
    proPlayerArea.addEventListener('click', (e) => {
        if(e.target.closest('.playback-controls') || e.target.closest('.seek-wrapper')) return;
        lyricsPanel.classList.add('show');
        chatWidget.classList.remove('show');
    });
}
if(document.getElementById('closeLyricsBtn')) document.getElementById('closeLyricsBtn').onclick = () => lyricsPanel.classList.remove('show');

// === 5. MUSIC ENGINE & PURE AI MODE 🔥 ===
async function fetchMusic(q) {
    const heading = document.getElementById('listHeading');
    if(heading) heading.innerText = "Scanning...";
    try {
        const res = await fetch(`https://saavn.sumit.co/api/search/songs?query=${q}`);
        const data = await res.json();
        if(data.success) { 
            currentQueue = data.data.results; 
            currentIndex = 0; 
            renderLibrary(); 
            if(heading) heading.innerText = `'${q}' Results`; 
        }
    } catch (e) { showToast("Network Error"); }
}

function renderLibrary() {
    songsList.innerHTML = '';
    currentQueue.forEach((song, i) => {
        const div = document.createElement('div');
        div.className = 'song-card glass-widget';
        const isFav = myPlaylist.some(s => s.id === song.id);
        div.innerHTML = `<img src="${song.image[2].url}" onclick="playSong(${i})"><div class="song-info-v2" onclick="playSong(${i})"><h4>${song.name}</h4><p>${song.artists.primary[0].name}</p></div><button class="fav-btn" style="color:${isFav?'var(--neon-main)':'#888'}" onclick="toggleFav(event, ${i})"><i class="fa-${isFav?'solid':'regular'} fa-heart"></i></button>`;
        songsList.appendChild(div);
    });
}

async function toggleFav(e, i) {
    e.stopPropagation();
    const song = currentQueue[i];
    const idx = myPlaylist.findIndex(s => s.id === song.id);
    if(idx > -1) { myPlaylist.splice(idx, 1); showToast("Removed from Cloud ☁️"); }
    else { myPlaylist.push(song); showToast("Saved to Cloud ☁️❤️"); }
    await setDoc(doc(db, "vaults", currentUser), { songs: myPlaylist });
    document.getElementById('profSongCount').innerText = myPlaylist.length;
    if(isPlaylistView) renderLibrary();
}

function playSong(i) {
    currentIndex = i; const song = currentQueue[i];
    document.getElementById('playerTitle').innerText = song.name;
    document.getElementById('playerArtist').innerText = song.artists.primary[0].name;
    document.getElementById('playerCover').src = song.image[1].url;
    audio.src = song.downloadUrl[4].url; audio.play();
    updatePlayState(true); updateLiveStatus(true, song);
    
    const lText = document.querySelector('.lyrics-text');
    if(lText) lText.innerHTML = `Vibing to <br><span style="color:var(--neon-main)">${song.name}</span><br>by ${song.artists.primary[0].name}`;
}

function updatePlayState(playing) {
    playBtn.innerHTML = playing ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
    vinylDisk.classList.toggle('spin-vinyl', playing);
    visualizer.classList.toggle('hidden', !playing);
    bgAura.classList.toggle('beat-sync', playing);
    if(playing && !noteInterval) noteInterval = setInterval(() => {
        const n = document.createElement('i'); n.className = 'fa-solid fa-music music-note'; n.style.left = `${Math.random()*40}px`;
        notesContainer.appendChild(n); setTimeout(() => n.remove(), 2000);
    }, 800);
    else if(!playing) { clearInterval(noteInterval); noteInterval = null; }
}

playBtn.onclick = () => { if(audio.paused && currentQueue.length) { audio.play(); updatePlayState(true); updateLiveStatus(true, currentQueue[currentIndex]); } else { audio.pause(); updatePlayState(false); updateLiveStatus(false); } };

// 🔥 HAR BAAR AI (EXCEPT PLAYLIST) 🔥
audio.onended = () => {
    if (isPlaylistView) {
        if (currentIndex < currentQueue.length - 1) playSong(currentIndex + 1);
        else playSong(0); // Playlist khatam hone par wapas shuru
    } else {
        showToast("AI is cooking next vibe... 🤖✨"); 
        playRandomAISong();
    }
};

document.getElementById('nextBtn').onclick = () => {
    if (isPlaylistView) {
        if (currentIndex < currentQueue.length - 1) playSong(currentIndex + 1);
        else playSong(0);
    } else {
        showToast("AI is cooking next vibe... 🤖✨"); 
        playRandomAISong();
    }
};

document.getElementById('prevBtn').onclick = () => { if (currentIndex > 0) playSong(currentIndex - 1); };

async function playRandomAISong() {
    const moods = ["Midnight Lofi", "Slowed Hindi Reverb", "Deep Focus House", "Arijit Singh Chill", "Coke Studio India"];
    const randomMood = moods[Math.floor(Math.random() * moods.length)];
    try {
        const res = await fetch(`https://saavn.sumit.co/api/search/songs?query=${randomMood}`);
        const data = await res.json();
        if(data.success) {
            const newSong = data.data.results[Math.floor(Math.random() * data.data.results.length)];
            // AI naya gana uthayega aur wahi bajayega!
            currentQueue = [newSong, ...currentQueue]; currentIndex = 0; renderLibrary(); playSong(0); showToast(`AI Choice: ${newSong.name} 🎧`);
        }
    } catch (e) { playSong(0); }
}

audio.ontimeupdate = () => { if(!isNaN(audio.duration)) { seekSlider.value = (audio.currentTime/audio.duration)*100; document.getElementById('timeCurrent').innerText = formatTime(audio.currentTime); document.getElementById('timeTotal').innerText = formatTime(audio.duration); } };
seekSlider.oninput = () => audio.currentTime = (seekSlider.value/100)*audio.duration;
function formatTime(s) { let m = Math.floor(s/60); let sec = Math.floor(s%60); return `${m}:${sec<10?'0'+sec:sec}`; }

// UI Helpers (yahan se isPlaylistView control ho raha hai)
document.getElementById('profileBtn').onclick = () => { profileSidebar.classList.add('open'); sidebarOverlay.classList.add('show'); };
document.getElementById('closeProfileBtn').onclick = () => { profileSidebar.classList.remove('open'); sidebarOverlay.classList.remove('show'); };
document.getElementById('logoutBtn').onclick = () => { localStorage.removeItem('keepMeLoggedIn'); updateLiveStatus(false); location.reload(); };

document.getElementById('btnHome').onclick = () => { 
    isPlaylistView = false; // 🔥 Home pe aate hi AI mode ON
    document.getElementById('searchSection').style.display = 'block'; 
    fetchMusic("Trending Hindi"); 
};
document.getElementById('btnPlaylist').onclick = () => { 
    isPlaylistView = true;  // 🔥 Playlist me jate hi normal mode ON
    document.getElementById('searchSection').style.display = 'none'; 
    currentQueue = myPlaylist; 
    renderLibrary(); 
};
document.getElementById('searchBtn').onclick = () => { 
    isPlaylistView = false; // 🔥 Search karte hi AI mode ON
    if(searchInput.value) fetchMusic(searchInput.value); 
};

document.addEventListener('click', (e) => {
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
    const r = document.createElement('div'); r.className = 'touch-ripple'; r.style.left = `${e.clientX-20}px`; r.style.top = `${e.clientY-20}px`;
    document.body.appendChild(r); setTimeout(() => r.remove(), 600);
});

window.onbeforeunload = () => updateLiveStatus(false);

function showToast(m) {
    let t = document.getElementById('toast');
    if(!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast-popup'; document.body.appendChild(t); }
    t.innerText = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000);
}
