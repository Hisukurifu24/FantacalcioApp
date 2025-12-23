import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	ActivityIndicator,
	Modal,
	ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../config/theme';
import { useLeague } from '../context/LeagueContext';
import { getLeague } from '../services/api';

export default function StandingsScreen({ navigation }) {
	const { selectedLeague } = useLeague();
	const [league, setLeague] = useState(null);
	const [competitions, setCompetitions] = useState([]);
	const [selectedCompetition, setSelectedCompetition] = useState(null);
	const [standings, setStandings] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showCompetitionModal, setShowCompetitionModal] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		if (selectedLeague) {
			loadLeagueData();
		}
	}, [selectedLeague]);

	// Ricarica i dati ogni volta che la schermata diventa visibile
	useFocusEffect(
		React.useCallback(() => {
			if (selectedLeague) {
				loadLeagueData();
			}
		}, [selectedLeague])
	);

	useEffect(() => {
		if (selectedCompetition) {
			setStandings(selectedCompetition.standings || []);
		}
	}, [selectedCompetition]);

	const getCompetitionTypeLabel = (type) => {
		switch (type) {
			case 'CHAMPIONSHIP': return 'Campionato';
			case 'GROUP_TOURNAMENT': return 'Torneo a Gironi';
			case 'KNOCKOUT_TOURNAMENT': return 'Torneo ad Eliminazione';
			case 'POINTS': return 'A Punti';
			case 'FORMULA1': return 'Formula 1';
			default: return 'Competizione';
		}
	};

	const isGroupTournament = () => {
		return selectedCompetition?.type === 'GROUP_TOURNAMENT';
	};

	const isKnockoutTournament = () => {
		return selectedCompetition?.type === 'KNOCKOUT_TOURNAMENT';
	};

	const loadLeagueData = async () => {
		try {
			setLoading(true);
			setError(null);
			const leagueData = await getLeague(selectedLeague.id);
			setLeague(leagueData);

			const comps = leagueData.competitions || [];
			setCompetitions(comps);

			// Seleziona automaticamente la prima competizione se disponibile
			if (comps.length > 0 && !selectedCompetition) {
				setSelectedCompetition(comps[0]);
			}
		} catch (err) {
			console.error('Error loading league data:', err);
			setError('Impossibile caricare i dati della lega');
		} finally {
			setLoading(false);
		}
	};
	const renderItem = ({ item, index }) => {
		const position = index + 1;
		const isFirst = position === 1;
		const isTop3 = position <= 3;

		return (
			<View style={[styles.row, isFirst && styles.firstRow]}>
				<View style={styles.positionCell}>
					<Text style={[styles.positionText, isFirst && styles.firstText]}>
						{position}
					</Text>
				</View>
				<View style={styles.teamCell}>
					<Text style={[styles.teamText, isFirst && styles.firstText]}>
						{item.team_name}
						{isFirst && ' 👑'}
					</Text>
					<Text style={styles.statsText}>
						G:{item.played} V:{item.won} N:{item.drawn} P:{item.lost}
					</Text>
				</View>
				<View style={styles.pointsCell}>
					<Text style={[styles.pointsText, isFirst && styles.firstText]}>
						{item.points}
					</Text>
				</View>
			</View>
		);
	};

	// Render per torneo a gironi
	const renderGroupStandings = () => {
		const groups = selectedCompetition?.groups || [];

		if (groups.length === 0) {
			return (
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyText}>Gironi non ancora definiti</Text>
					<Text style={styles.emptySubText}>
						I gironi saranno disponibili dopo la configurazione
					</Text>
				</View>
			);
		}

		return (
			<ScrollView style={styles.groupsContainer}>
				{groups.map((group, groupIndex) => (
					<View key={groupIndex} style={styles.groupCard}>
						<Text style={styles.groupTitle}>{group.name || `Girone ${String.fromCharCode(65 + groupIndex)}`}</Text>
						<View style={styles.tableHeader}>
							<Text style={styles.headerText}>#</Text>
							<Text style={[styles.headerText, styles.headerTeam]}>Squadra</Text>
							<Text style={styles.headerText}>Pt</Text>
						</View>
						<FlatList
							data={group.standings || []}
							keyExtractor={(item, index) => `${groupIndex}-${item.team_name}-${index}`}
							renderItem={renderItem}
							scrollEnabled={false}
						/>
					</View>
				))}
			</ScrollView>
		);
	};

	// Render per torneo ad eliminazione diretta
	const renderKnockoutBracket = () => {
		const rounds = selectedCompetition?.knockout_rounds || [];

		if (rounds.length === 0) {
			return (
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyText}>Tabellone non ancora definito</Text>
					<Text style={styles.emptySubText}>
						Il tabellone ad eliminazione diretta sarà disponibile dopo la configurazione
					</Text>
				</View>
			);
		}

		const getRoundName = (roundIndex, totalRounds) => {
			const teamsInRound = Math.pow(2, totalRounds - roundIndex);
			switch (teamsInRound) {
				case 2: return 'Finale';
				case 4: return 'Semifinale';
				case 8: return 'Quarti di Finale';
				case 16: return 'Ottavi di Finale';
				case 32: return 'Sedicesimi di Finale';
				default: return `Turno ${roundIndex + 1}`;
			}
		};

		return (
			<ScrollView style={styles.knockoutContainer}>
				{rounds.map((round, roundIndex) => (
					<View key={roundIndex} style={styles.roundCard}>
						<Text style={styles.roundTitle}>{getRoundName(roundIndex, rounds.length)}</Text>
						{round.matches && round.matches.map((match, matchIndex) => (
							<View key={matchIndex} style={styles.knockoutMatch}>
								<View style={styles.knockoutTeam}>
									<Text style={styles.knockoutTeamName}>{match.home_team || 'TBD'}</Text>
									{match.home_score !== null && match.home_score !== undefined && (
										<Text style={styles.knockoutScore}>{match.home_score}</Text>
									)}
								</View>
								<Text style={styles.knockoutVs}>vs</Text>
								<View style={styles.knockoutTeam}>
									<Text style={styles.knockoutTeamName}>{match.away_team || 'TBD'}</Text>
									{match.away_score !== null && match.away_score !== undefined && (
										<Text style={styles.knockoutScore}>{match.away_score}</Text>
									)}
								</View>
							</View>
						))}
					</View>
				))}
			</ScrollView>
		);
	};

	if (!selectedLeague) {
		return (
			<View style={styles.container}>
				<View style={styles.header}>
					<Text style={styles.title}>Classifica</Text>
				</View>
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyText}>Nessuna lega selezionata</Text>
					<TouchableOpacity
						style={styles.emptyButton}
						onPress={() => navigation.navigate('Home')}
					>
						<Text style={styles.emptyButtonText}>Vai alla Home</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	}

	if (loading) {
		return (
			<View style={styles.container}>
				<View style={styles.header}>
					<Text style={styles.title}>Classifica</Text>
				</View>
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color={Colors.primary} />
					<Text style={styles.loadingText}>Caricamento...</Text>
				</View>
			</View>
		);
	}

	if (error) {
		return (
			<View style={styles.container}>
				<View style={styles.header}>
					<Text style={styles.title}>Classifica</Text>
				</View>
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyText}>{error}</Text>
					<TouchableOpacity
						style={styles.emptyButton}
						onPress={loadLeagueData}
					>
						<Text style={styles.emptyButtonText}>Riprova</Text>
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
					<Text style={styles.title}>Classifica</Text>
				</View>
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyText}>Nessuna competizione disponibile</Text>
					<Text style={styles.emptySubText}>
						Crea una competizione per visualizzare la classifica
					</Text>
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
				<Text style={styles.title}>Classifica</Text>
			</View>

			<View style={styles.competitionSelector}>
				<Text style={styles.label}>Seleziona Competizione</Text>
				<TouchableOpacity
					style={styles.dropdown}
					onPress={() => setShowCompetitionModal(true)}
				>
					<Text style={styles.dropdownText}>
						{selectedCompetition ? selectedCompetition.name : 'Seleziona...'}
					</Text>
					<Text style={styles.dropdownIcon}>▼</Text>
				</TouchableOpacity>
			</View>

			{selectedCompetition && (
				<View style={styles.contentContainer}>
					{/* Info tipo competizione */}
					<View style={styles.typeInfo}>
						<Text style={styles.typeLabel}>
							{getCompetitionTypeLabel(selectedCompetition.type)}
						</Text>
					</View>

					{/* Render basato sul tipo di competizione */}
					{isGroupTournament() ? (
						renderGroupStandings()
					) : isKnockoutTournament() ? (
						renderKnockoutBracket()
					) : standings.length > 0 ? (
						<View style={styles.tableContainer}>
							<View style={styles.tableHeader}>
								<Text style={styles.headerText}>#</Text>
								<Text style={[styles.headerText, styles.headerTeam]}>Squadra</Text>
								<Text style={styles.headerText}>Pt</Text>
							</View>

							<FlatList
								data={standings}
								keyExtractor={(item, index) => `${item.team_name}-${index}`}
								renderItem={renderItem}
							/>
						</View>
					) : (
						<View style={styles.emptyContainer}>
							<Text style={styles.emptyText}>Nessun dato in classifica</Text>
							<Text style={styles.emptySubText}>
								La classifica sarà disponibile dopo le prime partite
							</Text>
						</View>
					)}
				</View>
			)}

			{/* Competition Selection Modal */}
			<Modal
				visible={showCompetitionModal}
				transparent={true}
				animationType="slide"
				onRequestClose={() => setShowCompetitionModal(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>Seleziona Competizione</Text>
							<TouchableOpacity onPress={() => setShowCompetitionModal(false)}>
								<Text style={styles.modalClose}>✕</Text>
							</TouchableOpacity>
						</View>
						<ScrollView style={styles.modalScroll}>
							{competitions.map((comp, index) => (
								<TouchableOpacity
									key={index}
									style={[
										styles.modalOption,
										selectedCompetition?.name === comp.name && styles.modalOptionSelected
									]}
									onPress={() => {
										setSelectedCompetition(comp);
										setShowCompetitionModal(false);
									}}
								>
									<Text style={[
										styles.modalOptionText,
										selectedCompetition?.name === comp.name && styles.modalOptionTextSelected
									]}>
										{comp.name}
									</Text>
									{selectedCompetition?.name === comp.name && (
										<Text style={styles.checkmark}>✓</Text>
									)}
								</TouchableOpacity>
							))}
						</ScrollView>
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
	tableContainer: {
		flex: 1,
		backgroundColor: Colors.card,
		margin: 15,
		borderRadius: 12,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	tableHeader: {
		flexDirection: 'row',
		backgroundColor: Colors.gray100,
		padding: 16,
		borderTopLeftRadius: 12,
		borderTopRightRadius: 12,
		borderBottomWidth: 2,
		borderBottomColor: Colors.gray300,
	},
	headerText: {
		fontSize: 14,
		fontWeight: '600',
		color: Colors.textSecondary,
		width: 50,
		textAlign: 'center',
	},
	headerTeam: {
		flex: 1,
		textAlign: 'left',
		marginLeft: 10,
	},
	row: {
		flexDirection: 'row',
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: Colors.gray100,
		alignItems: 'center',
	},
	firstRow: {
		backgroundColor: '#FFFBEF',
	},
	positionCell: {
		width: 50,
		alignItems: 'center',
	},
	positionText: {
		fontSize: 16,
		fontWeight: '600',
		color: Colors.textSecondary,
	},
	firstText: {
		color: Colors.highlight,
		fontWeight: 'bold',
	},
	teamCell: {
		flex: 1,
		marginLeft: 10,
	},
	teamText: {
		fontSize: 16,
		fontWeight: '600',
		color: Colors.text,
		marginBottom: 4,
	},
	statsText: {
		fontSize: 12,
		color: Colors.textLight,
	},
	pointsCell: {
		width: 50,
		alignItems: 'center',
	},
	pointsText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: Colors.text,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		marginTop: 16,
		fontSize: 16,
		color: Colors.textSecondary,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 40,
	},
	emptyText: {
		fontSize: 18,
		fontWeight: '600',
		color: Colors.textSecondary,
		textAlign: 'center',
		marginBottom: 8,
	},
	emptySubText: {
		fontSize: 14,
		color: Colors.textLight,
		textAlign: 'center',
		marginBottom: 20,
	},
	emptyButton: {
		backgroundColor: Colors.primary,
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 8,
	},
	emptyButtonText: {
		color: Colors.card,
		fontSize: 16,
		fontWeight: '600',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'flex-end',
	},
	modalContent: {
		backgroundColor: Colors.card,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		paddingBottom: 40,
		maxHeight: '70%',
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
	modalScroll: {
		paddingHorizontal: 20,
	},
	modalOption: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: Colors.gray100,
	},
	modalOptionSelected: {
		backgroundColor: Colors.gray50,
	},
	modalOptionText: {
		fontSize: 16,
		color: Colors.text,
	},
	modalOptionTextSelected: {
		color: Colors.primary,
		fontWeight: '600',
	},
	checkmark: {
		fontSize: 20,
		color: Colors.primary,
		fontWeight: 'bold',
	},
	contentContainer: {
		flex: 1,
	},
	typeInfo: {
		backgroundColor: Colors.card,
		padding: 12,
		borderBottomWidth: 1,
		borderBottomColor: Colors.gray300,
		alignItems: 'center',
	},
	typeLabel: {
		fontSize: 14,
		fontWeight: '600',
		color: Colors.primary,
	},
	groupsContainer: {
		flex: 1,
		padding: 15,
	},
	groupCard: {
		backgroundColor: Colors.card,
		borderRadius: 12,
		marginBottom: 15,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	groupTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: Colors.text,
		padding: 16,
		borderBottomWidth: 2,
		borderBottomColor: Colors.gray300,
	},
	knockoutContainer: {
		flex: 1,
		padding: 15,
	},
	roundCard: {
		backgroundColor: Colors.card,
		borderRadius: 12,
		marginBottom: 20,
		padding: 16,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	roundTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: Colors.text,
		marginBottom: 16,
		textAlign: 'center',
	},
	knockoutMatch: {
		backgroundColor: Colors.gray50,
		borderRadius: 8,
		padding: 12,
		marginBottom: 12,
	},
	knockoutTeam: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 8,
	},
	knockoutTeamName: {
		fontSize: 16,
		color: Colors.text,
		fontWeight: '500',
		flex: 1,
	},
	knockoutScore: {
		fontSize: 18,
		fontWeight: 'bold',
		color: Colors.primary,
		marginLeft: 12,
		minWidth: 30,
		textAlign: 'center',
	},
	knockoutVs: {
		fontSize: 12,
		color: Colors.textSecondary,
		textAlign: 'center',
		paddingVertical: 4,
	},
});
