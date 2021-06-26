import {Flow} from '../models/Flow';
import {FlowElement} from '../models/FlowElement';

export class MissingNullHandler{

    public execute(flow: Flow) {

        const getOperations = ['recordLookups'];
        const getOperationElements: FlowElement[] = flow.nodes.filter(node => node.nodeType === 'element' && getOperations.includes(node.subtype)) as FlowElement[];
        const decisionElements: FlowElement[] = flow.nodes.filter(node => node.nodeType === 'element' && node.subtype === 'decisions') as FlowElement[];
        const getOperationsWithoutNullHandler = [];

        for(const getElement of getOperationElements){

            let nullCheckFound = false;
            let resultReference;
            // @ts-ignore
            if(getElement.element.storeOutputAutomatically){
                resultReference = getElement.name;
            } else {
                // @ts-ignore
                resultReference = getElement.element.outputReference;
            }

            for( const el of decisionElements){

                // @ts-ignore
                const rules = el.element.rules;
                for( const rule of rules){
                    for (const condition of rule.conditions){

                        const referenceFound = (condition.leftValueReference && condition.leftValueReference.length > 0 && condition.leftValueReference[0] === resultReference);
                        const nullOperator = (condition.operator && condition.operator.length > 0 && condition.operator[0] === 'IsNull');
                        const isFalse = (condition.rightValue && condition.rightValue.length > 0 && condition.rightValue[0].booleanValue && condition.rightValue[0].booleanValue.length > 0
                            && condition.rightValue[0].booleanValue[0].toLowerCase() === 'false');

                        if(
                            referenceFound && nullOperator && isFalse
                        ){
                            nullCheckFound = true;
                        }
                    }
                }
            }

            if (!nullCheckFound){
                getOperationsWithoutNullHandler.push(getElement);
            }
        }

        return getOperationsWithoutNullHandler;
    }
}