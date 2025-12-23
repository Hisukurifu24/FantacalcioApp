import React, { createContext, useState, useContext } from 'react';

const LeagueContext = createContext(undefined);

export const LeagueProvider = ({ children }) => {
	const [selectedLeague, setSelectedLeague] = useState(null);

	const selectLeague = (league) => {
		setSelectedLeague(league);
	};

	const clearLeague = () => {
		setSelectedLeague(null);
	};

	return (
		<LeagueContext.Provider
			value={{
				selectedLeague,
				selectLeague,
				clearLeague,
			}}
		>
			{children}
		</LeagueContext.Provider>
	);
};

export const useLeague = () => {
	const context = useContext(LeagueContext);
	if (context === undefined) {
		throw new Error('useLeague must be used within a LeagueProvider');
	}
	return context;
};
