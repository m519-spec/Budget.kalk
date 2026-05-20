let händelser = JSON.parse(localStorage.getItem('händelser')) || [];
let familjeMedlemmar = JSON.parse(localStorage.getItem('familjeMedlemmar')) || ["Mamma", "Pappa", "Barnen", "Gemensamt"];
let nuvarandeTema = localStorage.getItem('tema') || 'default';
let usdRate = 0; 

const lista = document.getElementById('transaktions-lista');
const form = document.getElementById('transaktions-formulär');
const kommentarRuta = document.getElementById('kommentar-fält');
const medlemSelect = document.getElementById('medlem');
const balansUsdEl = document.getElementById('balans-usd');

const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettings = document.getElementById('close-settings');
const saveSettings = document.getElementById('save-settings');
const familyInput = document.getElementById('family-members-input');
const resetBtn = document.getElementById('reset-data-btn');
const themeSelect = document.getElementById('theme-select');

const emojis = { 
    pizza: '🍕', mat: '🍔', lön: '💰', bil: '🚗', hyra: '🏠', 
    godis: '🍬', träning: '💪', present: '🎁', glass: '🍦', 
    kaffe: '☕', bio: '🎬', spel: '🎮', kläder: '👕', hund: '🐶' 
};

async function hamtaVaxelkurs() {
    try {
        const svar = await fetch('https://open.er-api.com/v6/latest/SEK');
        const data = await svar.json();
        usdRate = data.rates.USD;
        uppdatera(); 
    } catch (fel) {
        console.log("Kunde inte hämta växelkurs:", fel);
    }
}

async function hamtaTips() {
    try {
        const svar = await fetch('https://api.adviceslip.com/advice');
        const data = await svar.json();
        kommentarRuta.innerText = data.slip.advice;
        kommentarRuta.style.display = 'flex';
        setTimeout(() => kommentarRuta.style.display = 'none', 5000);
    } catch (fel) {
        kommentarRuta.innerText = "Spara pengar är bra! 💰";
    }
}

const fixaEmoji = (titel) => {
    const titelLåg = titel.toLowerCase();
    const hittad = Object.keys(emojis).find(nyckel => titelLåg.includes(nyckel));
    return hittad ? emojis[hittad] : '📝';
};

function uppdatera() {
    medlemSelect.innerHTML = '';
    familjeMedlemmar.forEach(medlem => {
        const option = document.createElement('option');
        option.value = medlem;
        option.textContent = medlem;
        medlemSelect.appendChild(option);
    });

    lista.innerHTML = '';
    let inkomst = 0, utgift = 0;

    händelser.forEach((h, i) => {
        h.typ === 'inkomst' ? inkomst += Number(h.belopp) : utgift += Number(h.belopp);

        lista.innerHTML += `
            <li class="${h.typ === 'inkomst' ? 'income' : 'expense'}">
                <div class="vänster-del">
                    <div class="emoji-ikon">${fixaEmoji(h.titel)}</div>
                    <div class="transaction-info">
                        <span class="transaction-title">${h.titel}</span>
                        <small style="color: var(--text-muted); font-size: 0.75rem;">${h.datum || 'Inget datum'}</small>
                        <span class="familje-tagg">${h.medlem}</span>
                    </div>
                </div>
                <div class="höger-del" style="display:flex; align-items:center; gap:15px;">
                    <span class="transaction-amount">${h.typ === 'inkomst' ? '+' : '-'}${h.belopp} kr</span>
                    <button class="delete-btn" onclick="radera(${i})">✕</button>
                </div>
            </li>`;
    });

    const balanceEl = document.getElementById('balans');
    const oldBalance = balanceEl.innerText;
    const totalBalans = inkomst - utgift;
    const newBalance = totalBalans + ' kr';
    
    document.getElementById('total-inkomst').innerText = inkomst + ' kr';
    document.getElementById('total-utgift').innerText = utgift + ' kr';
    balanceEl.innerText = newBalance;

    if (usdRate > 0) {
        const balansUsd = (totalBalans * usdRate).toFixed(2);
        balansUsdEl.innerText = `($${balansUsd} USD)`;
    }

    if (oldBalance !== newBalance) {
        balanceEl.parentElement.parentElement.classList.add('pulse');
        setTimeout(() => balanceEl.parentElement.parentElement.classList.remove('pulse'), 500);
    }

    localStorage.setItem('händelser', JSON.stringify(händelser));
}

const radera = (i) => {
    händelser.splice(i, 1);
    uppdatera();
};


form.addEventListener('submit', (h) => {
    h.preventDefault();
    
    const ny = {
        titel: document.getElementById('titel').value,
        belopp: Math.abs(document.getElementById('belopp').value),
        typ: document.getElementById('typ').value,
        medlem: document.getElementById('medlem').value,
        datum: new Date().toISOString().split('T')[0]
    };
    
    händelser.push(ny);
    
    hamtaTips();

    uppdatera();
    form.reset();
});


function appliceraTema(tema) {
    document.documentElement.setAttribute('data-theme', tema);
    localStorage.setItem('tema', tema);
}

settingsBtn.addEventListener('click', () => {
    familyInput.value = familjeMedlemmar.join(', ');
    themeSelect.value = nuvarandeTema;
    settingsModal.style.display = 'flex';
});

closeSettings.addEventListener('click', () => {
    settingsModal.style.display = 'none';
});

saveSettings.addEventListener('click', () => {
    nuvarandeTema = themeSelect.value;
    appliceraTema(nuvarandeTema);

    const nyaMedlemmar = familyInput.value.split(',').map(m => m.trim()).filter(m => m !== '');
    if (nyaMedlemmar.length > 0) {
        familjeMedlemmar = nyaMedlemmar;
        localStorage.setItem('familjeMedlemmar', JSON.stringify(familjeMedlemmar));
        uppdatera();
        settingsModal.style.display = 'none';
    } else {
        alert("Du måste ha minst en familjemedlem!");
    }
});

resetBtn.addEventListener('click', () => {
    if (confirm("Är du säker på att du vill nollställa all data? Detta går inte att ångra.")) {
        händelser = [];
        localStorage.removeItem('händelser');
        uppdatera();
        settingsModal.style.display = 'none';
    }
});

window.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        settingsModal.style.display = 'none';
    }
});

appliceraTema(nuvarandeTema); 
hamtaVaxelkurs();
uppdatera();
