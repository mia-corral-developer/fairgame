export default function Input({ label, className = '', ...props }) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && <span className="text-sm font-medium text-gray-300">{label}</span>}
      <input
        className={`rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none transition-all duration-200 focus:border-[#e94560] focus:ring-1 focus:ring-[#e94560]/50 ${className}`}
        {...props}
      />
    </label>
  )
}
