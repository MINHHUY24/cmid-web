import type { HTMLAttributes, Ref } from 'react'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': HTMLAttributes<HTMLElement> & {
        ref?: Ref<HTMLElement>
        src: string
        poster?: string
        alt: string
        exposure?: string
        loading?: string
        reveal?: string
        ar?: boolean
        'ar-modes'?: string
        'ar-scale'?: string
        'xr-environment'?: string
      }
    }
  }
}
