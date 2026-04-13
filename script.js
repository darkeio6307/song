// VIP Users की महफ़िल
const vipUsers = { "Dark_eio": "moh0909", "Muskan": "love2026", "Sanskar": "yaar123", "Harsh": "dost123", "Preeti": "bff" };

// Elements
const splashScreen = document.getElementById('splashScreen');
const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const audio = document.getElementById('audioPlayer');
const playBtn = document.getElementById('playBtn');
const progressBar = document.getElementById('progressBar');
const songsList = document.getElementById('songsList');
const listTitle = document.getElementById('listTitle');

let currentQueue = []; 
let myPlaylist = JSON.parse(localStorage.getItem('arshad_playlist')) || []; 
let currentIndex = 0;
let isPlaylistView = false; 

// === 1. SPLASH SCREEN FIX (यही वो जादुई टाइमर है जो मैं भूल गया था) ===
setTimeout(() => {
    splashScreen.classList.add('hidden'); // एनीमेशन को छुपाओ
    loginScreen.classList.remove('hidden'); // लॉगिन स्क्रीन को दिखाओ
}, 3000); // 3 सेकंड बाद पर्दा उठेगा

// Time Update (वक़्त और इस्तिक़बाल)
function updateTime() {
    const now = new Date();
    let h = now.getHours(), m = now.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    document.getElementById('clock').innerText = `${h}:${m < 10 ? '0'+m : m} ${ampm}`;
    
    let greet = "Good Morning,";
    if (now.getHours() >= 12 && now.getHours() < 17) greet = "Good Afternoon,";
    else if (now.getHours() >= 17) greet = "Good Evening,";
    document.getElementById('greeting').innerText = greet;
}
setInterval(updateTime, 1000); updateTime();

// Login Logic
document.getElementById('loginBtn').onclick = () => {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value.trim();
    if (vipUsers[u] && vipUsers[u] === p) {
        loginScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        document.getElementById('userName').innerText = u;
        fetchSongs("Trending Hindi"); // डिफ़ॉल्ट गाने
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
};

function showToast(msg) {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}

// Fetch from API
async function fetchSongs(query) {
    listTitle.innerText = "तलाश जारी है...";
    songsList.innerHTML = '';
    try {
        const res = await fetch(`https://saavn.sumit.co/api/search/songs?query=${query}`);
        const data = await res.json();
        if(data.success && data.data.results.length > 0) {
            currentQueue = data.data.results;
            renderSongs(currentQueue);
            listTitle.innerText = `'${query}' के रिज़ल्ट्स`;
        } else {
            listTitle.innerText = "कुछ नहीं मिला यार!";
        }
    } catch (e) {
        listTitle.innerText = "इंटरनेट एरर!";
    }
}

// Render List
function renderSongs(songs) {
    songsList.innerHTML = '';
    songs.forEach((song, i) => {
        const div = document.createElement('div');
        div.className = 'song-card';
        
        const isFav = myPlaylist.some(s => s.id === song.id);
        const heartIcon = isFav ? "fa-solid fa-heart" : "fa-regular fa-heart";

        div.innerHTML = `
            <img src="${song.image[2].url}" onclick="loadSong(${i})">
            <div class="song-info" onclick="loadSong(${i})">
                <h4>${song.name}</h4>
                <p>${song.artists.primary[0].name}</p>
            </div>
            <button class="add-fav-btn" onclick="togglePlaylist(${i})">
                <i class="${heartIcon}"></i>
            </button>
        `;
        songsList.appendChild(div);
    });
}

// Add/Remove from Playlist
window.togglePlaylist = function(index) {
    const song = currentQueue[index];
    const existsIndex = myPlaylist.findIndex(s => s.id === song.id);
    
    if (existsIndex > -1) {
        myPlaylist.splice(existsIndex, 1); 
        showToast("Playlist से हटा दिया!");
    } else {
        myPlaylist.push(song); 
        showToast("Playlist में सेव हो गया! ❤️");
    }
    
    localStorage.setItem('arshad_playlist', JSON.stringify(myPlaylist));
    
    if (isPlaylistView) currentQueue = myPlaylist; 
    renderSongs(currentQueue);
};

// Play Logic
window.loadSong = function(i) {
    currentIndex = i;
    const s = currentQueue[i];
    document.getElementById('playerTitle').innerText = s.name;
    document.getElementById('playerArtist').innerText = s.artists.primary[0].name;
    document.getElementById('playerImg').src = s.image[2].url;
    
    audio.src = s.downloadUrl[4].url;
    audio.play();
    
    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    document.getElementById('playerImg').classList.add('spin');
};

playBtn.onclick = () => {
    if (audio.paused && currentQueue.length > 0) { 
        audio.play(); 
        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>'; 
        document.getElementById('playerImg').classList.add('spin'); 
    } else if (!audio.paused) { 
        audio.pause(); 
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>'; 
        document.getElementById('playerImg').classList.remove('spin'); 
    }
};

// Auto Play
audio.addEventListener('ended', () => {
    if (currentQueue.length > 0) loadSong((currentIndex + 1) % currentQueue.length); 
});

document.getElementById('nextBtn').onclick = () => { if(currentQueue.length > 0) loadSong((currentIndex + 1) % currentQueue.length); };
document.getElementById('prevBtn').onclick = () => { if(currentQueue.length > 0) loadSong((currentIndex - 1 + currentQueue.length) % currentQueue.length); };

audio.ontimeupdate = () => {
    if (isNaN(audio.duration)) return;
    progressBar.style.width = (audio.currentTime / audio.duration * 100) + '%';
};

// Navigation Tabs
document.getElementById('tabHome').onclick = () => {
    isPlaylistView = false;
    document.querySelector('.nav-item.active').classList.remove('active');
    document.getElementById('tabHome').classList.add('active');
    document.getElementById('searchArea').style.display = 'flex';
    fetchSongs("Trending Hindi"); 
};

document.getElementById('tabPlaylist').onclick = () => {
    isPlaylistView = true;
    document.querySelector('.nav-item.active').classList.remove('active');
    document.getElementById('tabPlaylist').classList.add('active');
    document.getElementById('searchArea').style.display = 'none'; 
    
    currentQueue = myPlaylist;
    listTitle.innerText = "तेरी पर्सनल Playlist ❤️";
    
    if(myPlaylist.length === 0) {
        songsList.innerHTML = "<p style='text-align:center; color:#888; margin-top:20px;'>अभी तक कोई गाना सेव नहीं किया!</p>";
    } else {
        renderSongs(currentQueue);
    }
};

document.getElementById('searchBtn').onclick = () => {
    if(!isPlaylistView && document.getElementById('searchInput').value) {
        fetchSongs(document.getElementById('searchInput').value);
    }
};

document.getElementById('vipBtn').onclick = () => showToast("Only VIP Allowed!");
