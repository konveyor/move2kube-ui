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

// https://github.com/konveyor/move2kube/blob/main/types/qaengine/problem.go#L52-L67
/*
// Problem defines the QA problem
type Problem struct {
	ID      string           `yaml:"id" json:"id"`
	Type    SolutionFormType `yaml:"type,omitempty" json:"type,omitempty"`
	Desc    string           `yaml:"description,omitempty" json:"description,omitempty"`
	Hints   []string         `yaml:"hints,omitempty" json:"hints,omitempty"`
	Options []string         `yaml:"options,omitempty" json:"options,omitempty"`
	Default interface{}      `yaml:"default,omitempty" json:"default,omitempty"`
	Answer  interface{}      `yaml:"answer,omitempty" json:"answer,omitempty"`
}
*/

type ProblemT = {
    id: string;
    type: string;
    description: string;
    hints: Array<string>;
    options: Array<string>;
    default: unknown;
    answer: unknown;
};

export { ProblemT };
