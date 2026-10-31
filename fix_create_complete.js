const fs = require('fs');
const path = 'c:\\Users\\ZBOOK\\Documents\\TicketHub\\app\\events\\create\\page.tsx';
let c = fs.readFileSync(path, 'utf8');

// Check if success state already exists
if (!c.includes('const [success, setSuccess]')) {
  // Add success state after submitting state
  c = c.replace(
    "const [submitting, setSubmitting] = useState(false)",
    "const [submitting, setSubmitting] = useState(false)\n  const [success, setSuccess] = useState(false)\n  const [payError, setPayError] = useState<string | null>(null)"
  );
  fs.writeFileSync(path, c, 'utf8');
  console.log('Added success and payError state');
} else {
  console.log('Success state already exists');
}