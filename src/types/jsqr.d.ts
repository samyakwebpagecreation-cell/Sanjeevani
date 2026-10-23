declare module 'jsqr' {
  export interface QRCodePoint {
    x: number;
    y: number;
  }
  export interface QRCode {
    binaryData: number[];
    data: string;
    chunks: any[];
    version: number;
    location: {
      topRightCorner: QRCodePoint;
      topLeftCorner: QRCodePoint;
      bottomRightCorner: QRCodePoint;
      bottomLeftCorner: QRCodePoint;
      topRightFinderPattern: QRCodePoint;
      topLeftFinderPattern: QRCodePoint;
      bottomLeftFinderPattern: QRCodePoint;
      bottomRightAlignmentPattern?: QRCodePoint;
    };
  }
  export default function jsQR(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options?: {
      inversionAttempts?: 'dontInvert' | 'onlyInvert' | 'attemptBoth' | 'invertFirst';
    }
  ): QRCode | null;
}
