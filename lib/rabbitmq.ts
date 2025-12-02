import * as amqp from 'amqplib';

/**
 * RabbitMQ Bağlantı Yöneticisi
 * Singleton pattern ile bağlantı ve kanal yönetimi
 */

// Global değişkenler - Next.js/PM2 ortamında bağlantıyı cache'lemek için
let cachedConnection: amqp.Connection | null = null;
let cachedChannel: amqp.Channel | null = null;

/**
 * RabbitMQ kanalını getirir. Yoksa oluşturur.
 * Singleton pattern ile tekrar tekrar bağlantı açılmasını engeller.
 */
export async function getChannel(): Promise<amqp.Channel> {
  // Eğer kanal varsa ve açıksa, onu kullan
  if (cachedChannel) {
    return cachedChannel;
  }

  try {
    // Bağlantı yoksa veya kapanmışsa yeni bağlantı oluştur
    if (!cachedConnection) {
      const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
      console.log('[RabbitMQ] Yeni bağlantı oluşturuluyor...');
      const connection = await amqp.connect(rabbitmqUrl) as any;
      cachedConnection = connection;

      // Bağlantı kapandığında cache'i temizle
      connection.on('close', () => {
        console.log('[RabbitMQ] Bağlantı kapandı, cache temizleniyor.');
        cachedConnection = null;
        cachedChannel = null;
      });

      // Bağlantı hatası durumunda
      connection.on('error', (err: any) => {
        console.error('[RabbitMQ] Bağlantı hatası:', err);
        cachedConnection = null;
        cachedChannel = null;
      });
    }

    // Kanal oluştur
    console.log('[RabbitMQ] Yeni kanal oluşturuluyor...');
    const channel = await (cachedConnection as any).createChannel();
    cachedChannel = channel;

    // Kanal kapandığında cache'i temizle
    channel.on('close', () => {
      console.log('[RabbitMQ] Kanal kapandı, cache temizleniyor.');
      cachedChannel = null;
    });

    // Kanal hatası durumunda
    channel.on('error', (err: any) => {
      console.error('[RabbitMQ] Kanal hatası:', err);
      cachedChannel = null;
    });

    return channel;
  } catch (error) {
    console.error('[RabbitMQ] Bağlantı/Kanal oluşturma hatası:', error);
    // Cache'i temizle
    cachedConnection = null;
    cachedChannel = null;
    throw error;
  }
}

/**
 * Belirtilen kuyruğa mesaj gönderir
 * @param queueName - Kuyruk adı
 * @param data - Gönderilecek veri (object)
 */
export async function sendToQueue(
  queueName: string,
  data: object
): Promise<void> {
  try {
    // Kanal al
    const channel = await getChannel();

    // Kuyruğun var olduğundan emin ol
    // durable: true => RabbitMQ yeniden başlarsa kuyruk silinmez
    await channel.assertQueue(queueName, {
      durable: true,
    });

    // Mesajı gönder
    // persistent: true => Mesaj diske yazılır, kaybolmaz
    const message = Buffer.from(JSON.stringify(data));
    const sent = channel.sendToQueue(queueName, message, {
      persistent: true,
    });

    if (sent) {
      console.log(
        `[RabbitMQ] Mesaj kuyruğa gönderildi: ${queueName}`,
        data
      );
    } else {
      console.warn(
        `[RabbitMQ] Mesaj gönderildi ama buffer dolu olabilir: ${queueName}`
      );
    }
  } catch (error) {
    console.error(
      `[RabbitMQ] Kuyruğa mesaj gönderme hatası (${queueName}):`,
      error
    );
    throw error;
  }
}

/**
 * Bağlantıyı temiz bir şekilde kapatır
 * (Genellikle uygulama kapanırken kullanılır)
 */
export async function closeConnection(): Promise<void> {
  try {
    if (cachedChannel) {
      await cachedChannel.close();
      cachedChannel = null;
    }
    if (cachedConnection) {
      await (cachedConnection as any).close();
      cachedConnection = null;
    }
    console.log('[RabbitMQ] Bağlantı temiz bir şekilde kapatıldı.');
  } catch (error) {
    console.error('[RabbitMQ] Bağlantı kapatma hatası:', error);
  }
}
