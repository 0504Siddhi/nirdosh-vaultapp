import assert from 'assert';
import { runConsensusEngine } from './consensusService';
import type { IDocument } from '../models/store';

function doc(id: string, type: string, value: string | null, confidence = 0.9): IDocument {
  return { 
    _id: id, 
    userId: 'user', 
    docType: type, 
    title: type, 
    status: 'ready', 
    originalFilename: `${id}.json`, 
    storedFilename: `${id}.json`, 
    contentType: 'application/json', 
    size: 1, 
    needsReview: false, 
    createdAt: new Date(), 
    extractedFields: value === null ? [] : [{ 
      fieldKey: 'date_of_birth', // Updated to match consensusService expected key
      label: 'Date of Birth', 
      value, 
      normalized: value, 
      type: 'date', 
      page: 1, 
      confidence, 
      evidenceText: '' 
    }] 
  };
}

// 1. Array index access updated to target .fieldResults
let result = runConsensusEngine([doc('a', 'aadhaar', '2005-05-12'), doc('b', 'pan', '2005-05-12')]);
assert.equal(result.fieldResults[0].status, 'consistent');

result = runConsensusEngine([doc('a', 'aadhaar', '2005'), doc('b', 'birth_certificate', '2005-05-12')]);
assert.equal(result.fieldResults[0].status, 'possible_variant');
assert.equal(result.fieldResults[0].scenario, 'year_only_same_year');

result = runConsensusEngine([doc('a', 'aadhaar', '2005-05-12'), doc('b', 'pan', '2005-05-13')]);
assert.equal(result.fieldResults[0].status, 'conflicting_evidence');

// 2. 'not_comparable' tests updated to check the existence router
result = runConsensusEngine([doc('a', 'aadhaar', '2005-05-12'), doc('b', 'pan', null)]);
assert.equal(result.fieldResults.length, 0); // No consensus matrix entry
assert.equal(result.documentSpecificFields[0].value, '2005-05-12'); // Routed to metadata

result = runConsensusEngine([doc('a', 'aadhaar', '2005-05-12'), doc('b', 'pan', '2005-05-13', 0.3)]);
assert.equal(result.fieldResults.length, 0);
assert.equal(result.documentSpecificFields[0].value, '2005-05-12');

console.log('Consensus specification tests passed.');