import { IRuleDefinition } from '../interfaces/IRuleDefinition';
import { Flow } from '../models/Flow';
import { FlowNode } from '../models/FlowNode';
import { FlowType } from '../models/FlowType';
import { RuleResult } from '../models/RuleResult';
import { RuleCommon } from '../models/RuleCommon';
import { ResultDetails } from '../models/ResultDetails';

export class DMLStatementInLoop extends RuleCommon implements IRuleDefinition {

  constructor() {
    super({
      name: 'DMLStatementInLoop',
      label: 'DML statement in a loop',
      description: "To prevent exceeding Apex governor limits, it is advisable to consolidate all your record-related operations, including creation, updates, or deletions, at the conclusion of the flow.",
      type: 'pattern',
      supportedTypes: [...FlowType.backEndTypes, ...FlowType.visualTypes],
      docRefs: [{ 'label': 'Flow Best Practices', 'path': 'https://help.salesforce.com/s/articleView?id=sf.flow_prep_bestpractices.htm&type=5' }],
      isConfigurable: false
    },
    );
  }

  public execute(flow: Flow): RuleResult {
    if (flow.type[0] === 'Survey') {
      return new RuleResult(this, []);
    }
    const dmlStatementTypes = ['recordLookups', 'recordDeletes', 'recordUpdates', 'recordCreates'];
    const flowElements: FlowNode[] = flow.elements.filter(node => node.metaType === 'node') as FlowNode[];
    const loopElements: FlowNode[] = flow.elements.filter(node => node.subtype === 'loops') as FlowNode[];
    const dmlInLoopIndexes: number[] = [];

    for (const loopElement of loopElements) {
      const startOfLoop = flowElements.findIndex(element => element.name === this.findStartOfLoopReference(loopElement));
      let reachedEndOfLoop = false;
      let indexesToProcess: number[] = [startOfLoop];
      const processedLoopElementIndexes: number[] = [];
      do {
        indexesToProcess = indexesToProcess.filter(index => !processedLoopElementIndexes.includes(index));
        if (indexesToProcess.length <= 0 || (indexesToProcess.length == 1 && indexesToProcess[0] == -1)) {
          break;
        }
        for (const [index, element] of flowElements.entries()) {
          if (indexesToProcess.includes(index)) {
            const connectors = [];
            for (const connector of element.connectors) {
              if (connector.reference) {
                connectors.push(connector);
              }
            }
            if (dmlStatementTypes.includes(element.subtype)) {
              dmlInLoopIndexes.push(index);
            }
            if (connectors.length > 0) {
              const elementsByReferences = flowElements.filter(anElement => connectors.map(c => c.reference).includes(anElement.name));
              for (const nextElement of elementsByReferences) {
                const nextIndex = flowElements.findIndex(anElement => nextElement.name === anElement.name);
                if ('loops' === nextElement.subtype) {
                  reachedEndOfLoop = true;
                } else if (!processedLoopElementIndexes.includes(nextIndex)) {
                  indexesToProcess.push(nextIndex);
                }
              }
            }
            processedLoopElementIndexes.push(index);
          }
        }
      } while (reachedEndOfLoop === false);
    }
    const dmlStatementsInLoops: FlowNode[] = [];
    for (const [index, element] of flowElements.entries()) {
      if (dmlInLoopIndexes.includes(index)) {
        dmlStatementsInLoops.push(element);
      }
    }
    let results = [];
    for (const det of dmlStatementsInLoops) {
      results.push(new ResultDetails(det));
    }
    return new RuleResult(this, results);
  }

  private findStartOfLoopReference(loopElement: FlowNode) {
    return loopElement.connectors.find(el => el.type === 'nextValueConnector').reference;
  }
}
