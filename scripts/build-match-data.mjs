// Converts a Cricsheet ball-by-ball JSON file into the compact format the app replays.
// Usage: node scripts/build-match-data.mjs data/cricsheet/1415755.json src/data/match.json
//
// The match result and player of the match are deliberately dropped: the app replays
// the game as if it were live, so nothing downstream (UI or AI prompts) can spoil it.

import { readFileSync, writeFileSync } from "node:fs";

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
  console.error("Usage: node scripts/build-match-data.mjs <cricsheet.json> <out.json>");
  process.exit(1);
}

// Cricsheet uses scorecard initials; fans use these names.
const PLAYER_NAMES = {
  "RG Sharma": { name: "Rohit Sharma", short: "Rohit" },
  "V Kohli": { name: "Virat Kohli", short: "Kohli" },
  "RR Pant": { name: "Rishabh Pant", short: "Pant" },
  "SA Yadav": { name: "Suryakumar Yadav", short: "Suryakumar" },
  "AR Patel": { name: "Axar Patel", short: "Axar" },
  "S Dube": { name: "Shivam Dube", short: "Dube" },
  "HH Pandya": { name: "Hardik Pandya", short: "Hardik" },
  "RA Jadeja": { name: "Ravindra Jadeja", short: "Jadeja" },
  "Kuldeep Yadav": { name: "Kuldeep Yadav", short: "Kuldeep" },
  "Arshdeep Singh": { name: "Arshdeep Singh", short: "Arshdeep" },
  "JJ Bumrah": { name: "Jasprit Bumrah", short: "Bumrah" },
  "RR Hendricks": { name: "Reeza Hendricks", short: "Hendricks" },
  "Q de Kock": { name: "Quinton de Kock", short: "de Kock" },
  "AK Markram": { name: "Aiden Markram", short: "Markram" },
  "T Stubbs": { name: "Tristan Stubbs", short: "Stubbs" },
  "H Klaasen": { name: "Heinrich Klaasen", short: "Klaasen" },
  "DA Miller": { name: "David Miller", short: "Miller" },
  "M Jansen": { name: "Marco Jansen", short: "Jansen" },
  "KA Maharaj": { name: "Keshav Maharaj", short: "Maharaj" },
  "K Rabada": { name: "Kagiso Rabada", short: "Rabada" },
  "A Nortje": { name: "Anrich Nortje", short: "Nortje" },
  "T Shamsi": { name: "Tabraiz Shamsi", short: "Shamsi" },
};

const ROLES = {
  "RG Sharma": "captain",
  "RR Pant": "wicketkeeper",
  "AK Markram": "captain",
  "Q de Kock": "wicketkeeper",
};

const raw = JSON.parse(readFileSync(inPath, "utf8"));
const info = raw.info;

const playerId = (cricsheetName) => {
  const p = PLAYER_NAMES[cricsheetName];
  if (!p) throw new Error(`No display name for ${cricsheetName}`);
  return p.short;
};

const players = {};
for (const team of info.teams) {
  for (const n of info.players[team]) {
    const p = PLAYER_NAMES[n];
    if (!p) throw new Error(`No display name for ${n}`);
    players[p.short] = { name: p.name, team, ...(ROLES[n] ? { role: ROLES[n] } : {}) };
  }
}

const deliveries = [];
raw.innings.forEach((inn, i) => {
  for (const over of inn.overs) {
    let legal = 0;
    for (const d of over.deliveries) {
      const extraType = d.extras ? Object.keys(d.extras)[0] : undefined;
      const isLegal = !(d.extras && ("wides" in d.extras || "noballs" in d.extras));
      if (isLegal) legal += 1;
      const out = d.wickets?.[0];
      deliveries.push({
        i,
        o: over.over,
        b: legal,
        bat: playerId(d.batter),
        bowl: playerId(d.bowler),
        ns: playerId(d.non_striker),
        r: d.runs.batter,
        x: d.runs.extras,
        t: d.runs.total,
        ...(extraType ? { xt: extraType } : {}),
        ...(isLegal ? {} : { il: 1 }),
        ...(out
          ? {
              w: {
                out: playerId(out.player_out),
                kind: out.kind,
                ...(out.fielders?.length
                  ? { by: out.fielders.map((f) => (f.substitute ? `${f.name} (sub)` : playerId(f.name))) }
                  : {}),
              },
            }
          : {}),
      });
    }
  }
});

const match = {
  id: "t20wc-2024-final",
  event: `${info.event.name} ${info.season} · ${info.event.stage}`,
  venue: info.venue,
  date: info.dates[0],
  format: info.match_type,
  oversPerInnings: info.overs,
  teams: raw.innings.map((inn) => inn.team),
  toss: `${info.toss.winner} won the toss and chose to ${info.toss.decision}`,
  players,
  deliveries,
  source: "Cricsheet (cricsheet.org), ODC-By 1.0",
};

writeFileSync(outPath, JSON.stringify(match));
const sizeKb = (Buffer.byteLength(JSON.stringify(match)) / 1024).toFixed(1);
console.log(`Wrote ${deliveries.length} deliveries (${sizeKb} KB) to ${outPath}`);
