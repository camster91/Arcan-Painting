import { useState } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { ModalProvider } from "../src/contexts/ModalContext";
import MobileModal from "../src/components/MobileModal";
import BottomTabNav from "../src/components/BottomTabNav";
import MobileBreadcrumb from "../src/components/MobileBreadcrumb";
import { getAdminNavigation } from "../src/components/admin/navigation";

function Fixture() {
  const [open, setOpen] = useState(false);
  const [photo, setPhoto] = useState(false);
  return <MemoryRouter initialEntries={["/admin/projects"]}><ModalProvider>
    <MobileBreadcrumb />
    <div className="flex">
      <nav aria-label="Desktop business navigation" className="hidden lg:block shrink-0 p-4">
        {getAdminNavigation().map((group) => <a key={group.key} href={group.entryHref} className="block min-h-11 p-3">{group.label}</a>)}
      </nav>
      <main className="min-w-0 flex-1 p-4 pb-24">
        <h1 className="text-2xl font-bold">Jobs</h1>
        <p>Component QA fixture. No authenticated API or customer data.</p>
        <button className="min-h-11 px-4 py-2 border rounded-lg" onClick={() => setOpen(true)}>New job</button>
        <MobileModal isOpen={open} title="New job" onClose={() => setOpen(false)}
          footer={<button className="min-h-11 px-4 py-2 border rounded-lg" onClick={() => setOpen(false)}>Cancel job</button>}>
          <label htmlFor="job-name">Job name</label>
          <input id="job-name" className="block w-full border p-3" defaultValue="A long Toronto painting job name with several rooms and an unusually long address" />
          <button className="min-h-11 px-4 py-2 border rounded-lg" onClick={() => setPhoto(true)}>Add photo</button>
          <MobileModal isOpen={photo} title="Add photo" onClose={() => setPhoto(false)}>
            <label htmlFor="photo-caption">Caption</label><input id="photo-caption" className="block w-full border p-3" />
          </MobileModal>
          {Array.from({length: 15}, (_, i) => <p key={i} className="py-3">Area {i+1}: walls, trim and doors.</p>)}
        </MobileModal>
      </main>
    </div>
    <BottomTabNav />
  </ModalProvider></MemoryRouter>;
}
createRoot(document.getElementById("root")).render(<Fixture />);
