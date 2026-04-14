// === 1. FIREBASE SETUP ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

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

// === 2. VIP HARDCODED DATABASE (For Admins/Old users) ===
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

// Globals
let currentUser = "";
let currentQueue = []; 
let myPlaylist = []; 
let currentIndex = 0;
let isPlaylistView = false; 
let noteInterval;
let sessionSeconds = 0;
let statsInterval;

window.playSong = playSong;
window.toggleFav = toggleFav;

// Touch Ripple
document.addEventListener('click', (e) => {
    const ripple = document.createElement('div'); ripple.className = 'touch-ripple';
    ripple.style.left = `${e.clientX - 20}px`; ripple.style.top = `${e.clientY - 20}px`;
    ripple.style.width = '40px'; ripple.style.height = '40px';
    document.body.appendChild(ripple);
    setTimeout(() => { ripple.remove(); }, 600);
});

// Splash to Login
setTimeout(() => { splash.classList.add('hidden'); login.classList.remove('hidden'); }, 3000);

// Clock
setInterval(() => {
    const hr = new Date().getHours();
    document.getElementById('timeGreeting').innerText = (hr >= 12 && hr < 17) ? "Good Afternoon," : (hr >= 17 && hr < 21) ? "Good Evening," : (hr >= 21 || hr < 4) ? "शब-बख़ैर," : "Good Morning,";
}, 60000);

// PWA Install
let deferredPrompt;
const installAppBtn = document.getElementById('installAppBtn');
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); deferredPrompt = e; installAppBtn.style.display = 'block';
});
installAppBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') installAppBtn.style.display = 'none';
        deferredPrompt = null;
    }
});

