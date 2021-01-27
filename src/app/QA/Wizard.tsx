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
import React from 'react';
import { Button, Spinner, Wizard, WizardFooter, WizardContextConsumer, AlertGroup } from '@patternfly/react-core';
import { MultiSelect } from './MultiSelect'
import { Select } from './Select'
import { Confirm } from './Confirm'
import { Input } from './Input'
import { Multiline } from './Multiline'
import { Password } from './Password'
import Yaml from 'js-yaml'
import queryString from 'query-string'

class QAWizard extends React.Component {
  constructor(props) {
    super(props);

    this.currSolution = [];
    this.changeSolution = (solution) => {
      this.currSolution = solution;
    }
    this.changeSolution.bind(this);

    this.getComp = (data) => {
      var comp;
      switch (data.solution.type) {
        case "MultiSelect":
            comp = ( <MultiSelect key={data.id} problem={data} changeSolution={this.changeSolution}/> )
            break;
        case "Select":
            comp = ( <Select key={data.id} problem={data} changeSolution={this.changeSolution}/> )
            break;
        case "Input":
            comp = ( <Input key={data.id} problem={data} changeSolution={this.changeSolution}/> )
            break; 
        case "Confirm":
            comp = ( <Confirm key={data.id} problem={data} changeSolution={this.changeSolution}/> )
            break;  
        case "Multiline":
            comp = ( <Multiline key={data.id} problem={data} changeSolution={this.changeSolution}/> )
            break;  
        case "Password":
            comp = ( <Password key={data.id} problem={data} changeSolution={this.changeSolution}/> )
            break;
        default:
            //Should not come here
            comp = ( <Spinner key={data.id} problem={data} changeSolution={this.changeSolution}/> )
            break;
      }
      return comp;
    }
    var localsteps = [{
        local: true,
        name: 'Get Started!',
        component: (<p>Move2Kube will ask you a few questions, if it requires any assistance. Click Next to start.</p>)
      }
    ];
    this.state = {
        aName: props.aName,
        aPlan: props.aPlan,
        aArtifactsName: props.aArtifactsName,
        steps: [ localsteps[0] ],
        disabled : props.disabled
    };

    this.closeWizard = () => {
        this.props.close();
        this.props.update();
    };

    this.getNextProblem = (activeStep, callback) => {
        fetch('/api/v1/applications/'+this.state.aName+"/targetartifacts/"+this.state.aArtifactsName+"/problems/current", 
          {
            headers: {
            'Content-Type': 'application/json'
            }
          }
        ).then(res => {
          if (res.status != 200) {
            this.setState({aArtifactsName:""});
            this.closeWizard();
            throw new Error('Execution done.');
          }
          return res;
        })
        .then(res => res.json())
        .then((data) => {
            var comp, step;
            if (data.solution) {
                step = {
                    local: false,
                    name: 'Dynamic '+data.id,
                    component: this.getComp(data)
                };
            } 
            var steps = this.state.steps;
            steps.forEach(step => {
              step.canJumpTo = false;
            });
            steps.push(step)
            this.setState( { currentQuestion: data, steps: steps, disabled: false }, () => {
              callback();
            });
        })
        .catch(console.log)
    }

    this.postSolution = (activeStep, callback) => {
        fetch('/api/v1/applications/'+this.state.aName+"/targetartifacts/"+this.state.aArtifactsName+"/problems/current/solution", 
        {
          method: 'POST',
          body: JSON.stringify(this.currSolution),
          headers: {
          'Content-Type': 'application/json'
          }
        }
        )
        .then((res) => {
          this.getNextProblem(activeStep,callback)
        })
        .catch(console.log)
    }

    this.getNextStep = (activeStep, callback) => {
      if (this.state.disabled) {
        return;
      }
      this.setState({ disabled: true });
      var lastlocalstepName = localsteps[localsteps.length-1].name;
      if (this.state.aArtifactsName != "new") {
        if (activeStep.local) {
          // Resuming a previous run
          this.getNextProblem(activeStep,callback);
        } else {
          this.postSolution(activeStep, callback);
        }
      } else if (activeStep.name == lastlocalstepName) {
        if (activeStep.handler) {
          activeStep.handler();
        }
        var formdata = new FormData();
        formdata.append("plan",Yaml.dump(this.state.aPlan));
        var url = '/api/v1/applications/'+this.state.aName+"/targetartifacts";
        const value=queryString.parse(location.search);
        const flag=value.debug;
        if(typeof flag !== "undefined") {
          if(flag === "true"){
            url += "?debug=true";
          }
        }
        fetch(url,
          {
            method: "POST",
            body: formdata
          }
        )
        .then(res => res.text())
        .then((artifacts) => {
            this.setState({ aArtifactsName: artifacts, disabled: false }, ()=> {this.getNextProblem(activeStep, callback);})
        })
        .catch(console.log)
      } else {
        //Move to next local step
        if (activeStep.handler) {
          activeStep.handler();
        }

        var newlocalstep = localsteps[this.state.steps.length]
        var steps = this.state.steps;
        this.changeSolution(newlocalstep.problem.solution.default)
        steps.forEach(step => {
          step.canJumpTo = false;
        });
        steps.push(newlocalstep)
        this.setState( { currentQuestion: newlocalstep.problem, steps: steps, disabled: false }, () => {
          callback();
        });
      }
    };
  }

  render() {
    const { steps } = this.state;

    const CustomFooter = (
      <WizardFooter>
        <WizardContextConsumer>
          {({ activeStep, goToStepByName, goToStepById, onNext, onBack, onClose }) => {
            return (
              <>
                <Button variant="primary" type="submit" onClick={() => this.getNextStep(activeStep, onNext)} disabled={this.state.disabled}>{this.state.disabled ? 'Processing...' : 'Next'}</Button>
                <Button variant="link" onClick={onClose}>
                  Cancel
                </Button>
              </>
            )}}
        </WizardContextConsumer>
      </WizardFooter>
    );

    return (
      <Wizard
        onClose={this.closeWizard}
        footer={CustomFooter}
        steps={steps}
        height={400}
      />
    );
  }
}

export { QAWizard }
