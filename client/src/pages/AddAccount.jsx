import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import SearchBar from "../components/ui/SearchBar";
import axiosClient from "../utils/axiosClient";
import ENDPOINTS from "../utils/apiEndpoints";

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
  normal: "Normal",
  other: "Other",
  foreign: "Foreign",
  urgent_normal: "Urgent (Normal)",
  urgent_other: "Urgent (Other)",
};

const normalizeBatchFlag = (value) => {
  if (typeof value === "boolean") return value;
  if (value === null || value === undefined) return false;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return ["1", "true", "yes"].includes(normalized);
  }
  return false;
};

const isForeignUrgentBatchType = (batch) => {
  if (!batch) return false;
  if (batch.parent_batch_id) return true;
  return normalizeBatchFlag(batch.is_pure_foreign_urgent);
};

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
  const batch = location.state?.batch || null;
  const existingInvoice = location.state?.invoice || null;
  const existingInvoiceType = existingInvoice?.invoice_type || existingInvoice?.type || "";
  const isViewingInvoice = Boolean(existingInvoice?.invoice_id);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [profiles, setProfiles] = useState([]);

  const [memberForm, setMemberForm] = useState(defaultPerson);
  const [patientForm, setPatientForm] = useState(defaultPerson);
  const [isPatientSameAsMember, setIsPatientSameAsMember] = useState(false);
  const [isMemberEditable, setIsMemberEditable] = useState(true);
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
    balance: "",
    authNr: "",
    type: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [lastImported, setLastImported] = useState(null);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);
  const isForeignUrgentBatch = useMemo(() => isForeignUrgentBatchType(batch), [batch]);
  const invoiceTypeOptions = useMemo(() => {
    const base = isForeignUrgentBatch ? ["foreign", "urgent_normal", "urgent_other"] : ["normal", "other"];
    if (existingInvoiceType && !base.includes(existingInvoiceType)) {
      return [...base, existingInvoiceType];
    }
    return base;
  }, [isForeignUrgentBatch, existingInvoiceType]);
  const selectedInvoiceType = invoiceForm.type;
  const isIdentityLocked = !selectedInvoiceType || ["normal", "urgent_normal"].includes(selectedInvoiceType);
  const memberFieldsDisabled = isIdentityLocked || !isMemberEditable;
  const medicalAidFieldsDisabled = isIdentityLocked;
  const patientFieldsDisabled = isIdentityLocked || isPatientSameAsMember;
  const canImportData = Boolean(selectedInvoiceType);

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
    if (!batch?.batch_id) return;
    let cancelled = false;

    const fetchInvoices = async () => {
      try {
        const res = await axiosClient.get(ENDPOINTS.batchInvoices(batch.batch_id));
        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data : res.data?.invoices;
        const count = Array.isArray(list) ? list.length : 0;
        setInvoiceCount(count);
        setInvoiceForm((prev) => ({
          ...prev,
          nrInBatch: prev.nrInBatch || count + 1,
        }));
      } catch (err) {
        console.error("Failed to load invoices for numbering:", err);
      }
    };

    fetchInvoices();
    return () => {
      cancelled = true;
    };
  }, [batch]);

  useEffect(() => {
    if (existingInvoice) return;
    if (isForeignUrgentBatch) return;
    if (!invoiceForm.type) {
      setInvoiceForm((prev) => ({ ...prev, type: "normal" }));
    }
  }, [existingInvoice, isForeignUrgentBatch, invoiceForm.type]);

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
      type: existingInvoiceType || "",
    });
    setIsMemberEditable(false);
  }, [existingInvoice]);

  if (!batch) {
    return (
      <section className="container-col">
        <p className="text-gray-dark">
          Batch with ID <strong>#{batchId}</strong> unavailable for creating an account.
        </p>
        <button
          type="button"
          className="tab-pill-dark bg-ebmaa-purple text-white px-6 hover:bg-ebmaa-purple-light mt-4"
          onClick={() => navigate("/workflow")}
        >
          Back to Workflow
        </button>
      </section>
    );
  }

  const infoItems = [
    { label: "Batch", value: `#${batch.batch_id}` },
    { label: "Client", value: clientDisplayName },
    { label: "Client ID", value: batch.client_id || "N/A" },
    { label: "Invoice Count", value: invoiceCount },
  ];

  const selectedMedicalAid = useMemo(() => {
    if (!medicalAidForm.medicalAidId) return null;
    return medicalAidCatalog.find((aid) => String(aid.id) === String(medicalAidForm.medicalAidId)) || null;
  }, [medicalAidCatalog, medicalAidForm.medicalAidId]);

  const availablePlans = useMemo(
    () => (selectedMedicalAid && Array.isArray(selectedMedicalAid.plans) ? selectedMedicalAid.plans : []),
    [selectedMedicalAid],
  );

  const handleSearchProfiles = async () => {
    if (!batch.client_id) {
      setSearchError("Client ID unavailable for this batch.");
      return;
    }
    if (!searchTerm.trim()) {
      setProfiles([]);
      setSearchError("");
      return;
    }
    setSearchLoading(true);
    setSearchError("");
    try {
      const res = await axiosClient.get(ENDPOINTS.accountSearch, {
        params: { clientId: batch.client_id, q: searchTerm.trim() },
      });
      setProfiles(res.data?.profiles || []);
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
    setIsMemberEditable(!includeMember);
    setLastImported({
      profileId: profile.profileId,
      accountId: account?.accountId || null,
    });
  };

  const onPersonFieldChange = (setter, field) => (e) => {
    const value = e.target.value;
    setter((prev) => ({ ...prev, [field]: value }));
  };

  const canSave = useMemo(() => {
    return (
      Boolean(invoiceForm.type) &&
      Boolean(medicalAidForm.medicalAidNr) &&
      Boolean(memberForm.first && memberForm.last) &&
      Boolean(invoiceForm.dateOfService) &&
      invoiceForm.balance !== ""
    );
  }, [medicalAidForm, memberForm, invoiceForm]);

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setSaveError("");
    try {
      const patientPayload = buildPatientPayload();
      const payload = {
        invoice: {
          nrInBatch: invoiceForm.nrInBatch ? Number(invoiceForm.nrInBatch) : null,
          dateOfService: invoiceForm.dateOfService,
          status: invoiceForm.status,
          fileNr: invoiceForm.fileNr,
          balance: invoiceForm.balance ? Number(invoiceForm.balance) : 0,
          authNr: invoiceForm.authNr,
          type: invoiceForm.type,
        },
        member: memberForm,
        patient: patientPayload,
        medicalAid: {
          medicalAidId: medicalAidForm.medicalAidId ? Number(medicalAidForm.medicalAidId) : null,
          planId: medicalAidForm.planId ? Number(medicalAidForm.planId) : null,
          medicalAidNr: medicalAidForm.medicalAidNr,
        },
        patientSameAsMember: isPatientSameAsMember,
      };

      if (existingInvoice?.invoice_id) {
        await axiosClient.put(ENDPOINTS.batchInvoiceUpdate(batch.batch_id, existingInvoice.invoice_id), payload);
      } else {
        await axiosClient.post(ENDPOINTS.batchAccountCreate(batch.batch_id), payload);
      }
      navigate(`/batches/${batch.batch_id}`, { state: { batch } });
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

  // Avoid duplicating person records when patient/member are the same
  const buildPatientPayload = useCallback(() => {
    if (!isPatientSameAsMember) {
      return patientForm;
    }
    const recordId = patientForm.recordId || memberForm.recordId || null;
    if (recordId) {
      return {
        recordId,
        dependentNumber: patientForm.dependentNumber || memberForm.dependentNumber || "",
      };
    }
    return {};
  }, [isPatientSameAsMember, patientForm, memberForm]);

  const handleImportProfilePerson = (person, target = "patient") => {
    if (!person || !selectedInvoiceType) return;
    if (target === "patient" && isPatientSameAsMember) return;
    const hydrated = hydratePersonForm(person);
    if (target === "member") {
      setMemberForm(hydrated);
    } else {
      setPatientForm(hydrated);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <section className="container-col">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-blue-600">Add Account / Invoice</p>
            <h1 className="text-2xl font-semibold text-gray-dark">Batch #{batch.batch_id}</h1>
            <p className="text-sm text-gray-blue-600">{clientDisplayName}</p>
          </div>
          <button type="button" className="button-pill min-w-[100px]" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>
        <div className="flex flex-wrap gap-6 mt-4">
          {infoItems.map((item) => (
            <div key={item.label}>
              <p className="text-xs uppercase tracking-wide text-gray-blue-600">{item.label}</p>
              <p className="text-lg font-semibold text-gray-dark">{item.value}</p>
            </div>
          ))}
        </div>
        {isViewingInvoice && existingInvoice && (
          <div className="mt-4 rounded border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            Editing invoice #{existingInvoice.invoice_id}. Updating will overwrite the current details.
          </div>
        )}
      </section>
      {/* SECTION 1 // SEARCH SECTION */}
      <div className="flex flex-row-reverse gap-4 lg:basis-2/4 mb-4">
        <section className="container-col m-0 flex w-full lg:basis-2/4 lg:flex-none">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[220px]">
              <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} classes="w-full" />
            </div>
            <button
              type="button"
              className="button-pill"
              onClick={handleSearchProfiles}
              disabled={searchLoading || !batch.client_id}
            >
              {searchLoading ? "Searching..." : "Search Profiles"}
            </button>
          </div>
          {searchError && <p className="text-sm text-red-600">{searchError}</p>}
          {!batch.client_id && (
            <p className="text-sm text-red-600">This batch is missing a client reference, so lookups are disabled.</p>
          )}
          <div className="flex flex-col gap-4 mt-4">
            {profiles.length === 0 && !searchLoading ? (
              <p className="text-sm text-gray-blue-600">Search for existing profiles or accounts by medical aid number, ID, or surname.</p>
            ) : (
              profiles.map((profile) => {
                const profilePersons = buildProfilePersons(profile);
                const hasPersonData = Boolean(profilePersons.mainMember || profilePersons.dependants.length);
                return (
                  <div key={profile.profileId} className="border border-gray-blue-100 rounded-lg p-4 bg-gray-100">
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
                        <button
                          type="button"
                          className={`tab-pill ${!canImportData ? "opacity-50 cursor-not-allowed" : ""}`}
                          onClick={() => handleImport(profile, null, { includeMember: true })}
                          disabled={!canImportData}
                        >
                          Import Profile
                        </button>
                      </div>
                    </div>
                    {hasPersonData && (
                      <div className="mt-4 flex flex-col gap-2">
                        <p className="text-xs uppercase text-gray-blue-600">Main Member & Dependants</p>
                        {profilePersons.mainMember && (
                          <div className="rounded border border-gray-blue-100 bg-white px-3 py-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-gray-dark">{profilePersons.mainMember.name}</p>
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
                                  <button
                                    type="button"
                                    className={`tab-pill ${
                                      !canImportData || isPatientSameAsMember ? "opacity-50 cursor-not-allowed" : ""
                                    }`}
                                    onClick={() => handleImportProfilePerson(profilePersons.mainMember.person, "patient")}
                                    disabled={!canImportData || isPatientSameAsMember}
                                  >
                                    Import Patient
                                  </button>
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
                                    <p className="text-sm font-semibold text-gray-dark">{name}</p>
                                    {meta && <p className="text-xs text-gray-blue-600">{meta}</p>}
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap justify-end">
                                    {roles.length > 0 && (
                                      <span className="text-[11px] uppercase tracking-wide text-gray-900">
                                        {roles.join(", ")}
                                      </span>
                                    )}
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        className={`tab-pill ${
                                          !canImportData || isPatientSameAsMember
                                            ? "opacity-50 cursor-not-allowed"
                                            : ""
                                        }`}
                                        onClick={() => handleImportProfilePerson(person, "patient")}
                                        disabled={!canImportData || isPatientSameAsMember}
                                      >
                                        Import Patient
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* SECTION 2 // INFO SECTION */}
        <div className="flex flex-col gap-4 w-full lg:basis-2/4">
        <section className="container-col m-0">
          <p className="text-xs uppercase tracking-wide text-gray-blue-600">Invoice Type</p>
          <div className="flex flex-wrap gap-3 mt-2">
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
          {isForeignUrgentBatch && !invoiceForm.type && (
            <p className="text-xs text-gray-blue-600 mt-2">Select a type to start editing account details.</p>
          )}
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
                type="number"
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
          {lastImported && (
            <p className="text-xs text-gray-blue-600 mt-3">
              Imported from profile #{lastImported.profileId}
              {lastImported.accountId ? ` / account #${lastImported.accountId}` : ""}
            </p>
          )}
          {saveError && <p className="text-sm text-red-600 mt-3">{saveError}</p>}
          <div className="flex justify-end gap-3 mt-4">
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
        </section>
      </div>
      </div>
    </div>
  );
};

export default AddAccount;
