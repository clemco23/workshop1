import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthShell from '../components/auth/AuthShell.jsx'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'
import Input from '../components/ui/Input.jsx'
import { requestCode } from '../api/auth.js'
import { messageErreur, normaliserEmail, validerEmail } from '../lib/authForm.js'

// Connexion sans mot de passe : on demande un code a six chiffres, envoye par
// email, saisi ensuite sur /verify-code. Le meme appel vaut inscription, le
// serveur cree le compte si l'email est inconnu, donc il n'y a rien a
// distinguer ici entre un nouveau venu et un habitue.
function Login() {
  const navigate = useNavigate()
  // Depose soit par la garde d'authentification (`depuis` : la page demandee
  // sans session), soit par RouteError quand le jeton a expire en cours de
  // route (`info` : la raison, a afficher). Les deux transitent par l'etat de
  // navigation, jamais par l'URL.
  const { state } = useLocation()
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
      const adresse = normaliserEmail(email)
      const reponse = await requestCode(adresse)
      // L'email voyage par l'etat de navigation, pas par l'URL : /verify-code en
      // a besoin pour le second appel, et une adresse n'a rien a faire dans un
      // historique de navigateur. Le message de l'API suit, pour que l'ecran
      // suivant confirme l'envoi.
      // `depuis` est relaye : c'est /verify-code qui, apres l'echange du code,
      // ramene l'utilisateur la ou il allait.
      navigate('/verify-code', {
        state: { email: adresse, info: reponse?.message, depuis: state?.depuis },
      })
    } catch (error) {
      setErreurApi(messageErreur(error))
      // Pas de remise a zero apres un succes : la page est demontee par la
      // navigation.
      setEnvoi(false)
    }
  }

  return (
    <AuthShell
      titre="Connexion"
      description="Entre ton adresse : on t'envoie un code a six chiffres, valable dix minutes."
      pied={
        <>
          Pas de mot de passe a retenir. Premiere visite ?{' '}
          <Link to="/signup" className="font-medium text-brand-700 hover:underline">
            Creer un compte
          </Link>
        </>
      }
    >
      <form onSubmit={envoyer} noValidate className="mt-8 grid gap-4">
        {state?.info && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {state.info}
          </p>
        )}

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
    </AuthShell>
  )
}

export default Login
