import { useState } from 'react'
import FLAGS from '../../data/flags'

export default function FlagSelector({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const selected = FLAGS.find((f) => f.code === value) || FLAGS[FLAGS.length - 1]

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors cursor-pointer w-full"
      >
        <span className="text-xl">{selected.code}</span>
        <span className="text-gray-400">{selected.name}</span>
        <span className="ml-auto text-gray-500">▼</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#1a1a2e] shadow-xl">
            {FLAGS.map((flag) => (
              <button
                key={flag.code}
                type="button"
                onClick={() => {
                  onChange(flag.code)
                  setOpen(false)
                }}
                className={`flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-white/10 transition-colors cursor-pointer ${
                  flag.code === value ? 'bg-white/10 text-white' : 'text-gray-400'
                }`}
              >
                <span className="text-xl">{flag.code}</span>
                <span>{flag.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
