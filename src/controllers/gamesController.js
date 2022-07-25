import connection from '../dbStrategy/postgres.js';
import joi from 'joi';

const gameSchema = joi.object({
  name: joi.string().required(),
  image: joi.string().uri().required(),
  stockTotal: joi.string().required(),
  categoryId: joi.number().required(),
  pricePerDay: joi.string().required()
});

export async function getGames(req, res) {

  try {
    const result = await connection.query(`
      SELECT games.*, categories.name AS "category" FROM games JOIN categories ON categories.id=games."categoryId"
    `);

    res.send(result.rows);
  } catch (error) {
    console.log(error);
    res.sendStatus(500); // internal server error
  }
}

export async function createGame(req, res) {
  const game = req.body;

  const validation = gameSchema.validate(game);
  if (validation.error) {
    return res.sendStatus(400); // bad request
  }

  try {
    const result = await connection.query('SELECT id FROM categories WHERE id = $1', [game.categoryId]);
    if (result.rowCount === 0) {
      return res.sendStatus(400); // bad request
    }

    await connection.query(`
      INSERT INTO games(name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5);
    `, [game.name, game.image, Number(game.stockTotal), game.categoryId, Number(game.pricePerDay)]);

    res.sendStatus(201); // created
  } catch (error) {
    console.log(error);
    res.sendStatus(500); // internal server error
  }
}

