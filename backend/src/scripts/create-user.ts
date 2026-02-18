import { UserModel } from '../models/User.js';
import { pool } from '../config/database.js';

interface UserArgs {
  email: string;
  name: string;
  password: string;
  role: 'ADMIN' | 'USER';
}

const parseArgs = (): UserArgs | null => {
  const args = process.argv.slice(2);
  const parsed: Partial<UserArgs> = { role: 'USER' };

  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    switch (flag) {
      case '--email':
      case '-e':
        parsed.email = value;
        break;
      case '--name':
      case '-n':
        parsed.name = value;
        break;
      case '--password':
      case '-p':
        parsed.password = value;
        break;
      case '--role':
      case '-r':
        if (value === 'ADMIN' || value === 'USER') {
          parsed.role = value;
        } else {
          console.error('Error: Role must be ADMIN or USER');
          return null;
        }
        break;
      case '--help':
      case '-h':
        printUsage();
        process.exit(0);
      default:
        console.error(`Unknown flag: ${flag}`);
        return null;
    }
  }

  if (!parsed.email || !parsed.name || !parsed.password) {
    console.error('Error: Missing required fields');
    printUsage();
    return null;
  }

  return parsed as UserArgs;
};

const printUsage = () => {
  console.log(`
Usage: npx tsx src/scripts/create-user.ts [options]

Options:
  -e, --email <email>       User email (required)
  -n, --name <name>         User display name (required)
  -p, --password <password> User password, min 8 chars (required)
  -r, --role <role>         ADMIN or USER (default: USER)
  -h, --help                Show this help message

Examples:
  npx tsx src/scripts/create-user.ts -e user@example.com -n "John Doe" -p secret123
  npx tsx src/scripts/create-user.ts --email admin@example.com --name "Admin" --password adminpass --role ADMIN
`);
};

const createUser = async () => {
  const args = parseArgs();
  if (!args) {
    process.exit(1);
  }

  if (args.password.length < 8) {
    console.error('Error: Password must be at least 8 characters');
    process.exit(1);
  }

  try {
    const existing = await UserModel.findByEmail(args.email);
    if (existing) {
      console.error(`Error: User with email ${args.email} already exists`);
      process.exit(1);
    }

    const user = await UserModel.create({
      email: args.email,
      name: args.name,
      password: args.password,
      role: args.role,
    });

    console.log('\nUser created successfully:');
    console.log(`  ID:    ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Name:  ${user.name}`);
    console.log(`  Role:  ${user.role}`);
  } catch (error: any) {
    console.error('Error creating user:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

createUser();
