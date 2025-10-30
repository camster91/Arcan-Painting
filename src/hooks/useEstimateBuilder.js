import { useState, useEffect } from "react";

export function useEstimateBuilder(editingEstimate) {
  // Client Information
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [address, setAddress] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  // Settings
  const [taxRate, setTaxRate] = useState("13");
  const [hourlyRate, setHourlyRate] = useState("35");
  const [markupPct, setMarkupPct] = useState("20");

  // Areas/Rooms
  const [areas, setAreas] = useState([
    {
      id: 1,
      name: "Main Room",
      length: "",
      width: "",
      height: "",
      wallsMethod: "roll",
      wallsCoats: "2",
      wallsPrimer: false,
      paintCeiling: true,
      ceilMethod: "roll",
      ceilCoats: "1",
      ceilPrimer: false,
      trimLf: "",
      doorsCount: "",
      prepWork: {
        tapeLf: "",
        plasticSqft: "",
        minorPatches: "",
        majorPatchSqft: "",
        caulkLf: "",
      },
    },
  ]);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Load estimate data if editing
  useEffect(() => {
    if (editingEstimate) {
      setClientName(editingEstimate.lead_name || "");
      setClientEmail(editingEstimate.lead_email || "");
      setClientPhone(editingEstimate.lead_phone || "");
      setAddress(editingEstimate.lead_address || "");
      setProjectTitle(editingEstimate.project_title || "");
      setProjectDescription(editingEstimate.project_description || "");
    }
  }, [editingEstimate]);

  const addArea = () => {
    const newArea = {
      id: Date.now(),
      name: `Room ${areas.length + 1}`,
      length: "",
      width: "",
      height: "",
      wallsMethod: "roll",
      wallsCoats: "2",
      wallsPrimer: false,
      paintCeiling: true,
      ceilMethod: "roll",
      ceilCoats: "1",
      ceilPrimer: false,
      trimLf: "",
      doorsCount: "",
      prepWork: {
        tapeLf: "",
        plasticSqft: "",
        minorPatches: "",
        majorPatchSqft: "",
        caulkLf: "",
      },
    };
    setAreas([...areas, newArea]);
  };

  const removeArea = (id) => {
    setAreas(areas.filter((area) => area.id !== id));
  };

  const updateArea = (id, updates) => {
    setAreas(
      areas.map((area) => (area.id === id ? { ...area, ...updates } : area)),
    );
  };

  const updatePrepWork = (id, prepUpdates) => {
    setAreas(
      areas.map((area) =>
        area.id === id
          ? { ...area, prepWork: { ...area.prepWork, ...prepUpdates } }
          : area,
      ),
    );
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
    projectDescription,
    setProjectDescription,
    // Settings
    taxRate,
    setTaxRate,
    hourlyRate,
    setHourlyRate,
    markupPct,
    setMarkupPct,
    // Areas
    areas,
    addArea,
    removeArea,
    updateArea,
    updatePrepWork,
    // State
    error,
    setError,
    isLoading,
    setIsLoading,
  };
}
