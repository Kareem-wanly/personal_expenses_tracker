import { loadEnv } from "../config/env";
import { connect } from "./client";

const connection = await connect(loadEnv().DATABASE_URL);
await connection.migrate();
await connection.close();
console.log("Database is up to date.");
