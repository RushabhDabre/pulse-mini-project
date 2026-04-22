import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import connectDB from "./db/index.js";
import { httpServer } from "./app.js";


connectDB()
  .then(() => {
    httpServer.listen(process.env.PORT || 5000, () => {
      console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    });
  })
  .catch(() => {
    console.log("MONGO db connection failed !!! ", err);
  });
