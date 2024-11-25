const db = require('../config/db');

const Account = {
  // Get all accounts with merged data
  allAccounts: (callback) => {
    const query = `
      SELECT 
        accounts.account_id,
        accounts.dos,
        accounts.guarantor_name,
        accounts.guarantor_id_nr,
        accounts.guarantor_nr,
        accounts.guarantor_address,
        accounts.created_at,
        accounts.updated_at,
        patients.first AS patient_first,
        patients.last AS patient_last,
        patients.id_nr AS patient_id_nr,
        members.first AS member_first,
        members.last AS member_last,
        members.id_nr AS member_id_nr,
        doctors.first AS doctor_first,
        doctors.last AS doctor_last,
        ref_doctors.first AS ref_doctor_first,
        ref_doctors.last AS ref_doctor_last,
        service_centers.service_center_name,
        service_centers.service_center_type
      FROM accounts
      LEFT JOIN person_records AS patients ON accounts.patient_id = patients.person_id
      LEFT JOIN person_records AS members ON accounts.member_id = members.person_id
      LEFT JOIN users AS doctors ON accounts.doctor_id = doctors.user_id
      LEFT JOIN ref_doctors ON accounts.ref_doctor_id = ref_doctors.ref_doctor_id
      LEFT JOIN service_centers ON accounts.service_center_id = service_centers.service_center_id
    `;
    db.query(query, (err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, results);
    });
  },

  // Get one account with all details
  oneAccount: (accountId, callback) => {
    const query = `
      SELECT 
        accounts.*,
        patients.first AS patient_first,
        patients.last AS patient_last,
        patients.id_nr AS patient_id_nr,
        patients.m_aid_nr AS patient_m_aid_nr,
        patients.auth_nr AS patient_auth_nr,
        members.first AS member_first,
        members.last AS member_last,
        members.id_nr AS member_id_nr,
        members.m_aid_nr AS member_m_aid_nr,
        members.auth_nr AS member_auth_nr,
        doctors.first AS doctor_first,
        doctors.last AS doctor_last,
        ref_doctors.first AS ref_doctor_first,
        ref_doctors.last AS ref_doctor_last,
        service_centers.service_center_name,
        service_centers.service_center_type,
        medical_aids.name AS medical_aid_name,
        medical_aid_plans.plan_name AS medical_aid_plan_name
      FROM accounts
      LEFT JOIN person_records AS patients ON accounts.patient_id = patients.person_id
      LEFT JOIN person_records AS members ON accounts.member_id = members.person_id
      LEFT JOIN users AS doctors ON accounts.doctor_id = doctors.user_id
      LEFT JOIN ref_doctors ON accounts.ref_doctor_id = ref_doctors.ref_doctor_id
      LEFT JOIN service_centers ON accounts.service_center_id = service_centers.service_center_id
      LEFT JOIN medical_aids ON patients.m_aid_id = medical_aids.medical_aid_id
      LEFT JOIN medical_aid_plans ON patients.m_aid_plan_id = medical_aid_plans.plan_id
      WHERE accounts.account_id = ?
    `;
    db.query(query, [accountId], (err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, results[0]);
    });
  },
};

module.exports = Account;
