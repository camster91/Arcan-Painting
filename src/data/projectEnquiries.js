import { projectGallery } from "./projectGallery";

const SERVICE_BY_CATEGORY = {
  Interior: "interior",
  Wallpaper: "wallpaper",
  Exterior: "exterior",
  Commercial: "commercial",
};

// URL values identify existing public photographs; never reflect arbitrary text.
export function getEnquiryProject(file) {
  return projectGallery.find((item) => item.file === file) || null;
}

export function getProjectService(project) {
  return SERVICE_BY_CATEGORY[project?.category] || "other";
}

export function projectGalleryHref(file) {
  return `/projects?photo=${encodeURIComponent(file)}#gallery`;
}

export function projectEnquiryHref(file) {
  return `/contact?project=${encodeURIComponent(file)}`;
}
