// === VIP Database (तेरे अज़ीज़ दोस्तों की महफ़िल) ===
const vipUsers = {
    "Dark_eio": "moh0909",
    "Muskan": "love2026",
    "Sanskar": "yaar123",
    "Harsh": "dost123",
    "Preeti": "bff"
};

// --- Elements ---
const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const loginBtn = document.getElementById('loginBtn');
const audio = document.getElementById('mainAudio');
const playBtn = document.getElementById('playBtn');
const progressBar = document.getElementById('progressBar');
const floatingQuote = document.getElementById('floatingQuote');

let songList = [];
let currentIndex = 0;

// --- 1. Dynamic Time & Greeting Logic ---
function updateTimeAndGreeting() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; 
    minutes = minutes < 10 ? '0' + minutes : minutes;
    
    document.getElementById('currentTimeDisp').innerText = `${hours}:${minutes} ${ampm}`;

    // वक़्त के हिसाब से इस्तिक़बाल (Greeting)
    let greeting = "Good Morning,";
    const currentHour = now.getHours();
    
    if (currentHour >= 12 && currentHour < 17) greeting = "Good Afternoon,";
    else if (currentHour >= 17 && currentHour < 21) greeting = "Good Evening,";
    else if (currentHour >= 21 || currentHour < 4) greeting = "शब-बख़ैर (Good Night),";

    document.getElementById('greetingText').innerText = greeting;
}
setInterval(updateTimeAndGreeting, 1000);
updateTimeAndGreeting();

// --- 2. Random Magic Quotes ---
const quotes = [
    "क्या लाजवाब इंतख़ाब है!", 
    "सुकून भरे नग्मे...", 
    "Your choice is awesome!", 
    "Happy Listening 🎶", 
    "वाइब है बॉस!",
    "म्यूज़िक से बेहतर कोई दवा नहीं"
];

function showRandomQuotes() {
    // अगर ऐप खुली है तभी कोट्स दिखें
    if(mainApp.classList.contains('hidden')) return;
    
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    floatingQuote.innerText = randomQuote;
    floatingQuote.classList.add('show');
    
    setTimeout(() => {
        floatingQuote.classList.remove('show');
    }, 4000); // 4 सेकंड बाद छुप जाएगा
}
setInterval(showRandomQuotes, 12000); // हर 12 सेकंड में नया कोट आएगा

// --- 3. VIP Login Logic ---
loginBtn.addEventListener('click', () => {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value.trim();
    
    if (vipUsers[u] && vipUsers[u] === p) {
        loginScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        
        // यूज़र का प्यारा सा नाम सेट करना
        document.getElementById('welcomeUser').innerText = u;
        
        showToast(`Welcome to VIP Lounge, ${u}!`);
        fetchSongs("Trending Lofi Hindi"); // डिफ़ॉल्ट शानदार वाइब
    } else {
        document.getElementById('loginError').style.display = 'block';
        setTimeout(() => document.getElementById('loginError').style.display = 'none', 3000);
    }
});

function showToast(msg) {
    const toast = document.getElementById('toastMsg');
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// --- 4. Music Fetching (Saavn API) ---
async function fetchSongs(query) {
    document.getElementById('statusText').innerText = "तलाश जारी है...";
    try {
        const res = await fetch(`https://saavn.sumit.co/api/search/songs?query=${query}`);
        const data = await res.json();
        if(data.success && data.data.results.length > 0) {
            songList = data.data.results;
            renderList();
            document.getElementById('statusText').innerText = `'${query}' के बेहतरीन नग्मे`;
        } else {
            document.getElementById('statusText').innerText = "कुछ नहीं मिला यार!";
        }
    } catch (e) {
        document.getElementById('statusText').innerText = "सर्वर एरर!";
    }
}

// --- 5. Render Beautiful List ---
function renderList() {
    const list = document.getElementById('songsList');
    list.innerHTML = '';
    songList.forEach((song, i) => {
        const div = document.createElement('div');
        div.className = 'song-card';
        div.innerHTML = `
            <img src="${song.image[2].url}" alt="cover">
            <div class="song-card-info">
                <h4>${song.name}</h4>
                <p>${song.artists.primary[0].name}</p>
            </div>
            <i class="fa-solid fa-circle-play play-btn-small"></i>
        `;
        div.onclick = () => loadSong(i);
        list.appendChild(div);
    });
}

// --- 6. Playback Logic ---
function loadSong(i) {
    currentIndex = i;
    const s = songList[i];
    document.getElementById('playerTitle').innerText = s.name;
    document.getElementById('playerArtist').innerText = s.artists.primary[0].name;
    
    const coverImg = document.getElementById('playerCover');
    coverImg.src = s.image[2].url;
    
    audio.src = s.downloadUrl[4].url;
    audio.play();
    
    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    coverImg.classList.add('record-spin');
    
    // Background Play Metadata (अगर Pova 7 लॉक भी हो तो नाम दिखेगा)
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: s.name, artist: s.artists.primary[0].name,
            artwork: [{ src: s.image[2].url, sizes: '512x512', type: 'image/png' }]
        });
    }
}

playBtn.onclick = () => {
    const coverImg = document.getElementById('playerCover');
    if (audio.paused && songList.length > 0) {
        audio.play();
        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        coverImg.classList.add('record-spin');
    } else if (!audio.paused) {
        audio.pause();
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        coverImg.classList.remove('record-spin');
    }
};

document.getElementById('nextBtn').onclick = () => { if(songList.length > 0) loadSong((currentIndex + 1) % songList.length); };
document.getElementById('prevBtn').onclick = () => { if(songList.length > 0) loadSong((currentIndex - 1 + songList.length) % songList.length); };

// Progress Bar
audio.ontimeupdate = () => {
    if (isNaN(audio.duration)) return;
    progressBar.style.width = (audio.currentTime / audio.duration * 100) + '%';
};

// Seek Audio on Progress Click
document.getElementById('progressArea').addEventListener('click', (e) => {
    const width = document.getElementById('progressArea').clientWidth;
    const clickX = e.offsetX;
    if (!isNaN(audio.duration)) audio.currentTime = (clickX / width) * audio.duration;
});

audio.onended = () => document.getElementById('nextBtn').click();

// Search Action
document.getElementById('searchBtn').onclick = () => {
    const q = document.getElementById('searchInput').value;
    if(q) fetchSongs(q);
};
