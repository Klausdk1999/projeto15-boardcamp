import connection from '../dbStrategy/postgres.js';
import joi from 'joi';
import dayjs from "dayjs";

const rentalsSchema = joi.object({
  customerId: joi.number().required(),
  gameId: joi.number().required(),
  daysRented: joi.number().min(1).required()
});

export async function getRentals(req, res) {
  const { customerId, gameId, offset, limit, order, desc, status, startDate } = req.query;
  const orderBy = order ? `ORDER BY ${order} ${desc ? "DESC" : "ASC"}` : '';
  let rentals = [];
  let rentalStatus = '';
  let rentalStartDate = '';
  if (status === 'open') {
      rentalStatus = `"returnDate" IS NULL`;
  } else if (status === 'closed') {
      rentalStatus = `"returnDate" IS NOT NULL`;
  }
  if (startDate && dayjs(startDate).format('YYYY-MM-DD') !== "Invalid Date") {
      rentalStartDate = `"rentDate" >= '${dayjs(startDate).format('YYYY-MM-DD')}'`;
  }

  try {
      const query = `
      SELECT rentals.*, customers.name AS "customerName", games.name AS "gameName", games."categoryId", categories.name AS "categoryName" 
      FROM rentals 
      JOIN customers ON rentals."customerId" = customers.id 
      JOIN games ON rentals."gameId" = games.id 
      JOIN categories ON games."categoryId" = categories.id`;

      if (customerId) {
          const and = rentalStatus ? 'AND' : '';
          const and2 = rentalStartDate ? 'AND' : '';
          const { rows } = await connection.query(`${query} WHERE "customerId" = $1 ${and} ${rentalStatus} ${and2} ${rentalStartDate} ${orderBy} LIMIT $2 OFFSET $3`, [customerId, limit, offset]);
          rentals = [...rows];
      } else if (gameId) {
          const and = rentalStatus ? 'AND' : '';
          const and2 = rentalStartDate ? 'AND' : '';
          const { rows } = await connection.query(`${query} WHERE "gameId" = $1 ${and} ${rentalStatus} ${and2} ${rentalStartDate} ${orderBy} LIMIT $2 OFFSET $3`, [gameId, limit, offset]);
          rentals = [...rows];
      } else {
          const where = rentalStatus || rentalStartDate ? 'WHERE' : '';
          const and = rentalStatus && rentalStartDate ? 'AND' : '';
          const { rows } = await connection.query(`${query} ${where} ${rentalStatus} ${and} ${rentalStartDate} ${orderBy} LIMIT $1 OFFSET $2`, [limit, offset]);
          rentals = [...rows];
      }

      rentals.map(rental => {
          rental.customer = {
              id: rental.customerId,
              name: rental.customerName
          };
          rental.game = {
              id: rental.gameId,
              name: rental.gameName,
              categoryId: rental.categoryId,
              categoryName: rental.categoryName
          }
          delete rental.customerName;
          delete rental.gameName;
          delete rental.categoryId;
          delete rental.categoryName;
      })
      res.status(200).send(rentals);

  } catch (error) {
      res.status(500).send(error);
  }
}

export async function rent(req, res) {
  const rental = req.body;

   const validation = rentalsSchema.validate(rental);
  if (validation.error) {
    return res.sendStatus(400); // bad request
  }

  try {
    const customersResult = await connection.query(`
      SELECT id FROM customers WHERE id = $1
    `, [rental.customerId]);
    if (customersResult.rowCount === 0) {
      return res.sendStatus(400); // bad request
    }

    const gameResult = await connection.query(`
      SELECT * FROM games WHERE id=$1
    `, [rental.gameId]);
    if (gameResult.rowCount === 0) {
      return res.sendStatus(400); // bad request
    }
    const game = gameResult.rows[0];

    const result = await connection.query(`
      SELECT id
      FROM rentals 
      WHERE "gameId" = $1 AND "returnDate" IS null
    `, [rental.gameId]);

    if (result.rowCount > 0) {
      if (game.stockTotal === result.rowCount) {
        return res.sendStatus(400); // bad request
      }
    }

    const originalPrice = rental.daysRented * game.pricePerDay;
    await connection.query(`
      INSERT INTO 
        rentals (
          "customerId", "gameId", "rentDate", 
          "daysRented", "returnDate", "originalPrice", "delayFee"
        )
        VALUES ($1, $2, NOW(), $3, null, $4, null); 
      `, [rental.customerId, rental.gameId, rental.daysRented, originalPrice]);

    res.sendStatus(201); // created
  } catch (error) {
    console.log(error);
    res.sendStatus(500); // internal server error
  }
}

export async function finish(req, res) {
  const {id} = req.params;
  try {
    const result = await connection.query(`SELECT * FROM rentals WHERE id = $1`, [id]);
    if(result.rowCount === 0) return res.sendStatus(404); // not found
    
    const rental = result.rows[0];
    if(rental.returnDate) return res.sendStatus(400); // bad request
    else {
      const diff = new Date().getTime() - new Date(rental.rentDate).getTime();
      const diffInDays = Math.floor(diff / (24 * 3600 * 1000));

      let delayFee = 0;
      if (diffInDays > rental.daysRented) {
        const addicionalDays = diffInDays - rental.daysRented;
        delayFee = addicionalDays * rental.originalPrice;
        console.log("delayFee", addicionalDays);
      };

      
      await connection.query(`
        UPDATE rentals 
        SET "returnDate" = NOW(), "delayFee" = $1
        WHERE id = $2    
      `, [delayFee, id]);

      res.sendStatus(200);
    }
  } catch (error) {
    console.log(error);
    res.sendStatus(500); // internal server error
  }
}

export async function deleteRental(req, res) {
  const {id} = req.params;
  try {
    const result = await connection.query(`SELECT * FROM rentals WHERE id = $1`, [id]);
    if(result.rowCount === 0) {
      res.sendStatus(404); // not found
    } else {
      const rental = result.rows[0];
      if(!rental.returnDate) res.sendStatus(400); // bad request
      else {
        await connection.query(`DELETE FROM rentals WHERE id = $1`, [id]);
      }
    }
  } catch(error) {
    console.log(error);
    res.sendStatus(500); // internal server error
  }
}

function _mapRentalsArrayToObject(row) {
  const [
    id, customerId, gameId,
    rentDate, daysRented, returnDate,
    originalPrice, delayFee, customerName,
    gameName, categoryId, categoryName
  ] = row;

  return {
    id,
    customerId,
    gameId,
    rentDate,
    daysRented,
    returnDate,
    originalPrice,
    delayFee,
    customer: {
      id: customerId,
      name: customerName
    },
    game: {
      id: gameId,
      name: gameName,
      categoryId,
      categoryName
    }
  }
}


// export async function getRentals(req, res) {
//   const { rows: rentals } = await connection.query(`
//     SELECT * FROM rentals
//   `);

//   res.send(rentals);
// }

// export async function createRental(req, res) {
//   const newRental = req.body;

//   const validation = rentalsSchema.validate(newRental);
//   if (validation.error) {
//     return res.sendStatus(400); // bad request
//   }

//   await connection.query(
//     `INSERT INTO rentals (customerId,gameId,rentDate,daysRented,returnDate,originalPrice,delayFee) VALUES ('${newRental.customerId}','${newRental.gameId}','${newRental.rentDate}','${newRental.daysRented}','${newRental.returnDate}','${newRental.originalPrice}','${newRental.delayFee}')`
//   );

//   res.status(201).send('Categoria criada com sucesso');
// }
