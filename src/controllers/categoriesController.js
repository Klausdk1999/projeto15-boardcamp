import connection from '../dbStrategy/postgres.js';
import joi from 'joi';

export async function getCategories(req, res) {
  // const { rows: categories } = await connection.query(`
  //   SELECT categories.id, categories.name FROM categories
  // `);

  try {
    const { rows: categories } = await connection.query(`
    SELECT categories.id, categories.name FROM categories
    `);
    res.send(categories);
  } catch (error) {
    console.log(error);
    res.sendStatus(500); // internal server error
  }
}

export async function createCategorie(req, res) {

  newCategory = req.body;

  const categorySchema = joi.object({
    name: joi.string().required()
  });
  
  const validation = categorySchema.validate(newCategory);
  if (validation.error) {
    return res.sendStatus(400); // bad request
  }

  try {
    const result = await connection.query('SELECT id FROM categories WHERE name=$1',[newCategory.name]);
    if (result.rowCount > 0) {
      return res.sendStatus(409); // conflict
    }

    await connection.query(`INSERT INTO categories(name) VALUES ($1)`,[newCategory.name]);
    res.sendStatus(201); // created
  } catch (error) {
    console.log(error);
    res.sendStatus(500); // internal server error
  }
  res.status(201).send('Categoria criada com sucesso');
}
