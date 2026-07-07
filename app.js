const STORAGE_KEY = "phdTournamentState";

const defaultState = {
  tournamentName: "PHDlympics",
  description: "",
  settings: {
    winPoints: 3,
    drawPoints: 1,
    byePoints: 3
  },
  teams: [],
  rounds: []
};

let state = structuredClone(defaultState);

const pageTitle = document.getElementById("pageTitle");
const tournamentNameInput = document.getElementById("tournamentName");
const tournamentDescriptionInput = document.getElementById("tournamentDescription");
const winPointsInput = document.getElementById("winPoints");
const drawPointsInput = document.getElementById("drawPoints");
const byePointsInput = document.getElementById("byePoints");
const saveTournamentButton = document.getElementById("saveTournament");
const resetTournamentButton = document.getElementById("resetTournament");
const saveStatus = document.getElementById("saveStatus");

const teamInput = document.getElementById("teamInput");
const teamShortNameInput = document.getElementById("teamShortName");
const teamLogoInput = document.getElementById("teamLogo");
const teamColourInput = document.getElementById("teamColour");
const addTeamButton = document.getElementById("addTeam");

const teamList = document.getElementById("teamList");
const standingsBody = document.getElementById("standingsBody");
const themeToggle = document.getElementById("themeToggle");

const generateRoundButton = document.getElementById("generateRound");
const roundStatus = document.getElementById("roundStatus");
const roundsContainer = document.getElementById("roundsContainer");

let editingTeamId = null;

function setSaveStatus(message) {
  saveStatus.textContent = message;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  setSaveStatus("Saved");
}

function autosave() {
  setSaveStatus("Saving...");
  saveState();
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);

    state = {
      ...structuredClone(defaultState),
      ...parsed,
      settings: {
        ...defaultState.settings,
        ...(parsed.settings || {})
      },
      teams: parsed.teams || [],
      rounds: parsed.rounds || []
    };
  } catch {
    state = structuredClone(defaultState);
  }
}

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0].toUpperCase())
    .join("");
}

function createEmptyTeamStats(team) {
  return {
    ...team,
    points: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    byes: 0,
    pointsFor: 0,
    pointsAgainst: 0
  };
}

function recalculateStandings() {
  const stats = new Map();

  state.teams.forEach(team => {
    stats.set(team.id, createEmptyTeamStats(team));
  });

  state.rounds.forEach(round => {
    round.matches.forEach(match => {
      const teamA = stats.get(match.teamAId);
      const teamB = stats.get(match.teamBId);

      if (match.bye && teamA) {
        teamA.byes += 1;
        teamA.points += state.settings.byePoints;
        return;
      }

      if (!match.completed || !teamA || !teamB) return;

      const scoreA = Number(match.scoreA);
      const scoreB = Number(match.scoreB);

      teamA.pointsFor += scoreA;
      teamA.pointsAgainst += scoreB;
      teamB.pointsFor += scoreB;
      teamB.pointsAgainst += scoreA;

      if (scoreA > scoreB) {
        teamA.wins += 1;
        teamB.losses += 1;
        teamA.points += state.settings.winPoints;
      } else if (scoreB > scoreA) {
        teamB.wins += 1;
        teamA.losses += 1;
        teamB.points += state.settings.winPoints;
      } else {
        teamA.draws += 1;
        teamB.draws += 1;
        teamA.points += state.settings.drawPoints;
        teamB.points += state.settings.drawPoints;
      }
    });
  });

  state.teams = state.teams.map(team => {
    const updated = stats.get(team.id);
    return updated || createEmptyTeamStats(team);
  });
}

function getScoreDifference(team) {
  return (team.pointsFor || 0) - (team.pointsAgainst || 0);
}

function getSortedTeams() {
  recalculateStandings();

  return [...state.teams].sort((a, b) => {
    return (
      (b.points || 0) - (a.points || 0) ||
      getScoreDifference(b) - getScoreDifference(a) ||
      (b.pointsFor || 0) - (a.pointsFor || 0) ||
      a.name.localeCompare(b.name)
    );
  });
}

function getTeam(teamId) {
  return state.teams.find(team => team.id === teamId);
}

