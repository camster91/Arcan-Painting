import { useId, useRef, useState } from "react";
import { MapPin, X } from "lucide-react";
import { googleListing } from "@/data/googleListing";

export default function GoogleListing() {
  const dialog = useRef(null);
  const trigger = useRef(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  function show() {
    dialog.current.showModal();
    setOpen(true);
  }
  return (
    <div className="p-map-listing">
      <button ref={trigger} className="p-button p-button--line" type="button" onClick={show} aria-haspopup="dialog">
        View Arcan on Google Maps <MapPin size={18} aria-hidden="true" />
      </button>
      <dialog ref={dialog} className="p-map-dialog" aria-labelledby={titleId}
        onClose={() => { setOpen(false); trigger.current?.focus(); }}
        onClick={event => { if (event.target === dialog.current) dialog.current.close(); }}>
        <div className="p-map-panel" onClick={event => event.stopPropagation()}>
          <div className="p-map-header">
            <h2 id={titleId}>Arcan Painting on Google</h2>
            <button className="p-map-close" type="button" onClick={() => dialog.current.close()} aria-label="Close map">
              <X size={22} aria-hidden="true" />
            </button>
          </div>
          <p className="p-note">Google Maps loads when you open this window.</p>
          {open && <iframe src={googleListing.embedUrl} title="Arcan Painting Google Maps listing" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />}
          <a className="p-button p-button--line" href={googleListing.url} target="_blank" rel="noopener noreferrer">
            Open listing and all reviews <span aria-hidden="true">↗</span><span className="p-visually-hidden"> (opens in a new tab)</span>
          </a>
        </div>
      </dialog>
    </div>
  );
}
