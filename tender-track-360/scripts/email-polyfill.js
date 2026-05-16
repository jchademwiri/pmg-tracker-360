import { WritableStream } from 'node:stream/web';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables for @t3-oss/env-nextjs validation
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Polyfill WritableStream for React 19 / React Email compatibility
// This fixes the "ReferenceError: WritableStream is not defined" error

if (!globalThis.ReadableStream) {
  globalThis.ReadableStream = ReadableStream;
}
if (!globalThis.WritableStream) {
  globalThis.WritableStream = WritableStream;
}
