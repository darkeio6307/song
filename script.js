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

// === 3. UI ELEMENTS ===
const splash = document.getElementById('splashScreen');
const login = document.getElementById('loginScreen');
const app = document.getElementById('mainApp');
const audio = document.getElementById('audioEngine');
const playBtn = document.getElementById('playBtn');
const seekSlider = document.getElementById('seekSlider');
const vinylDisk = document.getElementById('vinylDisk');
const songsList = document.getElementById('songsList');
const searchInput = document.getElementById('searchInput');
const chatWidget = document.getElementById('chatWidget');
const openChatBtn = document.getElementById('openChatBtn');
const fmBroadcastBtn = document.getElementById('fmBroadcastBtn');
const fmLiveTag = document.getElementById('fmLiveTag');
const micBtn = document.getElementById('micBtn');
const sleepTimerBtn = document.getElementById('sleepTimerBtn');
const dailyMixBanner = document.getElementById('dailyMixBanner');

// === 4. GLOBALS ===
let currentUser = "";
let currentQueue = []; 
let myPlaylist = []; 
let currentIndex = 0;
let isPlaylistView = false;
let isBroadcastingFM = false;
let sleepTimeout = null;

// Global functions for HTML onClick
window.playSong = playSong;
window.toggleFav = toggleFav;

// === 5. INITIALIZATION ===
window.onload = async () => {
    const savedUser = localStorage.getItem('keepMeLoggedIn');
    setTimeout(() => {
        splash.classList.add('hidden');
        if (savedUser) {
            initializeUserSession(savedUser);
        } else {
            login.classList.remove('hidden');
        }
    }, 3000);
};

// === 6. AUTHENTICATION (Fixed Error Alerts) ===
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
    
    if(!u || !p) { 
        showToast("नाम और पासवर्ड भरें!"); 
        return; 
    }
    
    document.getElementById('registerBtn').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    
    try {
        const userRef = doc(db, "users", u.toLowerCase());
        const checkSnap = await getDoc(userRef);
        
        if(checkSnap.exists()) { 
            showToast("ये नाम पहले से मौजूद है!"); 
        } else {
            await setDoc(userRef, { 
                pass: p, 
                relation: "Music Lover 🎵", 
                theme: "theme-guest", 
                themeName: "Minimal Green", 
                avatar: "guest.jpg" 
            });
            showToast("अकाउंट बन गया! अब लॉग-इन करें।");
            document.getElementById('toggleLogin').click();
        }
    } catch(e) { 
        console.error("Firebase Error:", e);
        alert("बीमारी यहाँ है: " + e.message); // Real error popup
        showToast("Database locked. Check Firebase Rules!"); 
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
        initializeUserSession(u);
    } else {
        document.getElementById('loginError').style.display = 'block';
        document.getElementById('loginBtn').innerHTML = 'INITIALIZE <i class="fa-solid fa-bolt"></i>';
    }
};

async function initializeUserSession(u) {
    currentUser = u;
    
    let userData = vipDB[currentUser] || (await getDoc(doc(db, "users", currentUser.toLowerCase()))).data();
    document.body.className = userData.theme;
    
    // Load Vault
    const vaultSnap = await getDoc(doc(db, "vaults", currentUser));
    myPlaylist = vaultSnap.exists() ? vaultSnap.data().songs : [];
    
    // Set Profile Data
    document.getElementById('userName').innerText = currentUser;
    document.getElementById('userAvatar').src = userData.avatar;
    document.getElementById('sideProfAvatar').src = userData.avatar;
    document.getElementById('profName').innerText = currentUser;
    document.getElementById('profSongCount').innerText = myPlaylist.length;
    
    // Feature 19: FM Broadcast Button specific to dark_eio
    if(currentUser.toLowerCase() === 'dark_eio') {
        fmBroadcastBtn.classList.remove('hidden');
    } else {
        fmBroadcastBtn.classList.add('hidden');
    }

    // Feature 10: Personalized Daily Mix Banner
    const mixTitle = document.querySelector('.mix-info h3');
    if(mixTitle) mixTitle.innerText = `${currentUser}'s Daily Vibe ✨`;

    // Show Main App
    login.classList.add('hidden');
    app.classList.remove('hidden');
    
    // Init Features
    listenToGlobalFM();
    loadVibeChat();
    loadLoveCapsule();
    checkDailyMix();
    fetchMusic("Top Lofi Hindi");
}

