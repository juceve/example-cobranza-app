import { Payment, Loan, Client, PrinterConfig } from '../types';
import { soundEffects } from '../utils/audio';

export class ESCPOSBuilder {
  private buffer: number[] = [];
  private charsPerLine: number = 32; // Default 58mm: 32 chars, 80mm: 48 chars

  constructor(paperSize: '58mm' | '80mm' = '58mm') {
    this.charsPerLine = paperSize === '80mm' ? 48 : 32;
    this.init();
  }

  init() {
    this.buffer.push(0x1b, 0x40); // ESC @ Initialize
    return this;
  }

  align(alignment: 'left' | 'center' | 'right') {
    const val = alignment === 'center' ? 1 : alignment === 'right' ? 2 : 0;
    this.buffer.push(0x1b, 0x61, val); // ESC a n
    return this;
  }

  bold(enable: boolean = true) {
    this.buffer.push(0x1b, 0x45, enable ? 1 : 0); // ESC E n
    return this;
  }

  size(size: 'normal' | 'double_h' | 'double_w' | 'large') {
    let val = 0;
    if (size === 'double_h') val = 0x01;
    else if (size === 'double_w') val = 0x10;
    else if (size === 'large') val = 0x11;
    this.buffer.push(0x1d, 0x21, val); // GS ! n
    return this;
  }

  invert(enable: boolean = true) {
    this.buffer.push(0x1d, 0x42, enable ? 1 : 0); // GS B n
    return this;
  }

