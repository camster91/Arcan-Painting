import { Star } from "lucide-react";
import { googleListing } from "@/data/googleListing";
import { Section, SectionHeading } from "./primitives";
import GoogleListing from "./GoogleListing";

export default function GoogleReviews() {
  return (
    <Section className="p-google-reviews" id="reviews">
      <SectionHeading eyebrow="From our clients" title="Their words. Our work.">
        Selected excerpts from real Google reviews.
      </SectionHeading>
      <p className="p-google-rating">
        <Star size={20} aria-hidden="true" />
        <strong>{googleListing.rating} out of 5</strong> · {googleListing.reviewCount} Google reviews
      </p>
      <div className="p-review-grid">
        {googleListing.reviews.map(review => (
          <figure className="p-review-card" key={review.author}>
            <div className="p-review-stars" role="img" aria-label={`${review.rating} out of 5 stars`}>
              {Array.from({length:review.rating},(_,i)=><Star key={i} size={15} aria-hidden="true" />)}
            </div>
            <blockquote><p>“{review.excerpt}”</p></blockquote>
            <figcaption>{review.author} · Google review excerpt</figcaption>
          </figure>
        ))}
      </div>
      <div className="p-review-actions">
        <GoogleListing />
        <a className="p-button p-button--line" href={googleListing.url} target="_blank" rel="noopener noreferrer">
          Read all Google reviews <span aria-hidden="true">↗</span><span className="p-visually-hidden"> (opens in a new tab)</span>
        </a>
      </div>
      <p className="p-note">Rating and excerpts checked on 25 October 2026. See Google for current reviews.</p>
    </Section>
  );
}
