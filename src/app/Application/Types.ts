/*
Copyright IBM Corporation 2020

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

// https://github.com/konveyor/move2kube/blob/main/types/plan/plan.go#L131-L136

interface IService {
    serviceName: string;
    translationType: string;
    containerBuildType: string;
}

interface IPlan {
    metadata: { name: string };
    spec: {
        inputs: {
            services: {
                [serviceName: string]: Array<IService>;
            };
        };
    };
}

function newPlan(): IPlan {
    return {
        metadata: { name: '' },
        spec: {
            inputs: {
                services: {},
            },
        },
    };
}

export { IPlan, IService, newPlan };
