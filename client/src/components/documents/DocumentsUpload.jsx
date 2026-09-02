import Card from '../ui/Card.jsx'
import Button from '../ui/Button.jsx'
import Icon from '../ui/Icon.jsx'

// Zone de depot, volontairement inactive : POST /api/documents (multipart) n'est
// pas ecrit cote serveur et le stockage est un bucket Supabase, pas le client.
// La forme est posee pour que le branchement soit une `action` de route a
// ajouter ici, pas une page a redessiner.
function DocumentsUpload() {
  return (
    <Card
      title="Ajouter un document"
      subtitle="Contrat, attestation employeur, devis ou facture"
    >
      <div
        aria-disabled="true"
        className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-8 text-center"
      >
        <span className="rounded-xl bg-white p-2.5 text-slate-400 ring-1 ring-slate-200">
          <Icon name="upload" className="size-6" />
        </span>
        <p className="mt-3 text-sm font-medium text-slate-900">
          Depose un fichier ici, ou parcours tes dossiers
        </p>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          PDF et images. Le fichier sera range dans ton espace de stockage prive et
          pourra etre rattache a une mission.
        </p>

        <div className="mt-4 flex items-center gap-2">
          <Button disabled title="Upload a venir : l'endpoint serveur reste a ecrire">
            <Icon name="upload" className="size-4" />
            Choisir un fichier
          </Button>
        </div>

        <p className="mt-3 text-xs text-amber-700">
          Upload indisponible pour l'instant — l'API de depot n'est pas encore en ligne.
        </p>
      </div>
    </Card>
  )
}

export default DocumentsUpload
