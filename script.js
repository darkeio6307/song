const users = { "Dark_eio": "moh0909", "Muskan": "love2026", "Sanskar": "yaar123", "Harsh": "dost123", "Preeti": "bff" };

// Elements
const splash = document.getElementById('splashScreen');
const login = document.getElementById('loginScreen');
const app = document.getElementById('mainApp');
const audio = document.getElementById('mainAudio');
const playBtn = document.getElementById('playBtn');
const progressBar = document.getElementById('progressBar');

let songList = [];
let currentIndex = 0;

// Splash to Login
setTimeout(() => {
    splash.classList.add('hidden');
    login.classList.remove('hidden');
}, 2500);

// Login Logic
document.getElementById('loginBtn').onclick = () => {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value.trim();
    if (users[u] && users[u] === p) {
        login.classList.add('hidden');
        app.classList.remove('hidden');
        document.getElementById('userTag').innerText = u;
        fetchSongs("Latest Trending");
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
};

// Fetch Music (Saavn API)
async function fetchSongs(query) {
    document.getElementById('statusText').innerText = "Searching...";
    try {
        const res = await fetch(`https://saavn.sumit.co/api/search/songs?query=${query}`);
        const data = await res.json();
        songList = data.data.results;
        renderList();
        document.getElementById('statusText').innerText = "Results for " + query;
    } catch (e) {
        document.getElementById('statusText').innerText = "Server Error!";
    }
}

function renderList() {
    const list = document.getElementById('songsList');
    list.innerHTML = '';
    songList.forEach((song, i) => {
        const div = document.createElement('div');
        div.className = 'song-item';
        div.innerHTML = `
            <img src="${song.image[2].url}">
            <div class="song-info">
                <h4>${song.name}</h4>
                <p>${song.artists.primary[0].name}</p>
            </div>
            <i class="fa-solid fa-circle-play play-icon"></i>
        `;
        div.onclick = () => loadSong(i);
        list.appendChild(div);
    });
}

function loadSong(i) {
    currentIndex = i;
    const s = songList[i];
    document.getElementById('playerTitle').innerText = s.name;
    document.getElementById('playerArtist').innerText = s.artists.primary[0].name;
    document.getElementById('playerCover').src = s.image[2].url;
    audio.src = s.downloadUrl[4].url;
    audio.play();
    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    
    // Background Play (Media Session API)
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: s.name,
            artist: s.artists.primary[0].name,
            artwork: [{ src: s.image[2].url, sizes: '512x512', type: 'image/png' }]
        });
    }
}

playBtn.onclick = () => {
    if (audio.paused) {
        audio.play();
        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    } else {
        audio.pause();
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
};

// Controls
document.getElementById('nextBtn').onclick = () => loadSong((currentIndex + 1) % songList.length);
document.getElementById('prevBtn').onclick = () => loadSong((currentIndex - 1 + songList.length) % songList.length);

// Progress & Time
audio.ontimeupdate = () => {
    const { duration, currentTime } = audio;
    if (isNaN(duration)) return;
    progressBar.style.width = (currentTime / duration * 100) + '%';
    document.getElementById('currTime').innerText = formatTime(currentTime);
    document.getElementById('totalTime').innerText = formatTime(duration);
};

function formatTime(time) {
    let min = Math.floor(time / 60);
    let sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
}

// Search
document.getElementById('searchBtn').onclick = () => {
    const q = document.getElementById('searchInput').value;
    if(q) fetchSongs(q);
};

// VIP Button Fix
document.getElementById('vipBtn').onclick = () => {
    const t = document.getElementById('toast');
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
};

document.getElementById('exploreBtn').onclick = () => fetchSongs("Global Top 50");
audio.onended = () => document.getElementById('nextBtn').click();
