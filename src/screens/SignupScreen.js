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

export default function SignupScreen({ navigation }) {
	const [username, setUsername] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const { signup } = useAuth();

	const handleSignup = async () => {
		if (!username || !email || !password || !confirmPassword) {
			Alert.alert('Errore', 'Compila tutti i campi');
			return;
		}

		if (password !== confirmPassword) {
			Alert.alert('Errore', 'Le password non corrispondono');
			return;
		}

		if (password.length < 6) {
			Alert.alert('Errore', 'La password deve contenere almeno 6 caratteri');
			return;
		}

		setLoading(true);
		const result = await signup(username, email, password);
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
						<Text style={styles.title}>Registrazione</Text>
					</View>
					<Text style={styles.subtitle}>Crea il tuo account</Text>
				</View>

				<View style={styles.form}>
					<TextInput
						style={styles.input}
						placeholder="Username"
						value={username}
						onChangeText={setUsername}
						autoCapitalize="none"
						autoCorrect={false}
					/>

					<TextInput
						style={styles.input}
						placeholder="Email"
						value={email}
						onChangeText={setEmail}
						autoCapitalize="none"
						keyboardType="email-address"
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

					<TextInput
						style={styles.input}
						placeholder="Conferma Password"
						value={confirmPassword}
						onChangeText={setConfirmPassword}
						secureTextEntry={true}
						autoCapitalize="none"
					/>

					<TouchableOpacity
						style={[styles.button, loading && styles.buttonDisabled]}
						onPress={handleSignup}
						disabled={loading}
					>
						{loading ? (
							<ActivityIndicator color="#fff" />
						) : (
							<Text style={styles.buttonText}>Registrati</Text>
						)}
					</TouchableOpacity>

					<View style={styles.loginContainer}>
						<Text style={styles.loginText}>Hai già un account? </Text>
						<TouchableOpacity onPress={() => navigation.goBack()}>
							<Text style={styles.loginLink}>Accedi</Text>
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
		backgroundColor: Colors.success,
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
	loginContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 20,
	},
	loginText: {
		color: Colors.textSecondary,
		fontSize: 14,
	},
	loginLink: {
		color: Colors.primary,
		fontSize: 14,
		fontWeight: '600',
	},
});
