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

const normalizeContactNumbers = (input = []) => {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => ({
      num_type: safeString(item.num_type || item.numType || item.type) || 'Other',
      num: safeString(item.num || item.number),
    }))
    .filter((item) => Boolean(item.num));
};

const normalizeAddresses = (input = []) => {
  if (!Array.isArray(input)) return [];
  let foundDomicilium = false;
  const normalized = input
    .map((item) => {
      const address = safeString(item.address || item.line);
      if (!address) return null;
      const isDomicilium = normalizeBooleanFlag(item.is_domicilium || item.isDomicilium || item.domicilium);
      if (isDomicilium && !foundDomicilium) {
        foundDomicilium = true;
      }
      return {
        address_type: safeString(item.address_type || item.addressType || item.type) || 'Other',
        address,
        is_domicilium: isDomicilium,
      };
    })
    .filter(Boolean);

  if (!foundDomicilium && normalized.length) {
    normalized[0].is_domicilium = true;
  }
  return normalized.map((addr, index) => ({
    ...addr,
    is_domicilium: addr.is_domicilium && index === normalized.findIndex((a) => a.is_domicilium),
  }));
};

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
  type: safeString(input.type)?.toUpperCase() || 'NORMAL',
});

const shouldCreatePerson = (person) => {
  if (!person) return false;
  const fields = ['first', 'last', 'title', 'date_of_birth', 'gender', 'id_type', 'id_nr'];
  return fields.some((key) => safeString(person[key]));
};

