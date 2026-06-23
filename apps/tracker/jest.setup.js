import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import os from 'os';

function loadJestEnv() {
  let workspaceEnvPath = '';
  let dir = process.cwd();
  while (dir) {
    const potentialPath = path.join(dir, '.env.local');
    if (fs.existsSync(potentialPath)) {
      workspaceEnvPath = potentialPath;
      break;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }

  if (workspaceEnvPath) {
    dotenv.config({ path: workspaceEnvPath });
  } else {
    const globalEnvPath = path.join(os.homedir(), '.env.local');
    if (fs.existsSync(globalEnvPath)) {
      dotenv.config({ path: globalEnvPath });
    }
  }
}
loadJestEnv();

jest.setTimeout(60000);

import '@testing-library/jest-dom';


import 'jest-axe/extend-expect';
import { TextDecoder, TextEncoder } from 'util';

global.TextEncoder ??= TextEncoder;
global.TextDecoder ??= TextDecoder;
global.Request ??= class Request {};
global.Response ??= class Response {};
global.Headers ??= class Headers {};

global.crypto ??= {};
global.crypto.randomUUID ??= () => '00000000-0000-4000-8000-000000000000';
