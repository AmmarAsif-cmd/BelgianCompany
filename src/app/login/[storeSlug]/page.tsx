'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Lock } from 'lucide-react'
import { verifyPin } from './actions'
import { Button } from '@/components/ui/Button'

const STORE_NAMES: Record<string, string> = {
  'stockport-road': 'Stockport Road',
  'sale':           'Sale',
}

const STORE_COLORS: Record<string, string> = {
  'stockport-road': '#5D4037',
  'sale':           '#8B5A3C',
}

export default function LoginPage() {
  const params    = useParams()
  const router    = useRouter()
  const storeSlug = params.storeSlug as string

  const storeName  = STORE_NAMES[storeSlug] ?? storeSlug
  const storeColor = STORE_COLORS[storeSlug] ?? '#3E2723'

  const [pin,     setPin]     = useState('')
  const [error,   setError]   = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await verifyPin(storeSlug, formData)
      if (result?.error) {
        setError(result.error)
      }
      // On success the server action redirects — no client-side navigation needed
    })
  }

  // PIN pad digits
  const digits = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  function handleDigit(d: string) {
    if (d === '⌫') {
      setPin((p) => p.slice(0, -1))
    } else if (d !== '' && pin.length < 4) {
      setPin((p) => p + d)
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#FFF8E7]">
      {/* Store header banner */}
      <div
        className="flex items-center gap-3 px-4 py-5"
        style={{ backgroundColor: storeColor }}
      >
        <Link href="/" className="text-white/80 hover:text-white p-1 -ml-1">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <div className="text-white font-bold text-lg leading-tight">
            🧇 The Belgian Waffle Company — {storeName}
          </div>
          <div className="text-white/70 text-xs">Enter your store PIN to continue</div>
        </div>
      </div>

      {/* PIN form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-16">
        <div className="w-full max-w-xs">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-full bg-[#3E2723]/10 flex items-center justify-center">
              <Lock size={26} className="text-[#3E2723]" />
            </div>
          </div>

          <h2 className="text-center text-xl font-bold text-[#3E2723] mb-1">Store PIN</h2>
          <p className="text-center text-sm text-[#3E2723]/60 mb-8">
            Ask your manager if you don&apos;t know the PIN.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Hidden input for form submission */}
            <input type="hidden" name="pin" value={pin} />

            {/* PIN display dots */}
            <div className="flex justify-center gap-4 mb-6">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 transition-colors ${
                    i < pin.length
                      ? 'bg-[#3E2723] border-[#3E2723]'
                      : 'bg-transparent border-[#3E2723]/30'
                  }`}
                />
              ))}
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 rounded-xl bg-[#C8102E]/10 border border-[#C8102E]/20 px-4 py-3 text-sm text-[#C8102E] text-center">
                {error}
              </div>
            )}

            {/* Numeric PIN pad */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {digits.map((d, i) => (
                <button
                  key={i}
                  type={d === '' ? 'button' : 'button'}
                  onClick={() => d !== '' && handleDigit(d)}
                  disabled={d === ''}
                  className={`
                    h-14 rounded-2xl text-xl font-semibold transition-all select-none
                    ${d === ''
                      ? 'invisible'
                      : d === '⌫'
                      ? 'bg-[#3E2723]/10 text-[#3E2723] hover:bg-[#3E2723]/20 active:scale-95'
                      : 'bg-white border border-[#3E2723]/15 text-[#3E2723] hover:bg-[#3E2723]/5 active:scale-95 shadow-sm'
                    }
                  `}
                >
                  {d}
                </button>
              ))}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={pin.length !== 4 || pending}
            >
              {pending ? 'Verifying…' : 'Enter Store'}
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}
