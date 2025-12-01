import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import EntityNotesAndLogs from "../components/ui/EntityNotesAndLogs";
import SearchBar from "../components/ui/SearchBar";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import axiosClient from "../utils/axiosClient";
import ENDPOINTS from "../utils/apiEndpoints";
import { normalizeIsFuFlag, normalizeIsPureFlag } from "../domain/batch";

const defaultPerson = () => ({
  recordId: "",
  first: "",
  last: "",
  title: "",
  dateOfBirth: "",
  gender: "",
  idType: "",
  idNumber: "",
  dependentNumber: "",
});

const STATUS_OPTIONS = ["Open", "Archived"];

const INVOICE_TYPE_LABELS = {
  NORMAL: "Normal",
  WCA: "WCA",
  RAF: "RAF",
};

const getBatchIdForMode = (batch, { preferForeignUrgent = false } = {}) => {
  if (!batch) return null;
  const foreignId = batch.foreign_urgent_batch_id ?? batch.foreignUrgentBatchId ?? null;
  const normalId = batch.batch_id ?? batch.batchId ?? null;
  return preferForeignUrgent ? foreignId || normalId || null : normalId || foreignId || null;
};

const isForeignUrgentBatchType = (batch) => {
  if (!batch) return false;
  if (
    normalizeIsFuFlag(batch.is_fu) ||
    batch.foreign_urgent_batch_id ||
    batch.foreignUrgentBatchId
  ) {
    return true;
  }
  return normalizeIsPureFlag(batch.is_pure_foreign_urgent);
};

const FOREIGN_URGENT_INVOICE_TYPES = new Set(["foreign", "urgent_normal", "urgent_other"]);

const DEFAULT_BALANCE_VALUE = "0,00";

const parseBalanceInput = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const trimmed = typeof value === "string" ? value.trim() : String(value);
  if (!trimmed) return 0;

  let normalized = trimmed.replace(/\s+/g, "");
  const hasComma = normalized.includes(",");
  const hasDot = normalized.includes(".");
  if (hasComma && !hasDot) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = normalized.replace(/,/g, "");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isForeignUrgentInvoice = (invoice) => {
  if (!invoice) return false;
  if (invoice.foreign_urgent_batch_id) return true;
  const type = (invoice.invoice_type || invoice.type || "").toLowerCase();
  return FOREIGN_URGENT_INVOICE_TYPES.has(type);
};

const TAB_KEYS = {
  ACCOUNT: "account",
  NOTES: "notes",
};

const VIEW_MODES = {
  ACCOUNT: "account",
  PERSON: "person",
};

const CONTACT_TYPES = ["Cell", "Tell", "Work", "Other"];
const ADDRESS_TYPES = ["Street", "Postal", "Other"];

const formatPersonName = (person) => {
  if (!person) return "N/A";
  const first = typeof person.first === "string" ? person.first.trim() : "";
  const last = typeof person.last === "string" ? person.last.trim() : "";
  const combined = [first, last].filter(Boolean).join(" ");
  return combined || (person.title ? person.title : "N/A");
};

const normalizeDateForInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value.split("T")[0] || value : "";
  }
  return date.toISOString().slice(0, 10);
};

const formatPersonMeta = (person, { includeDependent = false } = {}) => {
  if (!person) return "";
  const meta = [];
  if (person.idNumber) meta.push(`ID: ${person.idNumber}`);
  if (includeDependent && person.dependentNumber !== undefined && person.dependentNumber !== null && person.dependentNumber !== "") {
    meta.push(`Dep: ${person.dependentNumber}`);
  }
  if (person.dateOfBirth) meta.push(`DOB: ${person.dateOfBirth}`);
  if (person.gender) meta.push(`Gender: ${person.gender}`);
  return meta.join(" • ");
};

const buildProfilePersons = (profile) => {
  if (!profile) {
    return { all: [], mainMember: null, dependants: [] };
  }
  const personMap = new Map();
  let anonCounter = 0;

  const makeKey = (person = {}) => {
    const fallback = `${person.first || ""}-${person.last || ""}-${person.dateOfBirth || ""}-${person.dependentNumber || ""}`;
    return person.recordId || person.idNumber || (fallback.trim() ? fallback : `anon-${anonCounter++}`);
  };

  const addPerson = (person, roleLabel = null, extra = {}) => {
    if (!person) return;
    const key = makeKey(person);
    if (!key) return;
    const existing = personMap.get(key);
    if (existing) {
      if (roleLabel && !existing.roles.includes(roleLabel)) {
        existing.roles.push(roleLabel);
      }
      return;
    }
    const isMainMember = extra.isMainMember || Number(person.dependentNumber) === 0 || roleLabel === "Main member";
    const isDependant = extra.isDependant || Number(person.dependentNumber) > 0 || roleLabel === "Dependant";
    personMap.set(key, {
      key,
      person,
      name: formatPersonName(person),
      meta: formatPersonMeta(person, { includeDependent: true }),
      dependentNumber: person.dependentNumber || "",
      roles: roleLabel ? [roleLabel] : [],
      isMainMember,
      isDependant,
    });
  };

  const sourcePersons = Array.isArray(profile.profilePersons) && profile.profilePersons.length
    ? profile.profilePersons
    : [];

  if (sourcePersons.length) {
    sourcePersons.forEach((person) => {
      const role = person.isMainMember ? "Main member" : Number(person.dependentNumber) > 0 ? "Dependant" : null;
      addPerson(person, role, {
        isMainMember: person.isMainMember,
        isDependant: Number(person.dependentNumber) > 0,
      });
    });
  } else {
    if (profile.mainMember) addPerson(profile.mainMember, "Main member", { isMainMember: true });
    (profile.accounts || []).forEach((account) => {
      if (account.member) addPerson(account.member, "Member");
      if (account.patient) addPerson(account.patient, "Dependant");
    });
  }

  const all = Array.from(personMap.values());
  const mainMember = all.find((entry) => entry.isMainMember);
  const dependants = all.filter((entry) => entry.isDependant);

  return { all, mainMember, dependants };
};

const formatClientDisplayName = (batch) => {
  if (!batch) return "Client";
  const toNamePart = (value) => (typeof value === "string" ? value.trim() : "");
  const first = toNamePart(batch.client_first);
  const last = toNamePart(batch.client_last);
  const combined = [first, last].filter(Boolean).join(" ").trim();
  if (combined) {
    return /^dr\b/i.test(combined) ? combined : `Dr ${combined}`;
  }
  return batch.client_id ? `Client #${batch.client_id}` : "Client";
};

