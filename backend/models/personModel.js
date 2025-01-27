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
        ad.is_domicilium,
        ad.address,
        DATE_FORMAT(ad.created_at, '%Y-%m-%d') AS created_date,
        DATE_FORMAT(ad.updated_at, '%Y-%m-%d') AS updated_date
      FROM addresses ad
      WHERE ad.person_id = ?;
    `;

    // Query for accounts
    const accountsQuery = `
    SELECT
      a.account_id,
      CONCAT('R ', FORMAT(SUM(i.balance), 2)) AS acc_balance,
      CONCAT('Dr ', LEFT(d.first, 1), ' ', d.last) AS client,
      COUNT(i.invoice_id) AS total_invoices
    FROM accounts a
    LEFT JOIN invoices i on a.account_id = i.account_id
    LEFT JOIN clients d on a.client_id = d.client_id
    WHERE a.patient_id = ?
    GROUP BY a.account_id, client;`;

    // Query for invoices
    const invoicesQuery = `
       SELECT
            i.invoice_id,
            DATE_FORMAT(i.date_of_service, '%Y-%m-%d') AS date_of_service,
            i.status,
            i.balance,
            DATE_FORMAT(i.created_at, '%Y-%m-%d') AS created_date,
            DATE_FORMAT(i.updated_at, '%Y-%m-%d') AS updated_date
        FROM invoices i
        LEFT JOIN accounts a ON i.account_id = a.account_id
        WHERE a.patient_id = 14;
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
