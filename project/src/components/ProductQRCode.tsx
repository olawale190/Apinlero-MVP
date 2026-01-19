import { QRCodeSVG } from 'qrcode.react';
import { X, Download, Printer, QrCode } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  unit: string;
  stock_quantity: number;
  sku?: string;
}

interface ProductQRCodeProps {
  product: Product;
  onClose: () => void;
}

export default function ProductQRCode({ product, onClose }: ProductQRCodeProps) {
  // Generate SKU if not exists
  const sku = product.sku || `APL-${product.category?.toUpperCase().slice(0, 3) || 'GEN'}-${product.id.slice(0, 6).toUpperCase()}`;

  // QR data contains product info
  const qrData = JSON.stringify({
    id: product.id,
    sku: sku,
    name: product.name,
    price: product.price,
    unit: product.unit
  });

  const handleDownload = () => {
    const svg = document.getElementById('product-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = `QR-${product.name.replace(/\s+/g, '-')}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const svg = document.getElementById('product-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${product.name}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            .qr-container {
              text-align: center;
              border: 2px solid #ddd;
              padding: 20px;
              border-radius: 10px;
            }
            .product-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 10px;
              color: #1e3a5f;
            }
            .sku {
              font-size: 14px;
              color: #666;
              margin-bottom: 15px;
            }
            .price {
              font-size: 16px;
              font-weight: bold;
              color: #0d9488;
              margin-top: 15px;
            }
            @media print {
              body { margin: 0; }
              .qr-container { border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="product-name">${product.name}</div>
            <div class="sku">SKU: ${sku}</div>
            ${svgData}
            <div class="price">£${product.price.toFixed(2)} / ${product.unit}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-lg" style={{ color: '#1e3a5f' }}>
            Product QR Code
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <h4 className="font-semibold text-gray-800 mb-1">{product.name}</h4>
          <p className="text-sm text-gray-500 mb-4">SKU: {sku}</p>

          <div className="bg-white p-4 inline-block rounded-lg border-2 border-gray-200">
            <QRCodeSVG
              id="product-qr-code"
              value={qrData}
              size={180}
              level="H"
              includeMargin={true}
            />
          </div>

          <div className="mt-4">
            <p className="text-lg font-bold" style={{ color: '#0d9488' }}>
              £{product.price.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">per {product.unit}</p>
            <p className="text-sm text-gray-500 mt-2">
              Stock: {product.stock_quantity} units
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-4 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition"
          >
            <Download size={18} />
            Download
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition"
          >
            <Printer size={18} />
            Print
          </button>
        </div>
      </div>
    </div>
  );
}

// Small QR button component to add to product cards
export function QRCodeButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
      title="Generate QR Code"
    >
      <QrCode size={18} className="text-gray-600" />
    </button>
  );
}
