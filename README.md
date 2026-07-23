# PHDTournament

PHDTournament is a browser-based Swiss-style tournament manager.

## Features

- Tournament setup
- Team management
- Team colours and logo URLs
- Tournament logo, banner and accent colour branding
- Swiss-style round generation
- Automatic byes
- Score entry
- Live standings
- Dashboard statistics
- Match history
- Full tournament report
- JSON export/import
- CSV export for standings and matches
- Restore points
- Print-friendly tournament report
- Public display mode
- Local browser autosave
- Light/dark theme toggle

## How to use

Open `index.html` in a browser.

No server is required.

## Recommended workflow

1. Add tournament details.
2. Add teams.
3. Generate Round 1.
4. Enter match scores.
5. Complete the round.
6. Generate the next round.
7. Export JSON regularly as a backup.

## Data storage

Tournament data is saved in browser Local Storage.

Use **Export JSON** to back up a tournament.
Use **Import JSON** to restore or move a tournament to another device.
Use **Create Restore Point** before making major changes.

## Display mode

Use **Display Mode** for a TV or projector-friendly public display.

Display Mode includes:

- Top standings
- Current round
- Large digital clock
- Scrolling recent-results ticker
- Fullscreen request button
- Escape key exit

## Notes

Clearing browser data may delete locally saved tournaments.

Always export a JSON backup before resetting, clearing browser storage, or moving devices.

## Development

Run the regression tests with:

```text
npm test
```

The tests use Node.js' built-in test runner and require no package installation.
