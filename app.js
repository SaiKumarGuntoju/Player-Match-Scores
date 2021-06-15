const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbpath = path.join(__dirname, "cricketMatchDetails.db");

let database = null;

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is Running at port 3000");
    });
  } catch (e) {
    process.exit(1);
    console.log(`DB error : ${e.message}`);
  }
};

initializeDBAndServer();

const convertMatchId = (match) => {
  return {
    matchId: match.match_id,
    match: match.match,
    year: match.year,
  };
};

const convertMatch = (match) => {
  return {
    matchId: match.match_id,
    match: match.match,
    year: match.year,
  };
};

const convertPlayerId = (player) => {
  return {
    playerId: player.player_id,
    playerName: player.player_name,
  };
};

const convert = (each) => {
  return {
    playerId: each.player_id,
    playerName: each.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const playersQuery = `
        SELECT *
        FROM player_details;`;
  const players = await database.all(playersQuery);
  response.send(
    players.map((eachPlayer) => ({
      playerId: eachPlayer.player_id,
      playerName: eachPlayer.player_name,
    }))
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = `
        SELECT *
        FROM player_details
        WHERE player_id = ${playerId};`;
  const player = await database.get(playerDetails);
  response.send(convertPlayerId(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updateQuery = `
        UPDATE 
        player_details
        SET 
        player_name = '${playerName}'
        WHERE player_id = ${playerId};`;
  await database.run(updateQuery);
  response.send("Player Details Updated");
});

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayer = `
    SELECT
      *
    FROM player_match_score 
      NATURAL JOIN match_details
    WHERE
      player_id = ${playerId};`;
  const playerMatches = await database.all(getPlayer);
  response.send(playerMatches.map((eachMatch) => convertMatch(eachMatch)));
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchDetails = `
        SELECT *
        FROM match_details
        WHERE match_id = ${matchId};`;
  const match = await database.get(matchDetails);
  response.send(convertMatchId(match));
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const matchDetailsQuery = `
        SELECT *
        FROM  player_match_score NATURAL JOIN player_details
        WHERE match_id = ${matchId}`;
  const match = await database.all(matchDetailsQuery);
  response.send(match.map((each) => convert(each)));
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getmatchPlayersQuery = `
    SELECT
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      player_id = ${playerId};`;
  const playersMatchDetails = await database.get(getmatchPlayersQuery);
  response.send(playersMatchDetails);
});

module.exports = app;
