import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

// Neo4j Aura connection
if (!process.env.NEO4J_URI || !process.env.NEO4J_USER || !process.env.NEO4J_PASSWORD) {
  console.error('❌ [knowledge-graph] Missing Neo4j env vars: NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD');
}

const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(process.env.NEO4J_USER || 'neo4j', process.env.NEO4J_PASSWORD || '')
);

// Verify connection
export async function verifyConnection() {
  const session = driver.session();
  try {
    await session.run('RETURN 1');
    console.log('\u2705 Connected to Neo4j Aura');
    return true;
  } catch (error) {
    console.error('\u274C Neo4j connection failed:', error.message);
    return false;
  } finally {
    await session.close();
  }
}

// Run a Cypher query
export async function runQuery(cypher, params = {}) {
  const session = driver.session();
  try {
    const result = await session.run(cypher, params);
    return result.records;
  } finally {
    await session.close();
  }
}

// Run a write transaction
export async function runWrite(cypher, params = {}) {
  const session = driver.session();
  try {
    const result = await session.executeWrite(tx => tx.run(cypher, params));
    return result;
  } finally {
    await session.close();
  }
}

// Keep-alive ping to prevent AuraDB Free from pausing due to inactivity
const KEEP_ALIVE_INTERVAL_MS = 4 * 60 * 60 * 1000; // every 4 hours
let keepAliveTimer = null;

async function neo4jKeepAlive() {
  const session = driver.session();
  try {
    await session.run('RETURN 1');
    console.log(`🏓 [Neo4j keep-alive] Ping OK at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('🏓 [Neo4j keep-alive] Ping failed:', error.message);
  } finally {
    await session.close();
  }
}

export function startKeepAlive() {
  if (keepAliveTimer) return;
  keepAliveTimer = setInterval(neo4jKeepAlive, KEEP_ALIVE_INTERVAL_MS);
  console.log('🏓 [Neo4j keep-alive] Started — pinging every 4 hours');
}

export function stopKeepAlive() {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}

// Close driver on shutdown
export async function closeDriver() {
  stopKeepAlive();
  await driver.close();
}

export default driver;
