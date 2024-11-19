// db.js
const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',            
    host: 'localhost',            
    database: 'Innovacion',       
    password: 'nueva_contraseña', 
    port: 5432,                   
  });
  module.exports = pool;
