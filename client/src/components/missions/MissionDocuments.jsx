import Badge from '../ui/Badge.jsx'
import Icon from '../ui/Icon.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import { DOCUMENT_CATEGORIE, enumMeta } from '../../lib/enums.js'
import { formatDate, formatTaille } from '../../lib/format.js'

// Documents rattaches a une mission (document.mission_id, nullable dans le schema).
// Pas de lien de telechargement : `fichier_path` est un chemin de stockage, le
// back rendra un lien signe (GET /api/documents/:id/url), le client ne fabrique
// jamais l'URL lui-meme.
function MissionDocuments({ documents }) {
  if (documents.length === 0) {
    return (
      <EmptyState
        icon="documents"
        title="Aucun document"
        description="Contrat, AEM ou facture rattaches a cette mission apparaitront ici."
      />
    )
  }

  return (
    <ul className="divide-y divide-slate-100">
      {documents.map((document) => {
        const categorie = enumMeta(DOCUMENT_CATEGORIE, document.categorie)

        return (
          <li key={document.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <span className="shrink-0 rounded-lg bg-slate-100 p-1.5 text-slate-500">
              <Icon name="documents" className="size-4" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{document.nomOriginal}</p>
              <p className="text-xs text-slate-500 tabular-nums">
                {formatTaille(document.taille)} · ajoute le {formatDate(document.uploadedAt)}
              </p>
            </div>

            <Badge tone={categorie.tone} className="shrink-0">
              {categorie.label}
            </Badge>
          </li>
        )
      })}
    </ul>
  )
}

export default MissionDocuments
