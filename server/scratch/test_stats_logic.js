const ROLE_MAP = {
  'Frontend': /frontend|react|angular|vue|web/i,
  'Backend': /backend|node|python|java|golang|ruby|php/i
};
const ROLES_TO_TRACK = Object.keys(ROLE_MAP);

const activeRole = 'Frontend';
const andConditions = [
  { status: 'Open' },
  { title: { $regex: ROLE_MAP[activeRole] } }
];

console.log('Original andConditions:', JSON.stringify(andConditions, null, 2));

const statsBaseConditions = andConditions.filter(c => {
    // We want to remove the condition that was added for the active 'role'
    // so that the stats reflect counts for ALL roles within the other filters.
    if (!c.title || !c.title.$regex) return true;
    
    const regexStr = c.title.$regex.toString();
    console.log(`Checking regex: ${regexStr}`);
    
    const isRoleFilter = ROLES_TO_TRACK.some(r => {
        const mapRegexStr = ROLE_MAP[r].toString();
        const match = mapRegexStr === regexStr;
        console.log(`  Comparing with ${r}: ${mapRegexStr} -> Match: ${match}`);
        return match;
    });
    
    return !isRoleFilter;
});

console.log('Stats Base Conditions:', JSON.stringify(statsBaseConditions, null, 2));
