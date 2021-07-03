import * as rules from '../config/rules.json';
import {IRuleDefinition} from '../libs/IRuleDefinition';
import {Flow} from '../models/Flow';
import {FlowElement} from '../models/FlowElement';
import {FlowNode} from '../models/FlowNode';
import {RuleResult} from '../models/RuleResult';

export class UnconnectedElements implements IRuleDefinition{

  constructor() {
    const rule = rules.rules.find(rule => rule.name === 'DMLStatementInLoop');
    this.name = rule.name;
    this.label = rule.label;
    this.text = rule.text;
  }

  public name: string;
  public label: string;
  public text: string;

  public execute(flow: Flow) {
    const flowElements: FlowElement[] = flow.nodes.filter(node => node instanceof FlowElement) as FlowElement[];
    let indexesToProcess = [this.findStart(flowElements)];
    const processedElementIndexes: number[] = [];
    const unconnectedElementIndexes: number[] = [];
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
              const elementsByReferences = flowElements.filter(element => references.includes(element.name));
              for (const nextElement of elementsByReferences) {
                const nextIndex = flowElements.findIndex(element => nextElement.name === element.name);
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
    return new RuleResult('UnconnectedElements', 'pattern', unconnectedElements);
  }

  private findStart(nodes: FlowNode[]) {
    return nodes.findIndex(n => {
      return n.subtype === 'start';
    });
  }


}
