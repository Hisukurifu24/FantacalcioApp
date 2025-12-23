import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Alert,
	ActivityIndicator,
	TextInput,
	ScrollView,
	Clipboard,
	Share,
} from 'react-native';
import { Colors } from '../config/theme';
import { useLeague } from '../context/LeagueContext';
import api from '../services/api';
import { API_ENDPOINTS } from '../config/api';

export default function LeagueSettingsScreen({ route, navigation }) {
	const { league } = route.params;
	const { clearLeague } = useLeague();
	const [deleting, setDeleting] = useState(false);
	const [editing, setEditing] = useState(false);
	const [saving, setSaving] = useState(false);

	// Stati per le impostazioni generali
	const [leagueName, setLeagueName] = useState(league.name || '');
	const [startDay, setStartDay] = useState(
		league.settings?.start_day?.toString() || '1'
	);
	const [maxBudget, setMaxBudget] = useState(
		league.settings?.max_budget?.toString() || '500'
	);

	// Stati per i limiti dei giocatori
	const [maxPortieri, setMaxPortieri] = useState(
		league.settings?.max_players_per_role?.P?.toString() || '3'
	);
	const [maxDifensori, setMaxDifensori] = useState(
		league.settings?.max_players_per_role?.D?.toString() || '8'
	);
	const [maxCentrocampisti, setMaxCentrocampisti] = useState(
		league.settings?.max_players_per_role?.C?.toString() || '8'
	);
	const [maxAttaccanti, setMaxAttaccanti] = useState(
		league.settings?.max_players_per_role?.A?.toString() || '6'
	);

	// Stati per i limiti della panchina
	const [benchPortieri, setBenchPortieri] = useState(
		league.settings?.bench_limits?.P?.toString() || '1'
	);
	const [benchDifensori, setBenchDifensori] = useState(
		league.settings?.bench_limits?.D?.toString() || '3'
	);
	const [benchCentrocampisti, setBenchCentrocampisti] = useState(
		league.settings?.bench_limits?.C?.toString() || '3'
	);
	const [benchAttaccanti, setBenchAttaccanti] = useState(
		league.settings?.bench_limits?.A?.toString() || '3'
	);

	const handleInviteParticipants = () => {
		const inviteCode = league.invite_code;

		if (!inviteCode) {
			Alert.alert('Errore', 'Codice invito non disponibile');
			return;
		}

		Alert.alert(
			'Invita Partecipanti',
			`Codice Invito: ${inviteCode}\n\nCondividi questo codice con altri utenti per permettere loro di unirsi alla tua lega.`,
			[
				{
					text: 'Copia Codice',
					onPress: () => {
						Clipboard.setString(inviteCode);
						Alert.alert('Successo', 'Codice copiato negli appunti!');
					},
				},
				{
					text: 'Condividi',
					onPress: async () => {
						try {
							await Share.share({
								message: `Unisciti alla mia legaFantaCalcio "${league.name}"!\n\nCodice Invito: ${inviteCode}\n\nScarica l'app e inserisci questo codice per partecipare.`,
							});
						} catch (error) {
							Alert.alert('Errore', 'Impossibile condividere il codice');
						}
					},
				},
				{
					text: 'Chiudi',
					style: 'cancel',
				},
			]
		);
	};

	const handleSaveSettings = async () => {
		// Validazione nome lega
		if (!leagueName.trim()) {
			Alert.alert('Errore', 'Il nome della lega non può essere vuoto');
			return;
		}

		// Validazione giornata di inizio
		const startDayNum = parseInt(startDay);
		if (isNaN(startDayNum) || startDayNum < 1 || startDayNum > 38) {
			Alert.alert('Errore', 'La giornata di inizio deve essere tra 1 e 38');
			return;
		}

		// Validazione budget
		const budgetNum = parseInt(maxBudget);
		if (isNaN(budgetNum) || budgetNum < 100 || budgetNum > 1000) {
			Alert.alert('Errore', 'Il budget deve essere tra 100 e 1000 crediti');
			return;
		}

		// Validazione limiti giocatori
		const p = parseInt(maxPortieri);
		const d = parseInt(maxDifensori);
		const c = parseInt(maxCentrocampisti);
		const a = parseInt(maxAttaccanti);

		if (isNaN(p) || p < 1 || p > 10) {
			Alert.alert('Errore', 'Il numero di portieri deve essere tra 1 e 10');
			return;
		}
		if (isNaN(d) || d < 1 || d > 15) {
			Alert.alert('Errore', 'Il numero di difensori deve essere tra 1 e 15');
			return;
		}
		if (isNaN(c) || c < 1 || c > 15) {
			Alert.alert('Errore', 'Il numero di centrocampisti deve essere tra 1 e 15');
			return;
		}
		if (isNaN(a) || a < 1 || a > 10) {
			Alert.alert('Errore', 'Il numero di attaccanti deve essere tra 1 e 10');
			return;
		}

		// Validazione limiti panchina
		const bp = parseInt(benchPortieri);
		const bd = parseInt(benchDifensori);
		const bc = parseInt(benchCentrocampisti);
		const ba = parseInt(benchAttaccanti);

		if (isNaN(bp) || bp < 0 || bp > 5) {
			Alert.alert('Errore', 'Il numero di portieri in panchina deve essere tra 0 e 5');
			return;
		}
		if (isNaN(bd) || bd < 0 || bd > 10) {
			Alert.alert('Errore', 'Il numero di difensori in panchina deve essere tra 0 e 10');
			return;
		}
		if (isNaN(bc) || bc < 0 || bc > 10) {
			Alert.alert('Errore', 'Il numero di centrocampisti in panchina deve essere tra 0 e 10');
			return;
		}
		if (isNaN(ba) || ba < 0 || ba > 10) {
			Alert.alert('Errore', 'Il numero di attaccanti in panchina deve essere tra 0 e 10');
			return;
		}

		// Verifica che i limiti panchina non superino i limiti rosa
		if (bp > p) {
			Alert.alert('Errore', 'I portieri in panchina non possono superare il limite della rosa');
			return;
		}
		if (bd > d) {
			Alert.alert('Errore', 'I difensori in panchina non possono superare il limite della rosa');
			return;
		}
		if (bc > c) {
			Alert.alert('Errore', 'I centrocampisti in panchina non possono superare il limite della rosa');
			return;
		}
		if (ba > a) {
			Alert.alert('Errore', 'Gli attaccanti in panchina non possono superare il limite della rosa');
			return;
		}

		setSaving(true);
		try {
			// Aggiorna le impostazioni della lega
			const updatedSettings = {
				...league.settings,
				start_day: startDayNum,
				max_budget: budgetNum,
				max_players_per_role: {
					P: p,
					D: d,
					C: c,
					A: a,
				},
				bench_limits: {
					P: bp,
					D: bd,
					C: bc,
					A: ba,
				},
			};

			await api.patch(API_ENDPOINTS.LEAGUE_BY_ID(league.id), {
				name: leagueName.trim(),
				settings: updatedSettings,
			});

			Alert.alert('Successo', 'Impostazioni aggiornate con successo', [
				{
					text: 'OK',
					onPress: () => {
						setEditing(false);
						navigation.goBack();
					},
				},
			]);
		} catch (error) {
			Alert.alert(
				'Errore',
				error.response?.data?.detail || 'Impossibile aggiornare le impostazioni'
			);
		} finally {
			setSaving(false);
		}
	};

	const handleDeleteLeague = () => {
		Alert.alert(
			'Elimina Lega',
			'Sei sicuro di voler eliminare questa lega? Questa azione è irreversibile.',
			[
				{ text: 'Annulla', style: 'cancel' },
				{
					text: 'Elimina',
					style: 'destructive',
					onPress: async () => {
						setDeleting(true);
						try {
							await api.delete(API_ENDPOINTS.LEAGUE_BY_ID(league.id));
							clearLeague();
							Alert.alert(
								'Successo',
								'Lega eliminata con successo',
								[
									{
										text: 'OK',
										onPress: () => {
											// Torna alla lista leghe
											navigation.reset({
												index: 0,
												routes: [{ name: 'LeaguesList' }],
											});
										},
									},
								]
							);
						} catch (error) {
							Alert.alert(
								'Errore',
								error.response?.data?.detail || 'Impossibile eliminare la lega'
							);
						} finally {
							setDeleting(false);
						}
					},
				},
			]
		);
	};

	return (
		<ScrollView style={styles.container}>
			<View style={styles.header}>
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<Text style={styles.backButton}>← Indietro</Text>
				</TouchableOpacity>
				<Text style={styles.title}>Impostazioni Lega</Text>
				<Text style={styles.subtitle}>{league.name}</Text>
			</View>

			<View style={styles.content}>
				<View style={styles.section}>
					<View style={styles.sectionHeader}>
						<Text style={styles.sectionTitle}>Configurazione Lega</Text>
						{!editing && (
							<TouchableOpacity onPress={() => setEditing(true)}>
								<Text style={styles.editButton}>◉ Modifica</Text>
							</TouchableOpacity>
						)}
					</View>

					{editing ? (
						<>
							{/* Informazioni Generali */}
							<View style={styles.subsection}>
								<Text style={styles.subsectionTitle}>Informazioni Generali</Text>

								<View style={styles.inputGroup}>
									<Text style={styles.inputLabel}>Nome Lega</Text>
									<TextInput
										style={styles.input}
										value={leagueName}
										onChangeText={setLeagueName}
										placeholder="Nome della lega"
									/>
								</View>

								<View style={styles.inputRow}>
									<View style={[styles.inputGroup, styles.inputHalf]}>
										<Text style={styles.inputLabel}>Giornata Inizio</Text>
										<TextInput
											style={styles.input}
											value={startDay}
											onChangeText={setStartDay}
											keyboardType="numeric"
											placeholder="1-38"
										/>
									</View>

									<View style={[styles.inputGroup, styles.inputHalf]}>
										<Text style={styles.inputLabel}>Budget Iniziale</Text>
										<TextInput
											style={styles.input}
											value={maxBudget}
											onChangeText={setMaxBudget}
											keyboardType="numeric"
											placeholder="500"
										/>
									</View>
								</View>
							</View>

							{/* Limiti Rosa */}
							<View style={styles.subsection}>
								<Text style={styles.subsectionTitle}>Limiti Rosa</Text>

								<View style={styles.inputGroup}>
									<Text style={styles.inputLabel}>Portieri (P)</Text>
									<TextInput
										style={styles.input}
										value={maxPortieri}
										onChangeText={setMaxPortieri}
										keyboardType="numeric"
										placeholder="3"
									/>
								</View>

								<View style={styles.inputGroup}>
									<Text style={styles.inputLabel}>Difensori (D)</Text>
									<TextInput
										style={styles.input}
										value={maxDifensori}
										onChangeText={setMaxDifensori}
										keyboardType="numeric"
										placeholder="8"
									/>
								</View>

								<View style={styles.inputGroup}>
									<Text style={styles.inputLabel}>Centrocampisti (C)</Text>
									<TextInput
										style={styles.input}
										value={maxCentrocampisti}
										onChangeText={setMaxCentrocampisti}
										keyboardType="numeric"
										placeholder="8"
									/>
								</View>

								<View style={styles.inputGroup}>
									<Text style={styles.inputLabel}>Attaccanti (A)</Text>
									<TextInput
										style={styles.input}
										value={maxAttaccanti}
										onChangeText={setMaxAttaccanti}
										keyboardType="numeric"
										placeholder="6"
									/>
								</View>
							</View>

							{/* Limiti Panchina */}
							<View style={styles.subsection}>
								<Text style={styles.subsectionTitle}>Limiti Panchina</Text>

								<View style={styles.inputGroup}>
									<Text style={styles.inputLabel}>Portieri in Panchina</Text>
									<TextInput
										style={styles.input}
										value={benchPortieri}
										onChangeText={setBenchPortieri}
										keyboardType="numeric"
										placeholder="1"
									/>
								</View>

								<View style={styles.inputGroup}>
									<Text style={styles.inputLabel}>Difensori in Panchina</Text>
									<TextInput
										style={styles.input}
										value={benchDifensori}
										onChangeText={setBenchDifensori}
										keyboardType="numeric"
										placeholder="3"
									/>
								</View>

								<View style={styles.inputGroup}>
									<Text style={styles.inputLabel}>Centrocampisti in Panchina</Text>
									<TextInput
										style={styles.input}
										value={benchCentrocampisti}
										onChangeText={setBenchCentrocampisti}
										keyboardType="numeric"
										placeholder="3"
									/>
								</View>

								<View style={styles.inputGroup}>
									<Text style={styles.inputLabel}>Attaccanti in Panchina</Text>
									<TextInput
										style={styles.input}
										value={benchAttaccanti}
										onChangeText={setBenchAttaccanti}
										keyboardType="numeric"
										placeholder="3"
									/>
								</View>
							</View>
							{/* Pulsanti Azione */}
							<View style={styles.buttonRow}>
								<TouchableOpacity
									style={[styles.button, styles.cancelButton]}
									onPress={() => {
										// Reset ai valori originali
										setLeagueName(league.name || '');
										setStartDay(league.settings?.start_day?.toString() || '1');
										setMaxBudget(league.settings?.max_budget?.toString() || '500');
										setMaxPortieri(league.settings?.max_players_per_role?.P?.toString() || '3');
										setMaxDifensori(league.settings?.max_players_per_role?.D?.toString() || '8');
										setMaxCentrocampisti(league.settings?.max_players_per_role?.C?.toString() || '8');
										setMaxAttaccanti(league.settings?.max_players_per_role?.A?.toString() || '6'); setBenchPortieri(league.settings?.bench_limits?.P?.toString() || '1');
										setBenchDifensori(league.settings?.bench_limits?.D?.toString() || '3');
										setBenchCentrocampisti(league.settings?.bench_limits?.C?.toString() || '3');
										setBenchAttaccanti(league.settings?.bench_limits?.A?.toString() || '3'); setEditing(false);
									}}
									disabled={saving}
								>
									<Text style={styles.cancelButtonText}>Annulla</Text>
								</TouchableOpacity>

								<TouchableOpacity
									style={[styles.button, styles.saveButton]}
									onPress={handleSaveSettings}
									disabled={saving}
								>
									{saving ? (
										<ActivityIndicator color="#fff" />
									) : (
										<Text style={styles.saveButtonText}>Salva Modifiche</Text>
									)}
								</TouchableOpacity>
							</View>
						</>
					) : (
						<>
							{/* Informazioni Generali - Vista */}
							<View style={styles.subsection}>
								<Text style={styles.subsectionTitle}>Informazioni Generali</Text>
								<View style={styles.infoRow}>
									<Text style={styles.infoLabel}>Nome Lega</Text>
									<Text style={styles.infoValue}>{league.name}</Text>
								</View>
								<View style={styles.infoRow}>
									<Text style={styles.infoLabel}>Numero Squadre</Text>
									<Text style={styles.infoValue}>{league.teams?.length || 0}</Text>
								</View>
								<View style={styles.infoRow}>
									<Text style={styles.infoLabel}>Giornata Inizio</Text>
									<Text style={styles.infoValue}>{league.settings?.start_day || 1}</Text>
								</View>
								<View style={styles.infoRow}>
									<Text style={styles.infoLabel}>Budget Iniziale</Text>
									<Text style={styles.infoValue}>{league.settings?.max_budget || 500}M</Text>
								</View>
							</View>

							{/* Limiti Rosa - Vista */}
							<View style={styles.subsection}>
								<Text style={styles.subsectionTitle}>Limiti Rosa</Text>
								<View style={styles.infoRow}>
									<Text style={styles.infoLabel}>Portieri (P)</Text>
									<Text style={styles.infoValue}>{league.settings?.max_players_per_role?.P || 3}</Text>
								</View>
								<View style={styles.infoRow}>
									<Text style={styles.infoLabel}>Difensori (D)</Text>
									<Text style={styles.infoValue}>{league.settings?.max_players_per_role?.D || 8}</Text>
								</View>
								<View style={styles.infoRow}>
									<Text style={styles.infoLabel}>Centrocampisti (C)</Text>
									<Text style={styles.infoValue}>{league.settings?.max_players_per_role?.C || 8}</Text>
								</View>
								<View style={styles.infoRow}>
									<Text style={styles.infoLabel}>Attaccanti (A)</Text>
									<Text style={styles.infoValue}>{league.settings?.max_players_per_role?.A || 6}</Text>
								</View>
							</View>

							{/* Limiti Panchina - Vista */}
							<View style={styles.subsection}>
								<Text style={styles.subsectionTitle}>Limiti Panchina</Text>
								<View style={styles.infoRow}>
									<Text style={styles.infoLabel}>Portieri in Panchina</Text>
									<Text style={styles.infoValue}>{league.settings?.bench_limits?.P || 1}</Text>
								</View>
								<View style={styles.infoRow}>
									<Text style={styles.infoLabel}>Difensori in Panchina</Text>
									<Text style={styles.infoValue}>{league.settings?.bench_limits?.D || 3}</Text>
								</View>
								<View style={styles.infoRow}>
									<Text style={styles.infoLabel}>Centrocampisti in Panchina</Text>
									<Text style={styles.infoValue}>{league.settings?.bench_limits?.C || 3}</Text>
								</View>
								<View style={styles.infoRow}>
									<Text style={styles.infoLabel}>Attaccanti in Panchina</Text>
									<Text style={styles.infoValue}>{league.settings?.bench_limits?.A || 3}</Text>
								</View>
							</View>
						</>
					)}
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Azioni</Text>
					<TouchableOpacity
						style={styles.actionButton}
						onPress={handleInviteParticipants}
					>
						<Text style={styles.actionButtonText}>↗ Invita Partecipanti</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.actionButton, styles.dangerButton]}
						onPress={handleDeleteLeague}
						disabled={deleting}
					>
						{deleting ? (
							<ActivityIndicator color={Colors.error} />
						) : (
							<Text style={[styles.actionButtonText, styles.dangerButtonText]}>
								× Elimina Lega
							</Text>
						)}
					</TouchableOpacity>
				</View>
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
	backButton: {
		color: Colors.primary,
		fontSize: 16,
		marginBottom: 8,
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
	content: {
		padding: 15,
	},
	section: {
		backgroundColor: Colors.card,
		borderRadius: 12,
		padding: 20,
		marginBottom: 15,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: Colors.text,
	},
	sectionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 20,
	},
	editButton: {
		color: Colors.primary,
		fontSize: 16,
		fontWeight: '600',
	},
	subsection: {
		marginBottom: 24,
	},
	subsectionTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: Colors.primary,
		marginBottom: 16,
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
	infoRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: Colors.gray200,
	},
	infoLabel: {
		fontSize: 15,
		color: Colors.textSecondary,
		fontWeight: '500',
	},
	infoValue: {
		fontSize: 15,
		fontWeight: '600',
		color: Colors.text,
	},
	inputGroup: {
		marginBottom: 16,
	},
	inputLabel: {
		fontSize: 14,
		color: Colors.text,
		marginBottom: 8,
		fontWeight: '600',
	},
	input: {
		backgroundColor: Colors.white,
		borderRadius: 8,
		padding: 14,
		fontSize: 16,
		color: Colors.text,
		borderWidth: 1,
		borderColor: Colors.gray300,
	},
	inputRow: {
		flexDirection: 'row',
		gap: 12,
	},
	inputHalf: {
		flex: 1,
	},
	buttonRow: {
		flexDirection: 'row',
		gap: 12,
		marginTop: 8,
	},
	button: {
		flex: 1,
		padding: 16,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	cancelButton: {
		backgroundColor: Colors.white,
		borderWidth: 2,
		borderColor: Colors.gray300,
	},
	cancelButtonText: {
		color: Colors.text,
		fontSize: 16,
		fontWeight: '600',
	},
	saveButton: {
		backgroundColor: Colors.primary,
		shadowColor: Colors.primary,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
		elevation: 3,
	},
	saveButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
	actionButton: {
		backgroundColor: Colors.gray100,
		padding: 16,
		borderRadius: 8,
		marginBottom: 12,
	},
	actionButtonText: {
		fontSize: 16,
		color: Colors.text,
		fontWeight: '500',
	},
	dangerButton: {
		backgroundColor: '#FEE',
	},
	dangerButtonText: {
		color: Colors.error,
	},
});
