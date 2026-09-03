import { useId, useMemo, useRef, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import Icon from '../ui/Icon.jsx'
import { PROJET_TAG, PROJET_TYPE, enumMeta } from '../../lib/enums.js'
import {
  FICHIERS,
  PROJET_VIDE,
  TAILLE_MAX,
  TYPES_FICHIER,
  accept,
  estModifie,
  typeDepuisFichier,
  validerProjet,
  versFormData,
  versFormulaire,
  versPayload,
} from '../../lib/projetForm.js'
import { createProjet, updateProjet } from '../../api/projets.js'
import { mediaMeta, typeMediaDepuisUrl } from '../../lib/medias.js'
import { formatPeriode, formatTaille } from '../../lib/format.js'
import { messageErreur } from '../../lib/erreurs.js'
import { cn } from '../../lib/cn.js'

const optionsTag = Object.entries(PROJET_TAG).map(([value, meta]) => ({
  value,
  label: meta.label,
}))

const optionsType = Object.entries(PROJET_TYPE).map(([value, meta]) => ({
  value,
  label: meta.label,
}))

// Un fichier ne peut pas etre de type LINK : le serveur refuse explicitement le
// couple, et l'offrir dans la liste ne menerait qu'a un aller-retour d'erreur.
const optionsTypeFichier = optionsType.filter((option) => TYPES_FICHIER.includes(option.value))

// Creation *et* edition d'une fiche projet : memes champs, memes regles, seul
// l'intitule change. Passer `projet` bascule en edition.
//
// Le media arrive de deux facons, exclusives l'une de l'autre : un fichier
// (image, PDF, video) envoye en multipart, que le serveur pousse dans Storage
// avant d'en ranger l'URL publique dans `link` ; ou une adresse saisie a la
// main. Le choix est un onglet, pas un champ cache : c'est la premiere decision
// a prendre sur le media, elle doit se voir.
//
// `onEnregistre` recoit la fiche renvoyee par l'API : c'est la page qui decide
// quoi en faire (revalider, naviguer).
function ProjetFormModal({ ouvert, onClose, missions = [], projet = null, onEnregistre }) {
  const idFormulaire = useId()
  const champFichier = useRef(null)
  const edition = projet != null
  const valeursInitiales = useMemo(
    () => (edition ? versFormulaire(projet) : PROJET_VIDE),
    [edition, projet],
  )

  const [formulaire, setFormulaire] = useState(valeursInitiales)
  const [survol, setSurvol] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [erreurApi, setErreurApi] = useState(null)
  const { erreurs, valide } = useMemo(
    () => validerProjet(formulaire, { edition }),
    [formulaire, edition],
  )

  // Re-partir des valeurs de la fiche a chaque ouverture, comme MissionFormModal :
  // ajustement pendant le rendu plutot qu'un effet, qui rendrait deux fois.
  const [etaitOuvert, setEtaitOuvert] = useState(ouvert)
  if (ouvert !== etaitOuvert) {
    setEtaitOuvert(ouvert)
    if (ouvert) {
      setFormulaire(valeursInitiales)
      setErreurApi(null)
      // La valeur de l'<input type="file"> est remise a zero a la fermeture et
      // apres un envoi, pas ici : on ne touche pas a une ref pendant le rendu.
    }
  }

  const setChamp = (cle) => (valeur) => setFormulaire((etat) => ({ ...etat, [cle]: valeur }))

  const modifie = edition ? estModifie(formulaire, projet) : true
  const parFichier = formulaire.source === 'fichier'

  // Bascule d'onglet. Un fichier deja choisi est abandonne en passant au lien :
  // le garder en memoire ferait repartir un envoi que l'utilisateur croit annule.
  const choisirSource = (source) => {
    setErreurApi(null)
    setFormulaire((etat) => ({
      ...etat,
      source,
      fichier: source === 'lien' ? null : etat.fichier,
      // VIDEO est le defaut du schema : c'est vers lui qu'on retombe quand une
      // fiche de type LINK passe au fichier.
      type: source === 'fichier' && etat.type === 'LINK' ? 'VIDEO' : etat.type,
    }))
    if (source === 'lien' && champFichier.current) champFichier.current.value = ''
  }

  // Le type suit le fichier choisi : l'utilisateur a deja dit ce qu'il envoyait
  // en le prenant dans ses dossiers, le lui faire redire serait une occasion
  // d'erreur de plus.
  const choisirFichier = (candidat) => {
    if (!candidat) return
    setErreurApi(null)
    setFormulaire((etat) => ({
      ...etat,
      fichier: candidat,
      type: typeDepuisFichier(candidat) ?? etat.type,
    }))
  }

  const retirerFichier = () => {
    setFormulaire((etat) => ({ ...etat, fichier: null }))
    // Sans ca, rechoisir le meme fichier ne declenche pas de `change`.
    if (champFichier.current) champFichier.current.value = ''
  }

  const fermer = () => {
    if (envoi) return
    setFormulaire(valeursInitiales)
    setErreurApi(null)
    if (champFichier.current) champFichier.current.value = ''
    onClose()
  }

  async function enregistrer(event) {
    event.preventDefault()
    if (!valide || !modifie || envoi) return

    setEnvoi(true)
    setErreurApi(null)

    try {
      // Multipart des que la fiche est alimentee par un fichier, meme sans
      // nouveau fichier a l'edition : le corps ne porte alors pas de `link`, et
      // le serveur laisse le media en place.
      const payload = parFichier ? versFormData(formulaire) : versPayload(formulaire)
      const enregistree = edition
        ? await updateProjet(projet.id, payload)
        : await createProjet(payload)

      onEnregistre?.(enregistree)
      setFormulaire(valeursInitiales)
      if (champFichier.current) champFichier.current.value = ''
      onClose()
    } catch (error) {
      setErreurApi(
        messageErreur(error, {
          413: `Fichier trop lourd pour le serveur (${formatTaille(TAILLE_MAX)} maximum).`,
          // Le bucket n'est pas configure cote serveur : le dire, plutot que de
          // laisser croire a un fichier fautif.
          503: 'Le stockage des medias n’est pas disponible pour l’instant.',
        }),
      )
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
        label: `${mission.clientProduction} · ${formatPeriode(mission.dateDebut, mission.dateFin)}`,
      })),
    ],
    [missions],
  )

  // Le schema ne stocke qu'un media : `type` + `link`. Si l'URL contredit le type
  // choisi, le dire plutot que de le corriger dans le dos de l'utilisateur. La
  // question ne se pose pas pour un fichier : le type y est deduit du fichier.
  const lien = formulaire.link.trim()
  const typeDeduit = !parFichier && lien !== '' && !erreurs.link ? typeMediaDepuisUrl(lien) : null
  const typeIncoherent = typeDeduit && typeDeduit !== formulaire.type

  // En edition, le media deja en place quand aucun nouveau fichier n'est choisi.
  const mediaActuel = edition && parFichier && !formulaire.fichier ? projet.link : null

  return (
    <Modal
      ouvert={ouvert}
      onClose={fermer}
      titre={edition ? 'Modifier la fiche' : 'Nouvelle fiche projet'}
      description={
        edition
          ? projet.titre
          : 'Une realisation a montrer : titre, date, et une image, un PDF, une video ou un lien.'
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
            {envoi ? 'Envoi…' : edition ? 'Enregistrer' : 'Creer la fiche'}
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
          placeholder="Captation live, Cie du Lys"
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

        <div className="grid gap-3 rounded-lg border border-slate-200 p-3">
          <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">Media</span>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { cle: 'fichier', label: 'Fichier', icone: 'upload' },
              { cle: 'lien', label: 'Lien', icone: 'lien' },
            ].map((onglet) => (
              <button
                key={onglet.cle}
                type="button"
                onClick={() => choisirSource(onglet.cle)}
                aria-pressed={formulaire.source === onglet.cle}
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors',
                  formulaire.source === onglet.cle
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                )}
              >
                <Icon name={onglet.icone} className="size-3.5" />
                {onglet.label}
              </button>
            ))}
          </div>

          {/* Le type d'abord : c'est lui qui decide de l'`accept` du selecteur de
              fichier et du libelle des formats acceptes. Le poser apres aurait
              fait choisir un fichier avant de dire dans quoi on le range. */}
          <Select
            label="Type de media"
            value={formulaire.type}
            onChange={setChamp('type')}
            options={parFichier ? optionsTypeFichier : optionsType}
            hint={parFichier ? 'S’ajuste au fichier choisi.' : undefined}
          />

          {parFichier ? (
            <>
              {/* Zone de depot, meme grammaire que le depot d'un justificatif :
                  l'input est le controle reel, le bouton le declenche, et le
                  glisser-deposer n'est qu'une commodite souris. */}
              <div
                onDragOver={(event) => {
                  event.preventDefault()
                  setSurvol(true)
                }}
                onDragLeave={() => setSurvol(false)}
                onDrop={(event) => {
                  event.preventDefault()
                  setSurvol(false)
                  choisirFichier(event.dataTransfer.files?.[0] ?? null)
                }}
                className={cn(
                  'flex flex-col items-center justify-center rounded-lg border border-dashed px-4 py-6 text-center transition-colors',
                  survol ? 'border-brand-400 bg-brand-50' : 'border-slate-300 bg-slate-50/60',
                )}
              >
                <input
                  ref={champFichier}
                  type="file"
                  accept={accept(formulaire.type)}
                  onChange={(event) => choisirFichier(event.target.files?.[0] ?? null)}
                  className="hidden"
                />

                {formulaire.fichier ? (
                  <>
                    <span className="rounded-lg bg-white p-2 text-brand-600 ring-1 ring-slate-200">
                      <Icon name={mediaMeta(formulaire.type).icon} className="size-5" />
                    </span>
                    <p className="mt-2 max-w-full truncate text-sm font-medium text-slate-900">
                      {formulaire.fichier.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatTaille(formulaire.fichier.size)}
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => champFichier.current?.click()}
                        disabled={envoi}
                      >
                        Changer
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={retirerFichier}
                        disabled={envoi}
                      >
                        Retirer
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="rounded-lg bg-white p-2 text-slate-400 ring-1 ring-slate-200">
                      <Icon name="upload" className="size-5" />
                    </span>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      Depose un fichier ici, ou parcours tes dossiers
                    </p>
                    <p className="mt-0.5 max-w-sm text-xs text-slate-500">
                      {FICHIERS[formulaire.type]?.libelle}, {formatTaille(TAILLE_MAX)} maximum.
                      {/* Contrairement aux justificatifs, ce bucket est public :
                          le media est fait pour etre montre sur un portfolio. */}
                      {' '}Le fichier est publiable sur tes pages publiques.
                    </p>

                    <div className="mt-3">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => champFichier.current?.click()}
                        disabled={envoi}
                      >
                        <Icon name="upload" className="size-4" />
                        Choisir un fichier
                      </Button>
                    </div>
                  </>
                )}
              </div>

              {/* Edition sans nouveau fichier : rappeler ce qui est en place,
                  sinon la zone de depot vide se lit comme une fiche sans media. */}
              {mediaActuel && (
                <p className="text-xs text-slate-500">
                  Media actuel conserve.{' '}
                  <a
                    href={mediaActuel}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-brand-700 underline underline-offset-2"
                  >
                    L’ouvrir
                  </a>
                  . Choisis un fichier pour le remplacer.
                </p>
              )}

              {erreurs.fichier && (
                <p role="alert" className="text-xs text-red-600">
                  {erreurs.fichier}
                </p>
              )}

            </>
          ) : (
            <>
              <Input
                label="Lien"
                type="url"
                inputMode="url"
                value={formulaire.link}
                onChange={setChamp('link')}
                erreur={erreurs.link}
                placeholder="https://vimeo.com/…"
                hint="Video hebergee, image, PDF ou page. Une seule adresse par fiche."
              />

              {typeIncoherent && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Ce lien ressemble plutot a{' '}
                  {enumMeta(PROJET_TYPE, typeDeduit).label.toLowerCase()} : verifie le type choisi.
                </p>
              )}
            </>
          )}
        </div>

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
