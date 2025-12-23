import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	Alert,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../config/theme';

export default function LoginScreen({ navigation }) {
	const [usernameOrEmail, setUsernameOrEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const { login } = useAuth();

	const handleLogin = async () => {
		if (!usernameOrEmail || !password) {
			Alert.alert('Errore', 'Inserisci username/email e password');
			return;
		}

		setLoading(true);
		const result = await login(usernameOrEmail, password);
		setLoading(false);

		if (!result.success) {
			Alert.alert('Errore', result.error);
		}
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			style={styles.container}
		>
			<ScrollView contentContainerStyle={styles.scrollContent}>
				<View style={styles.header}>
					<View style={styles.titleContainer}>
						<Ionicons name="football" size={32} color={Colors.primary} />
						<Text style={styles.title}>Fantacalcio</Text>
					</View>
					<Text style={styles.subtitle}>Accedi al tuo account</Text>
				</View>

				<View style={styles.form}>
					<TextInput
						style={styles.input}
						placeholder="Username o Email"
						value={usernameOrEmail}
						onChangeText={setUsernameOrEmail}
						autoCapitalize="none"
						autoCorrect={false}
					/>

					<TextInput
						style={styles.input}
						placeholder="Password"
						value={password}
						onChangeText={setPassword}
						secureTextEntry={true}
						autoCapitalize="none"
					/>

					<TouchableOpacity
						style={[styles.button, loading && styles.buttonDisabled]}
						onPress={handleLogin}
						disabled={loading}
					>
						{loading ? (
							<ActivityIndicator color="#fff" />
						) : (
							<Text style={styles.buttonText}>Accedi</Text>
						)}
					</TouchableOpacity>

					<View style={styles.signupContainer}>
						<Text style={styles.signupText}>Non hai un account? </Text>
						<TouchableOpacity onPress={() => navigation.navigate('Signup')}>
							<Text style={styles.signupLink}>Registrati</Text>
						</TouchableOpacity>
					</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.gray100,
	},
	scrollContent: {
		flexGrow: 1,
		justifyContent: 'center',
		padding: 20,
	},
	header: {
		alignItems: 'center',
		marginBottom: 40,
	},
	titleContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	title: {
		fontSize: 36,
		fontWeight: 'bold',
		color: Colors.text,
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		color: Colors.textSecondary,
	},
	form: {
		backgroundColor: Colors.card,
		padding: 20,
		borderRadius: 12,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 3,
	},
	input: {
		backgroundColor: Colors.gray100,
		padding: 15,
		borderRadius: 8,
		marginBottom: 15,
		fontSize: 16,
		borderWidth: 1,
		borderColor: Colors.gray300,
		color: Colors.text,
	},
	button: {
		backgroundColor: Colors.primary,
		padding: 16,
		borderRadius: 8,
		alignItems: 'center',
		marginTop: 10,
	},
	buttonDisabled: {
		backgroundColor: Colors.gray400,
	},
	buttonText: {
		color: Colors.white,
		fontSize: 16,
		fontWeight: '600',
	},
	signupContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 20,
	},
	signupText: {
		color: Colors.textSecondary,
		fontSize: 14,
	},
	signupLink: {
		color: Colors.success,
		fontSize: 14,
		fontWeight: '600',
	},
});
