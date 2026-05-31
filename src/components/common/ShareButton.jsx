export default function ShareButton({ text = '', className = '' }) {
  async function handleShare() {
    if (navigator.share) {
      await navigator.share({ text })
    } else {
      await navigator.clipboard.writeText(text)
    }
  }

  return (
    <button
      onClick={handleShare}
      className={`rounded-xl bg-[#533483] px-6 py-3 font-semibold text-white shadow-lg shadow-[#533483]/30 transition-all duration-200 active:scale-[0.97] cursor-pointer ${className}`}
    >
      Compartir
    </button>
  )
}
