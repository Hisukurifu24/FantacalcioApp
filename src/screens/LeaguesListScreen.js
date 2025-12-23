import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	FlatList,
	ActivityIndicator,
	Alert,
	RefreshControl,
	ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useLeague } from '../context/LeagueContext';
import api from '../services/api';
import { API_ENDPOINTS } from '../config/api';
import { Colors, Typography } from '../config/theme';

export default function LeaguesListScreen({ navigation, route }) {
	const { user, logout } = useAuth();
	const { selectLeague } = useLeague();
	const [leagues, setLeagues] = useState([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	useEffect(() => {
		loadLeagues();
	}, []);

	useEffect(() => {
		const unsubscribe = navigation.addListener('focus', () => {
			loadLeagues();
		});
		return unsubscribe;
	}, [navigation]);

	// Ricarica le leghe quando viene passato il parametro refresh
	useEffect(() => {
		if (route.params?.refresh) {
			loadLeagues();
		}
	}, [route.params?.refresh]);

	const loadLeagues = async () => {
		try {
			const response = await api.get(API_ENDPOINTS.LEAGUES);
			setLeagues(response.data);
		} catch (error) {
			Alert.alert('Errore', 'Impossibile caricare le leghe');
		} finally {
			setLoading(false);
		}
	};

	const onRefresh = async () => {
		setRefreshing(true);
		try {
			const response = await api.get(API_ENDPOINTS.LEAGUES);
			setLeagues(response.data);
		} catch (error) {
			Alert.alert('Errore', 'Impossibile caricare le leghe');
		} finally {
			setRefreshing(false);
		}
	};

	const handleSelectLeague = (league) => {
		selectLeague(league);
		navigation.navigate('MainTabs');
	};

	const handleLogout = async () => {
		Alert.alert(
			'Logout',
			'Sei sicuro di voler uscire?',
			[
				{ text: 'Annulla', style: 'cancel' },
				{ text: 'Esci', onPress: logout, style: 'destructive' },
			]
		);
	};

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<View>
					<View style={styles.titleContainer}>
						<Ionicons name="football" size={28} color={Colors.white} />
						<Text style={styles.title}>Fantacalcio</Text>
					</View>
					<Text style={styles.subtitle}>Benvenuto, {user?.username}!</Text>
				</View>
				<TouchableOpacity onPress={handleLogout}>
					<Text style={styles.logoutButton}>Esci</Text>
				</TouchableOpacity>
			</View>

			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Le Tue Leghe</Text>

				{loading ? (
					<ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
				) : leagues.length === 0 ? (
					<ScrollView
						contentContainerStyle={{ flexGrow: 1 }}
						refreshControl={
							<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
						}
					>
						<View style={styles.emptyState}>
							<Text style={styles.emptyText}>Nessuna lega trovata</Text>
							<Text style={styles.emptySubtext}>Crea o partecipa a una lega per iniziare!</Text>
						</View>
					</ScrollView>
				) : (
					<FlatList
						data={leagues}
						keyExtractor={(item) => item.id}
						renderItem={({ item }) => (
							<TouchableOpacity
								style={styles.leagueCard}
								onPress={() => handleSelectLeague(item)}
							>
								<Text style={styles.leagueCardTitle}>{item.name}</Text>
								<Text style={styles.leagueCardInfo}>
									{item.teams?.length || 0} squadre
								</Text>
							</TouchableOpacity>
						)}
						refreshControl={
							<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
						}
					/>
				)}

				<View style={styles.actionButtons}>
					<TouchableOpacity
						style={[styles.actionButton, styles.createButton]}
						onPress={() => navigation.navigate('CreateLeague')}
					>
						<Ionicons name="add-circle" size={24} color={Colors.white} style={styles.buttonIcon} />
						<Text style={styles.actionButtonText}>Crea Lega</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[styles.actionButton, styles.joinButton]}
						onPress={() => navigation.navigate('JoinLeague')}
					>
						<Ionicons name="enter" size={24} color={Colors.white} style={styles.buttonIcon} />
						<Text style={styles.actionButtonText}>Unisciti</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.background,
	},
	header: {
		backgroundColor: Colors.primary,
		padding: 20,
		paddingTop: 60,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	titleContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		marginBottom: 2,
	},
	title: {
		fontSize: 28,
		fontWeight: 'bold',
		color: Colors.white,
		lineHeight: 32,
	},
	subtitle: {
		fontSize: 16,
		color: Colors.white,
		marginTop: 5,
	},
	logoutButton: {
		color: Colors.white,
		fontSize: 16,
		fontWeight: '600',
	},
	section: {
		flex: 1,
		padding: 20,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 15,
		color: Colors.text,
	},
	loader: {
		marginTop: 50,
	},
	emptyState: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 60,
	},
	emptyText: {
		fontSize: 18,
		fontWeight: '600',
		color: Colors.textLight,
		marginBottom: 10,
	},
	emptySubtext: {
		fontSize: 14,
		color: Colors.textLight,
	},
	leagueCard: {
		backgroundColor: Colors.white,
		padding: 20,
		borderRadius: 12,
		marginBottom: 15,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	leagueCardTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: Colors.text,
		marginBottom: 5,
	},
	leagueCardInfo: {
		fontSize: 14,
		color: Colors.textLight,
	},
	actionButtons: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 15,
		marginTop: 20,
	},
	actionButton: {
		flex: 1,
		flexDirection: 'row',
		paddingVertical: 18,
		paddingHorizontal: 20,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.15,
		shadowRadius: 5,
		elevation: 4,
	},
	buttonIcon: {
		marginRight: 4,
	},
	createButton: {
		backgroundColor: Colors.primary,
	},
	joinButton: {
		backgroundColor: Colors.success,
	},
	actionButtonText: {
		color: Colors.white,
		fontSize: 16,
		fontWeight: '700',
	},
});