  text(str: string) {
    // Basic latin clean-up for ESC/POS standard code pages
    const cleaned = str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\x20-\x7E\n]/g, ' ');
    for (let i = 0; i < cleaned.length; i++) {
      this.buffer.push(cleaned.charCodeAt(i));
    }
    return this;
  }

  line(str: string = '') {
    this.text(str);
    this.buffer.push(0x0a); // LF
    return this;
  }

  divider(char: string = '-') {
    const dividerStr = char.repeat(this.charsPerLine);
    this.line(dividerStr);
    return this;
  }

  twoColumns(left: string, right: string) {
    const totalSpaces = this.charsPerLine - left.length - right.length;
    if (totalSpaces <= 0) {
      this.line(left);
      this.line(right.padStart(this.charsPerLine, ' '));
    } else {
      this.line(left + ' '.repeat(totalSpaces) + right);
    }
    return this;
  }

  feed(lines: number = 3) {
    this.buffer.push(0x1b, 0x64, lines); // ESC d n
    return this;
  }

  cut() {
    this.buffer.push(0x1d, 0x56, 0x41, 0x00); // GS V 65 0 Full Cut
    return this;
  }

  getUint8Array(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

class BluetoothPrinterService {
  private bluetoothDevice: any = null;
  private characteristic: any = null;
  private isConnecting: boolean = false;

  // Check if Web Bluetooth API is supported in current browser
  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  async connectBluetooth(): Promise<{ success: boolean; deviceName?: string; error?: string }> {
    if (!this.isSupported()) {
      return { success: false, error: 'Web Bluetooth no está soportado en este navegador. Utiliza Chrome en Android/PC o activa la simulación térmica.' };
    }

    try {
      this.isConnecting = true;
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { services: ['000018f0-0000-1000-8000-00805f9b34fb'] },
          { services: ['e7810a71-73ae-499d-8c15-faa9aef0c3f2'] },
          { services: ['49535343-fe7d-4ae5-8fa9-9fafd205e455'] },
          { services: ['0000ff00-0000-1000-8000-00805f9b34fb'] },
          { namePrefix: 'MPT' },
          { namePrefix: 'RPP' },
          { namePrefix: 'POS' },
          { namePrefix: 'Bluetooth' },
          { namePrefix: 'Thermal' },
          { namePrefix: 'Printer' },
          { namePrefix: 'MTP' },
          { namePrefix: 'XP-' },
        ],
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb',
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455',
          '0000ff00-0000-1000-8000-00805f9b34fb',
          '0000180a-0000-1000-8000-00805f9b34fb',
        ],
      });

      const server = await device.gatt.connect();
      this.bluetoothDevice = device;

      // Find writable characteristic
      const services = await server.getPrimaryServices();
      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            this.characteristic = char;
            break;
          }
        }
        if (this.characteristic) break;
      }

      this.isConnecting = false;
      return { success: true, deviceName: device.name || 'Impresora Bluetooth Térmica' };
    } catch (err: any) {
      this.isConnecting = false;
      return { success: false, error: err?.message || 'Conexión Bluetooth cancelada o fallida' };
    }
  }

  async disconnect() {
    if (this.bluetoothDevice && this.bluetoothDevice.gatt.connected) {
      this.bluetoothDevice.gatt.disconnect();
    }
    this.bluetoothDevice = null;
    this.characteristic = null;
  }

  isConnected(): boolean {
    return !!(this.bluetoothDevice && this.bluetoothDevice.gatt && this.bluetoothDevice.gatt.connected);
  }

  // Generate binary ESC/POS payload for Payment Receipt
  buildReceiptCommands(
    payment: Payment,
    client: Client,
    loan: Loan,
    config: PrinterConfig
  ): Uint8Array {
    const builder = new ESCPOSBuilder(config.paperSize);

    builder
      .align('center')
      .bold(true)
      .size('double_h')
      .line(config.businessName || 'SISTEMA DE COBRANZAS')
      .size('normal')
      .bold(false)
      .line(`RUC / NIT: ${config.taxId || '901.234.567-8'}`)
      .line(config.address || 'Calle Principal #450')
      .line(`Tel: ${config.phone || '+591 70012345'}`)
      .line(config.receiptHeader || 'COMPROBANTE DE PAGO OFICIAL')
      .divider('=')
      .align('left')
      .bold(true)
      .line(`RECIBO N: #${payment.receiptNumber}`)
      .bold(false)
      .twoColumns('FECHA:', new Date(payment.timestamp).toLocaleString('es-ES'))
      .twoColumns('COBRADOR:', payment.collectorName || 'Cobrador 01')
      .twoColumns('CANAL:', payment.paymentMethod.toUpperCase())
      .divider('-')
      .bold(true)
      .line('DATOS DEL CLIENTE:')
      .bold(false)
      .line(`Nombre: ${client.name}`)
      .line(`DNI/Doc: ${client.documentId}`)
      .line(`Telefono: ${client.phone}`)
      .line(`Direccion: ${client.address}`)
      .divider('-')
      .bold(true)
      .line('DETALLE DE CREDITO Y ABONO:')
      .bold(false)
      .twoColumns('Credito N:', loan.loanNumber)
      .twoColumns('Saldo Anterior:', `$ ${payment.previousBalance.toFixed(2)}`)
      .divider('.')
      .size('double_h')
      .bold(true)
      .twoColumns('MONTO PAGADO:', `$ ${payment.amount.toFixed(2)}`)
      .size('normal')
      .bold(false)
      .divider('.')
      .twoColumns('Cuota(s) Cobrada(s):', `#${payment.installmentsCovered.join(', #')}`)
      .bold(true)
      .twoColumns('NUEVO SALDO PENDIENTE:', `$ ${payment.newBalance.toFixed(2)}`)
      .bold(false);

    if (payment.isOfflineSync || payment.offlineToken) {
      builder
        .divider('-')
        .align('center')
        .bold(true)
        .line('[ PAGO REGISTRADO MODO OFFLINE ]')
        .line(`Token: ${payment.offlineToken || payment.id.slice(0, 10)}`)
        .bold(false);
    }

    builder
      .divider('=')
      .align('center')
      .line(config.receiptFooter || 'Gracias por su puntualidad')
      .line('Conserve este ticket como respaldo')
      .line('*** COBROMOVIL APP ***')
      .feed(4)
      .cut();

    return builder.getUint8Array();
  }

  // Send raw bytes to connected Bluetooth Printer in chunks (MTU 20-100 bytes)
  async printRawBytes(bytes: Uint8Array): Promise<{ success: boolean; message: string }> {
    soundEffects.playPrinterBuzz();

    if (!this.characteristic) {
      // If no real Bluetooth printer is connected, return success with simulated message
      return {
        success: true,
        message: 'Impresión térmica completada en simulador de hardware (58mm/80mm ESC/POS).',
      };
    }

    try {
      const CHUNK_SIZE = 64;
      for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
        const chunk = bytes.slice(i, i + CHUNK_SIZE);
        if (this.characteristic.writeValueWithoutResponse) {
          await this.characteristic.writeValueWithoutResponse(chunk);
        } else {
          await this.characteristic.writeValue(chunk);
        }
        // Small throttle delay for printer buffer
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
      return { success: true, message: 'Ticket impreso correctamente en impresora Bluetooth.' };
    } catch (err: any) {
      return { success: false, message: `Error enviando datos a la impresora: ${err.message}` };
    }
  }
}

export const bluetoothPrinter = new BluetoothPrinterService();
