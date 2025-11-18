const db = require('../config/db');
const queries = require('./queries/accountQueries');

const AccountModel = {
  searchProfilesWithAccounts: async ({ clientId, term }) => {
    if (!term || term.trim().length < 2) {
      return [];
    }
    const normalized = term.trim();
    const likeTerm = `%${normalized}%`;
    const [rows] = await db.query(queries.SEARCH_PROFILES_WITH_ACCOUNTS, [
      clientId,
      normalized,
      likeTerm,
      likeTerm,
      likeTerm,
      likeTerm,
      likeTerm,
      likeTerm,
      likeTerm,
    ]);
    return rows;
  },

  findProfileByMedicalAidNr: async (connection, medicalAidNr) => {
    if (!medicalAidNr) return null;
    const executor = connection || db;
    const [rows] = await executor.query(queries.SELECT_PROFILE_BY_MEDICAL_AID_NR, [medicalAidNr]);
    return rows[0] || null;
  },

  createProfile: async (connection, { medicalAidId, planId, medicalAidNr }) => {
    const [result] = await connection.query(queries.INSERT_PROFILE, [
      medicalAidId || null,
      planId || null,
      medicalAidNr,
    ]);
    return result.insertId;
  },

  insertPersonRecord: async (connection, person) => {
    const {
      first = null,
      last = null,
      title = null,
      date_of_birth = null,
      gender = null,
      id_type = null,
      id_nr = null,
    } = person || {};
    const [result] = await connection.query(queries.INSERT_PERSON, [
      first || null,
      last || null,
      title || null,
      date_of_birth || null,
      gender || null,
      id_type || null,
      id_nr || null,
    ]);
    return result.insertId;
  },

  hasProfilePersonMap: async (connection, { profileId, recordId }) => {
    const [rows] = await connection.query(queries.SELECT_PROFILE_PERSON_MAP, [profileId, recordId]);
    return rows[0] || null;
  },

  insertProfilePersonMap: async (connection, { profileId, recordId, isMainMember, dependentNr }) => {
    await connection.query(queries.INSERT_PROFILE_PERSON_MAP, [
      profileId,
      recordId,
      isMainMember ? 1 : 0,
      dependentNr || null,
    ]);
  },

  findAccountByKeys: async (connection, { profileId, clientId, mainMemberId, patientId }) => {
    const [rows] = await connection.query(queries.SELECT_ACCOUNT_BY_KEYS, [
      profileId,
      clientId,
      mainMemberId,
      patientId || null,
    ]);
    return rows[0] || null;
  },

  createAccount: async (connection, { profileId, clientId, mainMemberId, patientId }) => {
    const [result] = await connection.query(queries.INSERT_ACCOUNT, [
      profileId,
      clientId,
      mainMemberId,
      patientId || null,
    ]);
    return result.insertId;
  },

  createInvoice: async (connection, invoice) => {
    const {
      accountId,
      batchId,
      nrInBatch = null,
      dateOfService = null,
      status = 'Open',
      refClientId = null,
      fileNr = null,
      balance = 0,
      authNr = null,
      type = 'normal',
    } = invoice || {};

    const [result] = await connection.query(queries.INSERT_INVOICE, [
      accountId,
      batchId,
      nrInBatch || null,
      dateOfService || null,
      status || 'Open',
      refClientId || null,
      fileNr || null,
      balance || 0,
      authNr || null,
      type || null,
    ]);
    return result.insertId;
  },

  getProfilePersons: async (profileIds = []) => {
    if (!profileIds.length) return [];
    const placeholdersQuery = queries.buildProfilePersonsQuery(profileIds.length);
    const [rows] = await db.query(placeholdersQuery, profileIds);
    return rows;
  },

  getAllMedicalAids: async () => {
    const [rows] = await db.query(queries.SELECT_ALL_MEDICAL_AIDS);
    return rows;
  },

  getAllMedicalAidPlans: async () => {
    const [rows] = await db.query(queries.SELECT_ALL_MEDICAL_AID_PLANS);
    return rows;
  },

  updateProfile: async (connection, { profileId, medicalAidId, planId, medicalAidNr }) => {
    if (!profileId) return;
    await connection.query(queries.UPDATE_PROFILE, [
      medicalAidId || null,
      planId || null,
      medicalAidNr,
      profileId,
    ]);
  },

  updatePersonRecord: async (connection, recordId, person) => {
    if (!recordId) return;
    const {
      first = null,
      last = null,
      title = null,
      date_of_birth = null,
      gender = null,
      id_type = null,
      id_nr = null,
    } = person || {};
    await connection.query(queries.UPDATE_PERSON, [
      first || null,
      last || null,
      title || null,
      date_of_birth || null,
      gender || null,
      id_type || null,
      id_nr || null,
      recordId,
    ]);
  },

  upsertProfilePersonMap: async (connection, { profileId, recordId, isMainMember, dependentNr }) => {
    if (!profileId || !recordId) return;
    const [result] = await connection.query(queries.UPDATE_PROFILE_PERSON_MAP, [
      isMainMember ? 1 : 0,
      dependentNr || null,
      profileId,
      recordId,
    ]);
    if (result.affectedRows === 0) {
      await connection.query(queries.INSERT_PROFILE_PERSON_MAP, [
        profileId,
        recordId,
        isMainMember ? 1 : 0,
        dependentNr || null,
      ]);
    }
  },

  deleteProfilePersonMap: async (connection, { profileId, recordId }) => {
    if (!profileId || !recordId) return;
    await connection.query(queries.DELETE_PROFILE_PERSON_MAP, [profileId, recordId]);
  },

  updateInvoice: async (connection, invoice) => {
    const {
      invoiceId,
      accountId,
      nrInBatch = null,
      dateOfService = null,
      status = 'Open',
      refClientId = null,
      fileNr = null,
      balance = 0,
      authNr = null,
      type = 'normal',
    } = invoice || {};
    if (!invoiceId) return;
    await connection.query(queries.UPDATE_INVOICE, [
      accountId || null,
      nrInBatch || null,
      dateOfService || null,
      status || 'Open',
      refClientId || null,
      fileNr || null,
      balance || 0,
      authNr || null,
      type || null,
      invoiceId,
    ]);
  },
};

module.exports = AccountModel;
