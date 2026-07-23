function getEventGames() {
  return getGames().filter(game => {
    const mode = game.mode || "swiss";

    return (
      mode === "time-trial" ||
      mode === "grand-prix"
    );
  });
}

function getEventByGameId(gameId) {
  return (
    PHDTournament.state.events.find(
      event => event.gameId === gameId
    ) || null
  );
}

function getEventResultForTeam(
  event,
  teamId
) {
  if (
    !event ||
    !Array.isArray(event.results)
  ) {
    return null;
  }

  return (
    event.results.find(
      result =>
        result.teamId === teamId
    ) || null
  );
}

function renderEventGameOptions() {
  const select =
    getElement("eventGameSelect");

  if (!select) {
    return;
  }

  const selectedGameId =
    select.value;

  const games =
    getEventGames();

  select.innerHTML = [
    `
      <option value="">
        Select a Time Trial or Grand Prix game
      </option>
    `,
    ...games.map(game => {
      const existingEvent =
        getEventByGameId(game.id);

      return `
        <option
          value="${game.id}"
          ${
            game.id === selectedGameId
              ? "selected"
              : ""
          }
          ${
            existingEvent
              ? "disabled"
              : ""
          }
        >
          ${escapeHtml(game.name)}
          — ${escapeHtml(
            getGameModeLabel(game)
          )}
          ${
            existingEvent
              ? " (event already created)"
              : ""
          }
        </option>
      `;
    })
  ].join("");
}

