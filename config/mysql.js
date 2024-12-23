const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root'
  
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the MySQL database:', err);
    return;
  }
  console.log('Connected to the MySQL database');

  db.query('SET time_zone = "+04:00";', (err) => {
    if (err) {
      console.error('Error setting timezone:', err);
      return;
    }
    console.log('Timezone set to +04:00 for this session');
  });
});

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'car_auction',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = {db , pool};
