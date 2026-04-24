const {exec} = require('child_process');
const {promisify} = require('util');
const ep = promisify(exec);

const scriptPath = 'i:/Tark-Shaastra LDCE Hackathon/NeuroByte-LDCE-Final/model/run_model.py';
const cmd = `python -W ignore "${scriptPath}" --attendance 50.0 --marks 30.0 --assignment 55`;

console.log('Simulating Next.js exec call...');
console.log('Command:', cmd);

ep(cmd).then(({stdout, stderr}) => {
  console.log('Raw stdout:', stdout.trim());
  if (stderr) console.log('Stderr:', stderr.trim());
  const out = JSON.parse(stdout.trim());
  const dbScore = Math.min(100, Math.max(0, Math.round(out.score)));
  const dbLabel = out.label;
  console.log('\n✅ Integration verified:');
  console.log('  ML score (raw):', out.score.toFixed(2));
  console.log('  DB score (clamped int):', dbScore);
  console.log('  DB label:', dbLabel);
  console.log('\nThis is what gets written to students.current_risk_score and students.risk_category');
}).catch(e => console.error('❌ ERROR:', e.message));
