function getGames() {
  return PHDTournament.state.games || [];
}

function getGameById(gameId) {
  return getGames().find(game => game.id === gameId) || null;
}

function getGameLabel(gameId) {
  const game = getGameById(gameId);

  if (!game) return "No game selected";

  return game.platform
    ? `${game.name} (${game.platform})`
    : game.name;
}

function clearGameForm() {
  PHDTournament.editingGameId = null;

  setValue("gameName", "");
  setValue("gamePlatform", "");
  setValue("gameFormat", "");
  setValue("gameLogoUrl", "");

  const saveButton = getElement("saveGame");
  if (saveButton) saveButton.textContent = "Add Game";
}

function saveGameFromForm() {
  const name = getValue("gameName").trim();
  const platform = getValue("gamePlatform").trim();
  const format = getValue("gameFormat").trim();
  const logoUrl = getValue("gameLogoUrl").trim();

  if (isBlank(name)) {
    alert("Enter a game name.");
    return;
  }

  const games = getGames();

  if (!PHDTournament.editingGameId && games.length >= 5) {
    alert("This tournament supports up to 5 games.");
    return;
  }

  if (PHDTournament.editingGameId) {
    const game = getGameById(PHDTournament.editingGameId);

    if (!game) return;

    game.name = name;
    game.platform = platform;
    game.format = format;
    game.logoUrl = logoUrl;
  } else {
    games.push({
      id: crypto.randomUUID(),
      name,
      platform,
      format,
      logoUrl,
      createdAt: new Date().toISOString()
    });
  }

  autosave();
  clearGameForm();
  render();
}

function editGame(gameId) {
  const game = getGameById(gameId);

  if (!game) return;

  PHDTournament.editingGameId = game.id;

  setValue("gameName", game.name || "");
  setValue("gamePlatform", game.platform || "");
  setValue("gameFormat", game.format || "");
  setValue("gameLogoUrl", game.logoUrl || "");

  const saveButton = getElement("saveGame");
  if (saveButton) saveButton.textContent = "Update Game";
}

function deleteGame(gameId) {
  const game = getGameById(gameId);

  if (!game) return;

  const isUsed = PHDTournament.state.rounds.some(round =>
    round.matches.some(match => match.gameId === gameId)
  );

  if (isUsed) {
    alert("This game is already used in one or more matches and cannot be deleted.");
    return;
  }

  const confirmed = confirm(`Delete ${game.name}?`);
  if (!confirmed) return;

  PHDTournament.state.games = getGames().filter(item => item.id !== gameId);

  if (PHDTournament.editingGameId === gameId) {
    clearGameForm();
  }

  autosave();
  render();
}

function renderGameLogo(game) {
  if (game.logoUrl) {
    return `<img src="${escapeHtml(game.logoUrl)}" alt="${escapeHtml(game.name)} logo" onerror="this.remove()" />`;
  }

  return escapeHtml((game.name || "?").slice(0, 3).toUpperCase());
}

function renderGames() {
  const list = getElement("gameList");
  const count = getElement("gameCount");

  if (!list) return;

  const games = getGames();

  if (count) {
    count.textContent = `${games.length} / 5 games added`;
  }

  if (games.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        Add up to 5 video games for this tournament.
      </div>
    `;
    return;
  }

  list.innerHTML = games.map(game => `
    <li class="game-item">
      <span class="game-logo">
        ${renderGameLogo(game)}
      </span>

      <div class="game-meta">
        <strong>${escapeHtml(game.name)}</strong>
        <span>${escapeHtml(game.platform || "No platform listed")}</span>
        <span>${escapeHtml(game.format || "No format listed")}</span>
      </div>

      <div class="game-actions">
        <button class="small-button secondary edit-game" type="button" data-game-id="${game.id}">
          Edit
        </button>
        <button class="small-button danger delete-game" type="button" data-game-id="${game.id}">
          Delete
        </button>
      </div>
    </li>
  `).join("");
}

function buildGameOptions(selectedGameId = "") {
  const games = getGames();

  if (games.length === 0) {
    return `<option value="">No games added</option>`;
  }

  return [
    `<option value="">Select game</option>`,
    ...games.map(game => `
      <option value="${game.id}" ${game.id === selectedGameId ? "selected" : ""}>
        ${escapeHtml(getGameLabel(game.id))}
      </option>
    `)
  ].join("");
}

PHDTournament.modules.push("games");