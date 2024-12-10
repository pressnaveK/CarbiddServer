const {db} = require('./config/mysql'); // Import the centralized DB connection

// Create the database and tables
const setupDatabase = () => {
  // Create the database if it doesn't exist
  const createDatabaseQuery = 'CREATE DATABASE IF NOT EXISTS car_auction';
  db.query(createDatabaseQuery, (err) => {
    if (err) {
      console.error('Error creating database:', err);
      return;
    }
    console.log('Database created or already exists');

    // Switch to the car_auction database
    db.changeUser({ database: 'car_auction' }, (err) => {
      if (err) {
        console.error('Error switching to database:', err);
        return;
      }
      console.log('Switched to car_auction database');

      // Create the `users` table
      const createUsersTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
          user_id VARCHAR(255) PRIMARY KEY,
          username VARCHAR(255) NOT NULL,
          password VARCHAR(255) NOT NULL
        )
      `;

      db.query(createUsersTableQuery, (err) => {
        if (err) {
          console.error('Error creating users table:', err);
          return;
        }
        console.log('Users table created or already exists');

        // Create the `auctions` table
        const createAuctionsTableQuery = `
          CREATE TABLE IF NOT EXISTS auctions (
            auction_id VARCHAR(255) PRIMARY KEY,
            car_id VARCHAR(255) NOT NULL,
            start_datetime DATETIME NOT NULL,
            end_datetime DATETIME NOT NULL,
            user_id VARCHAR(255),
            bid_amount DECIMAL(10, 2),
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
          )
        `;

        db.query(createAuctionsTableQuery, (err) => {
          if (err) {
            console.error('Error creating auctions table:', err);
            return;
          }
          console.log('Auctions table created or already exists');

          // Create the `bids` table
          const createBidsTableQuery = `
            CREATE TABLE IF NOT EXISTS bids (
              bid_id INT AUTO_INCREMENT PRIMARY KEY,
              user_id VARCHAR(255),
              auction_id VARCHAR(255),
              bid_amount DECIMAL(10, 2),
              timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(user_id),
              FOREIGN KEY (auction_id) REFERENCES auctions(auction_id)
            )
          `;

          db.query(createBidsTableQuery, (err) => {
            if (err) {
              console.error('Error creating bids table:', err);
              return;
            }
            console.log('Bids table created or already exists');
          });
        });
      });
    });
  });
};

// Export the function
module.exports = setupDatabase;
