import { ROLE_LABELS, type Role } from "@/lib/permissions/policy";

/**
 * Makes the active persistence and identity mode explicit in the UI.
 *
 * Shown as a warning while the insecure prototype session is active, and as a neutral
 * note once the role comes from verified Firebase Auth custom claims.
 */
export function PersistenceNotice({
  role,
  isPrototype,
}: {
  role: Role | null;
  isPrototype: boolean;
}) {
  const roleLabel = role ? ROLE_LABELS[role] : "Anonim (tidak ada role)";

  const tone = isPrototype
    ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
    : "border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-200";

  return (
    <div role="note" className={`rounded-lg border px-4 py-3 text-sm ${tone}`}>
      <p className="font-medium">
        {isPrototype
          ? "Mode prototipe lokal — sesi belum diverifikasi Firebase"
          : "Data Firestore dengan sesi Firebase terverifikasi"}
      </p>
      <ul className="mt-1 list-inside list-disc space-y-0.5 opacity-90">
        <li>
          Produk dan varian disimpan di Firestore (koleksi{" "}
          <code className="font-mono">products</code>), bukan berkas JSON lokal.
        </li>
        <li>
          Role aktif: <strong>{roleLabel}</strong>
          {isPrototype
            ? " dari sesi prototipe, bukan dari custom claims Firebase Auth."
            : " dari custom claims Firebase Auth."}
        </li>
        {isPrototype && (
          <li>
            Sesi prototipe hanya untuk pengembangan lokal; jangan dipakai di produksi.
          </li>
        )}
      </ul>
    </div>
  );
}
