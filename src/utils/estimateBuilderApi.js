export async function saveEstimate({
  editingEstimate,
  clientName,
  clientEmail,
  clientPhone,
  address,
  projectTitle,
  projectDescription,
  areas,
  taxRate,
  hourlyRate,
  markupPct,
  onEstimateCreated,
  onEstimateUpdated,
}) {
  // Validation
  if (!clientName || !clientEmail || !clientPhone) {
    throw new Error("Please enter client name, email, and phone");
  }
  if (!projectTitle) {
    throw new Error("Please enter a project title");
  }
  if (areas.length === 0) {
    throw new Error("Please add at least one room/area");
  }

  // Create or update lead first
  const leadPayload = {
    name: clientName,
    email: clientEmail,
    phone: clientPhone,
    serviceType: "painting",
    projectDescription: projectDescription || projectTitle,
    address,
  };

  let leadId;
  if (editingEstimate?.lead_id) {
    leadId = editingEstimate.lead_id;
    // Update lead
    const leadRes = await fetch(`/api/leads`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: leadId, ...leadPayload }),
    });
    if (!leadRes.ok) {
      const error = await leadRes.json().catch(() => ({}));
      throw new Error(error.error || "Failed to update lead");
    }
  } else {
    // Create new lead
    const leadRes = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leadPayload),
    });
    const leadData = await leadRes.json().catch(() => ({}));
    if (!leadRes.ok) {
      throw new Error(leadData.error || "Failed to create lead");
    }
    leadId = leadData.lead.id;
  }

  // Prepare estimate payload
  const estimatePayload = {
    lead_id: leadId,
    project_title: projectTitle,
    project_description: projectDescription,
    settings: {
      tax_rate: parseFloat(taxRate),
      crew_hourly_cost: parseFloat(hourlyRate),
      markup_pct: parseFloat(markupPct),
    },
    areas: areas.map((area) => ({
      name: area.name,
      length: parseFloat(area.length) || null,
      width: parseFloat(area.width) || null,
      height: parseFloat(area.height) || null,
      surfaces: [
        {
          surface_type: "walls",
          unit: "sqft",
          method: area.wallsMethod,
          coats: parseInt(area.wallsCoats),
          primer: area.wallsPrimer,
        },
        // Only include ceiling if paintCeiling is enabled
        ...(area.paintCeiling
          ? [
              {
                surface_type: "ceiling",
                unit: "sqft",
                method: area.ceilMethod,
                coats: parseInt(area.ceilCoats),
                primer: area.ceilPrimer,
              },
            ]
          : []),
        ...(area.trimLf
          ? [
              {
                surface_type: "trim",
                unit: "lf",
                measurement: parseFloat(area.trimLf),
                method: "roll",
                coats: 1,
                primer: false,
              },
            ]
          : []),
        ...(area.doorsCount
          ? [
              {
                surface_type: "door",
                unit: "count",
                measurement: parseInt(area.doorsCount),
                method: "roll",
                coats: 1,
                primer: false,
                door_sides: 2,
              },
            ]
          : []),
      ],
    })),
  };

  // Create or update estimate
  if (editingEstimate) {
    const res = await fetch(`/api/estimates`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingEstimate.id, ...estimatePayload }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Update estimate failed:", res.status, data);
      throw new Error(data.error || "Failed to update estimate");
    }
    onEstimateUpdated?.();
  } else {
    console.log("Creating estimate with payload:", estimatePayload);
    const res = await fetch("/api/estimate-builder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(estimatePayload),
    });
    const data = await res.json().catch(() => ({}));
    console.log("Estimate creation response:", { status: res.status, data });
    if (!res.ok) {
      console.error("Create estimate failed:", res.status, data);
      throw new Error(
        data.error || `Failed to create estimate (${res.status})`,
      );
    }
    onEstimateCreated?.();
  }
}
