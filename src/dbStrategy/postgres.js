import pg from 'pg';

const { Pool } = pg;

const databaseConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
}

const connection = new Pool(databaseConfig);

export default connection;

// const connection = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });

// export default connection;