function havePlayed(teamAId, teamBId) {
  return state.rounds.some(round =>
    round.matches.some(match =>
      !match.bye &&
      match.completed &&
      (
        (match.teamAId === teamAId && match.teamBId === teamBId) ||
        (match.teamAId === teamBId && match.teamBId === teamAId)
      )
    )
  );
}

function renderTeamLogo(team) {
  if (!team) return "";

  if (team.logoUrl) {
    return `<img src="${team.logoUrl}" alt="${team.name} logo" onerror="this.remove()" />`;
  }

  return getInitials(team.shortName || team.name);
}

function renderMiniTeam(teamId) {
  const team = getTeam(teamId);

  if (!team) return `<span>Unknown team</span>`;

  return `
    <span class="team-logo" style="background:${team.colour || "#6d5dfc"}">
      ${renderTeamLogo(team)}
    </span>
    <strong>${team.shortName || team.name}</strong>
  `;
}

function render() {
  recalculateStandings();

  pageTitle.textContent = state.tournamentName || "Tournament Manager";

  tournamentNameInput.value = state.tournamentName;
  tournamentDescriptionInput.value = state.description;
  winPointsInput.value = state.settings.winPoints;
  drawPointsInput.value = state.settings.drawPoints;
  byePointsInput.value = state.settings.byePoints;

  renderTeams();
  renderRounds();
  renderStandings();
}

function renderTeams() {
  teamList.innerHTML = "";

  if (state.teams.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "No teams added yet.";
    teamList.appendChild(empty);
  }

  state.teams.forEach((team) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <div class="team-item">
        <div class="team-logo" style="background:${team.colour || "#6d5dfc"}">
          ${renderTeamLogo(team)}
        </div>
        <div class="team-meta">
          <strong>${team.name}</strong>
          <span>${team.shortName || "No short name"}</span>
        </div>
        <div class="team-actions">
          <button class="edit" data-id="${team.id}">Edit</button>
          <button class="delete" data-id="${team.id}">Delete</button>
        </div>
      </div>
    `;

    teamList.appendChild(li);
  });
}

function renderRounds() {
  roundsContainer.innerHTML = "";

  if (state.rounds.length === 0) {
    roundStatus.textContent = "No rounds generated yet.";
    roundsContainer.innerHTML = `<p class="muted">Generate your first round once teams have been added.</p>`;
    return;
  }

  const completedRounds = state.rounds.filter(round => round.completed).length;
  roundStatus.textContent = `${completedRounds} of ${state.rounds.length} rounds completed.`;

  state.rounds.forEach(round => {
    const card = document.createElement("article");
    card.className = `round-card ${round.completed ? "completed" : ""}`;

    const matches = round.matches.map(match => {
      if (match.bye) {
        return `
          <div class="match-card bye-card">
            <div class="match-team">${renderMiniTeam(match.teamAId)}</div>
            <div class="vs">BYE</div>
            <div><span class="badge done">Bye awarded</span></div>
          </div>
        `;
      }

      return `
        <div class="match-card" data-match-id="${match.id}" data-round-id="${round.id}">
          <div class="match-team">${renderMiniTeam(match.teamAId)}</div>

          <div class="score-entry">
            <input class="score-a" type="number" min="0" value="${match.scoreA ?? ""}" placeholder="0" />
            <span>–</span>
            <input class="score-b" type="number" min="0" value="${match.scoreB ?? ""}" placeholder="0" />
          </div>

          <div class="match-team">${renderMiniTeam(match.teamBId)}</div>

          <div class="match-actions">
            <button class="small-btn success save-match" data-round-id="${round.id}" data-match-id="${match.id}">
              Save
            </button>
            <button class="small-btn secondary clear-match" data-round-id="${round.id}" data-match-id="${match.id}">
              Clear
            </button>
          </div>
        </div>
      `;
    }).join("");

    card.innerHTML = `
      <div class="round-title-row">
        <div>
          <h3>Round ${round.number}</h3>
          <span class="badge ${round.completed ? "done" : ""}">
            ${round.completed ? "Completed" : "In progress"}
          </span>
        </div>
        <button class="small-btn ${round.completed ? "warning" : "success"} toggle-round" data-round-id="${round.id}">
          ${round.completed ? "Reopen Round" : "Complete Round"}
        </button>
      </div>
      <div class="match-grid">${matches}</div>
    `;

    roundsContainer.appendChild(card);
  });
}

function renderStandings() {
  standingsBody.innerHTML = "";

  getSortedTeams().forEach((team, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${team.name}</td>
      <td>${team.points || 0}</td>
      <td>${team.wins || 0}</td>
      <td>${team.draws || 0}</td>
      <td>${team.losses || 0}</td>
      <td>${team.byes || 0}</td>
      <td>${team.pointsFor || 0}</td>
      <td>${team.pointsAgainst || 0}</td>
      <td>${getScoreDifference(team)}</td>
    `;

    standingsBody.appendChild(row);
  });
}

