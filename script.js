// === THE VIP DATABASE (सिर्फ 4 ख़ास आईडी) ===
const vipDB = { 
    "dark_eio": { pass: "moh0909", relation: "The Creator 👑", theme: "theme-default", themeName: "Dark Neon", seed: "Dark" },
    "Muskan": { pass: "Love", relation: "Wife ❤️", theme: "theme-muskan", themeName: "Romantic Rose", seed: "Muskan" },
    "Preeti": { pass: "bff", relation: "pure Best friend 🤞", theme: "theme-preeti", themeName: "BFF Vibes", seed: "Preeti" },
    "guest": { pass: "1234", relation: "friend 🤝", theme: "theme-guest", themeName: "Minimalist Green", seed: "Guest" }
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

// Profile Elements
const profileSidebar = document.getElementById('profileSidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

let currentUser = "";
let currentQueue = []; 
let myPlaylist = []; 
let currentIndex = 0;
let isPlaylistView = false; 

// 1. Splash
setTimeout(() => { splash.classList.add('hidden'); login.classList.remove('hidden'); }, 2500);

// 2. Clock & Greetings
setInterval(() => {
    const now = new Date();
    let hr = now.getHours(), min = now.getMinutes();
    const ampm = hr >= 12 ? 'PM' : 'AM';
    document.getElementById('timeGreeting').innerText = (hr >= 12 && hr < 17) ? "Good Afternoon," : (hr >= 17 && hr < 21) ? "Good Evening," : (hr >= 21 || hr < 4) ? "शब-बख़ैर," : "Good Morning,";
}, 1000);

// 3. Login & Theme Setup
document.getElementById('loginBtn').onclick = () => {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value.trim();
    
    // Check if user exists in our DB
    const userKeys = Object.keys(vipDB);
    const validUser = userKeys.find(key => key.toLowerCase() === u.toLowerCase());

    if (validUser && vipDB[validUser].pass === p) {
        currentUser = validUser;
        const userData = vipDB[validUser];

        // Apply Custom Theme
        document.body.className = userData.theme;
        
        // Load User Playlist
        const savedDB = localStorage.getItem('arshad_db_' + currentUser);
        myPlaylist = savedDB ? JSON.parse(savedDB) : [];

        // Set UI Details
        document.getElementById('userName').innerText = currentUser;
        document.getElementById('userAvatar').src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.seed}`;
        
        // Set Profile Sidebar Details
        document.getElementById('sideProfAvatar').src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.seed}`;
        document.getElementById('profName').innerText = currentUser;
        document.getElementById('profRelation').innerText = userData.relation;
        document.getElementById('profThemeName').innerText = userData.themeName;
        document.getElementById('profSongCount').innerText = myPlaylist.length;

        login.classList.add('hidden');
        app.classList.remove('hidden');
        showToast(`Welcome, ${currentUser}`);
        fetchMusic("Top Lofi Hindi"); 
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
};

function showToast(msg) {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// --- PROFILE SIDEBAR LOGIC ---
document.getElementById('profileBtn').onclick = () => {
    document.getElementById('profSongCount').innerText = myPlaylist.length; // Update count live
    profileSidebar.classList.add('open');
    sidebarOverlay.classList.add('show');
};
document.getElementById('closeProfileBtn').onclick = closeProfile;
sidebarOverlay.onclick = closeProfile;

function closeProfile() {
    profileSidebar.classList.remove('open');
    sidebarOverlay.classList.remove('show');
}

// Logout
document.getElementById('logoutBtn').onclick = () => {
    closeProfile();
    audio.pause();
    app.classList.add('hidden');
    login.classList.remove('hidden');
    document.getElementById('password').value = '';
    showToast("Logged Out Successfully");
};

// 4. API Fetch
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
        } else {
            document.getElementById('listHeading').innerText = "कुछ नहीं मिला!";
        }
    } catch (e) { document.getElementById('listHeading').innerText = "Network Error!"; }
}

