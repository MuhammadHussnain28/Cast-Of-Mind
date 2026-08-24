import { createContext, useContext } from 'react'

/**
 * Kept in its own file so Toast.jsx only exports components and Vite's
 * fast refresh keeps working.
 */
export const ToastContext = createContext(null)

/** Use in any component: const toast = useToast(); toast.success('Saved') */
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
