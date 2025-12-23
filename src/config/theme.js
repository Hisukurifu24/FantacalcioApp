/**
 * App Theme Configuration
 * Palette colori per l'app Fantacalcio
 */

export const Colors = {
	// Primary Colors
	primary: '#2F3E8F',      // Blu principale
	primaryLight: '#E8EAF6', // Blu chiaro per sfondi
	secondary: '#1E255E',    // Blu scuro/secondario

	// Accent Colors
	success: '#6BCF8E',      // Verde per CTA e successo
	highlight: '#F5D547',    // Giallo per punteggi e premi

	// Background & Cards
	background: '#FFFFFF',   // Sfondo principale
	card: '#FFFFFF',         // Card e componenti

	// Text & Icons
	text: '#1A1F3C',         // Testo principale
	textSecondary: '#6B7280', // Testo secondario
	textLight: '#9CA3AF',    // Testo chiaro

	// Functional Colors
	error: '#EF4444',        // Errori
	errorLight: '#FFEBEE',   // Sfondo errori
	warning: '#F59E0B',      // Warning
	info: '#3B82F6',         // Info

	// Neutral Colors
	white: '#FFFFFF',
	gray100: '#F3F4F6',
	gray200: '#E5E7EB',
	gray300: '#D1D5DB',
	gray400: '#9CA3AF',
	gray500: '#6B7280',
	gray600: '#4B5563',
	gray700: '#374151',
	gray800: '#1F2937',
	gray900: '#111827',

	// Shadows
	shadow: 'rgba(26, 31, 60, 0.1)',
	shadowDark: 'rgba(26, 31, 60, 0.2)',
};

// Dark Theme Palette (opzionale per futuro)
export const DarkColors = {
	primary: '#2F3E8F',
	secondary: '#1E255E',
	success: '#6BCF8E',
	highlight: '#F5D547',
	background: '#1A1F3C',
	card: '#1E255E',
	text: '#FFFFFF',
	textSecondary: '#D1D5DB',
	textLight: '#9CA3AF',
};

// Typography
export const Typography = {
	h1: {
		fontSize: 32,
		fontWeight: 'bold',
		color: Colors.text,
	},
	h2: {
		fontSize: 24,
		fontWeight: 'bold',
		color: Colors.text,
	},
	h3: {
		fontSize: 20,
		fontWeight: '600',
		color: Colors.text,
	},
	body: {
		fontSize: 16,
		color: Colors.text,
	},
	bodySmall: {
		fontSize: 14,
		color: Colors.textSecondary,
	},
	caption: {
		fontSize: 12,
		color: Colors.textLight,
	},
};

// Common Styles
export const CommonStyles = {
	container: {
		flex: 1,
		backgroundColor: Colors.background,
	},
	card: {
		backgroundColor: Colors.card,
		borderRadius: 12,
		padding: 16,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 3,
	},
	button: {
		backgroundColor: Colors.primary,
		borderRadius: 8,
		padding: 16,
		alignItems: 'center',
		justifyContent: 'center',
	},
	buttonSuccess: {
		backgroundColor: Colors.success,
		borderRadius: 8,
		padding: 16,
		alignItems: 'center',
		justifyContent: 'center',
	},
	buttonText: {
		color: Colors.white,
		fontSize: 16,
		fontWeight: '600',
	},
	input: {
		backgroundColor: Colors.white,
		borderWidth: 1,
		borderColor: Colors.gray300,
		borderRadius: 8,
		padding: 12,
		fontSize: 16,
		color: Colors.text,
	},
};

export default {
	Colors,
	DarkColors,
	Typography,
	CommonStyles,
};
