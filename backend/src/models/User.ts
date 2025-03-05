import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { IUser } from '../types';

// User stats schema
const userStatsSchema = new mongoose.Schema({
  wins: {
    type: Number,
    default: 0
  },
  losses: {
    type: Number,
    default: 0
  },
  totalGames: {
    type: Number,
    default: 0
  },
  totalScore: {
    type: Number,
    default: 0
  },
  accuracy: {
    type: Number,
    default: 0
  }
});

// User schema
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters']
    },
    avatar: {
      type: String,
      default: ''
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    stats: {
      type: userStatsSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Create model
const User = mongoose.model<IUser>('User', userSchema);

export default User;