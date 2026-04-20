import QRCode from 'qrcode';

export async function generateQRCode(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' },
  });
}

export function buildAssetQRData(asset: { id: string; code: string; name: string }): string {
  return JSON.stringify({
    id: asset.id,
    code: asset.code,
    name: asset.name,
    system: 'SMAVO-SMAN2CIBINONG',
  });
}
