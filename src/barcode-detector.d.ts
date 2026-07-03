// Type declarations for the native BarcodeDetector API
// https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector

type BarcodeFormat =
  | 'aztec'
  | 'code_128'
  | 'code_39'
  | 'code_93'
  | 'codabar'
  | 'data_matrix'
  | 'ean_13'
  | 'ean_8'
  | 'itf'
  | 'pdf417'
  | 'qr_code'
  | 'upc_a'
  | 'upc_e'
  | 'unknown'

interface BarcodeDetectorOptions {
  formats?: BarcodeFormat[]
}

interface DetectedBarcode {
  boundingBox: DOMRectReadOnly
  cornerPoints: { x: number; y: number }[]
  format: BarcodeFormat
  rawValue: string
}

declare class BarcodeDetector {
  constructor(options?: BarcodeDetectorOptions)
  static getSupportedFormats(): Promise<BarcodeFormat[]>
  detect(image: ImageBitmapSource): Promise<DetectedBarcode[]>
}

interface Window {
  BarcodeDetector: typeof BarcodeDetector
}
