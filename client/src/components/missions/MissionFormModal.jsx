import { useMemo, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import { MISSION_STATUT, MISSION_TYPE } from '../../lib/enums.js'
import { MISSION_VIDE, estModifie, validerMission, versFormulaire } from '../../lib/missionForm.js'
import { formatHeures, num } from '../../lib/format.js'

const optionsType = Object.entries(MISSION_TYPE).map(([value, meta]) => ({
  value,
  label: meta.label,
}))

const optionsStatut = Object.entries(MISSION_STATUT).map(([value, meta]) => ({
  value,
  label: meta.label,
}))

// Creation *et* edition d'une mission : les champs, les regles et les messages
// sont les memes, seul l'intitule change. Passer `mission` bascule en edition.
//
// Le formulaire se remplit et se valide entierement, mais ni POST /api/missions
// ni PUT /api/missions/:id ne sont ecrits : le bouton reste desactive plutot que
// de faire disparaitre la saisie dans le vide. Le jour venu, il n'y a qu'a
// envoyer `versPayload(formulaire)` — validation, etat et remise a zero sont la.
function MissionFormModal({ ouvert, onClose, heuresJourDefaut, mission = null }) {
  const edition = mission != null
  const valeursInitiales = useMemo(
    () => (edition ? versFormulaire(mission) : MISSION_VIDE),
    [edition, mission],
  )

  const [formulaire, setFormulaire] = useState(valeursInitiales)
  const { erreurs, valide } = useMemo(() => validerMission(formulaire), [formulaire])

  // Re-partir des valeurs de la mission a chaque ouverture : sans ca, une saisie
  // abandonnee reapparaitrait a la reouverture. Ajustement pendant le rendu
  // (React le recommande pour « reinitialiser un etat quand une prop change »)
  // plutot qu'un effet, qui declencherait un rendu en cascade.
  const [etaitOuvert, setEtaitOuvert] = useState(ouvert)
  if (ouvert !== etaitOuvert) {
    setEtaitOuvert(ouvert)
    if (ouvert) setFormulaire(valeursInitiales)
  }

  const setChamp = (cle) => (valeur) => setFormulaire((etat) => ({ ...etat, [cle]: valeur }))

  const modifie = edition ? estModifie(formulaire, mission) : true

  const fermer = () => {
    setFormulaire(valeursInitiales)
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
      titre={edition ? 'Modifier la mission' : 'Nouvelle mission'}
      description={
        edition
          ? mission.clientProduction
          : 'Le client, le type et la date de debut suffisent — le reste peut venir plus tard.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={fermer}>
            Annuler
          </Button>
          {/* Toujours desactive : l'endpoint n'existe pas. Un bouton actif qui ne
              fait rien serait pire qu'un bouton grise. `valide` ne sert donc qu'a
              expliquer *pourquoi* dans l'infobulle, en plus des erreurs de champ. */}
          <Button
            disabled
            title={
              !valide
                ? 'Corrige les champs en rouge'
                : edition
                  ? "Edition a venir : PUT /api/missions/:id n'est pas encore en ligne"
                  : "Creation a venir : POST /api/missions n'est pas encore en ligne"
            }
          >
            {edition ? 'Enregistrer' : 'Creer la mission'}
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
          {edition
            ? "Enregistrement indisponible : PUT /api/missions/:id n'est pas encore en ligne."
            : "Creation indisponible : POST /api/missions n'est pas encore en ligne."}
        </p>
        {/* En edition, dire ce qui partirait a l'enregistrement : sans ca, un
            bouton grise ne distingue pas « rien change » de « pas branche ». */}
        {edition && !modifie && (
          <p className="text-xs text-slate-500">Aucune modification pour l'instant.</p>
        )}
      </div>
    </Modal>
  )
}

export default MissionFormModal
