import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	ScrollView,
	Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../config/theme';
import { useAuth } from '../context/AuthContext';
import { adminAddPlayerToTeam, adminRemovePlayerFromTeam } from '../services/api';

export default function TeamDetailScreen({ route, navigation }) {
	const { team: initialTeam, league } = route.params;
	const { user } = useAuth();
	const [team, setTeam] = useState(initialTeam);
	const [selectedRole, setSelectedRole] = useState('Tutti');
	const [loading, setLoading] = useState(false);

	const roles = ['Tutti', 'P', 'D', 'C', 'A'];
	const isAdmin = user && league.created_by === user.id;

	// Ordine dei ruoli per l'ordinamento
	const roleOrder = { 'P': 1, 'D': 2, 'C': 3, 'A': 4 };

	// Filtra e ordina i giocatori per ruolo
	const filteredPlayers = selectedRole === 'Tutti'
		? [...team.roster].sort((a, b) => {
			const orderA = roleOrder[a.role] || 999;
			const orderB = roleOrder[b.role] || 999;
			return orderA - orderB;
		})
		: team.roster.filter(player => player.role === selectedRole);

	// Raggruppa i giocatori per ruolo
	const playersByRole = {
		P: team.roster.filter(p => p.role === 'P'),
		D: team.roster.filter(p => p.role === 'D'),
		C: team.roster.filter(p => p.role === 'C'),
		A: team.roster.filter(p => p.role === 'A'),
	};

	const getRoleIconName = (role) => {
		const icons = {
			P: 'hand-left',
			D: 'shield',
			C: 'flash',
			A: 'football',
		};
		return icons[role] || 'person';
	};

	const getRoleName = (role) => {
		const names = {
			P: 'Portiere',
			D: 'Difensore',
			C: 'Centrocampista',
			A: 'Attaccante',
		};
		return names[role] || role;
	};

	const handleSelectPlayer = async (player) => {
		// Determina il ruolo dal giocatore selezionato
		const playerRole = player.ruolo?.toUpperCase() || 'D';
		const playerName = player.nome;

		setLoading(true);
		try {
			const updatedLeague = await adminAddPlayerToTeam(
				league.id,
				team.name,
				playerName,
				playerRole
			);
			// Aggiorna il team con i dati nuovi
			const updatedTeam = updatedLeague.teams.find(t => t.name === team.name);
			if (updatedTeam) {
				setTeam(updatedTeam);
			}
			Alert.alert('Successo', `${playerName} aggiunto alla squadra`);
		} catch (error) {
			Alert.alert('Errore', error.response?.data?.detail || 'Impossibile aggiungere il giocatore');
		} finally {
			setLoading(false);
		}
	};

	const handleRemovePlayer = async (playerName) => {
		Alert.alert(
			'Rimuovi Giocatore',
			`Sei sicuro di voler rimuovere ${playerName} dalla squadra?`,
			[
				{ text: 'Annulla', style: 'cancel' },
				{
					text: 'Rimuovi',
					style: 'destructive',
					onPress: async () => {
						setLoading(true);
						try {
							const updatedLeague = await adminRemovePlayerFromTeam(
								league.id,
								team.name,
								playerName
							);
							// Aggiorna il team con i dati nuovi
							const updatedTeam = updatedLeague.teams.find(t => t.name === team.name);
							if (updatedTeam) {
								setTeam(updatedTeam);
							}
							Alert.alert('Successo', `${playerName} rimosso dalla squadra`);
						} catch (error) {
							Alert.alert('Errore', error.response?.data?.detail || 'Impossibile rimuovere il giocatore');
						} finally {
							setLoading(false);
						}
					},
				},
			]
		);
	};

	const renderPlayer = ({ item }) => (
		<TouchableOpacity
			style={styles.playerCard}
			activeOpacity={0.85}
			onPress={() => navigation.navigate('PlayerDetail', {
				player: item,
				league,
				teamName: team.name,
			})}
		>
			<View style={styles.playerIcon}>
				<Ionicons name={getRoleIconName(item.role)} size={24} color={Colors.primary} />
			</View>
			<View style={styles.playerInfo}>
				<Text style={styles.playerName}>{item.name}</Text>
				<Text style={styles.playerRole}>{getRoleName(item.role)}</Text>
			</View>
			{isAdmin && (
				<TouchableOpacity
					onPress={() => handleRemovePlayer(item.name)}
					style={styles.removeButton}
					disabled={loading}
				>
					<Ionicons name="trash-outline" size={20} color={Colors.error} />
				</TouchableOpacity>
			)}
		</TouchableOpacity>
	);

	const renderEmptyList = () => (
		<View style={styles.emptyContainer}>
			<Ionicons name="clipboard-outline" size={64} color={Colors.textLight} />
			<Text style={styles.emptyMessage}>
				{selectedRole === 'Tutti'
					? 'Nessun giocatore in rosa'
					: `Nessun ${getRoleName(selectedRole).toLowerCase()} in rosa`}
			</Text>
		</View>
	);

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<Text style={styles.backButton}>← Indietro</Text>
				</TouchableOpacity>
				<View style={styles.headerTop}>
					<View style={styles.headerLeft}>
						<Text style={styles.title}>{team.name}</Text>
						<View style={styles.subtitleContainer}>
							<Ionicons name="person" size={14} color={Colors.textSecondary} />
							<Text style={styles.subtitle}> {team.owner}</Text>
						</View>
					</View>
				</View>
			</View>

			{/* Stats Bar */}
			<View style={styles.statsBar}>
				<View style={styles.statItem}>
					<Text style={styles.statValue}>{team.roster?.length || 0}</Text>
					<Text style={styles.statLabel}>Giocatori</Text>
				</View>
				<View style={styles.statDivider} />
				<View style={styles.statItem}>
					<Text style={styles.statValue}>{playersByRole.P.length}</Text>
					<Text style={styles.statLabel}>Portieri</Text>
				</View>
				<View style={styles.statDivider} />
				<View style={styles.statItem}>
					<Text style={styles.statValue}>{playersByRole.D.length}</Text>
					<Text style={styles.statLabel}>Difensori</Text>
				</View>
				<View style={styles.statDivider} />
				<View style={styles.statItem}>
					<Text style={styles.statValue}>{playersByRole.C.length}</Text>
					<Text style={styles.statLabel}>Centrocampisti</Text>
				</View>
				<View style={styles.statDivider} />
				<View style={styles.statItem}>
					<Text style={styles.statValue}>{playersByRole.A.length}</Text>
					<Text style={styles.statLabel}>Attaccanti</Text>
				</View>
			</View>

			{/* Role Filter */}
			<View style={styles.filterWrapper}>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.filterContent}
				>
					{roles.map((role) => (
						<TouchableOpacity
							key={role}
							style={[
								styles.filterButton,
								selectedRole === role && styles.filterButtonActive,
							]}
							onPress={() => setSelectedRole(role)}
						>
							<View style={styles.filterButtonContent}>
								{role !== 'Tutti' && (
									<Ionicons
										name={getRoleIconName(role)}
										size={16}
										color={selectedRole === role ? Colors.card : Colors.textSecondary}
										style={styles.filterIcon}
									/>
								)}
								<Text
									style={[
										styles.filterButtonText,
										selectedRole === role && styles.filterButtonTextActive,
									]}
								>
									{role === 'Tutti' ? role : role}
								</Text>
							</View>
						</TouchableOpacity>
					))}
				</ScrollView>
			</View>

			{/* Players List */}
			<FlatList
				data={filteredPlayers}
				keyExtractor={(item, index) => `${item.name}-${index}`}
				renderItem={renderPlayer}
				ListHeaderComponent={isAdmin ? (
					<TouchableOpacity
						onPress={() => {
							navigation.navigate('FreeAgents', {
								league,
								selectionMode: true,
								onSelectPlayer: handleSelectPlayer,
							});
						}}
						style={styles.addButton}
						disabled={loading}
						activeOpacity={0.8}
					>
						<Ionicons name="add-circle" size={24} color={Colors.primary} />
						<Text style={styles.addButtonText}>Aggiungi giocatore</Text>
					</TouchableOpacity>
				) : null}
				contentContainerStyle={styles.list}
				ListEmptyComponent={renderEmptyList}
				style={styles.playersList}
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
	headerTop: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	headerLeft: {
		flex: 1,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		color: Colors.text,
		marginBottom: 4,
	},
	subtitleContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	subtitle: {
		fontSize: 14,
		color: Colors.textSecondary,
	},
	addButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: Colors.primaryLight,
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderRadius: 10,
		gap: 6,
		marginBottom: 12,
	},
	addButtonText: {
		color: Colors.primary,
		fontSize: 15,
		fontWeight: '700',
	},
	statsBar: {
		backgroundColor: Colors.card,
		flexDirection: 'row',
		paddingVertical: 16,
		paddingHorizontal: 8,
		marginTop: 2,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 1,
	},
	statItem: {
		flex: 1,
		alignItems: 'center',
	},
	statValue: {
		fontSize: 20,
		fontWeight: 'bold',
		color: Colors.primary,
		marginBottom: 2,
	},
	statLabel: {
		fontSize: 11,
		color: Colors.textSecondary,
		textAlign: 'center',
	},
	statDivider: {
		width: 1,
		backgroundColor: Colors.gray100,
		marginHorizontal: 4,
	},
	filterWrapper: {
		backgroundColor: Colors.card,
		marginTop: 2,
		paddingVertical: 8,
	},
	filterContent: {
		paddingHorizontal: 15,
	},
	filterButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
		backgroundColor: Colors.gray100,
		marginRight: 8,
	},
	filterButtonContent: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	filterIcon: {
		marginRight: 4,
	},
	filterButtonActive: {
		backgroundColor: Colors.primary,
	},
	filterButtonText: {
		fontSize: 14,
		color: Colors.textSecondary,
		fontWeight: '500',
	},
	filterButtonTextActive: {
		color: Colors.card,
		fontWeight: '600',
	},
	playersList: {
		flex: 1,
	},
	list: {
		padding: 15,
	},
	playerCard: {
		backgroundColor: Colors.card,
		padding: 16,
		borderRadius: 12,
		marginBottom: 10,
		flexDirection: 'row',
		alignItems: 'center',
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	playerIcon: {
		width: 45,
		height: 45,
		borderRadius: 22.5,
		backgroundColor: Colors.gray100,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
	},
	playerInfo: {
		flex: 1,
	},
	playerName: {
		fontSize: 16,
		fontWeight: '600',
		color: Colors.text,
		marginBottom: 2,
	},
	playerRole: {
		fontSize: 14,
		color: Colors.textSecondary,
	},
	removeButton: {
		padding: 8,
		backgroundColor: Colors.errorLight || '#ffebee',
		borderRadius: 8,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 60,
	},
	emptyMessage: {
		fontSize: 16,
		color: Colors.textSecondary,
		textAlign: 'center',
		marginTop: 16,
	},
});
