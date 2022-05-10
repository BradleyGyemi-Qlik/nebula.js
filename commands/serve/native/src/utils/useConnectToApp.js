import { useCallback, useEffect, useState } from 'react';
import { useAtomValue, useAtom } from 'jotai';
import { fieldsAtom } from '../atoms/FieldsAndMeasuresAtom';
import enigmaSettingsAtom from '../atoms/enigmaSettingsAtom';
import config from './config.json';
import getFieldsData from './getFieldsData';

const schema = require('enigma.js/schemas/12.612.0.json');
const enigma = require('enigma.js');
const SessionUtilities = require('enigma.js/sense-utilities');

const useConnectToApp = (connectionRequested) => {
  const enigmaSettings = useAtomValue(enigmaSettingsAtom);
  const [, setFields] = useAtom(fieldsAtom);
  const [connection, setConnection] = useState(undefined);

  const doOpenApp = useCallback(async () => {
    let app;
    let error;
    try {
      if (!enigmaSettings) return;
      const url = SessionUtilities.buildUrl({
        host: enigmaSettings.tenantURL,
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
      const session = await globalSession.open();
      app = await session.openDoc(enigmaSettings.appId);
      const fd = await getFieldsData(app);
      setFields(fd);
    } catch (err) {
      error = err;
    }
    setConnection({ app, error });
  }, [enigmaSettings]);

  useEffect(() => {
    if (!connectionRequested) return;
    doOpenApp();
  }, [doOpenApp, enigmaSettings]);

  return connection;
};

export default useConnectToApp;
