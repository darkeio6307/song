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
const chatWidget = document.getElementById('chatWidget');
const openChatBtn = document.getElementById('openChatBtn');
const lyricsPanel = document.getElementById('lyricsPanel');
const proPlayerArea = document.querySelector('.pro-player');

// Pro Features Elements
const micBtn = document.getElementById('micBtn');
const sleepTimerBtn = document.getElementById('sleepTimerBtn');
const fmBroadcastBtn = document.getElementById('fmBroadcastBtn');
const fmLiveTag = document.getElementById('fmLiveTag');
const dailyMixBanner = document.getElementById('dailyMixBanner');

// Globals
let currentUser = "";
let currentQueue = []; 
let myPlaylist = []; 
let currentIndex = 0;
let isPlaylistView = false; 
let sessionSeconds = 0;
let sleepTimeout = null;
let isBroadcastingFM = false;
let fmListenerUnsubscribe = null;

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

    let msg = "";

    switch(savedUser.toLowerCase()) {

        case "dark_eio":
            msg = "Welcome back Lord 👑";
            break;

        case "muskan":
            msg = "Welcome back Sweetheart ❤️";
            break;

        case "preeti":
            msg = "Welcome back Angel 🥀";
            break;

        default:
            msg = "Welcome back Listener 🎧";
    }

    showToast(msg);

} else {
    // 🔥 completely new user (no login yet)
    showToast("Welcome Listener 🎧");
    }
};

// === 3. CORE LOGIN & REGISTER ===
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
    
    document.getElementById('registerBtn').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
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
        alert("Firebase Error: " + e.message); 
        showToast("Database locked. Rules check karo!"); 
    }
    document.getElementById('registerBtn').innerHTML = 'REGISTER <i class="fa-solid fa-cloud-arrow-up"></i>';
};

document.getElementById('loginBtn').onclick = async () => {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value.trim();
    if(!u || !p) return;
    document.getElementById('loginBtn').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    
    let userData = vipDB[u] || (await getDoc(doc(db, "users", u.toLowerCase()))).data();
    if (userData && userData.pass === p) { 
        localStorage.setItem('keepMeLoggedIn', u); 
        await initializeUserSession(u); 
    } else { 
        document.getElementById('loginError').style.display = 'block'; 
        document.getElementById('loginBtn').innerHTML = 'INITIALIZE <i class="fa-solid fa-bolt"></i>'; 
    }
};

async function initializeUserSession(u) {
    currentUser = u;

    // 🔒 FM सिर्फ Dark_eio के लिए
    if(currentUser && currentUser.toLowerCase() !== "dark_eio") {
        if(fmBroadcastBtn) fmBroadcastBtn.style.display = "none";
    }

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
        document.getElementById('profRelation').innerText = userData.relation;
        
        updateProfileBadge(statsSnap.exists() ? statsSnap.data().month : 0);

        splash.classList.add('hidden');
        login.classList.add('hidden');
        app.classList.remove('hidden');
        
        // 🔥 Core systems
        startCloudTimer(); 
        loadVibeChat(); 
        loadLoveCapsule();

        // 🔥 FM Listener START (IMPORTANT)
        listenToGlobalFM();

        // 🎵 Music
        fetchMusic("Top Lofi Hindi");
        checkDailyMix(); 

    } catch (e) { 
        console.error(e); 
    }
}
function updateProfileBadge(minutes) {
    let badgeEl = document.getElementById('userBadge');
    if (!badgeEl) {
        badgeEl = document.createElement('div');
        badgeEl.id = 'userBadge'; badgeEl.className = 'user-badge';
        document.getElementById('profName').after(badgeEl);
    }
    if(minutes > 600) badgeEl.innerHTML = '<i class="fa-solid fa-crown"></i> Music Lord';
    else if(minutes > 120) badgeEl.innerHTML = '<i class="fa-solid fa-fire"></i> Vibe Master';
    else badgeEl.innerHTML = '<i class="fa-solid fa-headphones"></i> Rookie';
}

