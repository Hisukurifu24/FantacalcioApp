import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

const api = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		'Content-Type': 'application/json',
	},
});

// Request interceptor to add token
api.interceptors.request.use(
	async (config) => {
		const token = await AsyncStorage.getItem('token');
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// Response interceptor to handle errors
api.interceptors.response.use(
	(response) => response,
	async (error) => {
		if (error.response?.status === 401) {
			// Token expired or invalid
			await AsyncStorage.removeItem('token');
			await AsyncStorage.removeItem('user');
			// You might want to navigate to login here
		}
		return Promise.reject(error);
	}
);

// Players API
export const getPlayers = async (params = {}) => {
	try {
		const response = await api.get('/api/players', { params });
		return response.data;
	} catch (error) {
		console.error('Error fetching players:', error);
		throw error;
	}
};

export const getFreeAgents = async (leagueId, filters = {}) => {
	try {
		const params = {
			league_id: leagueId,
			free_agents_only: true,
		};

		// Add optional filters
		if (filters.role && filters.role !== 'Tutti') {
			params.role = filters.role;
		}
		if (filters.search) {
			params.search = filters.search;
		}
		if (filters.team) {
			params.team = filters.team;
		}
		if (filters.minQuotazione) {
			params.min_quotazione = filters.minQuotazione;
		}
		if (filters.maxQuotazione) {
			params.max_quotazione = filters.maxQuotazione;
		}
		if (filters.minFvm) {
			params.min_fvm = filters.minFvm;
		}
		if (filters.maxFvm) {
			params.max_fvm = filters.maxFvm;
		}
		if (filters.sortBy) {
			params.sort_by = filters.sortBy;
		}

		const response = await api.get('/api/players', { params });
		return response.data;
		return response.data;
	} catch (error) {
		console.error('Error fetching free agents:', error);
		throw error;
	}
};

// Leagues API
export const getLeagues = async () => {
	try {
		const response = await api.get('/api/leagues');
		return response.data;
	} catch (error) {
		console.error('Error fetching leagues:', error);
		throw error;
	}
};

export const getLeague = async (leagueId) => {
	try {
		const response = await api.get(`/api/leagues/${leagueId}`);
		return response.data;
	} catch (error) {
		console.error('Error fetching league:', error);
		throw error;
	}
};

export const createLeague = async (leagueData) => {
	try {
		const response = await api.post('/api/leagues', leagueData);
		return response.data;
	} catch (error) {
		console.error('Error creating league:', error);
		throw error;
	}
};

export const updateLeague = async (leagueId, leagueData) => {
	try {
		const response = await api.put(`/api/leagues/${leagueId}`, leagueData);
		return response.data;
	} catch (error) {
		console.error('Error updating league:', error);
		throw error;
	}
};

export const deleteLeague = async (leagueId) => {
	try {
		const response = await api.delete(`/api/leagues/${leagueId}`);
		return response.data;
	} catch (error) {
		console.error('Error deleting league:', error);
		throw error;
	}
};

export const leaveLeague = async (leagueId) => {
	try {
		const response = await api.delete(`/api/leagues/${leagueId}/leave`);
		return response.data;
	} catch (error) {
		console.error('Error leaving league:', error);
		throw error;
	}
};

// Competitions API
export const getCompetitions = async (leagueId) => {
	try {
		const league = await getLeague(leagueId);
		return league.competitions || [];
	} catch (error) {
		console.error('Error fetching competitions:', error);
		throw error;
	}
};

export const createCompetition = async (leagueId, competitionData) => {
	try {
		const league = await getLeague(leagueId);
		const updatedCompetitions = [...(league.competitions || []), competitionData];
		const updatedLeague = { ...league, competitions: updatedCompetitions };
		delete updatedLeague.id; // Remove id for update
		const response = await updateLeague(leagueId, updatedLeague);
		return response;
	} catch (error) {
		console.error('Error creating competition:', error);
		throw error;
	}
};

export const updateCompetition = async (leagueId, competitionIndex, competitionData) => {
	try {
		const league = await getLeague(leagueId);
		const updatedCompetitions = [...(league.competitions || [])];
		updatedCompetitions[competitionIndex] = competitionData;
		const updatedLeague = { ...league, competitions: updatedCompetitions };
		delete updatedLeague.id; // Remove id for update
		const response = await updateLeague(leagueId, updatedLeague);
		return response;
	} catch (error) {
		console.error('Error updating competition:', error);
		throw error;
	}
};

export const deleteCompetition = async (leagueId, competitionIndex) => {
	try {
		const league = await getLeague(leagueId);
		const updatedCompetitions = [...(league.competitions || [])];
		updatedCompetitions.splice(competitionIndex, 1);
		const updatedLeague = { ...league, competitions: updatedCompetitions };
		delete updatedLeague.id; // Remove id for update
		const response = await updateLeague(leagueId, updatedLeague);
		return response;
	} catch (error) {
		console.error('Error deleting competition:', error);
		throw error;
	}
};

// DEBUG: Simulate matches
export const simulateMatches = async (leagueId, competitionIndex, day = null, numDays = 1) => {
	try {
		const response = await api.post(
			`/api/leagues/${leagueId}/competitions/${competitionIndex}/simulate`,
			{
				day: day,
				num_days: numDays
			}
		);
		return response.data;
	} catch (error) {
		console.error('Error simulating matches:', error);
		throw error;
	}
};

// Team API
export const getMyTeam = async (leagueId) => {
	try {
		const league = await getLeague(leagueId);
		const userStr = await AsyncStorage.getItem('user');
		if (!userStr) {
			throw new Error('User not logged in');
		}
		const user = JSON.parse(userStr);

		// Find the user's team in the league
		const myTeam = league.teams?.find(
			team => team.owner_id === user.id || team.owner === user.id
		);

		if (!myTeam) {
			throw new Error('Team not found in league');
		}

		return {
			...myTeam,
			league: {
				id: league.id,
				name: league.name,
				settings: league.settings
			}
		};
	} catch (error) {
		console.error('Error fetching my team:', error);
		throw error;
	}
};

// Admin: Add player to any team
export const adminAddPlayerToTeam = async (leagueId, teamName, playerName, playerRole) => {
	try {
		const response = await api.post(
			`/api/leagues/${leagueId}/admin/add-player`,
			{
				team_name: teamName,
				player_name: playerName,
				player_role: playerRole
			}
		);
		return response.data;
	} catch (error) {
		console.error('Error adding player to team:', error);
		throw error;
	}
};

// Admin: Remove player from any team
export const adminRemovePlayerFromTeam = async (leagueId, teamName, playerName) => {
	try {
		const response = await api.post(
			`/api/leagues/${leagueId}/admin/remove-player`,
			{
				team_name: teamName,
				player_name: playerName
			}
		);
		return response.data;
	} catch (error) {
		console.error('Error removing player from team:', error);
		throw error;
	}
};

export default api;
