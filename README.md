# umi-plugin-mqtt

> 一个集成了[mqtt.js](https://github.com/mqttjs/MQTT.js)功能的umi插件

## Install
```bash
pnpm add umi-plugin-mqtt
```

### 如何开启插件
```js
// .umirc.ts
export default {
  plugins: ['umi-plugin-mqtt'],
  mqtt: {
    host: '10.10.10.153', // mqtt broker主机地址
    port: 32083, // mqtt broker端口
    protocol: 'ws', // 协议
    path: '/mqtt',
  },
}
```

### 运行时配置
```js
// app.ts
export const mqtt = {
  options: {
    username: Cookies.get(KEYS.AUTH_TOKEN),
  },
  topics: ['t/todo', 't/biz'],
  qos: 2,
  onError: (err: any) => {
    console.error('mqtt error: ', err);
  },
};
```

### Example
```js
import React, { useEffect, useCallback } from 'react';
import { useMqtt } from '@umijs/max';

export default ()=> {
  const { client } = useMqtt();

  const handleMessage = useCallback((topic, message) => {
    console.log('handleMessage', topic, message.toString());
  }, []);
  
  useEffect(() => {
    client.subscribe('t/topic1', { qos: 2 });
    client.on('message', handleMessage);
    return () => {
      client.removeListener('message', handleMessage);
      client.unsubscribe('t/topic1');
    };
  }, []);
  
  return <div>MQTT</div>
}
```
