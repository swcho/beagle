import { X, AlertCircle, CheckCircle } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export interface ToastItem {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

interface Props {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}

export function Toast({ toasts, onDismiss }: Props): React.JSX.Element {
  return createPortal(
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-[10000]">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body
  )
}

function ToastItem({
  toast,
  onDismiss
}: {
  toast: ToastItem
  onDismiss: (id: string) => void
}): React.JSX.Element {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  const styles = {
    success: 'bg-green-900/90 border-green-700 text-green-200',
    error: 'bg-red-900/90 border-red-700 text-red-200',
    info: 'bg-zinc-800/90 border-zinc-600 text-zinc-200'
  }

  const Icon = toast.type === 'success' ? CheckCircle : AlertCircle

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-lg border shadow-xl max-w-sm text-sm ${styles[toast.type]}`}
    >
      <Icon size={15} className="shrink-0 mt-0.5" />
      <span className="flex-1">{toast.message}</span>
      <button onClick={() => onDismiss(toast.id)} className="shrink-0 opacity-60 hover:opacity-100">
        <X size={13} />
      </button>
    </div>
  )
}
