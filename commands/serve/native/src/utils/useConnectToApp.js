import { useCallback, useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import enigmaSettingsAtom from '../atoms/enigmaSettingsAtom';
import config from './config.json';

const schema = require('enigma.js/schemas/12.612.0.json');
const enigma = require('enigma.js');
const SessionUtilities = require('enigma.js/sense-utilities');

const useConnectToApp = (connectionRequested) => {
  const enigmaSettings = useAtomValue(enigmaSettingsAtom);
  const [connection, setConnection] = useState(undefined);

  const doOpenApp = useCallback(async () => {
    let app;
    let model;
    let layout;
    let error;
    console.log(enigmaSettings);
    try {
      if (!enigmaSettings) return;
      const url = SessionUtilities.buildUrl({
        host: enigmaSettings.tenant,
        port: config.port,
        secure: config.secure,
        ttl: config.ttl,
        route: `app/${enigmaSettings.appId}`,
      });
      const headers = enigmaSettings.apiKey ? { headers: { Authorization: `Bearer ${enigmaSettings.apiKey}` } } : {};
      const connecticonfig = {
        schema,
        url: encodeURI(url),
        createSocket: (_url) => new WebSocket(_url, null, headers),
      };

      const globalSession = await enigma.create(connecticonfig);
      console.log('globalSession:', globalSession);
      globalSession.on('traffic:sent', (data) => console.log('sent:', data));
      globalSession.on('traffic:received', (data) => console.log('received:', data));
      globalSession.on('closed', () => console.log('Session was closed, clean up!'));

      const session = await globalSession.open();
      console.log('session:', session);
      app = await session.openDoc(enigmaSettings.appId);
      model = await app.getObject(enigmaSettings.visId);
      layout = await model.getLayout();
      globalSession.close();
    } catch (err) {
      error = err;
      console.error('Failed to open app', JSON.stringify(error), err);
    }

    setConnection({ app, error, model, layout });
  }, [enigmaSettings]);

  useEffect(() => {
    if (!connectionRequested) return;
    doOpenApp();
  }, [doOpenApp, enigmaSettings]);

  return connection;
};

export default useConnectToApp;
