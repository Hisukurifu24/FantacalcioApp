import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	Alert,
	ActivityIndicator,
	RefreshControl,
} from 'react-native';
import { Colors } from '../config/theme';
import { getCompetitions, deleteCompetition } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CompetitionsScreen({ route, navigation }) {
	const { league } = route.params;
	const { user } = useAuth();
	const [competitions, setCompetitions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	// Only the league creator is an admin
	const isAdmin = league.created_by === user?.id;

	useEffect(() => {
		loadCompetitions();
	}, []);

	const loadCompetitions = async () => {
		try {
			setLoading(true);
			const data = await getCompetitions(league.id);
			setCompetitions(data);
		} catch (error) {
			console.error('Error loading competitions:', error);
			Alert.alert('Errore', 'Impossibile caricare le competizioni');
		} finally {
			setLoading(false);
		}
	};

	const onRefresh = async () => {
		setRefreshing(true);
		await loadCompetitions();
		setRefreshing(false);
	};

	const handleCreateCompetition = () => {
		if (!isAdmin) {
			Alert.alert('Accesso negato', 'Solo gli amministratori possono creare competizioni');
			return;
		}
		navigation.navigate('CreateCompetition', { league, onCompetitionCreated: loadCompetitions });
	};

	const handleCompetitionPress = (competition, index) => {
		navigation.navigate('CompetitionDetail', {
			league,
			competition,
			competitionIndex: index,
			onCompetitionUpdated: loadCompetitions,
			isAdmin
		});
	};

	const handleDeleteCompetition = (index) => {
		Alert.alert(
			'Elimina Competizione',
			'Sei sicuro di voler eliminare questa competizione?',
			[
				{ text: 'Annulla', style: 'cancel' },
				{
					text: 'Elimina',
					style: 'destructive',
					onPress: async () => {
						try {
							await deleteCompetition(league.id, index);
							Alert.alert('Successo', 'Competizione eliminata');
							loadCompetitions();
						} catch (error) {
							console.error('Error deleting competition:', error);
							if (error.response?.status === 403) {
								Alert.alert('Accesso Negato', 'Non hai i permessi per eliminare questa competizione');
							} else {
								Alert.alert('Errore', 'Impossibile eliminare la competizione');
							}
						}
					},
				},
			]
		);
	};

	const getCompetitionTypeLabel = (type) => {
		const labels = {
			POINTS: 'Somma Punti',
			CHAMPIONSHIP: 'Campionato',
			GROUP_TOURNAMENT: 'Coppa con Gruppi',
			KNOCKOUT_TOURNAMENT: 'Coppa Eliminazione Diretta',
			FORMULA1: 'Formula 1',
		};
		return labels[type] || type;
	};

	if (loading) {
		return (
			<View style={styles.container}>
				<View style={styles.header}>
					<TouchableOpacity onPress={() => navigation.goBack()}>
						<Text style={styles.backButton}>← Indietro</Text>
					</TouchableOpacity>
					<Text style={styles.title}>Competizioni</Text>
				</View>
				<View style={styles.centerContainer}>
					<ActivityIndicator size="large" color={Colors.primary} />
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
				<Text style={styles.title}>Competizioni</Text>
			</View>

			<FlatList
				data={competitions}
				keyExtractor={(item, index) => index.toString()}
				contentContainerStyle={styles.list}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
				}
				renderItem={({ item, index }) => (
					<TouchableOpacity
						style={styles.competitionCard}
						onPress={() => handleCompetitionPress(item, index)}
						onLongPress={() => isAdmin && handleDeleteCompetition(index)}
					>
						<View style={styles.competitionInfo}>
							<Text style={styles.competitionName}>{item.name}</Text>
							<Text style={styles.competitionType}>
								{getCompetitionTypeLabel(item.type)} • {item.participants?.length || 0} squadre
							</Text>
							{item.settings && (
								<Text style={styles.competitionDays}>
									Giornate: {item.settings.start_day || 1} - {item.settings.end_day || 38}
								</Text>
							)}
						</View>
						<Text style={styles.arrowIcon}>→</Text>
					</TouchableOpacity>
				)}
				ListEmptyComponent={
					<View style={styles.emptyState}>
						<Text style={styles.emptyText}>Nessuna competizione attiva</Text>
						<Text style={styles.emptySubtext}>
							{isAdmin ? 'Crea una competizione per iniziare!' : 'Attendi che un amministratore crei una competizione'}
						</Text>
					</View>
				}
			/>

			{console.log('Rendering button, isAdmin:', isAdmin)}
			{isAdmin && (
				<TouchableOpacity
					style={styles.createButton}
					onPress={handleCreateCompetition}
				>
					<Text style={styles.createButtonText}>Crea Competizione</Text>
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
	list: {
		padding: 15,
		paddingBottom: 100,
	},
	competitionCard: {
		backgroundColor: Colors.card,
		padding: 20,
		borderRadius: 12,
		marginBottom: 12,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	competitionInfo: {
		flex: 1,
	},
	competitionName: {
		fontSize: 18,
		fontWeight: '600',
		color: Colors.text,
		marginBottom: 4,
	},
	competitionType: {
		fontSize: 14,
		color: Colors.textSecondary,
	},
	competitionDays: {
		fontSize: 12,
		color: Colors.textSecondary,
		marginTop: 4,
	},
	arrowIcon: {
		fontSize: 20,
		color: Colors.primary,
	},
	emptyState: {
		padding: 40,
		alignItems: 'center',
	},
	emptyText: {
		fontSize: 18,
		color: Colors.textSecondary,
		marginBottom: 8,
	},
	emptySubtext: {
		fontSize: 14,
		color: Colors.textLight,
		textAlign: 'center',
	},
	createButton: {
		backgroundColor: Colors.success,
		marginHorizontal: 15,
		marginVertical: 15,
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 8,
		alignItems: 'center',
		alignSelf: 'center',
		position: 'absolute',
		bottom: 0,
	},
	createButtonText: {
		color: Colors.white,
		fontSize: 15,
		fontWeight: '600',
	},
	centerContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
});

