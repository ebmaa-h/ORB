const db = require('../config/db');
const AccountModel = require('../models/accountModel');
const Invoice = require('../models/invoiceModel');
const Batch = require('../models/batchModel');
const { logInvoiceChange } = require('../utils/invoiceChangeLogger');

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

const normalizeBooleanFlag = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['1', 'true', 'yes', 'on'].includes(normalized);
  }
  return false;
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
  type: safeString(input.type),
});

const shouldCreatePerson = (person) => {
  if (!person) return false;
  const fields = ['first', 'last', 'title', 'date_of_birth', 'gender', 'id_type', 'id_nr'];
  return fields.some((key) => safeString(person[key]));
};

const ALLOWED_INVOICE_TYPES = new Set(['normal', 'other', 'foreign', 'urgent_normal', 'urgent_other']);

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
      const {
        invoice: invoiceInput = {},
        member: memberInput = {},
        patient: patientInput = {},
        medicalAid: medicalAidInput = {},
        patientSameAsMember = false,
      } = req.body || {};

      const member = normalizePersonPayload(memberInput);
      const patient = normalizePersonPayload(patientInput);
      const medicalAid = normalizeMedicalAid(medicalAidInput);
      const invoice = normalizeInvoicePayload(invoiceInput);
      const isPatientSameAsMember = normalizeBooleanFlag(patientSameAsMember);

      if (!medicalAid.medicalAidNr) {
        return res.status(400).json({ error: 'Medical aid number is required' });
      }
      if (!member.recordId && !shouldCreatePerson(member)) {
        return res.status(400).json({ error: 'Member details are required' });
      }
      if (!invoice.type || !ALLOWED_INVOICE_TYPES.has(invoice.type)) {
        return res.status(400).json({ error: 'Invoice type is required' });
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
        if (isPatientSameAsMember) {
          patientRecordId = memberRecordId;
        } else if (!patientRecordId && shouldCreatePerson(patient)) {
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
        if (!isPatientSameAsMember) {
          await ensureMap({ recordId: patientRecordId, isMainMember: false, dependentNr: patient.dependent_nr });
        }

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
          type: invoice.type,
        });

        await connection.commit();

        const createdInvoice = await Invoice.getById(invoiceId);
        await logInvoiceChange({
          userId: req.user?.user_id || null,
          batch,
          accountId,
          profileId,
          previousInvoice: null,
          nextInvoice: createdInvoice,
          eventType: 'create',
        });
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

  updateBatchInvoice: async (req, res) => {
    const batchId = toPositiveInt(req.params.batchId);
    const invoiceId = toPositiveInt(req.params.invoiceId);
    if (!batchId || !invoiceId) {
      return res.status(400).json({ error: 'Invalid batch or invoice ID' });
    }

    try {
      const batch = await Batch.getBatchById(batchId);
      if (!batch) {
        return res.status(404).json({ error: `Batch #${batchId} not found` });
      }

      const existingInvoice = await Invoice.getById(invoiceId);
      if (!existingInvoice) {
        return res.status(404).json({ error: `Invoice #${invoiceId} not found` });
      }
      if (existingInvoice.batch_id !== batchId) {
        return res.status(400).json({ error: 'Invoice does not belong to this batch' });
      }

      const {
        invoice: invoiceInput = {},
        member: memberInput = {},
        patient: patientInput = {},
        medicalAid: medicalAidInput = {},
        patientSameAsMember = false,
      } = req.body || {};

      const member = normalizePersonPayload(memberInput);
      const patient = normalizePersonPayload(patientInput);
      const medicalAid = normalizeMedicalAid(medicalAidInput);
      const invoice = normalizeInvoicePayload(invoiceInput);
      const isPatientSameAsMember = normalizeBooleanFlag(patientSameAsMember);

      if (!medicalAid.medicalAidNr) {
        return res.status(400).json({ error: 'Medical aid number is required' });
      }
      if (!member.recordId && !shouldCreatePerson(member)) {
        return res.status(400).json({ error: 'Member details are required' });
      }
      if (!invoice.type || !ALLOWED_INVOICE_TYPES.has(invoice.type)) {
        return res.status(400).json({ error: 'Invoice type is required' });
      }

      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();

        const profileId = existingInvoice.profile_id;
        if (profileId) {
          await AccountModel.updateProfile(connection, {
            profileId,
            medicalAidId: medicalAid.medicalAidId,
            planId: medicalAid.planId,
            medicalAidNr: medicalAid.medicalAidNr,
          });
        }

        let memberRecordId = member.recordId || existingInvoice.main_member_record_id || null;
        if (!memberRecordId) {
          memberRecordId = await AccountModel.insertPersonRecord(connection, member);
        } else {
          await AccountModel.updatePersonRecord(connection, memberRecordId, member);
        }

        let patientRecordId = patient.recordId || existingInvoice.patient_record_id || null;
        if (isPatientSameAsMember) {
          patientRecordId = memberRecordId;
        } else if (patientRecordId) {
          await AccountModel.updatePersonRecord(connection, patientRecordId, patient);
        } else if (shouldCreatePerson(patient)) {
          patientRecordId = await AccountModel.insertPersonRecord(connection, patient);
        } else {
          patientRecordId = null;
        }

        await AccountModel.upsertProfilePersonMap(connection, {
          profileId,
          recordId: memberRecordId,
          isMainMember: true,
          dependentNr: member.dependent_nr,
        });

        const targetPatientRecordId = isPatientSameAsMember ? memberRecordId : patientRecordId || null;
        if (targetPatientRecordId && targetPatientRecordId !== memberRecordId) {
          await AccountModel.upsertProfilePersonMap(connection, {
            profileId,
            recordId: targetPatientRecordId,
            isMainMember: false,
            dependentNr: patient.dependent_nr,
          });
        }

        let targetAccount = await AccountModel.findAccountByKeys(connection, {
          profileId,
          clientId: batch.client_id,
          mainMemberId: memberRecordId,
          patientId: targetPatientRecordId,
        });
        let targetAccountId = targetAccount?.account_id || null;
        if (!targetAccountId) {
          targetAccountId = await AccountModel.createAccount(connection, {
            profileId,
            clientId: batch.client_id,
            mainMemberId: memberRecordId,
            patientId: targetPatientRecordId,
          });
        }

        const shouldDeletePreviousPatient =
          previousPatientRecordId &&
          previousPatientRecordId !== memberRecordId &&
          previousPatientRecordId !== targetPatientRecordId;

        if (shouldDeletePreviousPatient) {
          await AccountModel.deleteProfilePersonMap(connection, {
            profileId,
            recordId: previousPatientRecordId,
          });
        }

        await AccountModel.updateInvoice(connection, {
          invoiceId,
          accountId: targetAccountId,
          nrInBatch: invoice.nrInBatch ?? existingInvoice.nr_in_batch ?? null,
          dateOfService: invoice.dateOfService,
          status: invoice.status,
          refClientId: invoice.refClientId || batch.client_id,
          fileNr: invoice.fileNr,
          balance: invoice.balance,
          authNr: invoice.authNr,
          type: invoice.type,
        });

        await connection.commit();

        const updatedInvoice = await Invoice.getById(invoiceId);
        await logInvoiceChange({
          userId: req.user?.user_id || null,
          batch,
          accountId: targetAccountId,
          profileId,
          previousInvoice: existingInvoice,
          nextInvoice: updatedInvoice,
          eventType: 'update',
        });
        res.json({
          message: 'Invoice updated successfully',
          invoice: updatedInvoice,
        });
      } catch (err) {
        await connection.rollback();
        console.error('Error updating batch invoice:', err);
        res.status(500).json({ error: 'Failed to update invoice' });
      } finally {
        connection.release();
      }
    } catch (err) {
      console.error('Batch invoice update error:', err);
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
