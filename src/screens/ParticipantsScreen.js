import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../config/theme';
import { getLeague } from '../services/api';

export default function ParticipantsScreen({ route, navigation }) {
	const { league: leagueParam } = route.params;
	const [league, setLeague] = useState(leagueParam);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		loadLeagueData();
	}, []);

	const loadLeagueData = async () => {
		try {
			setLoading(true);
			setError(null);
			const leagueData = await getLeague(leagueParam.id);
			setLeague(leagueData);
		} catch (err) {
			console.error('Error loading league:', err);
			setError('Impossibile caricare i dati della lega');
		} finally {
			setLoading(false);
		}
	};

	const handleTeamPress = (team) => {
		navigation.navigate('TeamDetail', { team, league });
	};

	if (loading) {
		return (
			<View style={styles.container}>
				<View style={styles.header}>
					<TouchableOpacity onPress={() => navigation.goBack()}>
						<Text style={styles.backButton}>← Indietro</Text>
					</TouchableOpacity>
					<Text style={styles.title}>Partecipanti</Text>
					<Text style={styles.subtitle}>{league.name}</Text>
				</View>
				<View style={styles.centerContainer}>
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
					<TouchableOpacity onPress={() => navigation.goBack()}>
						<Text style={styles.backButton}>← Indietro</Text>
					</TouchableOpacity>
					<Text style={styles.title}>Partecipanti</Text>
					<Text style={styles.subtitle}>{league.name}</Text>
				</View>
				<View style={styles.centerContainer}>
					<Ionicons name="alert-circle-outline" size={64} color={Colors.error || '#e74c3c'} />
					<Text style={styles.errorMessage}>{error}</Text>
					<TouchableOpacity style={styles.retryButton} onPress={loadLeagueData}>
						<Text style={styles.retryButtonText}>Riprova</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	}

	const teams = league?.teams || [];

	if (teams.length === 0) {
		return (
			<View style={styles.container}>
				<View style={styles.header}>
					<TouchableOpacity onPress={() => navigation.goBack()}>
						<Text style={styles.backButton}>← Indietro</Text>
					</TouchableOpacity>
					<Text style={styles.title}>Partecipanti</Text>
					<Text style={styles.subtitle}>{league.name}</Text>
				</View>
				<View style={styles.centerContainer}>
					<Ionicons name="people-outline" size={64} color={Colors.textLight} />
					<Text style={styles.emptyMessage}>Nessun team registrato</Text>
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
				<Text style={styles.title}>Partecipanti</Text>
				<Text style={styles.subtitle}>{league.name}</Text>
			</View>

			<FlatList
				data={teams}
				keyExtractor={(item, index) => item.name + index}
				contentContainerStyle={styles.list}
				renderItem={({ item }) => (
					<TouchableOpacity
						style={styles.teamCard}
						onPress={() => handleTeamPress(item)}
					>
						<View style={styles.teamIcon}>
							<Ionicons name="shield" size={24} color={Colors.primary} />
						</View>
						<View style={styles.teamInfo}>
							<Text style={styles.teamName}>{item.name}</Text>
							<View style={styles.infoRow}>
								<Ionicons name="person" size={14} color={Colors.textSecondary} />
								<Text style={styles.managerName}> {item.owner}</Text>
							</View>
							<View style={styles.infoRow}>
								<Ionicons name="football" size={14} color={Colors.textLight} />
								<Text style={styles.playerCount}> {item.roster?.length || 0} giocatori</Text>
							</View>
						</View>
						<Ionicons name="chevron-forward" size={24} color={Colors.primary} />
					</TouchableOpacity>
				)}
			/>
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
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 14,
		color: Colors.textSecondary,
	},
	list: {
		padding: 15,
	},
	teamCard: {
		backgroundColor: Colors.card,
		padding: 16,
		borderRadius: 12,
		marginBottom: 12,
		flexDirection: 'row',
		alignItems: 'center',
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	teamIcon: {
		width: 50,
		height: 50,
		borderRadius: 25,
		backgroundColor: Colors.gray100,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
	},
	teamInfo: {
		flex: 1,
	},
	infoRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 2,
	},
	teamName: {
		fontSize: 18,
		fontWeight: '600',
		color: Colors.text,
		marginBottom: 4,
	},
	managerName: {
		fontSize: 14,
		color: Colors.textSecondary,
		marginBottom: 2,
	},
	playerCount: {
		fontSize: 14,
		color: Colors.textLight,
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
	errorMessage: {
		fontSize: 16,
		color: Colors.textSecondary,
		textAlign: 'center',
		marginTop: 16,
		marginBottom: 20,
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
	emptyMessage: {
		fontSize: 16,
		color: Colors.textSecondary,
		textAlign: 'center',
		marginTop: 16,
	},
});