// === 7. MUSIC ENGINE ===
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
    } catch (e) { 
        showToast("Network Error while searching."); 
    }
}

function renderLibrary() {
    songsList.innerHTML = '';
    
    currentQueue.forEach((song, i) => {
        const div = document.createElement('div');
        div.className = 'song-card glass-widget';
        
        const isFav = myPlaylist.some(s => s.id === song.id);
        const heartClass = isFav ? 'active' : '';
        
        div.innerHTML = `
            <img src="${song.image[2].url}" onclick="playSong(${i})">
            <div class="song-info-v2" onclick="playSong(${i})">
                <h4>${song.name}</h4>
                <p>${song.artists.primary[0].name}</p>
            </div>
            <button class="fav-btn ${heartClass}" onclick="toggleFav(event, ${i})">
                <i class="fa-solid fa-heart"></i>
            </button>`;
            
        songsList.appendChild(div);
    });
}

async function toggleFav(e, i) {
    e.stopPropagation();
    const song = currentQueue[i];
    const btn = e.currentTarget;
    
    const idx = myPlaylist.findIndex(s => s.id === song.id);
    
    if(idx > -1) {
        myPlaylist.splice(idx, 1);
        btn.classList.remove('active');
        showToast("Removed from Cloud ☁️");
    } else {
        myPlaylist.push(song);
        btn.classList.add('active');
        showToast("Saved to Cloud ☁️❤️");
    }
    
    await setDoc(doc(db, "vaults", currentUser), { songs: myPlaylist });
    document.getElementById('profSongCount').innerText = myPlaylist.length;
}

function playSong(i) {
    currentIndex = i;
    const song = currentQueue[i];
    
    document.getElementById('playerTitle').innerText = song.name;
    document.getElementById('playerArtist').innerText = song.artists.primary[0].name;
    document.getElementById('playerCover').src = song.image[1].url;
    
    audio.src = song.downloadUrl[4].url;
    audio.volume = 1; // Reset volume for Crossfade
    audio.play();
    
    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    vinylDisk.classList.add('spin-vinyl');
    
    // Feature 23: Love Capsule Sync
    if(currentUser !== "Muskan") {
        checkAndSaveLoveCapsule(song);
    }
    
    // Feature 19: FM Sync
    if(isBroadcastingFM) {
        updateFMData(song);
    }
}

// === 8. PLAYER CONTROLS & CROSSFADE ===
playBtn.onclick = () => { 
    if(audio.paused) {
        audio.play();
        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        vinylDisk.classList.add('spin-vinyl');
    } else {
        audio.pause();
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        vinylDisk.classList.remove('spin-vinyl');
    }
};

document.getElementById('prevBtn').onclick = () => {
    if (currentIndex > 0) playSong(currentIndex - 1);
};

document.getElementById('nextBtn').onclick = () => {
    audio.onended();
};

// Feature 8: Crossfade & AI Smart Auto-Play
audio.onended = () => {
    if(isPlaylistView) {
        // Vault mein hai to agla gaana
        if (currentIndex < currentQueue.length - 1) playSong(currentIndex + 1);
        else playSong(0);
    } else {
        // Home ya Search par hai to AI layega gaana
        showToast("AI is cooking next vibe... 🤖✨");
        playRandomAISong();
    }
};

async function playRandomAISong() {
    const premiumMoods = ["Midnight Lofi", "Viral Hits", "Trending Hindi", "Arijit Singh Chill", "Deep House"];
    const randomMood = premiumMoods[Math.floor(Math.random() * premiumMoods.length)];
    
    try {
        const res = await fetch(`https://saavn.sumit.co/api/search/songs?query=${randomMood}`);
        const data = await res.json();
        if(data.success) {
            const newSong = data.data.results[Math.floor(Math.random() * data.data.results.length)];
            currentQueue = [newSong, ...currentQueue];
            currentIndex = 0;
            renderLibrary();
            playSong(0);
        }
    } catch (e) { playSong(0); }
}

audio.ontimeupdate = () => { 
    if(!isNaN(audio.duration)) { 
        seekSlider.value = (audio.currentTime/audio.duration)*100; 
        document.getElementById('timeCurrent').innerText = formatTime(audio.currentTime); 
        document.getElementById('timeTotal').innerText = formatTime(audio.duration); 
        
        // Smooth Crossfade Logic (Last 4 seconds)
        if (audio.duration - audio.currentTime < 4 && audio.volume > 0.05) {
            audio.volume -= 0.02; 
        }
    } 
};

