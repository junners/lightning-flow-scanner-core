import { assert, expect } from 'chai';
import 'mocha';
import * as core from '../src';
import CreateANewAccountWithChild from './testfiles/CreateANewAccountWithChild.json';
import CreateANewAccountImproved from './testfiles/CreateANewAccountImproved.json';

describe('When scanning multiple flows', () => {
    let flow: core.Flow;
    let flow2: core.Flow;
    let flows: core.Flow[];

    before('arrange', () => {
      // ARRANGE
      flow = new core.Flow({
        path: 'anypath',
        xmldata: CreateANewAccountWithChild,
      });
      flow2 = new core.Flow({
        path: 'anypath2',
        xmldata: CreateANewAccountImproved,
      });
      flows = [flow, flow2];
    });

  it('all should have results', () => {
    const ruleConfig = {
      rules:
      {
        DuplicateDMLOperation:
        {
          severity: 'error',
        },
        UnusedVariable:
        {
          severity: 'error',
        },
        FlowDescription:
        {
          severity: 'error',
        }
      }
      ,
      exceptions: 
        {
          CreateANewAccountWithChild: 
            { "DuplicateDMLOperation": ["ViewAccountId", "ViewAccountId_0"] },
          CreateANewAccountImproved: 
            { "UnusedVariable": ["createAccount2"] }
        }
      };
    const results: core.ScanResult[] = core.scan(flows, ruleConfig);
    expect(results.length).to.equal(2);
  });
});
