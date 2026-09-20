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
        'camera-controls'?: string
        'touch-action'?: string
        'shadow-intensity'?: string
        'camera-orbit'?: string
        'min-camera-orbit'?: string
        'max-camera-orbit'?: string
        'field-of-view'?: string
        'min-field-of-view'?: string
        'max-field-of-view'?: string
        ar?: boolean
        'ar-modes'?: string
        'ar-scale'?: string
        'xr-environment'?: string
      }
    }
  }
}
