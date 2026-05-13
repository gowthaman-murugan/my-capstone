'use client'

interface AvatarProps {
  src?: string | null
  alt: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = { sm: 'h-7 w-7 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-12 w-12 text-base' }

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export function Avatar({ src, alt, size = 'md' }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizeMap[size]} rounded-full object-cover`}
      />
    )
  }
  return (
    <span
      className={`${sizeMap[size]} inline-flex items-center justify-center rounded-full bg-indigo-100 font-medium text-indigo-700`}
    >
      {getInitials(alt)}
    </span>
  )
}
