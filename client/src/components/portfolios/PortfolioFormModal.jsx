import { useId, useMemo, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Input from '../ui/Input.jsx'
import { PORTFOLIO_VIDE, slugifier, validerPortfolio, versPayload } from '../../lib/portfolioForm.js'
import { createPortfolio } from '../../api/portfolios.js'
import { messageErreur } from '../../lib/erreurs.js'

// Creation d'une page publique. Elle nait vide : la selection des projets se
// fait ensuite sur sa fiche, via la table de jonction (qui porte l'ordre).
//
// Il n'y a pas de champ d'adresse. Le slug est fabrique par le serveur a partir
// du titre, avec un suffixe aleatoire, puis fige : le proposer a la saisie
// laisserait croire qu'il est choisi, et qu'il pourra changer.
//
// `onCree` recoit le portfolio renvoye par l'API — c'est la page qui decide
// d'aller sur sa fiche ou de revalider la liste.
function PortfolioFormModal({ ouvert, onClose, onCree }) {
  const idFormulaire = useId()
  const [formulaire, setFormulaire] = useState(PORTFOLIO_VIDE)
  const [envoi, setEnvoi] = useState(false)
  const [erreurApi, setErreurApi] = useState(null)

  const { erreurs, valide } = useMemo(() => validerPortfolio(formulaire), [formulaire])

  const fermer = () => {
    if (envoi) return
    setFormulaire(PORTFOLIO_VIDE)
    setErreurApi(null)
    onClose()
  }

  async function enregistrer(event) {
    event.preventDefault()
    if (!valide || envoi) return

    setEnvoi(true)
    setErreurApi(null)

    try {
      const portfolio = await createPortfolio(versPayload(formulaire))
      onCree?.(portfolio)
      setFormulaire(PORTFOLIO_VIDE)
      onClose()
    } catch (error) {
      setErreurApi(messageErreur(error))
    } finally {
      setEnvoi(false)
    }
  }

  const apercu = formulaire.titrePage.trim() === '' ? null : slugifier(formulaire.titrePage)

  return (
    <Modal
      ouvert={ouvert}
      onClose={fermer}
      titre="Nouvelle page publique"
      description="Une adresse partageable, que tu remplis ensuite avec tes fiches projet."
      footer={
        <>
          <Button variant="secondary" onClick={fermer} disabled={envoi}>
            Annuler
          </Button>
          <Button
            type="submit"
            form={idFormulaire}
            disabled={!valide || envoi}
            title={!valide ? 'Corrige les champs en rouge' : undefined}
          >
            {envoi ? 'Creation…' : 'Creer la page'}
          </Button>
        </>
      }
    >
      <form id={idFormulaire} onSubmit={enregistrer} noValidate className="grid gap-4">
        <Input
          label="Titre de la page"
          value={formulaire.titrePage}
          onChange={(valeur) => setFormulaire((etat) => ({ ...etat, titrePage: valeur }))}
          erreur={erreurs.titrePage}
          placeholder="Theo Marchand — chef operateur"
          hint={
            apercu
              ? `L'adresse ressemblera a /portfolio/${apercu}-xxxxxxxx`
              : "Le titre sert aussi a fabriquer l'adresse publique."
          }
          data-autofocus
        />

        {/* Apercu et non promesse : le serveur ajoute un suffixe aleatoire pour
            garantir l'unicite, l'adresse exacte n'est connue qu'apres coup. */}
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          L'adresse est composee par le serveur a partir du titre, puis figee : elle ne
          changera plus, meme si tu renommes la page.
        </p>

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

        {erreurApi && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {erreurApi}
          </p>
        )}
      </form>
    </Modal>
  )
}

export default PortfolioFormModal
