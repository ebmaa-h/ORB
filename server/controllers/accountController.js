const db = require('../config/db');
const AccountModel = require('../models/accountModel');
const Invoice = require('../models/invoiceModel');
const Batch = require('../models/batchModel');

const toPositiveInt = (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

const safeString = (value) => {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str.length ? str : null;
};

const normalizePersonPayload = (input = {}) => ({
  recordId: toPositiveInt(input.recordId) || null,
  first: safeString(input.first),
  last: safeString(input.last),
  title: safeString(input.title),
  date_of_birth: safeString(input.dateOfBirth || input.date_of_birth),
  gender: safeString(input.gender),
  id_type: safeString(input.idType || input.id_type),
  id_nr: safeString(input.idNumber || input.id_nr),
  dependent_nr: safeString(input.dependentNumber || input.dependent_nr),
});

const normalizeMedicalAid = (input = {}) => ({
  medicalAidId: toPositiveInt(input.medicalAidId) || null,
  planId: toPositiveInt(input.planId) || null,
  medicalAidNr: safeString(input.medicalAidNr),
});

const normalizeInvoicePayload = (input = {}) => ({
  nrInBatch: toPositiveInt(input.nrInBatch),
  dateOfService: safeString(input.dateOfService),
  status: safeString(input.status) || 'Open',
  refClientId: toPositiveInt(input.refClientId) || null,
  fileNr: safeString(input.fileNr),
  balance: input.balance !== undefined && input.balance !== null ? Number(input.balance) : 0,
  authNr: safeString(input.authNr),
});

const shouldCreatePerson = (person) => {
  if (!person) return false;
  const fields = ['first', 'last', 'title', 'date_of_birth', 'gender', 'id_type', 'id_nr'];
  return fields.some((key) => safeString(person[key]));
};

const accountController = {
  searchProfiles: async (req, res) => {
    try {
      const clientId = toPositiveInt(req.query.clientId);
      const term = safeString(req.query.q);
      if (!clientId) {
        return res.status(400).json({ error: 'clientId is required' });
      }
      if (!term || term.length < 2) {
        return res.json({ profiles: [] });
      }

      const rows = await AccountModel.searchProfilesWithAccounts({ clientId, term });
      const map = new Map();

      rows.forEach((row) => {
        const profileId = row.profile_id;
        if (!map.has(profileId)) {
          map.set(profileId, {
            profileId,
            medicalAidNr: row.medical_aid_nr,
            medicalAid: {
              id: row.medical_aid_id,
              name: row.medical_aid_name,
            },
            plan: {
              id: row.plan_id,
              name: row.plan_name,
              code: row.plan_code,
            },
            balance: row.profile_balance,
            isActive: !!row.is_active,
            mainMember: row.mm_record_id
              ? {
                  recordId: row.mm_record_id,
                  first: row.mm_first,
                  last: row.mm_last,
                  title: row.mm_title,
                  dateOfBirth: row.mm_dob,
                  gender: row.mm_gender,
                  idType: row.mm_id_type,
                  idNumber: row.mm_id_nr,
                  dependentNumber: row.mm_dependent_nr,
                }
              : null,
            accounts: [],
            profilePersons: [],
          });
        }

        if (row.account_id) {
          const profile = map.get(profileId);
          profile.accounts.push({
            accountId: row.account_id,
            clientId: row.client_id,
            mainMemberId: row.main_member_id,
            patientId: row.patient_id,
            member: row.main_member_id
              ? {
                  recordId: row.main_member_id,
                  first: row.mm_first,
                  last: row.mm_last,
                  title: row.mm_title,
                  dateOfBirth: row.mm_dob,
                  gender: row.mm_gender,
                  idType: row.mm_id_type,
                  idNumber: row.mm_id_nr,
                  dependentNumber: row.mm_dependent_nr,
                }
              : null,
            patient: row.patient_id
              ? {
                  recordId: row.patient_id,
                  first: row.patient_first,
                  last: row.patient_last,
                  title: row.patient_title,
                  dateOfBirth: row.patient_dob,
                  gender: row.patient_gender,
                  idType: row.patient_id_type,
                  idNumber: row.patient_id_nr,
                  dependentNumber: row.patient_dependent_nr,
                }
              : null,
          });
        }
      });

      const profileIds = Array.from(map.keys());
      if (profileIds.length) {
        const personRows = await AccountModel.getProfilePersons(profileIds);
        personRows.forEach((person) => {
          const profile = map.get(person.profile_id);
          if (!profile) return;
          profile.profilePersons.push({
            recordId: person.record_id,
            first: person.first,
            last: person.last,
            title: person.title,
            dateOfBirth: person.date_of_birth,
            gender: person.gender,
            idType: person.id_type,
            idNumber: person.id_nr,
            dependentNumber: person.dependent_nr,
            isMainMember: person.is_main_member === 1,
          });
        });
      }

      res.json({
        profiles: Array.from(map.values()),
      });
    } catch (err) {
      console.error('Error searching profiles/accounts:', err);
      res.status(500).json({ error: 'Failed to search profiles' });
    }
  },

  createBatchAccount: async (req, res) => {
    const batchId = toPositiveInt(req.params.batchId);
    if (!batchId) {
      return res.status(400).json({ error: 'Invalid batch ID' });
    }

    try {
      const batch = await Batch.getBatchById(batchId);
      if (!batch) {
        return res.status(404).json({ error: `Batch #${batchId} not found` });
      }

      const clientIdFromBatch = batch.client_id;
      const { invoice: invoiceInput = {}, member: memberInput = {}, patient: patientInput = {}, medicalAid: medicalAidInput = {} } =
        req.body || {};

      const member = normalizePersonPayload(memberInput);
      const patient = normalizePersonPayload(patientInput);
      const medicalAid = normalizeMedicalAid(medicalAidInput);
      const invoice = normalizeInvoicePayload(invoiceInput);

      if (!medicalAid.medicalAidNr) {
        return res.status(400).json({ error: 'Medical aid number is required' });
      }
      if (!member.recordId && !shouldCreatePerson(member)) {
        return res.status(400).json({ error: 'Member details are required' });
      }

      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();

        let memberRecordId = member.recordId;
        let memberRecordCreated = false;
        if (!memberRecordId) {
          memberRecordId = await AccountModel.insertPersonRecord(connection, member);
          memberRecordCreated = true;
        }

        let patientRecordId = patient.recordId || null;
        let patientRecordCreated = false;
        if (!patientRecordId && shouldCreatePerson(patient)) {
          patientRecordId = await AccountModel.insertPersonRecord(connection, patient);
          patientRecordCreated = true;
        }

        let profile = await AccountModel.findProfileByMedicalAidNr(connection, medicalAid.medicalAidNr);
        let profileId = profile?.profile_id || null;
        let profileCreated = false;

        if (!profileId) {
          profileId = await AccountModel.createProfile(connection, {
            medicalAidId: medicalAid.medicalAidId,
            planId: medicalAid.planId,
            medicalAidNr: medicalAid.medicalAidNr,
          });
          profileCreated = true;
        }

        const ensureMap = async ({ recordId, isMainMember, dependentNr }) => {
          if (!recordId) return;
          const existingMap = await AccountModel.hasProfilePersonMap(connection, {
            profileId,
            recordId,
          });
          if (!existingMap) {
            await AccountModel.insertProfilePersonMap(connection, {
              profileId,
              recordId,
              isMainMember,
              dependentNr,
            });
          }
        };

        await ensureMap({ recordId: memberRecordId, isMainMember: true, dependentNr: member.dependent_nr });
        await ensureMap({ recordId: patientRecordId, isMainMember: false, dependentNr: patient.dependent_nr });

        let account = await AccountModel.findAccountByKeys(connection, {
          profileId,
          clientId: clientIdFromBatch,
          mainMemberId: memberRecordId,
          patientId: patientRecordId,
        });
        let accountId = account?.account_id || null;
        let accountCreated = false;

        if (!accountId) {
          accountId = await AccountModel.createAccount(connection, {
            profileId,
            clientId: clientIdFromBatch,
            mainMemberId: memberRecordId,
            patientId: patientRecordId,
          });
          accountCreated = true;
        }

        const invoiceId = await AccountModel.createInvoice(connection, {
          accountId,
          batchId,
          nrInBatch: invoice.nrInBatch,
          dateOfService: invoice.dateOfService,
          status: invoice.status,
          refClientId: invoice.refClientId || clientIdFromBatch,
          fileNr: invoice.fileNr,
          balance: invoice.balance,
          authNr: invoice.authNr,
        });

        await connection.commit();

        const createdInvoice = await Invoice.getById(invoiceId);
        res.status(201).json({
          message: 'Invoice created successfully',
          invoice: createdInvoice,
          meta: {
            profileId,
            accountId,
            created: {
              profile: profileCreated,
              account: accountCreated,
              memberRecord: memberRecordCreated,
              patientRecord: patientRecordCreated,
            },
          },
        });
      } catch (err) {
        await connection.rollback();
        console.error('Error creating batch account:', err);
        res.status(500).json({ error: 'Failed to create account/invoice' });
      } finally {
        connection.release();
      }
    } catch (err) {
      console.error('Batch account error:', err);
      res.status(500).json({ error: 'Unexpected server error' });
    }
  },

  getMedicalAidCatalog: async (req, res) => {
    try {
      const [medicalAids, medicalAidPlans] = await Promise.all([
        AccountModel.getAllMedicalAids(),
        AccountModel.getAllMedicalAidPlans(),
      ]);

      const planMap = new Map();
      medicalAidPlans.forEach((plan) => {
        if (!planMap.has(plan.medical_aid_id)) {
          planMap.set(plan.medical_aid_id, []);
        }
        planMap.get(plan.medical_aid_id).push({
          id: plan.plan_id,
          name: plan.plan_name,
          code: plan.plan_code,
          medicalAidId: plan.medical_aid_id,
        });
      });

      const normalized = medicalAids.map((aid) => ({
        id: aid.medical_aid_id,
        name: aid.name,
        plans: planMap.get(aid.medical_aid_id) || [],
      }));

      res.json({ medicalAids: normalized });
    } catch (err) {
      console.error('Error fetching medical aid catalog:', err);
      res.status(500).json({ error: 'Failed to load medical aid catalog' });
    }
  },
};

module.exports = accountController;
