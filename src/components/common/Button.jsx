export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'w-full rounded-xl px-6 py-3 text-center font-semibold text-base transition-all duration-200 active:scale-[0.97] cursor-pointer'
  const variants = {
    primary: 'bg-[#e94560] text-white shadow-lg shadow-[#e94560]/30 hover:brightness-110',
    secondary: 'bg-[#0f3460] text-white hover:brightness-110',
    outline: 'border-2 border-[#533483] text-[#533483] hover:bg-[#533483]/10',
  }

  return (
    <button className={`${base} ${variants[variant] ?? variants.primary} ${className}`} {...props}>
      {children}
    </button>
  )
}
