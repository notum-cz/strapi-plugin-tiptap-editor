// Tests for SERVER-01: config validator
// Populated in Plan 02 after server/src/config/index.ts is implemented
import { describe, it } from 'vitest';

describe('config validator (SERVER-01)', () => {
  it.todo('throws for preset with invalid feature key, naming the bad key');
  it.todo('passes for valid preset { bold: true, heading: { levels: [1, 2] } }');
});