function startCloudTimer() {
    setInterval(async () => {
        sessionSeconds++;
        if (sessionSeconds % 60 === 0) {
            await updateDoc(doc(db, "stats", currentUser), { today: increment(1), week: increment(1), month: increment(1) });
        }
    }, 1000);
}

// === FEATURE 18: EASTER EGGS (Bankai & Domain) ===
document.getElementById('searchBtn').onclick = () => { 
    isPlaylistView = false; 
    let q = searchInput.value.trim();
    if(q.toLowerCase() === 'bankai') {
        document.body.className = 'theme-bankai';
        showToast("卍 BAN KAI! 卍");
        fetchMusic("Bleach Anime Theme");
    } else if(q.toLowerCase() === 'domain expansion') {
        document.body.className = 'theme-domain';
        showToast("🤞 Domain Expansion: Infinite Void");
        fetchMusic("Jujutsu Kaisen Opening");
    } else if(q) {
        document.body.className = vipDB[currentUser]?.theme || 'theme-guest';
        fetchMusic(q); 
    }
};

// === FEATURE 7: VOICE COMMANDS (AI DJ) ===
if ('webkitSpeechRecognition' in window) {
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'hi-IN'; // Hindi + English mix

    micBtn.onclick = () => {
        micBtn.classList.add('mic-listening');
        searchInput.placeholder = "Listening...";
        recognition.start();
    };

    recognition.onresult = (event) => {
        micBtn.classList.remove('mic-listening');
        const voiceQuery = event.results[0][0].transcript;
        searchInput.value = voiceQuery;
        document.getElementById('searchBtn').click();
        showToast(`AI DJ heard: ${voiceQuery}`);
    };

    recognition.onerror = () => {
        micBtn.classList.remove('mic-listening');
        searchInput.placeholder = "Search song...";
        showToast("Voice not recognized!");
    };
} else {
    micBtn.style.display = 'none'; // Hide if browser not supported
}

// === FEATURE 10: DAILY MIX ===
function checkDailyMix() {

    dailyMixBanner.classList.remove('hidden');

    // ✅ Name हट गया (Dark_eio नहीं दिखेगा)
    document.querySelector("#dailyMixBanner h3").innerText = "Daily Vibe ✨";

    document.getElementById('playDailyMixBtn').onclick = () => {

        isPlaylistView = false;

        let moods = [
            "Trending Hindi Songs",
            "Lofi Chill",
            "Arijit Singh",
            "Sad Hindi Songs",
            "Punjabi Hits",
            "Romantic Bollywood",
            "Phonk",
            "Slowed Reverb",
            "Hip Hop India"
        ];

        let randomMood = moods[Math.floor(Math.random() * moods.length)];

        fetchMusic(randomMood);

        showToast(`AI picked: ${randomMood} 🎧`);
    };
}

// === 💬 VIBE CHAT SYSTEM ===
if(openChatBtn) {
    const triggerChat = (e) => { 
        e.preventDefault(); e.stopPropagation();
        chatWidget.classList.add('show'); 
        lyricsPanel.classList.remove('show'); 
    };
    openChatBtn.addEventListener('click', triggerChat);
    openChatBtn.addEventListener('touchstart', triggerChat);
}
if(document.getElementById('closeChatBtn')) {
    document.getElementById('closeChatBtn').onclick = () => chatWidget.classList.remove('show');
}

