import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { MoreHorizontal, X } from "lucide-react";
import { getAdminNavigation, getActiveAdminGroup, matchesAdminPath } from "@/components/admin/navigation";

export default function BottomTabNav({ unreadCount = 0 }) {
  const { pathname } = useLocation();
  const dialog = useRef(null);
  const trigger = useRef(null);
  const groups = getAdminNavigation(unreadCount);
  const primaryKeys = ["home", "leads", "jobs", "invoices"];
  const primary = groups.filter((group) => primaryKeys.includes(group.key));
  const active = getActiveAdminGroup(pathname, groups);
  const close = () => dialog.current?.close();

  useEffect(() => { if (dialog.current?.open) dialog.current.close(); }, [pathname]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onResize = () => { if (desktop.matches && dialog.current?.open) dialog.current.close(); };
    desktop.addEventListener("change", onResize);
    return () => desktop.removeEventListener("change", onResize);
  }, []);

  return (
    <nav aria-label="Business navigation" className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-50 lg:hidden">
      <dialog ref={dialog} id="admin-more-menu" aria-labelledby="admin-more-title"
        onClose={() => trigger.current?.focus()}
        className="m-0 mt-auto w-full max-w-none max-h-[85dvh] overflow-y-auto rounded-t-xl p-4 backdrop:bg-black/50">
        <div className="flex items-center justify-between mb-4">
          <h2 id="admin-more-title" className="text-lg font-semibold">Business navigation</h2>
          <button type="button" onClick={close} aria-label="Close navigation"
            className="p-3 rounded-lg hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-amber-600"><X size={20} /></button>
        </div>
        {groups.map((group) => (
          <section key={group.key} className="border-b border-slate-100 py-2">
            <a href={group.entryHref} onClick={close}
              aria-current={matchesAdminPath(pathname, group.entryHref) ? "page" : undefined}
              className="flex items-center gap-3 min-h-11 px-3 font-semibold text-slate-900 rounded-lg hover:bg-amber-50 focus-visible:ring-2 focus-visible:ring-amber-600">
              <group.icon size={20} aria-hidden="true" />{group.label}
            </a>
            {group.tabs.filter((tab) => tab.href !== group.entryHref).map((tab) => (
              <a key={tab.href} href={tab.href} onClick={close}
                aria-current={matchesAdminPath(pathname, tab.href) ? "page" : undefined}
                className="flex items-center gap-2 min-h-11 pl-12 pr-3 text-sm text-slate-700 rounded-lg hover:bg-amber-50 focus-visible:ring-2 focus-visible:ring-amber-600">
                {tab.label}{tab.badge ? <span className="text-xs">({tab.badge > 99 ? "99+" : tab.badge} unread)</span> : null}
              </a>
            ))}
          </section>
        ))}
      </dialog>
      <div className="flex items-center px-1 py-2" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
        {primary.map((group) => (
          <a key={group.key} href={group.entryHref} aria-current={active.key === group.key ? "page" : undefined}
            className={`flex flex-col items-center justify-center min-h-11 py-2 min-w-0 flex-1 rounded-lg focus-visible:ring-2 focus-visible:ring-amber-600 ${active.key === group.key ? "text-amber-800 bg-amber-50" : "text-slate-600 hover:bg-slate-50"}`}>
            <group.icon size={20} aria-hidden="true" /><span className="text-xs mt-1">{group.label}</span>
          </a>
        ))}
        <button ref={trigger} type="button" aria-haspopup="dialog" aria-controls="admin-more-menu"
          onClick={() => dialog.current?.showModal()}
          className={`flex flex-col items-center justify-center min-h-11 py-2 min-w-0 flex-1 rounded-lg focus-visible:ring-2 focus-visible:ring-amber-600 ${!primaryKeys.includes(active.key) ? "text-amber-800 bg-amber-50" : "text-slate-600 hover:bg-slate-50"}`}>
          <MoreHorizontal size={20} aria-hidden="true" /><span className="text-xs mt-1">More</span>
        </button>
      </div>
    </nav>
  );
}
