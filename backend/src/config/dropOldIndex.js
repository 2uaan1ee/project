// Script to drop old index from training_programs collection
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function dropOldIndex() {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/quanlene-db";
    await mongoose.connect(mongoUri);
    
    console.log("✅ Connected to MongoDB");
    
    const db = mongoose.connection.db;
    const collection = db.collection("training_programs");
    
    // List all indexes
    const indexes = await collection.indexes();
    console.log("Current indexes:", indexes);
    
    // Drop the old 'code_1' index if it exists
    try {
      await collection.dropIndex("code_1");
      console.log("✅ Dropped old 'code_1' index");
    } catch (err) {
      if (err.codeName === "IndexNotFound") {
        console.log("⚠️ Index 'code_1' not found (already dropped or never existed)");
      } else {
        throw err;
      }
    }
    
    // Optionally, you can also clear the collection if needed
    // await collection.deleteMany({});
    // console.log("✅ Cleared training_programs collection");
    
    console.log("✅ Done! You can now upload training programs.");
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

dropOldIndex();
