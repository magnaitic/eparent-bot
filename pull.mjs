// Pulls a student's data: home, attendance, homework, timetable, exams.
// Usage: npm run pull -- <studentId> [seasonId]
import { apiFromSession } from './src/api.mjs';

const student = process.argv[2];
const season = process.argv[3] || null;
if (!student) {
  console.error('Usage: npm run pull -- <studentId> [seasonId]   (get ids from `npm run me`)');
  process.exit(1);
}

const { api } = apiFromSession();
const show = (label, r) => {
  console.log(`\n===== ${label} (HTTP ${r.status}) =====`);
  console.log(JSON.stringify(r.data ?? r.raw, null, 2));
};

show('home', await api.home(student));
show('timetable', await api.timetable(student));
if (season) {
  show('attendance', await api.attendance(student, season));
  show('homework', await api.homework(student, season));
  show('exams', await api.exams(student, season));
} else {
  console.log('\n(skip attendance/homework/exams — pass a seasonId to include them)');
}
show('notifications', await api.notifications());
