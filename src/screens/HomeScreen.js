import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLeague } from '../context/LeagueContext';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../config/theme';
import { leaveLeague } from '../services/api';

export default function HomeScreen({ navigation }) {
	const { selectedLeague, clearLeague } = useLeague();
	const { user } = useAuth();

	if (!selectedLeague) {
		return null;
	}

	// Check if user is the league creator
	const isCreator = selectedLeague.created_by === user?.id;
	const hasOtherTeams = selectedLeague.teams?.length > 1;

	const handleBackToLeagues = () => {
		clearLeague();
		// Naviga attraverso il parent navigator per una transizione più fluida
		const parentNav = navigation.getParent();
		if (parentNav) {
			parentNav.reset({
				index: 0,
				routes: [{ name: 'LeaguesList' }],
			});
		}
	};

	const handleLeaveLeague = () => {
		// Check if user is creator with other teams
		if (isCreator && hasOtherTeams) {
			Alert.alert(
				'Impossibile Lasciare',
				'Come creatore della lega, non puoi lasciarla finché ci sono altri team. Elimina la lega o trasferisci la proprietà.',
				[{ text: 'OK' }]
			);
			return;
		}

		Alert.alert(
			'Lascia Lega',
			'Sei sicuro di voler lasciare questa lega? Il tuo team verrà rimosso.',
			[
				{ text: 'Annulla', style: 'cancel' },
				{
					text: 'Lascia',
					style: 'destructive',
					onPress: async () => {
						try {
							await leaveLeague(selectedLeague.id);
							Alert.alert('Successo', 'Hai lasciato la lega', [
								{
									text: 'OK',
									onPress: () => {
										clearLeague();
										const parentNav = navigation.getParent();
										if (parentNav) {
											parentNav.reset({
												index: 0,
												routes: [{ name: 'LeaguesList' }],
											});
										}
									},
								},
							]);
						} catch (error) {
							console.error('Error leaving league:', error);
							if (error.response?.status === 400) {
								Alert.alert(
									'Impossibile Lasciare',
									error.response?.data?.detail || 'Non puoi lasciare questa lega in questo momento'
								);
							} else {
								Alert.alert('Errore', 'Impossibile lasciare la lega');
							}
						}
					},
				},
			]
		);
	};

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<TouchableOpacity onPress={handleBackToLeagues}>
					<Text style={styles.backButton}>← Torna alle leghe</Text>
				</TouchableOpacity>
				<Text style={styles.leagueName}>{selectedLeague.name}</Text>
			</View>

			<View style={styles.leagueContent}>
				{/* Pulsante principale Inserisci Formazione */}
				<TouchableOpacity
					style={styles.mainButton}
					onPress={() => navigation.navigate('Formation', { league: selectedLeague })}
				>
					<Ionicons name="clipboard-outline" size={48} color={Colors.white} style={styles.mainButtonIcon} />
					<Text style={styles.mainButtonText}>Inserisci Formazione</Text>
				</TouchableOpacity>

				{/* Altri pulsanti in griglia */}
				<View style={styles.menuGrid}>
					<MenuButton
						title="Svincolati"
						iconName="people-outline"
						onPress={() => navigation.navigate('FreeAgents', { league: selectedLeague })}
					/>
					<MenuButton
						title="Competizioni"
						iconName="trophy-outline"
						onPress={() => navigation.navigate('Competitions', { league: selectedLeague })}
					/>
					<MenuButton
						title="Partecipanti"
						iconName="person-outline"
						onPress={() => navigation.navigate('Participants', { league: selectedLeague })}
					/>
					<MenuButton
						title="Mercato"
						iconName="cash-outline"
						onPress={() => Alert.alert('Work in Progress', 'Funzionalità in arrivo!')}
					/>
					{isCreator && (
						<MenuButton
							title="Impostazioni Lega"
							iconName="settings-outline"
							onPress={() => navigation.navigate('LeagueSettings', { league: selectedLeague })}
						/>
					)}
					{!isCreator && (
						<MenuButton
							title="Lascia Lega"
							iconName="exit-outline"
							onPress={handleLeaveLeague}
							danger
						/>
					)}
				</View>
			</View>
		</View>
	);
}

function MenuButton({ title, iconName, onPress, danger }) {
	return (
		<TouchableOpacity style={styles.menuButton} onPress={onPress}>
			<Ionicons 
				name={iconName} 
				size={36} 
				color={danger ? Colors.error : Colors.primary} 
				style={styles.menuIcon} 
			/>
			<Text style={[styles.menuTitle, danger && styles.dangerText]}>{title}</Text>
		</TouchableOpacity>
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
		paddingTop: 50,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	backButton: {
		color: Colors.primary,
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 10,
	},
	leagueName: {
		fontSize: 24,
		fontWeight: 'bold',
		color: Colors.text,
	},
	leagueContent: {
		flex: 1,
		padding: 20,
	},
	mainButton: {
		backgroundColor: Colors.primary,
		paddingVertical: 30,
		paddingHorizontal: 20,
		borderRadius: 16,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 25,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 6,
		elevation: 5,
	},
	mainButtonIcon: {
		marginBottom: 12,
	},
	mainButtonText: {
		color: Colors.white,
		fontSize: 20,
		fontWeight: 'bold',
		textAlign: 'center',
	},
	menuGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 15,
	},
	menuButton: {
		width: '47%',
		backgroundColor: Colors.card,
		padding: 20,
		borderRadius: 12,
		alignItems: 'center',
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	menuIcon: {
		marginBottom: 8,
	},
	menuTitle: {
		fontSize: 14,
		fontWeight: '600',
		color: Colors.text,
		textAlign: 'center',
	},
	dangerText: {
		color: Colors.error,
	},
});
