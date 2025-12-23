import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	Alert,
	Modal,
	ActivityIndicator,
	TextInput,
	PanResponder,
	Animated,
	Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../config/theme';
import { getMyTeam } from '../services/api';
import { useLeague } from '../context/LeagueContext';

const { width: screenWidth } = Dimensions.get('window');

const FORMATIONS = ['3-4-3', '3-5-2', '4-3-3', '4-4-2', '4-5-1', '5-3-2', '5-4-1'];

const ROLE_MAP = {
	'P': 'goalkeeper',
	'D': 'defenders',
	'C': 'midfielders',
	'A': 'forwards'
};

export default function FormationScreen({ route, navigation }) {
	const { selectedLeague } = useLeague();
	const [selectedFormation, setSelectedFormation] = useState('4-3-3');
	const [lineup, setLineup] = useState({
		goalkeeper: null,
		defenders: [],
		midfielders: [],
		forwards: [],
		bench: [],
	});
	const [myRoster, setMyRoster] = useState([]);
	const [loading, setLoading] = useState(true);
	const [modalVisible, setModalVisible] = useState(false);
	const [currentSelection, setCurrentSelection] = useState({ role: null, index: null });
	const [searchQuery, setSearchQuery] = useState('');
	const [swapMode, setSwapMode] = useState(null); // { role, index, player }
	const [draggedPlayer, setDraggedPlayer] = useState(null);
	const [swapModalVisible, setSwapModalVisible] = useState(false);
	const [selectedPlayerForSwap, setSelectedPlayerForSwap] = useState(null);

	useEffect(() => {
		if (selectedLeague) {
			loadMyRoster();
		}
	}, [selectedLeague]);

	const loadMyRoster = async () => {
		try {
			setLoading(true);
			const teamData = await getMyTeam(selectedLeague.id);
			setMyRoster(teamData.roster || []);
		} catch (error) {
			console.error('Error loading roster:', error);
			Alert.alert('Errore', 'Impossibile caricare la rosa');
		} finally {
			setLoading(false);
		}
	};

	const openPlayerSelection = (role, index = null) => {
		setCurrentSelection({ role, index });
		setSearchQuery('');
		setModalVisible(true);
	};

	const selectPlayer = (player) => {
		const { role, index } = currentSelection;

		const newLineup = { ...lineup };

		if (role === 'goalkeeper') {
			newLineup.goalkeeper = player;
		} else if (role === 'bench') {
			const newBench = [...newLineup.bench];
			const limits = getBenchLimits();

			// Verifica i limiti per ruolo prima di aggiungere
			const benchByRole = {
				P: newBench.filter(p => p?.role === 'P').length,
				D: newBench.filter(p => p?.role === 'D').length,
				C: newBench.filter(p => p?.role === 'C').length,
				A: newBench.filter(p => p?.role === 'A').length
			};

			if (benchByRole[player.role] >= limits[player.role]) {
				const roleNames = { P: 'portieri', D: 'difensori', C: 'centrocampisti', A: 'attaccanti' };
				Alert.alert(
					'Limite raggiunto',
					`Hai già raggiunto il limite di ${limits[player.role]} ${roleNames[player.role]} in panchina.`
				);
				return;
			}

			// Inserisci il giocatore esattamente nell'indice specificato
			if (index !== null) {
				newBench[index] = player;
			} else {
				newBench.push(player);
			}
			newLineup.bench = newBench;
		} else {
			const newArray = [...newLineup[role]];
			if (index !== null && index < newArray.length) {
				newArray[index] = player;
			} else {
				newArray.push(player);
			}
			newLineup[role] = newArray;
		}

		setLineup(newLineup);
		setModalVisible(false);
	};

	const removePlayer = (role, index = null) => {
		const newLineup = { ...lineup };

		if (role === 'goalkeeper') {
			newLineup.goalkeeper = null;
		} else if (role === 'bench') {
			const newBench = [...newLineup.bench];
			newBench.splice(index, 1);
			newLineup.bench = newBench;
		} else {
			const newArray = [...newLineup[role]];
			newArray[index] = null;
			newLineup[role] = newArray;
		}

		setLineup(newLineup);
	};

	const handleLongPress = (role, index, player) => {
		if (!player) return;

		// Attiva modalità scambio
		setSwapMode({ role, index, player });
	};

	const swapPlayers = (first, second) => {
		const newLineup = { ...lineup };

		// Ottieni i giocatori
		let player1, player2;

		if (first.role === 'goalkeeper') {
			player1 = newLineup.goalkeeper;
		} else if (first.role === 'bench') {
			player1 = newLineup.bench[first.index];
		} else {
			player1 = newLineup[first.role][first.index];
		}

		if (second.role === 'goalkeeper') {
			player2 = newLineup.goalkeeper;
		} else if (second.role === 'bench') {
			player2 = newLineup.bench[second.index];
		} else {
			player2 = newLineup[second.role][second.index];
		}

		// Scambia i giocatori
		if (first.role === 'goalkeeper') {
			newLineup.goalkeeper = player2;
		} else if (first.role === 'bench') {
			const newBench = [...newLineup.bench];
			newBench[first.index] = player2;
			newLineup.bench = newBench;
		} else {
			const newArray = [...newLineup[first.role]];
			newArray[first.index] = player2;
			newLineup[first.role] = newArray;
		}

		if (second.role === 'goalkeeper') {
			newLineup.goalkeeper = player1;
		} else if (second.role === 'bench') {
			const newBench = [...newLineup.bench];
			newBench[second.index] = player1;
			newLineup.bench = newBench;
		} else {
			const newArray = [...newLineup[second.role]];
			newArray[second.index] = player1;
			newLineup[second.role] = newArray;
		}

		setLineup(newLineup);
		setSwapMode(null);
	};

	const getAvailablePlayersByRole = () => {
		const { role } = currentSelection;
		let roleFilter = '';

		if (role === 'goalkeeper') roleFilter = 'P';
		else if (role === 'defenders') roleFilter = 'D';
		else if (role === 'midfielders') roleFilter = 'C';
		else if (role === 'forwards') roleFilter = 'A';

		const filtered = myRoster.filter(player => {
			// Check if player is already in lineup
			const isAlreadySelected =
				lineup.goalkeeper?.id === player.id ||
				lineup.defenders.some(p => p?.id === player.id) ||
				lineup.midfielders.some(p => p?.id === player.id) ||
				lineup.forwards.some(p => p?.id === player.id) ||
				lineup.bench.some(p => p?.id === player.id);

			if (isAlreadySelected) return false;

			const matchesRole = role === 'bench' || player.role === roleFilter;
			const matchesSearch = !searchQuery ||
				player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				player.team?.toLowerCase().includes(searchQuery.toLowerCase());
			return matchesRole && matchesSearch;
		});

		// Sort by FVM (descending)
		return filtered.sort((a, b) => {
			const fvmA = parseFloat(a.fvm_classico) || 0;
			const fvmB = parseFloat(b.fvm_classico) || 0;
			return fvmB - fvmA;
		});
	};

	const getPlayersByRoleGrouped = () => {
		const players = getAvailablePlayersByRole();

		// If not selecting for bench, return flat list
		if (currentSelection.role !== 'bench') {
			return [{ role: null, players }];
		}

		// Group by role for bench
		const grouped = {
			'P': { label: 'Portieri', players: [] },
			'D': { label: 'Difensori', players: [] },
			'C': { label: 'Centrocampisti', players: [] },
			'A': { label: 'Attaccanti', players: [] }
		};

		players.forEach(player => {
			if (grouped[player.role]) {
				grouped[player.role].players.push(player);
			}
		});

		// Convert to array and filter out empty groups
		return Object.entries(grouped)
			.filter(([_, group]) => group.players.length > 0)
			.map(([role, group]) => ({ role, label: group.label, players: group.players }));
	};

	const getBenchLimits = () => {
		return selectedLeague?.settings?.bench_limits || {
			P: 1,
			D: 3,
			C: 3,
			A: 3
		};
	};

	const getTotalBenchSlots = () => {
		const limits = getBenchLimits();
		return limits.P + limits.D + limits.C + limits.A;
	};

	const validateBenchLimits = () => {
		const limits = getBenchLimits();
		const benchByRole = {
			P: lineup.bench.filter(p => p?.role === 'P').length,
			D: lineup.bench.filter(p => p?.role === 'D').length,
			C: lineup.bench.filter(p => p?.role === 'C').length,
			A: lineup.bench.filter(p => p?.role === 'A').length
		};

		const errors = [];
		if (benchByRole.P > limits.P) errors.push(`Portieri in panchina: ${benchByRole.P}/${limits.P}`);
		if (benchByRole.D > limits.D) errors.push(`Difensori in panchina: ${benchByRole.D}/${limits.D}`);
		if (benchByRole.C > limits.C) errors.push(`Centrocampisti in panchina: ${benchByRole.C}/${limits.C}`);
		if (benchByRole.A > limits.A) errors.push(`Attaccanti in panchina: ${benchByRole.A}/${limits.A}`);

		return { valid: errors.length === 0, errors };
	};

	const handleSaveFormation = () => {
		// Validate formation
		const [def, mid, fwd] = selectedFormation.split('-').map(Number);

		if (!lineup.goalkeeper) {
			Alert.alert('Attenzione', 'Devi selezionare un portiere');
			return;
		}

		const defCount = lineup.defenders.filter(p => p).length;
		const midCount = lineup.midfielders.filter(p => p).length;
		const fwdCount = lineup.forwards.filter(p => p).length;

		if (defCount < def || midCount < mid || fwdCount < fwd) {
			Alert.alert(
				'Attenzione',
				`La formazione ${selectedFormation} richiede:\n- ${def} difensori (${defCount}/${def})\n- ${mid} centrocampisti (${midCount}/${mid})\n- ${fwd} attaccanti (${fwdCount}/${fwd})`
			);
			return;
		}

		// Validate bench limits
		const benchValidation = validateBenchLimits();
		if (!benchValidation.valid) {
			Alert.alert(
				'Attenzione',
				`La panchina supera i limiti della lega:\n${benchValidation.errors.join('\n')}`
			);
			return;
		}

		// TODO: Save formation to backend
		Alert.alert('Successo', 'Formazione salvata!', [
			{ text: 'OK', onPress: () => navigation.goBack() },
		]);
	};

	const handlePreviousFormation = () => {
		Alert.alert('Info', 'Funzionalità in arrivo: carica formazione precedente');
	};

	const handlePlayerTap = (player, role, index) => {
		// Apri modal per scambio/selezione (sia per slot vuoti che pieni)
		setSelectedPlayerForSwap({ player, role, index });
		setSearchQuery('');
		setSwapModalVisible(true);
	};

	const handleSwapWithSelected = (targetPlayer) => {
		if (!selectedPlayerForSwap) return;

		const { player: sourcePlayer, role: sourceRole, index: sourceIndex } = selectedPlayerForSwap;

		// Se lo slot sorgente è vuoto, inserisci direttamente il giocatore
		if (!sourcePlayer) {
			const newLineup = { ...lineup };

			// Verifica compatibilità ruolo
			if (!checkRoleCompatibility(targetPlayer, sourceRole)) {
				Alert.alert('Attenzione', 'Il giocatore selezionato non è compatibile con questo ruolo');
				return;
			}

			// Rimuovi il target player dalla sua posizione attuale (se presente)
			const targetLocation = getRoleFromPlayer(targetPlayer);
			if (targetLocation) {
				if (targetLocation === 'goalkeeper') {
					newLineup.goalkeeper = null;
				} else if (targetLocation === 'bench') {
					const benchIndex = newLineup.bench.findIndex(p => p?.id === targetPlayer.id);
					if (benchIndex >= 0) {
						newLineup.bench = [...newLineup.bench];
						newLineup.bench[benchIndex] = null;
					}
				} else {
					const posIndex = newLineup[targetLocation].findIndex(p => p?.id === targetPlayer.id);
					if (posIndex >= 0) {
						newLineup[targetLocation] = [...newLineup[targetLocation]];
						newLineup[targetLocation][posIndex] = null;
					}
				}
			}

			// Inserisci il giocatore nello slot vuoto
			if (sourceRole === 'goalkeeper') {
				newLineup.goalkeeper = targetPlayer;
			} else if (sourceRole === 'bench') {
				newLineup.bench = [...newLineup.bench];
				newLineup.bench[sourceIndex] = targetPlayer;
			} else {
				newLineup[sourceRole] = [...newLineup[sourceRole]];
				newLineup[sourceRole][sourceIndex] = targetPlayer;
			}

			setLineup(newLineup);
			setSwapModalVisible(false);
			setSelectedPlayerForSwap(null);
			return;
		}

		// Trova dove si trova il target player
		let targetRole = null;
		let targetIndex = null;

		if (lineup.goalkeeper?.id === targetPlayer.id) {
			targetRole = 'goalkeeper';
		} else {
			const defIndex = lineup.defenders.findIndex(p => p?.id === targetPlayer.id);
			if (defIndex >= 0) {
				targetRole = 'defenders';
				targetIndex = defIndex;
			} else {
				const midIndex = lineup.midfielders.findIndex(p => p?.id === targetPlayer.id);
				if (midIndex >= 0) {
					targetRole = 'midfielders';
					targetIndex = midIndex;
				} else {
					const fwdIndex = lineup.forwards.findIndex(p => p?.id === targetPlayer.id);
					if (fwdIndex >= 0) {
						targetRole = 'forwards';
						targetIndex = fwdIndex;
					} else {
						const benchIndex = lineup.bench.findIndex(p => p?.id === targetPlayer.id);
						if (benchIndex >= 0) {
							targetRole = 'bench';
							targetIndex = benchIndex;
						}
					}
				}
			}
		}

		// Verifica compatibilità ruoli
		const canSwap = checkRoleCompatibility(sourcePlayer, targetRole) &&
			checkRoleCompatibility(targetPlayer, sourceRole);

		if (!canSwap) {
			Alert.alert('Attenzione', 'I ruoli non sono compatibili per questo scambio');
			return;
		}

		// Esegui lo scambio
		const newLineup = { ...lineup };

		// Rimuovi source
		if (sourceRole === 'goalkeeper') {
			newLineup.goalkeeper = null;
		} else if (sourceRole === 'bench') {
			newLineup.bench = [...newLineup.bench];
			newLineup.bench[sourceIndex] = null;
		} else {
			newLineup[sourceRole] = [...newLineup[sourceRole]];
			newLineup[sourceRole][sourceIndex] = null;
		}

		// Rimuovi target
		if (targetRole === 'goalkeeper') {
			newLineup.goalkeeper = null;
		} else if (targetRole === 'bench') {
			if (!newLineup.bench) newLineup.bench = [];
			newLineup.bench = [...newLineup.bench];
			newLineup.bench[targetIndex] = null;
		} else {
			if (!newLineup[targetRole]) newLineup[targetRole] = [];
			newLineup[targetRole] = [...newLineup[targetRole]];
			newLineup[targetRole][targetIndex] = null;
		}

		// Posiziona i giocatori scambiati
		if (targetRole === 'goalkeeper') {
			newLineup.goalkeeper = sourcePlayer;
		} else if (targetRole === 'bench') {
			newLineup.bench[targetIndex] = sourcePlayer;
		} else {
			newLineup[targetRole][targetIndex] = sourcePlayer;
		}

		if (sourceRole === 'goalkeeper') {
			newLineup.goalkeeper = targetPlayer;
		} else if (sourceRole === 'bench') {
			newLineup.bench[sourceIndex] = targetPlayer;
		} else {
			newLineup[sourceRole][sourceIndex] = targetPlayer;
		}

		setLineup(newLineup);
		setSwapModalVisible(false);
		setSelectedPlayerForSwap(null);
	};

	const checkRoleCompatibility = (player, targetRole) => {
		if (!player) return true;

		const roleMap = {
			'goalkeeper': 'P',
			'defenders': 'D',
			'midfielders': 'C',
			'forwards': 'A',
			'bench': null // panchina accetta tutti
		};

		const requiredRole = roleMap[targetRole];
		return !requiredRole || player.role === requiredRole;
	};

	const getAvailablePlayersForSwap = () => {
		if (!selectedPlayerForSwap) return [];

		const { player: sourcePlayer, role: sourceRole } = selectedPlayerForSwap;

		// Se lo slot è vuoto, mostra panchina e fuori rosa compatibili
		if (!sourcePlayer) {
			const benchPlayers = lineup.bench.filter(p => p);
			const outOfLineup = myRoster.filter(rosterPlayer => {
				const isInLineup =
					lineup.goalkeeper?.id === rosterPlayer.id ||
					lineup.defenders.some(p => p?.id === rosterPlayer.id) ||
					lineup.midfielders.some(p => p?.id === rosterPlayer.id) ||
					lineup.forwards.some(p => p?.id === rosterPlayer.id) ||
					lineup.bench.some(p => p?.id === rosterPlayer.id);

				return !isInLineup;
			});

			let availablePlayers = [...benchPlayers, ...outOfLineup].filter(p =>
				checkRoleCompatibility(p, sourceRole)
			);

			// Filtra per ricerca
			if (searchQuery) {
				availablePlayers = availablePlayers.filter(p =>
					p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					p.team?.toLowerCase().includes(searchQuery.toLowerCase())
				);
			}

			// Raggruppa per ruolo e ordina
			return groupAndSortByRole(availablePlayers);
		}

		// Tutti i giocatori in panchina e fuori rosa
		const benchPlayers = lineup.bench.filter(p => p && p.id !== sourcePlayer.id);

		const outOfLineup = myRoster.filter(rosterPlayer => {
			const isInLineup =
				lineup.goalkeeper?.id === rosterPlayer.id ||
				lineup.defenders.some(p => p?.id === rosterPlayer.id) ||
				lineup.midfielders.some(p => p?.id === rosterPlayer.id) ||
				lineup.forwards.some(p => p?.id === rosterPlayer.id) ||
				lineup.bench.some(p => p?.id === rosterPlayer.id);

			return !isInLineup;
		});

		let availablePlayers = [];

		if (sourceRole === 'bench') {
			// Se source è panchina, può scambiare con titolari compatibili o fuori rosa
			const starters = [
				...(lineup.goalkeeper ? [lineup.goalkeeper] : []),
				...lineup.defenders.filter(p => p),
				...lineup.midfielders.filter(p => p),
				...lineup.forwards.filter(p => p),
			].filter(p => checkRoleCompatibility(sourcePlayer, getRoleFromPlayer(p)));

			availablePlayers = [...starters, ...outOfLineup];
		} else {
			// Se source è titolare, può scambiare con panchina compatibile o fuori rosa compatibili
			const compatibleBench = benchPlayers.filter(p =>
				checkRoleCompatibility(p, sourceRole)
			);
			const compatibleOutOfLineup = outOfLineup.filter(p =>
				checkRoleCompatibility(p, sourceRole)
			);

			availablePlayers = [...compatibleBench, ...compatibleOutOfLineup];
		}

		// Filtra per ricerca
		if (searchQuery) {
			availablePlayers = availablePlayers.filter(p =>
				p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.team?.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}

		// Raggruppa per ruolo e ordina
		return groupAndSortByRole(availablePlayers);
	};


	const groupAndSortByRole = (players) => {
		// Determina se la selezione è per slot vuoto titolare o panchina
		let isBenchSlot = false;
		let isStarterSlot = false;
		if (selectedPlayerForSwap && !selectedPlayerForSwap.player) {
			if (selectedPlayerForSwap.role === 'bench') isBenchSlot = true;
			else isStarterSlot = true;
		}

		const byPosition = {
			starters: [],
			bench: [],
			outOfLineup: []
		};

		players.forEach(player => {
			const location = getRoleFromPlayer(player);
			if (location === 'bench') {
				byPosition.bench.push(player);
			} else if (location && location !== 'bench') {
				byPosition.starters.push(player);
			} else {
				byPosition.outOfLineup.push(player);
			}
		});

		const result = [];

		if (isBenchSlot) {
			// Slot vuoto in panchina: prima fuori rosa, poi panchina, poi titolari
			if (byPosition.outOfLineup.length > 0) {
				result.push({
					label: 'Fuori rosa',
					players: sortPlayersByRoleAndFVM(byPosition.outOfLineup)
				});
			}
			if (byPosition.bench.length > 0) {
				result.push({
					label: 'Panchina',
					players: sortPlayersByRoleAndFVM(byPosition.bench)
				});
			}
			if (byPosition.starters.length > 0) {
				result.push({
					label: 'Titolari',
					players: sortPlayersByRoleAndFVM(byPosition.starters)
				});
			}
		} else if (isStarterSlot) {
			// Slot vuoto titolare: prima panchina, poi fuori rosa, poi titolari
			if (byPosition.bench.length > 0) {
				result.push({
					label: 'Panchina',
					players: sortPlayersByRoleAndFVM(byPosition.bench)
				});
			}
			if (byPosition.outOfLineup.length > 0) {
				result.push({
					label: 'Fuori rosa',
					players: sortPlayersByRoleAndFVM(byPosition.outOfLineup)
				});
			}
			if (byPosition.starters.length > 0) {
				result.push({
					label: 'Titolari',
					players: sortPlayersByRoleAndFVM(byPosition.starters)
				});
			}
		} else {
			// Scambio normale: titolari, panchina, fuori rosa
			if (byPosition.starters.length > 0) {
				result.push({
					label: 'Titolari',
					players: sortPlayersByRoleAndFVM(byPosition.starters)
				});
			}
			if (byPosition.bench.length > 0) {
				result.push({
					label: 'Panchina',
					players: sortPlayersByRoleAndFVM(byPosition.bench)
				});
			}
			if (byPosition.outOfLineup.length > 0) {
				result.push({
					label: 'Fuori rosa',
					players: sortPlayersByRoleAndFVM(byPosition.outOfLineup)
				});
			}
		}

		return result;
	};

	const sortPlayersByRoleAndFVM = (players) => {
		const roleOrder = { 'P': 0, 'D': 1, 'C': 2, 'A': 3 };

		return players.sort((a, b) => {
			// Prima ordina per ruolo
			const roleCompare = roleOrder[a.role] - roleOrder[b.role];
			if (roleCompare !== 0) return roleCompare;

			// Poi per FVM decrescente
			const fvmA = parseFloat(a.fvm_classico) || 0;
			const fvmB = parseFloat(b.fvm_classico) || 0;
			return fvmB - fvmA;
		});
	};

	const groupPlayersByRole = (players) => {
		const grouped = {
			'P': { label: 'Portieri', players: [] },
			'D': { label: 'Difensori', players: [] },
			'C': { label: 'Centrocampisti', players: [] },
			'A': { label: 'Attaccanti', players: [] }
		};

		players.forEach(player => {
			if (grouped[player.role]) {
				grouped[player.role].players.push(player);
			}
		});

		// Ordina per FVM all'interno di ogni gruppo e converti in array
		const result = [];
		['P', 'D', 'C', 'A'].forEach(role => {
			if (grouped[role].players.length > 0) {
				const sortedPlayers = grouped[role].players.sort((a, b) => {
					const fvmA = parseFloat(a.fvm_classico) || 0;
					const fvmB = parseFloat(b.fvm_classico) || 0;
					return fvmB - fvmA;
				});
				result.push({
					role,
					label: grouped[role].label,
					players: sortedPlayers
				});
			}
		});

		return result;
	};

	const getRoleFromPlayer = (player) => {
		if (lineup.goalkeeper?.id === player.id) return 'goalkeeper';
		if (lineup.defenders.some(p => p?.id === player.id)) return 'defenders';
		if (lineup.midfielders.some(p => p?.id === player.id)) return 'midfielders';
		if (lineup.forwards.some(p => p?.id === player.id)) return 'forwards';
		if (lineup.bench.some(p => p?.id === player.id)) return 'bench';
		return null;
	};

	const getRoleColor = (playerRole) => {
		switch (playerRole) {
			case 'P': return '#FF9800'; // Arancione
			case 'D': return '#2196F3'; // Blu
			case 'C': return '#4CAF50'; // Verde
			case 'A': return '#F44336'; // Rosso
			default: return Colors.gray300;
		}
	};

	const renderCompactPlayerCard = (player, role, index) => {
		if (!player) {
			return (
				<TouchableOpacity
					style={styles.emptySlotCompact}
					onPress={() => handlePlayerTap(null, role, index)}
				>
					<Ionicons name="add" size={16} color={Colors.textSecondary} />
				</TouchableOpacity>
			);
		}

		const roleColor = getRoleColor(player.role);

		return (
			<TouchableOpacity
				style={[styles.compactPlayerCard, { borderLeftColor: roleColor }]}
				onPress={() => handlePlayerTap(player, role, index)}
				activeOpacity={0.7}
			>
				<View style={styles.compactPlayerInfo}>
					<Text style={styles.compactPlayerName}>
						{player.name}
					</Text>
					<Text style={styles.compactPlayerQuota} numberOfLines={1} ellipsizeMode="clip">
						Q: {player.quotazione_attuale_classico || player.value || '-'}
					</Text>
					<Text style={styles.compactPlayerFvm} numberOfLines={1} ellipsizeMode="clip">
						FVM: {player.fvm_classico || '-'}
					</Text>
				</View>
			</TouchableOpacity>
		);
	};

	const renderBenchCard = (player, index) => {
		if (!player) {
			return (
				<TouchableOpacity
					key={index}
					style={styles.benchCardEmpty}
					onPress={() => handlePlayerTap(null, 'bench', index)}
				>
					<Ionicons name="add-circle-outline" size={20} color={Colors.textSecondary} />
				</TouchableOpacity>
			);
		}

		const roleColor = getRoleColor(player.role);

		return (
			<TouchableOpacity
				key={index}
				style={[styles.benchCard, { borderTopColor: roleColor }]}
				onPress={() => handlePlayerTap(player, 'bench', index)}
				activeOpacity={0.7}
			>
				<Text style={styles.benchCardRole}>{player.role}</Text>
				<Text style={styles.benchCardName}>
					{player.name}
				</Text>
				<View style={styles.benchCardStats}>
					<Text style={styles.benchCardQuota} numberOfLines={1} ellipsizeMode="clip">
						Q: {player.quotazione_attuale_classico || '-'}
					</Text>
					<Text style={styles.benchCardFvm} numberOfLines={1} ellipsizeMode="clip">
						FVM: {player.fvm_classico || '-'}
					</Text>
				</View>
			</TouchableOpacity>
		);
	};

	const renderFormationLayout = () => {
		const [def, mid, fwd] = selectedFormation.split('-').map(Number);

		return (
			<View style={styles.fieldCompact}>
				{/* Portiere */}
				<View style={styles.lineCompact}>
					{renderCompactPlayerCard(lineup.goalkeeper, 'goalkeeper', 0)}
				</View>

				{/* Difensori */}
				<View style={styles.lineCompact}>
					{Array.from({ length: def }).map((_, i) => (
						<View key={i} style={styles.playerSlotWrapper}>
							{renderCompactPlayerCard(lineup.defenders[i], 'defenders', i)}
						</View>
					))}
				</View>

				{/* Centrocampisti */}
				<View style={styles.lineCompact}>
					{Array.from({ length: mid }).map((_, i) => (
						<View key={i} style={styles.playerSlotWrapper}>
							{renderCompactPlayerCard(lineup.midfielders[i], 'midfielders', i)}
						</View>
					))}
				</View>

				{/* Attaccanti */}
				<View style={styles.lineCompact}>
					{Array.from({ length: fwd }).map((_, i) => (
						<View key={i} style={styles.playerSlotWrapper}>
							{renderCompactPlayerCard(lineup.forwards[i], 'forwards', i)}
						</View>
					))}
				</View>
			</View>
		);
	};

	const renderPlayerSlot = (player, role, index) => {
		const isBench = role === 'bench';
		const isSelected = swapMode && swapMode.role === role && swapMode.index === index;

		if (player) {
			const roleColor = getRoleColor(player.role);

			return (
				<TouchableOpacity
					style={[
						isBench ? styles.benchSlotFilled : styles.playerSlot,
						!isBench && styles.playerSlotFilled,
						{ borderLeftWidth: 4, borderLeftColor: roleColor },
						isSelected && styles.selectedForSwap
					]}
					onPress={() => {
						if (swapMode) {
							// Se siamo in modalità scambio, esegui lo scambio
							swapPlayers(swapMode, { role, index, player });
						} else {
							// Altrimenti rimuovi il giocatore
							removePlayer(role, index);
						}
					}}
					onLongPress={() => handleLongPress(role, index, player)}
					delayLongPress={500}
				>
					<View style={styles.playerInfo}>
						<View>
							<Text style={styles.playerName}>{player.name}</Text>
							<Text style={styles.playerTeam}>{player.team || 'N/A'}</Text>
						</View>
						<View style={styles.playerStats}>
							<Text style={styles.playerQuotazione}>
								Q: {player.quotazione_attuale_classico || player.value || 'N/A'}
							</Text>
							<Ionicons name="close-circle" size={24} color={Colors.error} />
						</View>
					</View>
				</TouchableOpacity>
			);
		}

		return (
			<TouchableOpacity
				style={role === 'bench' ? styles.benchSlot : styles.playerSlot}
				onPress={() => openPlayerSelection(role, index)}
			>
				<Text style={role === 'bench' ? styles.benchSlotText : styles.slotText}>
					+ Aggiungi
				</Text>
			</TouchableOpacity>
		);
	};

	if (loading) {
		return (
			<View style={styles.container}>
				<View style={styles.header}>
					<TouchableOpacity onPress={() => navigation.goBack()}>
						<Text style={styles.backButton}>← Indietro</Text>
					</TouchableOpacity>
					<Text style={styles.title}>Inserisci Formazione</Text>
				</View>
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color={Colors.primary} />
					<Text style={styles.loadingText}>Caricamento rosa...</Text>
				</View>
			</View>
		);
	}

	if (!selectedLeague) {
		return (
			<View style={styles.container}>
				<View style={styles.header}>
					<TouchableOpacity onPress={() => navigation.goBack()}>
						<Text style={styles.backButton}>← Indietro</Text>
					</TouchableOpacity>
					<Text style={styles.title}>Inserisci Formazione</Text>
				</View>
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyText}>Seleziona una lega</Text>
				</View>
			</View>
		);
	}

	const [def, mid, fwd] = selectedFormation.split('-').map(Number);

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<Text style={styles.backButton}>← Indietro</Text>
				</TouchableOpacity>
				<Text style={styles.title}>Formazione</Text>
			</View>

			<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
				{/* Selettore modulo compatto */}
				<View style={styles.formationSelectorCompact}>
					<ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
						{FORMATIONS.map((formation) => (
							<TouchableOpacity
								key={formation}
								style={[
									styles.formationChip,
									selectedFormation === formation && styles.formationChipActive,
								]}
								onPress={() => {
									setSelectedFormation(formation);
									setLineup({
										goalkeeper: lineup.goalkeeper,
										defenders: [],
										midfielders: [],
										forwards: [],
										bench: lineup.bench,
									});
								}}
							>
								<Text
									style={[
										styles.formationChipText,
										selectedFormation === formation && styles.formationChipTextActive,
									]}
								>
									{formation}
								</Text>
							</TouchableOpacity>
						))}
					</ScrollView>
				</View>

				{/* Campo con layout modulo */}
				{renderFormationLayout()}

				{/* Panchina - Griglia */}
				<View style={styles.benchSection}>
					<Text style={styles.benchTitle}>
						Panchina ({lineup.bench.filter(p => p).length}/{getTotalBenchSlots()})
					</Text>
					<View style={styles.benchGrid}>
						{Array.from({ length: getTotalBenchSlots() }).map((_, i) =>
							renderBenchCard(lineup.bench[i], i)
						)}
					</View>
				</View>
			</ScrollView>

			<View style={styles.footer}>
				<TouchableOpacity
					style={styles.secondaryButton}
					onPress={handlePreviousFormation}
				>
					<Ionicons name="time-outline" size={20} color={Colors.textSecondary} />
				</TouchableOpacity>
				<TouchableOpacity style={styles.primaryButton} onPress={handleSaveFormation}>
					<Ionicons name="checkmark" size={24} color={Colors.white} />
					<Text style={styles.primaryButtonText}>Salva</Text>
				</TouchableOpacity>
			</View>

			{/* Modal Selezione Giocatore (per slot vuoti) */}
			<Modal
				visible={modalVisible}
				animationType="slide"
				onRequestClose={() => setModalVisible(false)}
			>
				<View style={styles.modalContainer}>
					<View style={styles.modalHeader}>
						<Text style={styles.modalTitle}>Seleziona Giocatore</Text>
						<TouchableOpacity onPress={() => setModalVisible(false)}>
							<Ionicons name="close" size={28} color={Colors.text} />
						</TouchableOpacity>
					</View>

					<View style={styles.searchContainer}>
						<Ionicons name="search" size={20} color={Colors.textSecondary} />
						<TextInput
							style={styles.searchInput}
							placeholder="Cerca giocatore..."
							value={searchQuery}
							onChangeText={setSearchQuery}
						/>
					</View>

					<ScrollView style={styles.playerList}>
						{getPlayersByRoleGrouped().map((group, groupIndex) => (
							<View key={groupIndex}>
								{group.label && (
									<View style={styles.roleDivider}>
										<Text style={styles.roleDividerText}>{group.label}</Text>
									</View>
								)}
								{group.players.map((player) => {
									const roleColor = getRoleColor(player.role);
									return (
										<TouchableOpacity
											key={player.id}
											style={[
												styles.playerItem,
												{ borderLeftWidth: 4, borderLeftColor: roleColor }
											]}
											onPress={() => selectPlayer(player)}
										>
											<View style={styles.playerItemInfo}>
												<View>
													<Text style={styles.playerItemName}>{player.name}</Text>
													<Text style={styles.playerItemTeam}>
														{player.team || 'N/A'} - {player.role}
													</Text>
												</View>
												<View style={styles.playerItemStats}>
													<Text style={styles.playerItemQuotazione}>
														Q: {player.quotazione_attuale_classico || player.value || 'N/A'}
													</Text>
													<Text style={styles.playerItemFvm}>
														FVM: {player.fvm_classico || 'N/A'}
													</Text>
												</View>
											</View>
										</TouchableOpacity>
									);
								})}
							</View>
						))}
						{getAvailablePlayersByRole().length === 0 && (
							<View style={styles.emptyList}>
								<Text style={styles.emptyListText}>
									Nessun giocatore disponibile
								</Text>
							</View>
						)}
					</ScrollView>
				</View>
			</Modal>

			{/* Modal Scambio Giocatore */}
			<Modal
				visible={swapModalVisible}
				animationType="slide"
				onRequestClose={() => {
					setSwapModalVisible(false);
					setSelectedPlayerForSwap(null);
				}}
			>
				<View style={styles.modalContainer}>
					<View style={styles.modalHeader}>
						<View>
							<Text style={styles.modalTitle}>
								{selectedPlayerForSwap?.player ? 'Scambia Giocatore' : 'Seleziona Giocatore'}
							</Text>
							{selectedPlayerForSwap?.player && (
								<Text style={styles.modalSubtitle}>
									{selectedPlayerForSwap.player.name}
								</Text>
							)}
						</View>
						<TouchableOpacity onPress={() => {
							setSwapModalVisible(false);
							setSelectedPlayerForSwap(null);
						}}>
							<Ionicons name="close" size={28} color={Colors.text} />
						</TouchableOpacity>
					</View>

					<View style={styles.searchContainer}>
						<Ionicons name="search" size={20} color={Colors.textSecondary} />
						<TextInput
							style={styles.searchInput}
							placeholder="Cerca giocatore..."
							value={searchQuery}
							onChangeText={setSearchQuery}
						/>
					</View>

					<ScrollView style={styles.playerList}>
						{/* Mostra il giocatore selezionato in cima come confronto */}
						{selectedPlayerForSwap?.player && (
							<View style={[styles.playerItem, { backgroundColor: '#e3f2fd', borderLeftWidth: 4, borderLeftColor: getRoleColor(selectedPlayerForSwap.player.role), marginBottom: 16 }]}>
								<View style={styles.playerItemInfo}>
									<View style={{ flex: 1 }}>
										<Text style={[styles.playerItemName, { color: Colors.primary }]}>Giocatore selezionato</Text>
										<Text style={styles.playerItemName}>{selectedPlayerForSwap.player.name}</Text>
										<Text style={styles.playerItemTeam}>
											{selectedPlayerForSwap.player.team || 'N/A'} - {selectedPlayerForSwap.player.role}
										</Text>
									</View>
									<View style={styles.playerItemStats}>
										<Text style={styles.playerItemQuotazione}>
											Q: {selectedPlayerForSwap.player.quotazione_attuale_classico || selectedPlayerForSwap.player.value || 'N/A'}
										</Text>
										<Text style={styles.playerItemFvm}>
											FVM: {selectedPlayerForSwap.player.fvm_classico || 'N/A'}
										</Text>
									</View>
								</View>
							</View>
						)}
						{getAvailablePlayersForSwap().length === 0 ? (
							<View style={styles.emptyList}>
								<Text style={styles.emptyListText}>
									Nessun giocatore disponibile per lo scambio
								</Text>
							</View>
						) : (
							getAvailablePlayersForSwap().map((group, groupIndex) => (
								<View key={groupIndex}>
									{group.label && (
										<View style={styles.roleDivider}>
											<Text style={styles.roleDividerText}>{group.label}</Text>
										</View>
									)}
									{group.players.map((player) => {
										const roleColor = getRoleColor(player.role);

										return (
											<TouchableOpacity
												key={player.id}
												style={[
													styles.playerItem,
													{ borderLeftWidth: 4, borderLeftColor: roleColor }
												]}
												onPress={() => handleSwapWithSelected(player)}
											>
												<View style={styles.playerItemInfo}>
													<View style={{ flex: 1 }}>
														<Text style={styles.playerItemName}>{player.name}</Text>
														<Text style={styles.playerItemTeam}>
															{player.team || 'N/A'} - {player.role}
														</Text>
													</View>
													<View style={styles.playerItemStats}>
														<Text style={styles.playerItemQuotazione}>
															Q: {player.quotazione_attuale_classico || player.value || 'N/A'}
														</Text>
														<Text style={styles.playerItemFvm}>
															FVM: {player.fvm_classico || 'N/A'}
														</Text>
													</View>
												</View>
											</TouchableOpacity>
										);
									})}
								</View>
							))
						)}
					</ScrollView>
				</View>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.gray100,
	},
	header: {
		backgroundColor: Colors.card,
		padding: 20,
		paddingTop: 60,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	backButton: {
		color: Colors.primary,
		fontSize: 16,
		marginBottom: 8,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		color: Colors.text,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		marginTop: 12,
		fontSize: 16,
		color: Colors.textSecondary,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	emptyText: {
		fontSize: 16,
		color: Colors.textSecondary,
		textAlign: 'center',
	},
	content: {
		flex: 1,
	},

	// Nuovo stile compatto per selettore modulo
	formationSelectorCompact: {
		backgroundColor: Colors.card,
		paddingVertical: 12,
		paddingHorizontal: 15,
		borderBottomWidth: 1,
		borderBottomColor: Colors.gray200,
	},
	formationChip: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 16,
		backgroundColor: Colors.gray100,
		marginRight: 8,
		borderWidth: 1,
		borderColor: Colors.gray300,
	},
	formationChipActive: {
		backgroundColor: Colors.primary,
		borderColor: Colors.primary,
	},
	formationChipText: {
		fontSize: 14,
		fontWeight: '600',
		color: Colors.textSecondary,
	},
	formationChipTextActive: {
		color: Colors.white,
	},

	// Campo compatto
	fieldCompact: {
		backgroundColor: Colors.success,
		paddingVertical: 15,
		paddingHorizontal: 10,
		minHeight: 320,
		justifyContent: 'space-evenly',
	},
	lineCompact: {
		flexDirection: 'row',
		justifyContent: 'space-evenly',
		alignItems: 'center',
		marginVertical: 5,
	},
	playerSlotWrapper: {
		marginHorizontal: 3,
	},

	// Card giocatore compatta
	compactPlayerCard: {
		backgroundColor: 'rgba(255,255,255,0.95)',
		borderRadius: 8,
		padding: 8,
		width: 82,
		minHeight: 60,
		borderLeftWidth: 4,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 3,
		elevation: 3,
	},
	compactPlayerInfo: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	compactPlayerName: {
		fontSize: 11,
		fontWeight: 'bold',
		color: Colors.text,
		textAlign: 'center',
		marginBottom: 4,
	},
	compactPlayerQuota: {
		fontSize: 9,
		fontWeight: '700',
		color: Colors.primary,
		textAlign: 'center',
		lineHeight: 12,
	},
	compactPlayerFvm: {
		fontSize: 9,
		fontWeight: '700',
		color: Colors.textSecondary,
		textAlign: 'center',
		lineHeight: 12,
	},
	emptySlotCompact: {
		backgroundColor: 'rgba(255,255,255,0.3)',
		borderRadius: 8,
		padding: 8,
		width: 82,
		minHeight: 60,
		borderWidth: 2,
		borderColor: 'rgba(255,255,255,0.5)',
		borderStyle: 'dashed',
		justifyContent: 'center',
		alignItems: 'center',
	},

	// Panchina
	benchSection: {
		backgroundColor: Colors.card,
		padding: 15,
		marginTop: 10,
		marginBottom: 80,
	},
	benchTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: Colors.text,
		marginBottom: 12,
	},
	benchGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 10,
	},
	benchCard: {
		backgroundColor: Colors.white,
		borderRadius: 8,
		padding: 10,
		width: (screenWidth - 60) / 3,
		minHeight: 70,
		borderTopWidth: 3,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
		justifyContent: 'center',
		alignItems: 'center',
	},
	benchCardEmpty: {
		backgroundColor: Colors.gray100,
		borderRadius: 8,
		padding: 10,
		width: (screenWidth - 60) / 3,
		minHeight: 70,
		borderWidth: 2,
		borderColor: Colors.gray300,
		borderStyle: 'dashed',
		justifyContent: 'center',
		alignItems: 'center',
	},
	benchCardRole: {
		fontSize: 12,
		fontWeight: 'bold',
		color: Colors.textSecondary,
		marginBottom: 4,
	},
	benchCardName: {
		fontSize: 11,
		fontWeight: '600',
		color: Colors.text,
		textAlign: 'center',
		marginBottom: 4,
	},
	benchCardStats: {
		alignItems: 'center',
		gap: 2,
	},
	benchCardQuota: {
		fontSize: 10,
		color: Colors.primary,
		fontWeight: '600',
	},
	benchCardFvm: {
		fontSize: 10,
		color: Colors.textSecondary,
		fontWeight: '600',
	},

	// Footer
	footer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		flexDirection: 'row',
		padding: 15,
		backgroundColor: Colors.card,
		borderTopWidth: 1,
		borderTopColor: Colors.gray300,
		gap: 10,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: -2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 5,
	},
	secondaryButton: {
		paddingVertical: 14,
		paddingHorizontal: 20,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: Colors.gray100,
		borderWidth: 1,
		borderColor: Colors.gray300,
	},
	primaryButton: {
		flex: 1,
		flexDirection: 'row',
		paddingVertical: 14,
		paddingHorizontal: 20,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: Colors.success,
		gap: 8,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.15,
		shadowRadius: 5,
		elevation: 4,
	},
	primaryButtonText: {
		color: Colors.white,
		fontSize: 16,
		fontWeight: '700',
	},

	// Modal Styles
	modalContainer: {
		flex: 1,
		backgroundColor: Colors.gray100,
		paddingTop: 60,
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		backgroundColor: Colors.card,
		padding: 20,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: Colors.text,
	},
	modalSubtitle: {
		fontSize: 14,
		color: Colors.textSecondary,
		marginTop: 4,
	},
	searchContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: Colors.card,
		margin: 15,
		padding: 12,
		borderRadius: 10,
		gap: 10,
	},
	searchInput: {
		flex: 1,
		fontSize: 16,
		color: Colors.text,
	},
	playerList: {
		flex: 1,
	},
	roleDivider: {
		backgroundColor: Colors.gray200,
		paddingVertical: 8,
		paddingHorizontal: 15,
		marginTop: 10,
		marginBottom: 5,
	},
	roleDividerText: {
		fontSize: 14,
		fontWeight: '700',
		color: Colors.textSecondary,
		textTransform: 'uppercase',
		letterSpacing: 1,
	},
	playerItem: {
		backgroundColor: Colors.card,
		padding: 15,
		marginHorizontal: 15,
		marginBottom: 10,
		borderRadius: 10,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	playerItemInfo: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	playerItemName: {
		fontSize: 16,
		fontWeight: 'bold',
		color: Colors.text,
	},
	playerItemTeam: {
		fontSize: 14,
		color: Colors.textSecondary,
		marginTop: 4,
	},
	playerItemStats: {
		alignItems: 'flex-end',
	},
	playerItemQuotazione: {
		fontSize: 14,
		fontWeight: '600',
		color: Colors.primary,
	},
	playerItemFvm: {
		fontSize: 12,
		color: Colors.textSecondary,
		marginTop: 2,
	},
	locationBadge: {
		backgroundColor: Colors.gray200,
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 6,
		marginTop: 6,
		alignSelf: 'flex-start',
	},
	locationBadgeText: {
		fontSize: 11,
		fontWeight: '600',
		color: Colors.textSecondary,
	},
	emptyList: {
		padding: 40,
		alignItems: 'center',
	},
	emptyListText: {
		fontSize: 16,
		color: Colors.textSecondary,
		textAlign: 'center',
	},

	// Legacy styles (mantenuti per compatibilità)
	formationSelector: {
		backgroundColor: Colors.card,
		padding: 20,
		marginBottom: 10,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: Colors.text,
		marginBottom: 12,
	},
	formationButton: {
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 20,
		backgroundColor: Colors.gray100,
		marginRight: 10,
		borderWidth: 2,
		borderColor: Colors.gray300,
	},
	formationButtonActive: {
		backgroundColor: Colors.primary,
		borderColor: Colors.primary,
	},
	formationButtonText: {
		fontSize: 16,
		fontWeight: '600',
		color: Colors.textSecondary,
	},
	formationButtonTextActive: {
		color: Colors.white,
	},
	field: {
		backgroundColor: Colors.success,
		padding: 20,
		marginBottom: 10,
	},
	fieldTitleContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		marginBottom: 20,
	},
	fieldTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: Colors.white,
	},
	fieldSection: {
		marginBottom: 20,
	},
	roleTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: Colors.white,
		marginBottom: 10,
	},
	playerSlot: {
		backgroundColor: 'rgba(255,255,255,0.2)',
		padding: 15,
		borderRadius: 8,
		marginBottom: 8,
		borderWidth: 2,
		borderColor: Colors.white,
		borderStyle: 'dashed',
	},
	playerSlotFilled: {
		backgroundColor: 'rgba(255,255,255,0.9)',
		borderStyle: 'solid',
		borderColor: Colors.white,
	},
	playerInfo: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	playerName: {
		fontSize: 16,
		fontWeight: 'bold',
		color: Colors.text,
	},
	playerTeam: {
		fontSize: 12,
		color: Colors.textSecondary,
		marginTop: 2,
	},
	playerStats: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	playerQuotazione: {
		fontSize: 14,
		fontWeight: '600',
		color: Colors.text,
	},
	slotText: {
		color: Colors.white,
		textAlign: 'center',
		fontSize: 14,
	},
	bench: {
		backgroundColor: Colors.card,
		padding: 20,
	},
	benchSlot: {
		backgroundColor: Colors.gray100,
		padding: 15,
		borderRadius: 8,
		marginBottom: 8,
		borderWidth: 2,
		borderColor: Colors.gray300,
		borderStyle: 'dashed',
	},
	benchSlotFilled: {
		backgroundColor: Colors.card,
		padding: 15,
		borderRadius: 8,
		marginBottom: 8,
		borderWidth: 1,
		borderColor: Colors.gray300,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 2,
	},
	benchSlotText: {
		color: Colors.textSecondary,
		textAlign: 'center',
		fontSize: 14,
	},
	selectedForSwap: {
		borderWidth: 3,
		borderColor: Colors.primary,
		backgroundColor: '#E3F2FD',
		transform: [{ scale: 1.02 }],
	},
	swapBanner: {
		backgroundColor: Colors.primary,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 12,
		paddingHorizontal: 15,
	},
	swapBannerContent: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		flex: 1,
	},
	swapBannerText: {
		color: Colors.white,
		fontSize: 14,
		fontWeight: '600',
		flex: 1,
	},
});
