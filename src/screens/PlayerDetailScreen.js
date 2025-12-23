import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../config/theme';

export default function PlayerDetailScreen({ route, navigation }) {
	const {
		player,
		league,
		selectionMode = false,
		onSelectPlayer,
		teamName,
	} = route.params || {};

	const normalizedPlayer = useMemo(() => {
		if (!player) return null;

		const role = (player.role || player.ruolo || '').toUpperCase();
		const club = player.team || player.squadra || player.club || null;

		return {
			name: player.name || player.nome || 'Giocatore',
			role,
			roleLabel: getRoleLabel(role),
			club: club || teamName || 'N/D',
			quotazione: player.quotazione_attuale_classico ??
				player.quotazione_iniziale_classico ??
				player.value ??
				null,
			fvm: player.fvm_classico ?? player.fvm ?? null,
			mediaVoto: player.media_voto ?? player.avg_vote ?? null,
			fantaMedia: player.fanta_media ?? player.fantamedia ?? null,
		};
	}, [player, teamName]);

	if (!normalizedPlayer) {
		return (
			<View style={styles.container}>
				<View style={styles.header}>
					<TouchableOpacity onPress={() => navigation.goBack()}>
						<Text style={styles.backButton}>← Indietro</Text>
					</TouchableOpacity>
					<Text style={styles.title}>Dettaglio giocatore</Text>
				</View>
				<View style={styles.centerContent}>
					<Text style={styles.errorText}>Nessun giocatore da mostrare</Text>
				</View>
			</View>
		);
	}

	const handleSelect = () => {
		if (selectionMode && onSelectPlayer) {
			onSelectPlayer(player);

			const routes = navigation.getState()?.routes || [];
			const popCount = Math.min(2, routes.length - 1);
			if (popCount > 0 && navigation.pop) {
				navigation.pop(popCount);
			} else if (navigation.goBack) {
				navigation.goBack();
			}
		}
	};

	const extraStats = [
		{ label: 'Media Voto', value: normalizedPlayer.mediaVoto },
		{ label: 'Fanta Media', value: normalizedPlayer.fantaMedia },
	].filter(stat => stat.value !== null && stat.value !== undefined);

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<Text style={styles.backButton}>← Indietro</Text>
				</TouchableOpacity>
				<Text style={styles.title}>Dettaglio giocatore</Text>
				<Text style={styles.subtitle}>{league?.name}</Text>
			</View>

			<ScrollView contentContainerStyle={styles.content}>
				<View style={styles.playerCard}>
					<View style={[styles.roleBadge, { backgroundColor: getRoleColor(normalizedPlayer.role) }]}>
						<Text style={styles.roleBadgeText}>{normalizedPlayer.role || 'N/D'}</Text>
					</View>
					<Text style={styles.playerName}>{normalizedPlayer.name}</Text>
					<Text style={styles.playerSubInfo}>
						{normalizedPlayer.roleLabel}
						{normalizedPlayer.club ? ` • ${normalizedPlayer.club}` : ''}
					</Text>

					<View style={styles.statsRow}>
						<View style={styles.statBox}>
							<Text style={styles.statLabel}>Quotazione</Text>
							<Text style={styles.statValue}>
								{normalizedPlayer.quotazione ?? '-'}
							</Text>
						</View>
						<View style={styles.statBox}>
							<Text style={styles.statLabel}>FVM</Text>
							<Text style={styles.statValue}>
								{normalizedPlayer.fvm ?? '-'}
							</Text>
						</View>
					</View>

					{extraStats.length > 0 && (
						<View style={styles.extraStats}>
							{extraStats.map(stat => (
								<View key={stat.label} style={styles.extraStatRow}>
									<Text style={styles.extraStatLabel}>{stat.label}</Text>
									<Text style={styles.extraStatValue}>{stat.value}</Text>
								</View>
							))}
						</View>
					)}

					{teamName && (
						<View style={styles.infoRow}>
							<Ionicons name="shield" size={16} color={Colors.textSecondary} />
							<Text style={styles.infoText}> In rosa: {teamName}</Text>
						</View>
					)}
				</View>

				{selectionMode && (
					<TouchableOpacity style={styles.primaryButton} onPress={handleSelect}>
						<Ionicons name="checkmark-circle" size={20} color={Colors.card} />
						<Text style={styles.primaryButtonText}>Seleziona questo giocatore</Text>
					</TouchableOpacity>
				)}
			</ScrollView>
		</View>
	);
}

const getRoleLabel = (role) => {
	switch (role) {
		case 'P':
			return 'Portiere';
		case 'D':
			return 'Difensore';
		case 'C':
			return 'Centrocampista';
		case 'A':
			return 'Attaccante';
		default:
			return 'Ruolo';
	}
};

const getRoleColor = (role) => {
	switch (role) {
		case 'P':
			return '#FF9800';
		case 'D':
			return '#2196F3';
		case 'C':
			return '#4CAF50';
		case 'A':
			return '#F44336';
		default:
			return Colors.gray200;
	}
};

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
	subtitle: {
		fontSize: 14,
		color: Colors.textSecondary,
		marginTop: 4,
	},
	content: {
		padding: 16,
	},
	playerCard: {
		backgroundColor: Colors.card,
		padding: 20,
		borderRadius: 16,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.12,
		shadowRadius: 8,
		elevation: 4,
	},
	playerName: {
		fontSize: 26,
		fontWeight: '800',
		color: Colors.text,
		marginBottom: 6,
	},
	playerSubInfo: {
		fontSize: 14,
		color: Colors.textSecondary,
		marginBottom: 16,
	},
	roleBadge: {
		alignSelf: 'flex-start',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 12,
		marginBottom: 12,
	},
	roleBadgeText: {
		color: Colors.card,
		fontWeight: '700',
		fontSize: 14,
	},
	statsRow: {
		flexDirection: 'row',
		gap: 12,
		marginBottom: 16,
	},
	statBox: {
		flex: 1,
		backgroundColor: Colors.gray100,
		borderRadius: 12,
		padding: 12,
		alignItems: 'center',
	},
	statLabel: {
		fontSize: 12,
		color: Colors.textSecondary,
		marginBottom: 6,
	},
	statValue: {
		fontSize: 20,
		fontWeight: '700',
		color: Colors.primary,
	},
	extraStats: {
		borderTopWidth: 1,
		borderTopColor: Colors.gray200,
		paddingTop: 12,
	},
	extraStatRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingVertical: 6,
	},
	extraStatLabel: {
		color: Colors.textSecondary,
		fontSize: 14,
	},
	extraStatValue: {
		color: Colors.text,
		fontWeight: '600',
		fontSize: 14,
	},
	infoRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 10,
	},
	infoText: {
		color: Colors.textSecondary,
		fontSize: 14,
		marginLeft: 6,
	},
	primaryButton: {
		marginTop: 20,
		backgroundColor: Colors.primary,
		borderRadius: 12,
		paddingVertical: 14,
		paddingHorizontal: 16,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 6,
		elevation: 3,
	},
	primaryButtonText: {
		color: Colors.card,
		fontSize: 16,
		fontWeight: '700',
	},
	centerContent: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	errorText: {
		color: Colors.textSecondary,
		fontSize: 16,
	},
});
