import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	StyleSheet,
	TouchableOpacity,
	ScrollView,
	Alert,
	ActivityIndicator,
	Switch,
} from 'react-native';
import api from '../services/api';
import { API_ENDPOINTS } from '../config/api';
import { Colors } from '../config/theme';
import { useAuth } from '../context/AuthContext';
import { useLeague } from '../context/LeagueContext';

export default function CreateLeagueScreen({ navigation }) {
	const { user } = useAuth();
	const { selectedLeague } = useLeague();
	const [leagueName, setLeagueName] = useState('');
	const [managerName, setManagerName] = useState('');
	const [teamName, setTeamName] = useState('');
	const [startDay, setStartDay] = useState('1');
	const [initialCredits, setInitialCredits] = useState('500');
	const [isPublic, setIsPublic] = useState(false);
	const [loading, setLoading] = useState(false);

	const handleCreateLeague = async () => {
		if (!leagueName || !managerName || !teamName) {
			Alert.alert('Errore', 'Compila tutti i campi obbligatori');
			return;
		}

		const startDayNum = parseInt(startDay);
		const creditsNum = parseInt(initialCredits);

		if (isNaN(startDayNum) || startDayNum < 1 || startDayNum > 38) {
			Alert.alert('Errore', 'La giornata di inizio deve essere tra 1 e 38');
			return;
		}

		if (isNaN(creditsNum) || creditsNum < 0) {
			Alert.alert('Errore', 'I crediti iniziali devono essere un numero positivo');
			return;
		}

		setLoading(true);
		try {
			// Controlla se esiste già una lega con lo stesso nome
			const existingLeagues = await api.get(API_ENDPOINTS.LEAGUES);
			const duplicateLeague = existingLeagues.data.find(
				league => league.name.toLowerCase() === leagueName.trim().toLowerCase()
			);

			if (duplicateLeague) {
				Alert.alert('Errore', 'Esiste già una lega con questo nome. Scegli un nome diverso.');
				setLoading(false);
				return;
			}

			const response = await api.post(API_ENDPOINTS.LEAGUES, {
				name: leagueName,
				is_public: isPublic,
				teams: [
					{
						name: teamName,
						owner: user.id, // Use user ID instead of manager name
						roster: [],
					},
				],
				competitions: [],
				settings: {
					start_day: startDayNum,
					max_budget: creditsNum,
					max_players_per_role: {
						P: 3,
						D: 8,
						C: 8,
						A: 6,
					},
					bench_limits: {
						P: 1,
						D: 3,
						C: 3,
						A: 3,
					},
				},
			});

			const inviteCode = response.data.invite_code;

			Alert.alert(
				'Successo',
				`Lega creata con successo!\n\nCodice invito: ${inviteCode}\n\nCondividi questo codice con altri utenti per permettere loro di unirsi alla tua lega.`,
				[{
					text: 'OK', onPress: () => {
						navigation.navigate('LeaguesList', { refresh: Date.now() });
					}
				}]
			);
		} catch (error) {
			Alert.alert('Errore', error.response?.data?.detail || 'Impossibile creare la lega');
		} finally {
			setLoading(false);
		}
	};

	return (
		<ScrollView style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.title}>Crea Nuova Lega</Text>
				<Text style={styles.subtitle}>Inserisci i dettagli della tua lega</Text>
			</View>

			<View style={styles.form}>
				<View style={styles.inputGroup}>
					<Text style={styles.label}>Nome Lega *</Text>
					<TextInput
						style={styles.input}
						placeholder="Es. Lega degli Amici"
						value={leagueName}
						onChangeText={setLeagueName}
					/>
				</View>

				<View style={styles.inputGroup}>
					<Text style={styles.label}>Nome Fantallenatore *</Text>
					<TextInput
						style={styles.input}
						placeholder="Il tuo nome"
						value={managerName}
						onChangeText={setManagerName}
					/>
				</View>

				<View style={styles.inputGroup}>
					<Text style={styles.label}>Nome Squadra *</Text>
					<TextInput
						style={styles.input}
						placeholder="Nome della tua squadra"
						value={teamName}
						onChangeText={setTeamName}
					/>
				</View>

				<View style={styles.inputGroup}>
					<Text style={styles.label}>Giornata di Inizio</Text>
					<TextInput
						style={styles.input}
						placeholder="1"
						value={startDay}
						onChangeText={setStartDay}
						keyboardType="numeric"
					/>
				</View>

				<View style={styles.inputGroup}>
					<Text style={styles.label}>Crediti Iniziali per Squadra</Text>
					<TextInput
						style={styles.input}
						placeholder="500"
						value={initialCredits}
						onChangeText={setInitialCredits}
						keyboardType="numeric"
					/>
				</View>

				<View style={styles.switchGroup}>
					<View style={styles.switchLabel}>
						<Text style={styles.label}>Lega Pubblica</Text>
						<Text style={styles.switchDescription}>
							Se attivato, la lega sarà visibile nella lista delle leghe pubbliche
						</Text>
					</View>
					<Switch
						value={isPublic}
						onValueChange={setIsPublic}
						trackColor={{ false: Colors.gray300, true: Colors.primary + '80' }}
						thumbColor={isPublic ? Colors.primary : Colors.gray100}
					/>
				</View>

				<TouchableOpacity
					style={[styles.button, loading && styles.buttonDisabled]}
					onPress={handleCreateLeague}
					disabled={loading}
				>
					{loading ? (
						<ActivityIndicator color={Colors.white} />
					) : (
						<Text style={styles.buttonText}>Crea Lega</Text>
					)}
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.cancelButton}
					onPress={() => {
						if (selectedLeague) {
							navigation.navigate('MainTabs');
						} else {
							navigation.navigate('MainTabs');
						}
					}}
				>
					<Text style={styles.cancelButtonText}>Annulla</Text>
				</TouchableOpacity>
			</View>
		</ScrollView>
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
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		color: Colors.text,
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 14,
		color: Colors.textSecondary,
	},
	form: {
		padding: 20,
	},
	inputGroup: {
		marginBottom: 20,
	},
	switchGroup: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 20,
		backgroundColor: Colors.white,
		padding: 15,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: Colors.gray300,
	},
	switchLabel: {
		flex: 1,
		marginRight: 10,
	},
	switchDescription: {
		fontSize: 12,
		color: Colors.textSecondary,
		marginTop: 4,
	},
	label: {
		fontSize: 16,
		fontWeight: '600',
		color: Colors.text,
		marginBottom: 8,
	},
	input: {
		backgroundColor: Colors.white,
		padding: 15,
		borderRadius: 8,
		fontSize: 16,
		borderWidth: 1,
		borderColor: Colors.gray300,
	},
	button: {
		backgroundColor: Colors.success,
		padding: 16,
		borderRadius: 8,
		alignItems: 'center',
		marginTop: 10,
	},
	buttonDisabled: {
		backgroundColor: Colors.textLight,
	},
	buttonText: {
		color: Colors.white,
		fontSize: 16,
		fontWeight: '600',
	},
	cancelButton: {
		padding: 16,
		alignItems: 'center',
		marginTop: 10,
	},
	cancelButtonText: {
		color: Colors.textSecondary,
		fontSize: 16,
	},
});
