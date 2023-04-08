export default (api)=> {
  api.describe({
    config: {
      schema(joi) {
        return joi.object({
          host: joi.string().required(), // mqtt broker主机地址
          port: joi.number().required(), // mqtt broker端口
          protocol: joi.string().required(), // 协议
          path: joi.string(), // 路径
        });
      }
    },
    enableBy: api.EnableBy.config,
  })

  api.addRuntimePluginKey(() => ['mqtt']);
  api.addRuntimePlugin(() => [`${api.paths.absTmpPath}/plugin-mqtt/runtime.tsx`]);

  api.onGenerateFiles(()=> {
    const { host, port, protocol, path } = api.config.mqtt;

    //context.ts
    api.writeTmpFile({
      path: 'context.ts',
      content: `
import React from 'react';
export const MqttContext = React.createContext<any>(null);
      `
    })

    // Provider.tsx
    api.writeTmpFile({
      path: 'Provider.tsx',
      content: `
import React, { useState, useEffect } from 'react';
import mqtt from '${require.resolve('mqtt')}';
import { mqtt as mqttRuntimeConfig } from '@/app';
import { MqttContext } from './context';

export default function MqttProvider(props: any) {

  const [client, setClient] = useState(null);

  useEffect(()=> {
    const url = '${protocol}://${host}:${port}${path || ''}';
    setClient(mqtt(url, {}));
  }, [])

  useEffect(()=> {
    if (client) {
      client.on('connect', ()=> {
        if (mqttRuntimeConfig) {
          mqttRuntimeConfig.onConnected?.();
          if (mqttRuntimeConfig.topics) {
            client.subscribe(mqttRuntimeConfig.topics, {qos: mqttRuntimeConfig.qos || 1}, mqttRuntimeConfig.onSubscriber);
          }
        }
      });
      client.on('error', (err) => {
        mqttRuntimeConfig?.onError?.(err);
        client.end();
      });
      client.on('reconnect', () => {
        mqttRuntimeConfig?.onReconnect?.();
      });
      client.on('message', (topic, message) => {
        const payload = { topic, message: message.toString() };
        mqttRuntimeConfig?.onMessage?.(payload);
      });
    }
  }, [client]);

  return (
    <MqttContext.Provider value={client}>
      {props.children}
    </MqttContext.Provider>
  );
}
      `,
    });

    // runtime.tsx
    api.writeTmpFile({
      path: 'runtime.tsx',
      content: api.appData.appJS?.exports.includes('mqtt') ? `
import React from 'react';
import Provider from './Provider';

export function rootContainer (container) {
  return <Provider>{ container }</Provider>;
}
      ` : `
export function rootContainer (container) => container
      `
    });

    // index.tsx
    api.writeTmpFile({
      path: 'index.tsx',
      content: `
import React, { useContext } from 'react';
import mqtt from '${require.resolve('mqtt')}';
import { MqttContext } from './context';

export { mqtt };
export const useMqtt = ()=> useContext(MqttContext);
      `
    });
  })
  
}
