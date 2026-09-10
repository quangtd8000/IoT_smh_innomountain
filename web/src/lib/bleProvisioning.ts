// Web Bluetooth Provisioning for ESP32 Smart Home Nodes
export const SERVICE_UUID = "12345678-1234-5678-1234-56789abcdef0";
export const CHAR_CONFIG_UUID = "12345678-1234-5678-1234-56789abcdef1";
export const CHAR_STATUS_UUID = "12345678-1234-5678-1234-56789abcdef2";

export interface BleWifiConfig {
  ssid: string;
  pass: string;
  broker?: string;
  user?: string;
  pass_mqtt?: string;
}

export interface BleStatusPayload {
  status: 'saving' | 'connecting' | 'connected' | 'error_invalid_ssid' | 'error_json' | 'error' | string;
  ip?: string;
  uid?: string;
  node_id?: number;
}

export const isWebBluetoothSupported = (): boolean => {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
};

export class BleProvisioner {
  private device: any = null;
  private server: any = null;
  private configChar: any = null;
  private statusChar: any = null;

  async scanDevice(): Promise<{ name: string; id: string }> {
    if (!isWebBluetoothSupported()) {
      throw new Error("Trình duyệt của bạn chưa hỗ trợ Web Bluetooth. Vui lòng dùng Chrome, Edge hoặc Brave trên máy tính/Android.");
    }

    try {
      this.device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { namePrefix: 'SmartHome' }
        ],
        optionalServices: [SERVICE_UUID]
      });

      return {
        name: this.device.name || 'SmartHome ESP32',
        id: this.device.id
      };
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        throw new Error("Bạn đã huỷ chọn thiết bị hoặc không tìm thấy thiết bị Bluetooth nào.");
      }
      throw err;
    }
  }

  async connectAndSendConfig(
    config: BleWifiConfig,
    onStatusUpdate: (payload: BleStatusPayload) => void
  ): Promise<BleStatusPayload> {
    if (!this.device) {
      throw new Error("Chưa chọn thiết bị Bluetooth.");
    }

    // Kết nối GATT Server
    this.server = await this.device.gatt.connect();

    // Lấy Service
    const service = await this.server.getPrimaryService(SERVICE_UUID);

    // Lấy Characteristic Config & Status
    this.configChar = await service.getCharacteristic(CHAR_CONFIG_UUID);
    this.statusChar = await service.getCharacteristic(CHAR_STATUS_UUID);

    // Lắng nghe phản hồi Notify từ ESP32
    return new Promise(async (resolve, reject) => {
      let resolved = false;

      const handleCharacteristicValueChanged = (event: any) => {
        const value = event.target.value;
        const decoder = new TextDecoder('utf-8');
        const jsonStr = decoder.decode(value);
        try {
          const data: BleStatusPayload = JSON.parse(jsonStr);
          onStatusUpdate(data);

          if (data.status === 'connected') {
            resolved = true;
            resolve(data);
          } else if (data.status.startsWith('error')) {
            resolved = true;
            reject(new Error(`Thiết bị báo lỗi: ${data.status}`));
          }
        } catch (e) {
          console.warn("[BLE parse status]", e);
        }
      };

      try {
        await this.statusChar.startNotifications();
        this.statusChar.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);

        // Gửi cấu hình Wi-Fi xuống ESP32.
        // Credential MQTT KHÔNG còn fallback hardcode ở đây — bắt buộc caller
        // phải lấy từ GET /homes/{id}/provision-config (backend cấp khi đã xác thực).
        const payload: BleWifiConfig = {
          ssid: config.ssid,
          pass: config.pass,
        };
        if (config.broker) payload.broker = config.broker;
        if (config.user) payload.user = config.user;
        if (config.pass_mqtt) payload.pass_mqtt = config.pass_mqtt;
        const payloadStr = JSON.stringify(payload);

        const encoder = new TextEncoder();
        const data = encoder.encode(payloadStr);
        if (this.configChar.writeValueWithoutResponse) {
          await this.configChar.writeValueWithoutResponse(data);
        } else {
          await this.configChar.writeValue(data);
        }
        onStatusUpdate({ status: 'saving' });

        // Timeout 25s nếu ESP32 không phản hồi
        setTimeout(() => {
          if (!resolved) {
            resolve({
              status: 'saved',
              uid: this.device.name?.replace('SmartHome-', 'esp32-node-').toLowerCase()
            });
          }
        }, 25000);
      } catch (err) {
        reject(err);
      }
    });
  }

  disconnect() {
    if (this.device && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
  }
}
