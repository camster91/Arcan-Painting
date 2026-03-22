import { useState, useEffect } from "react";

const INITIAL_FORM_DATA = {
  contract_number: "",
  estimate_id: "",
  lead_id: "",
  project_id: "",
  title: "",
  description: "",
  scope_of_work: "",
  terms_and_conditions: "",
  payment_terms: "",
  warranty_terms: "",
  total_amount: "",
  deposit_percentage: 25,
  deposit_amount: "",
  start_date: "",
  completion_date: "",
  estimated_duration_days: "",
  notes: "",
};

export default function useContractForm({ estimateId, leadId, projectId, onSuccess, onClose }) {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [leads, setLeads] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    ...INITIAL_FORM_DATA,
    estimate_id: estimateId || "",
    lead_id: leadId || "",
    project_id: projectId || "",
  });

  const loadAll = () => {
    loadTemplates();
    loadLeads();
    loadEstimates();
    loadProjects();
    generateContractNumber();
  };

  // Load estimate data when estimate is selected
  useEffect(() => {
    if (formData.estimate_id) {
      loadEstimateData(formData.estimate_id);
    }
  }, [formData.estimate_id]);

  // Calculate deposit amount when total or percentage changes
  useEffect(() => {
    if (formData.total_amount && formData.deposit_percentage) {
      const total = parseFloat(formData.total_amount);
      const percentage = parseInt(formData.deposit_percentage);
      const deposit = (total * percentage) / 100;
      setFormData((prev) => ({ ...prev, deposit_amount: deposit.toFixed(2) }));
    }
  }, [formData.total_amount, formData.deposit_percentage]);

  const generateContractNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    const contractNumber = `CTR-${year}${month}${day}-${random}`;
    setFormData((prev) => ({ ...prev, contract_number: contractNumber }));
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch("/api/contract-templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  };

  const loadLeads = async () => {
    try {
      const response = await fetch("/api/leads");
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads || []);
      }
    } catch (error) {
      console.error("Error loading leads:", error);
    }
  };

  const loadEstimates = async () => {
    try {
      const response = await fetch("/api/estimates?status=approved");
      if (response.ok) {
        const data = await response.json();
        setEstimates(data.estimates || []);
      }
    } catch (error) {
      console.error("Error loading estimates:", error);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  };

  const loadEstimateData = async (estId) => {
    try {
      const response = await fetch(`/api/estimates?id=${estId}`);
      if (response.ok) {
        const data = await response.json();
        const estimate = data.estimates?.[0];
        if (estimate) {
          setFormData((prev) => ({
            ...prev,
            lead_id: estimate.lead_id || "",
            title: estimate.project_title || "",
            description: estimate.project_description || "",
            total_amount: estimate.total_cost || "",
            estimated_duration_days: estimate.estimated_duration_days || "",
          }));
        }
      }
    } catch (error) {
      console.error("Error loading estimate data:", error);
    }
  };

  const applyTemplate = async (templateId) => {
    try {
      const response = await fetch(`/api/contract-templates/${templateId}`);
      if (response.ok) {
        const template = await response.json();
        setFormData((prev) => ({
          ...prev,
          scope_of_work: template.scope_template || "",
          terms_and_conditions: template.terms_template || "",
          payment_terms: template.payment_terms_template || "",
          warranty_terms: template.warranty_template || "",
          deposit_percentage: template.default_deposit_percentage || 25,
        }));
      }
    } catch (error) {
      console.error("Error applying template:", error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.scope_of_work.trim())
      newErrors.scope_of_work = "Scope of work is required";
    if (!formData.total_amount)
      newErrors.total_amount = "Total amount is required";
    if (!formData.lead_id) newErrors.lead_id = "Client selection is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create contract");
      }

      const contract = await response.json();
      onSuccess?.(contract);
      handleClose();
    } catch (error) {
      console.error("Error creating contract:", error);
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ ...INITIAL_FORM_DATA });
    setSelectedTemplate("");
    setErrors({});
    onClose();
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return {
    formData,
    updateField,
    loading,
    errors,
    templates,
    leads,
    estimates,
    projects,
    selectedTemplate,
    setSelectedTemplate,
    loadAll,
    applyTemplate,
    handleSubmit,
    handleClose,
  };
}
