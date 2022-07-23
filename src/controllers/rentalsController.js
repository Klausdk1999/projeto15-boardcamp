import connection from '../dbStrategy/postgres.js';
import joi from 'joi';

export async function getRentals(req, res) {
  const { rows: rentals } = await connection.query(`
    SELECT * FROM rentals
  `);

  res.send(rentals);
}

export async function createRental(req, res) {
  const newRental = req.body;

//   const rentalschema = joi.object({
//     name: joi.string().required()
//   });

//   const { error } = rentalschema.validate(newRental);

//   if (error) {
//     return res.sendStatus(422);
//   }

  await connection.query(
    `INSERT INTO rentals (customerId,gameId,rentDate,daysRented,returnDate,originalPrice,delayFee) VALUES ('${newRental.customerId}','${newRental.gameId}','${newRental.rentDate}','${newRental.daysRented}','${newRental.returnDate}','${newRental.originalPrice}','${newRental.delayFee}')`
  );

  res.status(201).send('Categoria criada com sucesso');
}
