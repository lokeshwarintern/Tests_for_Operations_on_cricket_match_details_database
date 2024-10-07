const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
let db = null;
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000);
  } catch (error) {
    console.log(`DB ERROR:${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertToDbObjToResponseObj = (dbObj) => {
  return {
    playerId: dbObj.player_id,
    playerName: dbObj.player_name,
  };
};
const convertMatchObjToResponseObj = (matObj) => {
  return {
    matchId: matObj.match_id,
    match: matObj.match,
    year: matObj.year,
  };
};

//GET(Returns a list of all the players in the player table)
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
            SELECT
                *
            FROM
                player_details;
    `;
  const getPlayersArray = await db.all(getPlayersQuery);
  response.send(
    getPlayersArray.map((eachItem) => convertToDbObjToResponseObj(eachItem))
  );
});

//GET(Returns a specific player based on the player ID)
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
                SELECT
                    *
                FROM
                    player_details
                WHERE
                    player_id = ${playerId};
    `;
  const playerObj = await db.get(getPlayerQuery);
  response.send(convertToDbObjToResponseObj(playerObj));
});

//PUT(Updates the details of a specific player based on the player ID)
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
            UPDATE 
                player_details
            SET
                player_name = '${playerName}'
            WHERE
                player_id = ${playerId};
    `;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//GET(Returns the match details of a specific match)
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `
            SELECT
                *
            FROM
                match_details
            WHERE
                match_id = ${matchId};


    `;
  const matchObj = await db.get(getMatchDetailsQuery);
  response.send(convertMatchObjToResponseObj(matchObj));
});

//GET(Returns a list of all the matches of a player)
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesOfPlayer = `
            SELECT
                match_id AS matchId,
                match,
                year
            FROM
                match_details  NATURAL JOIN player_match_score
            WHERE
                player_id = ${playerId};
            
    `;
  const dbResponse = await db.all(getMatchesOfPlayer);
  response.send(dbResponse);
});

//GET(Returns a list of players of a specific match)
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersOfMatch = `
            SELECT 
                player_details.player_id AS playerId,
                player_details.player_name AS playerName
            FROM
                player_match_score NATURAL JOIN player_details
            WHERE
                match_id = ${matchId}; 
    `;
  const dbResponse = await db.all(getPlayersOfMatch);
  response.send(dbResponse);
});

//GET(Returns the statistics of the total score, fours, sixes of a specific player based on the player ID)
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStatisticsQuery = `
            SELECT
                player_details.player_id AS playerId,
                player_details.player_name AS playerName,
                SUM(player_match_score.score) AS totalScore,
                SUM(player_match_score.fours) AS totalFours,
                SUM(player_match_score.sixes) AS totalSixes
            FROM
                player_match_score NATURAL JOIN player_details
            WHERE
                player_id = ${playerId};

    
    `;
  const dbResponse = await db.get(getStatisticsQuery);
  response.send(dbResponse);
});
module.exports = app;
