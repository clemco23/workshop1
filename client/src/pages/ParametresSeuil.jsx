import { useMemo, useState } from 'react'
import { useLoaderData, useRevalidator } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader.jsx'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Badge from '../components/ui/Badge.jsx'
import Input from '../components/ui/Input.jsx'
import JoursSemaine from '../components/ui/JoursSemaine.jsx'
import { fetchConfigSeuil, updateConfigSeuil } from '../api/compte.js'
import {
  DEFAUTS,
  estModifie,
  validerParametres,
  versFormulaire,
  versPayload,
} from '../lib/parametres.js'
import { formatDate, formatHeures, num } from '../lib/format.js'
import { JOURS_SEMAINE } from '../lib/joursTravailles.js'
import { messageErreur } from '../lib/erreurs.js'

export async function loader() {
  return { configSeuil: await fetchConfigSeuil() }
}

// « samedi, dimanche » plutot qu'une liste de nombres, dans l'ordre d'affichage
// de la semaine (lundi d'abord) et non dans celui de getUTCDay().
function libelleJoursOff(joursOff = []) {
  if (joursOff.length === 0) return 'Aucun'

  return JOURS_SEMAINE.filter((jour) => joursOff.map(Number).includes(jour.valeur))
    .map((jour) => jour.label)
    .join(', ')
}

