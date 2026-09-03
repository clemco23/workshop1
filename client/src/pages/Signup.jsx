import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell from '../components/auth/AuthShell.jsx'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'
import Input from '../components/ui/Input.jsx'
import { requestCode } from '../api/auth.js'
import { messageErreur, normaliserEmail, validerEmail } from '../lib/authForm.js'

// Creation de compte. Cote serveur c'est **le meme appel** que la connexion :
// POST /api/auth/request-code cree l'utilisateur quand l'email est inconnu. Il
// n'y a donc pas de champ de plus a remplir ici, et surtout pas de mot de passe
// a choisir ni a confirmer.
//
// Cette page existe quand meme, pour deux raisons : /signup est une adresse
// qu'on attend et qu'on partage, et un nouveau venu a besoin qu'on lui dise ce
// qui va se passer, pas du libelle « Connexion » qui suppose un compte deja la.
//
// `users.first_name` / `last_name` ne sont pas demandes : le serveur les cree a
// null et n'expose aucune route pour les renseigner, donc les saisir ici
// reviendrait a les jeter. Ils devront venir d'une page de profil authentifiee,
// avec la route qui va avec (voir client/CLAUDE.md).
function Signup() {
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
      const adresse = normaliserEmail(email)
      const reponse = await requestCode(adresse)
      // `nouveau` sert uniquement a la formulation de l'ecran suivant : le
      // serveur, lui, ne fait aucune difference entre les deux parcours.
      navigate('/verify-code', {
        state: { email: adresse, info: reponse?.message, nouveau: true },
      })
    } catch (error) {
      setErreurApi(messageErreur(error))
      setEnvoi(false)
    }
  }

  return (
    <AuthShell
      titre="Creer un compte"
      description="Une adresse email suffit. Pas de mot de passe a choisir : on t'envoie un code a six chiffres pour confirmer que la boite est bien la tienne."
      pied={
        <>
          Tu as deja un compte ?{' '}
          <Link to="/login" className="font-medium text-brand-700 hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <form onSubmit={envoyer} noValidate className="mt-8 grid gap-4">
        <Input
          label="Adresse email"
          type="email"
          value={email}
          onChange={setEmail}
          erreur={erreurAffichee}
          placeholder="toi@exemple.fr"
          hint="C'est aussi a cette adresse qu'arriveront tes codes de connexion."
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
          {envoi ? 'Envoi du code...' : 'Creer mon compte'}
          {!envoi && <Icon name="chevronRight" className="size-4" />}
        </Button>
      </form>
    </AuthShell>
  )
}

export default Signup
