import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

export function useEstimateCalculator() {
  const appliedDefaultsRef = useRef(false);

  // Client info
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [address, setAddress] = useState("");
  const [projectTitle, setProjectTitle] = useState("");

  // Settings (will be prefilled from server)
  const [taxRate, setTaxRate] = useState("13");
  const [hourlyCost, setHourlyCost] = useState("35");
  const [markupPct, setMarkupPct] = useState("20");

  // Unit costs
  const [finishPaintCost, setFinishPaintCost] = useState("42");
  const [primerPaintCost, setPrimerPaintCost] = useState("20");
  const [tapeRollCost, setTapeRollCost] = useState("5");
  const [plasticRollCost, setPlasticRollCost] = useState("18");
  const [caulkTubeCost, setCaulkTubeCost] = useState("4");
  const [sundriesKitCost, setSundriesKitCost] = useState("25");

  // Area dimensions
  const [areaName, setAreaName] = useState("Main Room");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");

  // Surface settings
  const [wallsMethod, setWallsMethod] = useState("roll");
  const [wallsCoats, setWallsCoats] = useState("2");
  const [wallsPrimer, setWallsPrimer] = useState(false);

  const [ceilMethod, setCeilMethod] = useState("roll");
  const [ceilCoats, setCeilCoats] = useState("1");
  const [ceilPrimer, setCeilPrimer] = useState(false);

  const [trimLf, setTrimLf] = useState("");
  const [doorsCount, setDoorsCount] = useState("");

  // Prep work
  const [maskingPercent, setMaskingPercent] = useState("0");
  const [tapeLf, setTapeLf] = useState("");
  const [plasticSqft, setPlasticSqft] = useState("");
  const [floorSqft, setFloorSqft] = useState("");
  const [minorPatches, setMinorPatches] = useState("");
  const [majorPatchSqft, setMajorPatchSqft] = useState("");
  const [caulkLf, setCaulkLf] = useState("");
  const [spotPrimeCount, setSpotPrimeCount] = useState("");

  // Status and messages
  const [notification, setNotification] = useState(null);
  const [error, setError] = useState("");

  // Fetch settings from server
  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings", { method: "GET" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(j?.error || `Failed to load settings [${res.status}]`);
      }
      return j.settings || {};
    },
    onSuccess: (s) => {
      if (appliedDefaultsRef.current) return;
      if (s?.tax_rate != null) setTaxRate(String(s.tax_rate));
      if (s?.hourly_rate != null) setHourlyCost(String(s.hourly_rate));
      if (s?.markup_pct != null) setMarkupPct(String(s.markup_pct));
      appliedDefaultsRef.current = true;
    },
  });

  // Mutations: create lead then create estimate via estimate-builder
  const createLead = useMutation({
    mutationFn: async () => {
      const body = {
        name: clientName,
        email: clientEmail,
        phone: clientPhone,
        serviceType: "painting",
        projectDescription: projectTitle,
        address,
      };
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(j?.error || `Failed to create lead [${res.status}]`);
      }
      return j.lead;
    },
  });

  const createEstimate = useMutation({
    mutationFn: async (leadId) => {
      // Build a single-area payload similar to mobile MVP
      const areas = [
        {
          name: areaName,
          length: length ? parseFloat(length) : null,
          width: width ? parseFloat(width) : null,
          height: height ? parseFloat(height) : null,
          surfaces: [
            {
              surface_type: "walls",
              unit: "sqft",
              method: wallsMethod,
              coats: parseInt(wallsCoats || "2", 10),
              primer: !!wallsPrimer,
            },
            {
              surface_type: "ceiling",
              unit: "sqft",
              method: ceilMethod,
              coats: parseInt(ceilCoats || "1", 10),
              primer: !!ceilPrimer,
            },
            ...(trimLf
              ? [
                  {
                    surface_type: "trim",
                    unit: "lf",
                    measurement: parseFloat(trimLf),
                    method: "roll",
                    coats: 1,
                    primer: false,
                  },
                ]
              : []),
            ...(doorsCount
              ? [
                  {
                    surface_type: "door",
                    unit: "count",
                    measurement: parseInt(doorsCount, 10),
                    method: "roll",
                    coats: 1,
                    primer: false,
                    door_sides: 2,
                  },
                ]
              : []),
          ],
        },
      ];
      const payload = {
        lead_id: leadId,
        project_title: projectTitle || "New Estimate",
        project_description: `Estimate for ${clientName || "client"}`,
        settings: {
          tax_rate: parseFloat(taxRate || "0"),
          crew_hourly_cost: parseFloat(hourlyCost || "35"),
          markup_pct: parseFloat(markupPct || "0"),
        },
        areas,
      };
      const res = await fetch("/api/estimate-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(j?.error || "Failed to create estimate");
      }
      return j;
    },
    onSuccess: (j) => {
      setNotification(`Estimate #${j.estimate_id} created`);
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (e) => setError(e.message || "Failed to create estimate"),
  });

  const onSave = async () => {
    setError("");
    if (!clientName || !clientEmail || !clientPhone) {
      setError("Please enter client name, email, and phone");
      return;
    }
    if (!projectTitle) {
      setError("Please enter a project title");
      return;
    }
    try {
      const lead = await createLead.mutateAsync();
      await createEstimate.mutateAsync(lead.id);
    } catch (e) {
      // error handled in mutations
    }
  };

  return {
    // Client info
    clientName,
    setClientName,
    clientEmail,
    setClientEmail,
    clientPhone,
    setClientPhone,
    address,
    setAddress,
    projectTitle,
    setProjectTitle,

    // Settings
    taxRate,
    setTaxRate,
    hourlyCost,
    setHourlyCost,
    markupPct,
    setMarkupPct,

    // Unit costs
    finishPaintCost,
    setFinishPaintCost,
    primerPaintCost,
    setPrimerPaintCost,
    tapeRollCost,
    setTapeRollCost,
    plasticRollCost,
    setPlasticRollCost,
    caulkTubeCost,
    setCaulkTubeCost,
    sundriesKitCost,
    setSundriesKitCost,

    // Area dimensions
    areaName,
    setAreaName,
    length,
    setLength,
    width,
    setWidth,
    height,
    setHeight,

    // Surface settings
    wallsMethod,
    setWallsMethod,
    wallsCoats,
    setWallsCoats,
    wallsPrimer,
    setWallsPrimer,
    ceilMethod,
    setCeilMethod,
    ceilCoats,
    setCeilCoats,
    ceilPrimer,
    setCeilPrimer,
    trimLf,
    setTrimLf,
    doorsCount,
    setDoorsCount,

    // Prep work
    maskingPercent,
    setMaskingPercent,
    tapeLf,
    setTapeLf,
    plasticSqft,
    setPlasticSqft,
    floorSqft,
    setFloorSqft,
    minorPatches,
    setMinorPatches,
    majorPatchSqft,
    setMajorPatchSqft,
    caulkLf,
    setCaulkLf,
    spotPrimeCount,
    setSpotPrimeCount,

    // Status
    notification,
    error,

    // Actions
    onSave,
    isLoading: createLead.isLoading || createEstimate.isLoading,
  };
}
