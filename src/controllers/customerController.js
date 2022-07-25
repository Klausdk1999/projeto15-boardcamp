import connection from '../dbStrategy/postgres.js';
import joi from 'joi';

const customerSchema = joi.object({
  name: joi.string().required(),
  phone: joi.string().min(10).max(11).required(),
  cpf: joi.string().length(11).required(),
  birthday: joi.date().required(),
});

export async function getCustomers(req, res) {
  const { cpf } = req.query;

  try {
    const result = await connection.query(`
      SELECT * FROM customers WHERE cpf LIKE $1
    `, cpf);

    res.send(result.rows);

  } catch (error) {
    console.log(error);
    res.sendStatus(500); // internal server error
  }
}

export async function getCustomer(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.sendStatus(400); // bad request
  }

  try {
    const result = await connection.query(`SELECT * FROM customers WHERE id = $1`, [id]);
    if (result.rowCount === 0) {
      return res.sendStatus(404); // not found
    }

    res.send(result.rows[0]);
  } catch (error) {
    console.log(error);
    res.sendStatus(500); // internal server error
  }
}

export async function createCustomer(req, res) {
  const customer = req.body;

  const validation = customerSchema.validate(customer);
  if (validation.error) {
    return res.sendStatus(400); // bad request
  }

  try {
    const result = await connection.query('SELECT id FROM customers WHERE cpf = $1', [customer.cpf]);
    if (result.rowCount !== 0) {
      return res.sendStatus(409); // conflict
    }

    await connection.query(`
      INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4);
    `, [customer.name, customer.phone, customer.cpf, customer.birthday]);

    res.sendStatus(201); // created
  } catch (error) {
    console.log(error);
    res.sendStatus(500); // internal server error
  }
}

export async function updateCustomer(req, res) {
  const customer = req.body;
  const { id } = req.params;

  const validation = customerSchema.validate(customer);
  if (validation.error) {
    return res.sendStatus(400); // bad request
  }

  if (!id){
    return res.sendStatus(400); // bad request
  }

  try {
    const result = await connection.query(`
      SELECT id FROM customers WHERE cpf = $1 AND id != $2
    `, [customer.cpf, id]);
    if (result.rowCount > 0) {
      return res.sendStatus(409); // conflict
    }

    await connection.query(`
      UPDATE customers 
      SET 
        name = $1, phone = $2, cpf = $3, birthday = $4 
      WHERE id = $5
    `, [customer.name, customer.phone, customer.cpf, customer.birthday, id]);

    res.sendStatus(200); // ok
  } catch (error) {
    console.log(error);
    res.sendStatus(500); // internal server error
  }
}


// export async function getCustomers(req, res) {
//   const { rows: customers } = await connection.query(`
//     SELECT * FROM customers
//   `);

//   res.send(customers);
// }

// // export async function getCustomers(req, res) {
// //     const { rows: customers } = await connection.query(`
// //       SELECT * FROM customers
// //     `);
  
// //     res.send(customers);
// // }
  

// export async function createCustomer(req, res) {
//   const newCustomer = req.body;

//   const customerschema = joi.object({
//     name: joi.string().required()
//   });

//   const { error } = customerschema.validate(newCustomer);

//   if (error) {
//     return res.sendStatus(422);
//   }

//   await connection.query(
//     `INSERT INTO customers (name,phone,cpf,birthday) VALUES ('${newCustomer.name}','${newCustomer.phone}','${newCustomer.cpf}','${newCustomer.birthday}')`
//   );

//   res.status(201).send('Cliente criado com sucesso');
// }
