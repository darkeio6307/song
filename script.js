const vipDB = { 
    "Dark_eio": "moh0909", 
    "Muskan": "love2026", 
    "Sanskar": "yaar123", 
    "Harsh": "dost123", 
    "Preeti": "bff" 
};

// --- DOM Nodes ---
const splash = document.getElementById('splashScreen');
const login = document.getElementById('loginScreen');
const app = document.getElementById('mainApp');
const audio = document.getElementById('audioEngine');
const playBtn = document.getElementById('playBtn');
const seekSlider = document.getElementById('seekSlider');
const timeCurr = document.getElementById('timeCurrent');
const timeTotal = document.getElementById('timeTotal');
const songsList = document.getElementById('songsList');
const searchInput = document.getElementById('searchInput');

let currentUser = "";
let currentQueue = [];
let currentIndex = 0;
let userPlaylists = {}; // Temporary session playlist storage

// 1. Splash Control (Apple Fade Out)
setTimeout(() => {
    splash.classList.add('hidden');
    login.classList.remove('hidden');
}, 3000);

// 2. Real-time Clock & Greetings
function initDashboard() {
    setInterval(() => {
        const now = new Date();
        document.getElementById('liveClock').innerText = now.toLocaleTimeString();
        
        let hr = now.getHours();
        let greet = "Good Morning,";
        if(hr >= 12 && hr < 17) greet = "Good Afternoon,";
        else if(hr >= 17 && hr < 21) greet = "Good Evening,";
        else if(hr >= 21 || hr < 4) greet = "Night Vibes,";
        document.getElementById('timeGreeting').innerText = greet;
    }, 1000);
}

// 3. Login Engine
document.getElementById('loginBtn').onclick = () => {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value.trim();
    
    if (vipDB[u] && vipDB[u] === p) {
        currentUser = u;
        login.classList.add('hidden');
        app.classList.remove('hidden');
        document.getElementById('userName').innerText = u;
        initDashboard();
        showToast(`Welcome VIP, ${u}`);
        fetchMusic("Trending Bollywood lofi");
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
};

// 4. API Music Fetcher (Saavn)
async function fetchMusic(query) {
    document.getElementById('listHeading').innerText = "Loading...";
    try {
        const res = await fetch(`https://saavn.sumit.co/api/search/songs?query=${query}`);
        const data = await res.json();
        currentQueue = data.data.results;
        renderLibrary();
        document.getElementById('listHeading').innerText = `Elite Picks: ${query}`;
    } catch (e) {
        document.getElementById('listHeading').innerText = "Network Error!";
    }
}

function renderLibrary() {
    songsList.innerHTML = '';
    currentQueue.forEach((song, i) => {
        const div = document.createElement('div');
        div.className = 'song-card';
        div.innerHTML = `
            <img src="${song.image[2].url}" onclick="playSong(${i})">
            <div class="song-info-v2" onclick="playSong(${i})">
                <h4>${song.name}</h4>
                <p>${song.artists.primary[0].name}</p>
            </div>
            <button class="fav-btn" onclick="toggleFav(${i})"><i class="fa-solid fa-heart"></i></button>
        `;
        songsList.appendChild(div);
    });
}

// 5. THE PLAYER CORE (Seek, Auto-play, Timer)
window.playSong = function(index) {
    currentIndex = index;
    const song = currentQueue[index];
    
    document.getElementById('playerTitle').innerText = song.name;
    document.getElementById('playerArtist').innerText = song.artists.primary[0].name;
    document.getElementById('playerCover').src = song.image[2].url;
    
    audio.src = song.downloadUrl[4].url;
    audio.play();
    
    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    document.querySelector('.disk-wrapper').classList.add('spin');
    
    // Background play info
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: song.name, artist: song.artists.primary[0].name,
            artwork: [{ src: song.image[2].url, sizes: '512x512', type: 'image/png' }]
        });
    }
};

playBtn.onclick = () => {
    if(audio.paused) {
        audio.play();
        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        document.querySelector('.disk-wrapper').classList.add('spin');
    } else {
        audio.pause();
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        document.querySelector('.disk-wrapper').classList.remove('spin');
    }
};

// Seekbar Sync (Ungli se Skip karne ka logic)
audio.ontimeupdate = () => {
    const { duration, currentTime } = audio;
    if(isNaN(duration)) return;
    
    const percent = (currentTime / duration) * 100;
    seekSlider.value = percent;
    
    timeCurr.innerText = formatTime(currentTime);
    timeTotal.innerText = formatTime(duration);
};

seekSlider.oninput = () => {
    const seekTo = (seekSlider.value / 100) * audio.duration;
    audio.currentTime = seekTo;
};

function formatTime(sec) {
    let m = Math.floor(sec / 60);
    let s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0'+s : s}`;
}

// 6. AUTO PLAY NEXT
audio.onended = () => {
    currentIndex = (currentIndex + 1) % currentQueue.queue;
    playSong(currentIndex);
};

document.getElementById('nextBtn').onclick = () => playSong((currentIndex + 1) % currentQueue.length);
document.getElementById('prevBtn').onclick = () => playSong((currentIndex - 1 + currentQueue.length) % currentQueue.length);

// 7. Search & Nav Interaction
document.getElementById('searchBtn').onclick = () => {
    const val = searchInput.value;
    if(val) fetchMusic(val);
};

window.toggleFav = function(i) {
    showToast("Added to Playlist ❤️");
};

function showToast(msg) {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
}

// Random Quotes Logic
const moodQuotes = ["Happy Listening, Arshad!", "Elite Choice, VIP!", "Vibes are set to High!", "Enjoy the Rhythm..."];
setInterval(() => {
    document.getElementById('floatingQuote').innerText = moodQuotes[Math.floor(Math.random()*moodQuotes.length)];
}, 10000);
