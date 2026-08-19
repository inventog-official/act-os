import { cn } from '@/lib/utils/cn'

export type GradientVariant = 'hero' | 'cosmic' | 'sunset' | 'aurora' | 'violet' | 'subtle'

interface GradientAtmosphereProps {
  variant?: GradientVariant
  className?: string
  intensity?: 'ultra-low' | 'low' | 'medium'
}

export function GradientAtmosphere({
  variant = 'hero',
  className,
  intensity = 'low',
}: GradientAtmosphereProps) {
  const opacityMap = {
    'ultra-low': 'opacity-40 sm:opacity-50',
    'low': 'opacity-60 sm:opacity-75',
    'medium': 'opacity-80 sm:opacity-90',
  }

  return (
    <div
      className={cn(
        'lp-atmosphere select-none',
        opacityMap[intensity],
        className
      )}
      aria-hidden="true"
    >
      {variant === 'hero' && (
        <>
          {/* Top-center electric violet */}
          <div
            className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[700px] sm:w-[950px] h-[550px] rounded-full blur-[130px]"
            style={{
              background: 'radial-gradient(circle, rgba(138, 43, 226, 0.22) 0%, rgba(90, 20, 180, 0.08) 50%, transparent 80%)',
              animation: 'lp-atm-drift-1 22s ease-in-out infinite',
            }}
          />
          {/* Magenta / hot pink center glow */}
          <div
            className="absolute top-[20%] left-[25%] -translate-x-1/2 w-[500px] sm:w-[650px] h-[500px] rounded-full blur-[140px]"
            style={{
              background: 'radial-gradient(circle, rgba(236, 72, 153, 0.16) 0%, rgba(219, 39, 119, 0.05) 55%, transparent 80%)',
              animation: 'lp-atm-drift-2 26s ease-in-out infinite',
            }}
          />
          {/* Warm orange / coral accent */}
          <div
            className="absolute top-[35%] right-[20%] translate-x-1/2 w-[450px] sm:w-[600px] h-[450px] rounded-full blur-[140px]"
            style={{
              background: 'radial-gradient(circle, rgba(249, 115, 22, 0.14) 0%, rgba(234, 88, 12, 0.04) 50%, transparent 75%)',
              animation: 'lp-atm-drift-3 20s ease-in-out infinite',
            }}
          />
          {/* Subtle cyan ambient bottom glow */}
          <div
            className="absolute top-[50%] left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] h-[400px] rounded-full blur-[150px]"
            style={{
              background: 'radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, transparent 70%)',
            }}
          />
        </>
      )}

      {variant === 'cosmic' && (
        <>
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[900px] h-[700px] rounded-full blur-[160px]"
            style={{
              background:
                'radial-gradient(circle at 30% 30%, rgba(168, 85, 247, 0.22) 0%, rgba(236, 72, 153, 0.15) 35%, rgba(249, 115, 22, 0.12) 65%, rgba(56, 189, 248, 0.08) 85%, transparent 100%)',
              animation: 'lp-atm-drift-1 28s ease-in-out infinite',
            }}
          />
        </>
      )}

      {variant === 'sunset' && (
        <>
          <div
            className="absolute top-1/2 left-[30%] -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[750px] h-[550px] rounded-full blur-[140px]"
            style={{
              background: 'radial-gradient(circle, rgba(249, 115, 22, 0.16) 0%, rgba(236, 72, 153, 0.12) 45%, rgba(147, 51, 234, 0.06) 75%, transparent 90%)',
              animation: 'lp-atm-drift-2 24s ease-in-out infinite',
            }}
          />
          <div
            className="absolute top-1/2 right-[25%] translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[700px] h-[500px] rounded-full blur-[150px]"
            style={{
              background: 'radial-gradient(circle, rgba(219, 39, 119, 0.14) 0%, rgba(139, 92, 246, 0.08) 55%, transparent 85%)',
              animation: 'lp-atm-drift-3 20s ease-in-out infinite',
            }}
          />
        </>
      )}

      {variant === 'aurora' && (
        <>
          <div
            className="absolute top-1/2 left-[35%] -translate-x-1/2 -translate-y-1/2 w-[650px] sm:w-[800px] h-[500px] rounded-full blur-[140px]"
            style={{
              background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, rgba(59, 130, 246, 0.10) 50%, rgba(147, 51, 234, 0.06) 80%, transparent 95%)',
              animation: 'lp-atm-drift-1 25s ease-in-out infinite',
            }}
          />
          <div
            className="absolute top-[40%] right-[30%] translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[650px] h-[450px] rounded-full blur-[140px]"
            style={{
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.08) 60%, transparent 85%)',
              animation: 'lp-atm-drift-2 22s ease-in-out infinite',
            }}
          />
        </>
      )}

      {variant === 'violet' && (
        <>
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[800px] h-[550px] rounded-full blur-[140px]"
            style={{
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.16) 0%, rgba(236, 72, 153, 0.10) 45%, rgba(59, 130, 246, 0.05) 75%, transparent 90%)',
              animation: 'lp-atm-drift-1 24s ease-in-out infinite',
            }}
          />
        </>
      )}

      {variant === 'subtle' && (
        <>
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] sm:w-[800px] h-[450px] rounded-full blur-[160px]"
            style={{
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.04) 0%, rgba(139, 92, 246, 0.05) 40%, transparent 75%)',
            }}
          />
        </>
      )}
    </div>
  )
}
