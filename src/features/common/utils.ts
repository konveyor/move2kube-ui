/*
Copyright IBM Corporation 2023

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import {v4 as uuidv4} from 'uuid';

export const getUUID = (): string => uuidv4();

export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(() => resolve(), ms));

export const normalizeFilename = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]/g, '-');

type MyErr = {
  data: {
    error: {
      description: string;
    }
  }
}

export const extractErrMsg = (err: MyErr | unknown): string => (err as MyErr)?.data?.error?.description ?? JSON.stringify(err);