function updateTournamentSettings() {
  state.tournamentName = tournamentNameInput.value.trim() || "Untitled Tournament";
  state.description = tournamentDescriptionInput.value.trim();

  state.settings.winPoints = Number(winPointsInput.value) || 3;
  state.settings.drawPoints = Number(drawPointsInput.value) || 0;
  state.settings.byePoints = Number(byePointsInput.value) || 0;

  autosave();
  render();
}

function clearTeamForm() {
  editingTeamId = null;
  teamInput.value = "";
  teamShortNameInput.value = "";
  teamLogoInput.value = "";
  teamColourInput.value = "#6d5dfc";
  addTeamButton.textContent = "Add Team";
}

function addOrUpdateTeam() {
  const name = teamInput.value.trim();
  const shortName = teamShortNameInput.value.trim();
  const logoUrl = teamLogoInput.value.trim();
  const colour = teamColourInput.value;

  if (!name) return;

  const duplicate = state.teams.some(team =>
    team.name.toLowerCase() === name.toLowerCase() &&
    team.id !== editingTeamId
  );

  if (duplicate) {
    alert("That team already exists.");
    return;
  }

  if (editingTeamId) {
    const team = state.teams.find(item => item.id === editingTeamId);

    if (!team) return;

    team.name = name;
    team.shortName = shortName;
    team.logoUrl = logoUrl;
    team.colour = colour;
  } else {
    state.teams.push({
      id: crypto.randomUUID(),
      name,
      shortName,
      logoUrl,
      colour,
      points: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      byes: 0,
      pointsFor: 0,
      pointsAgainst: 0
    });
  }

  clearTeamForm();
  autosave();
  render();
}

function editTeam(teamId) {
  const team = state.teams.find(item => item.id === teamId);

  if (!team) return;

  editingTeamId = team.id;
  teamInput.value = team.name;
  teamShortNameInput.value = team.shortName || "";
  teamLogoInput.value = team.logoUrl || "";
  teamColourInput.value = team.colour || "#6d5dfc";
  addTeamButton.textContent = "Save Team";
}

function chooseByeTeam(teams) {
  const sorted = [...teams].sort((a, b) => {
    return (
      (a.byes || 0) - (b.byes || 0) ||
      (a.points || 0) - (b.points || 0) ||
      a.name.localeCompare(b.name)
    );
  });

  return sorted[0];
}

function createSwissPairings() {
  if (state.teams.length < 2) {
    alert("Add at least two teams before generating a round.");
    return null;
  }

  recalculateStandings();

  const roundNumber = state.rounds.length + 1;
  const availableTeams = getSortedTeams().map(team => ({ ...team }));
  const matches = [];

  if (availableTeams.length % 2 === 1) {
    const byeTeam = chooseByeTeam(availableTeams);

    matches.push({
      id: crypto.randomUUID(),
      roundNumber,
      teamAId: byeTeam.id,
      teamBId: null,
      bye: true,
      completed: true
    });

    const byeIndex = availableTeams.findIndex(team => team.id === byeTeam.id);
    availableTeams.splice(byeIndex, 1);
  }

  const unpaired = [...availableTeams];

  while (unpaired.length > 0) {
    const teamA = unpaired.shift();

    let opponentIndex = unpaired.findIndex(teamB => !havePlayed(teamA.id, teamB.id));

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
    matches
  };
}

