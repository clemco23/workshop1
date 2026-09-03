import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../ui/Badge.jsx'
import Icon from '../ui/Icon.jsx'
import ConfirmDialog from '../ui/ConfirmDialog.jsx'
import { deleteDocument, documentUrl } from '../../api/documents.js'
import { DOCUMENT_CATEGORIE, enumMeta } from '../../lib/enums.js'
import { formatDate, formatTaille } from '../../lib/format.js'
import { familleFichier } from '../../lib/documents.js'
import { messageErreur } from '../../lib/erreurs.js'

// Liste des documents.
//
// Le telechargement demande un lien a GET /api/documents/:id/url a chaque clic :
// le coffre est prive, `fichierPath` est un chemin de stockage et pas une
// adresse, et le lien signe ne vaut qu'une heure. Le garder en memoire ferait
// donc presenter tot ou tard un lien perime, mieux vaut le redemander.

const th = 'px-4 py-2.5 text-left text-xs font-medium tracking-wide text-slate-500 uppercase'
const td = 'px-4 py-3 text-sm text-slate-600'

const icones = { pdf: 'documents', image: 'image', autre: 'documents' }

function DocumentsTable({ documents, onSupprime }) {
  const [aSupprimer, setASupprimer] = useState(null)
  // Un seul telechargement en vol a la fois : c'est l'id du document dont on
  // attend le lien.
  const [enCours, setEnCours] = useState(null)
  const [erreur, setErreur] = useState(null)
  const [apercu, setApercu] = useState(null)
  const urlsApercu = useRef(new Map())
  const documentSurvole = useRef(null)

  async function afficherApercu(document, event) {
    const famille = familleFichier(document.mimeType)
    if (famille !== 'pdf' && famille !== 'image') return

    documentSurvole.current = document.id
    const x = Math.min(event.clientX + 18, window.innerWidth - 340)
    const y = Math.min(event.clientY + 18, window.innerHeight - 430)
    const urlEnCache = urlsApercu.current.get(document.id)

    setApercu({ document, famille, url: urlEnCache ?? null, x, y })
    if (urlEnCache) return

    try {
      const url = await documentUrl(document.id)
      urlsApercu.current.set(document.id, url)
      if (documentSurvole.current === document.id) {
        setApercu({ document, famille, url, x, y })
      }
    } catch {
      // La previsualisation est un confort : le telechargement reste disponible
      // si le lien signe ne peut pas etre obtenu au survol.
      if (documentSurvole.current === document.id) setApercu(null)
    }
  }

  function cacherApercu() {
    documentSurvole.current = null
    setApercu(null)
  }

  async function telecharger(document) {
    if (enCours) return

    setEnCours(document.id)
    setErreur(null)

    try {
      const url = await documentUrl(document.id)
      // Nouvel onglet : le lien signe pointe sur le stockage, pas sur l'app, // naviguer dessus ferait quitter la page. `noopener` par principe, l'URL
      // portant un jeton de signature.
      window.open(url, '_blank', 'noopener')
    } catch (error) {
      setErreur(messageErreur(error, { 404: 'Ce fichier n’est plus disponible.' }))
    } finally {
      setEnCours(null)
    }
  }

  return (
    <div>
      {erreur && (
        <p
          role="alert"
          className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700"
        >
          {erreur}
        </p>
      )}

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
              <th scope="col" className="w-20" />
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {documents.map((document) => {
              const categorie = enumMeta(DOCUMENT_CATEGORIE, document.categorie)

              return (
                <tr
                  key={document.id}
                  className="transition-colors hover:bg-slate-50"
                  onMouseEnter={(event) => afficherApercu(document, event)}
                  onMouseLeave={cacherApercu}
                >
                  <td className={`${td} font-medium text-slate-900`}>
                    <span className="flex items-center gap-2.5">
                      <span className="rounded-lg bg-slate-100 p-1.5 text-slate-500">
                        <Icon
                          name={icones[familleFichier(document.mimeType)]}
                          className="size-4"
                        />
                      </span>
                      <span className="truncate" title="Survole la ligne pour previsualiser">
                        {document.nomOriginal}
                      </span>
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

                  <td className={`${td} text-right whitespace-nowrap`}>
                    <button
                      type="button"
                      onClick={() => telecharger(document)}
                      disabled={enCours != null}
                      title="Telecharger"
                      className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none disabled:opacity-40"
                    >
                      <Icon name="download" className="size-4" />
                      <span className="sr-only">
                        Telecharger {document.nomOriginal}
                        {enCours === document.id ? ' (en cours)' : ''}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setASupprimer(document)}
                      title="Supprimer"
                      className="rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Icon name="corbeille" className="size-4" />
                      <span className="sr-only">Supprimer {document.nomOriginal}</span>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {apercu && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-50 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
          style={{ left: apercu.x, top: apercu.y }}
        >
          <div className="border-b border-slate-100 px-3 py-2 text-xs font-medium text-slate-700">
            {apercu.document.nomOriginal}
          </div>
          {apercu.url ? (
            apercu.famille === 'image' ? (
              <img
                src={apercu.url}
                alt=""
                className="max-h-80 w-full object-contain"
              />
            ) : (
              <iframe
                title={`Apercu de ${apercu.document.nomOriginal}`}
                src={`${apercu.url}#page=1&view=FitH`}
                className="h-96 w-full bg-white"
              />
            )
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-slate-500">
              Chargement de l'apercu…
            </div>
          )}
        </div>
      )}

      {/* Une seule boite pour toute la table : `aSupprimer` porte la ligne visee.
          La suppression retire aussi le fichier du stockage cote serveur. */}
      <ConfirmDialog
        ouvert={aSupprimer != null}
        onClose={() => setASupprimer(null)}
        onConfirmer={async () => {
          await deleteDocument(aSupprimer.id)
          onSupprime?.(aSupprimer)
        }}
        titre="Supprimer ce document ?"
        description={`« ${aSupprimer?.nomOriginal} » sera retire de ton coffre, fichier compris.`}
      />
    </div>
  )
}

export default DocumentsTable
