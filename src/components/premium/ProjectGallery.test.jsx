import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ProjectGallery from './ProjectGallery';
import { projectGallery } from '@/data/projectGallery';
import { getGalleryCovers, orderGalleryItems } from '@/data/gallerySelection';

describe('finished gallery scene covers and additional views', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function () { this.setAttribute('open', ''); } });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function () { this.removeAttribute('open'); } });
    vi.stubGlobal('requestAnimationFrame', (callback) => { callback(); return 1; });
  });
  afterEach(() => { delete HTMLDialogElement.prototype.showModal; delete HTMLDialogElement.prototype.close; vi.unstubAllGlobals(); });

  it('loads more covers without repeating scenes and filters the cover grid', () => {
    const { container } = render(<ProjectGallery />);
    expect(container.querySelectorAll('.p-project-gallery__card')).toHaveLength(12);
    fireEvent.click(screen.getByRole('button', { name: 'Show more images', exact: true }));
    expect(container.querySelectorAll('.p-project-gallery__card')).toHaveLength(getGalleryCovers(projectGallery).length);
    fireEvent.click(screen.getByRole('button', { name: 'Wallpaper', exact: true }));
    const wallpaper = projectGallery.filter(item => item.category === 'Wallpaper');
    expect(container.querySelectorAll('.p-project-gallery__card')).toHaveLength(getGalleryCovers(wallpaper).length);
    expect(screen.getByText(new RegExp(`${wallpaper.length} photos`))).toBeInTheDocument();
  });

  it('opens the cover and includes every reviewed additional view in sequence', () => {
    const { container } = render(<ProjectGallery />);
    const cover = screen.getByRole('link', { name: 'Floral feature wall and sage trim: view 6 photos', exact: true });
    fireEvent.click(cover);
    const photos = orderGalleryItems(projectGallery);
    for (const item of photos) {
      const image = container.querySelector('.p-project-gallery__dialog-image');
      expect(image.getAttribute('src')).toContain(item.file);
      fireEvent.click(screen.getByRole('button', { name: 'Next image', exact: true }));
    }
    expect(container.querySelector('.p-project-gallery__dialog-image').getAttribute('src')).toContain(photos[0].file);
    fireEvent.click(screen.getByRole('button', { name: 'Close image viewer', exact: true }));
    expect(container.querySelector('dialog')).not.toHaveAttribute('open');
    expect(cover).toHaveFocus();
  });
});
