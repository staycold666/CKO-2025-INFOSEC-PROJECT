import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// In-memory mock database for testing
class MockDatabase {
  private data: Map<string, Map<string, any>> = new Map();

  // Initialize collections
  constructor() {
    this.data.set('users', new Map());
    this.data.set('rooms', new Map());
    this.data.set('games', new Map());
    console.log('Mock database initialized');
  }

  // Get a collection
  collection(name: string): Map<string, any> {
    if (!this.data.has(name)) {
      this.data.set(name, new Map());
    }
    return this.data.get(name)!;
  }
}

// Global mock database instance
const mockDb = new MockDatabase();

// Define interface for mock model
interface IMockModel {
  _id?: string;
  [key: string]: any;
  save(): Promise<any>;
}

// Mock mongoose model methods
mongoose.model = function(name: string, schema: any): any {
  const collection = mockDb.collection(name.toLowerCase());
  
  return class MockModel implements IMockModel {
    _id?: string;
    [key: string]: any;
    
    static async find(query: any = {}): Promise<any[]> {
      return Array.from(collection.values());
    }
    
    static async findOne(query: any = {}): Promise<any | null> {
      for (const item of collection.values()) {
        let match = true;
        for (const key in query) {
          if (item[key] !== query[key]) {
            match = false;
            break;
          }
        }
        if (match) return item;
      }
      return null;
    }
    
    static async findById(id: string): Promise<any | null> {
      return collection.get(id) || null;
    }
    
    static async create(data: any): Promise<any> {
      const id = data._id || `mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      data._id = id;
      collection.set(id, data);
      return data;
    }
    
    constructor(data: any) {
      Object.assign(this, data);
    }
    
    async save(): Promise<any> {
      const id = this._id || `mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      this._id = id;
      collection.set(id, this);
      return this;
    }
  } as any;
} as any;

// Connect to MongoDB (mock)
export const connectDB = async (): Promise<void> => {
  try {
    console.log('Using mock database for testing');
    console.log('MongoDB connected successfully (mock)');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create a mock connection object
const mockConnection = {
  on: (event: string, callback: Function) => {
    if (event === 'connected') {
      // Call the connected callback immediately
      callback();
    }
    return mockConnection;
  },
  close: async () => {
    console.log('Mock database connection closed');
    return Promise.resolve();
  }
};

// Override mongoose connection methods without directly assigning to the property
Object.defineProperty(mongoose, 'connection', {
  get: () => mockConnection
});

// Close MongoDB connection when Node process ends
process.on('SIGINT', async () => {
  console.log('MongoDB connection closed due to app termination (mock)');
  process.exit(0);
});
