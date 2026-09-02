import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell from '../components/auth/AuthShell.jsx'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'
import Input from '../components/ui/Input.jsx'
import { requestCode } from '../api/auth.js'
import {
  LONGUEUR_NOM_MAX,
  messageErreur,
  normaliserEmail,
  validerEmail,
  validerNom,
} from '../lib/authForm.js'

// Creation de compte. Cote serveur c'est **le meme appel** que la connexion :
// POST /api/auth/request-code cree l'utilisateur quand l'email est inconnu. Il
// n'y a donc pas de champ de plus a remplir ici, et surtout pas de mot de passe
// a choisir ni a confirmer.
//
// Cette page existe quand meme, pour deux raisons : /signup est une adresse
// qu'on attend et qu'on partage, et un nouveau venu a besoin qu'on lui dise ce
// qui va se passer — pas du libelle « Connexion » qui suppose un compte deja la.
//
// Prenom et nom ne servent pas a l'authentification : ils remplissent
// `users.first_name` / `last_name`, qui portent le nom affiche dans la Topbar et
// l'auteur d'un portfolio public. Le serveur ne les applique qu'a la creation du
// compte — une demande de code sur un compte existant ne renomme personne — donc
// c'est bien ici, et nulle part ailleurs, qu'on peut les saisir aujourd'hui.
const VIDE = { firstName: '', lastName: '', email: '' }

function Signup() {
  const navigate = useNavigate()
  const [formulaire, setFormulaire] = useState(VIDE)
  const [touche, setTouche] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [erreurApi, setErreurApi] = useState(null)

  const setChamp = (champ) => (valeur) =>
    setFormulaire((etat) => ({ ...etat, [champ]: valeur }))

  const erreurs = {
    firstName: validerNom(formulaire.firstName, 'Prenom'),
    lastName: validerNom(formulaire.lastName, 'Nom'),
    email: validerEmail(formulaire.email),
  }
  const valide = Object.values(erreurs).every((erreur) => erreur == null)
  // Les erreurs de saisie n'apparaissent qu'apres une tentative : rougir des
  // champs que l'utilisateur n'a pas fini de remplir est du bruit.
  const affichee = (champ) => (touche ? erreurs[champ] : null)

  async function envoyer(event) {
    event.preventDefault()
    setTouche(true)
    if (!valide || envoi) return

    setEnvoi(true)
    setErreurApi(null)

    try {
      const adresse = normaliserEmail(formulaire.email)
      const reponse = await requestCode(adresse, {
        firstName: formulaire.firstName.trim(),
        lastName: formulaire.lastName.trim(),
      })
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
      description="Pas de mot de passe a choisir : on t'envoie un code a six chiffres pour confirmer que la boite est bien la tienne."
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
        {/* Prenom et nom sur une rangee : deux champs courts, et `min-w-0` est
            deja porte par Input, donc la grille ne deborde pas. */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Prenom"
            value={formulaire.firstName}
            onChange={setChamp('firstName')}
            erreur={affichee('firstName')}
            placeholder="Theo"
            autoComplete="given-name"
            maxLength={LONGUEUR_NOM_MAX}
            autoFocus
            disabled={envoi}
          />

          <Input
            label="Nom"
            value={formulaire.lastName}
            onChange={setChamp('lastName')}
            erreur={affichee('lastName')}
            placeholder="Marchand"
            autoComplete="family-name"
            maxLength={LONGUEUR_NOM_MAX}
            disabled={envoi}
          />
        </div>

        <Input
          label="Adresse email"
          type="email"
          value={formulaire.email}
          onChange={setChamp('email')}
          erreur={affichee('email')}
          placeholder="toi@exemple.fr"
          hint="C'est aussi a cette adresse qu'arriveront tes codes de connexion."
          autoComplete="email"
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
