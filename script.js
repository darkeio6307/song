// === THE VIP DATABASE (with Local PFPs from GitHub) ===
const vipDB = { 
    "dark_eio": { pass: "moh0909", relation: "The Creator 👑", theme: "theme-default", themeName: "Dark Neon", avatar: "darkeio.jpg" },
    "Muskan": { pass: "Love", relation: "Wife ❤️", theme: "theme-muskan", themeName: "Romantic Rose", avatar: "wife.jpg" },
    "Preeti": { pass: "bff", relation: "pure Best friend 🤞", theme: "theme-preeti", themeName: "BFF Vibes", avatar: "bff.jpg" },
    "guest": { pass: "1234", relation: "friend 🤝", theme: "theme-guest", themeName: "Minimalist Green", avatar: "guest.jpg" }
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

// Profile Elements
const profileSidebar = document.getElementById('profileSidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

let currentUser = "";
let currentQueue = []; 
let myPlaylist = []; 
let currentIndex = 0;
let isPlaylistView = false; 
let noteInterval;

// --- FEATURE 1: NEON TOUCH RIPPLE ---
document.addEventListener('click', function(e) {
    const ripple = document.createElement('div');
    ripple.className = 'touch-ripple';
    ripple.style.left = `${e.clientX - 20}px`;
    ripple.style.top = `${e.clientY - 20}px`;
    ripple.style.width = '40px';
    ripple.style.height = '40px';
    document.body.appendChild(ripple);
    setTimeout(() => { ripple.remove(); }, 600);
});

// 1. Splash
setTimeout(() => { splash.classList.add('hidden'); login.classList.remove('hidden'); }, 2500);

// 2. Clock & Greetings
setInterval(() => {
    const now = new Date();
    let hr = now.getHours(), min = now.getMinutes();
    const ampm = hr >= 12 ? 'PM' : 'AM';
    document.getElementById('timeGreeting').innerText = (hr >= 12 && hr < 17) ? "Good Afternoon," : (hr >= 17 && hr < 21) ? "Good Evening," : (hr >= 21 || hr < 4) ? "शब-बख़ैर," : "Good Morning,";
}, 1000);

// 3. Login & Setup Local PFP
document.getElementById('loginBtn').onclick = () => {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value.trim();
    
    const userKeys = Object.keys(vipDB);
    const validUser = userKeys.find(key => key.toLowerCase() === u.toLowerCase());

    if (validUser && vipDB[validUser].pass === p) {
        currentUser = validUser;
        const userData = vipDB[validUser];

        // Apply Custom Theme
        document.body.className = userData.theme;
        
        const savedDB = localStorage.getItem('arshad_db_' + currentUser);
        myPlaylist = savedDB ? JSON.parse(savedDB) : [];

        // Set UI Details & Local PFPs
        document.getElementById('userName').innerText = currentUser;
        document.getElementById('userAvatar').src = userData.avatar;
        document.getElementById('sideProfAvatar').src = userData.avatar;
        
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

// PROFILE SIDEBAR
document.getElementById('profileBtn').onclick = () => {
    document.getElementById('profSongCount').innerText = myPlaylist.length; 
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
    audio.pause(); updatePlayState(false);
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

// --- FEATURE 2 & 3: FLOATING NOTES & BEAT SYNC ---
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
        bgAura.classList.add('beat-sync'); // Beat Sync ON
        if(!noteInterval) noteInterval = setInterval(createNote, 800); // Floating Notes ON
    } else {
        playBtn.innerHTML = '<i class="fa-solid fa-play" style="padding-left:3px"></i>';
        vinylDisk.classList.remove('spin-vinyl');
        visualizer.classList.add('hidden');
        bgAura.classList.remove('beat-sync'); // Beat Sync OFF
        clearInterval(noteInterval); noteInterval = null; // Floating Notes OFF
    }
}

// Playback Logic
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

playBtn.onclick = () => {
    if(audio.paused && currentQueue.length > 0) { audio.play(); updatePlayState(true); } 
    else if (!audio.paused) { audio.pause(); updatePlayState(false); }
};

audio.onended = () => { if (currentQueue.length > 0) playSong((currentIndex + 1) % currentQueue.length); };
document.getElementById('nextBtn').onclick = () => { if(currentQueue.length > 0) playSong((currentIndex + 1) % currentQueue.length); };
document.getElementById('prevBtn').onclick = () => { if(currentQueue.length > 0) playSong((currentIndex - 1 + currentQueue.length) % currentQueue.length); };

// Seekbar
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
    if (navigator.share) { navigator.share({ title: song.name, text: `Listen to ${song.name} on ARSHAD Music!`, url: song.url }); } 
    else { showToast("Share copied!"); }
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
