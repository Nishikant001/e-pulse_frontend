import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { EXTRA_ROUTE_LABELS, findNavTrail } from "../../config/navigation";

function prettify(segment) {
  return decodeURIComponent(segment || "")
    .replace(/[-_]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^\w/, (c) => c.toUpperCase());
}

// Breadcrumb trail + page title derived from the route and the portal's navigation model.
export function useBreadcrumbs(portal) {
  const { pathname } = useLocation();
  return useMemo(() => {
    const root = { label: portal.label, to: portal.homePath || portal.basePath };
    const extra = EXTRA_ROUTE_LABELS[pathname];
    if (extra) return { items: [root, { label: extra.group }, { label: extra.label }], title: extra.label };

    const hit = findNavTrail(portal.navigation, pathname);
    if (hit) {
      if (!hit.item) {
        // A top-level link (e.g. Customers) can also opt in to detail crumbs: /new, /:id and /:id/edit get a trailing crumb.
        if (hit.group.detailCrumbs && pathname !== hit.to) {
          const tail = pathname.slice(hit.to.length).split("/").filter(Boolean);
          const label = tail[0] === "new" ? "New" : tail[1] === "edit" ? "Edit" : "Details";
          const noun = hit.group.label.toLowerCase().replace(/s$/, "");
          const title = tail[0] === "new" ? `New ${noun}` : tail[1] === "edit" ? `Edit ${noun}` : `${hit.group.label.replace(/s$/, "")} details`;
          return { items: [root, { label: hit.group.label, to: hit.to }, { label }], title };
        }
        return { items: [root, { label: hit.group.label }], title: hit.group.label };
      }
      // Items that opt in (detailCrumbs) get a trailing crumb for /new, /:id and /:id/edit sub-pages, and the list becomes a link.
      if (hit.item.detailCrumbs && pathname !== hit.to) {
        const tail = pathname.slice(hit.to.length).split("/").filter(Boolean);
        const label = tail[0] === "new" ? "New" : tail[1] === "edit" ? "Edit" : "Details";
        const title = tail[0] === "new" ? `New ${hit.item.label.toLowerCase().replace(/ list$/, "")}` : tail[1] === "edit" ? `Edit ${hit.item.label.toLowerCase().replace(/ list$/, "")}` : `${hit.item.label.replace(/ List$/, "")} details`;
        return { items: [root, { label: hit.group.label }, { label: hit.item.label, to: hit.to }, { label }], title };
      }
      return { items: [root, { label: hit.group.label }, { label: hit.item.label }], title: hit.item.label };
    }
    const last = pathname.split("/").filter(Boolean).pop();
    const label = prettify(last);
    return { items: [root, { label }], title: label };
  }, [pathname, portal]);
}
