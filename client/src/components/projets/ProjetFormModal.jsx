import { useMemo, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import { PROJET_TAG, PROJET_TYPE, enumMeta } from '../../lib/enums.js'
import { PROJET_VIDE, validerProjet } from '../../lib/projetForm.js'
import { typeMediaDepuisUrl } from '../../lib/medias.js'
import { formatPeriode } from '../../lib/format.js'

const optionsTag = Object.entries(PROJET_TAG).map(([value, meta]) => ({
  value,
  label: meta.label,
}))

const optionsType = Object.entries(PROJET_TYPE).map(([value, meta]) => ({
  value,
  label: meta.label,
}))

// Creation d'une fiche projet. Comme pour les missions, le formulaire se remplit
// et se valide entierement, mais POST /api/projets n'est pas ecrit : le bouton
// reste desactive plutot que de faire disparaitre la saisie.
//
// Quand l'endpoint arrivera : `versPayload(formulaire)`, rien d'autre a ecrire ici.
function ProjetFormModal({ ouvert, onClose, missions = [] }) {
  const [formulaire, setFormulaire] = useState(PROJET_VIDE)
  const { erreurs, valide } = useMemo(() => validerProjet(formulaire), [formulaire])

  const setChamp = (cle) => (valeur) => setFormulaire((etat) => ({ ...etat, [cle]: valeur }))

  const fermer = () => {
    setFormulaire(PROJET_VIDE)
    onClose()
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
      titre="Nouvelle fiche projet"
      description="Une realisation a montrer : titre, date et lien suffisent."
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
              valide
                ? "Creation a venir : POST /api/projets n'est pas encore en ligne"
                : 'Corrige les champs en rouge'
            }
          >
            Creer la fiche
          </Button>
        </>
      }
    >
      {/* Pas de <form onSubmit> tant qu'il n'y a rien a envoyer. */}
      <div className="grid gap-4">
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

        <p className="border-t border-slate-100 pt-3 text-xs text-amber-700">
          Creation indisponible : POST /api/projets n'est pas encore en ligne.
        </p>
      </div>
    </Modal>
  )
}

export default ProjetFormModal
