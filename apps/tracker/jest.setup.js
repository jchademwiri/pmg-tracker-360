import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

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
