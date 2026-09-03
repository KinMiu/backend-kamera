import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import * as mqtt from 'mqtt';

export interface MQTTCustomCameraPayload {
  id: string;
  name: string;
  is_active: boolean;
  source_url: string;
  target_url: string;
}

export interface MQTTEventPayload {
  action: 'UPSERT_CAMERA' | 'REMOVE_CAMERA' | 'SYNC_ALL';
  camera?: MQTTCustomCameraPayload;
  camera_id?: string;
}

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client: mqtt.MqttClient | null = null;

  onModuleInit() {
    this.connect();
  }

  onModuleDestroy() {
    this.disconnect();
  }

  private connect() {
    let brokerUrl = process.env.MQTT_BROKER || 'tcp://localhost:1883';
    // Convert tcp:// prefix to mqtt:// for MQTT.js if needed
    if (brokerUrl.startsWith('tcp://')) {
      brokerUrl = brokerUrl.replace(/^tcp:\/\//, 'mqtt://');
    }

    const username = process.env.MQTT_USERNAME;
    const password = process.env.MQTT_PASSWORD;
    const clientId =
      process.env.MQTT_CLIENT_ID ||
      `backend_server_${Math.random().toString(16).substring(2, 8)}`;

    this.logger.log(
      `Connecting to MQTT Broker: ${brokerUrl} (ClientId: ${clientId})...`,
    );

    try {
      const options: mqtt.IClientOptions = {
        clientId,
        reconnectPeriod: 5000,
        connectTimeout: 10000,
        clean: true,
      };

      if (username) {
        options.username = username;
      }
      if (password) {
        options.password = password;
      }

      this.client = mqtt.connect(brokerUrl, options);

      this.client.on('connect', () => {
        this.logger.log('Successfully connected to MQTT Broker');
      });

      this.client.on('error', (err) => {
        this.logger.error(`MQTT connection error: ${err.message}`);
      });

      this.client.on('reconnect', () => {
        this.logger.warn('Reconnecting to MQTT Broker...');
      });

      this.client.on('offline', () => {
        this.logger.warn('MQTT Client went offline');
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to initialize MQTT client: ${message}`);
    }
  }

  private disconnect() {
    if (this.client) {
      this.logger.log('Disconnecting MQTT Client...');
      this.client.end(true);
      this.client = null;
    }
  }

  /**
   * Publish camera upsert event to MQTT topics
   */
  async publishUpsertCamera(device: {
    id: string;
    name: string;
    rtspEndpoint: string;
    mediamtxEndpoint?: string | null;
  }) {
    const payload: MQTTEventPayload = {
      action: 'UPSERT_CAMERA',
      camera: {
        id: device.id,
        name: device.name,
        is_active: true,
        source_url: device.rtspEndpoint,
        target_url: device.mediamtxEndpoint || '',
      },
    };

    await this.publishToWorkerTopics(payload);
  }

  /**
   * Publish camera removal event to MQTT topics
   */
  async publishRemoveCamera(deviceId: string) {
    const payload: MQTTEventPayload = {
      action: 'REMOVE_CAMERA',
      camera_id: deviceId,
    };

    await this.publishToWorkerTopics(payload);
  }

  /**
   * Publish full sync request to MQTT topics
   */
  async publishSyncAll() {
    const payload: MQTTEventPayload = {
      action: 'SYNC_ALL',
    };

    await this.publishToWorkerTopics(payload);
  }

  private publishToWorkerTopics(payload: MQTTEventPayload): void {
    const primaryTopic =
      process.env.MQTT_WORKER_TOPIC || 'workers/worker_cabang_01/events';
    const broadcastTopic = process.env.MQTT_BROADCAST_TOPIC || 'workers/events';

    const message = JSON.stringify(payload);

    const topics = [primaryTopic];
    if (broadcastTopic && broadcastTopic !== primaryTopic) {
      topics.push(broadcastTopic);
    }

    for (const topic of topics) {
      this.publish(topic, message);
    }
  }

  private publish(topic: string, message: string) {
    if (!this.client || !this.client.connected) {
      this.logger.warn(
        `MQTT client is not connected. Message not published to topic [${topic}]: ${message}`,
      );
      return;
    }

    this.client.publish(topic, message, { qos: 1 }, (err) => {
      if (err) {
        this.logger.error(
          `Failed to publish message to topic [${topic}]: ${err.message}`,
        );
      } else {
        this.logger.log(
          `[MQTT] Published event to topic [${topic}]: ${message}`,
        );
      }
    });
  }
}
