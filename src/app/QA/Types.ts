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
  ID       string       `yaml:"id,omitempty" json:"id,omitempty"`
  Desc     string       `yaml:"description,omitempty" json:"description,omitempty"`
  Context  []string     `yaml:"context,omitempty" json:"context,omitempty"`
  Solution SolutionForm `yaml:"solution" json:"solution,omitempty"`
  Resolved bool         `yaml:"resolved,omitempty" json:"resolved,omitempty"`
}

// SolutionForm defines the solution
type SolutionForm struct {
  Type    SolutionFormType `yaml:"type,omitempty" json:"type,omitempty"`
  Default []string         `yaml:"default,omitempty" json:"default,omitempty"`
  Options []string         `yaml:"options,omitempty" json:"options,omitempty"`
  Answer  []string         `yaml:"answer" json:"answer"`
}
*/

type ProblemT = {
    id: string;
    description: string;
    context: Array<string>;
    solution: SolutionT;
    resolved: boolean;
};

type SolutionT = {
    type: string;
    default: Array<string>;
    options: Array<string>;
    answer: Array<string>;
};

export { ProblemT, SolutionT };
