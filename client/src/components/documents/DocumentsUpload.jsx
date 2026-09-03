import { useRef, useState } from 'react'
import Card from '../ui/Card.jsx'
import Button from '../ui/Button.jsx'
import Icon from '../ui/Icon.jsx'
import Select from '../ui/Select.jsx'
import { createDocument } from '../../api/documents.js'
import { DOCUMENT_CATEGORIE } from '../../lib/enums.js'
import { ACCEPT, LIBELLE_TYPES, TAILLE_MAX, validerFichier } from '../../lib/documentForm.js'
import { formatPeriode, formatTaille } from '../../lib/format.js'
import { messageErreur } from '../../lib/erreurs.js'
import { cn } from '../../lib/cn.js'

// Depot d'un justificatif : choix du fichier (bouton ou glisser-deposer),
// categorie, mission liee facultative.
//
// Le fichier est tenu en etat local jusqu'a l'envoi, pas d'upload au moment du
// choix : l'utilisateur doit pouvoir corriger la categorie, ou changer d'avis,
// sans avoir deja pousse un fichier dans le stockage.
//
// `onAjoute` est appele apres un envoi reussi : c'est la page qui decide quoi en
// faire (revalider la route), le composant ne connait pas le routeur.

const optionsCategorie = Object.entries(DOCUMENT_CATEGORIE).map(([value, meta]) => ({
  value,
  label: meta.label,
}))

const VIDE = { categorie: 'CONTRACT', missionId: '' }

function DocumentsUpload({ missions = [], onAjoute }) {
  const champFichier = useRef(null)
  const [fichier, setFichier] = useState(null)
  const [formulaire, setFormulaire] = useState(VIDE)
  const [survol, setSurvol] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [succes, setSucces] = useState(null)

  const optionsMission = [
    { value: '', label: 'Aucune mission' },
    ...missions.map((mission) => ({
      value: mission.id,
      label: `${mission.clientProduction} · ${formatPeriode(mission.dateDebut, mission.dateFin)}`,
    })),
  ]

  const setChamp = (champ) => (valeur) =>
    setFormulaire((etat) => ({ ...etat, [champ]: valeur }))

  function choisir(candidat) {
    setSucces(null)
    const probleme = validerFichier(candidat)

    if (probleme) {
      setFichier(null)
      setErreur(probleme)
      return
    }

    setErreur(null)
    setFichier(candidat)
  }

  function deposer(event) {
    event.preventDefault()
    setSurvol(false)
    // Un seul fichier a la fois : la categorie et la mission valent pour lui.
    choisir(event.dataTransfer.files?.[0] ?? null)
  }

  function retirer() {
    setFichier(null)
    setErreur(null)
    setSucces(null)
    // Sans ca, rechoisir le meme fichier ne declenche pas de `change`.
    if (champFichier.current) champFichier.current.value = ''
  }

  async function envoyer(event) {
    event.preventDefault()

    const probleme = validerFichier(fichier)
    if (probleme) {
      setErreur(probleme)
      return
    }
    if (envoi) return

    setEnvoi(true)
    setErreur(null)
    setSucces(null)

    try {
      const document = await createDocument({ fichier, ...formulaire })
      setSucces(`« ${document.nomOriginal} » ajoute.`)
      setFichier(null)
      setFormulaire(VIDE)
      if (champFichier.current) champFichier.current.value = ''
      onAjoute?.(document)
    } catch (error) {
      setErreur(
        messageErreur(error, {
          // Refus du serveur lui-meme (limite de taille du corps, type non
          // accepte) : le message par defaut d'un proxy n'est pas lisible.
          413: `Fichier trop lourd pour le serveur (${formatTaille(TAILLE_MAX)} maximum).`,
          415: `${LIBELLE_TYPES} seulement.`,
        }),
      )
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <Card title="Ajouter un document" subtitle="Contrat, attestation employeur, devis ou facture">
      <form onSubmit={envoyer} className="grid gap-4">
        {/* Zone de depot. L'input est le controle reel : le bouton le declenche,
            la zone n'ajoute que le glisser-deposer, qui reste une commodite
            souris, tout se fait aussi au clavier par le bouton. */}
        <div
          onDragOver={(event) => {
            event.preventDefault()
            setSurvol(true)
          }}
          onDragLeave={() => setSurvol(false)}
          onDrop={deposer}
          className={cn(
            'flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-8 text-center transition-colors',
            survol ? 'border-brand-400 bg-brand-50' : 'border-slate-300 bg-slate-50/60',
          )}
        >
          <input
            ref={champFichier}
            type="file"
            accept={ACCEPT}
            onChange={(event) => choisir(event.target.files?.[0] ?? null)}
            className="hidden"
          />

          {fichier ? (
            <>
              <span className="rounded-xl bg-white p-2.5 text-brand-600 ring-1 ring-slate-200">
                <Icon name={fichier.type.startsWith('image/') ? 'image' : 'documents'} className="size-6" />
              </span>
              <p className="mt-3 max-w-full truncate text-sm font-medium text-slate-900">
                {fichier.name}
              </p>
              <p className="mt-1 text-xs text-slate-500">{formatTaille(fichier.size)}</p>

              <div className="mt-4 flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => champFichier.current?.click()}
                  disabled={envoi}
                >
                  Changer
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={retirer} disabled={envoi}>
                  Retirer
                </Button>
              </div>
            </>
          ) : (
            <>
              <span className="rounded-xl bg-white p-2.5 text-slate-400 ring-1 ring-slate-200">
                <Icon name="upload" className="size-6" />
              </span>
              <p className="mt-3 text-sm font-medium text-slate-900">
                Depose un fichier ici, ou parcours tes dossiers
              </p>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                {LIBELLE_TYPES}, {formatTaille(TAILLE_MAX)} maximum. Le fichier est range dans
                ton espace de stockage prive.
              </p>

              <div className="mt-4">
                <Button
                  type="button"
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

        <Select
          label="Categorie"
          value={formulaire.categorie}
          onChange={setChamp('categorie')}
          options={optionsCategorie}
        />

        <Select
          label="Mission liee"
          value={formulaire.missionId}
          onChange={setChamp('missionId')}
          options={optionsMission}
        />

        {erreur && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
          >
            {erreur}
          </p>
        )}

        {succes && (
          <p
            role="status"
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700"
          >
            {succes}
          </p>
        )}

        <Button type="submit" disabled={!fichier || envoi} className="w-full">
          {envoi ? 'Envoi...' : 'Ajouter le document'}
        </Button>
      </form>
    </Card>
  )
}

export default DocumentsUpload
