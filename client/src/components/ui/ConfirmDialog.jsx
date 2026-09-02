import { useState } from 'react'
import Modal from './Modal.jsx'
import Button from './Button.jsx'
import { messageErreur } from '../../lib/erreurs.js'

// Confirmation d'une action destructrice. Les suppressions du site passent
// toutes par ici : un `window.confirm()` ne peut ni afficher l'erreur du
// serveur, ni montrer l'attente pendant l'appel.
//
// Le composant tient l'appel lui-meme (`onConfirmer` est asynchrone) parce que
// l'attente et l'echec se lisent dans la boite, pas dans la page derriere : tant
// que le serveur n'a pas repondu, la boite reste ouverte et le bouton occupe.
// Elle ne se ferme qu'apres un succes — c'est la page qui decide ensuite quoi
// faire (naviguer, revalider).
function ConfirmDialog({
  ouvert,
  onClose,
  onConfirmer,
  titre,
  description,
  libelle = 'Supprimer',
  cas,
}) {
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState(null)

  const fermer = () => {
    if (envoi) return // pendant l'appel, la seule issue est la reponse du serveur
    setErreur(null)
    onClose()
  }

  async function confirmer() {
    if (envoi) return

    setEnvoi(true)
    setErreur(null)

    try {
      await onConfirmer()
      onClose()
    } catch (error) {
      setErreur(messageErreur(error, cas))
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <Modal
      ouvert={ouvert}
      onClose={fermer}
      titre={titre}
      footer={
        <>
          <Button variant="secondary" onClick={fermer} disabled={envoi}>
            Annuler
          </Button>
          <Button variant="danger" onClick={confirmer} disabled={envoi} data-autofocus>
            {envoi ? 'Suppression…' : libelle}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">{description}</p>
      <p className="mt-2 text-sm text-slate-500">Cette action est definitive.</p>

      {erreur && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {erreur}
        </p>
      )}
    </Modal>
  )
}

export default ConfirmDialog