function loadVibeChat() {
    const q = query(collection(db, "globalChat"), orderBy("timestamp", "desc"), limit(50));
    onSnapshot(q, (snap) => {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
        const msgs = [];
        snap.forEach(doc => msgs.push(doc.data()));
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
        if(!input.value.trim()) return;
        await addDoc(collection(db, "globalChat"), { sender: currentUser, text: input.value, timestamp: Date.now() });
        input.value = '';
    };
}

// === 🎧 MUSIC ENGINE & UI ===
async function fetchMusic(q) {
    document.getElementById('listHeading').innerText = "Scanning Universe...";
    try {
        const res = await fetch(`https://saavn.sumit.co/api/search/songs?query=${q}`);
        const data = await res.json();
        if(data.success) { 
            currentQueue = data.data.results; 
            currentIndex = 0;
            renderLibrary(); 
            document.getElementById('listHeading').innerText = `'${q}' Results`; 
        }
    } catch (e) { showToast("Network Error"); }
}

function renderLibrary() {
    songsList.innerHTML = '';
    currentQueue.forEach((song, i) => {
        const div = document.createElement('div');
        div.className = 'song-card glass-widget';
        const isFav = myPlaylist.some(s => s.id === song.id);
        div.innerHTML = `
            <img src="${song.image[2].url}" onclick="playSong(${i})">
            <div class="song-info-v2" onclick="playSong(${i})">
                <h4>${song.name}</h4><p>${song.artists.primary[0].name}</p>
            </div>
            <button class="fav-btn" style="color:${isFav ? 'var(--neon-main)' : '#888'}" onclick="toggleFav(event, ${i})">
                <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i>
            </button>`;
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
    if(isPlaylistView) renderLibrary();
}

// === FEATURE 23: LOVE CAPSULE LOGIC ===
async function checkLoveCapsule(song) {
    // Check if Muskan is listening to the same song
    try {
        const partnerRef = doc(db, "liveStatus", "Muskan");
        const snap = await getDoc(partnerRef);
        if (snap.exists() && snap.data().isPlaying && snap.data().songId === song.id) {
            const capRef = collection(db, "loveCapsule");
            await addDoc(capRef, {
                couple: [currentUser, "Muskan"],
                songName: song.name,
                date: new Date().toLocaleDateString(),
                timestamp: Date.now()
            });
            showToast("💞 Sync Match! Memory Saved in Capsule.");
        }
    } catch(e){}
}

function loadLoveCapsule() {
    const q = query(collection(db, "loveCapsule"), orderBy("timestamp", "desc"), limit(5));
    onSnapshot(q, (snap) => {
        const list = document.getElementById('capsuleList');
        list.innerHTML = '';
        let hasMemory = false;
        snap.forEach(docSnap => {
            const data = docSnap.data();
            if(data.couple.includes(currentUser)) {
                hasMemory = true;
                const item = document.createElement('div');
                item.className = 'capsule-item';
                item.innerHTML = `<strong>${data.songName}</strong> Saath suna gaya on ${data.date} <span>with Muskan</span>`;
                list.appendChild(item);
            }
        });
        if(!hasMemory) list.innerHTML = '<p class="empty-msg" style="font-size:10px; color:#aaa;">Abhi koi yaad kaid nahi hui...</p>';
    });
}

function playSong(i) {
    currentIndex = i; 
    const song = currentQueue[i];
    
    document.getElementById('playerTitle').innerText = song.name;
    document.getElementById('playerArtist').innerText = song.artists.primary[0].name;
    document.getElementById('playerCover').src = song.image[1].url;
    
    audio.volume = 1; // Feature 8 Reset
    audio.src = song.downloadUrl[4].url; 
    audio.play();
    
    updatePlayState(true); 
    
    // Feature 23 Trigger
    if(currentUser !== "Muskan") checkLoveCapsule(song);
    
    // Feature 19 Trigger
    if(isBroadcastingFM) broadcastFMState(song);
    else updateLiveStatus(true, song);
    
    const lText = document.querySelector('.lyrics-text');
    if(lText) lText.innerHTML = `Vibing to <br><span style="color:var(--neon-main)">${song.name}</span>`;
}

function updatePlayState(playing) {
    playBtn.innerHTML = playing ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
    vinylDisk.classList.toggle('spin-vinyl', playing);
    visualizer.classList.toggle('hidden', !playing);
    bgAura.classList.toggle('beat-sync', playing);
}

playBtn.onclick = () => { 
    if(audio.paused && currentQueue.length) audio.play(); 
    else audio.pause(); 
    updatePlayState(!audio.paused); 
};

// SMART AI AUTO-PLAY 
audio.onended = () => {
    if (isPlaylistView) {
        if (currentIndex < currentQueue.length - 1) playSong(currentIndex + 1);
        else playSong(0); 
    } else {
        showToast("AI is cooking next vibe... 🤖✨"); 
        playRandomAISong();
    }
};

document.getElementById('nextBtn').onclick = () => audio.onended();
document.getElementById('prevBtn').onclick = () => { if (currentIndex > 0) playSong(currentIndex - 1); };

async function playRandomAISong() {
    const moods = ["Midnight Lofi", "Slowed Hindi Reverb", "Deep Focus House", "Arijit Singh Chill"];
    const randomMood = moods[Math.floor(Math.random() * moods.length)];
    try {
        const res = await fetch(`https://saavn.sumit.co/api/search/songs?query=${randomMood}`);
        const data = await res.json();
        if(data.success) {
            const newSong = data.data.results[Math.floor(Math.random() * data.data.results.length)];
            currentQueue = [newSong, ...currentQueue]; currentIndex = 0; renderLibrary(); playSong(0); 
            showToast(`AI Choice: ${newSong.name} 🎧`);
        }
    } catch (e) { playSong(0); }
}

// === FEATURE 8: SMOOTH CROSSFADE ===
audio.ontimeupdate = () => { 
    if(!isNaN(audio.duration)) { 
        seekSlider.value = (audio.currentTime/audio.duration)*100; 
        document.getElementById('timeCurrent').innerText = formatTime(audio.currentTime); 
        document.getElementById('timeTotal').innerText = formatTime(audio.duration); 
        
        // DJ Transition: Fades out in the last 4 seconds
        if (audio.duration - audio.currentTime < 4 && audio.volume > 0.05) {
            audio.volume -= 0.02; // Smoothly lower volume
        }
    } 
};
seekSlider.oninput = () => audio.currentTime = (seekSlider.value/100)*audio.duration;
function formatTime(s) { let m = Math.floor(s/60); let sec = Math.floor(s%60); return `${m}:${sec<10?'0'+sec:sec}`; }

// === FEATURE 5: SLEEP TIMER ===
sleepTimerBtn.onclick = () => {
    if(sleepTimeout) {
        clearTimeout(sleepTimeout); sleepTimeout = null;
        sleepTimerBtn.classList.remove('timer-active');
        showToast("Sleep Timer Cancelled ☀️");
    } else {
        sleepTimeout = setTimeout(() => {
            audio.pause(); updatePlayState(false);
            showToast("Shh... App is sleeping 🌙");
            sleepTimerBtn.classList.remove('timer-active');
        }, 30 * 60000); // 30 Minutes
        sleepTimerBtn.classList.add('timer-active');
        showToast("Sleep Timer Set: 30 Mins 🌙");
    }
};

// === FEATURE 19: LIVE FM RADIO ===
// ================== 📡 FM LISTENER SYSTEM ==================

let isListeningFM = false;
let autoFM = true;

// 📡 Listen FM (Auto Join + Perfect Sync)
function listenToGlobalFM() {

    let joinedOnce = false; // 🔥 duplicate listener count fix

    onSnapshot(doc(db, "fm", "globalRadio"), async (docSnap) => {

        if (!docSnap.exists()) return;

        const fmData = docSnap.data();

        if (fmData.isLive && fmData.host !== currentUser) {

            isListeningFM = true;

            // 🔔 Show LIVE tag
            fmLiveTag.classList.remove('hidden');
            fmLiveTag.innerText = `📡 ${fmData.host} LIVE`;

            // 🎧 Only update audio if changed
            if (audio.src !== fmData.audio) {

                audio.src = fmData.audio;

                // 🔥 PERFECT SYNC (real-time delay sync)
                let delay = (Date.now() - fmData.timestamp) / 1000;
                if (delay < 0) delay = 0;

                audio.currentTime = delay;
            }

            // ▶ Auto Play (safe)
            if (autoFM && audio.paused) {
                audio.play();
            }

            // 🎶 UI Update
            document.getElementById('playerTitle').innerText = fmData.songName;
            document.getElementById('playerArtist').innerText = fmData.artist;
            document.getElementById('playerCover').src = fmData.cover;

            // 👥 Listener Count (only once)
            if (!joinedOnce) {
                joinedOnce = true;

                await updateDoc(doc(db, "fm", "globalRadio"), {
                    listeners: increment(1)
                });
            }

        } else {

            // ❌ FM off / host same user
            fmLiveTag.classList.add('hidden');

            isListeningFM = false;
            joinedOnce = false;
        }
    });
}

// ❌ Leave FM manually
function leaveFM() {

    if (!isListeningFM) return;

    isListeningFM = false;

    audio.pause();

    fmLiveTag.classList.add('hidden');

    showToast("📡 Left FM");

    updateDoc(doc(db, "fm", "globalRadio"), {
        listeners: increment(-1)
    });
}

// ================== 📡 END ==================

// ================== 🔥 FM SYSTEM UPGRADE END ==================

async function broadcastFMState(song) {
    await setDoc(doc(db, "fm", "globalRadio"), {
        isLive: true,
        host: currentUser,
        songId: song.id,
        songName: song.name,
        cover: song.image[2].url,
        audio: song.downloadUrl[4].url,
        artist: song.artists.primary[0].name,
        timestamp: Date.now()
    });
}

function listenToGlobalFM() {
    onSnapshot(doc(db, "fm", "globalRadio"), (docSnap) => {
        if(docSnap.exists()) {
            const fmData = docSnap.data();
            if(fmData.isLive && fmData.host !== currentUser) {
                fmLiveTag.classList.remove('hidden');
                fmLiveTag.innerHTML = `<i class="fa-solid fa-tower-broadcast fade-blink"></i> ${fmData.host}'s FM`;
                fmLiveTag.onclick = () => {
                    showToast(`Tuning into ${fmData.host}'s Live Station! 📻`);
                    const fakeSong = { id: fmData.songId, name: fmData.songName, artists: { primary: [{ name: fmData.artist }] }, image: [{},{},{url: fmData.cover}], downloadUrl: [{},{},{},{},{url: fmData.audio}] };
                    currentQueue = [fakeSong]; playSong(0);
                };
            } else if (!fmData.isLive) {
                fmLiveTag.classList.add('hidden');
            }
        }
    });
}

async function updateLiveStatus(isPlaying, song = null) {
    if(isBroadcastingFM) return; // Don't override standard status if FM is live
    const ref = doc(db, "liveStatus", currentUser);
    if(isPlaying && song) {
        await setDoc(ref, { isPlaying: true, songName: song.name, songId: song.id, avatar: vipDB[currentUser]?.avatar || "guest.jpg", lastSeen: Date.now() });
    } else { await updateDoc(ref, { isPlaying: false }); }
}

// UI Sidebar & Navigation
document.getElementById('profileBtn').onclick = () => { profileSidebar.classList.add('open'); sidebarOverlay.classList.add('show'); };
document.getElementById('closeProfileBtn').onclick = () => { profileSidebar.classList.remove('open'); sidebarOverlay.classList.remove('show'); };
document.getElementById('logoutBtn').onclick = () => { localStorage.removeItem('keepMeLoggedIn'); location.reload(); };

document.getElementById('btnHome').onclick = () => { 
    isPlaylistView = false; document.getElementById('searchSection').style.display = 'block'; dailyMixBanner.classList.remove('hidden'); fetchMusic("Trending Hindi"); 
};
document.getElementById('btnPlaylist').onclick = () => { 
    isPlaylistView = true; document.getElementById('searchSection').style.display = 'none'; dailyMixBanner.classList.add('hidden'); currentQueue = myPlaylist; renderLibrary(); 
};

// Utilities
function showToast(m) {
    let t = document.getElementById('toast');
    if(!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast-popup'; document.body.appendChild(t); }
    t.innerText = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000);
}