function generateRound() {
  const currentRound = state.rounds[state.rounds.length - 1];

  if (currentRound && !currentRound.completed) {
    alert("Complete the current round before generating the next one.");
    return;
  }

  const round = createSwissPairings();

  if (!round) return;

  state.rounds.push(round);
  autosave();
  render();
}

function findRoundAndMatch(roundId, matchId) {
  const round = state.rounds.find(item => item.id === roundId);

  if (!round) return { round: null, match: null };

  const match = round.matches.find(item => item.id === matchId);

  return { round, match };
}

function saveMatch(roundId, matchId, matchCard) {
  const { match } = findRoundAndMatch(roundId, matchId);

  if (!match || match.bye) return;

  const scoreAInput = matchCard.querySelector(".score-a");
  const scoreBInput = matchCard.querySelector(".score-b");

  const scoreA = Number(scoreAInput.value);
  const scoreB = Number(scoreBInput.value);

  if (Number.isNaN(scoreA) || Number.isNaN(scoreB) || scoreA < 0 || scoreB < 0) {
    alert("Enter valid non-negative scores.");
    return;
  }

  match.scoreA = scoreA;
  match.scoreB = scoreB;
  match.completed = true;

  if (scoreA > scoreB) {
    match.winnerId = match.teamAId;
  } else if (scoreB > scoreA) {
    match.winnerId = match.teamBId;
  } else {
    match.winnerId = null;
  }

  recalculateStandings();
  autosave();
  render();
}

function clearMatch(roundId, matchId) {
  const { match } = findRoundAndMatch(roundId, matchId);

  if (!match || match.bye) return;

  match.scoreA = null;
  match.scoreB = null;
  match.completed = false;
  match.winnerId = null;

  recalculateStandings();
  autosave();
  render();
}

function toggleRoundCompleted(roundId) {
  const round = state.rounds.find(item => item.id === roundId);

  if (!round) return;

  const incompleteMatches = round.matches.filter(match => !match.bye && !match.completed);

  if (!round.completed && incompleteMatches.length > 0) {
    alert("Complete every match in this round first.");
    return;
  }

  round.completed = !round.completed;

  autosave();
  render();
}

saveTournamentButton.addEventListener("click", updateTournamentSettings);

[
  tournamentNameInput,
  tournamentDescriptionInput,
  winPointsInput,
  drawPointsInput,
  byePointsInput
].forEach(input => {
  input.addEventListener("change", updateTournamentSettings);
});

addTeamButton.addEventListener("click", addOrUpdateTeam);

teamInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    addOrUpdateTeam();
  }
});

teamList.addEventListener("click", (event) => {
  const teamId = event.target.dataset.id;

  if (!teamId) return;

  if (event.target.classList.contains("edit")) {
    editTeam(teamId);
    return;
  }

  if (event.target.classList.contains("delete")) {
    const team = state.teams.find(item => item.id === teamId);

    if (!team) return;

    const confirmed = confirm(`Delete ${team.name}?`);

    if (!confirmed) return;

    state.teams = state.teams.filter(item => item.id !== teamId);

    autosave();
    render();
  }
});

generateRoundButton.addEventListener("click", generateRound);

roundsContainer.addEventListener("click", (event) => {
  const roundId = event.target.dataset.roundId;
  const matchId = event.target.dataset.matchId;

  if (event.target.classList.contains("save-match")) {
    const matchCard = event.target.closest(".match-card");
    saveMatch(roundId, matchId, matchCard);
    return;
  }

  if (event.target.classList.contains("clear-match")) {
    clearMatch(roundId, matchId);
    return;
  }

  if (event.target.classList.contains("toggle-round")) {
    toggleRoundCompleted(roundId);
  }
});

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

resetTournamentButton.addEventListener("click", () => {
  const confirmed = confirm("Reset the entire tournament? This cannot be undone.");

  if (!confirmed) return;

  state = structuredClone(defaultState);
  localStorage.removeItem(STORAGE_KEY);
  clearTeamForm();
  render();
  setSaveStatus("Reset");
});

loadState();
render();