function showToast(msg) {
    const t = document.getElementById('toast'); t.innerText = msg; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// === 3. LOGIN & REGISTRATION LOGIC ===

// Toggle UI
document.getElementById('toggleRegister').onclick = () => {
    document.getElementById('loginMode').classList.add('hidden');
    document.getElementById('registerMode').classList.remove('hidden');
    document.getElementById('loginTitle').innerText = 'NEW REGISTRATION';
    document.getElementById('loginSubTitle').innerText = 'Create your cloud identity';
};

document.getElementById('toggleLogin').onclick = () => {
    document.getElementById('registerMode').classList.add('hidden');
    document.getElementById('loginMode').classList.remove('hidden');
    document.getElementById('loginTitle').innerText = 'ELITE PORTAL';
    document.getElementById('loginSubTitle').innerText = 'Cloud Authentication Required';
};

// Registration Logic
document.getElementById('registerBtn').onclick = async () => {
    const u = document.getElementById('regUsername').value.trim();
    const p = document.getElementById('regPassword').value.trim();

    if(!u || !p) { showToast("नाम और पासवर्ड दोनों भरें!"); return; }

    document.getElementById('registerBtn').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> CREATING...';

    try {
        // चेक करो कि ये नाम पहले से तो नहीं है
        const userRef = doc(db, "users", u.toLowerCase());
        const checkSnap = await getDoc(userRef);

        const hardcodedExists = Object.keys(vipDB).find(key => key.toLowerCase() === u.toLowerCase());

        if(checkSnap.exists() || hardcodedExists) {
            showToast("ये नाम पहले से मौजूद है!");
            document.getElementById('registerBtn').innerHTML = 'REGISTER <i class="fa-solid fa-cloud-arrow-up"></i>';
            return;
        }

        // नया यूज़र डेटाबेस में सेव करो (Guest थीम के साथ)
        await setDoc(userRef, {
            pass: p,
            relation: "Music Lover 🎵",
            theme: "theme-guest",
            themeName: "Minimal Green",
            avatar: "guest.jpg" // डिफ़ॉल्ट गेस्ट PFP
        });

        showToast("अकाउंट बन गया! अब लॉग-इन करें।");
        document.getElementById('regUsername').value = '';
        document.getElementById('regPassword').value = '';
        document.getElementById('toggleLogin').click(); // वापस लॉगिन स्क्रीन पर ले जाओ
        document.getElementById('registerBtn').innerHTML = 'REGISTER <i class="fa-solid fa-cloud-arrow-up"></i>';

    } catch(e) {
        console.error(e);
        showToast("Registration Error!");
        document.getElementById('registerBtn').innerHTML = 'REGISTER <i class="fa-solid fa-cloud-arrow-up"></i>';
    }
};

// Login Logic
document.getElementById('loginBtn').onclick = async () => {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value.trim();
    
    if(!u || !p) return;

    document.getElementById('loginBtn').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> CONNECTING...';
    
    try {
        let userData = null;
        let validUserName = u;

        // 1. पहले Hardcoded VIPs में चेक करो
        const vipKey = Object.keys(vipDB).find(key => key.toLowerCase() === u.toLowerCase());
        if (vipKey && vipDB[vipKey].pass === p) {
            userData = vipDB[vipKey];
            validUserName = vipKey;
        } else {
            // 2. अगर VIP में नहीं है, तो Firebase Database में चेक करो
            const userRef = doc(db, "users", u.toLowerCase());
            const userSnap = await getDoc(userRef);
            if (userSnap.exists() && userSnap.data().pass === p) {
                userData = userSnap.data();
                validUserName = u; // जो नाम डाला है वही यूज़ करो
            }
        }

        if (userData) {
            currentUser = validUserName;
            document.body.className = userData.theme;
            
            // Fetch Cloud Vault
            const vaultRef = doc(db, "vaults", currentUser);
            const vaultSnap = await getDoc(vaultRef);
            if (vaultSnap.exists()) {
                myPlaylist = vaultSnap.data().songs || [];
            } else {
                myPlaylist = [];
                await setDoc(vaultRef, { songs: [] }); 
            }

            // Init User Stats in Cloud
            const statsRef = doc(db, "stats", currentUser);
            const statsSnap = await getDoc(statsRef);
            if (!statsSnap.exists()) { await setDoc(statsRef, { today: 0, week: 0, month: 0 }); }

            // Set UI
            document.getElementById('userName').innerText = currentUser;
            document.getElementById('userAvatar').src = userData.avatar;
            document.getElementById('sideProfAvatar').src = userData.avatar;
            document.getElementById('profName').innerText = currentUser;
            document.getElementById('profRelation').innerText = userData.relation;
            document.getElementById('profThemeName').innerText = userData.themeName;
            document.getElementById('profSongCount').innerText = myPlaylist.length;

            login.classList.add('hidden');
            app.classList.remove('hidden');
            showToast(`Cloud Connected: ${currentUser}`);
            
            startCloudTimer(); 
            listenToLiveActivity(); 
            fetchMusic("Top Lofi Hindi"); 
        } else {
            document.getElementById('loginError').style.display = 'block';
            document.getElementById('loginBtn').innerHTML = 'INITIALIZE <i class="fa-solid fa-bolt"></i>';
        }
    } catch (error) {
        // ये जासूस हमें असली वजह बताएगा
        alert("Google Error: " + error.message);
        
        console.error(error);
        showToast("Cloud Connection Error!");
        document.getElementById('loginBtn').innerHTML = 'INITIALIZE <i class="fa-solid fa-bolt"></i>';
    }
};

// === 4. TIME TRACKING (CLOUD STATS) ===
function startCloudTimer() {
    updateStatsUI(); 
    statsInterval = setInterval(async () => {
        sessionSeconds++;
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
        const data = statsSnap.data();
        document.getElementById('statToday').innerText = `${data.today}m`;
        document.getElementById('statWeek').innerText = `${Math.floor(data.week/60)}h ${data.week%60}m`;
        document.getElementById('statMonth').innerText = `${Math.floor(data.month/60)}h ${data.month%60}m`;
    }
}

// === 5. LIVE ACTIVITY (INSTAGRAM STORIES) ===
function listenToLiveActivity() {
    onSnapshot(collection(db, "liveStatus"), (snapshot) => {
        liveStoriesContainer.innerHTML = '';
        let hasLive = false;
        
        snapshot.forEach((docSnap) => {
            const user = docSnap.id;
            const data = docSnap.data();
            if (user !== currentUser && data.isPlaying) {
                hasLive = true;
                const story = document.createElement('div');
                story.className = 'story-item';
                story.innerHTML = `
                    <div class="story-ring"><img src="${data.avatar}" onerror="this.src='https://via.placeholder.com/50'"></div>
                    <p>${user}</p>
                    <span>${data.songName}</span>
                `;
                story.onclick = () => {
                    const fakeSongObj = { id: data.songId, name: data.songName, artists: { primary: [{ name: data.artist }] }, image: [{},{},{url: data.cover}], downloadUrl: [{},{},{},{},{url: data.audio}] };
                    currentQueue = [fakeSongObj];
                    isPlaylistView = false;
                    playSong(0);
                    showToast(`Listening with ${user} 🎧`);
                };
                liveStoriesContainer.appendChild(story);
            }
        });

        if (hasLive) { liveActivityArea.classList.remove('hidden'); } 
        else { liveActivityArea.classList.add('hidden'); }
    });
}

async function updateMyLiveStatus(isPlaying, songObj = null) {
    const liveRef = doc(db, "liveStatus", currentUser);
    
    // Get Avatar (either from hardcoded DB or assume guest)
    const userAvatar = vipDB[currentUser] ? vipDB[currentUser].avatar : "guest.jpg";

    if(isPlaying && songObj) {
        await setDoc(liveRef, {
            isPlaying: true,
            songName: songObj.name,
            artist: songObj.artists.primary[0].name,
            cover: songObj.image[2].url,
            audio: songObj.downloadUrl[4].url,
            songId: songObj.id,
            avatar: userAvatar,
            timestamp: new Date()
        });
    } else {
        await updateDoc(liveRef, { isPlaying: false });
    }
}

// === 6. MUSIC FETCH & VAULT ===
async function fetchMusic(query) {
    document.getElementById('listHeading').innerText = "Scanning...";
    songsList.innerHTML = '';
    try {
        const res = await fetch(`https://saavn.sumit.co/api/search/songs?query=${query}`);
        const data = await res.json();
        if(data.success && data.data.results.length > 0) {
            currentQueue = data.data.results;
            renderLibrary();
            document.getElementById('listHeading').innerText = `'${query}' के रिज़ल्ट्स`;
        } else { document.getElementById('listHeading').innerText = "कुछ नहीं मिला!"; }
    } catch (e) { document.getElementById('listHeading').innerText = "Network Error!"; }
}

function renderLibrary() {
    songsList.innerHTML = '';
    currentQueue.forEach((song, i) => {
        const div = document.createElement('div');
        div.className = 'song-card glass-widget';
        const isFav = myPlaylist.some(s => s.id === song.id);
        const heartClass = isFav ? "fa-solid fa-heart" : "fa-regular fa-heart";
        const heartColor = isFav ? "var(--neon-main)" : "#888";

        div.innerHTML = `
            <img src="${song.image[2].url}" onclick="playSong(${i})">
            <div class="song-info-v2" onclick="playSong(${i})">
                <h4>${song.name}</h4>
                <p>${song.artists.primary[0].name}</p>
            </div>
            <button class="fav-btn" style="color:${heartColor}" onclick="toggleFav(event, ${i})"><i class="${heartClass}"></i></button>
        `;
        songsList.appendChild(div);
    });
}

async function toggleFav(event, index) {
    event.stopPropagation(); 
    const song = currentQueue[index];
    const existsIndex = myPlaylist.findIndex(s => s.id === song.id);
    
    if (existsIndex > -1) {
        myPlaylist.splice(existsIndex, 1);
        showToast("Removed from Cloud Vault ☁️");
    } else {
        myPlaylist.push(song);
        showToast("Saved to Cloud Vault ☁️❤️");
    }
    
    await setDoc(doc(db, "vaults", currentUser), { songs: myPlaylist });
    document.getElementById('profSongCount').innerText = myPlaylist.length;
    
    if (isPlaylistView) currentQueue = myPlaylist; 
    renderLibrary();
}

// === 7. PLAYER LOGIC ===
function createNote() {
    const note = document.createElement('i');
    const noteTypes = ['fa-music', 'fa-compact-disc', 'fa-headphones'];
    note.className = `fa-solid ${noteTypes[Math.floor(Math.random() * noteTypes.length)]} music-note`;
    note.style.left = `${Math.random() * 40}px`;
    notesContainer.appendChild(note);
    setTimeout(() => { note.remove(); }, 2000);
}

function updatePlayState(isPlaying) {
    if(isPlaying) {
        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        vinylDisk.classList.add('spin-vinyl');
        visualizer.classList.remove('hidden');
        bgAura.classList.add('beat-sync');
        if(!noteInterval) noteInterval = setInterval(createNote, 800);
    } else {
        playBtn.innerHTML = '<i class="fa-solid fa-play" style="padding-left:3px"></i>';
        vinylDisk.classList.remove('spin-vinyl');
        visualizer.classList.add('hidden');
        bgAura.classList.remove('beat-sync');
        clearInterval(noteInterval); noteInterval = null;
    }
}

function playSong(index) {
    currentIndex = index;
    const song = currentQueue[index];
    
    document.getElementById('playerTitle').innerText = song.name;
    document.getElementById('playerArtist').innerText = song.artists.primary[0].name;
    document.getElementById('playerCover').src = song.image[1].url; 
    
    audio.src = song.downloadUrl[4].url;
    audio.play();
    updatePlayState(true);
    updateMyLiveStatus(true, song); 
}

playBtn.onclick = () => {
    if(audio.paused && currentQueue.length > 0) { 
        audio.play(); updatePlayState(true); updateMyLiveStatus(true, currentQueue[currentIndex]); 
    } else if (!audio.paused) { 
        audio.pause(); updatePlayState(false); updateMyLiveStatus(false); 
    }
};

audio.onended = () => { if (currentQueue.length > 0) playSong((currentIndex + 1) % currentQueue.length); };
document.getElementById('nextBtn').onclick = () => { if(currentQueue.length > 0) playSong((currentIndex + 1) % currentQueue.length); };
document.getElementById('prevBtn').onclick = () => { if(currentQueue.length > 0) playSong((currentIndex - 1 + currentQueue.length) % currentQueue.length); };

audio.ontimeupdate = () => {
    if(isNaN(audio.duration)) return;
    seekSlider.value = (audio.currentTime / audio.duration) * 100;
    document.getElementById('timeCurrent').innerText = formatTime(audio.currentTime);
    document.getElementById('timeTotal').innerText = formatTime(audio.duration);
};
seekSlider.oninput = () => { audio.currentTime = (seekSlider.value / 100) * audio.duration; };

function formatTime(sec) {
    let m = Math.floor(sec / 60); let s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0'+s : s}`;
}

// Download & Share
document.getElementById('downloadBtn').onclick = () => {
    if(currentQueue.length === 0) return;
    const song = currentQueue[currentIndex];
    const link = document.createElement('a');
    link.href = song.downloadUrl[4].url; link.download = song.name + '.mp3'; link.target = '_blank';
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    showToast("Downloading... ⬇️");
};

document.getElementById('shareBtn').onclick = () => {
    if(currentQueue.length === 0) return;
    const song = currentQueue[currentIndex];
    const mySiteLink = window.location.origin + window.location.pathname;
    if (navigator.share) { navigator.share({ title: song.name, text: `सुनो '${song.name}' सिर्फ़ ARSHAD Music पर! 🎵`, url: mySiteLink }); } 
    else { showToast("Share copied!"); }
};

// UI Toggles
document.getElementById('btnHome').onclick = () => {
    isPlaylistView = false;
    document.querySelector('.dock-item.active').classList.remove('active');
    document.getElementById('btnHome').classList.add('active');
    document.getElementById('searchSection').style.display = 'block';
    fetchMusic("Trending Hindi"); 
};

document.getElementById('btnPlaylist').onclick = () => {
    isPlaylistView = true;
    document.querySelector('.dock-item.active').classList.remove('active');
    document.getElementById('btnPlaylist').classList.add('active');
    document.getElementById('searchSection').style.display = 'none'; 
    currentQueue = myPlaylist;
    document.getElementById('listHeading').innerText = "Cloud Vault";
    if(myPlaylist.length === 0) songsList.innerHTML = "<p style='text-align:center; color:#aaa; margin-top:40px;'>Vault is empty. Add some tracks!</p>";
    else renderLibrary();
};

document.getElementById('searchBtn').onclick = () => {
    const val = searchInput.value;
    if(!isPlaylistView && val) fetchMusic(val);
};

// Profile Sidebar
document.getElementById('profileBtn').onclick = () => {
    document.getElementById('profSongCount').innerText = myPlaylist.length; 
    profileSidebar.classList.add('open'); sidebarOverlay.classList.add('show');
};
document.getElementById('closeProfileBtn').onclick = () => { profileSidebar.classList.remove('open'); sidebarOverlay.classList.remove('show'); };
sidebarOverlay.onclick = () => { profileSidebar.classList.remove('open'); sidebarOverlay.classList.remove('show'); };

document.getElementById('logoutBtn').onclick = () => {
    profileSidebar.classList.remove('open'); sidebarOverlay.classList.remove('show');
    audio.pause(); updatePlayState(false); updateMyLiveStatus(false);
    clearInterval(statsInterval);
    app.classList.add('hidden'); login.classList.remove('hidden');
    document.getElementById('password').value = '';
    document.getElementById('loginBtn').innerHTML = 'INITIALIZE <i class="fa-solid fa-bolt"></i>';
    showToast("Disconnected from Cloud");
};
