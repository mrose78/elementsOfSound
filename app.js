let soundLibrary = [];
const activeAudios = { "spot-1": null, "spot-2": null, "spot-3": null };

// 1. Load the Data
async function init() {
    try {
        const response = await fetch('sounds.json');
        soundLibrary = (await response.json()).library;
        renderPawns();
        setupDragEvents();
    } catch (e) {
        console.error("Failed to load sounds.json");
    }
}

// 2. Create Pawns
function renderPawns() {
    const rack = document.getElementById('pawn-rack');
    soundLibrary.forEach(item => {
        const p = document.createElement('div');
        p.className = 'pawn';
        p.id = item.id;
        p.draggable = true;
        p.innerText = item.name;
        p.addEventListener('dragstart', (e) => e.dataTransfer.setData("text/plain", e.target.id));
        rack.appendChild(p);
    });
}

// 3. Unified Drop Handler
function setupDragEvents() {
    const targets = document.querySelectorAll('.drop-spot, .inventory');
    
    targets.forEach(target => {
        target.addEventListener('dragover', (e) => e.preventDefault());
        
        target.addEventListener('drop', (e) => {
            e.preventDefault();
            const pawnId = e.dataTransfer.getData("text/plain");
            const pawn = document.getElementById(pawnId);

            // Prevent stacking on spots
            if (target.classList.contains('drop-spot') && target.children.length > 0) return;

            target.appendChild(pawn);
            
            // Critical: Refresh all audio states every time a pawn moves
            refreshAudioSystem();
        });
    });
}

// 4. State Management
function refreshAudioSystem() {
    const spotIds = ["spot-1", "spot-2", "spot-3"];
    
    spotIds.forEach(spotId => {
        const spotEl = document.getElementById(spotId);
        const hasPawn = spotEl.children.length > 0;

        if (hasPawn) {
            const pawnId = spotEl.firstChild.id;
            startSpotAudio(spotId, pawnId);
        } else {
            stopSpotAudio(spotId);
        }
    });

    updateConsole();
}

function startSpotAudio(spotId, pawnId) {
    const data = soundLibrary.find(s => s.id === pawnId);
    const file = data.sounds[spotId];

    // If a different sound is already playing here, stop it first
    if (activeAudios[spotId] && activeAudios[spotId].src.includes(file)) return; 
    
    if (activeAudios[spotId]) activeAudios[spotId].pause();

    const audio = new Audio(file);
    audio.loop = true;
    audio.play().catch(() => console.log("Waiting for user click..."));
    
    activeAudios[spotId] = audio;
    document.getElementById(spotId).classList.add('active');
}

function stopSpotAudio(spotId) {
    if (activeAudios[spotId]) {
        activeAudios[spotId].pause();
        activeAudios[spotId] = null;
    }
    document.getElementById(spotId).classList.remove('active');
}

function updateConsole() {
    const display = document.getElementById('display-area');
    display.innerHTML = '';
    let count = 0;

    Object.keys(activeAudios).forEach(spotId => {
        if (activeAudios[spotId]) {
            count++;
            const pawn = document.getElementById(spotId).firstChild;
            const data = soundLibrary.find(s => s.id === pawn.id);
            
            display.innerHTML += `
                <div class="track-info">
                    <span><b>ZONE:</b>${spotId.replace('spot-','')}</span>
                    <span><b>FILE:</b>${data.name}</span>
                    <span><b>DESC:</b>${data.description}</span>
                </div>`;
        }
    });

    if (count === 0) display.innerHTML = '<div class="log-entry">> NO SIGNALS DETECTED...</div>';
}

init();