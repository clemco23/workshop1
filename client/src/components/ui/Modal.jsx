import { useEffect, useRef } from 'react'
import Icon from './Icon.jsx'
import { cn } from '../../lib/cn.js'

// Boite de dialogue basee sur <dialog> natif : le navigateur fournit le piege de
// focus, la touche Echap, le fond inerte et le retour du focus au declencheur.
// Le reimplementer a la main serait plus de code et moins accessible.
//
// `ouvert` pilote showModal()/close() ; l'evenement `close` du natif (Echap
// compris) remonte par `onClose`, donc l'etat du parent reste la source de verite.
function Modal({ ouvert, onClose, titre, description, children, footer, className }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialogue = ref.current
    if (!dialogue) return

    if (ouvert && !dialogue.open) {
      dialogue.showModal()
      // showModal() met le focus sur le premier element focusable, donc le bouton
      // de fermeture. On le pose plutot sur le champ marque `data-autofocus`,
      // pour que la saisie commence sans passer par la tabulation.
      dialogue.querySelector('[data-autofocus]')?.focus()
    }
    if (!ouvert && dialogue.open) dialogue.close()
  }, [ouvert])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      // Clic sur le fond : la cible est le <dialog> lui-meme, jamais son contenu.
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
      className={cn(
        'm-auto w-[min(36rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-0 shadow-lg',
        'backdrop:bg-slate-900/40',
        className,
      )}
    >
      <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold break-words text-slate-900">{titre}</h2>
          {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <Icon name="close" className="size-4" />
        </button>
      </header>

      <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>

      {footer && (
        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 px-5 py-4">
          {footer}
        </footer>
      )}
    </dialog>
  )
}

export default Modal
