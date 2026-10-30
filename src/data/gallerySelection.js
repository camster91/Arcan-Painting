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