function renderTimeTrialEntries(
  event
) {
  const teams =
    Array.isArray(
      PHDTournament.state.teams
    )
      ? PHDTournament.state.teams
      : [];

  if (teams.length === 0) {
    return `
      <div class="empty-state">
        Add teams before entering Time Trial results.
      </div>
    `;
  }

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Team</th>
            <th>Minutes</th>
            <th>Seconds</th>
            <th>Milliseconds</th>
          </tr>
        </thead>

        <tbody>
          ${teams
            .map(team => {
              const result =
                getEventResultForTeam(
                  event,
                  team.id
                );

              const totalMilliseconds =
                result &&
                Number.isFinite(
                  Number(
                    result.timeMilliseconds
                  )
                )
                  ? Number(
                      result.timeMilliseconds
                    )
                  : null;

              const minutes =
                totalMilliseconds == null
                  ? ""
                  : Math.floor(
                      totalMilliseconds /
                        60000
                    );

              const seconds =
                totalMilliseconds == null
                  ? ""
                  : Math.floor(
                      (
                        totalMilliseconds %
                        60000
                      ) / 1000
                    );

              const milliseconds =
                totalMilliseconds == null
                  ? ""
                  : totalMilliseconds %
                    1000;

              return `
                <tr
                  data-event-id="${event.id}"
                  data-team-id="${team.id}"
                >
                  <td>
                    <strong>
                      ${escapeHtml(
                        team.name
                      )}
                    </strong>
                  </td>

                  <td>
                    <input
                      class="time-minutes"
                      type="number"
                      min="0"
                      step="1"
                      value="${minutes}"
                      placeholder="0"
                      ${
                        event.completed
                          ? "disabled"
                          : ""
                      }
                    />
                  </td>

                  <td>
                    <input
                      class="time-seconds"
                      type="number"
                      min="0"
                      max="59"
                      step="1"
                      value="${seconds}"
                      placeholder="00"
                      ${
                        event.completed
                          ? "disabled"
                          : ""
                      }
                    />
                  </td>

                  <td>
                    <input
                      class="time-milliseconds"
                      type="number"
                      min="0"
                      max="999"
                      step="1"
                      value="${milliseconds}"
                      placeholder="000"
                      ${
                        event.completed
                          ? "disabled"
                          : ""
                      }
                    />
                  </td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>

    ${
      event.completed
        ? ""
        : `
          <div class="button-row">
            <button
              class="save-time-trial-results"
              type="button"
              data-event-id="${event.id}"
            >
              Save Times
            </button>
          </div>
        `
    }
  `;
}

function renderGrandPrixEntries(
  event
) {
  const teams =
    PHDTournament.state.teams;

  if (teams.length === 0) {
    return `
      <div class="empty-state">
        Add teams before entering Grand Prix results.
      </div>
    `;
  }

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Team</th>
            <th>Finishing Position</th>
          </tr>
        </thead>
        <tbody>
          ${teams.map(team => {
            const result =
              getEventResultForTeam(
                event,
                team.id
              );

            return `
              <tr
                data-event-id="${event.id}"
                data-team-id="${team.id}"
              >
                <td>
                  <strong>
                    ${escapeHtml(team.name)}
                  </strong>
                </td>
                <td>
                  <input
                    class="finish-position"
                    type="number"
                    min="1"
                    max="${teams.length}"
                    step="1"
                    value="${
                      result
                        ? result.finishPosition
                        : ""
                    }"
                    ${
                      event.completed
                        ? "disabled"
                        : ""
                    }
                  />
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>

    ${
      event.completed
        ? ""
        : `
          <div class="button-row">
            <button
              class="save-grand-prix-results"
              type="button"
              data-event-id="${event.id}"
            >
              Save Finishing Order
            </button>
          </div>
        `
    }
  `;
}

function renderEventGameManagement(
  game
) {
  const event =
    getEventByGameId(game.id);
  const modeName =
    getGameModeLabel(game);

  if (!event) {
    return `
      <section class="card wide">
        <div class="section-heading">
          <div>
            <p class="eyebrow">
              ${escapeHtml(modeName)}
            </p>
            <h2>Event Management</h2>
            <p class="muted">
              Create this event to begin entering results.
            </p>
          </div>
          <button
            class="create-game-event"
            type="button"
            data-game-id="${game.id}"
          >
            Create Event
          </button>
        </div>
      </section>
    `;
  }

  return `
    <section
      class="card wide"
      data-event-workspace="${event.id}"
    >
      <div class="section-heading">
        <div>
          <p class="eyebrow">
            ${escapeHtml(modeName)}
          </p>
          <h2>Event Management</h2>
          <p class="muted">
            ${
              event.completed
                ? "Results completed"
                : "Enter results for every team"
            }
          </p>
        </div>
        <div class="button-row">
          <span
            class="status-pill ${
              event.completed
                ? "completed"
                : "open"
            }"
          >
            ${
              event.completed
                ? "Completed"
                : "Open"
            }
          </span>
          ${
            event.completed
              ? `
                <button
                  class="secondary reopen-game-event"
                  type="button"
                  data-event-id="${event.id}"
                >
                  Reopen Results
                </button>
              `
              : ""
          }
        </div>
      </div>

      ${
        event.mode === "time-trial"
          ? renderTimeTrialEntries(event)
          : renderGrandPrixEntries(event)
      }
    </section>
  `;
}

function getEventAuditDetails(event) {
  return {
    eventId: event.id,
    gameId: event.gameId,
    mode: event.mode,
    completed: Boolean(event.completed),
    createdAt: event.createdAt || "",
    resultCount: Array.isArray(event.results)
      ? event.results.length
      : 0
  };
}

async function createEvent(gameId) {
  if (
    typeof requireAdminForAction ===
      "function" &&
    !requireAdminForAction()
  ) {
    return;
  }

  if (!gameId) {
    alert(
      "The game could not be identified."
    );

    return;
  }

  const game =
    getGameById(gameId);

  if (!game) {
    alert(
      "The selected game could not be found."
    );

    return;
  }

  const mode =
    game.mode || "swiss";

  if (
    mode !== "time-trial" &&
    mode !== "grand-prix"
  ) {
    alert(
      "Only Time Trial and Grand Prix games can create events."
    );

    return;
  }

  if (getEventByGameId(gameId)) {
    alert(
      "An event already exists for this game."
    );

    return;
  }

  const event = {
    id: crypto.randomUUID(),
    gameId,
    mode,
    completed: false,
    createdAt:
      new Date().toISOString(),
    updatedAt:
      new Date().toISOString(),
    results: []
  };

  PHDTournament.state.events.push(
    event
  );

  render();

  try {
    await saveState();

    if (
      typeof recordAuditEntry ===
      "function"
    ) {
      await recordAuditEntry(
        "event.created",
        `Created ${getGameModeLabel(
          game
        )} event for ${game.name}.`,
        {
          event:
            getEventAuditDetails(
              event
            )
        }
      );
    }
  } catch (error) {
    PHDTournament.state.events =
      PHDTournament.state.events.filter(
        existingEvent =>
          existingEvent.id !== event.id
      );

    render();

    console.error(
      "The event could not be saved.",
      error
    );

    alert(
      error && error.message
        ? error.message
        : "The event could not be saved."
    );
  }
}

function getEventById(eventId) {
  return (
    PHDTournament.state.events.find(
      event => event.id === eventId
    ) || null
  );
}

async function persistEventResults(
  event,
  results,
  summary
) {
  const previousEvent =
    structuredClone(event);

  event.results = results;
  event.completed = true;
  event.updatedAt =
    new Date().toISOString();
  render();

  try {
    await saveState();

    if (
      typeof recordAuditEntry ===
      "function"
    ) {
      await recordAuditEntry(
        "event.results.completed",
        summary,
        {
          event:
            getEventAuditDetails(
              event
            )
        }
      );
    }
  } catch (error) {
    Object.assign(
      event,
      previousEvent
    );
    render();
    console.error(
      "Event results could not be saved.",
      error
    );
    alert(
      error && error.message
        ? error.message
        : "Event results could not be saved."
    );
  }
}

async function saveTimeTrialResults(
  eventId
) {
  const event =
    getEventById(eventId);
  const workspace =
    document.querySelector(
      `[data-event-workspace="${eventId}"]`
    );

  if (!event || !workspace) {
    return;
  }

  const rows = [
    ...workspace.querySelectorAll(
      "tr[data-team-id]"
    )
  ];
  const results = [];

  for (const row of rows) {
    const minutes = Number(
      row.querySelector(
        ".time-minutes"
      ).value
    );
    const seconds = Number(
      row.querySelector(
        ".time-seconds"
      ).value
    );
    const milliseconds = Number(
      row.querySelector(
        ".time-milliseconds"
      ).value
    );

    if (
      !Number.isInteger(minutes) ||
      minutes < 0 ||
      !Number.isInteger(seconds) ||
      seconds < 0 ||
      seconds > 59 ||
      !Number.isInteger(milliseconds) ||
      milliseconds < 0 ||
      milliseconds > 999
    ) {
      alert(
        "Enter a valid time for every team."
      );
      return;
    }

    results.push({
      teamId: row.dataset.teamId,
      timeMilliseconds:
        minutes * 60000 +
        seconds * 1000 +
        milliseconds
    });
  }

  await persistEventResults(
    event,
    results,
    "Completed Time Trial results."
  );
}

async function saveGrandPrixResults(
  eventId
) {
  const event =
    getEventById(eventId);
  const workspace =
    document.querySelector(
      `[data-event-workspace="${eventId}"]`
    );

  if (!event || !workspace) {
    return;
  }

  const rows = [
    ...workspace.querySelectorAll(
      "tr[data-team-id]"
    )
  ];
  const results = rows.map(row => ({
    teamId: row.dataset.teamId,
    finishPosition: Number(
      row.querySelector(
        ".finish-position"
      ).value
    )
  }));
  const positions = results.map(
    result => result.finishPosition
  );
  const validPositions =
    positions.every(
      position =>
        Number.isInteger(position) &&
        position >= 1 &&
        position <= rows.length
    ) &&
    new Set(positions).size ===
      rows.length;

  if (!validPositions) {
    alert(
      "Assign every team a unique finishing position."
    );
    return;
  }

  await persistEventResults(
    event,
    results,
    "Completed Grand Prix results."
  );
}

async function reopenEvent(eventId) {
  const event =
    getEventById(eventId);

  if (!event) {
    return;
  }

  event.completed = false;
  event.updatedAt =
    new Date().toISOString();
  render();

  try {
    await saveState();
  } catch (error) {
    event.completed = true;
    render();
    alert(
      error && error.message
        ? error.message
        : "The event could not be reopened."
    );
  }
}

function initialiseEventControls() {
  document.addEventListener(
    "click",
    event => {
      const target = event.target;
      const isEventAction =
        target.classList.contains(
          "create-game-event"
        ) ||
        target.classList.contains(
          "save-time-trial-results"
        ) ||
        target.classList.contains(
          "save-grand-prix-results"
        ) ||
        target.classList.contains(
          "reopen-game-event"
        );

      if (!isEventAction) {
        return;
      }

      if (
        typeof requireAdminForAction ===
          "function" &&
        !requireAdminForAction()
      ) {
        return;
      }

      if (
        target.classList.contains(
          "create-game-event"
        )
      ) {
        createEvent(
          target.dataset.gameId
        );
      } else if (
        target.classList.contains(
          "save-time-trial-results"
        )
      ) {
        saveTimeTrialResults(
          target.dataset.eventId
        );
      } else if (
        target.classList.contains(
          "save-grand-prix-results"
        )
      ) {
        saveGrandPrixResults(
          target.dataset.eventId
        );
      } else if (
        target.classList.contains(
          "reopen-game-event"
        )
      ) {
        reopenEvent(
          target.dataset.eventId
        );
      }
    }
  );
}

document.addEventListener(
  "DOMContentLoaded",
  initialiseEventControls
);

PHDTournament.modules.push("events");
