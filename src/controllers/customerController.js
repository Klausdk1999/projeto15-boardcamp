import connection from '../dbStrategy/postgres.js';
import joi from 'joi';

export async function getCustomers(req, res) {
  const { rows: customers } = await connection.query(`
    SELECT * FROM customers
  `);

  res.send(customers);
}

// export async function getCustomers(req, res) {
//     const { rows: customers } = await connection.query(`
//       SELECT * FROM customers
//     `);
  
//     res.send(customers);
// }
  

export async function createCustomer(req, res) {
  const newCustomer = req.body;

  const customerschema = joi.object({
    name: joi.string().required()
  });

  const { error } = customerschema.validate(newCustomer);

  if (error) {
    return res.sendStatus(422);
  }

  await connection.query(
    `INSERT INTO customers (name,phone,cpf,birthday) VALUES ('${newCustomer.name}','${newCustomer.phone}','${newCustomer.cpf}','${newCustomer.birthday}')`
  );

  res.status(201).send('Cliente criado com sucesso');
}
