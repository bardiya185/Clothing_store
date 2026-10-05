import AdminApp from "./AdminApp";

export const dynamic = "force-dynamic";

/**
 * The page itself must remain reachable so the client can refresh an expired
 * session and show a Persian permission state. Authorization is enforced by
 * the Laravel admin endpoints and by AdminApp's authenticated query.
 */
export default function AdminPage() {
  return <AdminApp />;
}
