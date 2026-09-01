import { useMemo, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Input from '../ui/Input.jsx'
import { PORTFOLIO_VIDE, slugifier, validerPortfolio } from '../../lib/portfolioForm.js'

// Creation d'une page publique. Meme regle que les autres formulaires : la
// saisie et la validation marchent, POST /api/portfolios n'existe pas, donc le
// bouton reste desactive. Le jour venu : `versPayload(formulaire)`.
//
// La selection des projets ne se fait pas ici mais sur la fiche de la page
// (table de jonction, avec l'ordre) : une page se cree vide.
function PortfolioFormModal({ ouvert, onClose, slugsExistants = [] }) {
  const [formulaire, setFormulaire] = useState(PORTFOLIO_VIDE)
  // Le slug suit le titre tant que l'utilisateur ne l'a pas ecrit lui-meme :
  // apres une saisie manuelle, on arrete de l'ecraser.
  const [slugManuel, setSlugManuel] = useState(false)

  const { erreurs, valide } = useMemo(
    () => validerPortfolio(formulaire, slugsExistants),
    [formulaire, slugsExistants],
  )

  const fermer = () => {
    setFormulaire(PORTFOLIO_VIDE)
    setSlugManuel(false)
    onClose()
  }

  const setTitre = (valeur) =>
    setFormulaire((etat) => ({
      ...etat,
      titrePage: valeur,
      slug: slugManuel ? etat.slug : slugifier(valeur),
    }))

  const setSlug = (valeur) => {
    setSlugManuel(true)
    setFormulaire((etat) => ({ ...etat, slug: slugifier(valeur) }))
  }

  return (
    <Modal
      ouvert={ouvert}
      onClose={fermer}
      titre="Nouvelle page publique"
      description="Une adresse partageable, que tu remplis ensuite avec tes fiches projet."
      footer={
        <>
          <Button variant="secondary" onClick={fermer}>
            Annuler
          </Button>
          {/* Toujours desactive : l'endpoint n'existe pas. Un bouton actif qui ne
              fait rien serait pire qu'un bouton grise. */}
          <Button
            disabled
            title={
              valide
                ? "Creation a venir : POST /api/portfolios n'est pas encore en ligne"
                : 'Corrige les champs en rouge'
            }
          >
            Creer la page
          </Button>
        </>
      }
    >
      {/* Pas de <form onSubmit> tant qu'il n'y a rien a envoyer. */}
      <div className="grid gap-4">
        <Input
          label="Titre de la page"
          value={formulaire.titrePage}
          onChange={setTitre}
          erreur={erreurs.titrePage}
          placeholder="Theo Marchand — chef operateur"
          hint="Facultatif : vide, c'est l'adresse qui sert de titre."
          data-autofocus
        />

        <Input
          label="Adresse publique"
          value={formulaire.slug}
          onChange={setSlug}
          erreur={erreurs.slug}
          placeholder="theo-marchand"
          hint={
            formulaire.slug && !erreurs.slug
              ? `La page sera a l'adresse /portfolio/${formulaire.slug}`
              : 'Minuscules, chiffres et tirets — unique sur tout le site.'
          }
        />

        <label className="flex items-start gap-2.5">
          <input
            type="checkbox"
            checked={formulaire.actif}
            onChange={(event) =>
              setFormulaire((etat) => ({ ...etat, actif: event.target.checked }))
            }
            className="mt-0.5 size-4 shrink-0 rounded border-slate-300 text-brand-600"
          />
          <span className="min-w-0">
            <span className="block text-sm font-medium text-slate-900">Mettre en ligne</span>
            {/* `actif: false` ne cache pas la page : elle repond 404. */}
            <span className="block text-xs text-slate-500">
              {formulaire.actif
                ? 'Toute personne ayant le lien pourra la consulter, sans compte.'
                : 'Hors ligne : le lien public renverra une page introuvable.'}
            </span>
          </span>
        </label>

        <p className="border-t border-slate-100 pt-3 text-xs text-amber-700">
          Creation indisponible : POST /api/portfolios n'est pas encore en ligne.
        </p>
      </div>
    </Modal>
  )
}

export default PortfolioFormModal
