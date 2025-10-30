export const getStatusColor = (status) => {
  switch (status) {
    case "draft":
      return "bg-slate-100 text-slate-700";
    case "sent":
      return "bg-blue-100 text-blue-700";
    case "signed":
      return "bg-green-100 text-green-700";
    case "completed":
      return "bg-emerald-100 text-emerald-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

export const filterContracts = (contracts, searchTerm) => {
  if (!searchTerm) return contracts;

  return contracts.filter((contract) => {
    const searchFields = [
      contract.contract_number,
      contract.title,
      contract.client_name,
      contract.client_email,
    ];

    return searchFields.some((field) =>
      field?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  });
};

export const calculateContractStats = (contracts) => {
  const totalContracts = contracts.length;
  const awaitingSignature = contracts.filter((c) => c.status === "sent").length;
  const signed = contracts.filter((c) => c.status === "signed").length;
  const totalValue = contracts.reduce(
    (sum, c) => sum + parseFloat(c.total_amount || 0),
    0,
  );

  return {
    totalContracts,
    awaitingSignature,
    signed,
    totalValue,
  };
};
