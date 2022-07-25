import connection from '../dbStrategy/postgres.js';
import joi from 'joi';
import dayjs from "dayjs";

const rentalsSchema = joi.object({
  customerId: joi.number().required(),
  gameId: joi.number().required(),
  daysRented: joi.number().min(1).required()
});

export async function getRentals(req, res) {
  const { customerId, gameId, offset, limit, order } = req.query;
  let paramsClause = "";
  let orderClause = "";
  let offsetClause = "";
  let limitClause = "";

  try {
    customerId
      ? (paramsClause = `WHERE rentals."customerId" = ${customerId}`)
      : "";
    gameId ? (paramsClause = `WHERE rentals."gameId" = ${gameId}`) : "";
    order ? (orderClause = `ORDER BY "${order}" ASC`) : "";
    offset ? (offsetClause = `OFFSET ${offset}`) : "";
    limit ? (limitClause = `LIMIT ${limit}`) : "";

    const { rows: rentals } = await connection.query(
      `
        SELECT 
            rentals.*, 
            to_json(customers) "customer", 
            to_json(games) "game"
        FROM rentals 
            INNER JOIN customers ON customers.id = rentals."customerId" 
            INNER JOIN (SELECT 
                    games.*, 
                    categories.name as "categoryName" 
                FROM games 
                    JOIN categories ON games."categoryId" = categories.id) 
                AS games
            ON games.id = rentals."gameId" 
        ${paramsClause}
        ${orderClause}
        ${offsetClause}
        ${limitClause}
           ;
        `
    );
    if (rentals.length !== 0) {
      delete rentals[0].customer.phone;
      delete rentals[0].customer.cpf;
      delete rentals[0].customer.birthday;
      delete rentals[0].game.image;
      delete rentals[0].game.stockTotal;
      delete rentals[0].game.pricePerDay;
    }

    return res.send(rentals);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
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
