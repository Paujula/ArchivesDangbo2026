export async function downloadDocument(
  docId: string,
  fileName: string,
  options?: { onDemandeNeeded?: () => void; onDemandeSent?: () => void; onError?: (msg: string) => void }
) {
  const token = localStorage.getItem("archive_token");
  try {
    const r = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || ""}/api/archives/${docId}/download`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    if (!r.ok) throw new Error();
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    options?.onError?.("Impossible de télécharger le fichier.");
  }
}
