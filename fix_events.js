const fs = require('fs');
const path = 'c:\\Users\\ZBOOK\\Documents\\TicketHub\\app\\api\\events\\route.ts';
let c = fs.readFileSync(path, 'utf8');

const oldPOST = `export async function POST(request: NextRequest) {
  try {
    // Get current user - any authenticated user can create events
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const data = createEventSchema.parse(body)
    
    const organizerId = currentUser.id
    
    const event = await prisma.event.create({
      data: {
        ...data,
        date: new Date(data.date),
        endDate: data.endDate ? new Date(data.endDate) : null,
        organizerId: organizerId,
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

if (c.includes(oldPOST)) {
  c = c.replace(oldPOST, newPOST);
  fs.writeFileSync(path, c, 'utf8');
  console.log('SUCCESS: API route updated');
} else {
  console.log('ERROR: Could not find old POST function');
  console.log('Looking for:', oldPOST.substring(0, 100));
}