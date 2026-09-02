import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'
import Input from '../components/ui/Input.jsx'
import { requestCode } from '../api/auth.js'
import { messageErreur, normaliserEmail, validerEmail } from '../lib/authForm.js'

// Connexion sans mot de passe : on demande un code a six chiffres, envoye par
// email, saisi ensuite sur /verify-code. Le meme appel vaut inscription — le
// serveur cree le compte si l'email est inconnu — donc il n'y a rien a
// distinguer ici entre un nouveau venu et un habitue.
//
// La page est hors AppLayout (pas de sidebar avant d'etre connecte) : elle rend
// donc son propre plein ecran, en deux volets. Le volet de gauche remplace la
// sidebar absente — meme logo, meme accent — pour que l'ecran d'entree ne soit
// pas un formulaire flottant sans identite. Il disparait sous `lg`, ou la
// hauteur doit aller au formulaire.

// Ce que l'app fait, dit en trois lignes. Les icones sont celles de la nav :
// l'utilisateur les retrouvera une fois connecte.
const ARGUMENTS = [
  { icon: 'missions', texte: 'Tes missions intermittence et freelance au meme endroit.' },
  { icon: 'clock', texte: 'Le seuil des 507 h suivi sur une fenetre glissante.' },
  { icon: 'portfolios', texte: 'Un portfolio public, monte a partir de tes projets.' },
]

function Marque({ sombre = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={
          sombre
            ? 'grid size-8 place-items-center rounded-lg bg-white text-sm font-bold text-brand-700'
            : 'grid size-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white'
        }
      >
        W
      </span>
      <span
        className={
          sombre
            ? 'text-sm font-semibold tracking-tight text-white'
            : 'text-sm font-semibold tracking-tight text-slate-900'
        }
      >
        wks1
      </span>
    </div>
  )
}

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [touche, setTouche] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [erreurApi, setErreurApi] = useState(null)

  const erreurEmail = validerEmail(email)
  // L'erreur de saisie ne s'affiche qu'apres une tentative : rougir un champ que
  // l'utilisateur n'a pas fini de remplir est du bruit.
  const erreurAffichee = touche ? erreurEmail : null

  async function envoyer(event) {
    event.preventDefault()
    setTouche(true)
    if (erreurEmail || envoi) return

    setEnvoi(true)
    setErreurApi(null)

    try {
      await requestCode(normaliserEmail(email))
      // L'email voyage par l'etat de navigation, pas par l'URL : /verify-code en
      // a besoin pour le second appel, et une adresse n'a rien a faire dans un
      // historique de navigateur.
      navigate('/verify-code', { state: { email: normaliserEmail(email) } })
    } catch (error) {
      setErreurApi(messageErreur(error))
      // Pas de remise a zero apres un succes : la page est demontee par la
      // navigation.
      setEnvoi(false)
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Volet de presentation : purement decoratif au clavier, il ne contient
          aucun controle, donc rien a atteindre en tabulant. */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand-700 p-10 lg:flex">
        {/* Deux halos brand-500/600 : de la profondeur sans image a charger. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-16 size-96 rounded-full bg-brand-500/40 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -bottom-28 size-96 rounded-full bg-brand-600/50 blur-3xl"
        />

        <div className="relative">
          <Marque sombre />
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold tracking-tight text-balance text-white">
            Tes missions, tes heures, tes projets.
          </h2>

          <ul className="mt-8 grid gap-4">
            {ARGUMENTS.map((argument) => (
              <li key={argument.icon} className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 text-white">
                  <Icon name={argument.icon} />
                </span>
                <span className="pt-1.5 text-sm text-brand-100">{argument.texte}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-brand-200">v0.1 — demo</p>
      </aside>

      {/* Volet formulaire. Pas de Card : le volet de gauche structure deja la
          page, une carte de plus ferait une boite dans une boite. */}
      <main className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          {/* La marque n'apparait ici que quand le volet de gauche est masque. */}
          <div className="mb-10 lg:hidden">
            <Marque />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Connexion</h1>
          <p className="mt-2 text-sm text-slate-500">
            Entre ton adresse : on t'envoie un code a six chiffres, valable dix minutes.
          </p>

          <form onSubmit={envoyer} noValidate className="mt-8 grid gap-4">
            <Input
              label="Adresse email"
              type="email"
              value={email}
              onChange={setEmail}
              erreur={erreurAffichee}
              placeholder="toi@exemple.fr"
              autoComplete="email"
              autoFocus
              disabled={envoi}
            />

            {erreurApi && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
              >
                {erreurApi}
              </p>
            )}

            <Button type="submit" size="lg" disabled={envoi} className="mt-2 w-full">
              {envoi ? 'Envoi du code...' : 'Recevoir mon code'}
              {!envoi && <Icon name="chevronRight" className="size-4" />}
            </Button>
          </form>

          <p className="mt-8 border-t border-slate-100 pt-6 text-xs text-slate-500">
            Pas de mot de passe a retenir. Premiere visite ? Ton compte est cree a la
            premiere connexion.
          </p>
        </div>
      </main>
    </div>
  )
}

export default Login
