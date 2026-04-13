const vipUsers = {
    "Dark_eio": "moh0909",
    "Muskan": "love2026",
    "Sanskar": "yaar123",
    "Harsh": "dost123",
    "Preeti": "bff" 
};

// Screen Elements
const splash = document.getElementById('splashScreen');
const login = document.getElementById('loginScreen');
const app = document.getElementById('mainApp');
const loginBtn = document.getElementById('loginBtn');
const userTag = document.getElementById('userTag');

// Splash Logic
setTimeout(() => {
    splash.classList.add('hidden');
    login.classList.remove('hidden');
}, 2500);

// Login Logic
loginBtn.addEventListener('click', () => {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value.trim();
    if (vipUsers[u] && vipUsers[u] === p) {
        login.classList.add('hidden');
        app.classList.remove('hidden');
        userTag.innerHTML = `<i class="fa-solid fa-crown"></i> ${u}`;
        fetchMusic("Latest Bollywood");
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
});

// Music Logic
const audio = document.getElementById('audioElement');
const playBtn = document.getElementById('playBtn');
const progressBar = document.getElementById('progressBar');
let songList = [];
let currentIndex = 0;

async function fetchMusic(query) {
    document.getElementById('statusText').innerText = "तलाश जारी है...";
    try {
        const res = await fetch(`https://saavn.sumit.co/api/search/songs?query=${query}`);
        const data = await res.json();
        songList = data.data.results;
        renderSongs();
        document.getElementById('statusText').innerText = "तेरे लिए ख़ास...";
    } catch (e) {
        document.getElementById('statusText').innerText = "सर्वर डाउन है!";
    }
}

function renderSongs() {
    const grid = document.getElementById('songsGrid');
    grid.innerHTML = '';
    songList.forEach((song, i) => {
        const div = document.createElement('div');
        div.className = 'song-card';
        div.innerHTML = `<img src="${song.image[2].url}"><h4>${song.name}</h4><i class="fa-solid fa-play"></i>`;
        div.onclick = () => loadSong(i);
        grid.appendChild(div);
    });
}

function loadSong(i) {
    currentIndex = i;
    const s = songList[i];
    document.getElementById('songTitle').innerText = s.name;
    document.getElementById('artistName').innerText = s.artists.primary[0].name;
    document.getElementById('coverImage').src = s.image[2].url;
    audio.src = s.downloadUrl[4].url;
    audio.play();
    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
}

playBtn.onclick = () => {
    if (audio.paused) { audio.play(); playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>'; }
    else { audio.pause(); playBtn.innerHTML = '<i class="fa-solid fa-play"></i>'; }
};

document.getElementById('nextBtn').onclick = () => loadSong((currentIndex + 1) % songList.length);
document.getElementById('prevBtn').onclick = () => loadSong((currentIndex - 1 + songList.length) % songList.length);

audio.ontimeupdate = () => {
    progressBar.style.width = (audio.currentTime / audio.duration * 100) + '%';
};

// Search & VIP
document.getElementById('searchBtn').onclick = () => fetchMusic(document.getElementById('searchInput').value);
document.getElementById('vipActionBtn').onclick = () => {
    const t = document.getElementById('vipToast');
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
};
document.getElementById('exploreBtn').onclick = () => fetchMusic("Trending Global");
