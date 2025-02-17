/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { test, expect } from './playwright-test-fixtures';

test('should filter by file name', async ({ runInlineTest }) => {
  const result = await runInlineTest({
    'a.spec.ts': `pwt.test('fails', () => { expect(1).toBe(2); });`,
    'b.spec.ts': `pwt.test('fails', () => { expect(1).toBe(2); });`,
  }, undefined, undefined, { additionalArgs: ['a.spec.ts'] });
  expect(result.exitCode).toBe(1);
  expect(result.failed).toBe(1);
  expect(result.output).toContain('1) a.spec.ts');
});

test('should filter by folder', async ({ runInlineTest }) => {
  const result = await runInlineTest({
    'foo/x.spec.ts': `pwt.test('fails', () => { expect(1).toBe(2); });`,
    'foo/y.spec.ts': `pwt.test('fails', () => { expect(1).toBe(2); });`,
    'bar/x.spec.ts': `pwt.test('fails', () => { expect(1).toBe(2); });`,
    'bar/y.spec.ts': `pwt.test('fails', () => { expect(1).toBe(2); });`,
  }, undefined, undefined, { additionalArgs: ['bar'] });
  expect(result.exitCode).toBe(1);
  expect(result.failed).toBe(2);
  expect(result.output).toMatch(/bar[\\/]x.spec.ts/);
  expect(result.output).toMatch(/bar[\\/]y.spec.ts/);
});

test('should filter by line', async ({ runInlineTest }) => {
  const result = await runInlineTest({
    'foo/x.spec.ts': `
      pwt.test('one', () => { expect(1).toBe(2); });
      pwt.test('two', () => { expect(1).toBe(2); });
      pwt.test('three', () => { expect(1).toBe(2); });
      `,
    'foo/y.spec.ts': `pwt.test('fails', () => { expect(1).toBe(2); });`,
  }, undefined, undefined, { additionalArgs: ['x.spec.ts:6'] });
  expect(result.exitCode).toBe(1);
  expect(result.failed).toBe(1);
  expect(result.output).toMatch(/x\.spec\.ts.*two/);
});

test('should filter by line and column', async ({ runInlineTest }) => {
  const result = await runInlineTest({
    'foo/x.spec.js': `
      pwt.test('yes-full-match', () => { expect(1).toBe(1); });
          pwt.test('no-wrong-column', () => { expect(1).toBe(2); });
  pwt.test('yes-no-column-specified', () => { expect(1).toBe(1); });
  pwt.test('no-match', () => { expect(1).toBe(1); });
      pwt.test('yes-full-match-with-dirname', () => { expect(1).toBe(1); });
      `,
  }, undefined, undefined, { additionalArgs: ['x.spec.js:5:11', 'x.spec.js:6:99999', 'x.spec.js:7', 'foo/x.spec.js:9:11'] });
  expect(result.exitCode).toBe(0);
  expect(result.skipped).toBe(0);
  expect(result.passed).toBe(3);
  expect(result.report.suites[0].specs.map(spec => spec.title)).toEqual(['yes-full-match', 'yes-no-column-specified', 'yes-full-match-with-dirname']);
});

test('line should override focused test', async ({ runInlineTest }) => {
  const result = await runInlineTest({
    'foo/x.spec.ts': `
      pwt.test.only('one', () => { expect(1).toBe(2); });
      pwt.test('two', () => { expect(1).toBe(2); });
      pwt.test.only('three', () => { expect(1).toBe(2); });
      `,
    'foo/y.spec.ts': `pwt.test('fails', () => { expect(1).toBe(2); });`,
  }, undefined, undefined, { additionalArgs: ['x.spec.ts:6'] });
  expect(result.exitCode).toBe(1);
  expect(result.failed).toBe(1);
  expect(result.output).toMatch(/x\.spec\.ts.*two/);
});

test('should merge filtered line and filtered file', async ({ runInlineTest }) => {
  const result = await runInlineTest({
    'foo/x.spec.ts': `
      pwt.test('one', () => { expect(1).toBe(2); });
      pwt.test('two', () => { expect(1).toBe(2); });
      pwt.test('three', () => { expect(1).toBe(2); });
      `,
    'foo/y.spec.ts': `pwt.test('fails', () => { expect(1).toBe(2); });`,
  }, undefined, undefined, { additionalArgs: ['x.spec.ts:6', 'x.spec.ts'] });
  expect(result.exitCode).toBe(1);
  expect(result.failed).toBe(3);
});

test('should run nothing for missing line', async ({ runInlineTest }) => {
  const result = await runInlineTest({
    'foo/x.spec.ts': `
      pwt.test('one', () => { expect(1).toBe(2); });
      pwt.test('two', () => { expect(1).toBe(2); });
      pwt.test('three', () => { expect(1).toBe(2); });
      `,
    'foo/y.spec.ts': `pwt.test('fails', () => { expect(1).toBe(2); });`,
  }, undefined, undefined, { additionalArgs: ['x.spec.ts:10', 'y.spec.ts'] });
  expect(result.exitCode).toBe(1);
  expect(result.failed).toBe(1);
});

test('should focus a single nested test spec', async ({ runInlineTest }) => {
  const result = await runInlineTest({
    'foo.test.ts': `
      const { test } = pwt;
      test('pass1', ({}) => {});
      test.describe('suite-1', () => {
        test.describe('suite-2', () => {
          test('pass2', ({}) => {});
        });
      });
      test('pass3', ({}) => {});
    `,
    'bar.test.ts': `
      const { test } = pwt;
      test('pass3', ({}) => {});
    `,
    'noooo.test.ts': `
      const { test } = pwt;
      test('no-pass1', ({}) => {});
    `,
  }, {}, {}, { additionalArgs: ['foo.test.ts:9', 'bar.test.ts'] });
  expect(result.exitCode).toBe(0);
  expect(result.passed).toBe(2);
  expect(result.skipped).toBe(0);
  expect(result.report.suites[0].specs[0].title).toEqual('pass3');
  expect(result.report.suites[1].suites[0].suites[0].specs[0].title).toEqual('pass2');
});

test('should focus a single test suite', async ({ runInlineTest }) => {
  const result = await runInlineTest({
    'foo.test.ts': `
      const { test } = pwt;
      test('pass1', ({}) => {});
      test.describe('suite-1', () => {
        test.describe('suite-2', () => {
          test('pass2', ({}) => {});
          test('pass3', ({}) => {});
        });
      });
      test('pass4', ({}) => {});
    `,
    'bar.test.ts': `
      const { test } = pwt;
      test('no-pass1', ({}) => {});
    `,
  }, {}, {}, { additionalArgs: ['foo.test.ts:8'] });
  expect(result.exitCode).toBe(0);
  expect(result.passed).toBe(2);
  expect(result.skipped).toBe(0);
  expect(result.report.suites[0].suites[0].suites[0].specs[0].title).toEqual('pass2');
  expect(result.report.suites[0].suites[0].suites[0].specs[1].title).toEqual('pass3');
});