function renderLibrary() {
    songsList.innerHTML = '';
    currentQueue.forEach((song, i) => {
        const div = document.createElement('div');
        div.className = 'song-card';
        const isFav = myPlaylist.some(s => s.id === song.id);
        const heartClass = isFav ? "fa-solid fa-heart" : "fa-regular fa-heart";
        // Let CSS variable handle heart color
        const heartColor = isFav ? "var(--neon-main)" : "#666";

        div.innerHTML = `
            <img src="${song.image[2].url}" onclick="playSong(${i})">
            <div class="song-info-v2" onclick="playSong(${i})">
                <h4>${song.name}</h4>
                <p>${song.artists.primary[0].name}</p>
            </div>
            <button class="fav-btn" style="color:${heartColor}" onclick="toggleFav(event, ${i})">
                <i class="${heartClass}"></i>
            </button>
        `;
        songsList.appendChild(div);
    });
}

window.toggleFav = function(event, index) {
    event.stopPropagation(); 
    const song = currentQueue[index];
    const existsIndex = myPlaylist.findIndex(s => s.id === song.id);
    
    if (existsIndex > -1) {
        myPlaylist.splice(existsIndex, 1);
        showToast("Removed from Vault");
    } else {
        myPlaylist.push(song);
        showToast("Saved to Vault ❤️");
    }
    localStorage.setItem('arshad_db_' + currentUser, JSON.stringify(myPlaylist));
    if (isPlaylistView) currentQueue = myPlaylist; 
    renderLibrary();
};

// 5. Playback & Visuals
window.playSong = function(index) {
    currentIndex = index;
    const song = currentQueue[index];
    
    document.getElementById('playerTitle').innerText = song.name;
    document.getElementById('playerArtist').innerText = song.artists.primary[0].name;
    document.getElementById('playerCover').src = song.image[1].url; 
    
    audio.src = song.downloadUrl[4].url;
    audio.play();
    updatePlayState(true);
};

function updatePlayState(isPlaying) {
    if(isPlaying) {
        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        vinylDisk.classList.add('spin-vinyl');
        visualizer.classList.remove('hidden');
    } else {
        playBtn.innerHTML = '<i class="fa-solid fa-play" style="padding-left:3px"></i>';
        vinylDisk.classList.remove('spin-vinyl');
        visualizer.classList.add('hidden');
    }
}

playBtn.onclick = () => {
    if(audio.paused && currentQueue.length > 0) { audio.play(); updatePlayState(true); } 
    else if (!audio.paused) { audio.pause(); updatePlayState(false); }
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

// --- NEW FEATURES: DOWNLOAD & SHARE ---
document.getElementById('downloadBtn').onclick = () => {
    if(currentQueue.length === 0) return;
    const song = currentQueue[currentIndex];
    const link = document.createElement('a');
    link.href = song.downloadUrl[4].url;
    link.download = song.name + '.mp3'; // Forces download
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Downloading... ⬇️");
};

document.getElementById('shareBtn').onclick = () => {
    if(currentQueue.length === 0) return;
    const song = currentQueue[currentIndex];
    if (navigator.share) {
        navigator.share({
            title: song.name,
            text: `Listen to ${song.name} on ARSHAD Music!`,
            url: song.url
        });
    } else {
        showToast("Share copied to clipboard!");
    }
};

// Navigation
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
    document.getElementById('listHeading').innerText = "Personal Vault";
    
    if(myPlaylist.length === 0) songsList.innerHTML = "<p style='text-align:center; color:#666; margin-top:30px;'>Vault is empty. Add some tracks!</p>";
    else renderLibrary();
};

document.getElementById('searchBtn').onclick = () => {
    const val = searchInput.value;
    if(!isPlaylistView && val) fetchMusic(val);
};

document.getElementById('btnVIP').onclick = () => showToast("Pro Features Coming Soon!");
