import { useId, useMemo, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import { PROJET_TAG, PROJET_TYPE, enumMeta } from '../../lib/enums.js'
import {
  PROJET_VIDE,
  estModifie,
  validerProjet,
  versFormulaire,
  versPayload,
} from '../../lib/projetForm.js'
import { createProjet, updateProjet } from '../../api/projets.js'
import { typeMediaDepuisUrl } from '../../lib/medias.js'
import { formatPeriode } from '../../lib/format.js'
import { messageErreur } from '../../lib/erreurs.js'

const optionsTag = Object.entries(PROJET_TAG).map(([value, meta]) => ({
  value,
  label: meta.label,
}))

const optionsType = Object.entries(PROJET_TYPE).map(([value, meta]) => ({
  value,
  label: meta.label,
}))

// Creation *et* edition d'une fiche projet : memes champs, memes regles, seul
// l'intitule change. Passer `projet` bascule en edition.
//
// Le formulaire ne saisit qu'un `link`. Le serveur accepte aussi un fichier
// (multipart, champ `file`) pour les types IMAGE / PDF / VIDEO, qu'il pousse
// dans Storage avant d'en ranger l'URL publique dans `link` — le jour ou un
// selecteur de fichier arrivera ici, c'est le seul endroit a changer.
//
// `onEnregistre` recoit la fiche renvoyee par l'API : c'est la page qui decide
// quoi en faire (revalider, naviguer).
function ProjetFormModal({ ouvert, onClose, missions = [], projet = null, onEnregistre }) {
  const idFormulaire = useId()
  const edition = projet != null
  const valeursInitiales = useMemo(
    () => (edition ? versFormulaire(projet) : PROJET_VIDE),
    [edition, projet],
  )

  const [formulaire, setFormulaire] = useState(valeursInitiales)
  const [envoi, setEnvoi] = useState(false)
  const [erreurApi, setErreurApi] = useState(null)
  const { erreurs, valide } = useMemo(() => validerProjet(formulaire), [formulaire])

  // Re-partir des valeurs de la fiche a chaque ouverture, comme MissionFormModal :
  // ajustement pendant le rendu plutot qu'un effet, qui rendrait deux fois.
  const [etaitOuvert, setEtaitOuvert] = useState(ouvert)
  if (ouvert !== etaitOuvert) {
    setEtaitOuvert(ouvert)
    if (ouvert) {
      setFormulaire(valeursInitiales)
      setErreurApi(null)
    }
  }

  const setChamp = (cle) => (valeur) => setFormulaire((etat) => ({ ...etat, [cle]: valeur }))

  const modifie = edition ? estModifie(formulaire, projet) : true

  const fermer = () => {
    if (envoi) return
    setFormulaire(valeursInitiales)
    setErreurApi(null)
    onClose()
  }

  async function enregistrer(event) {
    event.preventDefault()
    if (!valide || !modifie || envoi) return

    setEnvoi(true)
    setErreurApi(null)

    try {
      const payload = versPayload(formulaire)
      const enregistree = edition
        ? await updateProjet(projet.id, payload)
        : await createProjet(payload)

      onEnregistre?.(enregistree)
      setFormulaire(valeursInitiales)
      onClose()
    } catch (error) {
      setErreurApi(messageErreur(error))
    } finally {
      setEnvoi(false)
    }
  }

  // mission_id est nullable : une fiche perso n'a pas de mission.
  const optionsMission = useMemo(
    () => [
      { value: '', label: 'Aucune (projet personnel)' },
      ...missions.map((mission) => ({
        value: mission.id,
        label: `${mission.clientProduction} — ${formatPeriode(mission.dateDebut, mission.dateFin)}`,
      })),
    ],
    [missions],
  )

  // Le schema ne stocke qu'un media : `type` + `link`. Si l'URL contredit le type
  // choisi, le dire plutot que de le corriger dans le dos de l'utilisateur.
  const lien = formulaire.link.trim()
  const typeDeduit = lien !== '' && !erreurs.link ? typeMediaDepuisUrl(lien) : null
  const typeIncoherent = typeDeduit && typeDeduit !== formulaire.type

  return (
    <Modal
      ouvert={ouvert}
      onClose={fermer}
      titre={edition ? 'Modifier la fiche' : 'Nouvelle fiche projet'}
      description={
        edition ? projet.titre : 'Une realisation a montrer : titre, date et lien suffisent.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={fermer} disabled={envoi}>
            Annuler
          </Button>
          {/* Le pied du <dialog> est hors du <form> : `form` relie quand meme le
              bouton a la saisie. */}
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
            {envoi ? 'Enregistrement…' : edition ? 'Enregistrer' : 'Creer la fiche'}
          </Button>
        </>
      }
    >
      <form id={idFormulaire} onSubmit={enregistrer} noValidate className="grid gap-4">
        <Input
          label="Titre"
          value={formulaire.titre}
          onChange={setChamp('titre')}
          erreur={erreurs.titre}
          placeholder="Captation live — Cie du Lys"
          data-autofocus
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Tag"
            value={formulaire.tag}
            onChange={setChamp('tag')}
            options={optionsTag}
          />
          <Input
            label="Date"
            type="date"
            value={formulaire.date}
            onChange={setChamp('date')}
            erreur={erreurs.date}
          />
        </div>

        <Input
          label="Lien"
          type="url"
          inputMode="url"
          value={formulaire.link}
          onChange={setChamp('link')}
          erreur={erreurs.link}
          placeholder="https://vimeo.com/…"
          hint="Video, image, PDF ou page — une seule adresse par fiche pour l'instant."
        />

        <Select
          label="Type de media"
          value={formulaire.type}
          onChange={setChamp('type')}
          options={optionsType}
        />

        {typeIncoherent && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Ce lien ressemble plutot a {enumMeta(PROJET_TYPE, typeDeduit).label.toLowerCase()} —
            verifie le type choisi.
          </p>
        )}

        <Select
          label="Mission liee"
          value={formulaire.missionId}
          onChange={setChamp('missionId')}
          options={optionsMission}
        />

        <div className="flex min-w-0 flex-col gap-1">
          <label
            htmlFor="projet-description"
            className="text-xs font-medium tracking-wide text-slate-500 uppercase"
          >
            Description
          </label>
          <textarea
            id="projet-description"
            rows={3}
            value={formulaire.description}
            onChange={(event) => setChamp('description')(event.target.value)}
            placeholder="Ce que tu as fait, le format, le contexte…"
            className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-900 placeholder:text-slate-400"
          />
          {/* La fiche peut finir sur une page publique : le rappeler avant la saisie. */}
          <p className="text-xs text-slate-500">
            Facultatif, mais visible sur les pages publiques ou tu publieras la fiche.
          </p>
        </div>

        {erreurApi && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {erreurApi}
          </p>
        )}

        {edition && !modifie && (
          <p className="text-xs text-slate-500">Aucune modification pour l'instant.</p>
        )}
      </form>
    </Modal>
  )
}

export default ProjetFormModal
