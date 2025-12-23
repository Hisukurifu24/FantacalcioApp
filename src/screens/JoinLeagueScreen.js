import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	FlatList,
	TextInput,
	Alert,
	ActivityIndicator,
	Modal,
} from 'react-native';
import api from '../services/api';
import { API_ENDPOINTS } from '../config/api';
import { Colors } from '../config/theme';
import { useAuth } from '../context/AuthContext';
import { useLeague } from '../context/LeagueContext';

export default function JoinLeagueScreen({ navigation }) {
	const [selectedTab, setSelectedTab] = useState('browse'); // 'browse' or 'code'
	const [publicLeagues, setPublicLeagues] = useState([]);
	const [inviteCode, setInviteCode] = useState('');
	const [loading, setLoading] = useState(false);
	const [showTeamModal, setShowTeamModal] = useState(false);
	const [selectedLeagueToJoin, setSelectedLeagueToJoin] = useState(null);
	const [teamName, setTeamName] = useState('');
	const [managerName, setManagerName] = useState('');
	const { user } = useAuth();
	const { selectLeague, selectedLeague } = useLeague();
	useEffect(() => {
		if (selectedTab === 'browse') {
			loadPublicLeagues();
		}
	}, [selectedTab]);

	const loadPublicLeagues = async () => {
		setLoading(true);
		try {
			const response = await api.get(API_ENDPOINTS.PUBLIC_LEAGUES);
			setPublicLeagues(response.data);
		} catch (error) {
			Alert.alert('Errore', 'Impossibile caricare le leghe pubbliche');
			console.error('Error loading public leagues:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleJoinWithCode = async () => {
		if (!inviteCode.trim()) {
			Alert.alert('Errore', 'Inserisci un codice di invito');
			return;
		}

		setLoading(true);
		try {
			// First, show the team setup modal
			setShowTeamModal(true);
		} catch (error) {
			Alert.alert('Errore', 'Codice di invito non valido');
			console.error('Error with invite code:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleJoinLeague = (league) => {
		setSelectedLeagueToJoin(league);
		setShowTeamModal(true);
	};

	const confirmJoin = async () => {
		if (!teamName.trim() || !managerName.trim()) {
			Alert.alert('Errore', 'Inserisci sia il nome della squadra che il nome del fantallenatore');
			return;
		}

		setLoading(true);
		try {
			let response;

			if (selectedLeagueToJoin) {
				// Join by league ID (from public leagues)
				response = await api.post(API_ENDPOINTS.JOIN_LEAGUE(selectedLeagueToJoin.id), {
					team_name: teamName,
					manager_name: managerName,
				});
			} else {
				// Join with invite code
				response = await api.post(
					`${API_ENDPOINTS.JOIN_LEAGUE_WITH_CODE}?invite_code=${inviteCode.toUpperCase()}`,
					{
						team_name: teamName,
						manager_name: managerName,
					}
				);
			}

			// Select the league
			selectLeague(response.data);

			Alert.alert(
				'Successo!',
				`Sei entrato nella lega "${response.data.name}"`,
				[
					{
						text: 'OK',
						onPress: () => {
							// Reset navigation to MainTabs after joining
							navigation.reset({
								index: 0,
								routes: [{ name: 'MainTabs' }],
							});
						},
					},
				]
			);

			// Reset state
			setShowTeamModal(false);
			setTeamName('');
			setManagerName('');
			setInviteCode('');
			setSelectedLeagueToJoin(null);
		} catch (error) {
			let errorMessage = 'Impossibile unirsi alla lega';

			if (error.response?.status === 404) {
				errorMessage = inviteCode ? 'Codice di invito non valido' : 'Lega non trovata';
			} else if (error.response?.status === 400) {
				errorMessage = error.response.data?.detail || 'Hai già una squadra in questa lega';
			}

			Alert.alert('Errore', errorMessage);
			console.error('Error joining league:', error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.title}>Partecipa a una Lega</Text>
			</View>

			<View style={styles.tabs}>
				<TouchableOpacity
					style={[styles.tab, selectedTab === 'browse' && styles.activeTab]}
					onPress={() => setSelectedTab('browse')}
				>
					<Text style={[styles.tabText, selectedTab === 'browse' && styles.activeTabText]}>
						Sfoglia Leghe
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[styles.tab, selectedTab === 'code' && styles.activeTab]}
					onPress={() => setSelectedTab('code')}
				>
					<Text style={[styles.tabText, selectedTab === 'code' && styles.activeTabText]}>
						Codice Invito
					</Text>
				</TouchableOpacity>
			</View>

			{selectedTab === 'browse' ? (
				<View style={styles.content}>
					{loading ? (
						<ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
					) : publicLeagues.length === 0 ? (
						<View style={styles.emptyState}>
							<Text style={styles.emptyText}>Nessuna lega pubblica disponibile</Text>
						</View>
					) : (
						<FlatList
							data={publicLeagues}
							keyExtractor={(item) => item.id}
							renderItem={({ item }) => (
								<TouchableOpacity
									style={styles.leagueCard}
									onPress={() => handleJoinLeague(item)}
								>
									<View style={styles.leagueCardHeader}>
										<Text style={styles.leagueCardTitle}>{item.name}</Text>
										{item.invite_code && (
											<View style={styles.codeBadge}>
												<Text style={styles.codeBadgeText}>{item.invite_code}</Text>
											</View>
										)}
									</View>
									<Text style={styles.leagueCardInfo}>
										{item.teams?.length || 0} squadre
									</Text>
									<View style={styles.joinButton}>
										<Text style={styles.joinButtonText}>Partecipa →</Text>
									</View>
								</TouchableOpacity>
							)}
						/>
					)}
				</View>
			) : (
				<View style={styles.content}>
					<View style={styles.codeSection}>
						<Text style={styles.label}>Codice di Invito</Text>
						<TextInput
							style={styles.input}
							placeholder="Inserisci il codice"
							value={inviteCode}
							onChangeText={setInviteCode}
							autoCapitalize="characters"
						/>
						<TouchableOpacity
							style={[styles.button, loading && styles.buttonDisabled]}
							onPress={handleJoinWithCode}
							disabled={loading}
						>
							{loading ? (
								<ActivityIndicator color={Colors.white} />
							) : (
								<Text style={styles.buttonText}>Partecipa</Text>
							)}
						</TouchableOpacity>
					</View>
				</View>
			)}

			<TouchableOpacity
				style={styles.cancelButton}
				onPress={() => navigation.goBack()}
			>
				<Text style={styles.cancelButtonText}>Annulla</Text>
			</TouchableOpacity>

			{/* Team Setup Modal */}
			<Modal
				visible={showTeamModal}
				transparent={true}
				animationType="slide"
				onRequestClose={() => setShowTeamModal(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<Text style={styles.modalTitle}>Configura la tua Squadra</Text>

						<Text style={styles.modalLabel}>Nome Fantallenatore</Text>
						<TextInput
							style={styles.modalInput}
							placeholder="Inserisci il tuo nome"
							value={managerName}
							onChangeText={setManagerName}
						/>

						<Text style={styles.modalLabel}>Nome Squadra</Text>
						<TextInput
							style={styles.modalInput}
							placeholder="Inserisci il nome della squadra"
							value={teamName}
							onChangeText={setTeamName}
						/>

						<View style={styles.modalButtons}>
							<TouchableOpacity
								style={[styles.modalButton, styles.modalButtonCancel]}
								onPress={() => {
									setShowTeamModal(false);
									setTeamName('');
									setManagerName('');
									setSelectedLeagueToJoin(null);
								}}
							>
								<Text style={styles.modalButtonTextCancel}>Annulla</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={[styles.modalButton, styles.modalButtonConfirm, loading && styles.buttonDisabled]}
								onPress={confirmJoin}
								disabled={loading}
							>
								{loading ? (
									<ActivityIndicator color={Colors.white} />
								) : (
									<Text style={styles.modalButtonTextConfirm}>Conferma</Text>
								)}
							</TouchableOpacity>
						</View>
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
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		color: Colors.text,
	},
	tabs: {
		flexDirection: 'row',
		backgroundColor: Colors.card,
		borderBottomWidth: 1,
		borderBottomColor: Colors.gray300,
	},
	tab: {
		flex: 1,
		padding: 16,
		alignItems: 'center',
	},
	activeTab: {
		borderBottomWidth: 2,
		borderBottomColor: Colors.primary,
	},
	tabText: {
		fontSize: 16,
		color: Colors.textSecondary,
	},
	activeTabText: {
		color: Colors.primary,
		fontWeight: '600',
	},
	content: {
		flex: 1,
		padding: 20,
	},
	loader: {
		marginTop: 50,
	},
	emptyState: {
		alignItems: 'center',
		marginTop: 50,
	},
	emptyText: {
		fontSize: 16,
		color: Colors.textSecondary,
	},
	leagueCard: {
		backgroundColor: Colors.card,
		padding: 20,
		borderRadius: 12,
		marginBottom: 12,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	leagueCardHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 4,
	},
	leagueCardTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: Colors.text,
		flex: 1,
	},
	codeBadge: {
		backgroundColor: Colors.primary + '20',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4,
	},
	codeBadgeText: {
		color: Colors.primary,
		fontSize: 12,
		fontWeight: '700',
	},
	leagueCardInfo: {
		fontSize: 14,
		color: Colors.textSecondary,
		marginBottom: 12,
	},
	joinButton: {
		alignSelf: 'flex-end',
	},
	joinButtonText: {
		color: Colors.primary,
		fontSize: 16,
		fontWeight: '600',
	},
	codeSection: {
		flex: 1,
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
		marginBottom: 20,
	},
	button: {
		backgroundColor: Colors.primary,
		padding: 16,
		borderRadius: 8,
		alignItems: 'center',
	},
	buttonDisabled: {
		opacity: 0.6,
	},
	buttonText: {
		color: Colors.white,
		fontSize: 16,
		fontWeight: '600',
	},
	cancelButton: {
		padding: 16,
		alignItems: 'center',
		backgroundColor: Colors.card,
		borderTopWidth: 1,
		borderTopColor: Colors.gray300,
	},
	cancelButtonText: {
		color: Colors.textSecondary,
		fontSize: 16,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: {
		backgroundColor: Colors.white,
		borderRadius: 12,
		padding: 24,
		width: '85%',
		maxWidth: 400,
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: Colors.text,
		marginBottom: 20,
		textAlign: 'center',
	},
	modalLabel: {
		fontSize: 14,
		fontWeight: '600',
		color: Colors.text,
		marginBottom: 8,
		marginTop: 12,
	},
	modalInput: {
		backgroundColor: Colors.gray100,
		padding: 12,
		borderRadius: 8,
		fontSize: 16,
		borderWidth: 1,
		borderColor: Colors.gray300,
	},
	modalButtons: {
		flexDirection: 'row',
		marginTop: 24,
		gap: 12,
	},
	modalButton: {
		flex: 1,
		padding: 14,
		borderRadius: 8,
		alignItems: 'center',
	},
	modalButtonCancel: {
		backgroundColor: Colors.gray200,
	},
	modalButtonConfirm: {
		backgroundColor: Colors.primary,
	},
	modalButtonTextCancel: {
		color: Colors.text,
		fontSize: 16,
		fontWeight: '600',
	},
	modalButtonTextConfirm: {
		color: Colors.white,
		fontSize: 16,
		fontWeight: '600',
	},
});
