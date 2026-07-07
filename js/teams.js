function getTeamFormValues() {
  return {
    name: document.getElementById("teamName").value.trim(),
    shortName: document.getElementById("teamShortName").value.trim(),
    logoUrl: document.getElementById("teamLogoUrl").value.trim(),
    colour: document.getElementById("teamColour").value || "#6d5dfc"
  };
}

function clearTeamForm() {
  PHDTournament.editingTeamId = null;

  document.getElementById("teamName").value = "";
  document.getElementById("teamShortName").value = "";
  document.getElementById("teamLogoUrl").value = "";
  document.getElementById("teamColour").value = "#6d5dfc";
  document.getElementById("saveTeam").textContent = "Add Team";
}

function createTeam(values) {
  return {
    id: crypto.randomUUID(),
    name: values.name,
    shortName: values.shortName,
    logoUrl: values.logoUrl,
    colour: values.colour,
    createdAt: new Date().toISOString()
  };
}

function saveTeamFromForm() {
  const values = getTeamFormValues();

  if (!values.name) {
    alert("Enter a team name.");
    return;
  }

  const duplicate = PHDTournament.state.teams.some(team =>
    team.name.toLowerCase() === values.name.toLowerCase() &&
    team.id !== PHDTournament.editingTeamId
  );

  if (duplicate) {
    alert("That team already exists.");
    return;
  }

  if (PHDTournament.editingTeamId) {
    const team = getTeamById(PHDTournament.editingTeamId);
    if (!team) return;

    team.name = values.name;
    team.shortName = values.shortName;
    team.logoUrl = values.logoUrl;
    team.colour = values.colour;
  } else {
    PHDTournament.state.teams.push(createTeam(values));
  }

  clearTeamForm();
  autosave();
  render();
}

function editTeam(teamId) {
  const team = getTeamById(teamId);
  if (!team) return;

  PHDTournament.editingTeamId = team.id;

  document.getElementById("teamName").value = team.name;
  document.getElementById("teamShortName").value = team.shortName || "";
  document.getElementById("teamLogoUrl").value = team.logoUrl || "";
  document.getElementById("teamColour").value = team.colour || "#6d5dfc";
  document.getElementById("saveTeam").textContent = "Save Team";
}

function deleteTeam(teamId) {
  const team = getTeamById(teamId);
  if (!team) return;

  const confirmed = confirm(`Delete ${team.name}?`);

  if (!confirmed) return;

  PHDTournament.state.teams =
    PHDTournament.state.teams.filter(item => item.id !== teamId);

  if (PHDTournament.editingTeamId === teamId) {
    clearTeamForm();
  }

  autosave();
  render();
}

function renderTeams() {
  const list = document.getElementById("teamList");

  list.innerHTML = "";

  if (PHDTournament.state.teams.length === 0) {
    list.innerHTML = `
      <li class="empty-state">
        No teams added yet. Add your first competitor above.
      </li>
    `;
    return;
  }

  PHDTournament.state.teams.forEach(team => {
    const item = document.createElement("li");
    item.className = "team-item";

    item.innerHTML = `
      <div class="team-logo" style="background:${escapeHtml(team.colour || "#6d5dfc")}">
        ${renderTeamLogo(team)}
      </div>

      <div class="team-meta">
        <strong>${escapeHtml(team.name)}</strong>
        <span>${escapeHtml(team.shortName || "No short name")} · ${escapeHtml(team.logoUrl || "No logo URL")}</span>
      </div>

      <div class="team-actions">
        <button class="small-button secondary edit-team" type="button" data-team-id="${team.id}">
          Edit
        </button>
        <button class="small-button danger delete-team" type="button" data-team-id="${team.id}">
          Delete
        </button>
      </div>
    `;

    list.appendChild(item);
  });
}

PHDTournament.modules.push("teams");