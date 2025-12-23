import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	useEffect(() => {
		checkAuth();
	}, []);

	const checkAuth = async () => {
		try {
			const isAuth = await authService.isAuthenticated();
			if (isAuth) {
				const storedUser = await authService.getStoredUser();
				setUser(storedUser);
				setIsAuthenticated(true);
			}
		} catch (error) {
			console.error('Error checking auth:', error);
		} finally {
			setLoading(false);
		}
	};

	const login = async (usernameOrEmail, password) => {
		try {
			const { user, token } = await authService.login(usernameOrEmail, password);
			setUser(user);
			setIsAuthenticated(true);
			return { success: true };
		} catch (error) {
			return { success: false, error };
		}
	};

	const signup = async (username, email, password) => {
		try {
			const { user, token } = await authService.signup(username, email, password);
			setUser(user);
			setIsAuthenticated(true);
			return { success: true };
		} catch (error) {
			return { success: false, error };
		}
	};

	const logout = async () => {
		await authService.logout();
		setUser(null);
		setIsAuthenticated(false);
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				loading,
				isAuthenticated,
				login,
				signup,
				logout,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};