const ALLOWED_INVOICE_TYPES = new Set(['NORMAL', 'WCA', 'RAF']);

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
          const personPayload = {
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
            contactNumbers: person.contactNumbers || [],
            addresses: person.addresses || [],
          };
          profile.profilePersons.push(personPayload);
        });

        // Enrich main members / patients in accounts with contact + address details
        const attachContactInfo = (personObj) => {
          if (!personObj || !personObj.recordId) return personObj;
          const details = personRows.find((p) => p.record_id === personObj.recordId);
          if (!details) return personObj;
          return {
            ...personObj,
            contactNumbers: details.contactNumbers || [],
            addresses: details.addresses || [],
          };
        };

        map.forEach((profile) => {
          if (profile.mainMember) {
            profile.mainMember = attachContactInfo(profile.mainMember);
          }
          profile.accounts = (profile.accounts || []).map((account) => ({
            ...account,
            member: attachContactInfo(account.member),
            patient: attachContactInfo(account.patient),
          }));
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
      if (!member.recordId && !existingInvoice.main_member_record_id) {
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

        const resolvePersonId = async (providedId, fallbackId, payload, allowCreate = false) => {
          if (toPositiveInt(providedId)) return toPositiveInt(providedId);
          if (toPositiveInt(fallbackId)) return toPositiveInt(fallbackId);
          if (allowCreate && shouldCreatePerson(payload)) {
            const newId = await AccountModel.insertPersonRecord(connection, payload);
            return newId;
          }
          return null;
        };

        const memberRecordId = await resolvePersonId(member.recordId, existingInvoice.main_member_record_id, member, false);
        if (!memberRecordId) {
          throw new Error('Missing member record for invoice update');
        }

        let patientRecordId = await resolvePersonId(
          isPatientSameAsMember ? memberRecordId : patient.recordId,
          existingInvoice.patient_record_id,
          patient,
          false,
        );
        const targetPatientRecordId = isPatientSameAsMember ? memberRecordId : patientRecordId || null;

        const ensureMap = async ({ recordId, isMainMember, dependentNr }) => {
          if (!profileId || !recordId) return;
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
        if (targetPatientRecordId && targetPatientRecordId !== memberRecordId) {
          await ensureMap({ recordId: targetPatientRecordId, isMainMember: false, dependentNr: patient.dependent_nr });
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

  createProfile: async (req, res) => {
    try {
      const medicalAidId = toPositiveInt(req.body?.medicalAidId);
      const planId = toPositiveInt(req.body?.planId);
      const medicalAidNr = safeString(req.body?.medicalAidNr);

      if (!medicalAidNr) {
        return res.status(400).json({ error: 'medicalAidNr is required' });
      }

      const existingProfile = await AccountModel.findProfileByMedicalAidNr(null, medicalAidNr);
      if (existingProfile) {
        return res.status(409).json({ error: 'Profile already exists for this medical aid number', profile: existingProfile });
      }

      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();
        const profileId = await AccountModel.createProfile(connection, {
          medicalAidId,
          planId,
          medicalAidNr,
        });
        await connection.commit();
        res.status(201).json({
          profile: {
            profileId,
            medicalAidId,
            planId,
            medicalAidNr,
          },
        });
      } catch (err) {
        await connection.rollback();
        console.error('Error creating profile:', err);
        res.status(500).json({ error: 'Failed to create profile' });
      } finally {
        connection.release();
      }
    } catch (err) {
      console.error('Profile creation error:', err);
      res.status(500).json({ error: 'Unexpected server error' });
    }
  },

  createProfilePerson: async (req, res) => {
    const profileId = toPositiveInt(req.params.profileId);
    if (!profileId) {
      return res.status(400).json({ error: 'Invalid profile ID' });
    }

    try {
      const personPayload = normalizePersonPayload(req.body?.person || {});
      const contactNumbers = normalizeContactNumbers(req.body?.contactNumbers || req.body?.person?.contactNumbers || []);
      const addresses = normalizeAddresses(req.body?.addresses || req.body?.person?.addresses || []);
      const isMainMember = normalizeBooleanFlag(req.body?.isMainMember);
      const dependentNumber = safeString(req.body?.dependentNumber || req.body?.person?.dependentNumber);

      if (!shouldCreatePerson(personPayload)) {
        return res.status(400).json({ error: 'Person details are required' });
      }

      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();
        const recordId = await AccountModel.insertPersonRecord(connection, personPayload);
        await AccountModel.insertProfilePersonMap(connection, {
          profileId,
          recordId,
          isMainMember,
          dependentNr: dependentNumber,
        });
        await AccountModel.replaceContactNumbers(connection, recordId, contactNumbers);
        await AccountModel.replaceAddresses(connection, recordId, addresses);
        await connection.commit();
        res.status(201).json({
          person: {
            ...personPayload,
            recordId,
            dependentNumber,
            isMainMember,
            contactNumbers,
            addresses,
          },
        });
      } catch (err) {
        await connection.rollback();
        console.error('Error creating profile person:', err);
        res.status(500).json({ error: 'Failed to create person' });
      } finally {
        connection.release();
      }
    } catch (err) {
      console.error('Profile person creation error:', err);
      res.status(500).json({ error: 'Unexpected server error' });
    }
  },

  updateProfilePerson: async (req, res) => {
    const profileId = toPositiveInt(req.params.profileId);
    const recordId = toPositiveInt(req.params.recordId);
    if (!profileId || !recordId) {
      return res.status(400).json({ error: 'Invalid profile or person ID' });
    }

    try {
      const personPayload = normalizePersonPayload(req.body?.person || {});
      const contactNumbers = normalizeContactNumbers(req.body?.contactNumbers || req.body?.person?.contactNumbers || []);
      const addresses = normalizeAddresses(req.body?.addresses || req.body?.person?.addresses || []);
      const isMainMember = normalizeBooleanFlag(req.body?.isMainMember);
      const dependentNumber = safeString(req.body?.dependentNumber || req.body?.person?.dependentNumber);

      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();
        await AccountModel.updatePersonRecord(connection, recordId, personPayload);
        await AccountModel.upsertProfilePersonMap(connection, {
          profileId,
          recordId,
          isMainMember,
          dependentNr: dependentNumber,
        });
        await AccountModel.replaceContactNumbers(connection, recordId, contactNumbers);
        await AccountModel.replaceAddresses(connection, recordId, addresses);
        await connection.commit();
        res.json({
          person: {
            ...personPayload,
            recordId,
            dependentNumber,
            isMainMember,
            contactNumbers,
            addresses,
          },
        });
      } catch (err) {
        await connection.rollback();
        console.error('Error updating profile person:', err);
        res.status(500).json({ error: 'Failed to update person' });
      } finally {
        connection.release();
      }
    } catch (err) {
      console.error('Profile person update error:', err);
      res.status(500).json({ error: 'Unexpected server error' });
    }
  },
};

module.exports = accountController;
