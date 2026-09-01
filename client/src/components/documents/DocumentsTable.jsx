import { Link } from 'react-router-dom'
import Badge from '../ui/Badge.jsx'
import Icon from '../ui/Icon.jsx'
import { DOCUMENT_CATEGORIE, enumMeta } from '../../lib/enums.js'
import { formatDate, formatTaille } from '../../lib/format.js'
import { familleFichier } from '../../lib/documents.js'

// Liste des documents. Le telechargement est affiche mais inactif : `fichier_path`
// est un chemin de stockage, pas une URL — le lien signe viendra de
// GET /api/documents/:id/url, que le back ne rend pas encore. Le client ne
// fabrique jamais l'URL lui-meme.

const th = 'px-4 py-2.5 text-left text-xs font-medium tracking-wide text-slate-500 uppercase'
const td = 'px-4 py-3 text-sm text-slate-600'

const icones = { pdf: 'documents', image: 'image', autre: 'documents' }

function DocumentsTable({ documents }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[44rem] border-collapse">
        <thead>
          <tr className="border-b border-slate-200">
            <th scope="col" className={th}>
              Fichier
            </th>
            <th scope="col" className={th}>
              Categorie
            </th>
            <th scope="col" className={th}>
              Mission liee
            </th>
            <th scope="col" className={`${th} text-right`}>
              Taille
            </th>
            <th scope="col" className={`${th} text-right`}>
              Ajoute le
            </th>
            <th scope="col" className="w-10" />
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {documents.map((document) => {
            const categorie = enumMeta(DOCUMENT_CATEGORIE, document.categorie)

            return (
              <tr key={document.id} className="transition-colors hover:bg-slate-50">
                <td className={`${td} font-medium text-slate-900`}>
                  <span className="flex items-center gap-2.5">
                    <span className="rounded-lg bg-slate-100 p-1.5 text-slate-500">
                      <Icon
                        name={icones[familleFichier(document.mimeType)]}
                        className="size-4"
                      />
                    </span>
                    <span className="truncate">{document.nomOriginal}</span>
                  </span>
                </td>

                <td className={td}>
                  <Badge tone={categorie.tone}>{categorie.label}</Badge>
                </td>

                <td className={td}>
                  {/* mission_id est nullable : un devis ou un plan peut vivre seul. */}
                  {document.mission ? (
                    <Link
                      to={`/missions/${document.mission.id}`}
                      className="transition-colors hover:text-brand-700"
                    >
                      {document.mission.clientProduction}
                    </Link>
                  ) : (
                    <span className="text-slate-400">Non rattache</span>
                  )}
                </td>

                <td className={`${td} text-right tabular-nums`}>
                  {formatTaille(document.taille)}
                </td>

                <td className={`${td} text-right whitespace-nowrap tabular-nums`}>
                  {formatDate(document.uploadedAt)}
                </td>

                <td className={`${td} text-right`}>
                  <button
                    type="button"
                    disabled
                    title="Telechargement a venir : le lien signe vient du serveur"
                    className="rounded p-1 text-slate-300 disabled:pointer-events-none"
                  >
                    <Icon name="download" className="size-4" />
                    <span className="sr-only">Telecharger {document.nomOriginal}</span>
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default DocumentsTable