seekSlider.oninput = () => {
    audio.currentTime = (seekSlider.value/100)*audio.duration;
};

function formatTime(s) { 
    let m = Math.floor(s/60); 
    let sec = Math.floor(s%60); 
    return `${m}:${sec<10?'0'+sec:sec}`; 
}

// === 9. DAILY MIX (Feature 10) ===
function checkDailyMix() {
    document.getElementById('dailyMixBanner').classList.remove('hidden');
    document.getElementById('playDailyMixBtn').onclick = () => {
        isPlaylistView = false;
        
        const aiMoods = ["Top Hindi Viral", "Arijit Singh Romance", "Midnight Lofi Chill", "Trending Spotify India"];
        const randomVibe = aiMoods[Math.floor(Math.random() * aiMoods.length)];
        
        fetchMusic(randomVibe);
        showToast(`Generating AI Mix: ${randomVibe} 🎧✨`);
    };
}

// === 10. FM RADIO BROADCAST (Feature 19) ===
fmBroadcastBtn.onclick = () => {
    isBroadcastingFM = !isBroadcastingFM;
    
    if(isBroadcastingFM) {
        fmBroadcastBtn.classList.add('fm-broadcasting');
        showToast("📡 You are now Broadcasting FM!");
        if(currentQueue[currentIndex]) updateFMData(currentQueue[currentIndex]);
    } else {
        fmBroadcastBtn.classList.remove('fm-broadcasting');
        setDoc(doc(db, "fm", "globalRadio"), { isLive: false }); // Ye radio ko dusro ke phone se hata dega
        showToast("📡 FM Broadcast Stopped.");
    }
};

async function updateFMData(song) {
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
        const data = docSnap.data();
        // Agar FM Live hai aur Host tum nahi ho
        if(data && data.isLive && data.host !== currentUser) {
            fmLiveTag.classList.remove('hidden');
            fmLiveTag.innerHTML = `<i class="fa-solid fa-tower-broadcast fade-blink"></i> ${data.host}'s FM`;
            fmLiveTag.onclick = () => {
                showToast(`Tuning into ${data.host}'s FM! 📻`);
                const fakeSong = { id: data.songId, name: data.songName, artists: { primary: [{ name: data.artist }] }, image: [{},{},{url: data.cover}], downloadUrl: [{},{},{},{},{url: data.audio}] };
                currentQueue = [fakeSong]; 
                playSong(0);
            };
        } else {
            fmLiveTag.classList.add('hidden'); // Agar host ne band kiya, tag gayab
        }
    });
}

// === 11. LOVE CAPSULE (Feature 23) ===
async function checkAndSaveLoveCapsule(song) {
    try {
        const muskanRef = doc(db, "liveStatus", "Muskan");
        const snap = await getDoc(muskanRef);
        
        // Agar Muskan ka status 'playing' hai aur songId same hai
        if(snap.exists() && snap.data().isPlaying && snap.data().songId === song.id) {
            await addDoc(collection(db, "loveCapsule"), {
                couple: [currentUser, "Muskan"],
                songName: song.name,
                date: new Date().toLocaleDateString(),
                timestamp: Date.now()
            });
            showToast("💞 Sync Match! Memory Kaid Ho Gayi.");
        }
    } catch(e) { console.log(e); }
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
                const d = document.createElement('div');
                d.className = 'capsule-item';
                d.innerHTML = `<strong>${data.songName}</strong> Suna gaya on ${data.date} with Muskan ❤️`;
                list.appendChild(d);
            }
        });
        
        if(!hasMemory) {
            list.innerHTML = '<p class="empty-msg" style="font-size:10px; color:#aaa;">Abhi koi yaad kaid nahi hui...</p>';
        }
    });
}

// === 12. VIBE CHAT FIX (Click issue resolved) ===
if (openChatBtn) {
    const triggerChat = (e) => {
        e.preventDefault();
        e.stopPropagation();
        chatWidget.classList.add('show');
        document.getElementById('lyricsPanel').classList.remove('show');
    };
    // Touchstart added for better mobile response
    openChatBtn.addEventListener('click', triggerChat);
    openChatBtn.addEventListener('touchstart', triggerChat);
}

document.getElementById('closeChatBtn').onclick = () => {
    chatWidget.classList.remove('show');
};

