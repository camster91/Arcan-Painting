export const ENQUIRY_SERVICES = [
  { key: "interior", label: "Interior", pageName: "Interior Painting" },
  { key: "exterior", label: "Exterior", pageName: "Exterior Painting" },
  { key: "commercial", label: "Commercial", pageName: "Commercial Painting" },
  { key: "wallpaper", label: "Wallpaper", pageName: "Wallpaper Services" },
  { key: "specialty", label: "Specialty Finishes", pageName: "Specialty Finishes" },
  { key: "consultation", label: "Color Consultation" },
  { key: "other", label: "Other" },
];

export function enquiryServiceForPage(pageName) {
  return ENQUIRY_SERVICES.find((service) => service.pageName === pageName)?.key || "";
}
