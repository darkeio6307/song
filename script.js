// VIP Users Database
const vipDB = { 
    "Dark_eio": "moh0909", 
    "Muskan": "love2026", 
    "Sanskar": "yaar123", 
    "Harsh": "dost123", 
    "Preeti": "bff" 
};

// Elements
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
let currentQueue = []; // जो गाने अभी चल रहे हैं
let myPlaylist = []; // हर यूजर की अपनी प्लेलिस्ट
let currentIndex = 0;
let isPlaylistView = false; // टैब ट्रैक करने के लिए

// 1. Splash Screen Timer
setTimeout(() => {
    splash.classList.add('hidden');
    login.classList.remove('hidden');
}, 2500);

// 2. Real-time Clock & Greetings
setInterval(() => {
    const now = new Date();
    let hr = now.getHours();
    let min = now.getMinutes();
    const ampm = hr >= 12 ? 'PM' : 'AM';
    hr = hr % 12 || 12;
    document.getElementById('liveClock').innerText = `${hr}:${min < 10 ? '0'+min : min} ${ampm}`;
    
    let greet = "Good Morning,";
    const realHour = now.getHours();
    if(realHour >= 12 && realHour < 17) greet = "Good Afternoon,";
    else if(realHour >= 17 && realHour < 21) greet = "Good Evening,";
    else if(realHour >= 21 || realHour < 4) greet = "शब-बख़ैर,";
    document.getElementById('timeGreeting').innerText = greet;
}, 1000);

// 3. Login & Init User
document.getElementById('loginBtn').onclick = () => {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value.trim();
    
    if (vipDB[u] && vipDB[u] === p) {
        currentUser = u;
        
        // यूज़र की प्लेलिस्ट लोकल स्टोरेज से निकालो
        const savedDB = localStorage.getItem('arshad_db_' + currentUser);
        myPlaylist = savedDB ? JSON.parse(savedDB) : [];

        login.classList.add('hidden');
        app.classList.remove('hidden');
        document.getElementById('userName').innerText = u;
        
        showToast(`Welcome to VIP, ${u}!`);
        fetchMusic("Trending Bollywood"); // लॉगिन करते ही होम पेज पर गाने आ जाएंगे
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

// 4. API Music Fetcher
async function fetchMusic(query) {
    document.getElementById('listHeading').innerText = "ढूंढ रहे हैं...";
    songsList.innerHTML = '';
    try {
        const res = await fetch(`https://saavn.sumit.co/api/search/songs?query=${query}`);
        const data = await res.json();
        if(data.success && data.data.results.length > 0) {
            currentQueue = data.data.results;
            renderLibrary();
            document.getElementById('listHeading').innerText = `'${query}' के बेहतरीन नग्मे`;
        } else {
            document.getElementById('listHeading').innerText = "कुछ नहीं मिला!";
        }
    } catch (e) {
        document.getElementById('listHeading').innerText = "Network Error!";
    }
}

// Render Songs (With Heart Logic)
function renderLibrary() {
    songsList.innerHTML = '';
    currentQueue.forEach((song, i) => {
        const div = document.createElement('div');
        div.className = 'song-card';
        
        // चेक करो गाना प्लेलिस्ट में है या नहीं
        const isFav = myPlaylist.some(s => s.id === song.id);
        const heartClass = isFav ? "fa-solid fa-heart" : "fa-regular fa-heart";
        const heartColor = isFav ? "#ff007f" : "#888";

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

// 5. Playlist Add/Remove Logic
window.toggleFav = function(event, index) {
    event.stopPropagation(); // ताकि गाना प्ले न हो जाए
    
    const song = currentQueue[index];
    const existsIndex = myPlaylist.findIndex(s => s.id === song.id);
    
    if (existsIndex > -1) {
        myPlaylist.splice(existsIndex, 1);
        showToast("Playlist से हटाया! 💔");
    } else {
        myPlaylist.push(song);
        showToast("Playlist में महफ़ूज़! ❤️");
    }
    
    // सिर्फ इसी यूज़र के नाम से डेटाबेस सेव करो
    localStorage.setItem('arshad_db_' + currentUser, JSON.stringify(myPlaylist));
    
    if (isPlaylistView) {
        currentQueue = myPlaylist; // अगर प्लेलिस्ट में हैं, तो तुरंत अपडेट करो
    }
    renderLibrary();
};

// 6. Audio Player Core
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
};

playBtn.onclick = () => {
    if(audio.paused && currentQueue.length > 0) {
        audio.play();
        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        document.querySelector('.disk-wrapper').classList.add('spin');
    } else if (!audio.paused) {
        audio.pause();
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        document.querySelector('.disk-wrapper').classList.remove('spin');
    }
};

// --- AUTO PLAY FIX ---
audio.onended = () => {
    if (currentQueue.length > 0) {
        playSong((currentIndex + 1) % currentQueue.length); // गाना खत्म होने पर अगला गाना
    }
};

document.getElementById('nextBtn').onclick = () => { if(currentQueue.length > 0) playSong((currentIndex + 1) % currentQueue.length); };
document.getElementById('prevBtn').onclick = () => { if(currentQueue.length > 0) playSong((currentIndex - 1 + currentQueue.length) % currentQueue.length); };

// Seekbar Logic
audio.ontimeupdate = () => {
    const { duration, currentTime } = audio;
    if(isNaN(duration)) return;
    
    seekSlider.value = (currentTime / duration) * 100;
    timeCurr.innerText = formatTime(currentTime);
    timeTotal.innerText = formatTime(duration);
};

seekSlider.oninput = () => {
    audio.currentTime = (seekSlider.value / 100) * audio.duration;
};

function formatTime(sec) {
    let m = Math.floor(sec / 60);
    let s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0'+s : s}`;
}

// 7. Navigation Tabs & Search
document.getElementById('btnHome').onclick = () => {
    isPlaylistView = false;
    document.querySelector('.dock-item.active').classList.remove('active');
    document.getElementById('btnHome').classList.add('active');
    document.getElementById('searchSection').style.display = 'block';
    
    fetchMusic("Trending Hindi"); // वापस होम पर ट्रेंडिंग गाने
};

document.getElementById('btnPlaylist').onclick = () => {
    isPlaylistView = true;
    document.querySelector('.dock-item.active').classList.remove('active');
    document.getElementById('btnPlaylist').classList.add('active');
    document.getElementById('searchSection').style.display = 'none'; // प्लेलिस्ट में सर्च छुपाओ
    
    currentQueue = myPlaylist;
    document.getElementById('listHeading').innerText = "Your Personal Vibe ❤️";
    
    if(myPlaylist.length === 0) {
        songsList.innerHTML = "<p style='text-align:center; color:#888; margin-top:30px;'>अभी तक कोई गाना सेव नहीं किया मेरे भाई!</p>";
    } else {
        renderLibrary();
    }
};

document.getElementById('searchBtn').onclick = () => {
    const val = searchInput.value;
    if(!isPlaylistView && val) fetchMusic(val);
};

document.getElementById('btnVIP').onclick = () => showToast("Premium Activated!");
