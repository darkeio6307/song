// === VIP Database Update ===
const vipUsers = {
    "Dark_eio": "moh0909",
    "Muskan": "love2026",
    "Sanskar": "yaar123",
    "Harsh": "dost123",
    "Preeti": "bff" // नई VIP एंट्री!
};

// --- VIP Button & Explore Interaction ---
const navItems = document.querySelectorAll('.nav-item');
const exploreSection = document.getElementById('exploreSection'); // (Add this ID in HTML if needed)

navItems.forEach(item => {
    item.addEventListener('click', () => {
        // Active class हटाना और लगाना
        document.querySelector('.nav-item.active').classList.remove('active');
        item.classList.add('active');

        if(item.innerText.includes('Explore')) {
            statusText.innerText = "दुनिया भर के नग्मे तलाशो...";
            searchSaavn("Latest Global Hits"); // Explore पर क्लिक करते ही नए गाने
        }
        if(item.innerText.includes('Home')) {
            searchSaavn("Trending Hindi");
        }
    });
});

// VIP / Premium Button Click Logic
vipActionBtn.addEventListener('click', () => {
    vipToast.innerHTML = '<i class="fa-solid fa-gem"></i> VIP Access Granted to ' + currentLoggedInUser;
    vipToast.classList.add('show');
    setTimeout(() => vipToast.classList.remove('show'), 3000);
});

let currentLoggedInUser = "";

// Login Logic (Modified to track user)
loginBtn.addEventListener('click', () => {
    const u = usernameInput.value.trim();
    const p = passwordInput.value.trim();

    if (vipUsers[u] && vipUsers[u] === p) {
        currentLoggedInUser = u;
        loginScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        document.querySelector('.user-profile').innerHTML = `<i class="fa-solid fa-crown"></i> ${u}`;
        searchSaavn("Top Bollywood"); 
    } else {
        loginError.style.display = 'block';
        setTimeout(() => loginError.style.display = 'none', 3000);
    }
});

// --- Enhanced List View (No Horizontal Scroll) ---
function renderGrid(songs) {
    songsGrid.innerHTML = '';
    songs.forEach((song, index) => {
        const card = document.createElement('div');
        card.classList.add('song-card');
        const imgUrl = song.image[song.image.length - 1].url;

        card.innerHTML = `
            <img src="${imgUrl}" alt="cover">
            <div class="song-info-text">
                <h4>${song.name}</h4>
                <p>${song.artists.primary[0].name}</p>
            </div>
            <i class="fa-solid fa-circle-play" style="color: #00f0ff; font-size: 20px;"></i>
        `;
        
        card.addEventListener('click', () => {
            currentSongIndex = index;
            loadSong(songList[currentSongIndex]);
        });
        songsGrid.appendChild(card);
    });
}

// Player Next/Prev Logic
nextBtn.addEventListener('click', () => {
    if(songList.length === 0) return;
    currentSongIndex = (currentSongIndex + 1) % songList.length;
    loadSong(songList[currentSongIndex]);
});

prevBtn.addEventListener('click', () => {
    if(songList.length === 0) return;
    currentSongIndex = (currentSongIndex - 1 + songList.length) % songList.length;
    loadSong(songList[currentSongIndex]);
});

// Automatic Next Song
audio.addEventListener('ended', () => {
    nextBtn.click();
});
