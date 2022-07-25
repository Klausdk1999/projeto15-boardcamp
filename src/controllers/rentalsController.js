import connection from '../dbStrategy/postgres.js';
import joi from 'joi';

const rentalsSchema = joi.object({
  customerId: joi.number().required(),
  gameId: joi.number().required(),
  daysRented: joi.number().min(1).required()
});

export async function getRentals(req, res) {
  const { rows: rentals } = await connection.query(`
    SELECT * FROM rentals
  `);

  res.send(rentals);
}

export async function createRental(req, res) {
  const newRental = req.body;

  const validation = rentalsSchema.validate(newRental);
  if (validation.error) {
    return res.sendStatus(400); // bad request
  }

  await connection.query(
    `INSERT INTO rentals (customerId,gameId,rentDate,daysRented,returnDate,originalPrice,delayFee) VALUES ('${newRental.customerId}','${newRental.gameId}','${newRental.rentDate}','${newRental.daysRented}','${newRental.returnDate}','${newRental.originalPrice}','${newRental.delayFee}')`
  );

  res.status(201).send('Categoria criada com sucesso');
}
