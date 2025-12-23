import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	ScrollView,
	Alert,
	ActivityIndicator,
	Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../config/theme';
import { createCompetition } from '../services/api';
import { useAuth } from '../context/AuthContext';

const COMPETITION_TYPES = [
	{ value: 'POINTS', label: 'Somma Punti' },
	{ value: 'CHAMPIONSHIP', label: 'Campionato' },
	{ value: 'GROUP_TOURNAMENT', label: 'Coppa con Gruppi' },
	{ value: 'KNOCKOUT_TOURNAMENT', label: 'Coppa Eliminazione Diretta' },
	{ value: 'FORMULA1', label: 'Formula 1' },
];

const CALENDAR_TYPES = [
	{ value: 'standard', label: 'Standard all\'italiana' },
	{ value: 'asymmetric', label: 'Asimmetrico' },
	{ value: 'mirror', label: 'A specchio' },
];

export default function CreateCompetitionScreen({ route, navigation }) {
	const { league, onCompetitionCreated } = route.params;
	const { user } = useAuth();

	// Check if user is authorized (creator or team owner)
	const isAuthorized =
		league.created_by === user?.id ||
		league.teams?.some(team => team.owner === user?.username) ||
		league.teams?.some(team => team.owner === user?.id);

	const [name, setName] = useState('');
	const [type, setType] = useState('POINTS');
	const [selectedParticipants, setSelectedParticipants] = useState([]);
	const [startDay, setStartDay] = useState('1');
	const [endDay, setEndDay] = useState('38');
	const [loading, setLoading] = useState(false);

	// Championship settings
	const [calendarType, setCalendarType] = useState('standard');

	// Group tournament settings
	const [numGroups, setNumGroups] = useState('2');
	const [teamsPerGroup, setTeamsPerGroup] = useState('2');
	const [matchesPerTeam, setMatchesPerTeam] = useState('2');
	const [knockoutHomeAway, setKnockoutHomeAway] = useState(true);
	const [finalHomeAway, setFinalHomeAway] = useState(false);
	const [randomGroups, setRandomGroups] = useState(true);

	// Knockout tournament settings
	const [roundsHomeAway, setRoundsHomeAway] = useState(true);
	const [finalKnockoutHomeAway, setFinalKnockoutHomeAway] = useState(false);
	const [randomBrackets, setRandomBrackets] = useState(true);

	useEffect(() => {
		// Check authorization
		if (!isAuthorized) {
			Alert.alert(
				'Accesso Negato',
				'Solo il creatore della lega o i proprietari di un team possono creare competizioni.',
				[{ text: 'OK', onPress: () => navigation.goBack() }]
			);
			return;
		}

		// Select all teams by default
		if (league.teams) {
			setSelectedParticipants(league.teams.map((_, index) => index));
		}
	}, []);

	const toggleParticipant = (index) => {
		if (selectedParticipants.includes(index)) {
			setSelectedParticipants(selectedParticipants.filter(i => i !== index));
		} else {
			setSelectedParticipants([...selectedParticipants, index]);
		}
	};

	const handleCreate = async () => {
		if (!name.trim()) {
			Alert.alert('Errore', 'Inserisci un nome per la competizione');
			return;
		}

		if (selectedParticipants.length < 2) {
			Alert.alert('Errore', 'Seleziona almeno 2 partecipanti');
			return;
		}

		// Validation for knockout tournament (must be power of 2)
		if (type === 'KNOCKOUT_TOURNAMENT') {
			const count = selectedParticipants.length;
			if ((count & (count - 1)) !== 0) {
				Alert.alert('Errore', 'Per una coppa ad eliminazione diretta serve un numero di squadre che sia potenza di 2 (2, 4, 8, 16, ...)');
				return;
			}
		}

		const start = parseInt(startDay);
		const end = parseInt(endDay);

		if (isNaN(start) || isNaN(end) || start < 1 || end > 38 || start > end) {
			Alert.alert('Errore', 'Giornate non valide');
			return;
		}

		const participants = selectedParticipants.map(index => league.teams[index]);

		const settings = {
			start_day: start,
			end_day: end,
		};

		// Add type-specific settings
		if (type === 'CHAMPIONSHIP') {
			settings.calendar_type = calendarType;
		} else if (type === 'GROUP_TOURNAMENT') {
			settings.num_groups = parseInt(numGroups);
			settings.teams_per_group = parseInt(teamsPerGroup);
			settings.matches_per_team = parseInt(matchesPerTeam);
			settings.knockout_home_away = knockoutHomeAway;
			settings.final_home_away = finalHomeAway;
			settings.random_groups = randomGroups;
			settings.calendar_type = calendarType;
		} else if (type === 'KNOCKOUT_TOURNAMENT') {
			settings.rounds_home_away = roundsHomeAway;
			settings.final_home_away = finalKnockoutHomeAway;
			settings.random_brackets = randomBrackets;
		}

		const competitionData = {
			name: name.trim(),
			type,
			participants,
			settings,
		};

		try {
			setLoading(true);
			await createCompetition(league.id, competitionData);
			Alert.alert('Successo', 'Competizione creata con successo');
			if (onCompetitionCreated) {
				onCompetitionCreated();
			}
			navigation.goBack();
		} catch (error) {
			console.error('Error creating competition:', error);
			const errorDetail = error.response?.data?.detail;
			if (error.response?.status === 403) {
				Alert.alert('Accesso Negato', 'Non hai i permessi per creare una competizione in questa lega');
			} else if (errorDetail) {
				Alert.alert('Errore', errorDetail);
			} else {
				Alert.alert('Errore', 'Impossibile creare la competizione');
			}
		} finally {
			setLoading(false);
		}
	};

	const renderTypeSpecificSettings = () => {
		switch (type) {
			case 'CHAMPIONSHIP':
				return (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Tipo di Calendario</Text>
						{CALENDAR_TYPES.map((cal) => (
							<TouchableOpacity
								key={cal.value}
								style={styles.radioOption}
								onPress={() => setCalendarType(cal.value)}
							>
								<View style={styles.radio}>
									{calendarType === cal.value && <View style={styles.radioInner} />}
								</View>
								<Text style={styles.radioLabel}>{cal.label}</Text>
							</TouchableOpacity>
						))}
					</View>
				);

			case 'GROUP_TOURNAMENT':
				return (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Impostazioni Gironi</Text>

						<Text style={styles.label}>Numero di Gruppi</Text>
						<TextInput
							style={styles.input}
							value={numGroups}
							onChangeText={setNumGroups}
							keyboardType="number-pad"
							placeholder="Es. 2"
						/>

						<Text style={styles.label}>Squadre che passano per gruppo</Text>
						<TextInput
							style={styles.input}
							value={teamsPerGroup}
							onChangeText={setTeamsPerGroup}
							keyboardType="number-pad"
							placeholder="Es. 2"
						/>

						<Text style={styles.label}>Scontri tra ogni squadra</Text>
						<TextInput
							style={styles.input}
							value={matchesPerTeam}
							onChangeText={setMatchesPerTeam}
							keyboardType="number-pad"
							placeholder="Es. 2"
						/>

						<View style={styles.switchRow}>
							<Text style={styles.label}>Fase eliminatoria andata e ritorno</Text>
							<Switch
								value={knockoutHomeAway}
								onValueChange={setKnockoutHomeAway}
								trackColor={{ false: Colors.gray300, true: Colors.primary }}
							/>
						</View>

						<View style={styles.switchRow}>
							<Text style={styles.label}>Finale andata e ritorno</Text>
							<Switch
								value={finalHomeAway}
								onValueChange={setFinalHomeAway}
								trackColor={{ false: Colors.gray300, true: Colors.primary }}
							/>
						</View>

						<View style={styles.switchRow}>
							<Text style={styles.label}>Gruppi casuali</Text>
							<Switch
								value={randomGroups}
								onValueChange={setRandomGroups}
								trackColor={{ false: Colors.gray300, true: Colors.primary }}
							/>
						</View>

						<Text style={styles.sectionTitle}>Tipo di Calendario (Gironi)</Text>
						{CALENDAR_TYPES.map((cal) => (
							<TouchableOpacity
								key={cal.value}
								style={styles.radioOption}
								onPress={() => setCalendarType(cal.value)}
							>
								<View style={styles.radio}>
									{calendarType === cal.value && <View style={styles.radioInner} />}
								</View>
								<Text style={styles.radioLabel}>{cal.label}</Text>
							</TouchableOpacity>
						))}
					</View>
				);

			case 'KNOCKOUT_TOURNAMENT':
				return (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Impostazioni Eliminazione Diretta</Text>

						<View style={styles.switchRow}>
							<Text style={styles.label}>Turni andata e ritorno</Text>
							<Switch
								value={roundsHomeAway}
								onValueChange={setRoundsHomeAway}
								trackColor={{ false: Colors.gray300, true: Colors.primary }}
							/>
						</View>

						<View style={styles.switchRow}>
							<Text style={styles.label}>Finale andata e ritorno</Text>
							<Switch
								value={finalKnockoutHomeAway}
								onValueChange={setFinalKnockoutHomeAway}
								trackColor={{ false: Colors.gray300, true: Colors.primary }}
							/>
						</View>

						<View style={styles.switchRow}>
							<Text style={styles.label}>Turni casuali</Text>
							<Switch
								value={randomBrackets}
								onValueChange={setRandomBrackets}
								trackColor={{ false: Colors.gray300, true: Colors.primary }}
							/>
						</View>
					</View>
				);

			default:
				return null;
		}
	};

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<Text style={styles.backButton}>← Annulla</Text>
				</TouchableOpacity>
				<Text style={styles.title}>Nuova Competizione</Text>
			</View>

			<ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
				<View style={styles.section}>
					<Text style={styles.label}>Nome Competizione *</Text>
					<TextInput
						style={styles.input}
						value={name}
						onChangeText={setName}
						placeholder="Es. Campionato Principale"
						placeholderTextColor={Colors.textLight}
					/>
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Tipo di Competizione *</Text>
					{COMPETITION_TYPES.map((compType) => (
						<TouchableOpacity
							key={compType.value}
							style={styles.radioOption}
							onPress={() => setType(compType.value)}
						>
							<View style={styles.radio}>
								{type === compType.value && <View style={styles.radioInner} />}
							</View>
							<Text style={styles.radioLabel}>{compType.label}</Text>
						</TouchableOpacity>
					))}
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>
						Partecipanti * ({selectedParticipants.length} selezionati)
					</Text>
					{league.teams?.map((team, index) => (
						<TouchableOpacity
							key={index}
							style={styles.checkboxOption}
							onPress={() => toggleParticipant(index)}
						>
							<View style={styles.checkbox}>
								{selectedParticipants.includes(index) && (
									<Ionicons name="checkmark" size={18} color={Colors.primary} />
								)}
							</View>
							<Text style={styles.checkboxLabel}>{team.name}</Text>
						</TouchableOpacity>
					))}
				</View>

				{renderTypeSpecificSettings()}

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Giornate</Text>
					<View style={styles.row}>
						<View style={styles.halfInput}>
							<Text style={styles.label}>Inizio</Text>
							<TextInput
								style={styles.input}
								value={startDay}
								onChangeText={setStartDay}
								keyboardType="number-pad"
								placeholder="1"
							/>
						</View>
						<View style={styles.halfInput}>
							<Text style={styles.label}>Fine</Text>
							<TextInput
								style={styles.input}
								value={endDay}
								onChangeText={setEndDay}
								keyboardType="number-pad"
								placeholder="38"
							/>
						</View>
					</View>
				</View>
			</ScrollView>

			<TouchableOpacity
				style={[styles.createButton, loading && styles.createButtonDisabled]}
				onPress={handleCreate}
				disabled={loading}
			>
				{loading ? (
					<ActivityIndicator color={Colors.white} />
				) : (
					<Text style={styles.createButtonText}>Crea Competizione</Text>
				)}
			</TouchableOpacity>
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
	section: {
		marginBottom: 24,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: Colors.text,
		marginBottom: 12,
	},
	label: {
		fontSize: 14,
		fontWeight: '500',
		color: Colors.text,
		marginBottom: 8,
	},
	input: {
		backgroundColor: Colors.card,
		borderWidth: 1,
		borderColor: Colors.gray300,
		borderRadius: 8,
		padding: 12,
		fontSize: 16,
		color: Colors.text,
	},
	radioOption: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
	},
	radio: {
		width: 24,
		height: 24,
		borderRadius: 12,
		borderWidth: 2,
		borderColor: Colors.primary,
		marginRight: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
	radioInner: {
		width: 12,
		height: 12,
		borderRadius: 6,
		backgroundColor: Colors.primary,
	},
	radioLabel: {
		fontSize: 16,
		color: Colors.text,
	},
	checkboxOption: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
	},
	checkbox: {
		width: 24,
		height: 24,
		borderRadius: 4,
		borderWidth: 2,
		borderColor: Colors.primary,
		marginRight: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
	checkboxLabel: {
		fontSize: 16,
		color: Colors.text,
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	halfInput: {
		flex: 1,
		marginHorizontal: 4,
	},
	switchRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 8,
	},
	createButton: {
		backgroundColor: Colors.success,
		margin: 16,
		padding: 16,
		borderRadius: 8,
		alignItems: 'center',
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
	},
	createButtonDisabled: {
		opacity: 0.6,
	},
	createButtonText: {
		color: Colors.white,
		fontSize: 16,
		fontWeight: '600',
	},
});
