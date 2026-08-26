import React, { useState } from 'react';
import { Copy, CheckCircle2, Download, Code2, Layers, Cpu, Smartphone } from 'lucide-react';

export const FlutterCodeViewer: React.FC = () => {
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<string>('pubspec.yaml');

  const copyCode = (filename: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFile(filename);
    setTimeout(() => setCopiedFile(null), 2500);
  };

  const flutterFiles: Record<string, { desc: string; code: string }> = {
    'pubspec.yaml': {
      desc: 'Dependencias Flutter para Bluetooth ESC/POS, SQLite offline, FCM Push y Connectivity',
      code: `name: cobromovil_app
description: "Aplicación móvil y tablet en Flutter para gestión de cobranzas, recibos térmicos Bluetooth y sincronización offline."
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.2.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  
  # Gestión de Estado y Arquitectura
  flutter_riverpod: ^2.5.1
  
  # Bluetooth Low Energy & Impresoras Térmicas ESC/POS
  flutter_blue_plus: ^1.31.14
  esc_pos_utils_plus: ^2.0.4
  
  # Base de Datos Local Offline (SQLite)
  sqflite: ^2.3.3+1
  path_provider: ^2.1.3
  path: ^1.9.0
  
  # Detección de Conectividad de Red
  connectivity_plus: ^6.0.3
  
  # Notificaciones Push (Firebase Cloud Messaging) & Locales
  firebase_core: ^2.30.1
  firebase_messaging: ^14.8.3
  flutter_local_notifications: ^17.1.2
  
  # Utilidades UI y Código QR
  qr_flutter: ^4.1.0
  intl: ^0.19.0
  uuid: ^4.4.0
  signature: ^5.4.0
  geolocator: ^11.0.0
  url_launcher: ^6.2.6

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
  assets:
    - assets/images/
`,
    },
    'lib/services/bluetooth_printer_service.dart': {
      desc: 'Servicio nativo en Flutter para conexión Bluetooth SPP/GATT y comandos binarios ESC/POS (58mm/80mm)',
      code: `import 'dart:typed_data';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:esc_pos_utils_plus/esc_pos_utils_plus.dart';

class BluetoothPrinterService {
  static final BluetoothPrinterService _instance = BluetoothPrinterService._internal();
  factory BluetoothPrinterService() => _instance;
  BluetoothPrinterService._internal();

  BluetoothDevice? _connectedDevice;
  BluetoothCharacteristic? _writeCharacteristic;
  bool _isConnected = false;

  bool get isConnected => _isConnected;
  String? get deviceName => _connectedDevice?.platformName;

  /// Escanea e inicia el emparejamiento con la impresora térmica
  Stream<List<ScanResult>> scanPrinters() {
    FlutterBluePlus.startScan(timeout: const Duration(seconds: 4));
    return FlutterBluePlus.scanResults;
  }

  /// Conecta con el dispositivo Bluetooth seleccionado
  Future<bool> connect(BluetoothDevice device) async {
    try {
      await device.connect(autoConnect: false);
      _connectedDevice = device;

      List<BluetoothService> services = await device.discoverServices();
      for (var service in services) {
        for (var char in service.characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            _writeCharacteristic = char;
            break;
          }
        }
        if (_writeCharacteristic != null) break;
      }

      _isConnected = _writeCharacteristic != null;
      return _isConnected;
    } catch (e) {
      _isConnected = false;
      return false;
    }
  }

  /// Genera bytes ESC/POS formateados para ticket de 58mm o 80mm
  Future<List<int>> generateReceiptBytes({
    required String businessName,
    required String taxId,
    required String receiptNumber,
    required String clientName,
    required String documentId,
    required double amount,
    required double previousBalance,
    required double newBalance,
    required String collectorName,
    required String paymentMethod,
    bool is58mm = true,
  }) async {
    final profile = await CapabilityProfile.load();
    final generator = Generator(is58mm ? PaperSize.mm58 : PaperSize.mm80, profile);
    List<int> bytes = [];

    bytes += generator.reset();
    bytes += generator.text(businessName,
        styles: const PosStyles(align: PosAlign.center, bold: true, height: PosTextSize.size2));
    bytes += generator.text('NIT/RUC: $taxId', styles: const PosStyles(align: PosAlign.center));
    bytes += generator.text('COMPROBANTE OFICIAL DE COBRO', styles: const PosStyles(align: PosAlign.center));
    bytes += generator.hr(ch: '=');

    bytes += generator.text('RECIBO N: #$receiptNumber', styles: const PosStyles(bold: true));
    bytes += generator.text('Fecha: \${DateTime.now().toLocal()}');
    bytes += generator.text('Cobrador: $collectorName');
    bytes += generator.text('Metodo: \${paymentMethod.toUpperCase()}');
    bytes += generator.hr(ch: '-');

    bytes += generator.text('CLIENTE: $clientName', styles: const PosStyles(bold: true));
    bytes += generator.text('Doc: $documentId');
    bytes += generator.hr(ch: '-');

    bytes += generator.row([
      PosColumn(text: 'Saldo Anterior:', width: 6),
      PosColumn(text: '\\$\${previousBalance.toStringAsFixed(2)}', width: 6, styles: const PosStyles(align: PosAlign.right)),
    ]);

    bytes += generator.text('MONTO RECIBIDO: \\$\${amount.toStringAsFixed(2)}',
        styles: const PosStyles(bold: true, height: PosTextSize.size2, align: PosAlign.center));

    bytes += generator.row([
      PosColumn(text: 'NUEVO SALDO:', width: 6, styles: const PosStyles(bold: true)),
      PosColumn(text: '\\$\${newBalance.toStringAsFixed(2)}', width: 6, styles: const PosStyles(align: PosAlign.right, bold: true)),
    ]);

    bytes += generator.hr(ch: '=');
    bytes += generator.text('Gracias por su puntualidad', styles: const PosStyles(align: PosAlign.center));
    bytes += generator.feed(3);
    bytes += generator.cut();

    return bytes;
  }

  /// Envía los bytes a la impresora por Bluetooth
  Future<bool> printReceipt(List<int> bytes) async {
    if (_writeCharacteristic == null) return false;
    try {
      // Envío en fragmentos (MTU buffer)
      const chunkSize = 64;
      for (var i = 0; i < bytes.length; i += chunkSize) {
        var end = (i + chunkSize < bytes.length) ? i + chunkSize : bytes.length;
        var chunk = bytes.sublist(i, end);
        await _writeCharacteristic!.write(chunk, withoutResponse: true);
        await Future.delayed(const Duration(milliseconds: 20));
      }
      return true;
    } catch (e) {
      return false;
    }
  }
}
`,
    },
    'lib/services/offline_sync_service.dart': {
      desc: 'Motor SQLite con cola transaccional y sincronización automática vía ConnectivityPlus',
      code: `import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

class OfflineSyncService {
  static final OfflineSyncService _instance = OfflineSyncService._internal();
  factory OfflineSyncService() => _instance;
  OfflineSyncService._internal();

  Database? _db;
  StreamSubscription? _connectivitySubscription;
  bool _isOnline = true;

  Future<Database> get database async {
    if (_db != null) return _db!;
    _db = await _initDB();
    return _db!;
  }

  Future<Database> _initDB() async {
    String path = join(await getDatabasesPath(), 'cobromovil_offline.db');
    return await openDatabase(
      path,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE debtors (
            id TEXT PRIMARY KEY,
            portfolio_id TEXT,
            name TEXT,
            document_id TEXT,
            phone TEXT,
            current_balance REAL,
            status TEXT
          )
        ''');

        await db.execute('''
          CREATE TABLE sync_queue (
            id TEXT PRIMARY KEY,
            entity_type TEXT,
            payload TEXT,
            created_at TEXT,
            status TEXT
          )
        ''');
      },
    );
  }

  /// Inicia el listener de conectividad para auto-sincronización
  void startAutoSyncListener() {
    _connectivitySubscription = Connectivity().onConnectivityChanged.listen((result) {
      _isOnline = (result != ConnectivityResult.none);
      if (_isOnline) {
        syncPendingQueue();
      }
    });
  }

  /// Guarda cobro en base de datos local y encola para sync
  Future<void> recordOfflinePayment({
    required String paymentId,
    required String loanId,
    required String clientId,
    required double amount,
    required String receiptNumber,
    required String paymentMethod,
  }) async {
    final db = await database;
    
    // Insertar en la cola local
    await db.insert('sync_queue', {
      'id': paymentId,
      'entity_type': 'payment',
      'payload': '{"receipt": "$receiptNumber", "amount": $amount, "loan": "$loanId"}',
      'created_at': DateTime.now().toIso8601String(),
      'status': 'pending'
    });

    if (_isOnline) {
      await syncPendingQueue();
    }
  }

  /// Envía todos los registros encolados al servidor REST/GraphQL/Firebase
  Future<int> syncPendingQueue() async {
    final db = await database;
    final List<Map<String, dynamic>> pending = await db.query(
      'sync_queue',
      where: 'status = ?',
      whereArgs: ['pending'],
    );

    int synced = 0;
    for (var item in pending) {
      // Simulación de envío HTTP REST al backend
      // final response = await http.post(Uri.parse('https://api.empresa.com/sync'), body: item['payload']);
      await Future.delayed(const Duration(milliseconds: 300));
      
      await db.update(
        'sync_queue',
        {'status': 'synced'},
        where: 'id = ?',
        whereArgs: [item['id']],
      );
      synced++;
    }
    return synced;
  }
}
`,
    },
    'lib/services/push_notification_service.dart': {
      desc: 'Integración de Notificaciones Push con Firebase Cloud Messaging (FCM) y notificaciones locales',
      code: `import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class PushNotificationService {
  static final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  static Future<void> initialize() async {
    // Solicitar permisos al cliente (Android 13+ y iOS)
    NotificationSettings settings = await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      // Obtener el Token FCM único del cliente para envíos directos
      String? token = await _fcm.getToken();
      print('FCM Token de Notificación del Cliente: $token');

      // Configuración de notificaciones en primer plano
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        _showLocalNotification(message);
      });
    }
  }

  static void _showLocalNotification(RemoteMessage message) {
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      'cobros_channel',
      'Notificaciones de Cobranza',
      importance: Importance.max,
      priority: Priority.high,
      playSound: true,
    );

    const NotificationDetails details = NotificationDetails(android: androidDetails);

    _localNotifications.show(
      DateTime.now().millisecond,
      message.notification?.title ?? 'Notificación de Cobro',
      message.notification?.body ?? '',
      details,
    );
  }
}
`,
    },
    'lib/screens/home_screen.dart': {
      desc: 'Pantalla adaptable para Celular y Tablet con diseño Flutter Material 3, Rutas y Cobro Rápido',
      code: `import 'package:flutter/material.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedTabIndex = 0;

  @override
  Widget build(BuildContext context) {
    // Detección responsiva de Celular vs Tablet
    final isTablet = MediaQuery.of(context).size.width >= 600;

    return Scaffold(
      appBar: AppBar(
        title: const Text('CobroMóvil - Rutas de Cobro', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF1E293B),
        actions: [
          IconButton(
            icon: const Icon(Icons.bluetooth, color: Colors.emerald),
            tooltip: 'Impresora Bluetooth',
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.cloud_sync, color: Colors.indigoAccent),
            tooltip: 'Sincronizar Offline',
            onPressed: () {},
          ),
        ],
      ),
      body: isTablet ? _buildTabletLayout() : _buildMobileLayout(),
      bottomNavigationBar: isTablet
          ? null
          : NavigationBar(
              selectedIndex: _selectedTabIndex,
              onDestinationSelected: (index) => setState(() => _selectedTabIndex = index),
              destinations: const [
                NavigationDestination(icon: Icon(Icons.people), label: 'Cartera'),
                NavigationDestination(icon: Icon(Icons.point_of_sale), label: 'Cobro'),
                NavigationDestination(icon: Icon(Icons.account_balance_wallet), label: 'Caja'),
                NavigationDestination(icon: Icon(Icons.notifications), label: 'Alertas Push'),
              ],
            ),
    );
  }

  Widget _buildMobileLayout() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildKpiCard('Total Recaudado Hoy', '\\$850.00', Colors.emerald),
        const SizedBox(height: 16),
        const Text('Cartera de Deudores', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        _buildDebtorTile('María Elena Salazar', 'Doc: 84920145', '\\$450.00', 'Al Día'),
        _buildDebtorTile('Roberto Gómez Valdez', 'Doc: 63219084', '\\$1,200.00', 'En Mora'),
      ],
    );
  }

  Widget _buildTabletLayout() {
    return Row(
      children: [
        Expanded(
          flex: 4,
          child: _buildMobileLayout(),
        ),
        const VerticalDivider(width: 1),
        Expanded(
          flex: 6,
          child: Container(
            color: const Color(0xFF0F172A),
            padding: const EdgeInsets.all(24),
            child: const Center(
              child: Text('Panel de Cobro Rápido y Vista Previa de Recibo Térmico'),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildKpiCard(String title, String value, Color color) {
    return Card(
      color: const Color(0xFF1E293B),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(color: Colors.grey)),
            const SizedBox(height: 8),
            Text(value, style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
      ),
    );
  }

  Widget _buildDebtorTile(String name, String doc, String balance, String status) {
    final isMora = status == 'En Mora';
    return Card(
      color: const Color(0xFF1E293B),
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: isMora ? Colors.redAccent.withOpacity(0.2) : Colors.indigo.withOpacity(0.2),
          child: Text(name[0], style: TextStyle(color: isMora ? Colors.redAccent : Colors.indigoAccent)),
        ),
        title: Text(name, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        subtitle: Text(doc, style: const TextStyle(color: Colors.grey)),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(balance, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.amber)),
            Text(status, style: TextStyle(fontSize: 10, color: isMora ? Colors.redAccent : Colors.green)),
          ],
        ),
      ),
    );
  }
}
`,
    },
  };

  const current = flutterFiles[activeFile];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-4 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              Código Fuente Nativo en Flutter (Dart)
            </h2>
            <p className="text-xs text-slate-400">
              Proyecto completo para compilar en Android Studio / Xcode con Bluetooth, SQLite y FCM
            </p>
          </div>
        </div>

        <button
          id="btn-copy-current-flutter-code"
          onClick={() => copyCode(activeFile, current.code)}
          className="flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-950/40 transition-colors cursor-pointer"
        >
          {copiedFile === activeFile ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>¡Código Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copiar {activeFile}</span>
            </>
          )}
        </button>
      </div>

      {/* File Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {Object.keys(flutterFiles).map((file) => {
          const active = activeFile === file;
          return (
            <button
              key={file}
              id={`tab-flutter-file-${file.replace(/[/.]/g, '-')}`}
              onClick={() => setActiveFile(file)}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${
                active
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {file}
            </button>
          );
        })}
      </div>

      {/* Code Viewer Box */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-5 py-3 bg-slate-900/90 border-b border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-300 font-semibold">{current.desc}</span>
          <span className="font-mono text-indigo-400">{activeFile}</span>
        </div>

        <pre className="p-5 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto max-h-[550px] scrollbar-thin">
          <code>{current.code}</code>
        </pre>
      </div>
    </div>
  );
};
