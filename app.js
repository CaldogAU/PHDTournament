const state = {
  tournamentName: "PHDlympics",
  teams: []
};

const tournamentNameInput = document.getElementById("tournamentName");
const saveTournamentButton = document.getElementById("saveTournament");
const teamInput = document.getElementById("teamInput");
const addTeamButton = document.getElementById("addTeam");
const teamList = document.getElementById("teamList");
const standingsBody = document.getElementById("standingsBody");
const themeToggle = document.getElementById("themeToggle");

function saveState() {
  localStorage.setItem("phdTournamentState", JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem("phdTournamentState");

  if (!saved) return;

  const parsed = JSON.parse(saved);
  state.tournamentName = parsed.tournamentName || "PHDlympics";
  state.teams = parsed.teams || [];
}

function render() {
  tournamentNameInput.value = state.tournamentName;

  teamList.innerHTML = "";

  state.teams.forEach((team, index) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <span>${team.name}</span>
      <button class="delete" data-index="${index}">Delete</button>
    `;

    teamList.appendChild(li);
  });

  standingsBody.innerHTML = "";

  state.teams.forEach((team, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${team.name}</td>
      <td>${team.points}</td>
      <td>${team.wins}</td>
      <td>${team.draws}</td>
      <td>${team.losses}</td>
    `;

    standingsBody.appendChild(row);
  });
}

function addTeam() {
  const name = teamInput.value.trim();

  if (!name) return;

  state.teams.push({
    id: crypto.randomUUID(),
    name,
    points: 0,
    wins: 0,
    draws: 0,
    losses: 0
  });

  teamInput.value = "";
  saveState();
  render();
}

saveTournamentButton.addEventListener("click", () => {
  state.tournamentName = tournamentNameInput.value.trim() || "Untitled Tournament";
  saveState();
  render();
});

addTeamButton.addEventListener("click", addTeam);

teamInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    addTeam();
  }
});

teamList.addEventListener("click", (event) => {
  if (!event.target.classList.contains("delete")) return;

  const index = Number(event.target.dataset.index);
  state.teams.splice(index, 1);

  saveState();
  render();
});

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

loadState();
render();