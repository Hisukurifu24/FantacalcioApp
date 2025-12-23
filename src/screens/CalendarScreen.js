import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	ActivityIndicator,
	RefreshControl,
	Modal,
	FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../config/theme';
import { useLeague } from '../context/LeagueContext';
import { getCompetitions } from '../services/api';

export default function CalendarScreen({ navigation }) {
	const { selectedLeague } = useLeague();
	const [competitions, setCompetitions] = useState([]);
	const [selectedCompetition, setSelectedCompetition] = useState(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState(null);
	const [showCompetitionPicker, setShowCompetitionPicker] = useState(false);

	useEffect(() => {
		loadCompetitions();
	}, [selectedLeague]);

	// Ricarica i dati ogni volta che la schermata diventa visibile
	useFocusEffect(
		React.useCallback(() => {
			loadCompetitions();
		}, [selectedLeague])
	);

	const loadCompetitions = async () => {
		if (!selectedLeague) {
			setError('Nessuna lega selezionata');
			setLoading(false);
			return;
		}

		try {
			setError(null);
			const data = await getCompetitions(selectedLeague.id);
			setCompetitions(data);

			// Select first competition by default
			if (data.length > 0 && !selectedCompetition) {
				setSelectedCompetition(data[0]);
			}
		} catch (err) {
			console.error('Error loading competitions:', err);
			setError('Errore nel caricamento delle competizioni');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	const onRefresh = () => {
		setRefreshing(true);
		loadCompetitions();
	};

	const generateMatchesByDay = () => {
		if (!selectedCompetition || !selectedLeague) return [];

		const calendar = selectedCompetition.calendar || [];
		const matchesByDay = {};

		// Group matches by day
		calendar.forEach((match, index) => {
			const day = match.day;
			if (!matchesByDay[day]) {
				matchesByDay[day] = [];
			}
			matchesByDay[day].push({
				id: `${match.day}-${index}`,
				day: match.day,
				homeTeam: match.home_team,
				awayTeam: match.away_team,
				homeScore: match.home_score,
				awayScore: match.away_score,
				status: match.played ? 'completed' : 'upcoming',
			});
		});

		// Convert to array and sort by day
		return Object.keys(matchesByDay)
			.sort((a, b) => parseInt(a) - parseInt(b))
			.map(day => ({
				day: parseInt(day),
				matches: matchesByDay[day],
				allCompleted: matchesByDay[day].every(m => m.status === 'completed'),
			}));
	};

	const matchDays = generateMatchesByDay();

	if (loading) {
		return (
			<View style={styles.container}>
				<View style={styles.header}>
					<TouchableOpacity onPress={() => navigation.goBack()}>
						<Text style={styles.backButton}>← Indietro</Text>
					</TouchableOpacity>
					<Text style={styles.title}>Calendario</Text>
				</View>
				<View style={styles.centerContainer}>
					<ActivityIndicator size="large" color={Colors.primary} />
					<Text style={styles.loadingText}>Caricamento...</Text>
				</View>
			</View>
		);
	}

	if (error || !selectedLeague) {
		return (
			<View style={styles.container}>
				<View style={styles.header}>
					<TouchableOpacity onPress={() => navigation.goBack()}>
						<Text style={styles.backButton}>← Indietro</Text>
					</TouchableOpacity>
					<Text style={styles.title}>Calendario</Text>
				</View>
				<View style={styles.centerContainer}>
					<Text style={styles.errorText}>{error || 'Seleziona una lega'}</Text>
					<TouchableOpacity style={styles.retryButton} onPress={loadCompetitions}>
						<Text style={styles.retryButtonText}>Riprova</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	}

	if (competitions.length === 0) {
		return (
			<View style={styles.container}>
				<View style={styles.header}>
					<TouchableOpacity onPress={() => navigation.goBack()}>
						<Text style={styles.backButton}>← Indietro</Text>
					</TouchableOpacity>
					<Text style={styles.title}>Calendario</Text>
				</View>
				<View style={styles.centerContainer}>
					<Text style={styles.emptyText}>Nessuna competizione disponibile</Text>
					<TouchableOpacity
						style={styles.createButton}
						onPress={() => navigation.navigate('CreateCompetition')}
					>
						<Text style={styles.createButtonText}>izione</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<Text style={styles.backButton}>← Indietro</Text>
				</TouchableOpacity>
				<Text style={styles.title}>Calendario</Text>
			</View>

			<View style={styles.competitionSelector}>
				<Text style={styles.label}>Competizione</Text>
				<TouchableOpacity
					style={styles.dropdown}
					onPress={() => setShowCompetitionPicker(true)}
				>
					<Text style={styles.dropdownText}>
						{selectedCompetition?.name || 'Seleziona competizione'}
					</Text>
					<Text style={styles.dropdownIcon}>▼</Text>
				</TouchableOpacity>
			</View>

			<ScrollView
				style={styles.content}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}
			>
				{matchDays.length === 0 ? (
					<View style={styles.emptyContainer}>
						<Text style={styles.emptyText}>Nessun match disponibile</Text>
					</View>
				) : (
					matchDays.map((dayData) => (
						<View key={dayData.day} style={styles.daySection}>
							{/* Day Header */}
							<View style={styles.dayHeader}>
								<Text style={styles.dayTitle}>Giornata {dayData.day}</Text>
								<Text
									style={[
										styles.dayStatus,
										dayData.allCompleted ? styles.dayStatusCompleted : styles.dayStatusUpcoming,
									]}
								>
									{dayData.allCompleted ? '✓ Conclusa' : `${dayData.matches.length} partite`}
								</Text>
							</View>

							{/* Matches for this day */}
							{dayData.matches.map((match) => (
								<View key={match.id} style={styles.matchCard}>
									<View style={styles.matchBody}>
										<View style={styles.teamRow}>
											<Text style={styles.teamName}>{match.homeTeam}</Text>
											{match.homeScore !== null && match.homeScore !== undefined ? (
												<Text style={styles.score}>{match.homeScore}</Text>
											) : (
												<View style={styles.scorePlaceholder} />
											)}
										</View>
										<Text style={styles.vs}>vs</Text>
										<View style={styles.teamRow}>
											<Text style={styles.teamName}>{match.awayTeam}</Text>
											{match.awayScore !== null && match.awayScore !== undefined ? (
												<Text style={styles.score}>{match.awayScore}</Text>
											) : (
												<View style={styles.scorePlaceholder} />
											)}
										</View>
									</View>

									{match.status === 'completed' && (
										<TouchableOpacity style={styles.detailsButton}>
											<Text style={styles.detailsButtonText}>Vedi Dettagli →</Text>
										</TouchableOpacity>
									)}
								</View>
							))}
						</View>
					))
				)}
			</ScrollView>

			{/* Competition Picker Modal */}
			<Modal
				visible={showCompetitionPicker}
				transparent={true}
				animationType="slide"
				onRequestClose={() => setShowCompetitionPicker(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>Seleziona Competizione</Text>
							<TouchableOpacity onPress={() => setShowCompetitionPicker(false)}>
								<Text style={styles.modalClose}>✕</Text>
							</TouchableOpacity>
						</View>
						<FlatList
							data={competitions}
							keyExtractor={(item, index) => index.toString()}
							renderItem={({ item }) => (
								<TouchableOpacity
									style={[
										styles.competitionItem,
										selectedCompetition?.name === item.name && styles.competitionItemSelected,
									]}
									onPress={() => {
										setSelectedCompetition(item);
										setShowCompetitionPicker(false);
									}}
								>
									<Text style={styles.competitionItemText}>{item.name}</Text>
									{selectedCompetition?.name === item.name && (
										<Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
									)}
								</TouchableOpacity>
							)}
						/>
					</View>
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
	centerContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	loadingText: {
		marginTop: 12,
		fontSize: 16,
		color: Colors.textSecondary,
	},
	errorText: {
		fontSize: 16,
		color: Colors.error,
		textAlign: 'center',
		marginBottom: 20,
	},
	emptyText: {
		fontSize: 16,
		color: Colors.textSecondary,
		textAlign: 'center',
		marginBottom: 20,
	},
	emptyContainer: {
		alignItems: 'center',
		padding: 40,
	},
	retryButton: {
		backgroundColor: Colors.primary,
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 8,
	},
	retryButtonText: {
		color: Colors.card,
		fontSize: 16,
		fontWeight: '600',
	},
	createButton: {
		backgroundColor: Colors.primary,
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 8,
	},
	createButtonText: {
		color: Colors.card,
		fontSize: 16,
		fontWeight: '600',
	},
	competitionSelector: {
		backgroundColor: Colors.card,
		padding: 15,
		borderBottomWidth: 1,
		borderBottomColor: Colors.gray300,
	},
	label: {
		fontSize: 14,
		fontWeight: '600',
		color: Colors.textSecondary,
		marginBottom: 8,
	},
	dropdown: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		backgroundColor: Colors.gray100,
		padding: 12,
		borderRadius: 8,
	},
	dropdownText: {
		fontSize: 16,
		color: Colors.text,
	},
	dropdownIcon: {
		fontSize: 12,
		color: Colors.textSecondary,
	},
	content: {
		flex: 1,
		padding: 15,
	},
	daySection: {
		marginBottom: 24,
	},
	dayHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		backgroundColor: Colors.primary,
		padding: 12,
		borderRadius: 8,
		marginBottom: 12,
	},
	dayTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		color: Colors.white,
	},
	dayStatus: {
		fontSize: 12,
		fontWeight: '600',
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 12,
	},
	dayStatusCompleted: {
		color: Colors.success,
		backgroundColor: 'rgba(255, 255, 255, 0.9)',
	},
	dayStatusUpcoming: {
		color: Colors.white,
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
	},
	matchCard: {
		backgroundColor: Colors.card,
		borderRadius: 8,
		padding: 16,
		marginBottom: 8,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	matchHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 12,
	},
	dayBadge: {
		fontSize: 12,
		fontWeight: '600',
		color: Colors.primary,
		backgroundColor: '#E8EAF6',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4,
	},
	statusBadge: {
		minWidth: 40,
		textAlign: 'center',
	},
	scorePlaceholder: {
		width: 40,
		height: 28,
		fontSize: 12,
		fontWeight: '600',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4,
	},
	statusCompleted: {
		color: Colors.success,
		backgroundColor: '#E8F5E9',
	},
	statusUpcoming: {
		color: Colors.warning,
		backgroundColor: '#FFF3E0',
	},
	matchBody: {
		paddingVertical: 12,
	},
	teamRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginVertical: 8,
	},
	teamName: {
		fontSize: 16,
		fontWeight: '600',
		color: Colors.text,
	},
	score: {
		fontSize: 20,
		fontWeight: 'bold',
		color: Colors.highlight,
	},
	vs: {
		textAlign: 'center',
		fontSize: 12,
		color: Colors.textLight,
		marginVertical: 4,
	},
	detailsButton: {
		marginTop: 12,
		paddingTop: 12,
		borderTopWidth: 1,
		borderTopColor: Colors.gray100,
	},
	detailsButtonText: {
		fontSize: 14,
		color: Colors.primary,
		fontWeight: '600',
		textAlign: 'right',
	},
	// Modal styles
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'flex-end',
	},
	modalContent: {
		backgroundColor: Colors.card,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		maxHeight: '70%',
		paddingBottom: 20,
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 20,
		borderBottomWidth: 1,
		borderBottomColor: Colors.gray300,
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: Colors.text,
	},
	modalClose: {
		fontSize: 24,
		color: Colors.textSecondary,
		fontWeight: '300',
	},
	competitionItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: Colors.gray100,
	},
	competitionItemSelected: {
		backgroundColor: Colors.gray100,
	},
	competitionItemText: {
		fontSize: 16,
		color: Colors.text,
	},
});

