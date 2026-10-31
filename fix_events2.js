const fs = require('fs');
const path = 'c:\\Users\\ZBOOK\\Documents\\TicketHub\\app\\api\\events\\route.ts';
const lines = fs.readFileSync(path, 'utf8').split('\n');

// Find the POST function start line
let postStart = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('export async function POST(request: NextRequest)')) {
    postStart = i;
    break;
  }
}

if (postStart === -1) {
  console.log('ERROR: Could not find POST function');
  process.exit(1);
}

// Find the end of POST function (the closing brace after the catch block)
// We'll replace from POST start to just before the closing brace of the function
let postEnd = -1;
let braceCount = 0;
let inPost = false;
for (let i = postStart; i < lines.length; i++) {
  if (lines[i].includes('export async function POST')) {
    inPost = true;
  }
  if (inPost) {
    braceCount += (lines[i].match(/\{/g) || []).length;
    braceCount -= (lines[i].match(/\}/g) || []).length;
    if (braceCount === 0 && i > postStart) {
      postEnd = i;
      break;
    }
  }
}

if (postEnd === -1) {
  console.log('ERROR: Could not find end of POST function');
  process.exit(1);
}

console.log(`Found POST function from line ${postStart + 1} to ${postEnd + 1}`);

const newPOST = `export async function POST(request: NextRequest) {
  try {
    // Get current user
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const data = createEventSchema.parse(body)
    
    const organizerId = currentUser.id
    
    // Check if user is verified organizer for auto-publish
    const user = await prisma.user.findUnique({
      where: { id: organizerId },
      select: { role: true, verified: true }
    })
    
    // Auto-publish if user is ADMIN or verified EVENT_OWNER/ORGANIZER
    const isAutoPublish = currentUser.role === 'ADMIN' ||
      (currentUser.role === 'EVENT_OWNER' && currentUser.verified === true) ||
      (currentUser.role === 'ORGANIZER' && currentUser.verified === true)

    const event = await prisma.event.create({
      data: {
        ...data,
        date: new Date(data.date),
        endDate: data.endDate ? new Date(data.endDate) : null,
        organizerId: organizerId,
        status: isAutoPublish ? 'PUBLISHED' : 'PENDING', // Auto-publish if verified
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })`;

// Replace lines postStart through postEnd
const newLines = [
  ...lines.slice(0, postStart),
  newPOST,
  ...lines.slice(postEnd + 1)
];

fs.writeFileSync(path, newLines.join('\n'), 'utf8');
console.log('SUCCESS: API route updated with auto-publish logic');
console.log(`Replaced lines ${postStart + 1} to ${postEnd + 1}`);