import { isRouteErrorResponse, useLoaderData, useRouteError } from 'react-router-dom'
import Badge from '../components/ui/Badge.jsx'
import Icon from '../components/ui/Icon.jsx'
import { fetchPortfolioPublic } from '../api/portfolios.js'
import { PROJET_TAG, enumMeta } from '../lib/enums.js'
import { formatDateLongue } from '../lib/format.js'
import { mediaMeta, mediasProjet } from '../lib/medias.js'

// SEULE ROUTE PUBLIQUE du site : elle est montee hors d'AppLayout et devra rester
// hors du futur ProtectedRoute. Elle ne charge pas le client Supabase et n'attend
// aucune session — un visiteur sans compte doit pouvoir l'ouvrir.
//
// Ce que la page affiche est exactement ce que rend GET /api/public/portfolio/:slug,
// dont la projection est explicite cote api/portfolios.js : ni id, ni mission, ni
// email, ni montant. Ne jamais afficher ici un champ qui n'est pas dans ce contrat.
// Un portfolio `actif: false` repond 404 (notFound), pas une page vide.
export async function loader({ params }) {
  return { portfolio: await fetchPortfolioPublic(params.slug) }
}

// Slug inconnu ou page desactivee (`actif: false`) : le loader jette une Response
// 404. Sans ce garde-fou, react-router afficherait son ecran de dev — a un visiteur
// qui n'a pas de compte et n'a rien a faire de la pile d'erreur.
export function ErrorBoundary() {
  const erreur = useRouteError()
  const introuvable = isRouteErrorResponse(erreur) && erreur.status === 404

  return (
    <div className="flex min-h-dvh items-center justify-center bg-white px-6">
      <div className="max-w-md text-center">
        <p className="text-xs font-medium tracking-widest text-slate-400 uppercase">
          {introuvable ? '404' : 'Erreur'}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          {introuvable ? "Cette page n'existe pas" : 'Cette page est indisponible'}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {introuvable
            ? "Le lien est peut-etre incorrect, ou la page n'est plus publiee."
            : 'Reessaie dans un moment.'}
        </p>
      </div>
    </div>
  )
}

function PortfolioPublic() {
  const { portfolio } = useLoaderData()
  const { titrePage, slug, auteur, projets } = portfolio

  return (
    <div className="min-h-dvh bg-white">
      <header className="border-b border-slate-200 px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-medium tracking-widest text-brand-700 uppercase">
            Portfolio
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight break-words text-slate-900 sm:text-4xl">
            {/* titre_page est nullable : le slug sert alors de titre. */}
            {titrePage ?? slug}
          </h1>
          <p className="mt-2 text-sm text-slate-500">{auteur}</p>
        </div>
      </header>

      <main className="px-6 py-10 sm:py-14">
        <div className="mx-auto max-w-3xl">
          {projets.length === 0 ? (
            <p className="text-sm text-slate-500">
              Cette page n'a pas encore de projet selectionne.
            </p>
          ) : (
            <ol className="grid gap-10 sm:gap-14">
              {projets.map((projet, index) => {
                const tag = enumMeta(PROJET_TAG, projet.tag)
                const medias = mediasProjet(projet)

                return (
                  // La projection publique ne renvoie pas d'id : la cle est
                  // l'index, la liste etant ordonnee et jamais reordonnee ici.
                  <li key={index} className="min-w-0">
                    <article>
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h2 className="text-xl font-semibold tracking-tight break-words text-slate-900">
                          {projet.titre}
                        </h2>
                        <Badge tone={tag.tone}>{tag.label}</Badge>
                      </div>

                      <p className="mt-1 text-xs text-slate-500 tabular-nums">
                        {formatDateLongue(projet.date)}
                      </p>

                      {projet.description && (
                        <p className="mt-3 text-sm leading-relaxed break-words text-slate-600">
                          {projet.description}
                        </p>
                      )}

                      {medias.length > 0 && (
                        <ul className="mt-4 flex flex-wrap gap-2">
                          {medias.map((media) => {
                            const meta = mediaMeta(media.type)
                            if (!media.url) return null

                            return (
                              <li key={media.id} className="min-w-0">
                                <a
                                  href={media.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                                >
                                  <Icon name={meta.icon} className="size-4 shrink-0" />
                                  <span className="truncate">{media.titre}</span>
                                </a>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </article>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </main>

      <footer className="border-t border-slate-200 px-6 py-8">
        <div className="mx-auto max-w-3xl text-xs text-slate-400">
          {auteur} — /portfolio/{slug}
        </div>
      </footer>
    </div>
  )
}

export default PortfolioPublic
