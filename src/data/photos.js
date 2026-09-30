// Real Arcan project photos used in heroes and cards. Resized copies live in
// public/hero/<file>-{800,900,1400}.webp (originals in public/gallery/images,
// which is not shipped in the image). Regenerate the copies if a photo changes.
export const PHOTOS = {
  muralRoom: { file: "PXL_20251009_200610576", alt: "Painter working on the ceiling of a dining room finished with a botanical mural wallcovering" },
  muralInstall: { file: "PXL_20251009_184239255", alt: "Painter installing a botanical mural wallcovering with a crane motif" },
  muralLadder: { file: "PXL_20251009_180850831", alt: "Painter installing a botanical mural wallcovering from a ladder" },
  rugRoom: { file: "PXL_20251018_142500065", alt: "Restaurant dining room finished with a patterned wallcovering and a matte black ceiling" },
  wineBar: { file: "IMG-20260217-WA0018", alt: "Wine bar with a deep red painted ceiling and walls" },
  staircase: { file: "IMG-20260212-WA0016", alt: "Staircase refinished with black treads, white risers and white balusters" },
  staircaseLong: { file: "IMG-20260212-WA0023", alt: "Long staircase refinished with black treads and white risers" },
  blackWindow: { file: "20180516_145706", alt: "Exterior window frame painted black against red brick" },
  blueAccent: { file: "PXL_20210109_221844861", alt: "Living room with a deep blue accent wall behind a white fireplace mantel" },
  redBeams: { file: "20160901_105150", alt: "Commercial ceiling beams being painted, with a red accent" },
  floralBedroom: { file: "PXL_20260213_210915996", alt: "Bedroom wall finished with a soft floral wallpaper" },
};

export const photoSrc = (photo, width) => `/hero/${photo.file}-${width}.webp`;
export const photoSrcSet = (photo) => `${photoSrc(photo, 800)} 800w, ${photoSrc(photo, 1400)} 1400w`;