function ParametresSeuil() {
  const { configSeuil } = useLoaderData()
  const revalidator = useRevalidator()
  const [formulaire, setFormulaire] = useState(() => versFormulaire(configSeuil))
  const [envoi, setEnvoi] = useState(false)
  const [erreurApi, setErreurApi] = useState(null)
  const [enregistre, setEnregistre] = useState(false)

  const { erreurs, valide } = useMemo(() => validerParametres(formulaire), [formulaire])
  const modifie = estModifie(formulaire, configSeuil)

  const setChamp = (cle) => (valeur) => {
    setEnregistre(false)
    setFormulaire((etat) => ({ ...etat, [cle]: valeur }))
  }

  const reinitialiser = () => {
    setErreurApi(null)
    setEnregistre(false)
    setFormulaire(versFormulaire(configSeuil))
  }

  // Apres l'enregistrement, on revalide la route plutot que de recopier la
  // reponse dans l'etat : `configSeuil` reste ce que le serveur dit, et la carte
  // « configuration actuelle » (updatedAt compris) suit toute seule.
  async function enregistrer() {
    if (!valide || !modifie || envoi) return

    setEnvoi(true)
    setErreurApi(null)

    try {
      await updateConfigSeuil(versPayload(formulaire))
      setEnregistre(true)
      revalidator.revalidate()
    } catch (error) {
      setErreurApi(messageErreur(error))
    } finally {
      setEnvoi(false)
    }
  }

  // Lecture en clair de la regle, avec les valeurs saisies : c'est la phrase que
  // le formulaire configure, pas trois nombres isoles.
  const seuil = num(formulaire.seuilHeuresAnnuel)
  const fenetre = num(formulaire.fenetreMois)
  const heuresJour = num(formulaire.heuresJourDefaut)
  const joursEquivalents = heuresJour > 0 ? seuil / heuresJour : 0

  return (
    <>
      <PageHeader
        title="Parametres"
        subtitle="Seuil d'heures, fenetre de calcul, heures par jour et jours travailles par defaut"
      >
        <Button variant="secondary" onClick={reinitialiser} disabled={!modifie || envoi}>
          Annuler
        </Button>
        <Button
          onClick={enregistrer}
          disabled={!valide || !modifie || envoi}
          title={!valide ? 'Corrige les champs en rouge' : undefined}
        >
          {envoi ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </PageHeader>

      {erreurApi && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {erreurApi}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid min-w-0 content-start gap-4 lg:col-span-2">
          <Card
            title="Seuil d'intermittence"
            subtitle="Le nombre d'heures a atteindre, et la periode sur laquelle il se compte"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Seuil annuel"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                suffixe="h"
                value={formulaire.seuilHeuresAnnuel}
                onChange={setChamp('seuilHeuresAnnuel')}
                erreur={erreurs.seuilHeuresAnnuel}
                hint={`Defaut : ${DEFAUTS.seuilHeuresAnnuel} h`}
              />
              <Input
                label="Fenetre de calcul"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                suffixe="mois"
                value={formulaire.fenetreMois}
                onChange={setChamp('fenetreMois')}
                erreur={erreurs.fenetreMois}
                hint={`Defaut : ${DEFAUTS.fenetreMois} mois`}
              />
            </div>

            <p className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-600">
              Le seuil n'est pas un quota mensuel : il se compte sur une{' '}
              <strong className="font-medium text-slate-900">fenetre glissante</strong> des{' '}
              {formatHeures(fenetre)} derniers mois. Seules les missions d'intermittence{' '}
              <strong className="font-medium text-slate-900">confirmees ou terminees</strong> y
              entrent — une mission seulement proposee est ignoree.
            </p>
          </Card>

          <Card
            title="Heures par defaut"
            subtitle="Utilisees quand une mission n'a pas d'heures saisies"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Heures par jour"
                type="number"
                inputMode="decimal"
                min={0.5}
                max={24}
                step={0.5}
                suffixe="h"
                value={formulaire.heuresJourDefaut}
                onChange={setChamp('heuresJourDefaut')}
                erreur={erreurs.heuresJourDefaut}
                hint={`Defaut : ${DEFAUTS.heuresJourDefaut} h`}
              />
            </div>

            <p className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-600">
              Le champ <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">heures</code>{' '}
              d'une mission peut rester vide. Dans ce cas, les heures valent{' '}
              <strong className="font-medium text-slate-900">
                nombre de jours x {formatHeures(heuresJour)} h
              </strong>{' '}
              — les listes marquent alors la valeur comme estimee.
            </p>
          </Card>

          <Card
            title="Jours travailles par defaut"
            subtitle="Pre-remplissage du calendrier des nouvelles missions"
          >
            <JoursSemaine
              value={formulaire.joursOffDefaut}
              onChange={setChamp('joursOffDefaut')}
              erreur={erreurs.joursOffDefaut}
            />

            <p className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-600">
              Une nouvelle mission part de ces jours-la : il n'y a plus qu'a traiter les
              exceptions, dans le calendrier du formulaire. C'est un{' '}
              <strong className="font-medium text-slate-900">point de depart</strong>, pas une
              regle — changer ce reglage ne touche pas aux missions deja enregistrees.
            </p>
          </Card>
        </div>

        <div className="grid min-w-0 content-start gap-4">
          <Card title="Ce que ca donne">
            {valide ? (
              <p className="text-sm text-slate-600">
                Atteindre{' '}
                <strong className="font-medium text-slate-900">{formatHeures(seuil)} h</strong> sur{' '}
                <strong className="font-medium text-slate-900">
                  {formatHeures(fenetre)} mois
                </strong>
                , soit environ{' '}
                <strong className="font-medium text-slate-900">
                  {formatHeures(joursEquivalents)} jours
                </strong>{' '}
                de travail a {formatHeures(heuresJour)} h.
              </p>
            ) : (
              <p className="text-sm text-red-600">
                Corrige les champs en rouge pour voir le calcul.
              </p>
            )}

            {(modifie || enregistre) && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                {modifie ? (
                  <Badge tone="warning">Modifications non enregistrees</Badge>
                ) : (
                  <Badge tone="success">Enregistre</Badge>
                )}
              </div>
            )}
          </Card>

          <Card title="Configuration actuelle" subtitle="Telle qu'elle est enregistree">
            <dl className="divide-y divide-slate-100">
              {[
                ['Seuil annuel', `${formatHeures(configSeuil.seuilHeuresAnnuel)} h`],
                ['Fenetre', `${formatHeures(configSeuil.fenetreMois)} mois`],
                ['Heures par jour', `${formatHeures(configSeuil.heuresJourDefaut)} h`],
                ['Jours off par defaut', libelleJoursOff(configSeuil.joursOffDefaut)],
                ['Mise a jour', formatDate(configSeuil.updatedAt)],
              ].map(([label, valeur]) => (
                <div key={label} className="flex items-baseline justify-between gap-4 py-2">
                  <dt className="text-sm text-slate-500">{label}</dt>
                  <dd className="min-w-0 text-right text-sm font-medium break-words text-slate-900">
                    {valeur}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </>
  )
}

export default ParametresSeuil
