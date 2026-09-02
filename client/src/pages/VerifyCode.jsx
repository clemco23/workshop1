import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthShell from '../components/auth/AuthShell.jsx'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import { requestCode, verifyCode } from '../api/auth.js'
import {
  LONGUEUR_CODE,
  messageErreur,
  nettoyerCode,
  validerCode,
} from '../lib/authForm.js'
import { enregistrerSession } from '../lib/session.js'

// Secondes avant de pouvoir redemander un code : envoyer un mail est une action
// couteuse, et le serveur n'a aucune limite de debit sur request-code.
const ATTENTE_RENVOI = 30

function VerifyCode() {
  const navigate = useNavigate()
  // /login depose l'email et le message de l'API dans l'etat de navigation :
  // l'adresse n'a rien a faire dans l'URL, et l'etat disparait au rechargement.
  const { state } = useLocation()
  const email = state?.email ?? null
  // Depose par /signup : seule la formulation change, l'appel est le meme.
  const nouveau = state?.nouveau === true
  // Relaye depuis /login, qui le tient de la garde d'authentification : la page
  // que l'utilisateur demandait avant d'etre renvoye ici.
  const depuis = state?.depuis

  const [code, setCode] = useState('')
  const [touche, setTouche] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [erreurApi, setErreurApi] = useState(null)
  const [info, setInfo] = useState(state?.info ?? null)
  const [attente, setAttente] = useState(ATTENTE_RENVOI)

  // Decompte du bouton « Renvoyer ». Reparti a chaque nouvel envoi.
  useEffect(() => {
    if (attente <= 0) return

    const minuteur = setTimeout(() => setAttente((secondes) => secondes - 1), 1000)
    return () => clearTimeout(minuteur)
  }, [attente])

  // Arrivee directe sur /verify-code (rechargement, lien colle) : sans email il
  // n'y a rien a verifier, on renvoie a la demande de code plutot que d'afficher
  // un formulaire condamne. `replace` pour que le retour arriere ne reboucle pas.
  if (!email) return <Navigate to="/login" replace />

  const erreurCode = validerCode(code)
  const erreurAffichee = touche ? erreurCode : null

  async function envoyer(event) {
    event.preventDefault()
    setTouche(true)
    if (erreurCode || envoi) return

    setEnvoi(true)
    setErreurApi(null)
    setInfo(null)

    try {
      const session = await verifyCode(email, nettoyerCode(code))
      enregistrerSession(session)
      // `replace` : une fois connecte, le retour arriere ne doit pas ramener sur
      // un ecran de code deja consomme (le serveur marque le code `usedAt`).
      navigate(depuis ?? '/', { replace: true })
    } catch (error) {
      setErreurApi(messageErreur(error))
      setCode('')
      setTouche(false)
      setEnvoi(false)
    }
  }

  async function renvoyer() {
    if (attente > 0 || envoi) return

    setErreurApi(null)
    setInfo(null)
    setAttente(ATTENTE_RENVOI)

    try {
      const reponse = await requestCode(email)
      setCode('')
      setTouche(false)
      setInfo(reponse?.message ?? 'Nouveau code envoye.')
    } catch (error) {
      setErreurApi(messageErreur(error))
    }
  }

  return (
    <AuthShell
      titre={nouveau ? 'Confirme ton adresse' : 'Verification'}
      description={
        <>
          Entre le code a six chiffres envoye a{' '}
          <span className="font-medium text-slate-900">{email}</span>. Il expire dans dix
          minutes.
        </>
      }
      pied={
        <>
          Mauvaise adresse ?{' '}
          <Link
            to={nouveau ? '/signup' : '/login'}
            className="font-medium text-brand-700 hover:underline"
          >
            {nouveau ? 'Revenir a la creation de compte' : 'Revenir a la connexion'}
          </Link>
        </>
      }
    >
      <form onSubmit={envoyer} noValidate className="mt-8 grid gap-4">
        <Input
          label="Code de verification"
          value={code}
          onChange={(valeur) => setCode(nettoyerCode(valeur))}
          erreur={erreurAffichee}
          placeholder="000000"
          // `inputMode` sort le pave numerique sur mobile ; `one-time-code`
          // permet a iOS et Chrome de proposer le code lu dans le SMS ou le mail.
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={LONGUEUR_CODE}
          autoFocus
          disabled={envoi}
          className="[&_input]:text-center [&_input]:text-lg [&_input]:tracking-[0.5em]"
        />

        {erreurApi && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
          >
            {erreurApi}
          </p>
        )}

        {info && (
          <p
            role="status"
            className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-xs text-brand-700"
          >
            {info}
          </p>
        )}

        <Button type="submit" size="lg" disabled={envoi} className="mt-2 w-full">
          {envoi ? 'Verification...' : 'Se connecter'}
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={renvoyer}
          disabled={attente > 0 || envoi}
          className="w-full"
        >
          {attente > 0 ? `Renvoyer un code dans ${attente} s` : 'Renvoyer un code'}
        </Button>
      </form>
    </AuthShell>
  )
}

export default VerifyCode
