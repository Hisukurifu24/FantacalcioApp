import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ActivityIndicator,
	Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../config/theme';
import { useLeague } from '../context/LeagueContext';
import { getMyTeam } from '../services/api';
import TeamDetailScreen from './TeamDetailScreen';

export default function TeamScreen({ navigation }) {
	const { selectedLeague } = useLeague();
	const [team, setTeam] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (selectedLeague) {
			loadTeam();
		}
	}, [selectedLeague]);

	// Ricarica i dati ogni volta che la schermata diventa visibile
	useFocusEffect(
		React.useCallback(() => {
			if (selectedLeague) {
				loadTeam();
			}
		}, [selectedLeague])
	);

	const loadTeam = async () => {
		try {
			setLoading(true);
			const teamData = await getMyTeam(selectedLeague.id);
			setTeam(teamData);
		} catch (error) {
			console.error('Error loading team:', error);
			Alert.alert('Errore', 'Impossibile caricare la squadra');
		} finally {
			setLoading(false);
		}
	};

	if (!selectedLeague) {
		return (
			<View style={styles.container}>
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyText}>Seleziona una lega per vedere la tua squadra</Text>
				</View>
			</View>
		);
	}

	if (loading) {
		return (
			<View style={styles.container}>
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color={Colors.primary} />
				</View>
			</View>
		);
	}

	// Usa direttamente la UI di TeamDetail per mostrare la propria squadra
	if (team) {
		return (
			<TeamDetailScreen
				key={team.id || team.name || 'my-team'}
				route={{ params: { team, league: team.league || selectedLeague } }}
				navigation={navigation}
			/>
		);
	}

	return (
		<View style={styles.container}>
			<View style={styles.emptyContainer}>
				<Text style={styles.emptyText}>Impossibile caricare la squadra</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.gray100,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	emptyText: {
		fontSize: 16,
		color: Colors.textSecondary,
		textAlign: 'center',
	},
});
