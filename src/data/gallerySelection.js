// Keep every reviewed finished photo available while showing one cover per scene.
export function groupGalleryItems(items = []) {
  const groups = new Map();
  for (const item of items) {
    const key = item.scene || item.file;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return [...groups.values()];
}

export function orderGalleryItems(items = []) {
  return groupGalleryItems(items).flat();
}

export function getGalleryCovers(items = []) {
  return groupGalleryItems(items).map((photos) => ({
    ...photos[0],
    photoCount: photos.length,
  }));
}

// Slider helpers. Rotated photos are left to the full gallery, which handles
// their rotation; sliders only show photos that display upright as stored.
export function getUprightCovers(items = [], { category, excludeScenes = [] } = {}) {
  const upright = items.filter(
    (item) =>
      !item.rotation &&
      (!category || item.category === category) &&
      !excludeScenes.includes(item.scene),
  );
  return getGalleryCovers(upright);
}

export function getScenePhotos(items = [], scene) {
  if (!scene) return [];
  return items.filter((item) => item.scene === scene && !item.rotation);
}
