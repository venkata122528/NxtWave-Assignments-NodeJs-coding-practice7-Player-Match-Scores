const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;
app.use(express.json());

const initializeDataBaseServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running on Port 3000");
    });
  } catch (error) {
    console.log(`DB Error : ${error}`);
    process.exit(1);
  }
};

initializeDataBaseServer();

//To return a list of all the players in the player table

app.get("/players/", async (request, response) => {
  const toGetAllPlayers = `SELECT 
  player_id AS playerId,player_name AS playerName 
  FROM player_details`;
  const result = await db.all(toGetAllPlayers);
  response.send(result);
});

//To return a specific player based on the player ID

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const toGetAPlayerDetails = `SELECT 
  player_id AS playerId,player_name AS playerName 
    FROM player_details WHERE player_id=${playerId};`;
  const result = await db.get(toGetAPlayerDetails);
  response.send(result);
});

//To update the details of a specific player
//based on the player ID

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const gottenData = request.body;
  const { playerName } = gottenData;
  const toUpdatePlayerDetails = `UPDATE 
    player_details SET player_name='${playerName}' 
    WHERE player_id=${playerId};`;
  await db.run(toUpdatePlayerDetails);
  response.send("Player Details Updated");
});

//To return the match details of a specific match

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const toGetAMatchDetails = `SELECT 
  match_id AS matchId,match,year 
    FROM match_details WHERE match_id=${matchId};`;
  const result = await db.get(toGetAMatchDetails);
  response.send(result);
});

//To return a list of all the matches of a player

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const toGetMatchesOfAPlayer = `SELECT 
  match_details.match_id AS matchId,match_details.match,
  match_details.year 
    FROM (player_details INNER JOIN 
    player_match_score ON 
    player_details.player_id=player_match_score.player_id) 
    AS first_join INNER JOIN match_details 
    ON first_join.match_id=match_details.match_id 
    WHERE first_join.player_id=${playerId};`;
  const result = await db.all(toGetMatchesOfAPlayer);
  response.send(result);
});

//To return a list of players of a specific match

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const toGetAMatchPlayers = `SELECT 
  player_details.player_id AS playerId,
  player_details.player_name AS playerName FROM 
    (match_details INNER JOIN player_match_score 
        ON match_details.match_id=player_match_score.match_id)
         AS first_join INNER JOIN player_details 
         ON first_join.player_id=player_details.player_id 
         WHERE first_join.match_id=${matchId};`;
  const result = await db.all(toGetAMatchPlayers);
  response.send(result);
});

//To returns the statistics of the total score,
//fours, sixes of a specific player based on the player ID

/*{
  playerId: 1,
  playerName: "Ram"
  totalScore: 3453,
  totalFours: 342,
  totalSixes: 98
}*/

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const toGetAPlayerStats = `SELECT 
  player_details.player_id AS playerId,
  player_details.player_name AS playerName,
  SUM(score) AS totalScore,SUM(fours) AS totalFours,
  SUM(sixes) AS totalSixes 
    FROM player_details 
    NATURAL JOIN player_match_score 
    WHERE player_details.player_id=${playerId};`;
  const [result] = await db.all(toGetAPlayerStats);
  response.send(result);
});

module.exports = app;
