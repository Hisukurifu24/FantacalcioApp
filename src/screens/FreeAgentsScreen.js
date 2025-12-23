import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TextInput,
	TouchableOpacity,
	ActivityIndicator,
	ScrollView,
	Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../config/theme';
import { getFreeAgents } from '../services/api';

const ROLES = ['Tutti', 'P', 'D', 'C', 'A'];

// Lista squadre Serie A
const TEAMS = ['Tutti', 'ATA', 'BOL', 'CAG', 'COM', 'EMP', 'FIO', 'GEN', 'INT', 'JUV',
	'LAZ', 'LEC', 'MIL', 'MON', 'NAP', 'PAR', 'ROM', 'TOR', 'UDI', 'VEN', 'VER'];

// Opzioni di ordinamento
const SORT_OPTIONS = [
	{ value: null, label: 'Nessuno' },
	{ value: 'quotazione_desc', label: 'Q ↓' },
	{ value: 'quotazione_asc', label: 'Q ↑' },
	{ value: 'fvm_desc', label: 'FVM ↓' },
	{ value: 'fvm_asc', label: 'FVM ↑' },
];

export default function FreeAgentsScreen({ route, navigation }) {
	const { league, selectionMode = false, onSelectPlayer } = route.params;
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedRole, setSelectedRole] = useState('Tutti');
	const [selectedTeam, setSelectedTeam] = useState('Tutti');
	const [minQuotazione, setMinQuotazione] = useState('');
	const [maxQuotazione, setMaxQuotazione] = useState('');
	const [minFvm, setMinFvm] = useState('');
	const [maxFvm, setMaxFvm] = useState('');
	const [sortBy, setSortBy] = useState(null);
	const [showFilters, setShowFilters] = useState(false);
	const [players, setPlayers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		loadFreeAgents();
	}, [selectedRole, searchQuery, selectedTeam, minQuotazione, maxQuotazione, minFvm, maxFvm, sortBy]);

	const loadFreeAgents = async () => {
		try {
			setLoading(true);
			setError(null);

			const filters = {
				role: selectedRole,
				search: searchQuery || null,
				team: selectedTeam !== 'Tutti' ? selectedTeam : null,
				minQuotazione: minQuotazione ? parseFloat(minQuotazione) : null,
				maxQuotazione: maxQuotazione ? parseFloat(maxQuotazione) : null,
				minFvm: minFvm ? parseFloat(minFvm) : null,
				maxFvm: maxFvm ? parseFloat(maxFvm) : null,
				sortBy: sortBy,
			};

			const response = await getFreeAgents(league.id, filters);
			setPlayers(response.data || []);
		} catch (err) {
			console.error('Error loading free agents:', err);
			setError('Errore nel caricamento dei giocatori');
		} finally {
			setLoading(false);
		}
	};

	const resetFilters = () => {
		setSelectedRole('Tutti');
		setSelectedTeam('Tutti');
		setMinQuotazione('');
		setMaxQuotazione('');
		setMinFvm('');
		setMaxFvm('');
		setSearchQuery('');
		setSortBy(null);
	};

	const getRoleLabel = (role) => {
		const roleMap = {
			'p': 'Portiere',
			'd': 'Difensore',
			'c': 'Centrocampista',
			'a': 'Attaccante',
		};
		return roleMap[role?.toLowerCase()] || role;
	};

	const handlePlayerPress = (player) => {
		if (selectionMode) {
			navigation.navigate('PlayerDetail', {
				player,
				league,
				selectionMode: true,
				onSelectPlayer,
			});
			return;
		}

		navigation.navigate('PlayerDetail', { player, league });
	};

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<Text style={styles.backButton}>← Indietro</Text>
				</TouchableOpacity>
				<View style={styles.headerRow}>
					<View style={styles.headerLeft}>
						<Text style={styles.title}>{selectionMode ? 'Seleziona Giocatore' : 'Svincolati'}</Text>
						<Text style={styles.subtitle}>
							{loading ? 'Caricamento...' : `${players.length} giocatori`}
						</Text>
					</View>
					<TouchableOpacity
						style={styles.filterIconButton}
						onPress={() => setShowFilters(!showFilters)}
					>
						<Ionicons name="filter" size={24} color={Colors.primary} />
					</TouchableOpacity>
				</View>
			</View>

			<View style={styles.filters}>
				<TextInput
					style={styles.searchInput}
					placeholder="Cerca giocatore..."
					value={searchQuery}
					onChangeText={setSearchQuery}
				/>

				{/* ORDINAMENTO SEMPRE VISIBILE */}
				<View style={styles.sortSection}>
					<ScrollView horizontal showsHorizontalScrollIndicator={false}>
						{SORT_OPTIONS.map((option) => (
							<TouchableOpacity
								key={option.label}
								style={[
									styles.sortButton,
									sortBy === option.value && styles.sortButtonActive,
								]}
								onPress={() => setSortBy(option.value)}
							>
								<Text
									style={[
										styles.sortButtonText,
										sortBy === option.value && styles.sortButtonTextActive,
									]}
								>
									{option.label}
								</Text>
							</TouchableOpacity>
						))}
					</ScrollView>
				</View>

				{showFilters && (
					<View style={styles.advancedFilters}>
						{/* SEZIONE FILTRI */}
						<View style={styles.section}>
							<Text style={styles.sectionTitle}>🔍 Filtri</Text>

							<View style={styles.filterSection}>
								<Text style={styles.filterLabel}>Ruolo</Text>
								<ScrollView horizontal showsHorizontalScrollIndicator={false}>
									{ROLES.map((role) => (
										<TouchableOpacity
											key={role}
											style={[
												styles.roleButton,
												selectedRole === role && styles.roleButtonActive,
											]}
											onPress={() => setSelectedRole(role)}
										>
											<Text
												style={[
													styles.roleButtonText,
													selectedRole === role && styles.roleButtonTextActive,
												]}
											>
												{role}
											</Text>
										</TouchableOpacity>
									))}
								</ScrollView>
							</View>

							<View style={styles.filterSection}>
								<Text style={styles.filterLabel}>Squadra Serie A</Text>
								<ScrollView horizontal showsHorizontalScrollIndicator={false}>
									{TEAMS.map((team) => (
										<TouchableOpacity
											key={team}
											style={[
												styles.teamButton,
												selectedTeam === team && styles.teamButtonActive,
											]}
											onPress={() => setSelectedTeam(team)}
										>
											<Text
												style={[
													styles.teamButtonText,
													selectedTeam === team && styles.teamButtonTextActive,
												]}
											>
												{team}
											</Text>
										</TouchableOpacity>
									))}
								</ScrollView>
							</View>

							<View style={styles.filterSection}>
								<Text style={styles.filterLabel}>Quotazione</Text>
								<View style={styles.rangeInputs}>
									<TextInput
										style={styles.rangeInput}
										placeholder="Min"
										keyboardType="numeric"
										value={minQuotazione}
										onChangeText={setMinQuotazione}
									/>
									<Text style={styles.rangeSeparator}>-</Text>
									<TextInput
										style={styles.rangeInput}
										placeholder="Max"
										keyboardType="numeric"
										value={maxQuotazione}
										onChangeText={setMaxQuotazione}
									/>
								</View>
							</View>

							<View style={styles.filterSection}>
								<Text style={styles.filterLabel}>Fanta Valore Mercato (FVM)</Text>
								<View style={styles.rangeInputs}>
									<TextInput
										style={styles.rangeInput}
										placeholder="Min"
										keyboardType="numeric"
										value={minFvm}
										onChangeText={setMinFvm}
									/>
									<Text style={styles.rangeSeparator}>-</Text>
									<TextInput
										style={styles.rangeInput}
										placeholder="Max"
										keyboardType="numeric"
										value={maxFvm}
										onChangeText={setMaxFvm}
									/>
								</View>
							</View>
						</View>

						<TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
							<Ionicons name="refresh" size={16} color={Colors.white} />
							<Text style={styles.resetButtonText}>Reset Filtri e Ordinamento</Text>
						</TouchableOpacity>
					</View>
				)}
			</View>

			{error && (
				<View style={styles.errorContainer}>
					<Text style={styles.errorText}>{error}</Text>
					<TouchableOpacity onPress={loadFreeAgents} style={styles.retryButton}>
						<Text style={styles.retryButtonText}>Riprova</Text>
					</TouchableOpacity>
				</View>
			)}

			{loading ? (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color={Colors.primary} />
				</View>
			) : (
				<FlatList
					data={players}
					keyExtractor={(item, index) => `${item.nome}-${index}`}
					renderItem={({ item }) => (
						<TouchableOpacity
							style={styles.playerCard}
							onPress={() => handlePlayerPress(item)}
							activeOpacity={0.85}
						>
							<View style={styles.playerInfo}>
								<Text style={styles.playerName}>{item.nome}</Text>
								<Text style={styles.playerDetails}>
									{getRoleLabel(item.ruolo)} • {item.squadra}
								</Text>
							</View>
							<View style={styles.playerStats}>
								<View style={styles.statItem}>
									<Text style={styles.statLabel}>Quotazione</Text>
									<Text style={styles.statValue}>
										{item.quotazione_attuale_classico || item.quotazione_iniziale_classico || '-'}
									</Text>
								</View>
								{item.fvm_classico && (
									<View style={styles.statItem}>
										<Text style={styles.statLabel}>FVM</Text>
										<Text style={styles.statValue}>{item.fvm_classico}</Text>
									</View>
								)}
							</View>
							{selectionMode && (
								<Ionicons name="chevron-forward" size={20} color={Colors.primary} style={styles.selectIcon} />
							)}
						</TouchableOpacity>
					)}
					ListEmptyComponent={
						<View style={styles.emptyState}>
							<Text style={styles.emptyText}>
								{searchQuery
									? 'Nessun giocatore trovato con questi criteri'
									: 'Nessun giocatore disponibile'}
							</Text>
						</View>
					}
				/>
			)}
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
	headerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	headerLeft: {
		flex: 1,
	},
	filterIconButton: {
		padding: 8,
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
	subtitle: {
		fontSize: 14,
		color: Colors.textSecondary,
		marginTop: 4,
	},
	filters: {
		backgroundColor: Colors.card,
		padding: 15,
		borderBottomWidth: 1,
		borderBottomColor: Colors.gray300,
	},
	searchInput: {
		backgroundColor: Colors.gray100,
		padding: 12,
		borderRadius: 8,
		fontSize: 16,
		marginBottom: 12,
	},
	sortSection: {
		marginBottom: 12,
	},
	roleFilters: {
		flexDirection: 'row',
		marginBottom: 8,
	},
	roleButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
		backgroundColor: Colors.gray100,
		borderWidth: 1,
		borderColor: Colors.gray300,
		marginRight: 8,
	},
	roleButtonActive: {
		backgroundColor: Colors.primary,
		borderColor: Colors.primary,
	},
	roleButtonText: {
		fontSize: 14,
		fontWeight: '600',
		color: Colors.textSecondary,
	},
	roleButtonTextActive: {
		color: Colors.white,
	},
	advancedFilters: {
		marginTop: 12,
		paddingTop: 12,
		borderTopWidth: 1,
		borderTopColor: Colors.gray300,
	},
	section: {
		marginBottom: 20,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '700',
		color: Colors.text,
		marginBottom: 12,
	},
	filterSection: {
		marginBottom: 16,
	},
	filterLabel: {
		fontSize: 14,
		fontWeight: '600',
		color: Colors.text,
		marginBottom: 8,
	},
	teamButton: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
		backgroundColor: Colors.gray100,
		borderWidth: 1,
		borderColor: Colors.gray300,
		marginRight: 8,
	},
	teamButtonActive: {
		backgroundColor: Colors.success,
		borderColor: Colors.success,
	},
	teamButtonText: {
		fontSize: 12,
		fontWeight: '600',
		color: Colors.textSecondary,
	},
	teamButtonTextActive: {
		color: Colors.white,
	},
	rangeInputs: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	rangeInput: {
		flex: 1,
		backgroundColor: Colors.gray100,
		padding: 10,
		borderRadius: 8,
		fontSize: 14,
		borderWidth: 1,
		borderColor: Colors.gray300,
	},
	rangeSeparator: {
		marginHorizontal: 8,
		fontSize: 16,
		color: Colors.textSecondary,
	},
	sortButton: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 20,
		backgroundColor: Colors.white,
		borderWidth: 2,
		borderColor: Colors.gray300,
		marginRight: 6,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 2,
	},
	sortButtonActive: {
		backgroundColor: Colors.primary,
		borderColor: Colors.primary,
		shadowColor: Colors.primary,
		shadowOpacity: 0.3,
		shadowRadius: 5,
		elevation: 4,
	},
	sortButtonText: {
		fontSize: 13,
		fontWeight: '700',
		color: Colors.text,
	},
	sortButtonTextActive: {
		color: Colors.white,
	},
	resetButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: Colors.error,
		padding: 12,
		borderRadius: 8,
		marginTop: 8,
	},
	resetButtonText: {
		color: Colors.white,
		fontSize: 14,
		fontWeight: '600',
		marginLeft: 6,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	errorContainer: {
		padding: 20,
		alignItems: 'center',
	},
	errorText: {
		fontSize: 16,
		color: Colors.error,
		marginBottom: 10,
	},
	retryButton: {
		backgroundColor: Colors.primary,
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 8,
	},
	retryButtonText: {
		color: Colors.white,
		fontSize: 16,
		fontWeight: '600',
	},
	playerCard: {
		backgroundColor: Colors.card,
		padding: 16,
		marginHorizontal: 15,
		marginTop: 10,
		borderRadius: 12,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	playerInfo: {
		flex: 1,
	},
	playerName: {
		fontSize: 18,
		fontWeight: '600',
		color: Colors.text,
		marginBottom: 4,
	},
	playerDetails: {
		fontSize: 14,
		color: Colors.textSecondary,
	},
	playerStats: {
		flexDirection: 'row',
		gap: 12,
	},
	statItem: {
		alignItems: 'center',
		backgroundColor: Colors.gray100,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
	},
	statLabel: {
		fontSize: 10,
		color: Colors.textSecondary,
		marginBottom: 2,
	},
	statValue: {
		fontSize: 16,
		fontWeight: '600',
		color: Colors.success,
	},
	emptyState: {
		padding: 40,
		alignItems: 'center',
	},
	emptyText: {
		fontSize: 16,
		color: Colors.textSecondary,
		textAlign: 'center',
	},
	selectIcon: {
		marginLeft: 8,
	},
});
