// API Configuration
// Use your machine's local IP address instead of localhost for mobile devices
// You can find it by running: ipconfig getifaddr en0 (macOS) or ifconfig (Linux)
export const API_BASE_URL = __DEV__
	? 'http://:8000'
	: 'https://your-railway-app.railway.app';

export const API_ENDPOINTS = {
	// Auth
	SIGNUP: '/api/auth/signup',
	LOGIN: '/api/auth/login',
	ME: '/api/auth/me',

	// Leagues
	LEAGUES: '/api/leagues',
	LEAGUE_BY_ID: (id) => `/api/leagues/${id}`,
	PUBLIC_LEAGUES: '/api/leagues/public',
	JOIN_LEAGUE: (id) => `/api/leagues/${id}/join`,
	JOIN_LEAGUE_WITH_CODE: '/api/leagues/join-with-code',

	// Players
	PLAYERS: '/api/players',
	FREE_AGENTS: '/api/players/free-agents',

	// Formations
	FORMATIONS: '/api/formations',
	FORMATION_BY_ID: (id) => `/api/formations/${id}`,

	// Competitions
	COMPETITIONS: '/api/competitions',
	COMPETITION_BY_ID: (id) => `/api/competitions/${id}`,

	// Matches
	MATCHES: '/api/matches',

	// Standings
	STANDINGS: (competitionId) => `/api/competitions/${competitionId}/standings`,
};
