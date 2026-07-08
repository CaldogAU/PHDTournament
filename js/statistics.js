function getCompletedMatches() {
  return PHDTournament.state.rounds.flatMap(round =>
    round.matches.filter(match => !match.bye && match.completed)
  );
}

function getHighestScore() {
  const completedMatches = getCompletedMatches();

  if (completedMatches.length === 0) return 0;

  return Math.max(
    ...completedMatches.flatMap(match => [
      Number(match.scoreA) || 0,
      Number(match.scoreB) || 0
    ])
  );
}

function getLargestMargin() {
  const completedMatches = getCompletedMatches();

  if (completedMatches.length === 0) return 0;

  return Math.max(
    ...completedMatches.map(match =>
      Math.abs((Number(match.scoreA) || 0) - (Number(match.scoreB) || 0))
    )
  );
}

function getLeaderName() {
  const standings = getStandings();

  if (standings.length === 0) return "—";

  return standings[0].shortName || standings[0].name;
}

function renderStatistics() {
  document.getElementById("statTeams").textContent =
    PHDTournament.state.teams.length;

  document.getElementById("statRounds").textContent =
    PHDTournament.state.rounds.length;

  document.getElementById("statCompletedMatches").textContent =
    getCompletedMatches().length;

  document.getElementById("statLeader").textContent =
    getLeaderName();

  document.getElementById("statHighestScore").textContent =
    getHighestScore();

  document.getElementById("statLargestMargin").textContent =
    getLargestMargin();
}

PHDTournament.modules.push("statistics");