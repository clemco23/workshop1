import { useId, useMemo, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import { MISSION_STATUT, MISSION_TYPE } from '../../lib/enums.js'
import JoursTravaillesField from './JoursTravaillesField.jsx'
import {
  estModifie,
  joursDeLaMission,
  missionVide,
  validerMission,
  versFormulaire,
  versPayload,
} from '../../lib/missionForm.js'
import { createMission, updateMission } from '../../api/missions.js'
import { formatHeures, num } from '../../lib/format.js'
import { messageErreur } from '../../lib/erreurs.js'

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
// La validation du client est un garde-fou d'ergonomie : le serveur revalide
// tout (`missionData()`), et c'est son message qui s'affiche en cas de refus.
//
// `onEnregistre` recoit la mission renvoyee par l'API. C'est la page qui decide
// quoi en faire (revalider la route, naviguer) : le composant ne connait pas le
// routeur.
function MissionFormModal({ ouvert, onClose, configSeuil, mission = null, onEnregistre }) {
  const idFormulaire = useId()
  const edition = mission != null
  const heuresJourDefaut = configSeuil.heuresJourDefaut
  const valeursInitiales = useMemo(
    () => (edition ? versFormulaire(mission) : missionVide(configSeuil.joursOffDefaut)),
    [edition, mission, configSeuil.joursOffDefaut],
  )

  // `nbJours` est deduit de la plage et du masque tant que l'utilisateur n'y a
  // pas touche. En edition, une valeur deja enregistree est consideree comme
  // sienne : on ne la remplace pas dans son dos.
  const nbJoursInitialManuel = edition && mission.nbJours != null

  const [formulaire, setFormulaire] = useState(valeursInitiales)
  const [nbJoursManuel, setNbJoursManuel] = useState(nbJoursInitialManuel)
  const [envoi, setEnvoi] = useState(false)
  const [erreurApi, setErreurApi] = useState(null)
  const { erreurs, valide } = useMemo(() => validerMission(formulaire), [formulaire])

  // Re-partir des valeurs de la mission a chaque ouverture : sans ca, une saisie
  // abandonnee reapparaitrait a la reouverture. Ajustement pendant le rendu
  // (React le recommande pour « reinitialiser un etat quand une prop change »)
  // plutot qu'un effet, qui declencherait un rendu en cascade.
  const [etaitOuvert, setEtaitOuvert] = useState(ouvert)
  if (ouvert !== etaitOuvert) {
    setEtaitOuvert(ouvert)
    if (ouvert) {
      setFormulaire(valeursInitiales)
      setNbJoursManuel(nbJoursInitialManuel)
      setErreurApi(null)
    }
  }

  // Toute modification passe par ici : c'est le seul endroit qui sait que
  // `nbJours` suit la plage et le masque. Le recalcul se fait dans la mise a
  // jour d'etat, sur les valeurs *suivantes*, pas sur celles du rendu courant.
  const appliquer = (patch) =>
    setFormulaire((etat) => {
      const suivant = { ...etat, ...patch }
      if (nbJoursManuel) return suivant

      const compte = joursDeLaMission(suivant)
      return compte ? { ...suivant, nbJours: String(compte.travailles) } : suivant
    })

  const setChamp = (cle) => (valeur) => appliquer({ [cle]: valeur })

  // Le decompte affiche par le champ des jours travailles, et le repere du
  // bouton « recalculer ».
  const compteJours = joursDeLaMission(formulaire)

  const modifie = edition ? estModifie(formulaire, mission) : true

  const fermer = () => {
    if (envoi) return // pendant l'appel, la seule issue est la reponse du serveur
    setFormulaire(valeursInitiales)
    setErreurApi(null)
    onClose()
  }

  // PATCH en edition : le serveur ne valide et n'ecrit que les champs presents.
  // On envoie le payload entier — le formulaire les tient tous — plutot que de
  // calculer un delta, qui divergerait de ce que l'utilisateur voit a l'ecran.
  async function enregistrer(event) {
    event.preventDefault()
    if (!valide || !modifie || envoi) return

    setEnvoi(true)
    setErreurApi(null)

    try {
      const payload = versPayload(formulaire)
      const enregistree = edition
        ? await updateMission(mission.id, payload)
        : await createMission(payload)

      onEnregistre?.(enregistree)
      setFormulaire(valeursInitiales)
      onClose()
    } catch (error) {
      setErreurApi(messageErreur(error))
    } finally {
      setEnvoi(false)
    }
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
          <Button variant="secondary" onClick={fermer} disabled={envoi}>
            Annuler
          </Button>
          {/* Le pied du <dialog> est hors du <form> : `form` relie quand meme le
              bouton a la saisie, sans sortir le formulaire de la mise en page. */}
          <Button
            type="submit"
            form={idFormulaire}
            disabled={!valide || !modifie || envoi}
            title={
              !valide
                ? 'Corrige les champs en rouge'
                : !modifie
                  ? 'Aucune modification a enregistrer'
                  : undefined
            }
          >
            {envoi ? 'Enregistrement…' : edition ? 'Enregistrer' : 'Creer la mission'}
          </Button>
        </>
      }
    >
      {/* Un vrai <form> : la touche Entree depuis un champ enregistre, comme
          partout ailleurs. */}
      <form id={idFormulaire} onSubmit={enregistrer} noValidate className="grid gap-4">
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

        <JoursTravaillesField
          dateDebut={formulaire.dateDebut}
          dateFin={formulaire.dateFin}
          joursOff={formulaire.joursOff}
          datesExclues={formulaire.datesExclues}
          datesIncluses={formulaire.datesIncluses}
          onChange={appliquer}
          compte={compteJours}
          heuresJourDefaut={heuresJourDefaut}
          erreur={erreurs.joursTravailles}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Jours"
            type="number"
            inputMode="decimal"
            min={0}
            step={0.5}
            suffixe="j"
            value={formulaire.nbJours}
            // Saisir soi-meme le nombre de jours coupe le lien avec le
            // calendrier : une mission a temps partiel n'a pas a compter un jour
            // plein par case.
            onChange={(valeur) => {
              setNbJoursManuel(true)
              setFormulaire((etat) => ({ ...etat, nbJours: valeur }))
            }}
            erreur={erreurs.nbJours}
            hint={
              nbJoursManuel
                ? undefined
                : compteJours
                  ? 'Compte des jours travailles.'
                  : 'Se calcule des que la plage est complete.'
            }
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

        {nbJoursManuel && compteJours && Number(formulaire.nbJours) !== compteJours.travailles && (
          <p className="text-xs text-slate-500">
            Le calendrier donne {compteJours.travailles} j.{' '}
            <button
              type="button"
              onClick={() => {
                setNbJoursManuel(false)
                setFormulaire((etat) => ({ ...etat, nbJours: String(compteJours.travailles) }))
              }}
              className="font-medium text-brand-600 underline underline-offset-2"
            >
              Recalculer
            </button>
          </p>
        )}

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

        {erreurApi && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {erreurApi}
          </p>
        )}

        {/* En edition, un bouton grise doit distinguer « rien change » de
            « champs invalides ». */}
        {edition && !modifie && (
          <p className="text-xs text-slate-500">Aucune modification pour l'instant.</p>
        )}
      </form>
    </Modal>
  )
}

export default MissionFormModal
