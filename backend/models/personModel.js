const db = require('../config/db');

const Person = {
  // Retrieve all persons
  allPersons: (callback) => {
    const query = `
      SELECT 
        person_id,
        CONCAT(title,' ',first,' ',last) as name,
        gender,
        DATE_FORMAT(date_of_birth, '%Y-%m-%d') AS date_of_birth,
        id_nr,
        email,
        DATE_FORMAT(created_at, '%Y-%m-%d') AS created_at
      FROM person_records;
    `;

    db.query(query, (err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, results);
    });
  },

  // Retrieve one person
  onePerson: (recordId, callback) => {
    const query = `
      SELECT 
        person_id,
        first,
        last,
        title,
        gender,
        DATE_FORMAT(date_of_birth, '%Y-%m-%d') AS date_of_birth,
        id_nr,
        email,
        cell_nr,
        tell_nr,
        work_nr,
        post_address,
        str_address,
        DATE_FORMAT(created_at, '%Y-%m-%d') AS created_at
      FROM person_records
      WHERE person_id = ?;
    `;

    // Get List of accounts

    // Get profile related to

    db.query(query, [recordId], (err, result) => {
      if (err) return callback(err, null);

      callback(null, result);
  });
  },
};

module.exports = Person;
