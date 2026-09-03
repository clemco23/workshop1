import { useMemo, useState } from 'react'
import { Link, useLoaderData, useNavigate, useRevalidator } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader.jsx'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Badge from '../components/ui/Badge.jsx'
import Icon from '../components/ui/Icon.jsx'
import Input from '../components/ui/Input.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import PortfolioSelection from '../components/portfolios/PortfolioSelection.jsx'
import {
  deletePortfolio,
  fetchPortfolio,
  updatePortfolio,
  updatePortfolioProjets,
} from '../api/portfolios.js'
import { PROJET_TAG, enumMeta } from '../lib/enums.js'
import { formatDate } from '../lib/format.js'
import { messageErreur } from '../lib/erreurs.js'

// Portfolio inconnu -> l'API repond 404 et le loader rejette : `RouteError` rend
// l'ecran adequat (cf. router.jsx).
export async function loader({ params }) {
  return { portfolio: await fetchPortfolio(params.id) }
}

function PortfolioAdminDetail() {
  const { portfolio } = useLoaderData()
  const revalidator = useRevalidator()
  const navigate = useNavigate()

  // Toutes les fiches de l'utilisateur, indexees : la selection est manipulee
  // comme une liste d'identifiants, et c'est ici qu'on retrouve les objets.
  const parId = useMemo(() => {
    const toutes = [...portfolio.projets, ...portfolio.projetsDisponibles]
    return new Map(toutes.map((projet) => [projet.id, projet]))
  }, [portfolio])

  const idsInitiaux = useMemo(() => portfolio.projets.map((p) => p.id), [portfolio])

  // La selection reste locale tant qu'elle n'est pas enregistree : monter,
  // descendre, ajouter et retirer se composent, et un seul PUT part a la fin.
  // `PUT /:id/projects` remplace la selection entiere, l'ordre valant la
  // position dans le tableau, c'est ce qui rend l'operation idempotente, et ce
  // qui rendrait faux un appel par fleche.
  const [ids, setIds] = useState(idsInitiaux)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState(null)

  // Re-partir de la reponse du serveur quand la route est revalidee (apres un
  // enregistrement, ou en revenant sur la page). Ajustement pendant le rendu
  // plutot qu'un effet, qui declencherait un rendu en cascade.
  const [refInitiaux, setRefInitiaux] = useState(idsInitiaux)
  if (refInitiaux !== idsInitiaux) {
    setRefInitiaux(idsInitiaux)
    setIds(idsInitiaux)
  }

  const selection = ids.map((id) => parId.get(id)).filter(Boolean)
  const disponibles = [...parId.values()].filter((projet) => !ids.includes(projet.id))

  const modifie =
    ids.length !== idsInitiaux.length || ids.some((id, index) => id !== idsInitiaux[index])

  const [titre, setTitre] = useState(portfolio.titrePage ?? '')
  const [envoiTitre, setEnvoiTitre] = useState(false)
  const [erreurReglages, setErreurReglages] = useState(null)
  const titreModifie = titre.trim() !== (portfolio.titrePage ?? '')

  const [envoiVisibilite, setEnvoiVisibilite] = useState(false)
  const [suppression, setSuppression] = useState(false)

  function deplacer(depuis, vers) {
    setErreur(null)
    setIds((etat) => {
      const suite = [...etat]
      const [deplace] = suite.splice(depuis, 1)
      suite.splice(vers, 0, deplace)
      return suite
    })
  }

  const ajouter = (id) => {
    setErreur(null)
    setIds((etat) => [...etat, id])
  }

  const retirer = (id) => {
    setErreur(null)
    setIds((etat) => etat.filter((autre) => autre !== id))
  }

  async function enregistrerSelection() {
    if (!modifie || envoi) return

    setEnvoi(true)
    setErreur(null)

    try {
      await updatePortfolioProjets(portfolio.id, ids)
      // On revalide plutot que de recopier la reponse : `ordre` et
      // `projetsDisponibles` restent ce que le serveur dit.
      revalidator.revalidate()
    } catch (error) {
      setErreur(messageErreur(error))
    } finally {
      setEnvoi(false)
    }
  }

  // PATCH n'accepte que `titrePage` et `actif` : le slug est fige a la creation.
  async function enregistrerTitre() {
    if (!titreModifie || envoiTitre || titre.trim() === '') return

    setEnvoiTitre(true)
    setErreurReglages(null)

    try {
      await updatePortfolio(portfolio.id, { titrePage: titre.trim() })
      revalidator.revalidate()
    } catch (error) {
      setErreurReglages(messageErreur(error))
    } finally {
      setEnvoiTitre(false)
    }
  }

  async function basculerVisibilite() {
    if (envoiVisibilite) return

    setEnvoiVisibilite(true)
    setErreurReglages(null)

    try {
      await updatePortfolio(portfolio.id, { actif: !portfolio.actif })
      revalidator.revalidate()
    } catch (error) {
      setErreurReglages(messageErreur(error))
    } finally {
      setEnvoiVisibilite(false)
    }
  }

  return (
    <>
      <PageHeader
        title={portfolio.titrePage ?? portfolio.slug}
        subtitle={`/portfolio/${portfolio.slug} · ${portfolio.projets.length} projet(s) publie(s)`}
      >
        <Button as={Link} to="/portfolios" variant="secondary">
          <Icon name="arrowLeft" className="size-4" />
          Portfolios
        </Button>
        {/* Hors ligne, l'adresse publique repond 404 : proposer le lien serait
            envoyer l'utilisateur sur une page introuvable. */}
        {portfolio.actif ? (
          <Button as={Link} to={`/portfolio/${portfolio.slug}`} target="_blank" rel="noreferrer">
            <Icon name="lien" className="size-4" />
            Voir la page
          </Button>
        ) : (
          <Button disabled title="Page hors ligne : l'adresse publique renvoie un 404">
            <Icon name="lien" className="size-4" />
            Voir la page
          </Button>
        )}
        <Button variant="secondary" onClick={() => setSuppression(true)}>
          <Icon name="corbeille" className="size-4" />
          Supprimer
        </Button>
      </PageHeader>

      <ConfirmDialog
        ouvert={suppression}
        onClose={() => setSuppression(false)}
        onConfirmer={async () => {
          await deletePortfolio(portfolio.id)
          navigate('/portfolios', { replace: true })
        }}
        titre="Supprimer cette page ?"
        description={`« ${portfolio.titrePage ?? portfolio.slug} » sera retiree et l'adresse /portfolio/${portfolio.slug} cessera de repondre. Tes fiches projet sont conservees.`}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <Badge tone={portfolio.actif ? 'success' : 'neutral'}>
          {portfolio.actif ? 'En ligne' : 'Hors ligne'}
        </Badge>
        <span className="min-w-0 truncate text-sm text-slate-600">
          Creee le {formatDate(portfolio.createdAt)}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid min-w-0 content-start gap-4 lg:col-span-2">
          <Card
            title="Projets publies"
            subtitle="L'ordre de cette liste est celui de la page publique"
            action={
              <Button
                size="sm"
                onClick={enregistrerSelection}
                disabled={!modifie || envoi}
                title={!modifie ? 'Aucune modification a enregistrer' : undefined}
              >
                {envoi ? 'Enregistrement…' : 'Enregistrer la selection'}
              </Button>
            }
          >
            <PortfolioSelection
              projets={selection}
              onMonter={(index) => deplacer(index, index - 1)}
              onDescendre={(index) => deplacer(index, index + 1)}
              onRetirer={retirer}
            />

            {erreur && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {erreur}
              </p>
            )}

            {/* Rien ne part avant l'enregistrement : le dire, sinon quitter la
                page perdrait la selection sans prevenir. */}
            {modifie && !erreur && (
              <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-amber-700">
                Selection modifiee : elle ne sera visible sur la page publique qu'apres
                enregistrement.
              </p>
            )}
          </Card>

          <Card
            title="Projets disponibles"
            subtitle="Fiches qui ne figurent pas encore sur cette page"
          >
            {disponibles.length === 0 ? (
              <EmptyState
                icon="projets"
                title="Toutes tes fiches sont deja publiees"
                description="Cree une nouvelle fiche projet pour l'ajouter a cette page."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {disponibles.map((projet) => {
                  const tag = enumMeta(PROJET_TAG, projet.tag)

                  return (
                    <li
                      key={projet.id}
                      className="flex min-w-0 items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/projets/${projet.id}`}
                          className="block truncate text-sm font-medium text-slate-900 transition-colors hover:text-brand-700"
                        >
                          {projet.titre}
                        </Link>
                        <p className="truncate text-xs text-slate-500">{formatDate(projet.date)}</p>
                      </div>

                      <Badge tone={tag.tone} className="shrink-0">
                        {tag.label}
                      </Badge>

                      {/* Ajout local : la fiche passe en fin de selection et part
                          au prochain enregistrement, comme les fleches. */}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => ajouter(projet.id)}
                        className="shrink-0"
                      >
                        <Icon name="plus" className="size-3.5" />
                        Ajouter
                      </Button>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="grid min-w-0 content-start gap-4">
          <Card title="Reglages de la page">
            <div className="grid gap-4">
              {/* Le slug est fige a la creation pour qu'un lien deja partage ne
                  casse pas : le serveur refuse de le modifier. */}
              <Input
                label="Adresse publique"
                value={portfolio.slug}
                onChange={() => {}}
                disabled
                hint="Figee a la creation : un lien deja partage ne doit pas casser."
              />
              <Input
                label="Titre de la page"
                value={titre}
                onChange={(valeur) => {
                  setErreurReglages(null)
                  setTitre(valeur)
                }}
                erreur={
                  titreModifie && titre.trim() === '' ? 'Le titre ne peut pas etre vide.' : null
                }
                placeholder={portfolio.slug}
                hint="Affiche en tete de la page publique."
              />
              <Button
                onClick={enregistrerTitre}
                disabled={!titreModifie || titre.trim() === '' || envoiTitre}
              >
                {envoiTitre ? 'Enregistrement…' : 'Enregistrer le titre'}
              </Button>
            </div>

            {erreurReglages && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {erreurReglages}
              </p>
            )}
          </Card>

          <Card title="Visibilite">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">
                  {portfolio.actif ? 'Page en ligne' : 'Page hors ligne'}
                </p>
                <p className="text-xs text-slate-500">
                  {portfolio.actif
                    ? 'Toute personne ayant le lien peut la consulter, sans compte.'
                    : 'Le lien public renvoie une page introuvable.'}
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={basculerVisibilite}
                disabled={envoiVisibilite}
                className="shrink-0"
              >
                {envoiVisibilite ? '…' : portfolio.actif ? 'Depublier' : 'Publier'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}

export default PortfolioAdminDetail
