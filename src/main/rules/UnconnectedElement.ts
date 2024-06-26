import { RuleCommon } from '../models/RuleCommon';
import * as core from '../internals/internals';

export class UnconnectedElement extends RuleCommon implements core.IRuleDefinition {

  constructor() {
    super({
      name: 'UnconnectedElement',
      label: 'Unconnected Element',
      description: "To maintain the efficiency and manageability of your Flow, it's best to avoid including unconnected elements that are not in use.",
      supportedTypes: [...core.FlowType.backEndTypes, ...core.FlowType.visualTypes],
      docRefs: [],
      isConfigurable: false, 
      autoFixable: false
    });
  }

  public execute(flow: core.Flow): core.RuleResult {

    const flowElements: core.FlowNode[] = flow.elements.filter(node => node instanceof core.FlowNode) as core.FlowNode[];
    let indexesToProcess = [this.findStart(flowElements)];
    const processedElementIndexes: number[] = [];
    const unconnectedElementIndexes: number[] = [];
    if (indexesToProcess[0] && indexesToProcess[0] === -1 && !flow.startElementReference) {
      throw 'Can not find starting element';
    }
    if (indexesToProcess[0] && indexesToProcess[0] === -1 && flow.startElementReference) {
      indexesToProcess = [
        flowElements.findIndex(n => {
          return n.name == flow.startElementReference[0];
        })
      ];
    }
    do {
      indexesToProcess = indexesToProcess.filter(index => !processedElementIndexes.includes(index));
      if (indexesToProcess.length > 0) {
        for (const [index, element] of flowElements.entries()) {
          if (indexesToProcess.includes(index)) {
            const references: string[] = [];
            if (element.connectors && element.connectors.length > 0) {
              for (const connector of element.connectors) {
                if (connector.reference) {
                  references.push(connector.reference);
                }
              }
            }
            if (references.length > 0) {
              const elementsByReferences = flowElements.filter(anElement => references.includes(anElement.name));
              for (const nextElement of elementsByReferences) {
                const nextIndex = flowElements.findIndex(anElement => nextElement.name === anElement.name);
                if (!processedElementIndexes.includes(nextIndex)) {
                  indexesToProcess.push(nextIndex);
                }
              }
            }
            processedElementIndexes.push(index);
          }
        }
      } else {
        for (const index of flowElements.keys()) {
          if (!processedElementIndexes.includes(index)) {
            unconnectedElementIndexes.push(index);
          }
        }
      }
    } while ((processedElementIndexes.length + unconnectedElementIndexes.length) < flowElements.length);

    const processedElements = [];
    const unconnectedElements = [];
    for (const [index, element] of flowElements.entries()) {
      if (processedElementIndexes.includes(index)) {
        processedElements.push(element);
      } else if (unconnectedElementIndexes.includes(index)) {
        unconnectedElements.push(element);
      }
    }
    let results = [];
    for (const det of unconnectedElements) {
      results.push(new core.ResultDetails(det));
    }
    return new core.RuleResult(this, results);
  }

  private findStart(nodes: core.FlowElement[]) {
    return nodes.findIndex(n => {
      return n.subtype === 'start';
    });
  }


}
