import { useMemo, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import { MISSION_STATUT, MISSION_TYPE } from '../../lib/enums.js'
import { MISSION_VIDE, validerMission } from '../../lib/missionForm.js'
import { formatHeures, num } from '../../lib/format.js'

const optionsType = Object.entries(MISSION_TYPE).map(([value, meta]) => ({
  value,
  label: meta.label,
}))

const optionsStatut = Object.entries(MISSION_STATUT).map(([value, meta]) => ({
  value,
  label: meta.label,
}))

// Creation d'une mission. Le formulaire se remplit et se valide entierement,
// mais POST /api/missions n'est pas ecrit : le bouton de creation reste
// desactive plutot que de faire disparaitre la saisie dans le vide.
//
// Quand l'endpoint arrivera, ce composant n'a qu'a appeler `versPayload(formulaire)`
// — le reste (validation, etat, remise a zero) est deja la.
function MissionFormModal({ ouvert, onClose, heuresJourDefaut }) {
  const [formulaire, setFormulaire] = useState(MISSION_VIDE)
  const { erreurs, valide } = useMemo(() => validerMission(formulaire), [formulaire])

  const setChamp = (cle) => (valeur) => setFormulaire((etat) => ({ ...etat, [cle]: valeur }))

  const fermer = () => {
    setFormulaire(MISSION_VIDE)
    onClose()
  }

  // Meme regle que partout : heures vides = nb_jours x heures/jour par defaut.
  const heuresDeduites =
    formulaire.heures.trim() === '' && num(formulaire.nbJours) > 0
      ? num(formulaire.nbJours) * num(heuresJourDefaut)
      : null

  return (
    <Modal
      ouvert={ouvert}
      onClose={fermer}
      titre="Nouvelle mission"
      description="Le client, le type et la date de debut suffisent — le reste peut venir plus tard."
      footer={
        <>
          <Button variant="secondary" onClick={fermer}>
            Annuler
          </Button>
          <Button
            disabled={!valide}
            title={
              valide
                ? "Creation a venir : POST /api/missions n'est pas encore en ligne"
                : 'Corrige les champs en rouge'
            }
          >
            Creer la mission
          </Button>
        </>
      }
    >
      {/* Pas de <form onSubmit> tant qu'il n'y a rien a envoyer : la soumission
          au clavier ne doit pas donner l'illusion d'un enregistrement. */}
      <div className="grid gap-4">
        <Input
          label="Client / production"
          value={formulaire.clientProduction}
          onChange={setChamp('clientProduction')}
          erreur={erreurs.clientProduction}
          placeholder="France Televisions"
          // Il n'y a pas de table client : c'est un texte libre, et c'est lui qui
          // sert de cle de regroupement dans les vues.
          hint="Texte libre — il sert de titre a la mission dans les listes."
          data-autofocus
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Type"
            value={formulaire.type}
            onChange={setChamp('type')}
            options={optionsType}
          />
          <Select
            label="Statut"
            value={formulaire.statut}
            onChange={setChamp('statut')}
            options={optionsStatut}
          />
        </div>

        {/* Seules les missions d'intermittence confirmees ou terminees comptent
            dans le seuil : le dire au moment de la saisie evite la surprise. */}
        {formulaire.type === 'INTERMITTENCE' && formulaire.statut === 'PROPOSED' && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Une mission proposee ne compte pas encore dans le seuil d'heures.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Debut"
            type="date"
            value={formulaire.dateDebut}
            onChange={setChamp('dateDebut')}
            erreur={erreurs.dateDebut}
          />
          <Input
            label="Fin"
            type="date"
            value={formulaire.dateFin}
            onChange={setChamp('dateFin')}
            erreur={erreurs.dateFin}
            hint="Vide : mission en cours."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Jours"
            type="number"
            inputMode="decimal"
            min={0}
            step={0.5}
            suffixe="j"
            value={formulaire.nbJours}
            onChange={setChamp('nbJours')}
            erreur={erreurs.nbJours}
          />
          <Input
            label="Heures"
            type="number"
            inputMode="decimal"
            min={0}
            step={0.5}
            suffixe="h"
            value={formulaire.heures}
            onChange={setChamp('heures')}
            erreur={erreurs.heures}
            hint={
              heuresDeduites
                ? `Vide : ${formatHeures(heuresDeduites)} h deduites`
                : 'Facultatif.'
            }
          />
          <Input
            label="Montant HT"
            type="number"
            inputMode="decimal"
            min={0}
            step={100}
            suffixe="€"
            value={formulaire.montantHt}
            onChange={setChamp('montantHt')}
            erreur={erreurs.montantHt}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-1">
          <label
            htmlFor="mission-note"
            className="text-xs font-medium tracking-wide text-slate-500 uppercase"
          >
            Note
          </label>
          <textarea
            id="mission-note"
            rows={3}
            value={formulaire.note}
            onChange={(event) => setChamp('note')(event.target.value)}
            placeholder="Rappel, contact, condition particuliere…"
            className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <p className="border-t border-slate-100 pt-3 text-xs text-amber-700">
          Creation indisponible : POST /api/missions n'est pas encore en ligne.
        </p>
      </div>
    </Modal>
  )
}

export default MissionFormModal
