import connection from '../dbStrategy/postgres.js';
import joi from 'joi';

export async function getGames(req, res) {
  const { rows: games } = await connection.query(`
    SELECT * FROM games
  `);

  res.send(games);
}


export async function createGame(req, res) {
  const newGame = req.body;

  const gameschema = joi.object({
    name: joi.string().required()
  });

  const { error } = gameschema.validate(newGame);

  if (error) {
    return res.sendStatus(422);
  }

  await connection.query(
    `INSERT INTO games (name,image,stockTotal,categoryId,pricePerDay) VALUES ('${newGame.name}','${newGame.image}','${newGame.stockTotal}','${newGame.categoryId}','${newGame.pricePerDay}')`
  );

  res.status(201).send('Game criado com sucesso');
}
