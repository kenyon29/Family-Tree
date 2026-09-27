// Turns raw Airtable records into a normalized, easy-to-use shape.

function firstAttachmentUrl(field) {
  if (Array.isArray(field) && field.length > 0) {
    return field[0].thumbnails?.large?.url || field[0].url || null;
  }
  return null;
}

function firstLinked(field) {
  if (Array.isArray(field) && field.length > 0) return field[0];
  return null;
}

export function normalizePerson(record) {
  const f = record.fields || {};
  return {
    id: record.id,
    firstName: f['First Name'] || '',
    lastName: f['Last Name'] || '',
    birthDate: f['Birth Date'] || null,
    deathDate: f['Death Date'] || null,
    photoUrl: firstAttachmentUrl(f['Photo']),
    notes: f['Notes/Bio'] || '',
    fatherId: firstLinked(f['Father']),
    motherId: firstLinked(f['Mother']),
    showNotesOnPrint: !!f['Show Notes On Print'],
    showPhotoOnPrint: f['Show Photo On Print'] !== false,
  };
}

export function normalizeMarriage(record) {
  const f = record.fields || {};
  return {
    id: record.id,
    spouse1Id: firstLinked(f['Spouse 1']),
    spouse2Id: firstLinked(f['Spouse 2']),
    marriageDate: f['Marriage Date'] || null,
  };
}

export function fullName(person) {
  return [person.firstName, person.lastName].filter(Boolean).join(' ') || '(Unnamed)';
}

function yearOf(dateStr) {
  if (!dateStr) return null;
  const m = /^(\d{4})/.exec(dateStr);
  return m ? m[1] : null;
}

export function lifespan(person) {
  const b = yearOf(person.birthDate);
  const d = yearOf(person.deathDate);
  if (!b && !d) return '';
  return `${b || '?'}–${d || ''}`;
}

// Builds lookup indexes used by the tree layout algorithm.
export function buildFamilyIndex(peopleRecords, marriageRecords) {
  return buildIndexFromNormalized(peopleRecords.map(normalizePerson), marriageRecords.map(normalizeMarriage));
}

// Same as buildFamilyIndex, but takes already-normalized people/marriages
// (used to build a restricted index for a single branch's PDF export).
export function buildIndexFromNormalized(people, marriages) {
  const peopleById = new Map(people.map((p) => [p.id, p]));

  // childrenOf(personId) -> array of person ids where this person is father or mother
  const childrenOf = new Map();
  for (const p of people) {
    for (const parentId of [p.fatherId, p.motherId]) {
      if (parentId && peopleById.has(parentId)) {
        if (!childrenOf.has(parentId)) childrenOf.set(parentId, []);
        childrenOf.get(parentId).push(p.id);
      }
    }
  }

  // marriagesOf(personId) -> array of marriage records involving them
  const marriagesOf = new Map();
  for (const m of marriages) {
    for (const spouseId of [m.spouse1Id, m.spouse2Id]) {
      if (spouseId && peopleById.has(spouseId)) {
        if (!marriagesOf.has(spouseId)) marriagesOf.set(spouseId, []);
        marriagesOf.get(spouseId).push(m);
      }
    }
  }

  function otherSpouse(marriage, personId) {
    return marriage.spouse1Id === personId ? marriage.spouse2Id : marriage.spouse1Id;
  }

  // For a person, returns their partners (co-parents and/or explicit spouses),
  // each with an optional marriage record and the list of shared children.
  function getPartners(personId) {
    const partnerMap = new Map(); // partnerId -> { partnerId, marriage, childIds: [] }

    const children = childrenOf.get(personId) || [];
    for (const childId of children) {
      const child = peopleById.get(childId);
      const coParentId = child.fatherId === personId ? child.motherId : child.fatherId;
      const key = coParentId && peopleById.has(coParentId) ? coParentId : `__solo__${personId}`;
      if (!partnerMap.has(key)) {
        partnerMap.set(key, {
          partnerId: coParentId && peopleById.has(coParentId) ? coParentId : null,
          marriage: null,
          childIds: [],
        });
      }
      partnerMap.get(key).childIds.push(childId);
    }

    for (const m of marriagesOf.get(personId) || []) {
      const partnerId = otherSpouse(m, personId);
      if (!partnerId || !peopleById.has(partnerId)) continue;
      if (partnerMap.has(partnerId)) {
        partnerMap.get(partnerId).marriage = m;
      } else {
        partnerMap.set(partnerId, { partnerId, marriage: m, childIds: [] });
      }
    }

    // Sort: partnered groups (with a real partnerId) first, by marriage date then name;
    // "solo" (unknown other parent) groups last.
    return [...partnerMap.values()].sort((a, b) => {
      if (!a.partnerId && b.partnerId) return 1;
      if (a.partnerId && !b.partnerId) return -1;
      const da = a.marriage?.marriageDate || '';
      const db = b.marriage?.marriageDate || '';
      return da.localeCompare(db);
    });
  }

  function hasParentsInData(personId) {
    const p = peopleById.get(personId);
    if (!p) return false;
    return (!!p.fatherId && peopleById.has(p.fatherId)) || (!!p.motherId && peopleById.has(p.motherId));
  }

  const roots = people
    .filter((p) => !hasParentsInData(p.id))
    .sort((a, b) => (a.birthDate || '9999').localeCompare(b.birthDate || '9999'));

  return { people, marriages, peopleById, childrenOf, marriagesOf, getPartners, roots };
}

// Builds a restricted index containing only a person, their descendants, and
// spouses along the way - used for "Export Branch".
export function buildSubtreeIndex(index, rootPersonId) {
  const ids = new Set([rootPersonId]);
  const queue = [rootPersonId];
  while (queue.length > 0) {
    const id = queue.shift();
    for (const childId of index.childrenOf.get(id) || []) {
      if (!ids.has(childId)) {
        ids.add(childId);
        queue.push(childId);
      }
    }
  }
  const partnerIds = new Set();
  for (const id of ids) {
    for (const entry of index.getPartners(id)) {
      if (entry.partnerId) partnerIds.add(entry.partnerId);
    }
  }
  for (const id of partnerIds) ids.add(id);

  const people = index.people.filter((p) => ids.has(p.id));
  const subIndex = buildIndexFromNormalized(people, index.marriages);
  // Force the chosen person to be the (only) root, rather than re-deriving
  // roots from parent links (their real parents were excluded on purpose).
  subIndex.roots = [subIndex.peopleById.get(rootPersonId)];
  return subIndex;
}
