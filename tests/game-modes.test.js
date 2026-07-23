const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadGameModes(overrides = {}) {
  const source = fs.readFileSync(
    path.join(
      __dirname,
      "..",
      "js",
      "game-modes.js"
    ),
    "utf8"
  );

  const window = {
    ...overrides
  };

  vm.runInNewContext(source, {
    window
  });

  return window.PHDGameModes;
}

test("registers the supported game modes", () => {
  const gameModes = loadGameModes();

  assert.deepEqual(
    Array.from(
      gameModes.list(),
      mode => mode.id
    ),
    [
      "swiss",
      "time-trial",
      "grand-prix"
    ]
  );
});

test("migrates missing and unknown modes to Swiss", () => {
  const gameModes = loadGameModes();
  const games = [
    {
      id: "missing"
    },
    {
      id: "unknown",
      mode: "knockout"
    },
    {
      id: "known",
      mode: "time-trial"
    }
  ];

  assert.equal(
    gameModes.migrateGames(games),
    true
  );

  assert.deepEqual(
    games.map(game => game.mode),
    [
      "swiss",
      "swiss",
      "time-trial"
    ]
  );
});

test("dispatches Swiss round generation through the registry", () => {
  const expectedRound = {
    id: "round-1"
  };
  const expectedContext = {
    state: {
      rounds: []
    }
  };
  let receivedContext = null;

  const gameModes = loadGameModes({
    createSwissPairings(context) {
      receivedContext = context;
      return expectedRound;
    }
  });

  assert.equal(
    gameModes.createNextRound(
      "swiss",
      expectedContext
    ),
    expectedRound
  );
  assert.equal(
    receivedContext,
    expectedContext
  );
});

test("rejects round generation for modes without rounds", () => {
  const gameModes = loadGameModes();

  assert.throws(
    () =>
      gameModes.createNextRound(
        "time-trial"
      ),
    /does not support round generation/
  );
});

test("keeps time trial results hidden until every team finishes", () => {
  const gameModes = loadGameModes();
  const incomplete = gameModes.buildResult(
    gameModes.get("time-trial"),
    {
      teamIds: [
        "team-a",
        "team-b"
      ],
      submissions: [
        {
          teamId: "team-a",
          teamName: "Alpha",
          timeMilliseconds: 62000
        }
      ]
    }
  );

  assert.equal(incomplete.complete, false);
  assert.equal(
    incomplete.revealResults,
    false
  );

  const complete = gameModes.buildResult(
    gameModes.get("time-trial"),
    {
      teamIds: [
        "team-a",
        "team-b"
      ],
      submissions: [
        {
          teamId: "team-a",
          teamName: "Alpha",
          timeMilliseconds: 62000
        },
        {
          teamId: "team-b",
          teamName: "Bravo",
          timeMilliseconds: 59000
        }
      ]
    }
  );

  assert.equal(complete.complete, true);
  assert.equal(
    complete.revealResults,
    true
  );
  assert.deepEqual(
    complete.leaderboard.map(entry => [
      entry.teamId,
      entry.position,
      entry.championshipPoints
    ]),
    [
      [
        "team-b",
        1,
        2
      ],
      [
        "team-a",
        2,
        1
      ]
    ]
  );
});

test("ranks Grand Prix results by finishing position", () => {
  const gameModes = loadGameModes();
  const result = gameModes.buildResult(
    gameModes.get("grand-prix"),
    {
      teamIds: [
        "team-a",
        "team-b",
        "team-c"
      ],
      results: [
        {
          teamId: "team-a",
          teamName: "Alpha",
          finishPosition: 2
        },
        {
          teamId: "team-b",
          teamName: "Bravo",
          finishPosition: 1
        },
        {
          teamId: "team-c",
          teamName: "Charlie",
          finishPosition: 3
        }
      ]
    }
  );

  assert.equal(result.complete, true);
  assert.deepEqual(
    result.leaderboard.map(entry => [
      entry.teamId,
      entry.position,
      entry.championshipPoints
    ]),
    [
      [
        "team-b",
        1,
        3
      ],
      [
        "team-a",
        2,
        2
      ],
      [
        "team-c",
        3,
        1
      ]
    ]
  );
});
