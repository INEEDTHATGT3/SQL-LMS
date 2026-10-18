import assert from 'node:assert/strict';
import { mapToTables } from './er.js';

/* 1. Basic strong entity */
{
  const spec = {
    entities: [
      { id: 'emp', label: 'Employee', attrs: [
        { name: 'emp_id', key: true },
        { name: 'name' }
      ]}
    ],
    relationships: []
  };
  const res = mapToTables(spec);
  assert.ok(res.tables.length >= 1);
}

/* 2. Weak entity */
{
  const spec = {
    entities: [
      { id: 'dept', label: 'Department', attrs: [{ name: 'dept_id', key: true }] },
      { id: 'dep', label: 'Dependent', weak: true, attrs: [
        { name: 'dep_name', partialKey: true },
        { name: 'age' }
      ]}
    ],
    relationships: [
      { id: 'has', identifying: true, ends: [
        { entity: 'dept', card: '1' },
        { entity: 'dep', card: 'N' }
      ]}
    ]
  };
  const res = mapToTables(spec);
  assert.ok(res.tables.some(t => t.name === 'Dependent'));
}

/* 3. 1:N relationship */
{
  const spec = {
    entities: [
      { id: 'dept', label: 'Department', attrs: [{ name: 'dept_id', key: true }, { name: 'dname' }] },
      { id: 'emp', label: 'Employee', attrs: [{ name: 'emp_id', key: true }, { name: 'ename' }] }
    ],
    relationships: [
      { id: 'works', ends: [
        { entity: 'dept', card: '1' },
        { entity: 'emp', card: 'N' }
      ]}
    ]
  };
  const res = mapToTables(spec);
  assert.ok(res.tables.length >= 2);
}

/* 4. 1:1 with total participation */
{
  const spec = {
    entities: [
      { id: 'emp', label: 'Employee', attrs: [{ name: 'emp_id', key: true }] },
      { id: 'desk', label: 'Desk', attrs: [{ name: 'desk_id', key: true }] }
    ],
    relationships: [
      { id: 'assigned', ends: [
        { entity: 'emp', card: '1', total: true },
        { entity: 'desk', card: '1' }
      ]}
    ]
  };
  const res = mapToTables(spec);
  assert.ok(res.tables.length >= 1);
}

/* 5. M:N relationship */
{
  const spec = {
    entities: [
      { id: 'stud', label: 'Student', attrs: [{ name: 'sid', key: true }] },
      { id: 'course', label: 'Course', attrs: [{ name: 'cid', key: true }] }
    ],
    relationships: [
      { id: 'enroll', ends: [
        { entity: 'stud', card: 'M' },
        { entity: 'course', card: 'N' }
      ]}
    ]
  };
  const res = mapToTables(spec);
  assert.ok(res.tables.some(t => t.name.includes('enroll') || t.name.includes('Student') || t.name.includes('Course')));
}

/* 6. Multivalued attribute */
{
  const spec = {
    entities: [
      { id: 'emp', label: 'Employee', attrs: [
        { name: 'emp_id', key: true },
        { name: 'phone', multi: true }
      ]}
    ],
    relationships: []
  };
  const res = mapToTables(spec);
  assert.ok(res.tables.length >= 2);
}

/* 7. Composite attribute (flattened) */
{
  const spec = {
    entities: [
      { id: 'emp', label: 'Employee', attrs: [
        { name: 'emp_id', key: true },
        { composite: [{ name: 'street' }, { name: 'city' }], name: 'address' }
      ]}
    ],
    relationships: []
  };
  const res = mapToTables(spec);
  const empTable = res.tables.find(t => t.name === 'Employee');
  assert.ok(empTable);
}

/* 8. Recursive relationship */
{
  const spec = {
    entities: [
      { id: 'emp', label: 'Employee', attrs: [
        { name: 'emp_id', key: true },
        { name: 'name' }
      ]}
    ],
    relationships: [
      { id: 'manages', ends: [
        { entity: 'emp', card: '1', role: 'manager' },
        { entity: 'emp', card: 'N', role: 'subordinate' }
      ]}
    ]
  };
  const res = mapToTables(spec);
  assert.ok(res.tables.length >= 1);
}

/* 9. ISA (table-per-subclass) */
{
  const spec = {
    entities: [
      { id: 'person', label: 'Person', attrs: [
        { name: 'ssn', key: true },
        { name: 'name' }
      ]},
      { id: 'student', label: 'Student', attrs: [
        { name: 'major' }
      ]},
      { id: 'faculty', label: 'Faculty', attrs: [
        { name: 'rank' }
      ]}
    ],
    isa: [
      { parent: 'person', children: ['student', 'faculty'] }
    ]
  };
  const res = mapToTables(spec);
  assert.ok(res.tables.some(t => t.name === 'Student' || t.name === 'student'));
  assert.ok(res.tables.some(t => t.name === 'Faculty' || t.name === 'faculty'));
}

/* 10. GATE classic - minimum tables example */
{
  const spec = {
    entities: [
      { id: 'e1', label: 'E1', attrs: [{ name: 'a1', key: true }] },
      { id: 'e2', label: 'E2', attrs: [{ name: 'a2', key: true }] },
      { id: 'e3', label: 'E3', attrs: [{ name: 'a3', key: true }] }
    ],
    relationships: [
      { id: 'r1', ends: [
        { entity: 'e1', card: '1' },
        { entity: 'e2', card: 'N' }
      ]},
      { id: 'r2', ends: [
        { entity: 'e2', card: '1' },
        { entity: 'e3', card: 'N' }
      ]}
    ]
  };
  const res = mapToTables(spec);
  assert.ok(typeof res.minTables === 'number');
  assert.ok(res.minTables >= 3);
}

console.log('All ER engine tests passed');
