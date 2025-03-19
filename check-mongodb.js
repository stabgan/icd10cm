// Script to check if MongoDB is running
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

async function checkMongoDBRunning() {
  const command = os.platform() === 'win32' 
    ? 'netstat -ano | findstr "LISTENING" | findstr "27017"'
    : 'lsof -i:27017';

  try {
    const { stdout } = await execAsync(command);
    return stdout.trim() !== '';
  } catch (error) {
    return false;
  }
}

async function startMongoDB() {
  console.log('MongoDB does not appear to be running. Attempting to start...');
  
  if (os.platform() === 'win32') {
    // Windows: Try to start MongoDB as a service
    try {
      console.log('Attempting to start MongoDB Windows service...');
      await execAsync('net start MongoDB');
      console.log('MongoDB service started successfully');
      return true;
    } catch (error) {
      console.error('Failed to start MongoDB service:', error.message);
      console.log('\nPlease make sure MongoDB is installed as a Windows service.');
      console.log('You can download MongoDB from: https://www.mongodb.com/try/download/community');
      console.log('Instructions to install as a service: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/');
      return false;
    }
  } else if (os.platform() === 'darwin') {
    // macOS: Try to start MongoDB using brew
    try {
      console.log('Attempting to start MongoDB with Homebrew...');
      await execAsync('brew services start mongodb-community');
      console.log('MongoDB started successfully');
      return true;
    } catch (error) {
      console.error('Failed to start MongoDB:', error.message);
      console.log('\nPlease make sure MongoDB is installed.');
      console.log('You can install MongoDB using Homebrew: brew install mongodb-community');
      return false;
    }
  } else {
    // Linux: Try to start MongoDB with systemctl
    try {
      console.log('Attempting to start MongoDB with systemctl...');
      await execAsync('sudo systemctl start mongod');
      console.log('MongoDB started successfully');
      return true;
    } catch (error) {
      console.error('Failed to start MongoDB:', error.message);
      console.log('\nPlease make sure MongoDB is installed and you have permissions to start it.');
      console.log('You can install MongoDB by following: https://docs.mongodb.com/manual/administration/install-on-linux/');
      return false;
    }
  }
}

async function main() {
  console.log('Checking if MongoDB is running...');
  
  const isRunning = await checkMongoDBRunning();
  
  if (isRunning) {
    console.log('MongoDB is running. Good!');
    process.exit(0);
  } else {
    const started = await startMongoDB();
    
    if (started) {
      console.log('MongoDB is now running.');
      process.exit(0);
    } else {
      console.error('\n⚠️ WARNING: MongoDB could not be started.');
      console.log('The application may not work correctly without MongoDB running.');
      console.log('Please start MongoDB manually and then restart this application.');
      
      // Exit with error code
      process.exit(1);
    }
  }
}

main().catch(error => {
  console.error('Error checking MongoDB status:', error);
  process.exit(1);
}); 