const AddAccount = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isFuRoute = location.pathname.startsWith("/fu-batches");
  const batch = location.state?.batch || null;
  const existingInvoice = location.state?.invoice || null;
  const originFrom = location.state?.from || null;
  const backPath = typeof originFrom === "string" ? originFrom : originFrom?.path;
  const backActiveStatus = typeof originFrom === "object" ? originFrom.activeStatus : null;
  const backFilterType = typeof originFrom === "object" ? originFrom.filterType : null;
  const backTarget = backPath || "/workflow";
  const backOptions =
    backActiveStatus || backFilterType
      ? { state: { activeStatus: backActiveStatus, filterType: backFilterType } }
      : undefined;
  const handleBack = () => navigate(backTarget, backOptions);
  const currentPath = `${location.pathname}${location.search}`;
  const existingInvoiceType = (existingInvoice?.invoice_type || existingInvoice?.type || "").toString().toUpperCase();
  const isViewingInvoice = Boolean(existingInvoice?.invoice_id);

  const [activeTab, setActiveTab] = useState(TAB_KEYS.ACCOUNT);
  const [searchTerm, setSearchTerm] = useState("");
  const latestSearchTermRef = useRef("");
  const handleSearchTermChange = useCallback((value) => {
    latestSearchTermRef.current = value;
    setSearchTerm(value);
  }, []);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [viewMode, setViewMode] = useState(VIEW_MODES.ACCOUNT);
  const [personEditor, setPersonEditor] = useState({
    profileId: null,
    recordId: null,
    isMainMember: false,
    dependentNumber: "",
    data: defaultPerson(),
    contactNumbers: [],
    addresses: [],
    emails: [],
    saving: false,
    error: "",
  });
  const [newProfileDraft, setNewProfileDraft] = useState(null);
  const [newProfileSaving, setNewProfileSaving] = useState(false);
  const [newProfileError, setNewProfileError] = useState("");
  const [confirmState, setConfirmState] = useState({ open: false, message: "", onConfirm: null });

  const [memberForm, setMemberForm] = useState(defaultPerson);
  const [patientForm, setPatientForm] = useState(defaultPerson);
  const [isPatientSameAsMember, setIsPatientSameAsMember] = useState(false);
  const [medicalAidForm, setMedicalAidForm] = useState({
    medicalAidId: "",
    planId: "",
    medicalAidNr: "",
  });
  const [medicalAidCatalog, setMedicalAidCatalog] = useState([]);
  const [invoiceForm, setInvoiceForm] = useState({
    nrInBatch: "",
    dateOfService: "",
    status: "Open",
    fileNr: "",
    balance: DEFAULT_BALANCE_VALUE,
    authNr: "",
    type: "NORMAL",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [lastImported, setLastImported] = useState(null);
  const lockedProfileId = lastImported?.profileId ? String(lastImported.profileId) : null;
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);
  const isForeignUrgentBatch = useMemo(() => isForeignUrgentBatchType(batch) || isFuRoute, [batch, isFuRoute]);
  const mainBatchId = useMemo(
    () => getBatchIdForMode(batch, { preferForeignUrgent: isForeignUrgentBatch }),
    [batch, isForeignUrgentBatch],
  );
  const batchBasePath = isFuRoute || isForeignUrgentBatch ? "/fu-batches" : "/batches";
  const invoiceTypeOptions = useMemo(() => {
    const base = ["NORMAL", "WCA", "RAF"];
    if (existingInvoiceType && !base.includes(existingInvoiceType)) {
      return [...base, existingInvoiceType];
    }
    return base;
  }, [existingInvoiceType]);
  const selectedInvoiceType = invoiceForm.type;
  const memberFieldsDisabled = true;
  const medicalAidFieldsDisabled = true;
  const patientFieldsDisabled = true;
  const canImportData = true;

  useEffect(() => {
    let cancelled = false;
    const fetchMedicalAidCatalog = async () => {
      try {
        const res = await axiosClient.get(ENDPOINTS.medicalAidCatalog);
        if (cancelled) return;
        setMedicalAidCatalog(res.data?.medicalAids || []);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load medical aid catalog:", err);
      }
    };

    fetchMedicalAidCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mainBatchId) return;
    let cancelled = false;

    const fetchInvoices = async () => {
      try {
        const res = await axiosClient.get(ENDPOINTS.batchInvoices(mainBatchId), {
          params: { is_fu: isForeignUrgentBatch ? 1 : 0 },
        });
        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data : res.data?.invoices;
        const scoped = Array.isArray(list)
          ? list.filter((invoice) =>
              isForeignUrgentBatch ? isForeignUrgentInvoice(invoice) : !isForeignUrgentInvoice(invoice),
            )
          : [];
        const count = scoped.length;
        setInvoiceForm((prev) => ({
          ...prev,
          nrInBatch: isForeignUrgentBatch ? 1 : prev.nrInBatch || count + 1,
        }));
      } catch (err) {
        console.error("Failed to load invoices for numbering:", err);
      }
    };

    fetchInvoices();
    return () => {
      cancelled = true;
    };
  }, [mainBatchId, isForeignUrgentBatch]);

  useEffect(() => {
    if (existingInvoice) return;
    if (!invoiceForm.type) {
      setInvoiceForm((prev) => ({ ...prev, type: "NORMAL" }));
    }
  }, [existingInvoice, invoiceForm.type]);

  const clientDisplayName = useMemo(() => formatClientDisplayName(batch), [batch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!existingInvoice) return;
    const memberData = {
      recordId: existingInvoice.main_member_record_id,
      first: existingInvoice.main_member_first,
      last: existingInvoice.main_member_last,
      title: existingInvoice.main_member_title,
      dateOfBirth: existingInvoice.main_member_dob,
      gender: existingInvoice.main_member_gender,
      idType: existingInvoice.main_member_id_type,
      idNumber: existingInvoice.main_member_id_nr,
      dependentNumber: existingInvoice.main_member_dependent_nr,
    };
    const patientData = existingInvoice.patient_record_id
      ? {
          recordId: existingInvoice.patient_record_id,
          first: existingInvoice.patient_first,
          last: existingInvoice.patient_last,
          title: existingInvoice.patient_title,
          dateOfBirth: existingInvoice.patient_dob,
          gender: existingInvoice.patient_gender,
          idType: existingInvoice.patient_id_type,
          idNumber: existingInvoice.patient_id_nr,
          dependentNumber: existingInvoice.patient_dependent_nr,
        }
      : null;
    const samePerson =
      !existingInvoice.patient_record_id || existingInvoice.patient_record_id === existingInvoice.main_member_record_id;
    const patientSource = patientData || (samePerson ? { ...memberData, dependentNumber: existingInvoice.patient_dependent_nr || memberData.dependentNumber } : null);

    setMemberForm(hydratePersonForm(memberData));
    setPatientForm(patientSource ? hydratePersonForm(patientSource) : defaultPerson());
    setIsPatientSameAsMember(samePerson);
    setMedicalAidForm({
      medicalAidId: existingInvoice.medical_aid_id ? String(existingInvoice.medical_aid_id) : "",
      planId: existingInvoice.plan_id ? String(existingInvoice.plan_id) : "",
      medicalAidNr: existingInvoice.medical_aid_nr || "",
    });
    setInvoiceForm({
      nrInBatch: existingInvoice.nr_in_batch || "",
      dateOfService: normalizeDateForInput(existingInvoice.date_of_service),
      status: existingInvoice.status || "Open",
      fileNr: existingInvoice.file_nr || "",
      balance:
        existingInvoice.balance !== null && existingInvoice.balance !== undefined
          ? String(existingInvoice.balance)
          : "",
      authNr: existingInvoice.auth_nr || "",
      type: existingInvoiceType ? existingInvoiceType.toString() : "",
    });
    if (existingInvoice.profile_id) {
      setLastImported({
        profileId: String(existingInvoice.profile_id),
        accountId: existingInvoice.account_id || null,
      });
    } else {
      setLastImported(null);
    }
  }, [existingInvoice]);

  if (!batch) {
    return (
      <section className="container-col">
        <p className="text-gray-dark">
          Batch with ID <strong>#{batchId}</strong> unavailable for creating an account.
        </p>
        <button
          type="button"
          className="tab-pill-dark bg-ebmaa-purple text-white px-6 hover:bg-ebmaa-purple-light mt-4 flex items-center justify-center"
          onClick={handleBack}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 -960 960 960"
            width="20"
            height="20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M360-240 120-480l240-240 56 56-144 144h568v80H272l144 144-56 56Z" />
          </svg>
          <span className="sr-only">Back</span>
        </button>
      </section>
    );
  }

  const selectedTypeLabel = invoiceForm.type ? INVOICE_TYPE_LABELS[invoiceForm.type] || invoiceForm.type : "Select type";
  const infoItems = [
    { label: "Client", value: clientDisplayName },
    { label: "Batch ID", value: mainBatchId ? `${isForeignUrgentBatch ? "FU-Batch" : "Batch"} #${mainBatchId}` : "N/A" },
    { label: "Type", value: selectedTypeLabel },
  ];
  if (isForeignUrgentBatch) {
    infoItems.push({ label: "FU", value: "Foreign & Urgent" });
  }
  const departmentKey = (batch.current_department || "").toLowerCase();
  const batchTypeKey = isForeignUrgentBatch ? "foreign_urgent" : "normal";
  const invoiceEntityId = existingInvoice?.invoice_id ? String(existingInvoice.invoice_id) : null;

  const selectedMedicalAid = useMemo(() => {
    if (!medicalAidForm.medicalAidId) return null;
    return medicalAidCatalog.find((aid) => String(aid.id) === String(medicalAidForm.medicalAidId)) || null;
  }, [medicalAidCatalog, medicalAidForm.medicalAidId]);

  const availablePlans = useMemo(
    () => (selectedMedicalAid && Array.isArray(selectedMedicalAid.plans) ? selectedMedicalAid.plans : []),
    [selectedMedicalAid],
  );

  const handleSearchProfiles = async (overrideTerm = null) => {
    if (!batch.client_id) {
      setSearchError("Client ID unavailable for this batch.");
      return;
    }
    let normalizedOverride = overrideTerm;
    if (
      normalizedOverride &&
      typeof normalizedOverride === "object" &&
      (typeof normalizedOverride.preventDefault === "function" || typeof normalizedOverride.stopPropagation === "function")
    ) {
      normalizedOverride = null;
    }
    const rawTermSource =
      normalizedOverride !== null && normalizedOverride !== undefined
        ? normalizedOverride
        : latestSearchTermRef.current || searchTerm;
    const rawTerm = typeof rawTermSource === "string" ? rawTermSource : String(rawTermSource || "");
    if (!rawTerm.trim()) {
      setProfiles([]);
      setSearchError("");
      return;
    }
    setSearchLoading(true);
    setSearchError("");
    try {
      const res = await axiosClient.get(ENDPOINTS.accountSearch, {
        params: { clientId: batch.client_id, q: rawTerm.trim() },
      });
      setProfiles(res.data?.profiles || []);
      setNewProfileDraft(null);
    } catch (err) {
      setSearchError(err?.response?.data?.error || "Failed to search profiles");
      setProfiles([]);
    } finally {
      setSearchLoading(false);
    }
  };


  useEffect(() => {
    if (!medicalAidForm.planId) return;
    const selectedAid = medicalAidCatalog.find((aid) => String(aid.id) === String(medicalAidForm.medicalAidId));
    if (!selectedAid) return;
    const planExists = (selectedAid.plans || []).some((plan) => String(plan.id) === String(medicalAidForm.planId));
    if (!planExists) {
      setMedicalAidForm((prev) => ({ ...prev, planId: "" }));
    }
  }, [medicalAidCatalog, medicalAidForm.medicalAidId, medicalAidForm.planId]);

  useEffect(() => {
    if (!isViewingInvoice || !existingInvoice?.medical_aid_nr) return;
    const preset = existingInvoice.medical_aid_nr;
    handleSearchTermChange(preset);
    handleSearchProfiles(preset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isViewingInvoice, existingInvoice?.medical_aid_nr]);

  useEffect(() => {
    if (!newProfileDraft?.medicalAidId) return;
    const draftAid = medicalAidCatalog.find((aid) => String(aid.id) === String(newProfileDraft.medicalAidId));
    if (!draftAid) return;
    const planExists = (draftAid.plans || []).some((plan) => String(plan.id) === String(newProfileDraft.planId));
    if (!planExists) {
      setNewProfileDraft((prev) => (prev ? { ...prev, planId: "" } : prev));
    }
  }, [medicalAidCatalog, newProfileDraft?.medicalAidId, newProfileDraft?.planId]);


const hydratePersonForm = (data = {}) => ({
  recordId: data.recordId || "",
  first: data.first || "",
  last: data.last || "",
  title: data.title || "",
  dateOfBirth: normalizeDateForInput(data.dateOfBirth || data.date_of_birth),
  gender: data.gender || "",
  idType: data.idType || data.id_type || "",
  idNumber: data.idNumber || data.id_nr || "",
  dependentNumber:
    data.dependentNumber !== undefined && data.dependentNumber !== null
      ? String(data.dependentNumber)
      : "",
});

  const handleInvoiceTypeSelect = (type) => {
    setInvoiceForm((prev) => ({ ...prev, type: prev.type === type ? "" : type }));
  };

  const handleImport = (profile, account = null, options = { includeMember: false }) => {
    if (!selectedInvoiceType) return;
    if (!profile) return;
    const normalizedProfileId = profile.profileId ? String(profile.profileId) : null;
    if (lockedProfileId && normalizedProfileId && lockedProfileId !== normalizedProfileId) return;

    const includeMember = Boolean(options.includeMember);
    const memberSource = includeMember ? profile.mainMember || {} : account?.member || profile.mainMember || {};
    const patientSource = account?.patient || null;

    setMedicalAidForm({
      medicalAidId: profile.medicalAid?.id ? String(profile.medicalAid.id) : "",
      planId: profile.plan?.id ? String(profile.plan.id) : "",
      medicalAidNr: profile.medicalAidNr || "",
    });
    setMemberForm(hydratePersonForm(memberSource));
    setPatientForm(patientSource ? hydratePersonForm(patientSource) : defaultPerson());
    setIsPatientSameAsMember(!patientSource);
    setLastImported({
      profileId: normalizedProfileId,
      accountId: account?.accountId || null,
    });
  };

  const handleClearImportedAccount = () => {
    setMedicalAidForm({
      medicalAidId: "",
      planId: "",
      medicalAidNr: "",
    });
    setMemberForm(defaultPerson());
    setPatientForm(defaultPerson());
    setIsPatientSameAsMember(false);
    setLastImported(null);
  };

  const onPersonFieldChange = (setter, field) => (e) => {
    const value = e.target.value;
    setter((prev) => ({ ...prev, [field]: value }));
  };

  const canSave = useMemo(() => {
    const hasBalanceInput =
      typeof invoiceForm.balance === "string"
        ? invoiceForm.balance.trim() !== ""
        : invoiceForm.balance !== null && invoiceForm.balance !== undefined;
    const hasProfileLink = Boolean(lockedProfileId);
    const hasMemberRecord = Boolean(memberForm.recordId);
    const hasPatientRecord = isPatientSameAsMember ? true : Boolean(patientForm.recordId);

    return (
      Boolean(invoiceForm.type) &&
      Boolean(invoiceForm.dateOfService) &&
      hasBalanceInput &&
      hasProfileLink &&
      hasMemberRecord &&
      hasPatientRecord
    );
  }, [invoiceForm.type, invoiceForm.dateOfService, invoiceForm.balance, lockedProfileId, memberForm.recordId, patientForm.recordId, isPatientSameAsMember]);

  const resolveRecordId = (value) => {
    if (value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setSaveError("");
    try {
      const profileId = lockedProfileId ? resolveRecordId(lockedProfileId) : null;
      const memberRecordId = resolveRecordId(memberForm.recordId);
      const patientRecordId = isPatientSameAsMember ? memberRecordId : resolveRecordId(patientForm.recordId);
      const payload = {
        invoice: {
          nrInBatch: invoiceForm.nrInBatch ? Number(invoiceForm.nrInBatch) : null,
          dateOfService: invoiceForm.dateOfService,
          status: invoiceForm.status,
          fileNr: invoiceForm.fileNr,
          balance: parseBalanceInput(invoiceForm.balance),
          authNr: invoiceForm.authNr,
          type: invoiceForm.type,
        },
        linkage: {
          profileId,
          memberRecordId,
          patientRecordId,
        },
      };

      if (existingInvoice?.invoice_id) {
        await axiosClient.put(ENDPOINTS.batchInvoiceUpdate(mainBatchId, existingInvoice.invoice_id), {
          ...payload,
          is_fu: isForeignUrgentBatch,
        });
      } else {
        await axiosClient.post(ENDPOINTS.batchAccountCreate(mainBatchId), {
          ...payload,
          is_fu: isForeignUrgentBatch,
        });
      }
      navigate(`${batchBasePath}/${mainBatchId}`, {
        state: {
          batch,
          from: originFrom || { path: currentPath, activeStatus: location.state?.activeStatus },
        },
      });
    } catch (err) {
      setSaveError(err?.response?.data?.error || "Failed to create invoice");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusSelect = (value) => {
    setInvoiceForm((prev) => ({ ...prev, status: value }));
    setIsStatusDropdownOpen(false);
  };

  const handleMedicalAidSelectChange = (value) => {
    setMedicalAidForm((prev) => ({
      ...prev,
      medicalAidId: value,
      planId: "",
    }));
  };

  const handleMedicalAidPlanSelectChange = (value) => {
    setMedicalAidForm((prev) => ({
      ...prev,
      planId: value,
    }));
  };

  const syncPatientFromMember = useCallback(() => {
    setPatientForm((prev) => {
      const next = { ...memberForm };
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      const sameLength = prevKeys.length === nextKeys.length;
      const hasDifferences = !sameLength || nextKeys.some((key) => next[key] !== prev[key]);
      return hasDifferences ? next : prev;
    });
  }, [memberForm]);

  useEffect(() => {
    if (!isPatientSameAsMember) return;
    syncPatientFromMember();
  }, [isPatientSameAsMember, syncPatientFromMember]);

  const handlePatientSameAsMemberChange = (checked) => {
    setIsPatientSameAsMember(checked);
    if (checked) {
      syncPatientFromMember();
    }
  };

  const handleImportProfilePerson = (person, target = "patient", profileId = null) => {
    if (!person || !selectedInvoiceType) return;
    if (profileId) {
      const normalizedProfileId = String(profileId);
      if (lockedProfileId && lockedProfileId !== normalizedProfileId) return;
    }
    if (target === "patient" && isPatientSameAsMember) {
      setIsPatientSameAsMember(false);
    }
    const hydrated = hydratePersonForm(person);
    if (target === "member") {
      setMemberForm(hydrated);
    } else {
      setPatientForm(hydrated);
    }
  };

  const resetPersonEditor = useCallback(() => {
    setPersonEditor({
      profileId: null,
      recordId: null,
      isMainMember: false,
      dependentNumber: "",
      data: defaultPerson(),
      contactNumbers: [],
      addresses: [],
      emails: [],
      saving: false,
      error: "",
    });
  }, []);

  const normalizeAddressList = (list = []) => {
    if (!Array.isArray(list)) return [];
    let domiciliumSet = false;
    return list.map((addr, idx) => {
      const isDomicilium = Boolean(addr.isDomicilium || addr.is_domicilium || (addr.domicilium && !domiciliumSet));
      if (isDomicilium && !domiciliumSet) domiciliumSet = true;
      return {
        addressType: addr.addressType || addr.address_type || addr.type || "Street",
        address: addr.address || addr.line || "",
        isDomicilium: isDomicilium && domiciliumSet,
      };
    }).map((addr, idx, arr) => {
      if (arr.some((a) => a.isDomicilium)) return addr;
      return idx === 0 ? { ...addr, isDomicilium: true } : addr;
    });
  };

  const openPersonEditor = (person = defaultPerson(), options = {}) => {
    const profileId = options.profileId || person.profileId || lastImported?.profileId || null;
    const dependentNumber =
      options.dependentNumber !== undefined && options.dependentNumber !== null
        ? options.dependentNumber
        : person.dependentNumber || person.dependent_nr || "";
    setPersonEditor({
      profileId: profileId ? String(profileId) : null,
      recordId: person.recordId || null,
      isMainMember: Boolean(options.isMainMember ?? person.isMainMember),
      dependentNumber: dependentNumber === null || dependentNumber === undefined ? "" : String(dependentNumber),
      data: hydratePersonForm({ ...person, dependentNumber }),
      contactNumbers: Array.isArray(person.contactNumbers) ? person.contactNumbers : [],
      addresses: normalizeAddressList(person.addresses),
      emails: Array.isArray(person.emails) ? person.emails : [],
      saving: false,
      error: "",
    });
    setViewMode(VIEW_MODES.PERSON);
  };

  const handlePersonFieldChange = (field) => (e) => {
    const value = e.target.value;
    setPersonEditor((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value,
      },
    }));
  };

  const handlePersonDependentChange = (value) => {
    setPersonEditor((prev) => ({ ...prev, dependentNumber: value }));
  };

  const handlePersonRoleChange = (isMainMember) => {
    setPersonEditor((prev) => ({ ...prev, isMainMember }));
  };

  const handleAddContactNumber = () => {
    setPersonEditor((prev) => ({
      ...prev,
      contactNumbers: [...prev.contactNumbers, { numType: "Cell", num: "" }],
    }));
  };

  const handleUpdateContactNumber = (index, field, value) => {
    setPersonEditor((prev) => {
      const next = prev.contactNumbers.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item,
      );
      return { ...prev, contactNumbers: next };
    });
  };

  const handleAddEmail = () => {
    setPersonEditor((prev) => ({
      ...prev,
      emails: [...prev.emails, { email: "" }],
    }));
  };

  const handleUpdateEmail = (index, value) => {
    setPersonEditor((prev) => {
      const next = prev.emails.map((item, idx) =>
        idx === index ? { ...item, email: value } : item,
      );
      return { ...prev, emails: next };
    });
  };

  const requestConfirm = (message, onConfirm) => {
    setConfirmState({ open: true, message, onConfirm });
  };

  const handleRemoveContactNumber = (index) => {
    requestConfirm("remove this contact number?", () => {
      setPersonEditor((prev) => ({
        ...prev,
        contactNumbers: prev.contactNumbers.filter((_, idx) => idx !== index),
      }));
    });
  };

  const handleRemoveEmail = (index) => {
    requestConfirm("remove this email?", () => {
      setPersonEditor((prev) => ({
        ...prev,
        emails: prev.emails.filter((_, idx) => idx !== index),
      }));
    });
  };

  const handleAddAddress = () => {
    setPersonEditor((prev) => {
      const hasDomicilium = prev.addresses.some((addr) => addr.isDomicilium);
      return {
        ...prev,
        addresses: [
          ...prev.addresses,
          { addressType: "Street", address: "", isDomicilium: !hasDomicilium },
        ],
      };
    });
  };

  const handleUpdateAddress = (index, field, value) => {
    setPersonEditor((prev) => {
      const next = prev.addresses.map((addr, idx) =>
        idx === index ? { ...addr, [field]: value } : addr,
      );
      return { ...prev, addresses: next };
    });
  };

  const handleRemoveAddress = (index) => {
    requestConfirm("remove this address?", () => {
      setPersonEditor((prev) => {
        const next = prev.addresses.filter((_, idx) => idx !== index);
        const hasDomicilium = next.some((addr) => addr.isDomicilium);
        if (!hasDomicilium && next[0]) {
          next[0] = { ...next[0], isDomicilium: true };
        }
        return { ...prev, addresses: next };
      });
    });
  };

  const handleSelectDomicilium = (index) => {
    setPersonEditor((prev) => ({
      ...prev,
      addresses: prev.addresses.map((addr, idx) => ({ ...addr, isDomicilium: idx === index })),
    }));
  };

  const handlePersonSave = async () => {
    console.log('test')
    if (!personEditor.profileId) {
      setPersonEditor((prev) => ({ ...prev, error: "Select a profile before saving a person." }));
      return;
    }
    const payload = {
      person: {
        ...personEditor.data,
        dependentNumber: personEditor.dependentNumber,
      },
      isMainMember: personEditor.isMainMember,
      dependentNumber: personEditor.dependentNumber,
      contactNumbers: personEditor.contactNumbers,
      addresses: personEditor.addresses,
      emails: personEditor.emails,
    };
    setPersonEditor((prev) => ({ ...prev, saving: true, error: "" }));
    try {
      let recordId = personEditor.recordId;
      const normalizedProfileId = personEditor.profileId;
      if (personEditor.recordId) {
        const res = await axiosClient.put(
          ENDPOINTS.updateProfilePerson(normalizedProfileId, personEditor.recordId),
          payload,
        );
        recordId = res.data?.person?.recordId || personEditor.recordId;
      } else {
        const res = await axiosClient.post(ENDPOINTS.createProfilePerson(normalizedProfileId), payload);
        recordId = res.data?.person?.recordId;
      }
      setPersonEditor((prev) => ({
        ...prev,
        recordId,
        contactNumbers: payload.contactNumbers,
        addresses: normalizeAddressList(payload.addresses),
        emails: payload.emails,
      }));
      await handleSearchProfiles();
    } catch (err) {
      setPersonEditor((prev) => ({
        ...prev,
        error: err?.response?.data?.error || "Failed to save person",
      }));
    } finally {
      setPersonEditor((prev) => ({ ...prev, saving: false }));
    }
  };

  const handlePersonCancel = () => {
    resetPersonEditor();
    setViewMode(VIEW_MODES.ACCOUNT);
  };

  const importPersonToCurrentProfile = (person, options = {}) => {
    if (!person) return;
    if (!personEditor.profileId) {
      setPersonEditor((prev) => ({ ...prev, error: "Select or create a profile in Person View first." }));
      setViewMode(VIEW_MODES.PERSON);
      return;
    }
    const dependentNumber =
      options.dependentNumber !== undefined && options.dependentNumber !== null
        ? options.dependentNumber
        : person.dependentNumber || person.dependent_nr || "";
    setPersonEditor((prev) => ({
      ...prev,
      data: hydratePersonForm({ ...person, dependentNumber }),
      recordId: person.recordId || null,
      dependentNumber: dependentNumber === null || dependentNumber === undefined ? "" : String(dependentNumber),
      isMainMember: Boolean(options.isMainMember ?? person.isMainMember),
      contactNumbers: Array.isArray(person.contactNumbers) ? person.contactNumbers : [],
      addresses: normalizeAddressList(person.addresses),
      emails: Array.isArray(person.emails) ? person.emails : [],
      error: "",
    }));
    setViewMode(VIEW_MODES.PERSON);
  };

  const startNewProfileDraft = () => {
    const preferredAid = medicalAidCatalog.find((aid) => (aid.name || "").toLowerCase() === "gems");
    const fallbackAid = preferredAid || medicalAidCatalog[0] || null;
    const defaultAidId = fallbackAid ? String(fallbackAid.id) : "";
    const defaultPlanId = fallbackAid?.plans?.length ? String(fallbackAid.plans[0].id) : "";
    setNewProfileError("");
    setNewProfileDraft({
      medicalAidId: defaultAidId,
      planId: defaultPlanId,
      medicalAidNr: searchTerm.trim(),
    });
  };

  const handleNewProfileFieldChange = (field) => (e) => {
    const value = e.target.value;
    setNewProfileDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateNewProfile = async () => {
    if (!newProfileDraft?.medicalAidNr) {
      setNewProfileError("Medical aid number is required for a new profile.");
      return;
    }
    setNewProfileSaving(true);
    setNewProfileError("");
    try {
      const payload = {
        medicalAidId: newProfileDraft.medicalAidId ? Number(newProfileDraft.medicalAidId) : null,
        planId: newProfileDraft.planId ? Number(newProfileDraft.planId) : null,
        medicalAidNr: newProfileDraft.medicalAidNr,
      };
      const res = await axiosClient.post(ENDPOINTS.createProfile, payload);
      const profileId = res.data?.profile?.profileId;
      const aid = medicalAidCatalog.find((a) => String(a.id) === String(newProfileDraft.medicalAidId));
      const plan = (aid?.plans || []).find((p) => String(p.id) === String(newProfileDraft.planId));
      const newProfile = {
        profileId,
        medicalAidNr: newProfileDraft.medicalAidNr,
        medicalAid: aid ? { id: aid.id, name: aid.name } : null,
        plan: plan ? { id: plan.id, name: plan.name || plan.plan_name, code: plan.code || plan.plan_code } : null,
        accounts: [],
        profilePersons: [],
      };
      setProfiles([newProfile]);
      setLastImported({ profileId: String(profileId), accountId: null });
      setPersonEditor((prev) => ({
        ...prev,
        profileId: profileId ? String(profileId) : null,
        recordId: null,
        data: defaultPerson(),
        dependentNumber: "",
        isMainMember: false,
      }));
      setViewMode(VIEW_MODES.PERSON);
    } catch (err) {
      setNewProfileError(err?.response?.data?.error || "Failed to create profile");
    } finally {
      setNewProfileSaving(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="tab-panel w-full mb-4">
        <div className="flex gap-2 flex-wrap items-center">
          <button
            type="button"
            className={`tab-pill ${viewMode === VIEW_MODES.ACCOUNT ? "tab-pill-active" : ""}`}
            onClick={() => setViewMode(VIEW_MODES.ACCOUNT)}
          >
            Account View
          </button>
          <button
            type="button"
            className={`tab-pill ${viewMode === VIEW_MODES.PERSON ? "tab-pill-active" : ""}`}
            onClick={() => setViewMode(VIEW_MODES.PERSON)}
          >
            Person View
          </button>
        </div>

        <span className="h-6 w-px bg-gray-blue-100" aria-hidden="true" />

        <div className="flex gap-2 flex-wrap items-center">
          <button
            type="button"
            className={`tab-pill ${activeTab === TAB_KEYS.ACCOUNT ? "tab-pill-active" : ""}`}
            onClick={() => setActiveTab(TAB_KEYS.ACCOUNT)}
          >
            View Account
          </button>
          <button
            type="button"
            className={`tab-pill ${activeTab === TAB_KEYS.NOTES ? "tab-pill-active" : ""}`}
            onClick={() => setActiveTab(TAB_KEYS.NOTES)}
          >
            Notes & Logs
          </button>
        </div>

        <span className="hidden h-6 w-px bg-gray-blue-100 md:block" aria-hidden="true" />

        <div className="flex gap-2 flex-wrap items-center">
          <button type="button" className="tab-pill tab-pill-disabled" disabled title="Coming soon">
            CRQ
          </button>
        </div>

        <span className="hidden h-6 w-px bg-gray-blue-100 md:block" aria-hidden="true" />

        <div className="flex gap-2 flex-wrap items-center ml-auto">
          <button type="button" className="button-pill min-w-[100px] flex items-center justify-center" onClick={handleBack}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 -960 960 960"
              width="20"
              height="20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M360-240 120-480l240-240 56 56-144 144h568v80H272l144 144-56 56Z" />
            </svg>
            <span className="sr-only">Back</span>
          </button>
        </div>
      </div>
      {activeTab === TAB_KEYS.ACCOUNT ? (
        <>
          {/* SECTION 1 // SEARCH SECTION */}
          <div className="flex flex-col-reverse lg:flex-row-reverse gap-4 lg:basis-2/4 mb-4 w-full">
            <section className="container-col m-0 flex w-full lg:basis-2/4 lg:flex-none min-w-0">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[220px]">
                  <SearchBar searchTerm={searchTerm} setSearchTerm={handleSearchTermChange} classes="w-full" />
                </div>
                <button
                  type="button"
                  className="button-pill"
                  onClick={handleSearchProfiles}
                  disabled={searchLoading || !batch.client_id}
                >
                  {searchLoading ? "Searching..." : "Search Profiles"}
                </button>
                <button type="button" className="button-pill opacity-60 cursor-not-allowed" disabled>
                  Import from Medical Aid
                </button>
                <button type="button" className="button-pill " onClick={startNewProfileDraft}>
                  New Profile
                </button>
              </div>
              {searchError && <p className="text-sm text-red-600">{searchError}</p>}
              {!batch.client_id && (
                <p className="text-sm text-red-600">This batch is missing a client reference, so lookups are disabled.</p>
              )}
              <div className="flex flex-col gap-4 mt-4">
                {newProfileDraft && (
                  <div className="border border-gray-blue-100 rounded-lg p-4 bg-white">
                    <p className="text-xs uppercase text-gray-blue-600">New Profile</p>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 mt-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-blue-600">Medical Aid Number</label>
                        <input
                          type="text"
                          className="input-pill"
                          value={newProfileDraft.medicalAidNr}
                          onChange={handleNewProfileFieldChange("medicalAidNr")}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-blue-600">Medical Aid</label>
                        <select
                          className="input-pill"
                          value={newProfileDraft.medicalAidId}
                          onChange={handleNewProfileFieldChange("medicalAidId")}
                        >
                          <option value="">Select medical aid</option>
                          {medicalAidCatalog.map((aid) => (
                            <option key={aid.id} value={aid.id}>
                              {aid.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-blue-600">Plan</label>
                        {(() => {
                          const draftAid = medicalAidCatalog.find(
                            (aid) => String(aid.id) === String(newProfileDraft.medicalAidId),
                          );
                          const plans = draftAid?.plans || [];
                          return (
                            <select
                              className="input-pill"
                              value={newProfileDraft.planId}
                              onChange={handleNewProfileFieldChange("planId")}
                            >
                              <option value="">{plans.length ? "Select plan" : "No plans"}</option>
                              {plans.map((plan) => (
                                <option key={plan.id} value={plan.id}>
                                  {plan.name || plan.plan_name || plan.code || plan.plan_code || `Plan ${plan.id}`}
                                </option>
                              ))}
                            </select>
                          );
                        })()}
                      </div>
                    </div>
                    {newProfileError && <p className="text-sm text-red-600 mt-2">{newProfileError}</p>}
                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        className="button-pill"
                        onClick={() => setNewProfileDraft(null)}
                        disabled={newProfileSaving}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="tab-pill text-white px-4 bg-ebmaa-purple"
                        onClick={handleCreateNewProfile}
                        disabled={newProfileSaving}
                      >
                        {newProfileSaving ? "Creating..." : "Create Profile"}
                      </button>
                    </div>
                  </div>
                )}
                {profiles.length === 0 && !searchLoading ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-gray-blue-600">
                      Search for existing profiles or accounts by medical aid number, ID, or surname.
                    </p>
                  </div>
                ) : (
                  profiles.map((profile) => {
                    const profilePersons = buildProfilePersons(profile);
                    const hasPersonData = Boolean(profilePersons.mainMember || profilePersons.dependants.length);
                    const clientAccounts = (profile.accounts || []).filter((account) => {
                      if (!batch?.client_id) return true;
                      return String(account.clientId) === String(batch.client_id);
                    });
                    const accountsHeading = batch?.client_id
                      ? `Accounts for Client #${batch.client_id}`
                      : "Accounts";
                    const hasAccountsForClient = clientAccounts.length > 0;
                    const normalizedProfileId = profile.profileId ? String(profile.profileId) : null;
                    const isProfileLockedOut =
                      Boolean(lockedProfileId && normalizedProfileId && lockedProfileId !== normalizedProfileId);
                    const profileCardClasses = `border border-gray-blue-100 rounded-lg p-4 bg-gray-100 ${
                      isProfileLockedOut ? "opacity-60" : ""
                    }`;
                    return (
                      <div key={profile.profileId} className={profileCardClasses}>
                        <p className="text-xs uppercase text-gray-blue-600">Medical Aid</p>
                        <div className="rounded border border-gray-blue-100 bg-white px-3 py-3 mt-2">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-gray-dark">
                                {profile.medicalAid?.name || "Unknown"} ({profile.medicalAidNr || "N/A"})
                              </p>
                              <p className="text-xs text-gray-blue-600">
                                Plan: {profile.plan?.name || profile.plan?.code || "N/A"}
                              </p>
                            </div>
                              {viewMode === VIEW_MODES.ACCOUNT && (
                                <button
                                  type="button"
                                  className={`button-pill ${
                                    !canImportData || isProfileLockedOut ? "opacity-50 cursor-not-allowed" : ""
                                  }`}
                                  onClick={() => {
                                    if (!canImportData || isProfileLockedOut) return;
                                    handleImport(profile, null, { includeMember: true });
                                  }}
                                  disabled={!canImportData || isProfileLockedOut}
                                >
                                  Import Profile
                                </button>
                              )}
                            </div>
                          </div>
                        {hasPersonData && (
                          <div className="mt-4 flex flex-col gap-2">
                            <p className="text-xs uppercase text-gray-blue-600">Main Member & Dependants</p>
                            {profilePersons.mainMember && (
                              <div className="rounded border border-gray-blue-100 bg-white px-3 py-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div>
                                    <button
                                      type="button"
                                      className="text-sm font-semibold text-gray-dark underline"
                                      onClick={() =>
                                        openPersonEditor(profilePersons.mainMember.person, {
                                          profileId: profile.profileId,
                                          isMainMember: true,
                                          dependentNumber: profilePersons.mainMember.dependentNumber,
                                        })
                                      }
                                    >
                                      {profilePersons.mainMember.name}
                                    </button>
                                    {profilePersons.mainMember.meta && (
                                      <p className="text-xs text-gray-blue-600">{profilePersons.mainMember.meta}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap justify-end">
                                    {profilePersons.mainMember.roles.length > 0 && (
                                      <span className="text-[11px] uppercase tracking-wide text-gray-900">
                                        {profilePersons.mainMember.roles.join(", ")}
                                      </span>
                                    )}
                                    <div className="flex items-center gap-2">
                                      {viewMode === VIEW_MODES.ACCOUNT ? (
                                        <button
                                          type="button"
                                          className={`button-pill ${
                                            !canImportData || isProfileLockedOut ? "opacity-50 cursor-not-allowed" : ""
                                          }`}
                                          onClick={() =>
                                            handleImportProfilePerson(
                                              profilePersons.mainMember.person,
                                              "patient",
                                              profile.profileId,
                                            )
                                          }
                                          disabled={!canImportData || isProfileLockedOut}
                                        >
                                          Import Patient
                                        </button>
                                        ) : (
                                          <button
                                            type="button"
                                            className="button-pill"
                                            onClick={() =>
                                              importPersonToCurrentProfile(profilePersons.mainMember.person, {
                                                isMainMember: true,
                                                dependentNumber: profilePersons.mainMember.dependentNumber,
                                              })
                                          }
                                        >
                                          Import Person
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {profilePersons.dependants.length > 0 && (
                              <div className="flex flex-col gap-2">
                                {profilePersons.dependants.map(({ key, name, meta, roles, person }) => (
                                  <div key={key} className="rounded border border-gray-blue-100 bg-white px-3 py-2">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <div>
                                        <button
                                          type="button"
                                          className="text-sm font-semibold text-gray-dark underline"
                                          onClick={() =>
                                            openPersonEditor(person, {
                                              profileId: profile.profileId,
                                              isMainMember: false,
                                              dependentNumber: person.dependentNumber,
                                            })
                                          }
                                        >
                                          {name}
                                        </button>
                                        {meta && <p className="text-xs text-gray-blue-600">{meta}</p>}
                                      </div>
                                      <div className="flex items-center gap-2 flex-wrap justify-end">
                                        {roles.length > 0 && (
                                          <span className="text-[11px] uppercase tracking-wide text-gray-900">
                                            {roles.join(", ")}
                                          </span>
                                        )}
                                        <div className="flex items-center gap-2">
                                          {viewMode === VIEW_MODES.ACCOUNT ? (
                                            <button
                                              type="button"
                                              className={`button-pill ${
                                                !canImportData || isProfileLockedOut ? "opacity-50 cursor-not-allowed" : ""
                                              }`}
                                              onClick={() =>
                                                handleImportProfilePerson(person, "patient", profile.profileId)
                                              }
                                              disabled={!canImportData || isProfileLockedOut}
                                            >
                                              Import Patient
                                            </button>
                                        ) : (
                                          <button
                                            type="button"
                                            className="button-pill"
                                            onClick={() =>
                                              importPersonToCurrentProfile(person, {
                                                isMainMember: false,
                                                dependentNumber: person.dependentNumber,
                                              })
                                              }
                                            >
                                              Import Person
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  className="tab-pill w-fit"
                                  onClick={() =>
                                    openPersonEditor(defaultPerson(), {
                                      profileId: profile.profileId,
                                      isMainMember: false,
                                    })
                                  }
                                >
                                  + Add Dependant
                                </button>
                              </div>
                            )}
                            {profilePersons.dependants.length === 0 && (
                              <button
                                type="button"
                                className="tab-pill w-fit"
                                onClick={() =>
                                  openPersonEditor(defaultPerson(), {
                                    profileId: profile.profileId,
                                    isMainMember: false,
                                  })
                                }
                              >
                                + Add Dependant
                              </button>
                            )}
                          </div>
                        )}

                        <div className="mt-4 flex flex-col gap-2">
                          <p className="text-xs uppercase text-gray-blue-600">{accountsHeading}</p>
                          {hasAccountsForClient ? (
                            clientAccounts.map((account) => {
                              const memberName = formatPersonName(account.member);
                              const memberMeta = formatPersonMeta(account.member, { includeDependent: true });
                              const hasPatient =
                                account.patient &&
                                (account.patient.first ||
                                  account.patient.last ||
                                  account.patient.recordId ||
                                  account.patient.idNumber);
                              const patientName = hasPatient ? formatPersonName(account.patient) : memberName;
                              const patientMeta = hasPatient
                                ? formatPersonMeta(account.patient, { includeDependent: true })
                                : "";
                              const key =
                                account.accountId ||
                                `${profile.profileId}-${account.clientId || "client"}-${account.mainMemberId || "mm"}-${
                                  account.patientId || "patient"
                                }`;
                              return (
                                <div
                                  key={key}
                                  className="rounded border border-gray-blue-100 bg-white px-3 py-3"
                                >
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="space-y-1">
                                      <p className="text-xs uppercase text-gray-blue-600">
                                        Account #{account.accountId || "N/A"}
                                      </p>
                                      <p className="text-sm font-semibold text-gray-dark">Member: {memberName}</p>
                                      {memberMeta && <p className="text-xs text-gray-blue-600">{memberMeta}</p>}
                                      <p className="text-sm font-semibold text-gray-dark">
                                        Patient: {hasPatient ? patientName : "Same as member"}
                                      </p>
                                      {hasPatient && patientMeta && (
                                        <p className="text-xs text-gray-blue-600">{patientMeta}</p>
                                      )}
                                    </div>
                                    <div className="flex flex-col items-end gap-2 min-w-[140px]">
                                      <p className="text-xs text-gray-blue-600">
                                        Client #{account.clientId || batch?.client_id || "N/A"}
                                      </p>
                                      {viewMode === VIEW_MODES.ACCOUNT && (
                                        <button
                                          type="button"
                                          className={`tab-pill ${
                                            !canImportData || isProfileLockedOut ? "opacity-50 cursor-not-allowed" : ""
                                          }`}
                                          onClick={() => {
                                            if (!canImportData || isProfileLockedOut) return;
                                            handleImport(profile, account);
                                          }}
                                          disabled={!canImportData || isProfileLockedOut}
                                        >
                                          Use Account
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-xs text-gray-blue-600">No accounts for this client yet.</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* SECTION 2 // INFO SECTION */}
            {viewMode === VIEW_MODES.ACCOUNT ? (
              <div className="flex flex-col gap-4 w-full lg:basis-2/4 min-w-0">
                <section className="container-col m-0">
                  <div className="flex flex-wrap items-center gap-3 bg-white rounded-lg">
                    {/* <p className="text-xs uppercase tracking-wide text-gray-blue-600">Add Account / Invoice</p> */}
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-dark">
                      {infoItems.map((item) => (
                        <span
                          key={item.label}
                          className="inline-flex items-center gap-2 rounded-full bg-gray-blue-100/60 px-3 py-2"
                        >
                          <span className="font-semibold text-gray-dark whitespace-nowrap">{item.value}</span>
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 ml-auto">
                      <div className="flex flex-wrap gap-3">
                        {invoiceTypeOptions.map((option) => (
                          <label
                            key={option}
                            className={`flex items-center gap-2 text-sm cursor-pointer ${
                              invoiceForm.type === option ? "text-ebmaa-purple font-semibold" : "text-gray-700"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={invoiceForm.type === option}
                            onChange={() => handleInvoiceTypeSelect(option)}
                          />
                          <span>{INVOICE_TYPE_LABELS[option] || option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                    {/* {isForeignUrgentBatch && !invoiceForm.type && (
                      <p className="text-xs text-gray-blue-600 w-full text-right">
                        Select a type to start editing account details.
                      </p>
                    )} */}
                  </div>
                </section>
                <section className="container-col m-0">
                  <p className="text-xs uppercase tracking-wide text-gray-blue-600">Medical Aid</p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-blue-600">Medical Aid Number</label>
                      <input
                        type="text"
                        className={`input-pill ${medicalAidFieldsDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
                        value={medicalAidForm.medicalAidNr}
                        onChange={(e) => setMedicalAidForm((prev) => ({ ...prev, medicalAidNr: e.target.value }))}
                        disabled={medicalAidFieldsDisabled}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-blue-600">Medical Aid</label>
                      <select
                        className={`input-pill ${medicalAidFieldsDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
                        value={medicalAidForm.medicalAidId}
                        onChange={(e) => handleMedicalAidSelectChange(e.target.value)}
                        disabled={medicalAidFieldsDisabled || medicalAidCatalog.length === 0}
                      >
                        <option value="">{medicalAidCatalog.length ? "Select medical aid" : "Loading..."}</option>
                        {medicalAidCatalog.map((aid) => (
                          <option key={aid.id} value={aid.id}>
                            {aid.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-blue-600">Plan</label>
                      <select
                        className={`input-pill ${medicalAidFieldsDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
                        value={medicalAidForm.planId}
                        onChange={(e) => handleMedicalAidPlanSelectChange(e.target.value)}
                        disabled={medicalAidFieldsDisabled || !selectedMedicalAid || availablePlans.length === 0}
                      >
                        <option value="">
                          {selectedMedicalAid
                            ? availablePlans.length
                              ? "Select plan"
                              : "No plans available"
                            : "Select medical aid first"}
                        </option>
                        {availablePlans.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name || plan.code || `Plan ${plan.id}`}
                            {plan.name && plan.code ? ` (${plan.code})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>
                <section className="container-col m-0">
                  <p className="text-xs uppercase tracking-wide text-gray-blue-600">Main Member</p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-blue-600">First Name</label>
                      <input
                        type="text"
                        className={`input-pill ${memberFieldsDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
                        value={memberForm.first}
                        onChange={onPersonFieldChange(setMemberForm, "first")}
                        disabled={memberFieldsDisabled}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-blue-600">Last Name</label>
                      <input
                        type="text"
                        className={`input-pill ${memberFieldsDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
                        value={memberForm.last}
                        onChange={onPersonFieldChange(setMemberForm, "last")}
                        disabled={memberFieldsDisabled}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-blue-600">ID Number</label>
                      <input
                        type="text"
                        className={`input-pill ${memberFieldsDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
                        value={memberForm.idNumber}
                        onChange={onPersonFieldChange(setMemberForm, "idNumber")}
                        disabled={memberFieldsDisabled}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-blue-600">DOB</label>
                      <input
                        type="date"
                        className={`input-pill ${memberFieldsDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
                        value={memberForm.dateOfBirth}
                        onChange={onPersonFieldChange(setMemberForm, "dateOfBirth")}
                        disabled={memberFieldsDisabled}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-blue-600">Dependent #</label>
                      <input
                        type="text"
                        className={`input-pill ${memberFieldsDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
                        value={memberForm.dependentNumber}
                        onChange={onPersonFieldChange(setMemberForm, "dependentNumber")}
                        disabled={memberFieldsDisabled}
                      />
                    </div>
                  </div>
                </section>

                <section className="container-col m-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-wide text-gray-blue-600">Patient</p>
                    <label className="flex items-center gap-2 text-xs text-gray-blue-600 select-none">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={isPatientSameAsMember}
                        onChange={(e) => handlePatientSameAsMemberChange(e.target.checked)}
                      />
                      Patient &amp; member same
                    </label>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-blue-600">First Name</label>
                      <input
                        type="text"
                        className={`input-pill ${patientFieldsDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
                        value={patientForm.first}
                        onChange={onPersonFieldChange(setPatientForm, "first")}
                        disabled={patientFieldsDisabled}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-blue-600">Last Name</label>
                      <input
                        type="text"
                        className={`input-pill ${patientFieldsDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
                        value={patientForm.last}
                        onChange={onPersonFieldChange(setPatientForm, "last")}
                        disabled={patientFieldsDisabled}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-blue-600">ID Number</label>
                      <input
                        type="text"
                        className={`input-pill ${patientFieldsDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
                        value={patientForm.idNumber}
                        onChange={onPersonFieldChange(setPatientForm, "idNumber")}
                        disabled={patientFieldsDisabled}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-blue-600">DOB</label>
                      <input
                        type="date"
                        className={`input-pill ${patientFieldsDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
                        value={patientForm.dateOfBirth}
                        onChange={onPersonFieldChange(setPatientForm, "dateOfBirth")}
                        disabled={patientFieldsDisabled}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-blue-600">Dependent #</label>
                      <input
                        type="text"
                        className={`input-pill ${patientFieldsDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
                        value={patientForm.dependentNumber}
                        onChange={onPersonFieldChange(setPatientForm, "dependentNumber")}
                        disabled={patientFieldsDisabled}
                      />
                    </div>
                  </div>
                </section>

                <section className="container-col m-0 mb-4">
                  <p className="text-xs uppercase tracking-wide text-gray-blue-600">Invoice Details</p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-blue-600">Nr in Batch</label>
                      <input
                        type="number"
                        className="input-pill bg-gray-100 cursor-not-allowed"
                        value={invoiceForm.nrInBatch}
                        readOnly
                        disabled
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-blue-600">Date of Service</label>
                      <input
                        type="date"
                        className="input-pill"
                        value={invoiceForm.dateOfService}
                        onChange={(e) => setInvoiceForm((prev) => ({ ...prev, dateOfService: e.target.value }))}
                      />
                    </div>
                    <div className="flex flex-col gap-1 relative" ref={statusDropdownRef}>
                      <label className="text-xs text-gray-blue-600">Status</label>
                      <button
                        type="button"
                        className="input-pill flex items-center justify-between gap-2"
                        onClick={() => setIsStatusDropdownOpen((prev) => !prev)}
                      >
                        <span>{invoiceForm.status}</span>
                        <svg
                          className={`w-4 h-4 transform transition-transform ${isStatusDropdownOpen ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isStatusDropdownOpen && (
                        <div className="nav-dropdown-panel w-full absolute left-0 top-full">
                          {STATUS_OPTIONS.map((option) => (
                            <button
                              key={option}
                              type="button"
                              className={`nav-dropdown-item ${invoiceForm.status === option ? "nav-dropdown-item-active" : ""}`}
                              onClick={() => handleStatusSelect(option)}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-blue-600">Balance</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        className="input-pill"
                        value={invoiceForm.balance}
                        onChange={(e) => setInvoiceForm((prev) => ({ ...prev, balance: e.target.value }))}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-blue-600">File #</label>
                      <input
                        type="text"
                        className="input-pill"
                        value={invoiceForm.fileNr}
                        onChange={(e) => setInvoiceForm((prev) => ({ ...prev, fileNr: e.target.value }))}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-blue-600">Auth #</label>
                      <input
                        type="text"
                        className="input-pill"
                        value={invoiceForm.authNr}
                        onChange={(e) => setInvoiceForm((prev) => ({ ...prev, authNr: e.target.value }))}
                      />
                    </div>
                  </div>
                  {/* {lastImported && (
                    <p className="text-xs text-gray-blue-600 mt-3">
                      Imported from profile #{lastImported.profileId}
                      {lastImported.accountId ? ` / account #${lastImported.accountId}` : ""}
                    </p>
                  )} */}
                  {saveError && <p className="text-sm text-red-600 mt-3">{saveError}</p>}
                  <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                    <div>
                      {lockedProfileId && (
                        <button
                          type="button"
                          className="button-pill"
                          onClick={handleClearImportedAccount}
                          disabled={saving}
                        >
                          Clear Account
                        </button>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button type="button" className="button-pill" onClick={() => navigate(-1)} disabled={saving}>
                        Cancel
                      </button>
                      <button
                        type="button"
                        className={`tab-pill text-white px-4 ${canSave ? "bg-ebmaa-purple" : "bg-gray-400 cursor-not-allowed"}`}
                        onClick={handleSave}
                        disabled={!canSave || saving}
                      >
                        {saving ? "Saving..." : existingInvoice ? "Update Invoice" : "Save Invoice"}
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            ) : (
              <div className="flex flex-col gap-4 w-full lg:basis-2/4">
                <section className="container-col m-0">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-blue-600">Person View</p>
                      <p className="text-sm text-gray-blue-600">
                        {personEditor.recordId
                          ? `#${personEditor.recordId}`
                          : "Select a person from search results to edit, or add a new person."}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mt-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-blue-600">Profile ID</label>
                      <input
                        type="text"
                        className="input-pill bg-gray-100"
                        value={personEditor.profileId || ""}
                        disabled
                        readOnly
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-blue-600">Dependent #</label>
                      <input
                        type="text"
                        className="input-pill"
                        value={personEditor.dependentNumber}
                        onChange={(e) => handlePersonDependentChange(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-blue-600">Role</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className={`tab-pill ${personEditor.isMainMember ? "tab-pill-active" : ""}`}
                          onClick={() => handlePersonRoleChange(true)}
                        >
                          Main Member
                        </button>
                        <button
                          type="button"
                          className={`tab-pill ${!personEditor.isMainMember ? "tab-pill-active" : ""}`}
                          onClick={() => handlePersonRoleChange(false)}
                        >
                          Dependant
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-blue-600">First Name</label>
                      <input
                        type="text"
                        className="input-pill"
                        value={personEditor.data.first}
                        onChange={handlePersonFieldChange("first")}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-blue-600">Last Name</label>
                      <input
                        type="text"
                        className="input-pill"
                        value={personEditor.data.last}
                        onChange={handlePersonFieldChange("last")}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-blue-600">ID Number</label>
                      <input
                        type="text"
                        className="input-pill"
                        value={personEditor.data.idNumber}
                        onChange={handlePersonFieldChange("idNumber")}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-blue-600">DOB</label>
                      <input
                        type="date"
                        className="input-pill"
                        value={personEditor.data.dateOfBirth}
                        onChange={handlePersonFieldChange("dateOfBirth")}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-blue-600">Gender</label>
                      <input
                        type="text"
                        className="input-pill"
                        value={personEditor.data.gender}
                        onChange={handlePersonFieldChange("gender")}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-blue-600">Title</label>
                      <input
                        type="text"
                        className="input-pill"
                        value={personEditor.data.title}
                        onChange={handlePersonFieldChange("title")}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3 md:auto-cols-fr">
                    <div className="flex flex-col gap-2 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-wide text-gray-blue-600">Addresses</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {personEditor.addresses.length === 0 && (
                          <p className="text-xs text-gray-blue-600">No addresses added.</p>
                        )}
                        {personEditor.addresses.map((addr, idx) => (
                          <div key={`addr-${idx}`} className="flex flex-col gap-2 border border-gray-blue-100 rounded-lg p-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="domicilium"
                                checked={Boolean(addr.isDomicilium)}
                                onChange={() => handleSelectDomicilium(idx)}
                              />
                              <span className="text-xs text-gray-blue-700">Domicilium</span>
                              <select
                                className="input-pill w-[140px]"
                                value={addr.addressType || addr.address_type || ""}
                                onChange={(e) => handleUpdateAddress(idx, "addressType", e.target.value)}
                              >
                                {ADDRESS_TYPES.map((type) => (
                                  <option key={type} value={type}>
                                    {type}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                className="p-1 text-red-600 hover:text-red-700 ml-auto"
                                onClick={() => handleRemoveAddress(idx)}
                                aria-label="Remove address"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="20px"
                                  viewBox="0 -960 960 960"
                                  width="20px"
                                  fill="currentColor"
                                >
                                  <path d="m336-280-56-56 144-144-144-143 56-56 144 144 143-144 56 56-144 143 144 144-56 56-143-144-144 144Z" />
                                </svg>
                              </button>
                            </div>
                            <textarea
                              rows={2}
                              className="w-full rounded-none border-0 border-b border-gray-blue-200 bg-transparent px-0 py-2 text-sm text-gray-700 focus:border-ebmaa-purple focus:ring-0 resize-y min-h-[48px]"
                              placeholder="Address"
                              value={addr.address || ""}
                              onChange={(e) => handleUpdateAddress(idx, "address", e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="mt-1">
                        <button
                          type="button"
                          className="p-1 text-ebmaa-purple hover:text-ebmaa-purple-light"
                          onClick={handleAddAddress}
                          aria-label="Add address"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="20px"
                            viewBox="0 -960 960 960"
                            width="20px"
                            fill="currentColor"
                          >
                            <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-wide text-gray-blue-600">Contact Numbers</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {personEditor.contactNumbers.length === 0 && (
                          <p className="text-xs text-gray-blue-600">No contacts added.</p>
                        )}
                        {personEditor.contactNumbers.map((contact, idx) => (
                          <div key={`contact-${idx}`} className="flex items-center gap-2 w-full flex-wrap md:flex-nowrap">
                            <select
                              className="input-pill w-[80px] text-sm"
                              value={contact.numType || contact.num_type || ""}
                              onChange={(e) => handleUpdateContactNumber(idx, "numType", e.target.value)}
                            >
                              {CONTACT_TYPES.map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              className="input-pill flex-1 min-w-0 w-[120px]"
                              placeholder="Contact number"
                              value={contact.num || contact.number || ""}
                              onChange={(e) => handleUpdateContactNumber(idx, "num", e.target.value)}
                            />
                            <button
                              type="button"
                              className="p-1 text-red-600 hover:text-red-700 flex-none"
                              onClick={() => handleRemoveContactNumber(idx)}
                              aria-label="Remove contact"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="20px"
                                viewBox="0 -960 960 960"
                                width="20px"
                                fill="currentColor"
                              >
                                <path d="m336-280-56-56 144-144-144-143 56-56 144 144 143-144 56 56-144 143 144 144-56 56-143-144-144 144Z" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="mt-1">
                        <button
                          type="button"
                          className="p-1 text-ebmaa-purple hover:text-ebmaa-purple-light"
                          onClick={handleAddContactNumber}
                          aria-label="Add contact"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="20px"
                            viewBox="0 -960 960 960"
                            width="20px"
                            fill="currentColor"
                          >
                            <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-wide text-gray-blue-600">Emails</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {personEditor.emails.length === 0 && (
                          <p className="text-xs text-gray-blue-600">No emails added.</p>
                        )}
                        {personEditor.emails.map((item, idx) => (
                          <div key={`email-${idx}`} className="flex items-center gap-2 w-full">
                            <input
                              type="email"
                              className="input-pill flex-1 min-w-0"
                              placeholder="Email address"
                              value={item.email || ""}
                              onChange={(e) => handleUpdateEmail(idx, e.target.value)}
                            />
                            <button
                              type="button"
                              className="p-1 text-red-600 hover:text-red-700 flex-none"
                              onClick={() => handleRemoveEmail(idx)}
                              aria-label="Remove email"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="20px"
                                viewBox="0 -960 960 960"
                                width="20px"
                                fill="currentColor"
                              >
                                <path d="m336-280-56-56 144-144-144-143 56-56 144 144 143-144 56 56-144 143 144 144-56 56-143-144-144 144Z" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="mt-1">
                        <button
                          type="button"
                          className="p-1 text-ebmaa-purple hover:text-ebmaa-purple-light"
                          onClick={handleAddEmail}
                          aria-label="Add email"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="20px"
                            viewBox="0 -960 960 960"
                            width="20px"
                            fill="currentColor"
                          >
                            <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  {personEditor.error && <p className="text-sm text-red-600 mt-3">{personEditor.error}</p>}
                  <div className="flex gap-3 mt-4">
                    <button type="button" className="button-pill" onClick={handlePersonCancel} disabled={personEditor.saving}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="tab-pill text-white px-4 bg-ebmaa-purple"
                      onClick={handlePersonSave}
                      disabled={personEditor.saving}
                    >
                      {personEditor.saving ? "Saving..." : personEditor.recordId ? "Update Person" : "Create Person"}
                    </button>
                  </div>
                </section>
              </div>
            )}
          </div>
        </>
      ) : invoiceEntityId ? (
        <EntityNotesAndLogs
          entityId={invoiceEntityId}
          entityType="invoice"
          department={departmentKey}
          batchType={batchTypeKey}
          title="Account Notes & Logs"
          headerDescription={`Tracking updates for invoice #${invoiceEntityId}`}
          showSearchInput={false}
          className="mt-4"
          showBatchLink={false}
        />
      ) : (
        <section className="container-col">
          <p className="text-sm text-gray-blue-700">Save this account to start capturing notes and logs.</p>
    </section>
      )}
      <ConfirmDialog
        open={confirmState.open}
        message={confirmState.message || "Are you sure you want to proceed?"}
        onCancel={() => setConfirmState({ open: false, message: "", onConfirm: null })}
        onConfirm={() => {
          const cb = confirmState.onConfirm;
          setConfirmState({ open: false, message: "", onConfirm: null });
          if (typeof cb === "function") cb();
        }}
      />
    </div>
  );
};

export default AddAccount;
