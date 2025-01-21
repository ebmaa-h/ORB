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

getPersonDetails: (personId, callback) => {
    // Query for person details
    const personDetailsQuery = `
      SELECT *
      from person_records pr
      WHERE pr.person_id = ?;
    `;

    // Query for addresses
    const addressesQuery = `
        SELECT
            ad.address_id,
            ad.address_type,
            ad.is_domicilium,
            ad.line1,
            ad.line2,
            ad.line3,
            ad.line4,
            ad.postal_code,
            DATE_FORMAT(ad.created_at, '%Y-%m-%d') AS created_date,
            DATE_FORMAT(ad.updated_at, '%Y-%m-%d') AS updated_date
        FROM addresses ad
        WHERE ad.person_id = ?;
    `;

    // Query for accounts
    const accountsQuery = `

    `;

    // Query for invoices
    const invoicesQuery = `

    `;

    // Retrieve data sequentially
    db.query(personDetailsQuery, [personId], (err, personDetailsResults) => {
        if (err) return callback(err, null);
        if (personDetailsResults.length === 0) return callback(null, null); // No person found

        const personDetails = personDetailsResults[0];

        db.query(addressesQuery, [personId], (err, addressesResults) => {
            if (err) return callback(err, null);

            db.query(accountsQuery, [personId], (err, accountsResults) => {
                if (err) return callback(err, null);

                db.query(invoicesQuery, [personId], (err, invoicesResults) => {
                    if (err) return callback(err, null);

                    // Prepare result object
                    const result = {
                        person: personDetails,
                        addresses: addressesResults,
                        accounts: accountsResults,
                        invoices: invoicesResults,
                    };

                    callback(null, result);
                });
            });
        });
    });
  },
};

module.exports = Person;
