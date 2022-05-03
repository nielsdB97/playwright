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

import path from 'path';
import type { PlaywrightTestConfig } from '@playwright/test';
import { config as loadEnv } from 'dotenv';
loadEnv({ path: path.join(__dirname, '..', '..', '.env') });

const config: PlaywrightTestConfig = {
  globalSetup: path.join(__dirname, 'globalSetup'),
  testIgnore: '**\/fixture-scripts/**',
  timeout: 5 * 60 * 1000,
  retries: 0,
  reporter: process.env.CI ? 'dot' : [['list'], ['html', { open: 'on-failure' }]],
  forbidOnly: !!process.env.CI,
  workers: 1,
};

export default config;