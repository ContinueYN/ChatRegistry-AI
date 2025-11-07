export interface FormData {
  username: string
  email: string
  password: string
  confirmPassword: string
  phone: string
  gender: string
  hobbies: string[]
  otherHobby: string
  bio: string
  agreeTerms: boolean
}

export interface Props {
  show: boolean
  currentValue: string
}

export interface Emits {
  (e: 'update:show', value: boolean): void
  (e: 'save', value: string): void
}

export interface WatermarkConfig {
  mode: 'single' | 'tile'
  text: string
  fontFamily: string
  fontSize: number
  color: string
  opacity: number
  rotation: number
  position: WatermarkPosition
  tileSpacingX: number
  tileSpacingY: number
}

export type WatermarkPosition = 
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'