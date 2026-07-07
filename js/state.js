const PHDTournament = {
  modules: [],
  storageKey: "phdTournamentState",
  editingTeamId: null,
  defaultState: {
    appName: "PHDTournament",
    version: "0.3.0",
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