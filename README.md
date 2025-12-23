# 🏆 Fantacalcio App

App mobile cross-platform per la gestione del fantacalcio, costruita con React Native ed Expo.

## ✨ Funzionalità Principali

### Autenticazione
- ✅ Login / Registrazione
- ✅ Gestione sessione con JWT

### Gestione Leghe
- ✅ Crea nuova lega
- ✅ Partecipa a lega esistente (sfoglia leghe pubbliche o codice invito)
- ✅ Visualizza dettagli lega
- ✅ Impostazioni lega

### Gestione Squadra
- ✅ Visualizza rosa completa
- ✅ Inserisci formazione con selezione modulo
- ✅ Drag & drop giocatori (in sviluppo)
- ✅ Salva formazione per giornata
- ✅ Carica formazione giornata precedente

### Giocatori
- ✅ Lista svincolati
- ✅ Ricerca per nome
- ✅ Filtro per ruolo (P, D, C, A)

### Competizioni
- ✅ Visualizza competizioni attive
- 🚧 Crea nuove competizioni (5 tipi disponibili)
  - Somma Punti
  - Campionato
  - Coppa con Gruppi
  - Coppa a Eliminazione Diretta
  - Formula 1

### Calendario & Classifiche
- ✅ Calendario partite
- ✅ Risultati giornate passate
- ✅ Prossimi scontri
- ✅ Classifica per competizione

### Partecipanti
- ✅ Lista squadre partecipanti
- ✅ Visualizza dettagli squadra

### Mercato
- 🚧 Placeholder (in arrivo: scambi e aste)

## 🚀 Avvio Rapido

### Prerequisiti
- Node.js (v16+)
- npm o yarn
- Expo CLI
- Backend FastAPI attivo

### 1. Installa dipendenze
```bash
cd FantacalcioApp
npm install
```

### 2. Configura l'API
Modifica `src/config/api.js` per puntare al tuo backend:

```javascript
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8000'  // Backend locale
  : 'https://your-railway-app.railway.app';  // Backend production
```

### 3. Avvia l'app
```bash
# Avvia Expo
npm start

# Oppure direttamente per una piattaforma specifica
npm run android  # Android
npm run ios      # iOS (solo su Mac)
npm run web      # Web browser
```

### 4. Avvia il Backend (terminale separato)
```bash
cd ../Progetto-Fantacalcio-API/Fantasy-Football-API
python main.py
```

## 📱 Testing

### Su dispositivo fisico
1. Installa l'app Expo Go sul tuo smartphone
2. Scansiona il QR code mostrato dopo `npm start`

### Su emulatore
- **Android**: Android Studio con emulatore configurato
- **iOS**: Xcode con simulatore (solo macOS)

## 🏗️ Struttura Progetto

```
FantacalcioApp/
├── src/
│   ├── config/
│   │   └── api.js              # Configurazione endpoint API
│   ├── context/
│   │   └── AuthContext.js      # Context autenticazione
│   ├── navigation/
│   │   └── index.js            # Navigazione principale
│   ├── screens/
│   │   ├── LoginScreen.js      # Login
│   │   ├── SignupScreen.js     # Registrazione
│   │   ├── HomeScreen.js       # Home e selezione lega
│   │   ├── CreateLeagueScreen.js
│   │   ├── JoinLeagueScreen.js
│   │   ├── FormationScreen.js  # Gestione formazione
│   │   ├── FreeAgentsScreen.js # Svincolati
│   │   ├── CompetitionsScreen.js
│   │   ├── ParticipantsScreen.js
│   │   ├── LeagueSettingsScreen.js
│   │   ├── TeamScreen.js       # La mia squadra
│   │   ├── CalendarScreen.js   # Calendario partite
│   │   └── StandingsScreen.js  # Classifiche
│   └── services/
│       ├── api.js              # Client Axios con interceptors
│       └── auth.js             # Servizio autenticazione
├── App.js                      # Entry point
└── package.json
```

## 🎨 Design

- **Palette Colori**:
  - Primary: `#3498db` (blu)
  - Success: `#27ae60` (verde)
  - Danger: `#e74c3c` (rosso)
  - Background: `#f5f5f5` (grigio chiaro)
  - Text: `#2c3e50` (grigio scuro)

## 🔧 Tecnologie

- **React Native** + **Expo** - Framework mobile
- **React Navigation** - Navigazione
- **Axios** - HTTP client
- **AsyncStorage** - Storage locale
- **FastAPI** (backend) - REST API

## 📝 TODO

### Funzionalità da completare
- [ ] Integrazione reale con API backend per giocatori
- [ ] Implementare drag & drop nella formazione
- [ ] Sistema di creazione competizioni completo
- [ ] Mercato con aste e scambi
- [ ] Notifiche push
- [ ] Sistema di inviti con codici
- [ ] Filtri avanzati ricerca giocatori
- [ ] Statistiche dettagliate giocatori
- [ ] Grafici e analytics
- [ ] Dark mode

### Backend da implementare
- [ ] Endpoint formazioni
- [ ] Endpoint giocatori/svincolati
- [ ] Endpoint competizioni avanzato
- [ ] Endpoint calendario/partite
- [ ] Endpoint classifiche
- [ ] Sistema inviti
- [ ] Calcolo punteggi automatico

## 🐛 Debug

### Problemi comuni

**Errore di connessione al backend**:
- Verifica che il backend sia in esecuzione
- Su Android emulator, usa `10.0.2.2:8000` invece di `localhost:8000`
- Su iOS simulator, usa `localhost:8000`
- Su dispositivo fisico, usa l'IP del tuo computer

**Errore 401 Unauthorized**:
- Il token potrebbe essere scaduto
- Effettua nuovamente il login

## 📄 Licenza

Progetto personale per gestione fantacalcio.

## 👥 Autori

Creato con ❤️ per gli appassionati di fantacalcio!
