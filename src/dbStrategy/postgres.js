import pkg from 'pg';

const { Pool } = pkg;

const connection = new Pool({
  host: '192.168.0.104',
  port: 5432,
  user: 'postgres',
  password: 'admin',
  database: 'meu_banco'
});

export default connection;
