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
    const recordIds = rows.map((row) => row.record_id).filter(Boolean);
    let contacts = [];
    let addresses = [];
    if (recordIds.length) {
      contacts = await AccountModel.getContactsByRecordIds(recordIds);
      addresses = await AccountModel.getAddressesByRecordIds(recordIds);
    }
    const contactMap = contacts.reduce((map, row) => {
      const key = row.record_id;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push({
        id: row.number_id,
        numType: row.num_type,
        num: row.num,
      });
      return map;
    }, new Map());

    const addressMap = addresses.reduce((map, row) => {
      const key = row.record_id;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push({
        id: row.address_id,
        addressType: row.address_type,
        isDomicilium: !!row.is_domicilium,
        address: row.address,
      });
      return map;
    }, new Map());

    return rows.map((row) => ({
      ...row,
      contactNumbers: contactMap.get(row.record_id) || [],
      addresses: addressMap.get(row.record_id) || [],
    }));
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

  getContactsByRecordIds: async (recordIds = []) => {
    if (!recordIds.length) return [];
    const [rows] = await db.query(queries.SELECT_CONTACTS_BY_RECORD_IDS(recordIds.length), recordIds);
    return rows;
  },

  getAddressesByRecordIds: async (recordIds = []) => {
    if (!recordIds.length) return [];
    const [rows] = await db.query(queries.SELECT_ADDRESSES_BY_RECORD_IDS(recordIds.length), recordIds);
    return rows;
  },

  replaceContactNumbers: async (connection, recordId, contacts = []) => {
    if (!recordId) return;
    const executor = connection || db;
    await executor.query(queries.DELETE_CONTACTS_FOR_RECORD, [recordId]);
    if (!Array.isArray(contacts) || !contacts.length) return;
    const clean = contacts
      .map((c) => ({
        num_type: c.num_type || c.numType || c.type || "Other",
        num: c.num || c.number || "",
      }))
      .filter((c) => c.num && String(c.num).trim());
    for (const contact of clean) {
      await executor.query(queries.INSERT_CONTACT, [recordId, contact.num_type, contact.num]);
    }
  },

  replaceAddresses: async (connection, recordId, addresses = []) => {
    if (!recordId) return;
    const executor = connection || db;
    await executor.query(queries.DELETE_ADDRESSES_FOR_RECORD, [recordId]);
    if (!Array.isArray(addresses) || !addresses.length) return;

    let domiciliumSet = false;
    const normalized = addresses.map((addr) => {
      const type = addr.address_type || addr.addressType || addr.type || "Other";
      const address = addr.address || addr.line || "";
      const isDomicilium = Boolean(addr.is_domicilium || addr.isDomicilium || addr.domicilium);
      return { type, address, isDomicilium };
    });

    for (const addr of normalized) {
      if (addr.isDomicilium && !domiciliumSet) {
        domiciliumSet = true;
      } else {
        addr.isDomicilium = false;
      }
    }
    if (!domiciliumSet && normalized.length) {
      normalized[0].isDomicilium = true;
    }

    for (const addr of normalized) {
      if (!addr.address || !String(addr.address).trim()) continue;
      await executor.query(queries.INSERT_ADDRESS, [recordId, addr.type, addr.isDomicilium ? 1 : 0, addr.address]);
    }
  },
};

module.exports = AccountModel;
