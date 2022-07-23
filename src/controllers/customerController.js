import connection from '../dbStrategy/postgres.js';
import joi from 'joi';

export async function getCategories(req, res) {
  const { rows: categories } = await connection.query(`
    SELECT categories.id, categories.name FROM categories
  `);

  res.send(categories);
}


export async function createCategorie(req, res) {
  const newCategorie = req.body;

  const categorieSchema = joi.object({
    name: joi.string().required()
  });

  const { error } = categorieSchema.validate(newPost);

  if (error) {
    return res.sendStatus(422);
  }

  await connection.query(
    `INSERT INTO categories (name) VALUES ('${newCategorie.name}')`
  );

  res.status(201).send('Categoria criada com sucesso');
}
