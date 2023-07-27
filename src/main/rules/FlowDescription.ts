import { IRuleDefinition } from '../interfaces/IRuleDefinition';
import { Flow } from '../models/Flow';
import { FlowType } from '../models/FlowType';
import { RuleResult } from '../models/RuleResult';
import { RuleCommon } from '../models/RuleCommon';
import { RuleDefinitions } from '../store/RuleDefinitions';

export class FlowDescription extends RuleCommon implements IRuleDefinition {

  constructor() {
    super(RuleDefinitions.FlowDescription, 'flow', FlowType.allTypes);
  }

  public execute(flow: Flow): RuleResult {
    if (flow.type[0] === 'Survey') {
      return new RuleResult(false, this.name, 'flow', this.severity);
    }
    const missingFlowDescription = !flow.xmldata.description;
    return new RuleResult(missingFlowDescription, this.name, this.type, this.severity, 'undefined');
  }
}