import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Slider from './Slider';
import WorkSlider from './WorkSlider';
import { projectGallery } from '@/data/projectGallery';
import { getScenePhotos, getUprightCovers } from '@/data/gallerySelection';

describe('premium sliders', () => {
  it('renders every child as a labelled slide in a carousel region', () => {
    render(<Slider label="Test slides"><p>One</p><p>Two</p><p>Three</p></Slider>);
    const region = screen.getByRole('region', { name: 'Test slides' });
    expect(region).toHaveAttribute('aria-roledescription', 'carousel');
    expect(region.querySelectorAll('li[aria-roledescription="slide"]')).toHaveLength(3);
    expect(screen.getByLabelText('3 of 3')).toHaveTextContent('Three');
  });

  it('links stories to their page and gallery covers to the gallery', () => {
    render(
      <WorkSlider
        label="Work"
        stories={[{ href: '/projects/x', image: '/x.webp', imageAlt: 'X room', title: 'X', category: 'Interior' }]}
        covers={getUprightCovers(projectGallery, { category: 'Exterior' })}
      />,
    );
    expect(screen.getByRole('link', { name: /X room/ })).toHaveAttribute('href', '/projects/x');
    const links = screen.getAllByRole('link');
    expect(links.slice(1).every((link) => link.getAttribute('href') === '/projects#gallery')).toBe(true);
  });

  it('only offers upright photos and filters by category and scene', () => {
    const covers = getUprightCovers(projectGallery, { category: 'Wallpaper', excludeScenes: ['floral-window-room'] });
    expect(covers.every((c) => c.category === 'Wallpaper' && !c.rotation && c.scene !== 'floral-window-room')).toBe(true);
    const scene = getScenePhotos(projectGallery, 'patterned-dining-room');
    expect(scene.length).toBeGreaterThan(1);
    expect(getScenePhotos(projectGallery, undefined)).toEqual([]);
  });
});

describe('service areas', () => {
  it('lists exactly the confirmed city route names, in order', async () => {
    const { serviceAreas } = await import('@/data/premiumSite');
    const { CITIES } = await import('@/app/[service]/[city]/page.jsx');
    expect(serviceAreas).toEqual(Object.values(CITIES).map((city) => city.name));
  });
});

describe('hero slideshow', () => {
  it('shows the first photo to everyone and hides the others from screen readers', async () => {
    const { default: HeroSlideshow } = await import('./HeroSlideshow');
    const slides = [1, 2, 3].map((n) => ({ src: `/hero/${n}.webp`, alt: `Photo ${n}`, width: 900, height: 1200 }));
    const { container } = render(<HeroSlideshow slides={slides} />);
    const imgs = container.querySelectorAll('img');
    expect(imgs).toHaveLength(3);
    expect(imgs[0]).toHaveAttribute('alt', 'Photo 1');
    expect(imgs[0]).toHaveAttribute('fetchpriority', 'high');
    expect(imgs[1]).toHaveAttribute('aria-hidden', 'true');
    expect(imgs[2]).toHaveAttribute('loading', 'lazy');
  });
});
