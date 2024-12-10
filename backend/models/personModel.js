const db = require('../config/db');

const Person = {
  // Retrieve all persons
  allPersons: (callback) => {
    const query = `
      SELECT 
        person_id,
        CONCAT(title,' ',first,' ',last) as name,
        gender,
        date_of_birth,
        id_nr,
        email,
        created_at
      FROM person_records;
    `;

    db.query(query, (err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, results);
    });
  },
};

module.exports = Person;
