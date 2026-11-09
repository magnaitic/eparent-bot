// Shows the parent profile and the list of children (ids + season), via main/init.
// Usage: npm run me
import { apiFromSession } from './src/api.mjs';

const { api } = apiFromSession();
const r = await api.init();
console.log('HTTP', r.status);

const data = r.data || {};
const students = data.students || data?.data?.students || [];
if (students.length) {
  console.log(`\nStudents (${students.length}):`);
  for (const st of students) {
    // print the whole object so we can see the real id/season field names
    console.log('— ' + JSON.stringify(st));
  }
  console.log('\nUse an id/season above with:  npm run pull -- <studentId> [seasonId]');
} else {
  console.log('\nFull response:');
  console.log(JSON.stringify(data, null, 2));
}
