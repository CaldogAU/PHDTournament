function getPlayedPairs() {
  const pairs = new Set();

  PHDTournament.state.rounds.forEach(round => {
    round.matches.forEach(match => {
      if (match.bye || !match.teamBId) return;

      const pair = [match.teamAId, match.teamBId].sort().join("::");
      pairs.add(pair);
    });
  });

  return pairs;
}

function teamsHavePlayed(teamAId, teamBId) {
  const pair = [teamAId, teamBId].sort().join("::");
  return getPlayedPairs().has(pair);
}

function chooseByeTeam(standings) {
  return [...standings].sort((a, b) => {
    return (
      a.byes - b.byes ||
      a.points - b.points ||
      getScoreDifference(a) - getScoreDifference(b) ||
      a.name.localeCompare(b.name)
    );
  })[0];
}

function createSwissPairings() {
  const teams = PHDTournament.state.teams;

  if (teams.length < 2) {
    alert("Add at least two teams before generating a round.");
    return null;
  }

  const roundNumber = PHDTournament.state.rounds.length + 1;
  const standings = getStandings();
  const available = [...standings];
  const matches = [];

  if (available.length % 2 === 1) {
    const byeTeam = chooseByeTeam(available);

    matches.push({
      id: crypto.randomUUID(),
      roundNumber,
      teamAId: byeTeam.id,
      teamBId: null,
      bye: true,
      completed: true,
      scoreA: null,
      scoreB: null,
      winnerId: byeTeam.id
    });

    available.splice(
      available.findIndex(team => team.id === byeTeam.id),
      1
    );
  }

  const unpaired = [...available];

  while (unpaired.length > 0) {
    const teamA = unpaired.shift();

    let opponentIndex = unpaired.findIndex(teamB =>
      !teamsHavePlayed(teamA.id, teamB.id)
    );

    if (opponentIndex === -1) {
      opponentIndex = 0;
    }

    const teamB = unpaired.splice(opponentIndex, 1)[0];

    matches.push({
      id: crypto.randomUUID(),
      roundNumber,
      teamAId: teamA.id,
      teamBId: teamB.id,
      bye: false,
      completed: false,
      scoreA: null,
      scoreB: null,
      winnerId: null
    });
  }

  return {
    id: crypto.randomUUID(),
    number: roundNumber,
    completed: false,
    createdAt: new Date().toISOString(),
    matches
  };
}

function generateRound() {
  const latestRound = PHDTournament.state.rounds.at(-1);

  if (latestRound && !latestRound.completed) {
    alert("Complete the current round before generating another one.");
    return;
  }

  const round = createSwissPairings();

  if (!round) return;

  PHDTournament.state.rounds.push(round);
  autosave();
  render();
}

function renderRounds() {
  const status = document.getElementById("roundStatus");
  const container = document.getElementById("roundsContainer");

  container.innerHTML = "";

  if (PHDTournament.state.rounds.length === 0) {
    status.textContent = "No rounds generated yet.";
    container.innerHTML = `
      <div class="empty-state">
        Add teams, then generate the first Swiss round.
      </div>
    `;
    return;
  }

  const completedRounds = PHDTournament.state.rounds.filter(round => round.completed).length;
  status.textContent = `${completedRounds} of ${PHDTournament.state.rounds.length} rounds completed.`;

  PHDTournament.state.rounds.forEach(round => {
    const card = document.createElement("article");
    card.className = "round-card";

    const matchesHtml = round.matches.map(match => {
      const teamA = getTeamById(match.teamAId);
      const teamB = getTeamById(match.teamBId);

      if (match.bye) {
        return `
          <div class="match-card bye-card">
            <div class="match-team">
              <span class="team-logo" style="background:${escapeHtml(teamA.colour || "#6d5dfc")}">
                ${renderTeamLogo(teamA)}
              </span>
              <strong>${escapeHtml(teamA.name)}</strong>
            </div>
            <span class="bye-pill">BYE</span>
            <div></div>
          </div>
        `;
      }

      return `
        <div class="match-card">
          <div class="match-team">
            <span class="team-logo" style="background:${escapeHtml(teamA.colour || "#6d5dfc")}">
              ${renderTeamLogo(teamA)}
            </span>
            <strong>${escapeHtml(teamA.name)}</strong>
          </div>

          <span class="vs-pill">VS</span>

          <div class="match-team">
            <span class="team-logo" style="background:${escapeHtml(teamB.colour || "#6d5dfc")}">
              ${renderTeamLogo(teamB)}
            </span>
            <strong>${escapeHtml(teamB.name)}</strong>
          </div>
        </div>
      `;
    }).join("");

    card.innerHTML = `
      <h3>Round ${round.number}</h3>
      <div class="match-list">
        ${matchesHtml}
      </div>
    `;

    container.appendChild(card);
  });
}

PHDTournament.modules.push("rounds");