const PHDTournament = {
  modules: [],
  storageKey: "phdTournamentState",
  defaultState: {
    appName: "PHDTournament",
    version: "0.2.0",
    tournament: {
      name: "PHDlympics",
      description: "",
      settings: {
        winPoints: 3,
        drawPoints: 1,
        byePoints: 3
      }
    },
    teams: [],
    rounds: []
  },
  state: null
};

PHDTournament.state = structuredClone(PHDTournament.defaultState);

PHDTournament.modules.push("state");