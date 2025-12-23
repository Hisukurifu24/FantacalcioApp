import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	Alert,
	ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../config/theme';
import { deleteCompetition } from '../services/api';

const COMPETITION_TYPE_LABELS = {
	POINTS: 'Somma Punti',
	CHAMPIONSHIP: 'Campionato',
	GROUP_TOURNAMENT: 'Coppa con Gruppi',
	KNOCKOUT_TOURNAMENT: 'Coppa Eliminazione Diretta',
	FORMULA1: 'Formula 1',
};

export default function CompetitionDetailScreen({ route, navigation }) {
	const { league, competition, competitionIndex, onCompetitionUpdated, isAdmin } = route.params;
	const [loading, setLoading] = useState(false);

	const handleDelete = async () => {
		Alert.alert(
			'Elimina Competizione',
			`Sei sicuro di voler eliminare "${competition.name}"? Questa azione non può essere annullata.`,
			[
				{
					text: 'Annulla',
					style: 'cancel',
				},
				{
					text: 'Elimina',
					style: 'destructive',
					onPress: async () => {
						try {
							setLoading(true);
							await deleteCompetition(league.id, competitionIndex);
							Alert.alert('Successo', 'Competizione eliminata con successo');
							if (onCompetitionUpdated) {
								onCompetitionUpdated();
							}
							navigation.goBack();
						} catch (error) {
							Alert.alert('Errore', 'Impossibile eliminare la competizione. Riprova.');
							console.error('Error deleting competition:', error);
						} finally {
							setLoading(false);
						}
					},
				},
			],
		);
	};

	const getCompetitionInfo = () => {
		const info = [
			{ label: 'Tipo', value: COMPETITION_TYPE_LABELS[competition.type] || competition.type },
			{ label: 'Partecipanti', value: `${competition.participants?.length || 0} squadre` },
		];

		if (competition.settings) {
			const { settings } = competition;

			if (settings.start_day && settings.end_day) {
				info.push({
					label: 'Giornate',
					value: `${settings.start_day} - ${settings.end_day}`
				});
			}

			// Championship specific
			if (competition.type === 'CHAMPIONSHIP' && settings.calendar_type) {
				const calendarLabels = {
					standard: 'Standard all\'italiana',
					asymmetric: 'Asimmetrico',
					mirror: 'A specchio',
				};
				info.push({
					label: 'Tipo Calendario',
					value: calendarLabels[settings.calendar_type] || settings.calendar_type
				});
			}

			// Group tournament specific
			if (competition.type === 'GROUP_TOURNAMENT') {
				if (settings.num_groups) {
					info.push({ label: 'Numero Gruppi', value: settings.num_groups.toString() });
				}
				if (settings.teams_per_group) {
					info.push({ label: 'Squadre per Gruppo', value: settings.teams_per_group.toString() });
				}
				if (settings.knockout_home_away !== undefined) {
					info.push({
						label: 'Eliminatoria A/R',
						value: settings.knockout_home_away ? 'Sì' : 'No'
					});
				}
				if (settings.final_home_away !== undefined) {
					info.push({
						label: 'Finale A/R',
						value: settings.final_home_away ? 'Sì' : 'No'
					});
				}
			}

			// Knockout tournament specific
			if (competition.type === 'KNOCKOUT_TOURNAMENT') {
				if (settings.rounds_home_away !== undefined) {
					info.push({
						label: 'Turni A/R',
						value: settings.rounds_home_away ? 'Sì' : 'No'
					});
				}
				if (settings.final_home_away !== undefined) {
					info.push({
						label: 'Finale A/R',
						value: settings.final_home_away ? 'Sì' : 'No'
					});
				}
			}
		}

		return info;
	};

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<Text style={styles.backButton}>← Indietro</Text>
				</TouchableOpacity>
				<Text style={styles.title}>{competition.name}</Text>
			</View>

			<ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
				{/* Competition Info */}
				<View style={styles.card}>
					<Text style={styles.cardTitle}>Informazioni Competizione</Text>
					{getCompetitionInfo().map((item, index) => (
						<View key={index} style={styles.infoRow}>
							<Text style={styles.infoLabel}>{item.label}</Text>
							<Text style={styles.infoValue}>{item.value}</Text>
						</View>
					))}
				</View>

				{/* Participants */}
				<View style={styles.card}>
					<Text style={styles.cardTitle}>Partecipanti</Text>
					{competition.participants?.map((participant, index) => (
						<View key={index} style={styles.participantRow}>
							<View style={styles.participantNumber}>
								<Text style={styles.participantNumberText}>{index + 1}</Text>
							</View>
							<Text style={styles.participantName}>{participant.name}</Text>
						</View>
					))}
					{(!competition.participants || competition.participants.length === 0) && (
						<Text style={styles.emptyText}>Nessun partecipante</Text>
					)}
				</View>

				{/* Standings */}
				<View style={styles.card}>
					<Text style={styles.cardTitle}>Classifica</Text>
					{competition.standings && competition.standings.length > 0 ? (
						<>
							<View style={styles.standingsHeader}>
								<Text style={[styles.standingsHeaderText, { flex: 2 }]}>Squadra</Text>
								<Text style={styles.standingsHeaderText}>G</Text>
								<Text style={styles.standingsHeaderText}>V</Text>
								<Text style={styles.standingsHeaderText}>N</Text>
								<Text style={styles.standingsHeaderText}>P</Text>
								<Text style={styles.standingsHeaderText}>PT</Text>
							</View>
							{competition.standings
								.sort((a, b) => b.points - a.points || (b.goal_difference - a.goal_difference))
								.map((standing, index) => (
									<View key={index} style={styles.standingsRow}>
										<Text style={[styles.standingsPosition, { marginRight: 8 }]}>{index + 1}</Text>
										<Text style={[styles.standingsText, { flex: 2 }]} numberOfLines={1}>{standing.team_name}</Text>
										<Text style={styles.standingsText}>{standing.played}</Text>
										<Text style={styles.standingsText}>{standing.won}</Text>
										<Text style={styles.standingsText}>{standing.drawn}</Text>
										<Text style={styles.standingsText}>{standing.lost}</Text>
										<Text style={[styles.standingsText, styles.standingsPoints]}>{standing.points}</Text>
									</View>
								))}
						</>
					) : (
						<View style={styles.placeholder}>
							<Ionicons name="bar-chart" size={48} color={Colors.gray500} />
							<Text style={styles.placeholderSubtext}>
								La classifica verrà calcolata automaticamente
							</Text>
						</View>
					)}
				</View>

				{/* Calendar */}
				<View style={styles.card}>
					<Text style={styles.cardTitle}>Calendario</Text>
					{competition.calendar && competition.calendar.length > 0 ? (
						<>
							<Text style={styles.calendarInfo}>
								{competition.calendar.length} partite programmate
							</Text>
							{competition.calendar.slice(0, 5).map((match, index) => (
								<View key={index} style={styles.matchRow}>
									<Text style={styles.matchDay}>G{match.day}</Text>
									<View style={styles.matchTeams}>
										<Text style={styles.matchTeam}>{match.home_team}</Text>
										<Text style={styles.matchVs}>vs</Text>
										<Text style={styles.matchTeam}>{match.away_team}</Text>
									</View>
									{match.played && match.home_score !== null && (
										<Text style={styles.matchScore}>
											{match.home_score} - {match.away_score}
										</Text>
									)}
								</View>
							))}
							{competition.calendar.length > 5 && (
								<Text style={styles.calendarMore}>
									+{competition.calendar.length - 5} altre partite
								</Text>
							)}
						</>
					) : (
						<View style={styles.placeholder}>
							<Ionicons name="calendar" size={48} color={Colors.gray500} />
							<Text style={styles.placeholderSubtext}>
								Il calendario verrà generato automaticamente
							</Text>
						</View>
					)}
				</View>
			</ScrollView>

			{isAdmin && (
				<TouchableOpacity
					style={styles.deleteButton}
					onPress={handleDelete}
					disabled={loading}
				>
					{loading ? (
						<ActivityIndicator color={Colors.white} />
					) : (
						<Text style={styles.deleteButtonText}>Elimina Competizione</Text>
					)}
				</TouchableOpacity>
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
	content: {
		flex: 1,
	},
	scrollContent: {
		padding: 16,
		paddingBottom: 100,
	},
	card: {
		backgroundColor: Colors.card,
		borderRadius: 12,
		padding: 16,
		marginBottom: 16,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	cardTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: Colors.text,
		marginBottom: 16,
	},
	infoRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 8,
		borderBottomWidth: 1,
		borderBottomColor: Colors.gray200,
	},
	infoLabel: {
		fontSize: 14,
		color: Colors.textSecondary,
	},
	infoValue: {
		fontSize: 14,
		fontWeight: '500',
		color: Colors.text,
	},
	participantRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 8,
	},
	participantNumber: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: Colors.primary,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 12,
	},
	participantNumberText: {
		color: Colors.white,
		fontSize: 14,
		fontWeight: 'bold',
	},
	participantName: {
		fontSize: 16,
		color: Colors.text,
	},
	emptyText: {
		fontSize: 14,
		color: Colors.textSecondary,
		textAlign: 'center',
		paddingVertical: 20,
	},
	placeholder: {
		alignItems: 'center',
		paddingVertical: 40,
		gap: 8,
	},
	placeholderSubtext: {
		fontSize: 14,
		color: Colors.textSecondary,
		textAlign: 'center',
	},
	standingsHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 8,
		borderBottomWidth: 2,
		borderBottomColor: Colors.primary,
		marginBottom: 8,
	},
	standingsHeaderText: {
		fontSize: 12,
		fontWeight: '600',
		color: Colors.textSecondary,
		textAlign: 'center',
		width: 35,
	},
	standingsRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: Colors.gray200,
	},
	standingsPosition: {
		fontSize: 14,
		fontWeight: 'bold',
		color: Colors.primary,
		width: 25,
		textAlign: 'center',
	},
	standingsText: {
		fontSize: 13,
		color: Colors.text,
		textAlign: 'center',
		width: 35,
	},
	standingsPoints: {
		fontWeight: 'bold',
		color: Colors.primary,
	},
	calendarInfo: {
		fontSize: 13,
		color: Colors.textSecondary,
		marginBottom: 12,
	},
	matchRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: Colors.gray200,
	},
	matchDay: {
		fontSize: 12,
		fontWeight: '600',
		color: Colors.primary,
		width: 30,
	},
	matchTeams: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginHorizontal: 12,
	},
	matchTeam: {
		fontSize: 13,
		color: Colors.text,
		flex: 1,
	},
	matchVs: {
		fontSize: 11,
		color: Colors.textSecondary,
		marginHorizontal: 8,
	},
	matchScore: {
		fontSize: 13,
		fontWeight: '600',
		color: Colors.text,
		width: 50,
		textAlign: 'center',
	},
	calendarMore: {
		fontSize: 12,
		color: Colors.primary,
		textAlign: 'center',
		marginTop: 8,
	},
	deleteButton: {
		backgroundColor: Colors.error,
		marginHorizontal: 16,
		marginVertical: 16,
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 8,
		alignItems: 'center',
		alignSelf: 'center',
		position: 'absolute',
		bottom: 0,
	},
	deleteButtonText: {
		color: Colors.white,
		fontSize: 15,
		fontWeight: '600',
	},
});