function loadVibeChat() {
    const q = query(collection(db, "globalChat"), orderBy("timestamp", "desc"), limit(50));
    onSnapshot(q, (snap) => {
        const msgArea = document.getElementById('chatMessages');
        msgArea.innerHTML = '';
        
        const msgs = [];
        snap.forEach(d => msgs.push(d.data()));
        
        msgs.reverse().forEach(m => {
            const div = document.createElement('div');
            div.className = `chat-msg ${m.sender === currentUser ? 'mine' : ''}`;
            div.innerHTML = `<span>${m.sender}</span>${m.text}`;
            msgArea.appendChild(div);
        });
        msgArea.scrollTop = msgArea.scrollHeight;
    });
}

document.getElementById('sendChatBtn').onclick = async () => {
    const inp = document.getElementById('chatInput');
    const text = inp.value.trim();
    if(!text) return;
    
    await addDoc(collection(db, "globalChat"), { 
        sender: currentUser, 
        text: text, 
        timestamp: Date.now() 
    });
    inp.value = '';
};

// === 13. EASTER EGGS (Feature 18) & VOICE COMMANDS ===
document.getElementById('searchBtn').onclick = () => {
    isPlaylistView = false;
    const q = searchInput.value.trim().toLowerCase();
    
    if(q === 'bankai') { 
        document.body.className = 'theme-bankai'; 
        showToast("卍 BAN KAI! 卍");
        fetchMusic("Bleach Anime Theme"); 
    }
    else if(q === 'domain expansion') { 
        document.body.className = 'theme-domain'; 
        showToast("🤞 Domain Expansion: Infinite Void");
        fetchMusic("Jujutsu Kaisen Opening"); 
    }
    else if(q) {
        document.body.className = vipDB[currentUser]?.theme || 'theme-guest';
        fetchMusic(q);
    }
};

// Voice Command Logic
if ('webkitSpeechRecognition' in window) {
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'hi-IN';

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
    };

    recognition.onerror = () => {
        micBtn.classList.remove('mic-listening');
        searchInput.placeholder = "Search song or say 'Bankai'...";
    };
} else {
    micBtn.style.display = 'none';
}

// === 14. SLEEP TIMER ===
sleepTimerBtn.onclick = () => {
    if(sleepTimeout) {
        clearTimeout(sleepTimeout); 
        sleepTimeout = null;
        sleepTimerBtn.classList.remove('timer-active');
        showToast("Sleep Timer Cancelled ☀️");
    } else {
        sleepTimeout = setTimeout(() => {
            audio.pause(); 
            playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
            vinylDisk.classList.remove('spin-vinyl');
            showToast("Shh... App is sleeping 🌙");
            sleepTimerBtn.classList.remove('timer-active');
        }, 30 * 60000); // 30 Minutes
        sleepTimerBtn.classList.add('timer-active');
        showToast("Sleep Timer Set: 30 Mins 🌙");
    }
};

// === 15. UI NAVIGATION HELPERS ===
document.getElementById('btnHome').onclick = () => { 
    isPlaylistView = false; 
    document.getElementById('searchSection').style.display = 'block'; 
    document.getElementById('dailyMixBanner').classList.remove('hidden'); 
    fetchMusic("Trending Hindi"); 
};

document.getElementById('btnPlaylist').onclick = () => { 
    isPlaylistView = true; 
    document.getElementById('searchSection').style.display = 'none'; 
    document.getElementById('dailyMixBanner').classList.add('hidden'); 
    currentQueue = myPlaylist; 
    renderLibrary(); 
};

document.getElementById('profileBtn').onclick = () => { 
    document.getElementById('profileSidebar').classList.add('open'); 
    document.getElementById('sidebarOverlay').classList.add('show'); 
};

document.getElementById('closeProfileBtn').onclick = () => { 
    document.getElementById('profileSidebar').classList.remove('open'); 
    document.getElementById('sidebarOverlay').classList.remove('show'); 
};

document.getElementById('logoutBtn').onclick = () => { 
    localStorage.removeItem('keepMeLoggedIn'); 
    location.reload(); 
};

function showToast(m) {
    let t = document.getElementById('toast');
    if(!t) { 
        t = document.createElement('div'); 
        t.id = 'toast'; 
        t.className = 'toast-popup'; 
        document.body.appendChild(t); 
    }
    t.innerText = m; 
    t.classList.add('show'); 
    setTimeout(() => t.classList.remove('show'), 3000);
}
