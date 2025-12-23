import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { useLeague } from '../context/LeagueContext';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Auth Screens
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import LeaguesListScreen from '../screens/LeaguesListScreen';
import CreateLeagueScreen from '../screens/CreateLeagueScreen';
import JoinLeagueScreen from '../screens/JoinLeagueScreen';
import FormationScreen from '../screens/FormationScreen';
import FreeAgentsScreen from '../screens/FreeAgentsScreen';
import CompetitionsScreen from '../screens/CompetitionsScreen';
import CreateCompetitionScreen from '../screens/CreateCompetitionScreen';
import CompetitionDetailScreen from '../screens/CompetitionDetailScreen';
import ParticipantsScreen from '../screens/ParticipantsScreen';
import LeagueSettingsScreen from '../screens/LeagueSettingsScreen';
import TeamScreen from '../screens/TeamScreen';
import CalendarScreen from '../screens/CalendarScreen';
import StandingsScreen from '../screens/StandingsScreen';
import TeamDetailScreen from '../screens/TeamDetailScreen';
import PlayerDetailScreen from '../screens/PlayerDetailScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator per le schermate principali (quando una lega è selezionata)
function MainTabs() {
	return (
		<Tab.Navigator
			screenOptions={({ route }) => ({
				tabBarIcon: ({ focused, color, size }) => {
					let iconName;

					if (route.name === 'Home') {
						iconName = focused ? 'home' : 'home-outline';
					} else if (route.name === 'Team') {
						iconName = focused ? 'shirt' : 'shirt-outline';
					} else if (route.name === 'Calendar') {
						iconName = focused ? 'calendar' : 'calendar-outline';
					} else if (route.name === 'Standings') {
						iconName = focused ? 'trophy' : 'trophy-outline';
					}

					return <Ionicons name={iconName} size={size} color={color} />;
				},
				tabBarActiveTintColor: '#3498db',
				tabBarInactiveTintColor: 'gray',
				tabBarLabel: route.name === 'Home' ? 'Home' :
					route.name === 'Team' ? 'Squadra' :
						route.name === 'Calendar' ? 'Calendario' :
							route.name === 'Standings' ? 'Classifica' : '',
				headerShown: false,
			})}
		>
			<Tab.Screen name="Home" component={HomeScreen} />
			<Tab.Screen name="Team" component={TeamScreen} />
			<Tab.Screen name="Calendar" component={CalendarScreen} />
			<Tab.Screen name="Standings" component={StandingsScreen} />
		</Tab.Navigator>
	);
}

export default function Navigation() {
	const { isAuthenticated, loading } = useAuth();
	const { selectedLeague } = useLeague();

	if (loading) {
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
				<ActivityIndicator size="large" color="#3498db" />
			</View>
		);
	}

	return (
		<NavigationContainer>
			<Stack.Navigator>
				{!isAuthenticated ? (
					<>
						<Stack.Screen
							name="Login"
							component={LoginScreen}
							options={{ headerShown: false }}
						/>
						<Stack.Screen
							name="Signup"
							component={SignupScreen}
							options={{ headerShown: false }}
						/>
					</>
				) : (
					<>
						<Stack.Screen
							name="LeaguesList"
							component={LeaguesListScreen}
							options={{ headerShown: false }}
						/>
						<Stack.Screen
							name="MainTabs"
							component={MainTabs}
							options={{ headerShown: false }}
						/>
						<Stack.Screen
							name="CreateLeague"
							component={CreateLeagueScreen}
							options={{ headerShown: false }}
						/>
						<Stack.Screen
							name="JoinLeague"
							component={JoinLeagueScreen}
							options={{ headerShown: false }}
						/>
						<Stack.Screen
							name="Formation"
							component={FormationScreen}
							options={{ headerShown: false }}
						/>
						<Stack.Screen
							name="FreeAgents"
							component={FreeAgentsScreen}
							options={{ headerShown: false }}
						/>
						<Stack.Screen
							name="Competitions"
							component={CompetitionsScreen}
							options={{ headerShown: false }}
						/>
						<Stack.Screen
							name="CreateCompetition"
							component={CreateCompetitionScreen}
							options={{ headerShown: false }}
						/>
						<Stack.Screen
							name="CompetitionDetail"
							component={CompetitionDetailScreen}
							options={{ headerShown: false }}
						/>
						<Stack.Screen
							name="Participants"
							component={ParticipantsScreen}
							options={{ headerShown: false }}
						/>
						<Stack.Screen
							name="LeagueSettings"
							component={LeagueSettingsScreen}
							options={{ headerShown: false }}
						/>
						<Stack.Screen
							name="TeamDetail"
							component={TeamDetailScreen}
							options={{ headerShown: false }}
						/>
						<Stack.Screen
							name="PlayerDetail"
							component={PlayerDetailScreen}
							options={{ headerShown: false }}
						/>
					</>
				)}
			</Stack.Navigator>
		</NavigationContainer>
	);
}
