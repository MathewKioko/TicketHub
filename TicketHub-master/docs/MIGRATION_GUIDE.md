# MongoDB Migration Guide

## Changes Made

The database has been migrated from PostgreSQL to MongoDB. Here are the key changes:

### Prisma Schema Changes

1. **Datasource Provider**: Changed from `postgresql` to `mongodb`
2. **ID Fields**: All models now use MongoDB ObjectIds with `@default(auto())` and `@map("_id")`
3. **Foreign Keys**: Converted to `@db.ObjectId` for reference fields
4. **Relations**: Kept Prisma relations (MongoDB doesn't enforce foreign keys at DB level)
5. **Removed**: 
   - `@db.Text` annotation (not needed for MongoDB)
   - `onDelete: Cascade` (MongoDB doesn't support cascading deletes)
   - Composite unique constraints (handled differently in MongoDB)
6. **Collection Names**: Added `@@map()` directives to specify collection names

### Database Setup

1. **Install MongoDB** (if using local):
   - Download from https://www.mongodb.com/try/download/community
   - Or use Docker: `docker run -d -p 27017:27017 mongo`

2. **Or use MongoDB Atlas** (cloud):
   - Sign up at https://www.mongodb.com/cloud/atlas
   - Create a free cluster
   - Get your connection string

3. **Update Environment Variables**:
   ```env
   # Local MongoDB
   DATABASE_URL="mongodb://localhost:27017/Ticket Hub"
   
   # MongoDB Atlas
   DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/Ticket Hub?retryWrites=true&w=majority"
   ```

4. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

5. **Push Schema to Database**:
   ```bash
   npx prisma db push
   ```

### Important Notes

- **No Data Migration Needed**: If you're starting fresh, this is fine. If you have existing PostgreSQL data, you'll need to export and transform it.
- **ObjectIds**: All IDs are now MongoDB ObjectIds (24-character hex strings)
- **Relations Still Work**: Prisma handles relations at the application level, so your existing code should work without changes
- **Indexes**: All indexes are preserved and will be created in MongoDB

### Testing the Migration

1. Start your MongoDB server (if local)
2. Run `npx prisma db push` to create collections
3. Run `npm run dev` and test the application
4. Use `npx prisma studio` to view your data

### Rollback (if needed)

If you need to rollback to PostgreSQL:
1. Change `provider = "mongodb"` back to `provider = "postgresql"` in `schema.prisma`
2. Remove `@db.ObjectId` annotations
3. Change `@default(auto())` back to `@default(cuid())`
4. Add back `@db.Text` for description fields
5. Add back `onDelete: Cascade` to relations
6. Update `DATABASE_URL` to PostgreSQL connection string
7. Run `npx prisma generate && npx prisma db push`

